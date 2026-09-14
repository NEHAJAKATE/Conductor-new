/**
 * Bank & Cash Ledger Reconciliation Engine
 * Deterministic, evidence-based BRS matching engine adhering to enterprise accounting standards.
 */

import path from 'path';
import fs from 'fs';
import { ParserFactory } from '@/core/parser/parser-factory';
import { CanonicalMappingService } from '@/core/mapping/canonical-mapping.service';
import { TransactionEntity } from '@/core/domain/canonical-models';
import { transactionRepository } from '@/infrastructure/repositories/canonical-repositories';
import { 
  ReconciliationConfig, 
  DEFAULT_RECONCILIATION_CONFIG,
  ConfidenceLevel 
} from './reconciliation-config';
import { 
  ReconciliationNormalizer, 
  NormalizedBankTransaction, 
  NormalizedErpTransaction, 
  BusinessClassification 
} from './reconciliation-normalizer';
import { 
  ReconciliationDataQualityService, 
  DataQualityReport 
} from './reconciliation-data-quality.service';

export type BankMatchStatus = 
  | 'MATCHED' 
  | 'MATCHED_MULTI_REFERENCE'
  | 'PARTIAL_REFERENCE_RESOLUTION'
  | 'AMOUNT_MISMATCH' 
  | 'MULTI_REFERENCE_AMOUNT_MISMATCH'
  | 'REFERENCE_DATE_CONFLICT'
  | 'AMBIGUOUS'
  | 'UNMATCHED_BANK'
  | 'DUPLICATE_BANK_ENTRY'
  | 'SPECIAL_ITEM';

export type BankMatchMethod = 
  | 'SPECIAL_ITEM'
  | 'REFERENCE_EXACT' 
  | 'MULTI_REFERENCE_AGGREGATE'
  | 'PARTY_AND_AMOUNT' 
  | 'AMOUNT_ONLY' 
  | 'MANUAL'
  | 'UNMATCHED';

export interface MatchedTransactionSummary {
  id: string;
  invoiceId: string;
  partyName: string;
  date: string;
  grossAmount: number;
  type: string;
  debitCredit: string;
}

export interface BankReconciliationItem {
  id: string;
  bankRow: NormalizedBankTransaction;
  matchedTransaction?: MatchedTransactionSummary; // Single match
  matchedTransactions: MatchedTransactionSummary[]; // Multi-reference matches
  matchStatus: BankMatchStatus;
  matchMethod: BankMatchMethod;
  classification: BusinessClassification;
  variance: number;
  confidenceLevel: ConfidenceLevel;
  matchConfidence: number; // numeric percentage for backwards compatibility
  reviewRequired: boolean;
  dateDifferenceDays?: number;
  aggregateErpAmount?: number;
  resolvedReferenceCount?: number;
  totalReferenceCount?: number;
  unresolvedReferences?: string[];
  notes: string;
  explanation: string;
}

export interface BankReconciliationSummary {
  bankAccount: string;
  totalRawBankEntries: number;
  totalCanonicalBankEntries: number;
  totalDuplicateBankEntries: number;
  totalReceiptAmount: number;
  totalPaymentAmount: number;
  closingBankBalance: number;
  
  // Categorized counts
  matchedCount: number;
  matchedAmount: number;
  multiReferenceMatchedCount: number;
  partialReferenceResolutionCount: number;
  amountMismatchCount: number;
  dateConflictCount: number;
  specialItemCount: number;
  ambiguousCount: number;
  unmatchedCount: number;
  unmatchedAmount: number;
  mismatchCount: number;
  mismatchAmount: number;

  consumedErpVoucherCount: number;
  reusedErpVoucherCount: number;

  dataQuality: DataQualityReport;
  items: BankReconciliationItem[];
  generatedAt: string;
}

export class BankReconciliationService {
  /**
   * Helper to calculate day difference between two YYYY-MM-DD strings
   */
  public static calculateDateDifference(d1: string, d2: string): number {
    try {
      const t1 = new Date(d1).getTime();
      const t2 = new Date(d2).getTime();
      return Math.round((t1 - t2) / (1000 * 60 * 60 * 24));
    } catch {
      return 0;
    }
  }

  /**
   * Parses the Marg ERP multi-account bank & cash ledger XLS file into NormalizedBankTransaction records
   */
  public static parseBankLedgerFile(buffer: Buffer, config: ReconciliationConfig = DEFAULT_RECONCILIATION_CONFIG): NormalizedBankTransaction[] {
    const parsed = ParserFactory.parse(buffer, '.xls');
    const rows = parsed.rows;
    const normalizer = new ReconciliationNormalizer(config);
    const records: NormalizedBankTransaction[] = [];

    let currentAccount = 'DEFAULT BANK';
    let lastDate = '2001-04-01';

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const col0 = String(row[0] || '').trim();
      const col1 = String(row[1] || '').trim();
      const col2 = String(row[2] || '').trim();
      const receiptStr = String(row[5] || row[4] || '').trim();
      const paymentStr = String(row[6] || row[5] || '').trim();
      const balanceStr = String(row[7] || row[6] || '').trim();

      // Check for ledger header
      if (col0.toLowerCase().includes('ledger account') || col0.toLowerCase().includes('bank of') || col0.toLowerCase().includes('axis bank') || col0.toLowerCase().includes('cash')) {
        const cleanName = col0.replace(/ledger account\s*:\s*/gi, '').trim();
        if (cleanName) {
          currentAccount = cleanName;
        }
        continue;
      }

      if (col0 === 'TOTAL' || col0.includes('TOTAL') || col0.startsWith('20027805111')) {
        continue;
      }

      const receipt = parseFloat(receiptStr.replace(/,/g, '')) || 0;
      const payment = parseFloat(paymentStr.replace(/,/g, '')) || 0;
      const balance = parseFloat(balanceStr.replace(/,/g, '')) || 0;

      if (receipt === 0 && payment === 0 && !col2.toLowerCase().includes('opening balance')) {
        continue;
      }

      if (col0 && col0.length > 2) {
        lastDate = CanonicalMappingService.parseDate(col0);
      }

      const particulars = [col2, row[3], row[4]].filter(Boolean).map(s => String(s).trim()).join(' ');

      let type: 'RECEIPT' | 'PAYMENT' | 'OPENING' = 'RECEIPT';
      let amount = receipt;
      if (payment > 0) {
        type = 'PAYMENT';
        amount = payment;
      } else if (particulars.toLowerCase().includes('opening balance')) {
        type = 'OPENING';
        amount = balance;
      }

      const rawRow = {
        id: `bank_${currentAccount.replace(/[^a-z0-9]/gi, '_')}_${i}_${Date.now()}`,
        bankAccount: currentAccount,
        date: lastDate,
        voucherNo: col1 || undefined,
        particulars,
        type,
        amount: Math.abs(amount),
        balance,
        sourceRowNumber: i + 1,
      };

      records.push(normalizer.normalizeBankRow(rawRow));
    }

    return records;
  }

  /**
   * Runs the automated, deterministic 5-stage BRS reconciliation engine
   */
  public static async reconcile(params: {
    bankRows?: NormalizedBankTransaction[];
    accountFilter?: string;
    config?: Partial<ReconciliationConfig>;
  } = {}): Promise<BankReconciliationSummary> {
    const config: ReconciliationConfig = {
      ...DEFAULT_RECONCILIATION_CONFIG,
      ...(params.config || {}),
    };

    const normalizer = new ReconciliationNormalizer(config);
    let bankRows = params.bankRows;

    if (!bankRows || bankRows.length === 0) {
      const bankFilePath = path.resolve(process.cwd(), 'data', 'atc_sample_data', 'BANK & CASH LEDGERS.XLS');
      if (fs.existsSync(bankFilePath)) {
        const buffer = await fs.promises.readFile(bankFilePath);
        bankRows = this.parseBankLedgerFile(buffer, config);
      } else {
        bankRows = [];
      }
    }

    if (params.accountFilter) {
      const filter = params.accountFilter.toLowerCase();
      bankRows = bankRows.filter(r => r.bankAccount.toLowerCase().includes(filter));
    }

    const allRawTransactions = await transactionRepository.getAll();
    const normalizedErpTransactions: NormalizedErpTransaction[] = allRawTransactions.map(tx => 
      normalizer.normalizeErpTransaction(tx)
    );

    // =========================================================================
    // STAGE 1: DATA QUALITY GATE & DUPLICATE ISOLATION
    // =========================================================================
    const { 
      canonicalBankTransactions, 
      duplicateBankTransactions, 
      qualityReport 
    } = ReconciliationDataQualityService.validateAndIsolateDuplicates(bankRows, normalizedErpTransactions);

    // Index ERP transactions for fast deterministic lookup
    const erpByVoucherNumber = new Map<string, NormalizedErpTransaction[]>();
    const erpByRoundedAmount = new Map<number, NormalizedErpTransaction[]>();

    for (const erp of normalizedErpTransactions) {
      if (erp.voucherNumber) {
        const key = erp.voucherNumber.toUpperCase().trim();
        const existing = erpByVoucherNumber.get(key) || [];
        existing.push(erp);
        erpByVoucherNumber.set(key, existing);
      }
      const roundedAmt = Math.round(erp.amount);
      const existingAmts = erpByRoundedAmount.get(roundedAmt) || [];
      existingAmts.push(erp);
      erpByRoundedAmount.set(roundedAmt, existingAmts);
    }

    let totalReceiptAmount = 0;
    let totalPaymentAmount = 0;
    let closingBankBalance = 0;
    
    let matchedCount = 0;
    let matchedAmount = 0;
    let multiReferenceMatchedCount = 0;
    let partialReferenceResolutionCount = 0;
    let amountMismatchCount = 0;
    let dateConflictCount = 0;
    let specialItemCount = 0;
    let ambiguousCount = 0;
    let unmatchedCount = 0;
    let unmatchedAmount = 0;
    let mismatchCount = 0;
    let mismatchAmount = 0;

    const reconciledItems: BankReconciliationItem[] = [];
    const usedErpIds = new Set<string>();

    // First, process isolated duplicate bank rows immediately
    for (const dupRow of duplicateBankTransactions) {
      if (dupRow.transactionType === 'RECEIPT') totalReceiptAmount += dupRow.amount;
      if (dupRow.transactionType === 'PAYMENT') totalPaymentAmount += dupRow.amount;

      reconciledItems.push({
        id: `recon_${dupRow.bankTransactionId}`,
        bankRow: dupRow,
        matchedTransactions: [],
        matchStatus: 'DUPLICATE_BANK_ENTRY',
        matchMethod: 'UNMATCHED',
        classification: dupRow.businessClassification,
        variance: 0,
        confidenceLevel: 'NONE',
        matchConfidence: 0,
        reviewRequired: true,
        notes: `Duplicate bank entry detected (Group #${dupRow.duplicateGroupId}).`,
        explanation: `Exact duplicate entry of another bank statement row. Isolated from BRS matching to prevent double-counting or double-consuming ERP vouchers.`,
      });
    }

    // Process canonical bank transactions through the 5-stage pipeline
    for (const bankRow of canonicalBankTransactions) {
      if (bankRow.transactionType === 'RECEIPT') totalReceiptAmount += bankRow.amount;
      if (bankRow.transactionType === 'PAYMENT') totalPaymentAmount += bankRow.amount;
      closingBankBalance = bankRow.balance;

      let matchStatus: BankMatchStatus = 'UNMATCHED_BANK';
      let matchMethod: BankMatchMethod = 'UNMATCHED';
      let confidenceLevel: ConfidenceLevel = 'NONE';
      let matchConfidence = 0;
      let reviewRequired = false;
      let variance = 0;
      let dateDiffDays: number | undefined;
      let aggregateErpAmount: number | undefined;
      let resolvedRefCount: number | undefined;
      let totalRefCount: number | undefined;
      let unresolvedRefs: string[] | undefined;
      let matchedList: MatchedTransactionSummary[] = [];
      let notes = '';
      let explanation = '';

      const classification: BusinessClassification = bankRow.businessClassification || 'UNKNOWN';

      // =========================================================================
      // STAGE 2: SPECIAL ITEM PRE-CLASSIFICATION (Opening/Closing, Charges, Taxes)
      // =========================================================================
      if (classification === 'OPENING_BALANCE' || classification === 'CLOSING_BALANCE') {
        matchStatus = 'SPECIAL_ITEM';
        matchMethod = 'SPECIAL_ITEM';
        confidenceLevel = 'HIGH';
        matchConfidence = 100;
        reviewRequired = false;
        specialItemCount++;
        notes = `${classification === 'OPENING_BALANCE' ? 'Opening' : 'Closing'} balance entry in bank ledger.`;
        explanation = `Classified as ${classification}. Opening/closing balances represent equity ledger carry-forwards and must never be matched against commercial customer/vendor invoices.`;

        reconciledItems.push({
          id: `recon_${bankRow.bankTransactionId}`,
          bankRow,
          matchedTransactions: [],
          matchStatus,
          matchMethod,
          classification,
          variance: 0,
          confidenceLevel,
          matchConfidence,
          reviewRequired,
          notes,
          explanation,
        });
        continue;
      }

      if (['BANK_CHARGE', 'TAX', 'INTEREST', 'INVESTMENT', 'TRANSFER', 'CASH_TRANSACTION'].includes(classification)) {
        if (bankRow.extractedReferences.length === 0) {
          matchStatus = 'SPECIAL_ITEM';
          matchMethod = 'SPECIAL_ITEM';
          confidenceLevel = 'HIGH';
          matchConfidence = 100;
          reviewRequired = false;
          specialItemCount++;
          notes = `Non-invoice banking entry: ${classification}.`;
          explanation = `Identified as ${classification} (${bankRow.classificationEvidence || 'rule-based pattern'}). Recommended for direct bank charge/tax ledger allocation.`;

          reconciledItems.push({
            id: `recon_${bankRow.bankTransactionId}`,
            bankRow,
            matchedTransactions: [],
            matchStatus,
            matchMethod,
            classification,
            variance: 0,
            confidenceLevel,
            matchConfidence,
            reviewRequired,
            notes,
            explanation,
          });
          continue;
        }
      }

      // =========================================================================
      // STAGE 3: MULTI-REFERENCE AGGREGATION & PARTIAL RESOLUTION
      // =========================================================================
      if (bankRow.extractedReferences.length > 1) {
        totalRefCount = bankRow.extractedReferences.length;
        const resolvedCandidates: NormalizedErpTransaction[] = [];
        const missingRefs: string[] = [];
        let netAggregateErp = 0;

        for (const ref of bankRow.extractedReferences) {
          const candidates = erpByVoucherNumber.get(ref) || [];
          const candidate = candidates.find(c => !usedErpIds.has(c.erpTransactionId));
          if (candidate) {
            resolvedCandidates.push(candidate);
            if (candidate.voucherType === 'sale_return' || candidate.voucherNumber.startsWith('CN')) {
              netAggregateErp -= candidate.amount;
            } else {
              netAggregateErp += candidate.amount;
            }
          } else {
            missingRefs.push(ref);
          }
        }

        resolvedRefCount = resolvedCandidates.length;
        unresolvedRefs = missingRefs;

        if (resolvedCandidates.length > 0) {
          aggregateErpAmount = Math.round(netAggregateErp * 100) / 100;
          variance = Math.round((bankRow.amount - Math.abs(netAggregateErp)) * 100) / 100;

          matchedList = resolvedCandidates.map(c => ({
            id: c.erpTransactionId,
            invoiceId: c.voucherNumber,
            partyName: c.partyName,
            date: c.voucherDate,
            grossAmount: c.amount,
            type: c.voucherType,
            debitCredit: c.debitCredit,
          }));

          const resolvedStr = resolvedCandidates.map(c => `#${c.voucherNumber}`).join(', ');

          // If ALL references resolved
          if (resolvedCandidates.length === bankRow.extractedReferences.length) {
            if (Math.abs(variance) <= config.amountTolerance) {
              matchStatus = 'MATCHED_MULTI_REFERENCE';
              matchMethod = 'MULTI_REFERENCE_AGGREGATE';
              confidenceLevel = 'HIGH';
              matchConfidence = 96;
              reviewRequired = false;
              resolvedCandidates.forEach(c => usedErpIds.add(c.erpTransactionId));
              matchedCount++;
              multiReferenceMatchedCount++;
              matchedAmount += bankRow.amount;
              notes = `Multi-reference aggregate match across all ${resolvedCandidates.length} vouchers (${resolvedStr}).`;
              explanation = `All ${resolvedCandidates.length} references resolved in ERP. Aggregate ERP sum ₹${aggregateErpAmount.toLocaleString()} matches consolidated bank amount ₹${bankRow.amount.toLocaleString()} within ₹${Math.abs(variance).toFixed(2)} tolerance.`;
            } else {
              matchStatus = 'MULTI_REFERENCE_AMOUNT_MISMATCH';
              matchMethod = 'MULTI_REFERENCE_AGGREGATE';
              confidenceLevel = 'REVIEW';
              matchConfidence = 60;
              reviewRequired = true;
              mismatchCount++;
              amountMismatchCount++;
              mismatchAmount += Math.abs(variance);
              notes = `All ${resolvedCandidates.length} references resolved, but aggregate amount differs by ₹${Math.abs(variance).toLocaleString()}.`;
              explanation = `All ${resolvedCandidates.length} references resolved in ERP (${resolvedStr}), but aggregate ERP sum ₹${aggregateErpAmount.toLocaleString()} differs from bank amount ₹${bankRow.amount.toLocaleString()} by ₹${Math.abs(variance).toLocaleString()}.`;
            }
          } else {
            // SOME references resolved (Partial Resolution)
            matchStatus = 'PARTIAL_REFERENCE_RESOLUTION';
            matchMethod = 'MULTI_REFERENCE_AGGREGATE';
            confidenceLevel = 'REVIEW';
            matchConfidence = 65;
            reviewRequired = true;
            partialReferenceResolutionCount++;
            mismatchCount++;
            mismatchAmount += Math.abs(variance);
            notes = `Partial reference resolution: ${resolvedCandidates.length}/${bankRow.extractedReferences.length} vouchers resolved.`;
            explanation = `Resolved ${resolvedCandidates.length} of ${bankRow.extractedReferences.length} references in narration (${resolvedStr}). Resolved ERP amount is ₹${aggregateErpAmount.toLocaleString()} vs bank amount ₹${bankRow.amount.toLocaleString()} (Unresolved references: ${missingRefs.join(', ')}, Remaining variance: ₹${Math.abs(variance).toLocaleString()}).`;
          }
        }
      }

      // =========================================================================
      // STAGE 4: SINGLE EXACT REFERENCE MATCH (with Date Gating & Variance)
      // =========================================================================
      if (matchStatus === 'UNMATCHED_BANK' && bankRow.extractedReferences.length === 1) {
        const ref = bankRow.extractedReferences[0];
        const candidates = erpByVoucherNumber.get(ref) || [];
        const candidate = candidates.find(c => !usedErpIds.has(c.erpTransactionId));

        if (candidate) {
          variance = Math.round((bankRow.amount - candidate.amount) * 100) / 100;
          dateDiffDays = BankReconciliationService.calculateDateDifference(bankRow.transactionDate, candidate.voucherDate);

          const summary: MatchedTransactionSummary = {
            id: candidate.erpTransactionId,
            invoiceId: candidate.voucherNumber,
            partyName: candidate.partyName,
            date: candidate.voucherDate,
            grossAmount: candidate.amount,
            type: candidate.voucherType,
            debitCredit: candidate.debitCredit,
          };
          matchedList.push(summary);

          // CRITICAL DATE GATE: Check if date difference exceeds permitted window (±30 days)
          if (Math.abs(dateDiffDays) > config.exactReferenceDateToleranceDays) {
            matchStatus = 'REFERENCE_DATE_CONFLICT';
            matchMethod = 'REFERENCE_EXACT';
            confidenceLevel = 'REVIEW';
            matchConfidence = 50;
            reviewRequired = true;
            dateConflictCount++;
            notes = `Date conflict: Voucher #${candidate.voucherNumber} differs by ${Math.abs(dateDiffDays)} days.`;
            explanation = `Exact voucher reference #${candidate.voucherNumber} found in ERP, but transaction dates differ by ${Math.abs(dateDiffDays)} days (Bank: ${bankRow.transactionDate} vs ERP: ${candidate.voucherDate}), exceeding permitted ±${config.exactReferenceDateToleranceDays}d window. Manual review required.`;
          } else if (Math.abs(variance) <= config.amountTolerance) {
            // High Confidence Match
            matchStatus = 'MATCHED';
            matchMethod = 'REFERENCE_EXACT';
            confidenceLevel = 'HIGH';
            matchConfidence = 98;
            reviewRequired = false;
            usedErpIds.add(candidate.erpTransactionId);
            matchedCount++;
            matchedAmount += bankRow.amount;
            notes = `Exact reference #${candidate.voucherNumber} matched within tolerance.`;
            explanation = `Exact voucher reference #${candidate.voucherNumber} matched. Bank: ₹${bankRow.amount.toLocaleString()} vs ERP: ₹${candidate.amount.toLocaleString()} (Diff: ₹${Math.abs(variance).toFixed(2)} within tolerance, Date diff: ${dateDiffDays}d).`;
          } else {
            // Material Amount Mismatch
            matchStatus = 'AMOUNT_MISMATCH';
            matchMethod = 'REFERENCE_EXACT';
            confidenceLevel = 'REVIEW';
            matchConfidence = 60;
            reviewRequired = true;
            mismatchCount++;
            amountMismatchCount++;
            mismatchAmount += Math.abs(variance);
            notes = `Amount mismatch on Voucher #${candidate.voucherNumber} (Diff: ₹${Math.abs(variance).toLocaleString()}).`;
            explanation = `Exact reference #${candidate.voucherNumber} found within date window, but bank amount (₹${bankRow.amount.toLocaleString()}) differs materially from ERP voucher amount (₹${candidate.amount.toLocaleString()}). Variance: ₹${Math.abs(variance).toLocaleString()}.`;
          }
        }
      }

      // =========================================================================
      // STAGE 5: TOKENIZED PARTY + AMOUNT MATCHING
      // =========================================================================
      if (matchStatus === 'UNMATCHED_BANK' && bankRow.amount > 0 && bankRow.extractedPartyNames.length > 0) {
        const roundedBankAmt = Math.round(bankRow.amount);
        const candidates = erpByRoundedAmount.get(roundedBankAmt) || [];

        const matchedCandidate = candidates.find(c => {
          if (usedErpIds.has(c.erpTransactionId)) return false;
          if (c.debitCredit !== bankRow.debitCredit) return false;
          const diff = Math.abs(BankReconciliationService.calculateDateDifference(bankRow.transactionDate, c.voucherDate));
          if (diff > config.partyAndAmountDateToleranceDays) return false;
          return c.partyTokens.some(token => bankRow.extractedPartyNames.includes(token));
        });

        if (matchedCandidate) {
          variance = Math.round((bankRow.amount - matchedCandidate.amount) * 100) / 100;
          dateDiffDays = BankReconciliationService.calculateDateDifference(bankRow.transactionDate, matchedCandidate.voucherDate);
          
          matchStatus = 'MATCHED';
          matchMethod = 'PARTY_AND_AMOUNT';
          confidenceLevel = 'MEDIUM';
          matchConfidence = 90;
          reviewRequired = false;
          usedErpIds.add(matchedCandidate.erpTransactionId);
          matchedCount++;
          matchedAmount += bankRow.amount;

          const summary: MatchedTransactionSummary = {
            id: matchedCandidate.erpTransactionId,
            invoiceId: matchedCandidate.voucherNumber,
            partyName: matchedCandidate.partyName,
            date: matchedCandidate.voucherDate,
            grossAmount: matchedCandidate.amount,
            type: matchedCandidate.voucherType,
            debitCredit: matchedCandidate.debitCredit,
          };
          matchedList.push(summary);

          notes = `Matched via party evidence & amount against Voucher #${matchedCandidate.voucherNumber} (${matchedCandidate.partyName}).`;
          explanation = `Party name evidence validated in bank narration along with exact amount match (Bank: ₹${bankRow.amount.toLocaleString()} vs ERP: ₹${matchedCandidate.amount.toLocaleString()}, Date diff: ${dateDiffDays}d).`;
        }
      }

      // =========================================================================
      // STAGE 6: AMOUNT-ONLY CANDIDATE & AMBIGUITY DETECTION
      // =========================================================================
      if (matchStatus === 'UNMATCHED_BANK' && bankRow.amount >= config.minAmountForAmountOnly) {
        const roundedBankAmt = Math.round(bankRow.amount);
        const candidates = erpByRoundedAmount.get(roundedBankAmt) || [];

        const validCandidates = candidates.filter(c => {
          if (usedErpIds.has(c.erpTransactionId)) return false;
          if (c.debitCredit !== bankRow.debitCredit) return false;
          const diff = Math.abs(BankReconciliationService.calculateDateDifference(bankRow.transactionDate, c.voucherDate));
          return diff <= config.amountOnlyDateToleranceDays;
        });

        if (validCandidates.length > 1) {
          matchStatus = 'AMBIGUOUS';
          matchMethod = 'AMOUNT_ONLY';
          confidenceLevel = 'REVIEW';
          matchConfidence = 50;
          reviewRequired = true;
          ambiguousCount++;
          const candidateVouchers = validCandidates.slice(0, 3).map(c => `#${c.voucherNumber} (${c.partyName})`).join(', ');
          notes = `Ambiguous match: ${validCandidates.length} ERP vouchers share amount ₹${bankRow.amount.toLocaleString()}.`;
          explanation = `Found ${validCandidates.length} distinct ERP vouchers sharing amount ₹${bankRow.amount.toLocaleString()} in the ±${config.amountOnlyDateToleranceDays}d window (${candidateVouchers}). Manual accountant selection required.`;
        } else if (validCandidates.length === 1) {
          const candidate = validCandidates[0];
          variance = Math.round((bankRow.amount - candidate.amount) * 100) / 100;
          dateDiffDays = BankReconciliationService.calculateDateDifference(bankRow.transactionDate, candidate.voucherDate);

          matchStatus = 'MATCHED';
          matchMethod = 'AMOUNT_ONLY';
          confidenceLevel = 'LOW';
          matchConfidence = 75;
          reviewRequired = true;
          matchedCount++;
          matchedAmount += bankRow.amount;
          usedErpIds.add(candidate.erpTransactionId);

          const summary: MatchedTransactionSummary = {
            id: candidate.erpTransactionId,
            invoiceId: candidate.voucherNumber,
            partyName: candidate.partyName,
            date: candidate.voucherDate,
            grossAmount: candidate.amount,
            type: candidate.voucherType,
            debitCredit: candidate.debitCredit,
          };
          matchedList.push(summary);

          notes = `Amount-only match on Voucher #${candidate.voucherNumber} (Low confidence).`;
          explanation = `Provisional match based purely on amount proximity (₹${bankRow.amount.toLocaleString()} vs ₹${candidate.amount.toLocaleString()}, Date diff: ${dateDiffDays}d). Flagged as LOW confidence due to lack of reference/party in narration.`;
        }
      }

      // =========================================================================
      // STAGE 7: UNMATCHED FALLBACK
      // =========================================================================
      if (matchStatus === 'UNMATCHED_BANK') {
        unmatchedCount++;
        unmatchedAmount += bankRow.amount;
        reviewRequired = true;
        confidenceLevel = 'NONE';
        matchConfidence = 0;
        notes = `Unmatched bank entry (${classification}).`;
        explanation = `No qualifying ERP transaction found matching reference, party, or amount within permitted date windows. Transaction Direction: ${bankRow.debitCredit}, Inferred Type: ${classification}.`;
      }

      reconciledItems.push({
        id: `recon_${bankRow.bankTransactionId}`,
        bankRow,
        matchedTransaction: matchedList[0],
        matchedTransactions: matchedList,
        matchStatus,
        matchMethod,
        classification,
        variance,
        confidenceLevel,
        matchConfidence,
        reviewRequired,
        dateDifferenceDays: dateDiffDays,
        aggregateErpAmount,
        resolvedReferenceCount: resolvedRefCount,
        totalReferenceCount: totalRefCount,
        unresolvedReferences: unresolvedRefs,
        notes,
        explanation,
      });
    }

    // Sort reconciled items by original bank statement source row number
    reconciledItems.sort((a, b) => a.bankRow.sourceRowNumber - b.bankRow.sourceRowNumber);

    return {
      bankAccount: params.accountFilter || 'All Bank & Cash Accounts',
      totalRawBankEntries: bankRows.length,
      totalCanonicalBankEntries: canonicalBankTransactions.length,
      totalDuplicateBankEntries: duplicateBankTransactions.length,
      totalReceiptAmount: Math.round(totalReceiptAmount * 100) / 100,
      totalPaymentAmount: Math.round(totalPaymentAmount * 100) / 100,
      closingBankBalance: Math.round(closingBankBalance * 100) / 100,
      
      matchedCount,
      matchedAmount: Math.round(matchedAmount * 100) / 100,
      multiReferenceMatchedCount,
      partialReferenceResolutionCount,
      amountMismatchCount,
      dateConflictCount,
      specialItemCount,
      ambiguousCount,
      unmatchedCount,
      unmatchedAmount: Math.round(unmatchedAmount * 100) / 100,
      mismatchCount,
      mismatchAmount: Math.round(mismatchAmount * 100) / 100,

      consumedErpVoucherCount: usedErpIds.size,
      reusedErpVoucherCount: 0,

      dataQuality: qualityReport,
      items: reconciledItems,
      generatedAt: new Date().toISOString(),
    };
  }
}
