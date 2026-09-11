import {
  TransactionEntity,
  TransactionType,
} from '@/core/domain/canonical-models';
import {
  transactionRepository,
  inventoryRepository,
  outstandingRepository,
} from '@/infrastructure/repositories/canonical-repositories';

import { formatINR } from '@/lib/formatters';

// ─── Stock Status Types ─────────────────────────────────────────────────

export type StockStatus =
  | 'Healthy'
  | 'Low Stock'
  | 'Reorder Now'
  | 'Out of Stock'
  | 'Needs Review'
  | 'Missing Opening Data';

export interface StockStatusResult {
  status: StockStatus;
  explanation: string;
}

export interface ProductStockCalculation {
  productId: string;
  productName: string;
  manufacturer: string | null;
  manufacturerSource: 'opening_stock' | 'transaction' | null;
  openingStock: number | null; // null = no opening stock record
  hasOpeningStock: boolean;
  purchases: number;
  salesReturns: number;
  sales: number;
  purchaseReturns: number;
  breakage: number;
  adjustments: number;
  calculatedClosingStock: number | null; // null only if no data at all
  stockStatus: StockStatusResult;
  dataQuality: {
    hasOpeningStock: boolean;
    hasTransactions: boolean;
    hasMissingData: boolean;
    issues: string[];
  };
}

export interface MonthlyValue {
  month: string; // YYYY-MM
  monthLabel: string; // e.g., "Apr 2026"
  value: number;
  count: number;
}

// ─── Business Calculation Service ───────────────────────────────────────

export class BusinessCalcService {

  // ── Reorder Configuration ──────────────────────────────────────────
  // Provisional default: 14 days coverage. NOT confirmed ATC policy.
  private static _defaultCoverageDays = 14;

  /** Set the default reorder coverage period in days. Provisional rule. */
  public static setDefaultCoverageDays(days: number): void {
    this._defaultCoverageDays = days;
  }

  public static getDefaultCoverageDays(): number {
    return this._defaultCoverageDays;
  }

  // ── Product Monthly Sales ──────────────────────────────────────────

  /**
   * Returns monthly sales breakdown for a product.
   * Only counts type=sale transactions (not returns).
   */
  public static async getProductMonthlySales(productId: string): Promise<MonthlyValue[]> {
    const allTx = await transactionRepository.getAll();
    const monthMap = new Map<string, { qty: number; count: number }>();

    for (const tx of allTx) {
      if (tx.type !== 'sale') continue;
      for (const item of tx.items) {
        if (item.productId !== productId) continue;
        const month = tx.date.substring(0, 7);
        const curr = monthMap.get(month) || { qty: 0, count: 0 };
        curr.qty += item.quantity;
        curr.count += 1;
        monthMap.set(month, curr);
      }
    }

    return Array.from(monthMap.entries())
      .map(([month, data]) => ({
        month,
        monthLabel: formatMonthLabel(month),
        value: data.qty,
        count: data.count,
      }))
      .sort((a, b) => a.month.localeCompare(b.month));
  }

  /**
   * Returns average monthly sales for a product.
   * Uses only months that have actual sale data.
   * Returns null if no sales data exists.
   */
  public static async getProductAverageMonthlySales(productId: string): Promise<number | null> {
    const monthly = await this.getProductMonthlySales(productId);
    if (monthly.length === 0) return null;

    // Exclude months with very few transactions that might be partial
    // (e.g., stray Jan 2027 records)
    const fullMonths = monthly.filter(m => m.count >= 5);
    if (fullMonths.length === 0) {
      // Fall back to all months if none qualify as "full"
      const total = monthly.reduce((sum, m) => sum + m.value, 0);
      return Math.round(total / monthly.length);
    }

    const total = fullMonths.reduce((sum, m) => sum + m.value, 0);
    return Math.round(total / fullMonths.length);
  }

  // ── Reorder Threshold ──────────────────────────────────────────────

  /**
   * Calculate reorder threshold based on actual average monthly sales.
   * threshold = avgMonthlySales * (coverageDays / 30)
   * Returns null if no sales data to calculate from.
   */
  public static getReorderThreshold(
    avgMonthlySales: number | null,
    coverageDays?: number,
  ): number | null {
    if (avgMonthlySales === null || avgMonthlySales <= 0) return null;
    const days = coverageDays ?? this._defaultCoverageDays;
    return Math.round(avgMonthlySales * (days / 30));
  }

  // ── Stock Status ───────────────────────────────────────────────────

  /**
   * Determine stock status with human-readable explanation.
   */
  public static getStockStatus(
    closingStock: number | null,
    avgMonthlySales: number | null,
    hasOpeningStock: boolean,
    openingStockValue?: number | null,
  ): StockStatusResult {
    // No data at all
    if (closingStock === null) {
      return {
        status: 'Missing Opening Data',
        explanation: 'Closing stock cannot be calculated because neither opening stock nor transaction data is available for this product.',
      };
    }

    // Missing opening stock but has transactions
    if (!hasOpeningStock) {
      if (closingStock < 0) {
        return {
          status: 'Missing Opening Data',
          explanation: `Closing stock cannot be reliably calculated because opening stock information is missing. The transaction history shows a net outflow of ${Math.abs(closingStock)} units without a recorded starting balance.`,
        };
      }
      return {
        status: 'Needs Review',
        explanation: `Opening stock information is missing. The displayed closing stock (${closingStock}) is based on transaction data only and may be understated.`,
      };
    }

    // Negative opening stock
    if (openingStockValue !== null && openingStockValue !== undefined && openingStockValue < 0) {
      return {
        status: 'Needs Review',
        explanation: `Opening stock was recorded as ${openingStockValue} units (negative). This may indicate a data entry issue or stock mismatch in the source system. Closing stock calculation includes this value.`,
      };
    }

    // Negative closing stock
    if (closingStock < 0) {
      return {
        status: 'Needs Review',
        explanation: `The transaction history indicates that recorded sales and outflows exceed the available opening stock and purchases by ${Math.abs(closingStock)} units. This may indicate unrecorded stock receipts or a data discrepancy.`,
      };
    }

    // Zero stock
    if (closingStock === 0) {
      return {
        status: 'Out of Stock',
        explanation: 'Current calculated stock is zero. No units available.',
      };
    }

    // Check against reorder threshold
    const threshold = this.getReorderThreshold(avgMonthlySales);
    if (threshold !== null) {
      if (closingStock <= threshold / 2) {
        return {
          status: 'Reorder Now',
          explanation: `Current stock (${closingStock}) is critically low — below ${Math.round(threshold / 2)} units (half of the ${this._defaultCoverageDays}-day coverage threshold of ${threshold}). Based on average monthly sales of ${avgMonthlySales} units.`,
        };
      }
      if (closingStock <= threshold) {
        return {
          status: 'Low Stock',
          explanation: `Current stock (${closingStock}) is below the ${this._defaultCoverageDays}-day coverage threshold of ${threshold} units. Based on average monthly sales of ${avgMonthlySales} units.`,
        };
      }
    }

    return {
      status: 'Healthy',
      explanation: avgMonthlySales
        ? `Stock level (${closingStock}) is adequate. Average monthly sales: ${avgMonthlySales} units.`
        : `Stock level is ${closingStock} units. No sales history available to assess coverage.`,
    };
  }

  // ── Product Stock Calculation ──────────────────────────────────────

  /**
   * Full traceable stock calculation for a single product.
   * Does NOT mutate source data.
   */
  public static async getProductStockCalculation(productId: string): Promise<ProductStockCalculation> {
    const openingStockList = await inventoryRepository.list();
    const openingItem = openingStockList.find(i => i.productId === productId);

    const allTx = await transactionRepository.getAll();
    let productName = openingItem?.productName || '';
    let manufacturer: string | null = openingItem?.manufacturer || null;
    let manufacturerSource: 'opening_stock' | 'transaction' | null = openingItem?.manufacturer ? 'opening_stock' : null;

    let purchases = 0, salesReturns = 0, sales = 0, purchaseReturns = 0, breakage = 0, adjustments = 0;
    let hasTransactions = false;

    for (const tx of allTx) {
      for (const item of tx.items) {
        if (item.productId !== productId) continue;
        hasTransactions = true;
        if (!productName) productName = item.productName;
        if (!manufacturer && item.manufacturer) {
          manufacturer = item.manufacturer;
          manufacturerSource = 'transaction';
        }

        switch (tx.type) {
          case 'purchase': purchases += item.quantity; break;
          case 'sale_return': salesReturns += item.quantity; break;
          case 'sale': sales += item.quantity; break;
          case 'purchase_return': purchaseReturns += item.quantity; break;
          case 'breakage': breakage += item.quantity; break;
          case 'stock_adjustment': adjustments += item.quantity; break;
          // price_adjustment: qty=0, no stock effect
        }
      }
    }

    const hasOpeningStock = openingItem !== undefined;
    const openingStock = hasOpeningStock ? openingItem!.quantityOnHand : null;

    let calculatedClosingStock: number | null = null;
    if (hasOpeningStock || hasTransactions) {
      const opening = openingStock ?? 0;
      calculatedClosingStock = Math.round(
        (opening + purchases + salesReturns - sales - purchaseReturns - breakage + adjustments) * 100
      ) / 100;
    }

    const issues: string[] = [];
    if (!hasOpeningStock) issues.push('No opening stock record found for this product.');
    if (!hasTransactions && hasOpeningStock) issues.push('No transactions found for this product.');
    if (openingStock !== null && openingStock < 0) issues.push(`Opening stock is negative (${openingStock}).`);
    if (calculatedClosingStock !== null && calculatedClosingStock < 0) issues.push('Calculated closing stock is negative.');
    if (!manufacturer) issues.push('Manufacturer information is not available.');

    const avgMonthlySales = await this.getProductAverageMonthlySales(productId);

    const stockStatus = this.getStockStatus(
      calculatedClosingStock,
      avgMonthlySales,
      hasOpeningStock,
      openingStock,
    );

    return {
      productId,
      productName: productName || 'Unknown Product',
      manufacturer,
      manufacturerSource,
      openingStock,
      hasOpeningStock,
      purchases,
      salesReturns,
      sales,
      purchaseReturns,
      breakage,
      adjustments,
      calculatedClosingStock,
      stockStatus,
      dataQuality: {
        hasOpeningStock,
        hasTransactions,
        hasMissingData: issues.length > 0,
        issues,
      },
    };
  }

  // ── Customer Transactions ──────────────────────────────────────────

  /**
   * Get transactions for a specific customer/party.
   * Matches by partyName (case-insensitive partial match).
   */
  public static async getCustomerTransactions(
    partyIdentifier: string,
    filters?: {
      startDate?: string;
      endDate?: string;
      type?: TransactionType;
      limit?: number;
      offset?: number;
    },
  ): Promise<{ items: TransactionEntity[]; total: number }> {
    return transactionRepository.list({
      partyId: partyIdentifier,
      startDate: filters?.startDate,
      endDate: filters?.endDate,
      type: filters?.type,
      limit: filters?.limit || 50,
      offset: filters?.offset || 0,
    });
  }

  /**
   * Monthly sales totals for a specific customer.
   */
  public static async getCustomerMonthlySales(partyName: string): Promise<MonthlyValue[]> {
    const allTx = await transactionRepository.getAll();
    const partyLower = partyName.toLowerCase();
    const monthMap = new Map<string, { net: number; count: number }>();

    for (const tx of allTx) {
      if (tx.type !== 'sale') continue;
      if (!tx.partyName.toLowerCase().includes(partyLower)) continue;
      const month = tx.date.substring(0, 7);
      const curr = monthMap.get(month) || { net: 0, count: 0 };
      curr.net += tx.netAmount;
      curr.count += 1;
      monthMap.set(month, curr);
    }

    return Array.from(monthMap.entries())
      .map(([month, data]) => ({
        month,
        monthLabel: formatMonthLabel(month),
        value: Math.round(data.net * 100) / 100,
        count: data.count,
      }))
      .sort((a, b) => a.month.localeCompare(b.month));
  }

  // ── Daily Sales Summary ────────────────────────────────────────────

  /**
   * Get all sales for a specific date (YYYY-MM-DD).
   * Returns individual transactions, not aggregates.
   */
  public static async getDailySales(
    dateStr: string,
    filters?: { search?: string; limit?: number; offset?: number },
  ): Promise<{ items: TransactionEntity[]; total: number }> {
    return transactionRepository.list({
      type: 'sale',
      startDate: dateStr,
      endDate: dateStr,
      search: filters?.search,
      limit: filters?.limit || 100,
      offset: filters?.offset || 0,
    });
  }

  // ── Monthly Totals ─────────────────────────────────────────────────

  /**
   * Monthly aggregation for any transaction type.
   * Returns net amounts per month.
   */
  public static async getMonthlyTotals(
    type: TransactionType,
  ): Promise<MonthlyValue[]> {
    const allTx = await transactionRepository.getAll();
    const monthMap = new Map<string, { net: number; count: number }>();

    for (const tx of allTx) {
      if (tx.type !== type) continue;
      const month = tx.date.substring(0, 7);
      const curr = monthMap.get(month) || { net: 0, count: 0 };
      curr.net += tx.netAmount;
      curr.count += 1;
      monthMap.set(month, curr);
    }

    return Array.from(monthMap.entries())
      .map(([month, data]) => ({
        month,
        monthLabel: formatMonthLabel(month),
        value: Math.round(data.net * 100) / 100,
        count: data.count,
      }))
      .sort((a, b) => a.month.localeCompare(b.month));
  }

  // ── Outstanding Helper ─────────────────────────────────────────────

  /**
   * Get outstanding for a business, with business-friendly interpretation
   * of negative balances.
   */
  public static async getCustomerOutstanding(businessId: string): Promise<{
    found: boolean;
    totalOutstanding: number;
    isAdvanceOrOverpayment: boolean;
    displayLabel: string;
    displayAmount: string;
    bucket0_30: number;
    bucket31_60: number;
    bucket61_90: number;
    bucket90Plus: number;
    riskLevel: string;
  } | null> {
    const record = await outstandingRepository.findByBusinessId(businessId);
    if (!record) return null;

    const isNeg = record.totalOutstanding < 0;

    return {
      found: true,
      totalOutstanding: record.totalOutstanding,
      isAdvanceOrOverpayment: isNeg,
      displayLabel: isNeg ? 'Advance / Overpayment' : 'Amount Due',
      displayAmount: formatINR(Math.abs(record.totalOutstanding)),
      bucket0_30: record.bucket0_30,
      bucket31_60: record.bucket31_60,
      bucket61_90: record.bucket61_90,
      bucket90Plus: record.bucket90Plus,
      riskLevel: record.riskLevel,
    };
  }
}

// ─── Internal Helpers ───────────────────────────────────────────────────

function formatMonthLabel(yyyymm: string): string {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const [year, month] = yyyymm.split('-');
  const idx = parseInt(month, 10) - 1;
  return `${months[idx] || month} ${year}`;
}
