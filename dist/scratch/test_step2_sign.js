"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const erp_adapter_1 = require("../src/core/adapters/erp-adapter");
async function testStep2Sign() {
    console.log('Testing Step 2 Sign Correction...');
    const journalPath = path_1.default.resolve(process.cwd(), 'data', 'atc_sample_data', 'date_wise_sale_&_purchase_analysis.csv');
    const { transactions, report } = await erp_adapter_1.ErpAdapter.ingestJournal(journalPath);
    console.log(`Ingested ${transactions.length} transactions in ${report.durationMs}ms`);
    let salesGross = 0;
    let salesReturns = 0;
    let salesTax = 0;
    let salesReturnTax = 0;
    let purcGross = 0;
    let purcReturns = 0;
    let purcTax = 0;
    let purcReturnTax = 0;
    let saleCount = 0;
    let saleReturnCount = 0;
    let purcCount = 0;
    let purcReturnCount = 0;
    for (const tx of transactions) {
        if (tx.type === 'sale') {
            salesGross += tx.netAmount;
            salesTax += tx.taxAmount;
            saleCount++;
        }
        else if (tx.type === 'sale_return') {
            salesReturns += tx.netAmount;
            salesReturnTax += tx.taxAmount;
            saleReturnCount++;
        }
        else if (tx.type === 'purchase') {
            purcGross += tx.netAmount;
            purcTax += tx.taxAmount;
            purcCount++;
        }
        else if (tx.type === 'purchase_return') {
            purcReturns += tx.netAmount;
            purcReturnTax += tx.taxAmount;
            purcReturnCount++;
        }
    }
    const calculatedNetSales = salesGross - salesReturns;
    const calculatedNetPurchases = purcGross - purcReturns;
    const calculatedNetOutputGst = salesTax - salesReturnTax;
    const calculatedNetInputGst = purcTax - purcReturnTax;
    console.log('\n--- CALCULATED METRICS ---');
    console.log(`Gross Sales (${saleCount} tx): ₹${salesGross.toFixed(2)}`);
    console.log(`Sales Returns (${saleReturnCount} tx): ₹${salesReturns.toFixed(2)}`);
    console.log(`NET SALES: ₹${calculatedNetSales.toFixed(2)} (Expected: ₹95052611.91)`);
    console.log(`NET OUTPUT GST: ₹${calculatedNetOutputGst.toFixed(2)} (Expected: ₹5511760.17)`);
    console.log(`\nGross Purchases (${purcCount} tx): ₹${purcGross.toFixed(2)}`);
    console.log(`Purchase Returns (${purcReturnCount} tx): ₹${purcReturns.toFixed(2)}`);
    console.log(`NET PURCHASES: ₹${calculatedNetPurchases.toFixed(2)} (Expected: ₹93642186.16)`);
    console.log(`NET INPUT GST: ₹${calculatedNetInputGst.toFixed(2)} (Expected: ₹5445471.55)`);
    const salesDiff = Math.abs(calculatedNetSales - 95052611.91);
    const purcDiff = Math.abs(calculatedNetPurchases - 93642186.16);
    console.log(`\nSales difference: ${salesDiff.toFixed(4)}, Purchase difference: ${purcDiff.toFixed(4)}`);
    if (salesDiff < 0.1 && purcDiff < 0.1) {
        console.log('\n=====================================================================');
        console.log('>>> STEP 2 PASSED: Net Sales = ₹95,052,611.91, Net Purchases = ₹93,642,186.16 to the rupee! <<<');
        console.log('=====================================================================\n');
    }
    else {
        console.error('\n>>> STEP 2 FAILED: Numbers do not match! <<<');
        process.exit(1);
    }
}
testStep2Sign().catch(err => {
    console.error(err);
    process.exit(1);
});
