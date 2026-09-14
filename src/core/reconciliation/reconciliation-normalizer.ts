/**
 * Reconciliation Data Normalizer
 * Normalizes Bank Statements and ERP Vouchers into auditable, canonical matching models.
 */

import { TransactionEntity } from '@/core/domain/canonical-models';
import { ReconciliationConfig, DEFAULT_RECONCILIATION_CONFIG } from './reconciliation-config';

export type BankDebitCredit = 'DEBIT' | 'CREDIT';
export type ErpDebitCredit = 'DEBIT' | 'CREDIT';

export type BusinessClassification = 
  | 'OPENING_BALANCE'
  | 'CLOSING_BALANCE'
  | 'BANK_CHARGE'
  | 'TAX'
  | 'INTEREST'
  | 'INVESTMENT'
  | 'TRANSFER'
  | 'CASH_TRANSACTION'
  | 'CUSTOMER_RECEIPT'
  | 'VENDOR_PAYMENT'
  | 'OTHER'
  | 'UNKNOWN';

export interface NormalizedBankTransaction {
  bankTransactionId: string;
  bankAccount: string;
  transactionDate: string; // ISO format YYYY-MM-DD
  valueDate?: string;
  debitCredit: BankDebitCredit;
  amount: number;
  balance: number;
  rawNarration: string;
  normalizedNarration: string;
  extractedReferences: string[];
  extractedPartyNames: string[];
  transactionType: 'RECEIPT' | 'PAYMENT' | 'OPENING' | 'CONTRA';
  sourceRowNumber: number;
  businessClassification: BusinessClassification;
  classificationEvidence?: string;
  duplicateGroupId?: string;
  isCanonical: boolean;
  fingerprint: string;
}

export interface NormalizedErpTransaction {
  erpTransactionId: string;
  voucherNumber: string;
  voucherType: string;
  voucherDate: string; // ISO format YYYY-MM-DD
  partyId?: string;
  partyName: string;
  normalizedPartyName: string;
  partyTokens: string[];
  amount: number;
  grossAmount: number;
  debitCredit: ErpDebitCredit;
  invoiceNumber?: string;
  referenceNumber?: string;
  sourceDocument?: string;
  ledger?: string;
  rawTransaction: TransactionEntity;
}

export class ReconciliationNormalizer {
  private config: ReconciliationConfig;

  constructor(config: ReconciliationConfig = DEFAULT_RECONCILIATION_CONFIG) {
    this.config = config;
  }

  /**
   * Normalizes a string for comparison by lowercasing, stripping extra whitespace,
   * punctuation, and noise words.
   */
  public static normalizeText(text: string): string {
    if (!text) return '';
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Generates meaningful distinct tokens for party matching.
   * Strips generic pharmacy/store/business stopwords and banking transaction keywords.
   */
  public static extractPartyTokens(partyName: string): string[] {
    if (!partyName) return [];
    const stopwords = new Set([
      'pvt', 'ltd', 'limited', 'private', 'enterprises', 'enterprise', 
      'agency', 'agencies', 'store', 'stores', 'pharmacy', 'medical', 
      'chemist', 'pharma', 'and', 'co', 'the', 'h', 'h1', 'h2', 'distributors', 
      'distributor', 'traders', 'trading', 'dr', 'm/s', 'hospital', 'clinic',
      'trf', 'transfer', 'cheque', 'chq', 'neft', 'rtgs', 'imps', 'cash', 
      'deposit', 'withdrawal', 'opening', 'closing', 'balance', 'total', 
      'ach', 'gst', 'tax', 'tds', 'interest', 'commission', 'charges', 'chg',
      'axis', 'icici', 'hdfc', 'sbi', 'canara', 'bank', 'self', 'slip', 'folio',
      'against', 'payment', 'receipt', 'bill', 'invoice', 'voucher', 'no'
    ]);

    const normalized = this.normalizeText(partyName);
    return normalized
      .split(' ')
      .filter(token => token.length >= 3 && !stopwords.has(token) && !/^\d+$/.test(token));
  }

  /**
   * Extracts all ERP reference numbers from a bank narration.
   * Supports standard Marg ERP voucher numbering: e.g. A000166, CN00032, AM000734, VCN001, etc.
   */
  public static extractAllReferences(narration: string): string[] {
    if (!narration) return [];

    // Remove common prefix tokens
    const cleaned = narration
      .replace(/\b(cheque|chq|no|ag|bill|ref|inv|against|rtgs|neft|imps|transfer|trn|utr)\b[\s.:-]*/gi, ' ')
      .trim();

    // Look for alphanumeric patterns: e.g. A012158, CN00032, A000166, AM000734, VCN0012, 000123
    const matches = cleaned.match(/([A-Za-z]{0,4}\d{4,10}|[A-Za-z]{1,4}[-_]?\d{3,10}|CN\d+|DN\d+)/g) || [];

    const noiseTokens = new Set([
      'axis', 'icici', 'hdfc', 'sbi', 'canara', 'bank', 'cash', 'opening', 'balance',
      'total', 'debit', 'credit', 'payment', 'receipt', 'deposit', 'withdrawal'
    ]);

    const references: string[] = [];
    for (const match of matches) {
      const cleanMatch = match.trim().toUpperCase();
      if (cleanMatch.length >= 4 && !noiseTokens.has(cleanMatch.toLowerCase())) {
        if (!references.includes(cleanMatch)) {
          references.push(cleanMatch);
        }
      }
    }

    return references;
  }

  /**
   * Classifies special transactions based on deterministic narration rules.
   * NEVER infers VENDOR_PAYMENT or CUSTOMER_RECEIPT solely from debit/credit.
   */
  public classifySpecialNarration(narration: string, type: 'RECEIPT' | 'PAYMENT' | 'OPENING'): {
    classification: BusinessClassification;
    evidence?: string;
  } {
    const text = narration.trim();

    if (type === 'OPENING' || this.matchesPatterns(text, this.config.specialPatterns.openingBalance)) {
      return { classification: 'OPENING_BALANCE', evidence: 'Narration indicates opening balance ledger forward' };
    }
    if (this.matchesPatterns(text, this.config.specialPatterns.closingBalance)) {
      return { classification: 'CLOSING_BALANCE', evidence: 'Narration indicates closing balance forward' };
    }
    if (this.matchesPatterns(text, this.config.specialPatterns.bankCharges)) {
      return { classification: 'BANK_CHARGE', evidence: 'Matched bank service charge / ledger folio fee patterns' };
    }
    if (this.matchesPatterns(text, this.config.specialPatterns.tax)) {
      return { classification: 'TAX', evidence: 'Matched GST / TDS / Tax statutory payment patterns' };
    }
    if (this.matchesPatterns(text, this.config.specialPatterns.interest)) {
      return { classification: 'INTEREST', evidence: 'Matched bank interest credited/debited patterns' };
    }
    if (this.matchesPatterns(text, this.config.specialPatterns.investment)) {
      return { classification: 'INVESTMENT', evidence: 'Matched mutual fund / ACH SIP / investment patterns' };
    }
    if (this.matchesPatterns(text, this.config.specialPatterns.transfer)) {
      return { classification: 'TRANSFER', evidence: 'Matched inter-account / contra transfer patterns' };
    }
    if (this.matchesPatterns(text, this.config.specialPatterns.cash)) {
      return { classification: 'CASH_TRANSACTION', evidence: 'Matched cash deposit / withdrawal slip patterns' };
    }

    // If explicit party tokens exist, categorize based on direction + party presence
    const partyTokens = ReconciliationNormalizer.extractPartyTokens(text);
    if (partyTokens.length > 0) {
      if (type === 'RECEIPT') {
        return { classification: 'CUSTOMER_RECEIPT', evidence: `Customer party tokens identified: ${partyTokens.join(', ')}` };
      } else if (type === 'PAYMENT') {
        return { classification: 'VENDOR_PAYMENT', evidence: `Vendor party tokens identified: ${partyTokens.join(', ')}` };
      }
    }

    // Default to UNKNOWN when no commercial or non-commercial evidence exists
    return { classification: 'UNKNOWN', evidence: 'Insufficient narration evidence to determine commercial entity type' };
  }

  private matchesPatterns(text: string, patterns: RegExp[]): boolean {
    if (!text || !patterns) return false;
    return patterns.some(pattern => pattern.test(text));
  }

  /**
   * Normalizes a raw ERP Transaction into a NormalizedErpTransaction
   */
  public normalizeErpTransaction(tx: TransactionEntity): NormalizedErpTransaction {
    const rawVoucher = (tx.invoiceId || '').trim().toUpperCase();
    const partyTokens = ReconciliationNormalizer.extractPartyTokens(tx.partyName || '');
    const normalizedParty = ReconciliationNormalizer.normalizeText(tx.partyName || '');

    // In ERP accounting:
    // Sales / Purchase Return = Debit to Customer / Credit from Vendor (Bank Receipt expected -> CREDIT)
    // Sales Return / Purchase = Credit to Customer / Debit to Vendor (Bank Payment expected -> DEBIT)
    let debitCredit: ErpDebitCredit = 'CREDIT';
    if (tx.type === 'sale' || tx.type === 'purchase_return') {
      debitCredit = 'CREDIT'; // Expected bank credit (inflow/receipt)
    } else if (tx.type === 'purchase' || tx.type === 'sale_return') {
      debitCredit = 'DEBIT'; // Expected bank debit (outflow/payment)
    }

    return {
      erpTransactionId: tx.id,
      voucherNumber: rawVoucher,
      voucherType: tx.type,
      voucherDate: tx.date ? tx.date.substring(0, 10) : '2001-04-01',
      partyId: tx.partyId,
      partyName: tx.partyName || 'Unknown Party',
      normalizedPartyName: normalizedParty,
      partyTokens,
      amount: Math.abs(tx.grossAmount),
      grossAmount: tx.grossAmount,
      debitCredit,
      invoiceNumber: rawVoucher,
      referenceNumber: rawVoucher,
      sourceDocument: tx.sourceSystem || 'MargERP',
      ledger: tx.partyName,
      rawTransaction: tx,
    };
  }

  /**
   * Normalizes a raw parsed bank row into a NormalizedBankTransaction with fingerprinting
   */
  public normalizeBankRow(row: {
    id: string;
    bankAccount: string;
    date: string;
    voucherNo?: string;
    particulars: string;
    type: 'RECEIPT' | 'PAYMENT' | 'OPENING';
    amount: number;
    balance: number;
    sourceRowNumber: number;
  }): NormalizedBankTransaction {
    const rawNarration = row.particulars || '';
    const normalizedNarration = ReconciliationNormalizer.normalizeText(rawNarration);
    const extractedReferences = ReconciliationNormalizer.extractAllReferences(rawNarration);
    const classificationResult = this.classifySpecialNarration(rawNarration, row.type);

    // In Bank Statements:
    // RECEIPT = Bank CREDIT (Inflow)
    // PAYMENT = Bank DEBIT (Outflow)
    // OPENING = Opening Balance
    let debitCredit: BankDebitCredit = row.type === 'PAYMENT' ? 'DEBIT' : 'CREDIT';

    const normalizedDate = row.date ? row.date.substring(0, 10) : '2001-04-01';
    const amountVal = Math.abs(row.amount);
    
    // Deterministic fingerprint for duplicate isolation:
    // account + date + normalizedNarration + amount + debitCredit
    const fingerprint = `${row.bankAccount.trim().toUpperCase()}|${normalizedDate}|${normalizedNarration}|${amountVal.toFixed(2)}|${debitCredit}`;

    return {
      bankTransactionId: row.id,
      bankAccount: row.bankAccount,
      transactionDate: normalizedDate,
      debitCredit,
      amount: amountVal,
      balance: row.balance,
      rawNarration,
      normalizedNarration,
      extractedReferences,
      extractedPartyNames: ReconciliationNormalizer.extractPartyTokens(rawNarration),
      transactionType: row.type,
      sourceRowNumber: row.sourceRowNumber,
      businessClassification: classificationResult.classification,
      classificationEvidence: classificationResult.evidence,
      isCanonical: true,
      fingerprint,
    };
  }
}
