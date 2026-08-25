"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InventoryLedgerService = void 0;
const canonical_repositories_1 = require("@/infrastructure/repositories/canonical-repositories");
class InventoryLedgerService {
    // Default reorder policy: 100-unit monthly baseline, reorder at 25-strip threshold
    static defaultPolicy = {
        monthlyBaselineConsumption: 100,
        reorderThreshold: 25,
        safetyStock: 15,
        leadTimeDays: 3,
        defaultOrderQuantity: 100,
    };
    // Custom SKU-level policy overrides
    static customPolicies = new Map();
    static setSkuReorderPolicy(productId, policy) {
        this.customPolicies.set(productId, policy);
    }
    static getSkuReorderPolicy(productId) {
        const custom = this.customPolicies.get(productId);
        return {
            ...this.defaultPolicy,
            ...custom,
        };
    }
    /**
     * Computes the real SKU running inventory ledger:
     * Closing Stock = Opening Stock + Purchases + Sales Returns - Sales - Purchase Returns - Breakage ± Adjustments
     */
    static async computeRunningLedger(params = {}) {
        // 1. Fetch opening stock
        const openingStockList = await canonical_repositories_1.inventoryRepository.list();
        const openingStockMap = new Map();
        for (const inv of openingStockList) {
            openingStockMap.set(inv.productId, {
                qty: inv.quantityOnHand,
                name: inv.productName,
                mfg: inv.manufacturer,
            });
        }
        // 2. Fetch all journal transactions
        const allTransactions = await canonical_repositories_1.transactionRepository.getAll();
        const skuMovements = new Map();
        for (const tx of allTransactions) {
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
                    };
                    skuMovements.set(prodId, acc);
                }
                const qty = item.quantity;
                if (tx.type === 'purchase') {
                    acc.purchases += qty;
                }
                else if (tx.type === 'sale_return') {
                    acc.salesReturns += qty;
                }
                else if (tx.type === 'sale') {
                    acc.sales += qty;
                }
                else if (tx.type === 'purchase_return') {
                    acc.purchaseReturns += qty;
                }
                else if (tx.type === 'breakage') {
                    acc.breakage += qty;
                }
                else if (tx.type === 'stock_adjustment') {
                    acc.adjustments += qty;
                }
                if (item.manufacturer && !acc.manufacturer) {
                    acc.manufacturer = item.manufacturer;
                }
            }
        }
        // 4. Combine all SKU IDs (from opening stock + transactions)
        const allSkuIds = new Set([
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
        const items = [];
        for (const prodId of Array.from(allSkuIds)) {
            const opening = openingStockMap.get(prodId);
            const movement = skuMovements.get(prodId);
            const openingStock = opening ? opening.qty : 0;
            const productName = opening?.name || movement?.productName || 'Unknown SKU';
            const manufacturer = opening?.mfg || movement?.manufacturer;
            const purchases = movement?.purchases || 0;
            const salesReturns = movement?.salesReturns || 0;
            const sales = movement?.sales || 0;
            const purchaseReturns = movement?.purchaseReturns || 0;
            const breakage = movement?.breakage || 0;
            const adjustments = movement?.adjustments || 0;
            // Deterministic Formula:
            // Closing = Opening + Purchases + Sales Returns - Sales - Purchase Returns - Breakage ± Adjustments
            const calculatedClosingStock = Math.round((openingStock + purchases + salesReturns - sales - purchaseReturns - breakage + adjustments) * 100) / 100;
            // ERP reported closing stock (if opening stock is passed as ERP snapshot or matched)
            const erpReportedClosingStock = openingStock > 0 && movement === undefined ? openingStock : undefined;
            const variance = erpReportedClosingStock !== undefined
                ? Math.round((calculatedClosingStock - erpReportedClosingStock) * 100) / 100
                : 0;
            const reconciliationStatus = variance === 0
                ? (erpReportedClosingStock !== undefined ? 'RECONCILED' : 'CALCULATED_RUNNING')
                : 'VARIANCE_DETECTED';
            if (variance !== 0)
                varianceSkuCount++;
            // Reorder Policy: 100-unit monthly baseline, 25-strip threshold
            const policy = this.getSkuReorderPolicy(prodId);
            const isLowStock = calculatedClosingStock <= policy.reorderThreshold;
            let recommendedOrderQuantity = 0;
            let reorderRationale;
            if (isLowStock) {
                lowStockSkuCount++;
                // Recommended order qty: baseline order qty (100) or formula: (threshold * 3 - currentStock)
                recommendedOrderQuantity = Math.max(policy.defaultOrderQuantity, Math.round(policy.monthlyBaselineConsumption - calculatedClosingStock));
                reorderRationale = `Current stock (${calculatedClosingStock}) is at or below threshold (${policy.reorderThreshold} strips). Recommended order: ${recommendedOrderQuantity} strips based on ${policy.monthlyBaselineConsumption} units/month consumption baseline.`;
            }
            totalOpeningUnits += openingStock;
            totalPurchasedUnits += purchases;
            totalSalesReturnUnits += salesReturns;
            totalSoldUnits += sales;
            totalPurchaseReturnUnits += purchaseReturns;
            totalBreakageUnits += breakage;
            totalAdjustmentUnits += adjustments;
            totalClosingUnits += calculatedClosingStock;
            const ledgerItem = {
                productId: prodId,
                productName,
                manufacturer,
                unit: 'Units / Strips',
                openingStock,
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
                recommendedOrderQuantity,
                reorderRationale,
                lastUpdated: new Date().toISOString(),
            };
            // Filter by search & low stock
            if (params.search) {
                const q = params.search.toLowerCase();
                const matches = productName.toLowerCase().includes(q) || (manufacturer && manufacturer.toLowerCase().includes(q));
                if (!matches)
                    continue;
            }
            if (params.lowStockOnly && !isLowStock) {
                continue;
            }
            items.push(ledgerItem);
        }
        // Sort items: low stock first, then by sales volume descending
        items.sort((a, b) => {
            if (a.isLowStock && !b.isLowStock)
                return -1;
            if (!a.isLowStock && b.isLowStock)
                return 1;
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
exports.InventoryLedgerService = InventoryLedgerService;
