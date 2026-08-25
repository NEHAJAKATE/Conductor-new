"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const csv_parse_1 = require("csv-parse");
async function forensicPurchaseGap() {
    const filePath = path_1.default.resolve(process.cwd(), 'data', 'atc_sample_data', 'date_wise_sale_&_purchase_analysis.csv');
    console.log(`[Task 2 Forensic] Reading ${filePath}...`);
    let rawGrossPurchasesFloat = 0;
    let rawGrossPurchasesPaisa = 0;
    let rawPurchaseReturnsFloat = 0;
    let rawPurchaseReturnsPaisa = 0;
    let purcCount = 0;
    let preCount = 0;
    let unknownTypeRows = [];
    const parser = fs_1.default.createReadStream(filePath).pipe((0, csv_parse_1.parse)({
        columns: true,
        skip_empty_lines: true,
        trim: true,
    }));
    let rowIndex = 0;
    for await (const row of parser) {
        rowIndex++;
        const type2 = String(row.TYPE2 || '').trim();
        const amountStr = String(row.AMOUNT || '').trim();
        const amountFloat = parseFloat(amountStr) || 0;
        const amountPaisa = Math.round(Math.abs(amountFloat) * 100);
        if (type2 === 'PURC') {
            purcCount++;
            rawGrossPurchasesFloat += Math.abs(amountFloat);
            rawGrossPurchasesPaisa += amountPaisa;
        }
        else if (type2 === 'P/Re') {
            preCount++;
            rawPurchaseReturnsFloat += Math.abs(amountFloat);
            rawPurchaseReturnsPaisa += amountPaisa;
        }
        else if (type2.toLowerCase().includes('purc') || type2.toLowerCase().includes('p/re')) {
            unknownTypeRows.push({ rowIndex, type2, row });
        }
    }
    console.log(`\n--- RAW ROW COUNTS ---`);
    console.log(`Total Rows Parsed: ${rowIndex}`);
    console.log(`PURC Rows: ${purcCount}`);
    console.log(`P/Re Rows: ${preCount}`);
    console.log(`Any edge-case unhandled purchase rows: ${unknownTypeRows.length}`);
    console.log(`\n--- FLOAT-ACCUMULATOR SUMS (JS Standard Floats) ---`);
    console.log(`Gross Purchases (Float): ₹${rawGrossPurchasesFloat.toFixed(4)}`);
    console.log(`Purchase Returns (Float): ₹${rawPurchaseReturnsFloat.toFixed(4)}`);
    const netFloat = rawGrossPurchasesFloat - rawPurchaseReturnsFloat;
    console.log(`Net Purchases (Float subtraction): ₹${netFloat.toFixed(4)}`);
    console.log(`\n--- INTEGER-PAISA ACCUMULATOR SUMS (Exact Cents) ---`);
    console.log(`Gross Purchases (Paisa): ${rawGrossPurchasesPaisa} paise = ₹${(rawGrossPurchasesPaisa / 100).toFixed(2)}`);
    console.log(`Purchase Returns (Paisa): ${rawPurchaseReturnsPaisa} paise = ₹${(rawPurchaseReturnsPaisa / 100).toFixed(2)}`);
    const netPaisa = rawGrossPurchasesPaisa - rawPurchaseReturnsPaisa;
    console.log(`Net Purchases (Paisa subtraction): ${netPaisa} paise = ₹${(netPaisa / 100).toFixed(2)}`);
    console.log(`\n--- TARGET COMPARISON ---`);
    console.log(`Target: ₹93,642,186.16`);
    console.log(`Float Output: ₹${netFloat.toFixed(2)} (Gap: ${(netFloat - 93642186.16).toFixed(4)})`);
    console.log(`Paisa Output: ₹${(netPaisa / 100).toFixed(2)} (Gap: ${(netPaisa / 100 - 93642186.16).toFixed(4)})`);
}
forensicPurchaseGap().catch(console.error);
