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
            } else if (tx.type === 'purchase') {
              purchasesByParty.set(tx.partyId, (purchasesByParty.get(tx.partyId) || 0) + tx.netAmount);
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
      if (fs.existsSync(outPath)) {
        const { outstandings, report } = await ErpAdapter.ingestOutstanding(outPath);
        await outstandingRepository.saveBatch(outstandings);
        reports.push(report);

        // Link outstanding to businesses
        for (const out of outstandings) {
          const b = await businessRepository.findById(out.businessId);
          if (b) {
            b.currentOutstanding = out.totalOutstanding;
            await businessRepository.save(b);
          }
        }

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
