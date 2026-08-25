"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const parser_factory_1 = require("../src/core/parser/parser-factory");
async function inspectBank() {
    const filePath = path_1.default.resolve(process.cwd(), 'data', 'atc_sample_data', 'BANK & CASH LEDGERS.XLS');
    const buffer = await fs_1.default.promises.readFile(filePath);
    const parsed = parser_factory_1.ParserFactory.parse(buffer, '.xls');
    console.log('Bank File Headers:', parsed.headers);
    console.log('Total Rows:', parsed.rows.length);
    console.log('Sample Rows (first 10):');
    parsed.rows.slice(0, 10).forEach((r, i) => {
        console.log(`Row ${i + 1}:`, r);
    });
}
inspectBank().catch(console.error);
