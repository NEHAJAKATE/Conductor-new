import { 
  TransactionEntity, 
  InventoryEntity 
} from '@/core/domain/canonical-models';
import { 
  transactionRepository, 
  inventoryRepository 
} from '@/infrastructure/repositories/canonical-repositories';
import { BusinessCalcService, StockStatus } from '@/core/services/business-calc.service';

export interface SkuReorderPolicy {
  monthlyBaselineConsumption: number; // Actual avg monthly sales
  reorderThreshold: number;           // Calculated based on coverage
  safetyStock: number;                
  leadTimeDays: number;               
  defaultOrderQuantity: number;       
}

export interface SkuRunningLedger {
  productId: string;
  productName: string;
  manufacturer?: string;
  manufacturerSource?: 'opening_stock' | 'transaction' | null;
  unit: string;
  openingStock: number | null;
  hasOpeningStock: boolean;
  purchases: number;
  salesReturns: number;
  sales: number;
  purchaseReturns: number;
  breakage: number;
  adjustments: number;
  calculatedClosingStock: number | null;
  erpReportedClosingStock?: number;
  variance: number;
  reconciliationStatus: 'RECONCILED' | 'VARIANCE_DETECTED' | 'CALCULATED_RUNNING';
  reorderPolicy: SkuReorderPolicy;
  isLowStock: boolean;
  stockStatus: StockStatus;
  recommendedOrderQuantity: number;
  reorderRationale?: string;
  lastUpdated: string;
  dataQualityIssues: string[];
}

export interface InventoryLedgerSummary {
  totalSkus: number;
  totalOpeningUnits: number;
  totalPurchasedUnits: number;
  totalSalesReturnUnits: number;
  totalSoldUnits: number;
  totalPurchaseReturnUnits: number;
  totalBreakageUnits: number;
  totalAdjustmentUnits: number;
  totalClosingUnits: number;
  lowStockSkuCount: number;
  varianceSkuCount: number;
  items: SkuRunningLedger[];
}

export class InventoryLedgerService {
  // We no longer rely on a static flat policy for everyone.
  // Instead, policy is dynamically computed per-product based on sales.
  private static customPolicies = new Map<string, Partial<SkuReorderPolicy>>();

  public static setSkuReorderPolicy(productId: string, policy: Partial<SkuReorderPolicy>): void {
    this.customPolicies.set(productId, policy);
  }

  /**
   * Computes the real SKU running inventory ledger:
   * Closing Stock = Opening Stock + Purchases + Sales Returns - Sales - Purchase Returns - Breakage ± Adjustments
   * 
   * This is computed efficiently in O(N) by traversing all transactions once.
   */
  public static async computeRunningLedger(params: {
    search?: string;
    lowStockOnly?: boolean;
  } = {}): Promise<InventoryLedgerSummary> {
    // 1. Fetch opening stock
    const openingStockList = await inventoryRepository.list();
    const openingStockMap = new Map<string, { qty: number; name: string; mfg?: string }>();
    for (const inv of openingStockList) {
      openingStockMap.set(inv.productId, {
        qty: inv.quantityOnHand,
        name: inv.productName,
        mfg: inv.manufacturer,
      });
    }

    // 2. Fetch all journal transactions
    const allTransactions = await transactionRepository.getAll();

    // 3. Aggregate SKU movements and monthly sales across transactions
    interface SkuMovementAccumulator {
      productName: string;
      manufacturer?: string;
      purchases: number;
      salesReturns: number;
      sales: number;
      purchaseReturns: number;
      breakage: number;
      adjustments: number;
      monthlySalesMap: Map<string, { qty: number; count: number }>;
    }

    const skuMovements = new Map<string, SkuMovementAccumulator>();

    for (const tx of allTransactions) {
      const month = tx.date.substring(0, 7);
      
      for (const item of tx.items) {
        const prodId = item.productId;
        let acc = skuMovements.get(prodId);
        if (!acc) {
          acc = {
            productName: item.productName,
            manufacturer: item.manufacturer,
            purchases: 0,
            salesReturns: 0,
            sales: 0,
            purchaseReturns: 0,
            breakage: 0,
            adjustments: 0,
            monthlySalesMap: new Map(),
          };
          skuMovements.set(prodId, acc);
        }

        const qty = item.quantity;
        if (tx.type === 'purchase') {
          acc.purchases += qty;
        } else if (tx.type === 'sale_return') {
          acc.salesReturns += qty;
        } else if (tx.type === 'sale') {
          acc.sales += qty;
          
          // Track monthly sales for averaging
          const currMonth = acc.monthlySalesMap.get(month) || { qty: 0, count: 0 };
          currMonth.qty += qty;
          currMonth.count += 1;
          acc.monthlySalesMap.set(month, currMonth);
          
        } else if (tx.type === 'purchase_return') {
          acc.purchaseReturns += qty;
        } else if (tx.type === 'breakage') {
          acc.breakage += qty;
        } else if (tx.type === 'stock_adjustment') {
          acc.adjustments += qty;
        }

        // Manufacturer enrichment from transaction
        if (item.manufacturer && !acc.manufacturer) {
          acc.manufacturer = item.manufacturer;
        }
      }
    }

    // 4. Combine all SKU IDs (from opening stock + transactions)
    const allSkuIds = new Set<string>([
      ...Array.from(openingStockMap.keys()),
      ...Array.from(skuMovements.keys()),
    ]);

    let totalOpeningUnits = 0;
    let totalPurchasedUnits = 0;
    let totalSalesReturnUnits = 0;
    let totalSoldUnits = 0;
    let totalPurchaseReturnUnits = 0;
    let totalBreakageUnits = 0;
    let totalAdjustmentUnits = 0;
    let totalClosingUnits = 0;
    let lowStockSkuCount = 0;
    let varianceSkuCount = 0;

    const items: SkuRunningLedger[] = [];
    const defaultCoverageDays = BusinessCalcService.getDefaultCoverageDays();

    for (const prodId of Array.from(allSkuIds)) {
      const opening = openingStockMap.get(prodId);
      const movement = skuMovements.get(prodId);

      const hasOpeningStock = opening !== undefined;
      const openingStock = hasOpeningStock ? opening.qty : null;
      const hasTransactions = movement !== undefined;

      const productName = opening?.name || movement?.productName || 'Unknown SKU';
      
      let manufacturer = opening?.mfg;
      let manufacturerSource: 'opening_stock' | 'transaction' | null = manufacturer ? 'opening_stock' : null;
      
      if (!manufacturer && movement?.manufacturer) {
        manufacturer = movement.manufacturer;
        manufacturerSource = 'transaction';
      }

      const purchases = movement?.purchases || 0;
      const salesReturns = movement?.salesReturns || 0;
      const sales = movement?.sales || 0;
      const purchaseReturns = movement?.purchaseReturns || 0;
      const breakage = movement?.breakage || 0;
      const adjustments = movement?.adjustments || 0;

      // Deterministic Formula:
      // Closing = Opening + Purchases + Sales Returns - Sales - Purchase Returns - Breakage ± Adjustments
      let calculatedClosingStock: number | null = null;
      if (hasOpeningStock || hasTransactions) {
        calculatedClosingStock = Math.round(
          ((openingStock || 0) + purchases + salesReturns - sales - purchaseReturns - breakage + adjustments) * 100
        ) / 100;
      }

      // Compute average monthly sales for this product
      let avgMonthlySales: number | null = null;
      if (movement && movement.monthlySalesMap.size > 0) {
        const monthly = Array.from(movement.monthlySalesMap.values());
        const fullMonths = monthly.filter(m => m.count >= 5);
        if (fullMonths.length > 0) {
          const totalSales = fullMonths.reduce((sum, m) => sum + m.qty, 0);
          avgMonthlySales = Math.round(totalSales / fullMonths.length);
        } else {
          const totalSales = monthly.reduce((sum, m) => sum + m.qty, 0);
          avgMonthlySales = Math.round(totalSales / monthly.length);
        }
      }

      const reorderThreshold = BusinessCalcService.getReorderThreshold(avgMonthlySales) || 0;

      const customPolicy = this.customPolicies.get(prodId) || {};
      const policy: SkuReorderPolicy = {
        monthlyBaselineConsumption: avgMonthlySales || 0,
        reorderThreshold,
        safetyStock: customPolicy.safetyStock ?? 15,
        leadTimeDays: customPolicy.leadTimeDays ?? 3,
        defaultOrderQuantity: customPolicy.defaultOrderQuantity ?? 100,
      };

      // Get stock status & explanation from business-calc service
      const stockStatusResult = BusinessCalcService.getStockStatus(
        calculatedClosingStock, 
        avgMonthlySales, 
        hasOpeningStock, 
        openingStock
      );

      const isLowStock = stockStatusResult.status === 'Low Stock' || stockStatusResult.status === 'Reorder Now' || stockStatusResult.status === 'Out of Stock';

      // ERP reported closing stock (if opening stock is passed as ERP snapshot or matched)
      const erpReportedClosingStock = hasOpeningStock && !hasTransactions ? openingStock : undefined;
      const variance = erpReportedClosingStock !== undefined && calculatedClosingStock !== null
        ? Math.round((calculatedClosingStock - erpReportedClosingStock) * 100) / 100 
        : 0;
      
      const reconciliationStatus = variance === 0 
        ? (erpReportedClosingStock !== undefined ? 'RECONCILED' : 'CALCULATED_RUNNING') 
        : 'VARIANCE_DETECTED';

      if (variance !== 0) varianceSkuCount++;

      let recommendedOrderQuantity = 0;

      if (isLowStock && calculatedClosingStock !== null) {
        lowStockSkuCount++;
        // Recommended order qty: baseline order qty (100) or formula: (threshold * 3 - currentStock)
        recommendedOrderQuantity = Math.max(
          policy.defaultOrderQuantity,
          Math.round((policy.monthlyBaselineConsumption || 100) - calculatedClosingStock)
        );
      }

      // Collect data quality issues
      const dataQualityIssues: string[] = [];
      if (!hasOpeningStock) dataQualityIssues.push('No opening stock record found for this product.');
      if (!hasTransactions && hasOpeningStock) dataQualityIssues.push('No transactions found for this product.');
      if (openingStock !== null && openingStock < 0) dataQualityIssues.push(`Opening stock is negative (${openingStock}).`);
      if (calculatedClosingStock !== null && calculatedClosingStock < 0) dataQualityIssues.push('Calculated closing stock is negative.');
      if (!manufacturer) dataQualityIssues.push('Manufacturer information is not available.');

      totalOpeningUnits += (openingStock || 0);
      totalPurchasedUnits += purchases;
      totalSalesReturnUnits += salesReturns;
      totalSoldUnits += sales;
      totalPurchaseReturnUnits += purchaseReturns;
      totalBreakageUnits += breakage;
      totalAdjustmentUnits += adjustments;
      if (calculatedClosingStock !== null) totalClosingUnits += calculatedClosingStock;

      const ledgerItem: SkuRunningLedger = {
        productId: prodId,
        productName,
        manufacturer,
        manufacturerSource,
        unit: 'Units / Strips',
        openingStock,
        hasOpeningStock,
        purchases,
        salesReturns,
        sales,
        purchaseReturns,
        breakage,
        adjustments,
        calculatedClosingStock,
        erpReportedClosingStock,
        variance,
        reconciliationStatus,
        reorderPolicy: policy,
        isLowStock,
        stockStatus: stockStatusResult.status,
        recommendedOrderQuantity,
        reorderRationale: stockStatusResult.explanation,
        lastUpdated: new Date().toISOString(),
        dataQualityIssues,
      };

      // Filter by search & low stock
      if (params.search) {
        const q = params.search.toLowerCase();
        const matches = productName.toLowerCase().includes(q) || (manufacturer && manufacturer.toLowerCase().includes(q));
        if (!matches) continue;
      }

      if (params.lowStockOnly && !isLowStock) {
        continue;
      }

      items.push(ledgerItem);
    }

    // Sort items: Out of Stock > Reorder Now > Low Stock > Healthy / Others, then by sales
    const statusPriority = {
      'Out of Stock': 0,
      'Reorder Now': 1,
      'Low Stock': 2,
      'Needs Review': 3,
      'Missing Opening Data': 4,
      'Healthy': 5
    };

    items.sort((a, b) => {
      const pA = statusPriority[a.stockStatus] ?? 99;
      const pB = statusPriority[b.stockStatus] ?? 99;
      if (pA !== pB) return pA - pB;
      return b.sales - a.sales;
    });

    return {
      totalSkus: allSkuIds.size,
      totalOpeningUnits: Math.round(totalOpeningUnits * 100) / 100,
      totalPurchasedUnits: Math.round(totalPurchasedUnits * 100) / 100,
      totalSalesReturnUnits: Math.round(totalSalesReturnUnits * 100) / 100,
      totalSoldUnits: Math.round(totalSoldUnits * 100) / 100,
      totalPurchaseReturnUnits: Math.round(totalPurchaseReturnUnits * 100) / 100,
      totalBreakageUnits: Math.round(totalBreakageUnits * 100) / 100,
      totalAdjustmentUnits: Math.round(totalAdjustmentUnits * 100) / 100,
      totalClosingUnits: Math.round(totalClosingUnits * 100) / 100,
      lowStockSkuCount,
      varianceSkuCount,
      items,
    };
  }
}
