"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FolderConnector = void 0;
const parser_factory_1 = require("@/core/parser/parser-factory");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
class FolderConnector {
    r2Service;
    type = 'folder';
    displayName = 'Folder Upload';
    description = 'Connector for bulk ingesting multi-file directory folders containing CSV, Excel, JSON, and Parquet.';
    constructor(r2Service) {
        this.r2Service = r2Service;
    }
    describeConnectionSchema() {
        return {
            type: 'object',
            properties: {
                filePath: { type: 'string' }, // Folder path
            },
            required: ['filePath'],
        };
    }
    async testConnection(connection) {
        const filePath = connection.config.filePath;
        if (!filePath) {
            throw new Error('Folder connector requires a filePath configuration.');
        }
    }
    async discoverDatasets(connection) {
        const folderPath = connection.config.filePath;
        const datasets = [];
        const files = await this.scanFolder(folderPath);
        for (const file of files) {
            const ext = path_1.default.extname(file.name).toLowerCase();
            if (['.csv', '.xlsx', '.xls', '.json', '.parquet'].includes(ext)) {
                datasets.push({
                    id: file.path,
                    connectionId: connection.id,
                    sourceName: file.path,
                    displayName: file.name,
                    metadata: {
                        sourceType: ext.replace('.', ''),
                        fileName: file.name,
                        size: file.size,
                    },
                });
            }
        }
        return datasets;
    }
    async scanFolder(folderPath) {
        const list = [];
        if (folderPath.startsWith('r2://')) {
            let prefix = folderPath.replace(/^r2:\/\/[^\/]+\//, '');
            const batchMatch = prefix.match(/(uploads\/[0-9]+-)/);
            if (batchMatch) {
                prefix = batchMatch[1];
            }
            else {
                const ext = path_1.default.extname(prefix);
                if (ext) {
                    prefix = path_1.default.dirname(prefix) + '/';
                }
            }
            const simulationDir = path_1.default.resolve(process.cwd(), 'data', 'r2_simulation');
            if (fs_1.default.existsSync(simulationDir)) {
                const files = await fs_1.default.promises.readdir(simulationDir);
                for (const file of files) {
                    const simulatedKey = file.replace('_', '/');
                    if (simulatedKey.startsWith(prefix)) {
                        const stats = await fs_1.default.promises.stat(path_1.default.join(simulationDir, file));
                        list.push({
                            name: path_1.default.basename(simulatedKey),
                            path: `r2://${folderPath.replace(/^r2:\/\//, '').split('/')[0]}/${simulatedKey}`,
                            size: stats.size,
                        });
                    }
                }
            }
            if (list.length === 0) {
                return this.scanLocalDir(path_1.default.resolve(process.cwd(), 'sample-data'));
            }
        }
        else {
            const fullPath = path_1.default.isAbsolute(folderPath) ? folderPath : path_1.default.resolve(process.cwd(), folderPath);
            return this.scanLocalDir(fullPath);
        }
        return list;
    }
    async scanLocalDir(dirPath) {
        const list = [];
        try {
            if (!fs_1.default.existsSync(dirPath))
                return list;
            const files = await fs_1.default.promises.readdir(dirPath, { withFileTypes: true });
            for (const file of files) {
                if (file.isFile()) {
                    const filePath = path_1.default.join(dirPath, file.name);
                    const stats = await fs_1.default.promises.stat(filePath);
                    list.push({
                        name: file.name,
                        path: filePath,
                        size: stats.size,
                    });
                }
            }
        }
        catch (e) {
            console.error('[FolderConnector] Failed to scan local directory:', e);
        }
        return list;
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
        const ext = path_1.default.extname(datasetId).toLowerCase().replace('.', '') || 'csv';
        const buffer = await this.getBuffer(datasetId);
        const parsed = parser_factory_1.ParserFactory.parse(buffer, ext);
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
                source: ext,
            },
        };
    }
    async inferSchema(connection, datasetId) {
        const ext = path_1.default.extname(datasetId).toLowerCase().replace('.', '') || 'csv';
        const buffer = await this.getBuffer(datasetId);
        const parsed = parser_factory_1.ParserFactory.parse(buffer, ext);
        return {
            fields: parsed.headers.map(h => ({ name: h, type: 'string', nullable: true })),
            version: '1.0',
        };
    }
    async validateDataset(connection, datasetId) {
        const ext = path_1.default.extname(datasetId).toLowerCase().replace('.', '') || 'csv';
        const buffer = await this.getBuffer(datasetId);
        const parsed = parser_factory_1.ParserFactory.parse(buffer, ext);
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
        const ext = path_1.default.extname(dataset.id).toLowerCase().replace('.', '') || 'csv';
        const buffer = await this.getBuffer(dataset.id);
        const parsed = parser_factory_1.ParserFactory.parse(buffer, ext);
        const rawDir = path_1.default.resolve(process.cwd(), 'data', 'raw');
        fs_1.default.mkdirSync(rawDir, { recursive: true });
        const rawPath = path_1.default.join(rawDir, `${dataset.displayName.replace(/[^a-zA-Z0-9-_]/g, '_')}-${Date.now()}.ndjson`);
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
            jobId: `folder-file-${dataset.displayName}-${Date.now()}`,
            status: 'completed',
            metadata: { rawPath, bronzePath: rawPath, rowCount: records.length },
        };
    }
    async extractMetadata(connection, datasetId) {
        return { source: 'folder' };
    }
}
exports.FolderConnector = FolderConnector;
