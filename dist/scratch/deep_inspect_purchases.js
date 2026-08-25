"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const csv_parse_1 = require("csv-parse");
async function deepInspectPurchases() {
    const filePath = path_1.default.resolve(process.cwd(), 'data', 'atc_sample_data', 'date_wise_sale_&_purchase_analysis.csv');
    const parser = fs_1.default.createReadStream(filePath).pipe((0, csv_parse_1.parse)({
        columns: true,
        skip_empty_lines: true,
        trim: true,
    }));
    let purcFloatSum = 0;
    let purcPaisaSum = 0;
    let preFloatSum = 0;
    let prePaisaSum = 0;
    let purcNegativeCount = 0;
    let prePositiveCount = 0;
    let nonTwoDecimalRows = [];
    let priceAdjPurcRows = [];
    let rowIndex = 0;
    for await (const row of parser) {
        rowIndex++;
        const type2 = String(row.TYPE2 || '').trim();
        const amountStr = String(row.AMOUNT || '').trim();
        if (!type2 || !amountStr)
            continue;
        const rawFloat = parseFloat(amountStr);
        if (isNaN(rawFloat))
            continue;
        // Check decimal representation
        const parts = amountStr.split('.');
        if (parts.length === 2 && parts[1].length > 2) {
            nonTwoDecimalRows.push({ rowIndex, type2, amountStr, row });
        }
        if (type2 === 'Purc') {
            if (rawFloat < 0)
                purcNegativeCount++;
            purcFloatSum += Math.abs(rawFloat);
            purcPaisaSum += Math.round(Math.abs(rawFloat) * 100);
        }
        else if (type2 === 'P/Re') {
            if (rawFloat > 0)
                prePositiveCount++;
            preFloatSum += Math.abs(rawFloat);
            prePaisaSum += Math.round(Math.abs(rawFloat) * 100);
        }
        else if (type2 === 'Pric') {
            priceAdjPurcRows.push({ rowIndex, type2, amountStr, vcn: row.VCN, pname: row.PNAME });
        }
    }
    console.log('=== PURCHASES DEEP INSPECTION ===');
    console.log(`Non-2-decimal rows: ${nonTwoDecimalRows.length}`);
    if (nonTwoDecimalRows.length > 0) {
        console.log('Sample non-2-decimal rows:', nonTwoDecimalRows.slice(0, 5));
    }
    console.log(`\nPurc rows with negative sign: ${purcNegativeCount}`);
    console.log(`P/Re rows with positive sign: ${prePositiveCount}`);
    console.log(`\nPrice adjustments (Pric): ${priceAdjPurcRows.length}`);
    console.log(priceAdjPurcRows);
    console.log('\n--- RAW SUMS ---');
    console.log(`Gross Purc (13073 rows): Float = ${purcFloatSum.toFixed(4)}, Paisa = ${purcPaisaSum} (${(purcPaisaSum / 100).toFixed(2)})`);
    console.log(`P/Re (93 rows):          Float = ${preFloatSum.toFixed(4)}, Paisa = ${prePaisaSum} (${(prePaisaSum / 100).toFixed(2)})`);
    console.log(`Net Purc (Gross - P/Re): Float = ${(purcFloatSum - preFloatSum).toFixed(4)}, Paisa = ${purcPaisaSum - prePaisaSum} (${((purcPaisaSum - prePaisaSum) / 100).toFixed(2)})`);
    // Check if any sum of individual row amounts with exact string decimals yields something else
    let exactDecimalPurcSum = BigInt(0);
    let exactDecimalPreSum = BigInt(0);
    // Reset stream
    const parser2 = fs_1.default.createReadStream(filePath).pipe((0, csv_parse_1.parse)({ columns: true, skip_empty_lines: true, trim: true }));
    for await (const row of parser2) {
        const type2 = String(row.TYPE2 || '').trim();
        const amountStr = String(row.AMOUNT || '').trim();
        if (!type2 || !amountStr)
            continue;
        const cleanStr = amountStr.replace('-', '').trim();
        const [intPart, decPart = ''] = cleanStr.split('.');
        const paddedDec = (decPart + '00').slice(0, 2);
        const cents = BigInt(intPart || '0') * BigInt(100) + BigInt(paddedDec);
        if (type2 === 'Purc') {
            exactDecimalPurcSum += cents;
        }
        else if (type2 === 'P/Re') {
            exactDecimalPreSum += cents;
        }
    }
    console.log('\n--- EXACT BIGINT (STRING PARSED) SUMS ---');
    console.log(`Gross Purc (BigInt): ${exactDecimalPurcSum} paise = ₹${Number(exactDecimalPurcSum) / 100}`);
    console.log(`P/Re (BigInt):       ${exactDecimalPreSum} paise = ₹${Number(exactDecimalPreSum) / 100}`);
    console.log(`Net Purc (BigInt):   ${exactDecimalPurcSum - exactDecimalPreSum} paise = ₹${Number(exactDecimalPurcSum - exactDecimalPreSum) / 100}`);
}
deepInspectPurchases().catch(console.error);
