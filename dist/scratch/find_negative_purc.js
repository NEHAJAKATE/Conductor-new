"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const csv_parse_1 = require("csv-parse");
async function findNegativePurc() {
    const filePath = path_1.default.resolve(process.cwd(), 'data', 'atc_sample_data', 'date_wise_sale_&_purchase_analysis.csv');
    const parser = fs_1.default.createReadStream(filePath).pipe((0, csv_parse_1.parse)({ columns: true, skip_empty_lines: true, trim: true }));
    let rowIndex = 0;
    for await (const row of parser) {
        rowIndex++;
        const type2 = String(row.TYPE2 || '').trim();
        const amountStr = String(row.AMOUNT || '').trim();
        const rawFloat = parseFloat(amountStr) || 0;
        if (type2 === 'Purc' && rawFloat < 0) {
            console.log('FOUND NEGATIVE PURC ROW:');
            console.log(`Row Index: ${rowIndex}`);
            console.log(JSON.stringify(row, null, 2));
        }
    }
}
findNegativePurc().catch(console.error);
