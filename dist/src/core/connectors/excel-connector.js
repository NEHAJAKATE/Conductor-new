"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExcelConnector = void 0;
const parser_factory_1 = require("@/core/parser/parser-factory");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
class ExcelConnector {
    r2Service;
    type = 'excel';
    displayName = 'Excel Spreadsheet';
    description = 'Connector for ingesting .xlsx and .xls workbooks with automatic sheet parsing.';
    constructor(r2Service) {
        this.r2Service = r2Service;
    }
    describeConnectionSchema() {
        return {
            type: 'object',
            properties: {
                filePath: { type: 'string' },
                sheetName: { type: 'string', default: '' },
            },
            required: ['filePath'],
        };
    }
    async testConnection(connection) {
        const filePath = connection.config.filePath;
        if (!filePath) {
            throw new Error('Excel connector requires a filePath configuration.');
        }
    }
    async discoverDatasets(connection) {
        const filePath = connection.config.filePath;
        const fileName = filePath.split(/[\\/]/).pop() ?? filePath;
        return [
            {
                id: filePath,
                connectionId: connection.id,
                sourceName: filePath,
                displayName: fileName,
                metadata: { sourceType: 'excel', fileName },
            },
        ];
    }
    async getBuffer(filePath) {
        let stream;
        if (filePath.startsWith('r2://') && this.r2Service) {
            const key = filePath.replace(/^r2:\/\/[^\/]+\//, '');
            stream = await this.r2Service.getReadStream(key);
        }
        else {
            stream = fs_1.default.createReadStream(filePath);
        }
        const chunks = [];
        for await (const chunk of stream) {
            chunks.push(chunk);
        }
        return Buffer.concat(chunks);
    }
    async previewDataset(connection, datasetId, options) {
        const filePath = connection.config.filePath;
        const buffer = await this.getBuffer(filePath);
        const parsed = parser_factory_1.ParserFactory.parse(buffer, 'xlsx');
        const limitRows = parsed.rows.slice(0, options.limit);
        const rows = limitRows.map(r => {
            const item = {};
            parsed.headers.forEach((h, idx) => {
                item[h] = r[idx] ?? null;
            });
            return item;
        });
        const fields = parsed.headers.map(h => ({
            name: h,
            type: 'string',
            nullable: true,
        }));
        return {
            rows,
            schema: { fields, version: '1.0' },
            metadata: {
                datasetId,
                rowCount: parsed.rows.length,
                headerCount: parsed.headers.length,
                source: 'excel',
            },
        };
    }
    async inferSchema(connection, datasetId) {
        const filePath = connection.config.filePath;
        const buffer = await this.getBuffer(filePath);
        const parsed = parser_factory_1.ParserFactory.parse(buffer, 'xlsx');
        return {
            fields: parsed.headers.map(h => ({ name: h, type: 'string', nullable: true })),
            version: '1.0',
        };
    }
    async validateDataset(connection, datasetId) {
        const filePath = connection.config.filePath;
        const buffer = await this.getBuffer(filePath);
        const parsed = parser_factory_1.ParserFactory.parse(buffer, 'xlsx');
        const missingValues = parsed.rows.reduce((sum, row) => sum + row.filter(c => c.trim() === '').length, 0);
        return {
            valid: true,
            issues: missingValues > 0 ? [
                {
                    field: '*',
                    severity: 'warning',
                    code: 'missing_values',
                    message: `${missingValues} blank cells found in sheet rows.`,
                }
            ] : [],
            recordCount: parsed.rows.length,
        };
    }
    async registerDataset(connection, dataset) {
        return { ...dataset, metadata: { ...dataset.metadata, registered: true } };
    }
    async ingestDataset(connection, dataset, options) {
        const filePath = connection.config.filePath;
        const buffer = await this.getBuffer(filePath);
        const parsed = parser_factory_1.ParserFactory.parse(buffer, 'xlsx');
        const rawDir = path_1.default.resolve(process.cwd(), 'data', 'raw');
        fs_1.default.mkdirSync(rawDir, { recursive: true });
        const rawPath = path_1.default.join(rawDir, `${dataset.id.replace(/[^a-zA-Z0-9-_]/g, '_')}-${Date.now()}.ndjson`);
        const records = parsed.rows.map(r => {
            const item = {};
            parsed.headers.forEach((h, idx) => {
                item[h] = r[idx] ?? null;
            });
            return item;
        });
        const lines = records.map(rec => JSON.stringify(rec)).join('\n') + '\n';
        await fs_1.default.promises.writeFile(rawPath, lines);
        return {
            jobId: `excel-${dataset.id}-${Date.now()}`,
            status: 'completed',
            metadata: { rawPath, bronzePath: rawPath, rowCount: records.length },
        };
    }
    async extractMetadata(connection, datasetId) {
        return { source: 'excel' };
    }
}
exports.ExcelConnector = ExcelConnector;
