/**
 * Dynamic Credit Limit Engine
 * 
 * Business Rule:
 *   dynamicCreditLimit = avgMonthlySale × 1.5 (45-day coverage)
 * 
 * Uses robust two-tier identity matching (canonical ID -> ledger/display name fallback)
 * to resolve transaction party to BusinessEntity before aggregation.
 */

import { BusinessEntity, CreditStatus, TransactionEntity } from '../domain/canonical-models';
import { businessRepository } from '@/infrastructure/repositories/business-repository';

export interface CreditComputationResult {
  dynamicCreditLimit: number;
  avgMonthlySale: number;
  monthsOfHistory: number;
  creditMultiplier: number;
  creditUtilization: number;
  creditStatus: CreditStatus;
  creditStatusReason: string;
  lastCreditComputedAt: string;
  matchType?: 'DIRECT_CANONICAL_ID' | 'LEDGER_NAME_MATCH' | 'DISPLAY_NAME_FALLBACK' | 'UNRESOLVED';
}

export class CreditLimitService {
  static readonly DEFAULT_MULTIPLIER = 1.5;
  static readonly APPROACHING_THRESHOLD_PERCENT = 80;

  /**
   * STEP A — Build a resolved sales-by-business-by-month map for ALL businesses at once.
   * Reuses the robust matcher (canonical ID first -> ledger/display name fallback)
   * instead of a naive tx.partyId === business.id check.
   */
  static async buildResolvedMonthlySalesMap(
    allTransactions: TransactionEntity[]
  ): Promise<Map<string, Map<string, number>>> {
    // resolvedBusinessId -> (monthKey -> netAmount)
    const resolvedMap = new Map<string, Map<string, number>>();
    let unresolvedCount = 0;

    for (const tx of allTransactions) {
      if (tx.type !== 'sale' && tx.type !== 'sale_return') continue;

      // Try strong match first (works when GSTIN/Canonical ID is present on both sides)
      let resolvedBusinessId: string | null = null;
      const directMatch = await businessRepository.findById(tx.partyId || '');
      if (directMatch) {
        resolvedBusinessId = directMatch.id;
      } else {
        // Fallback: same ledger-name / display-name matcher used for Outstanding Ledger
        const lookup = await businessRepository.findByName(tx.partyName);
        if (lookup.status === 'LEDGER_MATCH' || lookup.status === 'DISPLAY_NAME_MATCH') {
          resolvedBusinessId = lookup.business!.id;
        }
      }

      if (!resolvedBusinessId) {
        unresolvedCount++;
        continue; // do NOT guess — unresolved sales are excluded, not silently attributed
      }

      const monthKey = tx.date.substring(0, 7);
      const signedAmount = tx.type === 'sale_return' ? -tx.netAmount : tx.netAmount;

      if (!resolvedMap.has(resolvedBusinessId)) {
        resolvedMap.set(resolvedBusinessId, new Map());
      }
      const monthMap = resolvedMap.get(resolvedBusinessId)!;
      monthMap.set(monthKey, (monthMap.get(monthKey) || 0) + signedAmount);
    }

    console.log(`[CreditLimitService] Resolved sales for aggregation. Unresolved transactions: ${unresolvedCount}`);
    return resolvedMap;
  }

  /**
   * STEP B — Compute one business's credit profile from the pre-resolved map.
   */
  static compute(
    business: BusinessEntity,
    resolvedMonthlySalesMap: Map<string, Map<string, number>>
  ): CreditComputationResult {
    const now = new Date().toISOString();
    const multiplier = business.credit.creditMultiplier ?? CreditLimitService.DEFAULT_MULTIPLIER;

    // Never compute a credit limit for a payable (negative outstanding = ATC owes them, not vice versa)
    if ((business.currentOutstanding ?? 0) < 0) {
      return {
        dynamicCreditLimit: 0,
        avgMonthlySale: 0,
        monthsOfHistory: 0,
        creditMultiplier: multiplier,
        creditUtilization: 0,
        creditStatus: 'NO_HISTORY',
        creditStatusReason: 'Negative outstanding (payable) — not a customer receivable, credit limit not applicable.',
        lastCreditComputedAt: now,
      };
    }

    const monthMap = resolvedMonthlySalesMap.get(business.id);
    if (!monthMap || monthMap.size === 0) {
      return {
        dynamicCreditLimit: 0,
        avgMonthlySale: 0,
        monthsOfHistory: 0,
        creditMultiplier: multiplier,
        creditUtilization: 0,
        creditStatus: 'NO_HISTORY',
        creditStatusReason: 'No resolved sales transaction history found for this customer.',
        lastCreditComputedAt: now,
      };
    }

    const monthValues = Array.from(monthMap.values());
    const totalNetSales = monthValues.reduce((sum, v) => sum + v, 0);
    const monthsOfHistory = monthValues.length;
    const avgMonthlySale = totalNetSales / monthsOfHistory;
    const dynamicCreditLimit = Math.round(avgMonthlySale * multiplier * 100) / 100;

    const currentOutstanding = business.currentOutstanding || 0;
    const creditUtilization = dynamicCreditLimit > 0
      ? Math.round((currentOutstanding / dynamicCreditLimit) * 10000) / 100
      : 0;

    let creditStatus: CreditStatus;
    let creditStatusReason: string;
    if (dynamicCreditLimit <= 0) {
      creditStatus = 'NO_HISTORY';
      creditStatusReason = 'Computed credit limit is zero (no net positive sales).';
    } else if (creditUtilization >= 100) {
      creditStatus = 'BREACHED';
      creditStatusReason = `BREACHED: Outstanding ₹${Math.round(currentOutstanding).toLocaleString()} exceeds dynamic limit ₹${Math.round(dynamicCreditLimit).toLocaleString()} (${creditUtilization}%).`;
    } else if (creditUtilization >= CreditLimitService.APPROACHING_THRESHOLD_PERCENT) {
      creditStatus = 'APPROACHING_LIMIT';
      creditStatusReason = `APPROACHING: ${creditUtilization}% of limit ₹${Math.round(dynamicCreditLimit).toLocaleString()} used.`;
    } else {
      creditStatus = 'WITHIN_LIMIT';
      creditStatusReason = `SAFE: ${creditUtilization}% of limit ₹${Math.round(dynamicCreditLimit).toLocaleString()} used.`;
    }

    return {
      dynamicCreditLimit,
      avgMonthlySale: Math.round(avgMonthlySale * 100) / 100,
      monthsOfHistory,
      creditMultiplier: multiplier,
      creditUtilization,
      creditStatus,
      creditStatusReason,
      lastCreditComputedAt: now,
    };
  }
}
