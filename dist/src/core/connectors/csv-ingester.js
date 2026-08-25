"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CsvIngester = void 0;
const fs_1 = __importDefault(require("fs"));
const csv_parse_1 = require("csv-parse");
const raw_store_1 = require("@/infrastructure/storage/raw-store");
class CsvIngester {
    r2Service;
    rawStore = new raw_store_1.RawStore();
    constructor(r2Service) {
        this.r2Service = r2Service;
    }
    async ingest(filePath, schema, options) {
        const delimiter = options.destination?.delimiter ?? ',';
        const encoding = (options.destination?.encoding ?? 'utf8');
        const header = options.destination?.header ?? true;
        const parserOptions = {
            delimiter,
            bom: true,
            relaxQuotes: true,
            trim: true,
            skip_empty_lines: true,
            from_line: header ? 2 : 1,
        };
        let rowCount = 0;
        const records = [];
        let stream;
        if (filePath.startsWith('r2://') && this.r2Service) {
            const objectKey = filePath.replace(/^r2:\/\/[^\/]+\//, '');
            console.log(`[CsvIngester] Streaming ingestion source directly from R2 objectKey: ${objectKey}`);
            stream = await this.r2Service.getReadStream(objectKey);
        }
        else {
            console.log(`[CsvIngester] Streaming ingestion source from local file: ${filePath}`);
            stream = fs_1.default.createReadStream(filePath, { encoding });
        }
        const parser = (0, csv_parse_1.parse)(parserOptions);
        return new Promise((resolve, reject) => {
            stream.pipe(parser);
            parser.on('readable', () => {
                let row;
                while ((row = parser.read()) !== null) {
                    rowCount += 1;
                    const record = {};
                    for (let index = 0; index < schema.fields.length; index += 1) {
                        record[schema.fields[index].name] = row[index] ?? null;
                    }
                    records.push(record);
                }
            });
            parser.on('end', async () => {
                try {
                    const result = await this.rawStore.writeRecords(options.destination?.datasetId ?? 'csv', records);
                    resolve({ path: result.filePath, rows: result.rowCount });
                }
                catch (error) {
                    reject(error);
                }
            });
            parser.on('error', reject);
            stream.on('error', reject);
        });
    }
}
exports.CsvIngester = CsvIngester;
