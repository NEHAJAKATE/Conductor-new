import path from 'path';
import fs from 'fs';
import { ParserFactory } from '@/core/parser/parser-factory';
import { CanonicalMappingService } from '@/core/mapping/canonical-mapping.service';
import { TransactionEntity } from '@/core/domain/canonical-models';
import { transactionRepository } from '@/infrastructure/repositories/canonical-repositories';

export interface BankStatementRow {
  id: string;
  bankAccount: string;
  date: string;
  rawDate: string;
  voucherNo?: string;
  particulars: string;
  type: 'RECEIPT' | 'PAYMENT' | 'OPENING';
  amount: number;
  balance: number;
  extractedRefs: string[];
}

export type BankMatchStatus = 
  | 'MATCHED' 
  | 'UNMATCHED_BANK' 
  | 'AMOUNT_MISMATCH' 
  | 'DATE_MISMATCH' 
  | 'POSSIBLE_MATCH';

export interface BankReconciliationItem {
  id: string;
  bankRow: BankStatementRow;
  matchedTransaction?: {
    id: string;
    invoiceId: string;
    partyName: string;
    date: string;
    grossAmount: number;
    type: string;
  };
  matchStatus: BankMatchStatus;
  matchType?: 'REFERENCE_EXACT' | 'PARTY_AND_AMOUNT' | 'AMOUNT_ONLY' | 'MANUAL';
  variance: number;
  matchConfidence: number; // 0-100%
  notes?: string;
}

export interface BankReconciliationSummary {
  bankAccount: string;
  totalBankEntries: number;
  totalReceiptAmount: number;
  totalPaymentAmount: number;
  closingBankBalance: number;
  matchedCount: number;
  matchedAmount: number;
  unmatchedCount: number;
  unmatchedAmount: number;
  mismatchCount: number;
  mismatchAmount: number;
  items: BankReconciliationItem[];
  generatedAt: string;
}

export class BankReconciliationService {
  /**
   * Parses the Marg ERP multi-account bank & cash ledger XLS file
   */
  public static parseBankLedgerFile(buffer: Buffer): BankStatementRow[] {
    const parsed = ParserFactory.parse(buffer, '.xls');
    const rows = parsed.rows;
    const records: BankStatementRow[] = [];

    let currentAccount = 'DEFAULT BANK';
    let lastDate = '2026-04-01';

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

      // Extract invoice/bill references (e.g. A012158, CN00032, VCN numbers)
      const refMatches = particulars.match(/([A-Za-z0-9_-]{5,20})/g) || [];
      const extractedRefs = Array.from(new Set(refMatches.filter(r => 
        !['Cheque', 'No', 'Ag', 'Transfer', 'RTGS', 'NEFT', 'IMPS', 'Deposit', 'Withdrawal', 'Opening', 'Balance'].includes(r)
      )));

      let type: 'RECEIPT' | 'PAYMENT' | 'OPENING' = 'RECEIPT';
      let amount = receipt;
      if (payment > 0) {
        type = 'PAYMENT';
        amount = payment;
      } else if (particulars.toLowerCase().includes('opening balance')) {
        type = 'OPENING';
        amount = balance;
      }

      records.push({
        id: `bank_${currentAccount.replace(/[^a-z0-9]/gi, '_')}_${i}_${Date.now()}`,
        bankAccount: currentAccount,
        date: lastDate,
        rawDate: col0 || lastDate,
        voucherNo: col1 || undefined,
        particulars,
        type,
        amount: Math.abs(amount),
        balance,
        extractedRefs,
      });
    }

    return records;
  }

  /**
   * Runs the automated bank reconciliation engine matching bank lines against canonical transactions
   */
  public static async reconcile(params: {
    bankRows?: BankStatementRow[];
    accountFilter?: string;
  } = {}): Promise<BankReconciliationSummary> {
    let bankRows = params.bankRows;

    if (!bankRows || bankRows.length === 0) {
      const bankFilePath = path.resolve(process.cwd(), 'data', 'atc_sample_data', 'BANK & CASH LEDGERS.XLS');
      if (fs.existsSync(bankFilePath)) {
        const buffer = await fs.promises.readFile(bankFilePath);
        bankRows = this.parseBankLedgerFile(buffer);
      } else {
        bankRows = [];
      }
    }

    if (params.accountFilter) {
      const filter = params.accountFilter.toLowerCase();
      bankRows = bankRows.filter(r => r.bankAccount.toLowerCase().includes(filter));
    }

    const allTransactions = await transactionRepository.getAll();
    
    // Index transactions by invoiceId and partyName
    const txByInvoiceId = new Map<string, TransactionEntity>();
    const txByGrossAmount = new Map<number, TransactionEntity[]>();

    for (const tx of allTransactions) {
      if (tx.invoiceId) {
        txByInvoiceId.set(tx.invoiceId.toLowerCase().trim(), tx);
      }
      const roundedGross = Math.round(tx.grossAmount);
      const existing = txByGrossAmount.get(roundedGross) || [];
      existing.push(tx);
      txByGrossAmount.set(roundedGross, existing);
    }

    let totalReceiptAmount = 0;
    let totalPaymentAmount = 0;
    let closingBankBalance = 0;
    let matchedCount = 0;
    let matchedAmount = 0;
    let unmatchedCount = 0;
    let unmatchedAmount = 0;
    let mismatchCount = 0;
    let mismatchAmount = 0;

    const reconciledItems: BankReconciliationItem[] = [];
    const usedTxIds = new Set<string>();

    for (const bankRow of bankRows) {
      if (bankRow.type === 'RECEIPT') totalReceiptAmount += bankRow.amount;
      if (bankRow.type === 'PAYMENT') totalPaymentAmount += bankRow.amount;
      closingBankBalance = bankRow.balance;

      let matchedTx: TransactionEntity | undefined;
      let matchStatus: BankMatchStatus = 'UNMATCHED_BANK';
      let matchType: BankReconciliationItem['matchType'] = undefined;
      let matchConfidence = 0;
      let variance = 0;
      let notes: string | undefined;

      // Rule 1: Exact Reference Match from extracted invoice/bill references
      for (const ref of bankRow.extractedRefs) {
        const cleanRef = ref.toLowerCase().trim();
        const candidate = txByInvoiceId.get(cleanRef);
        if (candidate && !usedTxIds.has(candidate.id)) {
          matchedTx = candidate;
          matchType = 'REFERENCE_EXACT';
          break;
        }
      }

      // Rule 2: Amount & Party Match
      if (!matchedTx && bankRow.amount > 0) {
        const roundedBankAmt = Math.round(bankRow.amount);
        const candidates = txByGrossAmount.get(roundedBankAmt) || [];
        for (const candidate of candidates) {
          if (!usedTxIds.has(candidate.id)) {
            const cleanPart = bankRow.particulars.toLowerCase();
            const party = candidate.partyName.toLowerCase();
            if (cleanPart.includes(party) || party.includes(cleanPart.substring(0, 8))) {
              matchedTx = candidate;
              matchType = 'PARTY_AND_AMOUNT';
              break;
            }
          }
        }
      }

      // Rule 3: Amount-only Candidate
      if (!matchedTx && bankRow.amount > 1000) {
        const roundedBankAmt = Math.round(bankRow.amount);
        const candidates = txByGrossAmount.get(roundedBankAmt) || [];
        for (const candidate of candidates) {
          if (!usedTxIds.has(candidate.id)) {
            matchedTx = candidate;
            matchType = 'AMOUNT_ONLY';
            break;
          }
        }
      }

      if (matchedTx) {
        usedTxIds.add(matchedTx.id);
        const amtDiff = Math.abs(bankRow.amount - matchedTx.grossAmount);
        variance = Math.round((bankRow.amount - matchedTx.grossAmount) * 100) / 100;

        if (amtDiff < 1.0) {
          matchStatus = 'MATCHED';
          matchConfidence = matchType === 'REFERENCE_EXACT' ? 98 : matchType === 'PARTY_AND_AMOUNT' ? 90 : 75;
          matchedCount++;
          matchedAmount += bankRow.amount;
          notes = `Successfully matched via ${matchType} against Voucher #${matchedTx.invoiceId} (${matchedTx.partyName}).`;
        } else {
          matchStatus = 'AMOUNT_MISMATCH';
          matchConfidence = 60;
          mismatchCount++;
          mismatchAmount += Math.abs(variance);
          notes = `Amount variance of ₹${Math.abs(variance).toLocaleString()} detected against ERP Invoice #${matchedTx.invoiceId} (ERP: ₹${matchedTx.grossAmount.toLocaleString()} vs Bank: ₹${bankRow.amount.toLocaleString()}).`;
        }
      } else {
        matchStatus = 'UNMATCHED_BANK';
        unmatchedCount++;
        unmatchedAmount += bankRow.amount;
        notes = bankRow.type === 'OPENING' 
          ? 'Opening balance entry in bank ledger.' 
          : 'Unmatched bank entry. No corresponding ERP voucher or transaction found.';
      }

      reconciledItems.push({
        id: `recon_${bankRow.id}`,
        bankRow,
        matchedTransaction: matchedTx ? {
          id: matchedTx.id,
          invoiceId: matchedTx.invoiceId,
          partyName: matchedTx.partyName,
          date: matchedTx.date,
          grossAmount: matchedTx.grossAmount,
          type: matchedTx.type,
        } : undefined,
        matchStatus,
        matchType,
        variance,
        matchConfidence,
        notes,
      });
    }

    return {
      bankAccount: params.accountFilter || 'All Bank & Cash Accounts',
      totalBankEntries: bankRows.length,
      totalReceiptAmount: Math.round(totalReceiptAmount * 100) / 100,
      totalPaymentAmount: Math.round(totalPaymentAmount * 100) / 100,
      closingBankBalance: Math.round(closingBankBalance * 100) / 100,
      matchedCount,
      matchedAmount: Math.round(matchedAmount * 100) / 100,
      unmatchedCount,
      unmatchedAmount: Math.round(unmatchedAmount * 100) / 100,
      mismatchCount,
      mismatchAmount: Math.round(mismatchAmount * 100) / 100,
      items: reconciledItems,
      generatedAt: new Date().toISOString(),
    };
  }
}
