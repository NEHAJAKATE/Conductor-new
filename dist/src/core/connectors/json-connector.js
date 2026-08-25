"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JsonConnector = void 0;
const parser_factory_1 = require("@/core/parser/parser-factory");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
class JsonConnector {
    r2Service;
    type = 'json';
    displayName = 'JSON Collection';
    description = 'Connector for ingesting structured JSON lists and document objects.';
    constructor(r2Service) {
        this.r2Service = r2Service;
    }
    describeConnectionSchema() {
        return {
            type: 'object',
            properties: {
                filePath: { type: 'string' },
            },
            required: ['filePath'],
        };
    }
    async testConnection(connection) {
        const filePath = connection.config.filePath;
        if (!filePath) {
            throw new Error('JSON connector requires a filePath configuration.');
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
                metadata: { sourceType: 'json', fileName },
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
        const parsed = parser_factory_1.ParserFactory.parse(buffer, 'json');
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
                source: 'json',
            },
        };
    }
    async inferSchema(connection, datasetId) {
        const filePath = connection.config.filePath;
        const buffer = await this.getBuffer(filePath);
        const parsed = parser_factory_1.ParserFactory.parse(buffer, 'json');
        return {
            fields: parsed.headers.map(h => ({ name: h, type: 'string', nullable: true })),
            version: '1.0',
        };
    }
    async validateDataset(connection, datasetId) {
        const filePath = connection.config.filePath;
        const buffer = await this.getBuffer(filePath);
        const parsed = parser_factory_1.ParserFactory.parse(buffer, 'json');
        return {
            valid: true,
            issues: [],
            recordCount: parsed.rows.length,
        };
    }
    async registerDataset(connection, dataset) {
        return { ...dataset, metadata: { ...dataset.metadata, registered: true } };
    }
    async ingestDataset(connection, dataset, options) {
        const filePath = connection.config.filePath;
        const buffer = await this.getBuffer(filePath);
        const parsed = parser_factory_1.ParserFactory.parse(buffer, 'json');
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
            jobId: `json-${dataset.id}-${Date.now()}`,
            status: 'completed',
            metadata: { rawPath, bronzePath: rawPath, rowCount: records.length },
        };
    }
    async extractMetadata(connection, datasetId) {
        return { source: 'json' };
    }
}
exports.JsonConnector = JsonConnector;
