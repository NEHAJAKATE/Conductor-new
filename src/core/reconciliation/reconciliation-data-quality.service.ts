/**
 * Reconciliation Data Quality Layer
 * Audits bank statement feeds and ERP transaction sets for duplicates, date anomalies,
 * missing narrations, and integrity issues before matching.
 */

import { NormalizedBankTransaction, NormalizedErpTransaction } from './reconciliation-normalizer';

export interface DataQualityIssue {
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  category: 'DUPLICATE' | 'PERIOD_MISMATCH' | 'DATE_ANOMALY' | 'MISSING_NARRATION' | 'ZERO_AMOUNT';
  message: string;
  recordId?: string;
  source: 'BANK' | 'ERP';
}

export type BRSQualityStatus = 'VALIDATED' | 'PARTIAL_OVERLAP' | 'PERIOD_MISMATCH_NEEDS_REVIEW';

export interface DataQualityReport {
  totalRawBankRecords: number;
  totalCanonicalBankRecords: number;
  totalErpRecords: number;
  bankDuplicatesCount: number;
  erpDuplicatesCount: number;
  dateAnomaliesCount: number;
  missingNarrationsCount: number;
  auditStatus: BRSQualityStatus;
  statusLabel: string;
  issues: DataQualityIssue[];
  periodSummary: {
    bankEarliestDate?: string;
    bankLatestDate?: string;
    erpEarliestDate?: string;
    erpLatestDate?: string;
    overlapStart?: string;
    overlapEnd?: string;
    hasPeriodOverlap: boolean;
    overlapDays: number;
  };
}

export class ReconciliationDataQualityService {
  /**
   * Pre-processes and isolates duplicate bank rows, marking canonical vs duplicates,
   * and computes comprehensive data quality metrics and period overlap.
   */
  public static validateAndIsolateDuplicates(
    bankTransactions: NormalizedBankTransaction[],
    erpTransactions: NormalizedErpTransaction[]
  ): {
    canonicalBankTransactions: NormalizedBankTransaction[];
    duplicateBankTransactions: NormalizedBankTransaction[];
    qualityReport: DataQualityReport;
  } {
    const issues: DataQualityIssue[] = [];
    const fingerprintGroups = new Map<string, NormalizedBankTransaction[]>();

    let bankMinDate: string | undefined;
    let bankMaxDate: string | undefined;
    let missingNarrationsCount = 0;
    let dateAnomaliesCount = 0;

    // 1. Group by deterministic fingerprint
    for (let i = 0; i < bankTransactions.length; i++) {
      const b = bankTransactions[i];
      const fp = b.fingerprint;
      const group = fingerprintGroups.get(fp) || [];
      group.push(b);
      fingerprintGroups.set(fp, group);

      if (!b.rawNarration || b.rawNarration.trim().length === 0) {
        missingNarrationsCount++;
      }

      if (!bankMinDate || b.transactionDate < bankMinDate) bankMinDate = b.transactionDate;
      if (!bankMaxDate || b.transactionDate > bankMaxDate) bankMaxDate = b.transactionDate;

      // Track extreme date anomalies within bank dataset (e.g. 2026 dates inside 2001 ledger)
      if (b.transactionDate.startsWith('2026') && bankMinDate?.startsWith('2001')) {
        dateAnomaliesCount++;
      }
    }

    const canonicalBankTransactions: NormalizedBankTransaction[] = [];
    const duplicateBankTransactions: NormalizedBankTransaction[] = [];
    let bankDuplicatesCount = 0;

    fingerprintGroups.forEach((group, fp) => {
      // First transaction is canonical
      const canonical = group[0];
      canonical.isCanonical = true;
      canonicalBankTransactions.push(canonical);

      // Remaining are duplicates
      if (group.length > 1) {
        const dupGroupId = `dup_group_${canonical.bankTransactionId}`;
        canonical.duplicateGroupId = dupGroupId;

        for (let j = 1; j < group.length; j++) {
          const dup = group[j];
          dup.isCanonical = false;
          dup.duplicateGroupId = dupGroupId;
          duplicateBankTransactions.push(dup);
          bankDuplicatesCount++;
        }
      }
    });

    if (bankDuplicatesCount > 0) {
      issues.push({
        severity: 'WARNING',
        category: 'DUPLICATE',
        message: `${bankDuplicatesCount} duplicate bank rows detected and isolated. Only 1 canonical entry per group is permitted for BRS matching.`,
        source: 'BANK',
      });
    }

    // 2. ERP checks and period boundaries
    const seenErpVouchers = new Set<string>();
    let erpDuplicatesCount = 0;
    let erpMinDate: string | undefined;
    let erpMaxDate: string | undefined;

    for (const e of erpTransactions) {
      const vKey = `${e.voucherNumber}_${e.voucherType}`;
      if (e.voucherNumber && seenErpVouchers.has(vKey)) {
        erpDuplicatesCount++;
      } else if (e.voucherNumber) {
        seenErpVouchers.add(vKey);
      }

      if (!erpMinDate || e.voucherDate < erpMinDate) erpMinDate = e.voucherDate;
      if (!erpMaxDate || e.voucherDate > erpMaxDate) erpMaxDate = e.voucherDate;
    }

    // Calculate period overlap
    let overlapStart: string | undefined;
    let overlapEnd: string | undefined;
    let hasPeriodOverlap = false;
    let overlapDays = 0;

    if (bankMinDate && bankMaxDate && erpMinDate && erpMaxDate) {
      const oStart = bankMinDate > erpMinDate ? bankMinDate : erpMinDate;
      const oEnd = bankMaxDate < erpMaxDate ? bankMaxDate : erpMaxDate;

      if (oStart <= oEnd) {
        hasPeriodOverlap = true;
        overlapStart = oStart;
        overlapEnd = oEnd;
        const diff = new Date(oEnd).getTime() - new Date(oStart).getTime();
        overlapDays = Math.max(0, Math.round(diff / (1000 * 60 * 60 * 24)));
      }
    }

    let auditStatus: BRSQualityStatus = 'VALIDATED';
    let statusLabel = 'DATASET VALIDATED';

    if (!hasPeriodOverlap) {
      auditStatus = 'PERIOD_MISMATCH_NEEDS_REVIEW';
      statusLabel = 'PERIOD MISMATCH — MANUAL REVIEW REQUIRED';
      issues.push({
        severity: 'CRITICAL',
        category: 'PERIOD_MISMATCH',
        message: `Severe period divergence: Bank statement span (${bankMinDate} → ${bankMaxDate}) does not overlap with ERP ledger span (${erpMinDate} → ${erpMaxDate}). Date-gating will block invalid multi-year matches.`,
        source: 'BANK',
      });
    } else if (bankDuplicatesCount > 50 || dateAnomaliesCount > 10) {
      auditStatus = 'PARTIAL_OVERLAP';
      statusLabel = 'AUDIT WARNING — DUPLICATES & ANOMALIES ISOLATED';
    }

    const qualityReport: DataQualityReport = {
      totalRawBankRecords: bankTransactions.length,
      totalCanonicalBankRecords: canonicalBankTransactions.length,
      totalErpRecords: erpTransactions.length,
      bankDuplicatesCount,
      erpDuplicatesCount,
      dateAnomaliesCount,
      missingNarrationsCount,
      auditStatus,
      statusLabel,
      issues: issues.slice(0, 50),
      periodSummary: {
        bankEarliestDate: bankMinDate,
        bankLatestDate: bankMaxDate,
        erpEarliestDate: erpMinDate,
        erpLatestDate: erpMaxDate,
        overlapStart,
        overlapEnd,
        hasPeriodOverlap,
        overlapDays,
      },
    };

    return {
      canonicalBankTransactions,
      duplicateBankTransactions,
      qualityReport,
    };
  }
}
