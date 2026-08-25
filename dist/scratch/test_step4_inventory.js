"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const erp_adapter_1 = require("../src/core/adapters/erp-adapter");
const inventory_ledger_service_1 = require("../src/core/inventory/inventory-ledger.service");
const canonical_repositories_1 = require("../src/infrastructure/repositories/canonical-repositories");
async function testInventoryLedger() {
    console.log('Testing Step 4 & Step 5: Inventory Running Ledger & 25-Strip Reorder Rule...');
    // 1. Ingest Opening stock
    const openingStockPath = path_1.default.resolve(process.cwd(), 'data', 'atc_sample_data', 'OPENING STOCK.XLS');
    const { inventory } = await erp_adapter_1.ErpAdapter.ingestStock(openingStockPath);
    await canonical_repositories_1.inventoryRepository.saveBatch(inventory);
    console.log(`Saved ${inventory.length} opening stock items to repository.`);
    // 2. Ingest Journal Transactions
    const journalPath = path_1.default.resolve(process.cwd(), 'data', 'atc_sample_data', 'date_wise_sale_&_purchase_analysis.csv');
    const { transactions } = await erp_adapter_1.ErpAdapter.ingestJournal(journalPath);
    await canonical_repositories_1.transactionRepository.saveBatch(transactions);
    console.log(`Saved ${transactions.length} transactions to repository.`);
    // 3. Compute running ledger
    const summary = await inventory_ledger_service_1.InventoryLedgerService.computeRunningLedger();
    console.log('\n--- INVENTORY RUNNING LEDGER SUMMARY ---');
    console.log(`Total SKUs: ${summary.totalSkus}`);
    console.log(`Total Opening Stock: ${summary.totalOpeningUnits} units`);
    console.log(`Total Purchased: +${summary.totalPurchasedUnits} units`);
    console.log(`Total Sales Returns: +${summary.totalSalesReturnUnits} units`);
    console.log(`Total Sold: -${summary.totalSoldUnits} units`);
    console.log(`Total Purchase Returns: -${summary.totalPurchaseReturnUnits} units`);
    console.log(`Total Breakage: -${summary.totalBreakageUnits} units`);
    console.log(`Total Adjustments: ±${summary.totalAdjustmentUnits} units`);
    console.log(`CALCULATED CLOSING STOCK: ${summary.totalClosingUnits} units`);
    console.log(`Low Stock SKUs (≤25 strips): ${summary.lowStockSkuCount}`);
    // 4. Test a specific test SKU
    const testSku = summary.items[0];
    console.log(`\nSample SKU: ${testSku.productName} (${testSku.manufacturer || 'General'})`);
    console.log(`  Opening: ${testSku.openingStock}`);
    console.log(`  + Purchases: ${testSku.purchases}`);
    console.log(`  + Sales Returns: ${testSku.salesReturns}`);
    console.log(`  - Sales: ${testSku.sales}`);
    console.log(`  - Purchase Returns: ${testSku.purchaseReturns}`);
    console.log(`  - Breakage: ${testSku.breakage}`);
    console.log(`  ± Adjustments: ${testSku.adjustments}`);
    console.log(`  = Calculated Closing Stock: ${testSku.calculatedClosingStock}`);
    console.log(`  Is Low Stock (threshold <= 25): ${testSku.isLowStock}`);
    console.log(`  Recommended Reorder: ${testSku.recommendedOrderQuantity}`);
    console.log(`  Rationale: ${testSku.reorderRationale}`);
    const manualClosing = Math.round((testSku.openingStock + testSku.purchases + testSku.salesReturns - testSku.sales - testSku.purchaseReturns - testSku.breakage + testSku.adjustments) * 100) / 100;
    if (testSku.calculatedClosingStock === manualClosing) {
        console.log(`\n>>> SKU Arithmetic Check PASSED: Calculated (${testSku.calculatedClosingStock}) === Manual (${manualClosing}) <<<`);
    }
    else {
        console.error(`\n>>> SKU Arithmetic Check FAILED! <<<`);
        process.exit(1);
    }
    // 5. Test 25-strip reorder trigger
    const lowStockItem = summary.items.find(i => i.isLowStock);
    if (lowStockItem) {
        if (lowStockItem.calculatedClosingStock <= 25) {
            console.log(`>>> Reorder Rule PASSED: Low stock triggered at stock=${lowStockItem.calculatedClosingStock} (<= 25) with threshold=${lowStockItem.reorderPolicy.reorderThreshold} <<<`);
        }
        else {
            console.error(`>>> Reorder Rule FAILED: Item flagged as low stock with stock > 25! <<<`);
            process.exit(1);
        }
    }
    console.log('\n=====================================================================');
    console.log('>>> STEP 4 & STEP 5 PASSED: Inventory Running Ledger & 25-Strip Rule Verified! <<<');
    console.log('=====================================================================\n');
}
testInventoryLedger().catch(err => {
    console.error(err);
    process.exit(1);
});
