"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const csv_parse_1 = require("csv-parse");
async function checkAllNegativeRows() {
    const filePath = path_1.default.resolve(process.cwd(), 'data', 'atc_sample_data', 'date_wise_sale_&_purchase_analysis.csv');
    const parser = fs_1.default.createReadStream(filePath).pipe((0, csv_parse_1.parse)({ columns: true, skip_empty_lines: true, trim: true }));
    let rowIndex = 0;
    const negativeRowsByType = {};
    for await (const row of parser) {
        rowIndex++;
        const type2 = String(row.TYPE2 || '').trim();
        const amountStr = String(row.AMOUNT || '').trim();
        const rawFloat = parseFloat(amountStr);
        if (rawFloat < 0) {
            if (!negativeRowsByType[type2])
                negativeRowsByType[type2] = [];
            negativeRowsByType[type2].push({ rowIndex, amountStr, vcn: row.VCN, name: row.NAME, pname: row.PNAME });
        }
    }
    console.log('=== NEGATIVE ROWS BY TYPE ===');
    for (const [t, rows] of Object.entries(negativeRowsByType)) {
        console.log(`TYPE: "${t}" has ${rows.length} negative rows:`);
        if (rows.length <= 10) {
            console.log(rows);
        }
        else {
            console.log(`(Showing first 3 of ${rows.length})`, rows.slice(0, 3));
        }
    }
}
checkAllNegativeRows().catch(console.error);
