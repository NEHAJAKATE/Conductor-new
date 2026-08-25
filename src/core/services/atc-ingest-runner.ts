import path from 'path';
import fs from 'fs';
import { ErpAdapter, IngestReport } from '../adapters/erp-adapter';
import { businessRepository } from '@/infrastructure/repositories/business-repository';
import {
  transactionRepository,
  inventoryRepository,
  outstandingRepository,
} from '@/infrastructure/repositories/canonical-repositories';
import { schedulerService } from '../scheduler/scheduler.service';

import { CanonicalMappingService } from '../mapping/canonical-mapping.service';

export interface OutstandingMatchBreakdown {
  totalRows: number;
  directCanonicalId: number;
  ledgerNameMatch: number;
  displayNameFallback: number;
  ambiguousCollisions: number;
  duplicateWritesPrevented: number;
  internalAdjustmentsCount: number;
  internalAdjustmentsTotal: number;
  notFound: number;
  matchRatePercent: number;
  businessesNeedingReviewCount: number;
}

export interface InternalAdjustmentRecord {
  businessName: string;
  totalOutstanding: number;
  category: string;
  matchedBusinessId?: string;
}

export interface UnmatchedOutstandingRecord {
  businessId: string;
  businessName: string;
  totalOutstanding: number;
  riskLevel: string;
  reason: string;
  matchType: 'UNMATCHED' | 'AMBIGUOUS';
  candidateIds?: string[];
}

export interface AtcIngestionSummary {
  status: 'COMPLETED' | 'FAILED';
  totalDurationMs: number;
  datasets: IngestReport[];
  totals: {
    partiesLoaded: number;
    transactionsLoaded: number;
    outstandingAccountsLoaded: number;
    inventorySkusLoaded: number;
  };
  unmatchedOutstanding?: UnmatchedOutstandingRecord[];
  internalAdjustments?: InternalAdjustmentRecord[];
  outstandingMatchBreakdown?: OutstandingMatchBreakdown;
}

export class AtcIngestRunner {
  private static isRunning = false;
  private static isInitialized = false;

  static async runFullAtcIngestion(force = false): Promise<AtcIngestionSummary> {
    const currentTxCount = (await transactionRepository.list({ limit: 1 })).total;
    if (this.isInitialized && !force && currentTxCount > 0) {
      const bCount = await businessRepository.count();
      const txRes = await transactionRepository.list({ limit: 1 });
      const invList = await inventoryRepository.list();
      const outList = await outstandingRepository.list();

      return {
        status: 'COMPLETED',
        totalDurationMs: 0,
        datasets: [],
        totals: {
          partiesLoaded: bCount,
          transactionsLoaded: txRes.total,
          outstandingAccountsLoaded: outList.length,
          inventorySkusLoaded: invList.length,
        },
      };
    }

    if (this.isRunning) {
      // Wait or return current stats
      await new Promise(r => setTimeout(r, 1000));
    }

    this.isRunning = true;
    const startTime = Date.now();
    const reports: IngestReport[] = [];

    try {
      const dataDir = path.resolve(process.cwd(), 'data', 'atc_sample_data');

      // 1. Party Master Ingestion
      const partyPath = path.join(dataDir, 'partymASTER.xls');
      if (fs.existsSync(partyPath)) {
        const { businesses, report } = await ErpAdapter.ingestPartyMaster(partyPath);
        for (const b of businesses) {
          await businessRepository.save(b);
        }
        reports.push(report);
        await schedulerService.recordExecution('job-atc-party-master', {
          status: 'SUCCESS',
          durationMs: report.durationMs,
          recordsProcessed: report.acceptedRecords,
          recordsRejected: report.rejectedRecords,
        });
      }

      // 2. Sales & Purchases Journal Ingestion
      const journalPath = path.join(dataDir, 'date_wise_sale_&_purchase_analysis.csv');
      if (fs.existsSync(journalPath)) {
        const { transactions, report } = await ErpAdapter.ingestJournal(journalPath);
        await transactionRepository.saveBatch(transactions);
        reports.push(report);

        // Update Party Sales and Purchases aggregations
        const salesByParty = new Map<string, number>();
        const purchasesByParty = new Map<string, number>();

        transactions.forEach(tx => {
          if (tx.partyId) {
            if (tx.type === 'sale') {
              salesByParty.set(tx.partyId, (salesByParty.get(tx.partyId) || 0) + tx.netAmount);
            } else if (tx.type === 'sale_return') {
              salesByParty.set(tx.partyId, (salesByParty.get(tx.partyId) || 0) - tx.netAmount);
            } else if (tx.type === 'purchase') {
              purchasesByParty.set(tx.partyId, (purchasesByParty.get(tx.partyId) || 0) + tx.netAmount);
            } else if (tx.type === 'purchase_return') {
              purchasesByParty.set(tx.partyId, (purchasesByParty.get(tx.partyId) || 0) - tx.netAmount);
            }
          }
        });

        for (const [partyId, sales] of Array.from(salesByParty.entries())) {
          const b = await businessRepository.findById(partyId);
          if (b) {
            b.totalSales = (b.totalSales || 0) + sales;
            await businessRepository.save(b);
          }
        }

        for (const [partyId, purchases] of Array.from(purchasesByParty.entries())) {
          const b = await businessRepository.findById(partyId);
          if (b) {
            b.totalPurchases = (b.totalPurchases || 0) + purchases;
            await businessRepository.save(b);
          }
        }

        await schedulerService.recordExecution('job-atc-erp-daily', {
          status: 'SUCCESS',
          durationMs: report.durationMs,
          recordsProcessed: report.acceptedRecords,
          recordsRejected: report.rejectedRecords,
        });
      }

      // 3. Outstanding / Ageing Ingestion
      const outPath = path.join(dataDir, 'OUTSTANDING LEDGER.xls');
      const unmatchedOutstanding: UnmatchedOutstandingRecord[] = [];
      const internalAdjustments: InternalAdjustmentRecord[] = [];
      let matchBreakdown: OutstandingMatchBreakdown | undefined;

      if (fs.existsSync(outPath)) {
        const { outstandings, report } = await ErpAdapter.ingestOutstanding(outPath);
        await outstandingRepository.saveBatch(outstandings);
        reports.push(report);

        // Component 5: Duplicate-write protection within a single ingestion run
        const matchedThisRun = new Map<string, number>(); // businessId -> count of writes this run

        let directCanonicalCount = 0;
        let ledgerNameCount = 0;
        let displayNameCount = 0;
        let ambiguousCount = 0;
        let duplicateWriteCount = 0;
        let notFoundCount = 0;

        for (const out of outstandings) {
          const isInternal = CanonicalMappingService.isInternalAccount(out.businessName);
          if (isInternal) {
            internalAdjustments.push({
              businessName: out.businessName,
              totalOutstanding: out.totalOutstanding,
              category: 'INTERNAL_ACCOUNT_ADJUSTMENT',
            });
          }

          // 1. Primary: Deterministic canonical ID exact match
          let matchedBusiness = await businessRepository.findById(out.businessId);
          let matchType: 'DIRECT_CANONICAL_ID' | 'LEDGER_NAME_MATCH' | 'DISPLAY_NAME_FALLBACK' | null = null;
          let matchConfidence = 0;

          if (matchedBusiness) {
            matchType = 'DIRECT_CANONICAL_ID';
            matchConfidence = 100;
          } else {
            // 2. Fallback: Ledger-name primary match & display-name fallback
            const lookup = await businessRepository.findByName(out.businessName);
            if (lookup.status === 'LEDGER_MATCH' && lookup.business) {
              matchedBusiness = lookup.business;
              matchType = 'LEDGER_NAME_MATCH';
              matchConfidence = 95;
            } else if (lookup.status === 'DISPLAY_NAME_MATCH' && lookup.business) {
              matchedBusiness = lookup.business;
              matchType = 'DISPLAY_NAME_FALLBACK';
              matchConfidence = 70;
            } else if (lookup.status === 'AMBIGUOUS' && lookup.candidates) {
              ambiguousCount++;
              console.warn(
                `[AtcIngestRunner] Ambiguous outstanding match for '${out.businessName}'. Candidates: ${lookup.candidates.map(c => c.id).join(', ')}`
              );
              unmatchedOutstanding.push({
                businessId: out.businessId,
                businessName: out.businessName,
                totalOutstanding: out.totalOutstanding,
                riskLevel: out.riskLevel,
                reason: `Ambiguous match: multiple business entities (${lookup.candidates.map(c => c.id).join(', ')}) share this ledger/name.`,
                matchType: 'AMBIGUOUS',
                candidateIds: lookup.candidates.map(c => c.id),
              });
              continue;
            } else {
              notFoundCount++;
              console.warn(
                `[AtcIngestRunner] Unmatched outstanding record: '${out.businessName}' (ID: ${out.businessId}, Outstanding: ₹${out.totalOutstanding}, Risk: ${out.riskLevel}) could not be linked to any Business entity.`
              );
              unmatchedOutstanding.push({
                businessId: out.businessId,
                businessName: out.businessName,
                totalOutstanding: out.totalOutstanding,
                riskLevel: out.riskLevel,
                reason: 'No matching business entity found by canonical ID, ledger name, or display name.',
                matchType: 'UNMATCHED',
              });
              continue;
            }
          }

          // Duplicate-write protection guard (Component 5)
          if (matchedBusiness && matchType) {
            const priorWrites = matchedThisRun.get(matchedBusiness.id) || 0;
            if (priorWrites > 0) {
              duplicateWriteCount++;
              console.warn(
                `[AtcIngestRunner] Business '${matchedBusiness.id}' already matched ` +
                `${priorWrites}x this run. Refusing silent overwrite for '${out.businessName}' ` +
                `(₹${out.totalOutstanding}).`
              );
              unmatchedOutstanding.push({
                businessId: matchedBusiness.id,
                businessName: out.businessName,
                totalOutstanding: out.totalOutstanding,
                riskLevel: out.riskLevel,
                reason: `Duplicate write: business already received an outstanding value ` +
                        `this run (${priorWrites} prior write(s)). Needs manual reconciliation ` +
                        `— may indicate two ledger sub-entries for one real business, or a ` +
                        `genuine ledger-name collision not caught by entity-level ambiguity check.`,
                matchType: 'AMBIGUOUS',
                candidateIds: [matchedBusiness.id],
              });
              matchedThisRun.set(matchedBusiness.id, priorWrites + 1);
              continue; // do NOT overwrite
            }

            // First write this run — proceed and record
            if (matchType === 'DIRECT_CANONICAL_ID') directCanonicalCount++;
            else if (matchType === 'LEDGER_NAME_MATCH') ledgerNameCount++;
            else if (matchType === 'DISPLAY_NAME_FALLBACK') displayNameCount++;

            matchedBusiness.currentOutstanding = out.totalOutstanding;
            matchedBusiness.outstandingMatchType = matchType;
            matchedBusiness.outstandingMatchConfidence = matchConfidence;
            matchedBusiness.outstandingMatchedAt = new Date().toISOString();
            await businessRepository.save(matchedBusiness);
            matchedThisRun.set(matchedBusiness.id, 1);
          }
        }

        const totalSuccessful = directCanonicalCount + ledgerNameCount + displayNameCount;
        const matchRatePercent = outstandings.length > 0
          ? Math.round((totalSuccessful / outstandings.length) * 1000) / 10
          : 0;

        const allBusinesses = await businessRepository.list();
        const businessesNeedingReviewCount = allBusinesses.filter(b => b.needsReview).length;
        const internalAdjustmentsTotal = internalAdjustments.reduce((acc, r) => acc + r.totalOutstanding, 0);

        matchBreakdown = {
          totalRows: outstandings.length,
          directCanonicalId: directCanonicalCount,
          ledgerNameMatch: ledgerNameCount,
          displayNameFallback: displayNameCount,
          ambiguousCollisions: ambiguousCount,
          duplicateWritesPrevented: duplicateWriteCount,
          internalAdjustmentsCount: internalAdjustments.length,
          internalAdjustmentsTotal,
          notFound: notFoundCount,
          matchRatePercent,
          businessesNeedingReviewCount,
        };

        console.log('\n=====================================================================');
        console.log('       OUTSTANDING MATCH BREAKDOWN (GROUND TRUTH VERIFICATION)       ');
        console.log('=====================================================================');
        console.log(`  Total Outstanding Rows Ingested : ${outstandings.length}`);
        console.log(`  - DIRECT_CANONICAL_ID (100% conf): ${directCanonicalCount}`);
        console.log(`  - LEDGER_NAME_MATCH   ( 95% conf): ${ledgerNameCount}`);
        console.log(`  - DISPLAY_NAME_FALLBACK(70% conf): ${displayNameCount}`);
        console.log(`  - AMBIGUOUS_COLLISIONS (Flagged) : ${ambiguousCount}`);
        console.log(`  - DUPLICATE_WRITES_PREVENTED     : ${duplicateWriteCount}`);
        console.log(`  - INTERNAL_ADJUSTMENTS_FILTERED  : ${internalAdjustments.length} (Total: ₹${internalAdjustmentsTotal.toLocaleString()})`);
        console.log(`  - NOT_FOUND            (Flagged) : ${notFoundCount}`);
        console.log(`  - BUSINESSES_NEEDING_REVIEW (GSTIN): ${businessesNeedingReviewCount}`);
        console.log(`  -------------------------------------------------------------------`);
        console.log(`  TOTAL MATCHED RATE               : ${matchRatePercent}% (${totalSuccessful}/${outstandings.length})`);
        console.log(`  TOTAL UNMATCHED / FLAGGED        : ${unmatchedOutstanding.length}`);
        console.log('=====================================================================\n');

        await schedulerService.recordExecution('job-atc-outstanding', {
          status: 'SUCCESS',
          durationMs: report.durationMs,
          recordsProcessed: report.acceptedRecords,
          recordsRejected: report.rejectedRecords,
        });
      }

      // 4. Opening Stock Inventory Ingestion
      const stockPath = path.join(dataDir, 'OPENING STOCK.XLS');
      if (fs.existsSync(stockPath)) {
        const { inventory, report } = await ErpAdapter.ingestStock(stockPath);
        await inventoryRepository.saveBatch(inventory);
        reports.push(report);

        await schedulerService.recordExecution('job-atc-inventory', {
          status: 'SUCCESS',
          durationMs: report.durationMs,
          recordsProcessed: report.acceptedRecords,
          recordsRejected: report.rejectedRecords,
        });
      }

      // 5. Bank & Cash Ledger Ingestion & Reconciliation
      const bankPath = path.join(dataDir, 'BANK & CASH LEDGERS.XLS');
      let bankLinesCount = 0;
      if (fs.existsSync(bankPath)) {
        const bankStart = Date.now();
        const buffer = await fs.promises.readFile(bankPath);
        const { BankReconciliationService } = await import('@/core/reconciliation/bank-reconciliation.service');
        const bankRows = BankReconciliationService.parseBankLedgerFile(buffer);
        bankLinesCount = bankRows.length;

        reports.push({
          sourceFile: 'BANK & CASH LEDGERS.XLS',
          sourceDomain: 'bank_cash_ledgers',
          totalRecords: bankRows.length,
          acceptedRecords: bankRows.length,
          rejectedRecords: 0,
          warningCount: 0,
          durationMs: Date.now() - bankStart,
        });

        await schedulerService.recordExecution('job-atc-bank-recon', {
          status: 'SUCCESS',
          durationMs: Date.now() - bankStart,
          recordsProcessed: bankRows.length,
          recordsRejected: 0,
        });
      }

      this.isInitialized = true;
      const totalDurationMs = Date.now() - startTime;

      const partiesLoaded = await businessRepository.count();
      const txRes = await transactionRepository.list({ limit: 1 });
      const outList = await outstandingRepository.list();
      const invList = await inventoryRepository.list();

      return {
        status: 'COMPLETED',
        totalDurationMs,
        datasets: reports,
        totals: {
          partiesLoaded,
          transactionsLoaded: txRes.total,
          outstandingAccountsLoaded: outList.length,
          inventorySkusLoaded: invList.length,
        },
        unmatchedOutstanding,
        internalAdjustments,
        outstandingMatchBreakdown: matchBreakdown,
      };
    } catch (error) {
      console.error('[AtcIngestRunner] Ingestion error:', error);
      return {
        status: 'FAILED',
        totalDurationMs: Date.now() - startTime,
        datasets: reports,
        totals: {
          partiesLoaded: 0,
          transactionsLoaded: 0,
          outstandingAccountsLoaded: 0,
          inventorySkusLoaded: 0,
        },
      };
    } finally {
      this.isRunning = false;
    }
  }
}
