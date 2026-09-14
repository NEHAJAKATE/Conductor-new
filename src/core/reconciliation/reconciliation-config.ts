/**
 * Enterprise Reconciliation Configuration
 * Configurable parameters for deterministic, auditable Bank Reconciliation Statement (BRS) engine
 */

export type ConfidenceLevel = 'HIGH' | 'MEDIUM' | 'LOW' | 'REVIEW' | 'NONE';

export interface ReconciliationConfig {
  /** Rounding/amount tolerance in currency units (default ₹1.00) */
  amountTolerance: number;
  /** Maximum percentage tolerance if applicable (e.g. 0.001 for 0.1%) */
  percentageTolerance?: number;
  
  /** Date tolerance window in calendar days for exact reference matches (default ±30 days) */
  exactReferenceDateToleranceDays: number;
  /** Date tolerance window in calendar days for party + amount matches (default ±15 days) */
  partyAndAmountDateToleranceDays: number;
  /** Date tolerance window in calendar days for amount-only candidate matches (default ±7 days) */
  amountOnlyDateToleranceDays: number;

  /** Minimum amount to consider for amount-only candidate matching (default ₹500) */
  minAmountForAmountOnly: number;
  /** Allow partial reference resolution */
  allowPartialReferenceResolution: boolean;
  /** Allow multi-voucher consolidated payment settlement */
  allowConsolidatedPayments: boolean;

  /** Regex patterns for deterministic special bank narrations */
  specialPatterns: {
    openingBalance: RegExp[];
    closingBalance: RegExp[];
    bankCharges: RegExp[];
    tax: RegExp[];
    interest: RegExp[];
    investment: RegExp[];
    transfer: RegExp[];
    cash: RegExp[];
  };
}

export const DEFAULT_RECONCILIATION_CONFIG: ReconciliationConfig = {
  amountTolerance: 1.00,
  percentageTolerance: 0.001,
  exactReferenceDateToleranceDays: 30,
  partyAndAmountDateToleranceDays: 15,
  amountOnlyDateToleranceDays: 7,
  minAmountForAmountOnly: 500.00,
  allowPartialReferenceResolution: true,
  allowConsolidatedPayments: true,
  specialPatterns: {
    openingBalance: [
      /opening\s*bal/i,
      /op\s*bal/i,
      /balance\s*b\/f/i,
      /b\/f\s*bal/i,
      /^opening$/i,
    ],
    closingBalance: [
      /closing\s*bal/i,
      /cl\s*bal/i,
      /balance\s*c\/f/i,
      /c\/f\s*bal/i,
    ],
    bankCharges: [
      /\blf\s*chg\b/i,
      /ledger\s*folio/i,
      /sms\s*chg/i,
      /sms\s*charges/i,
      /chg\s*cc\s*ac/i,
      /bank\s*charges/i,
      /service\s*charge/i,
      /chq\s*return\s*chg/i,
      /min\s*bal\s*chg/i,
      /annual\s*fee/i,
      /commission/i,
      /atm\s*charges/i,
    ],
    tax: [
      /\bgst\b/i,
      /\bigst\b/i,
      /\bcgst\b/i,
      /\bsgst\b/i,
      /\btds\b/i,
      /tax\s*deducted/i,
      /stamp\s*duty/i,
    ],
    interest: [
      /int\s*coll/i,
      /int\s*pd/i,
      /interest\s*credited/i,
      /interest\s*debited/i,
      /savings\s*int/i,
      /fd\s*int/i,
    ],
    investment: [
      /ach\s+kotak/i,
      /\bach\b/i,
      /mutual\s*fund/i,
      /\bmf\b/i,
      /\bsip\b/i,
      /dividend/i,
      /sebi/i,
      /zerodha/i,
      /groww/i,
    ],
    transfer: [
      /trf\s*to/i,
      /trf\s*from/i,
      /transfer\s*to/i,
      /transfer\s*from/i,
      /internal\s*trf/i,
      /sweep\s*trf/i,
      /contra/i,
      /neft\s*trf/i,
      /rtgs\s*trf/i,
    ],
    cash: [
      /cash\s*dep/i,
      /cash\s*deposit/i,
      /cash\s*wdl/i,
      /cash\s*withdrawal/i,
      /\bself\b/i,
    ],
  },
};
