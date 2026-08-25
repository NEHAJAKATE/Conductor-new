"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const csv_parse_1 = require("csv-parse");
async function findDistinctTypes() {
    const filePath = path_1.default.resolve(process.cwd(), 'data', 'atc_sample_data', 'date_wise_sale_&_purchase_analysis.csv');
    const parser = fs_1.default.createReadStream(filePath).pipe((0, csv_parse_1.parse)({
        columns: true,
        skip_empty_lines: true,
        trim: true,
    }));
    const typeCounts = {};
    for await (const row of parser) {
        const type2 = String(row.TYPE2 || 'EMPTY');
        const amountFloat = Math.abs(parseFloat(String(row.AMOUNT || '0')) || 0);
        const amountPaisa = Math.round(amountFloat * 100);
        if (!typeCounts[type2]) {
            typeCounts[type2] = { count: 0, floatSum: 0, paisaSum: 0, sampleRow: row };
        }
        typeCounts[type2].count++;
        typeCounts[type2].floatSum += amountFloat;
        typeCounts[type2].paisaSum += amountPaisa;
    }
    console.log('=== DISTINCT TYPE2 VALUES IN RAW CSV ===\n');
    for (const [t, data] of Object.entries(typeCounts)) {
        console.log(`TYPE2: "${t}" (Length: ${t.length}, Repr: ${JSON.stringify(t)})`);
        console.log(`  Count: ${data.count}`);
        console.log(`  Float Sum: ₹${data.floatSum.toFixed(4)}`);
        console.log(`  Paisa Sum: ${data.paisaSum} paise = ₹${(data.paisaSum / 100).toFixed(2)}`);
        console.log(`  Sample VCN: ${data.sampleRow.VCN}, PNAME: ${data.sampleRow.PNAME}\n`);
    }
}
findDistinctTypes().catch(console.error);
