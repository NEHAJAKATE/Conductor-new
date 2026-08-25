"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CsvConnector = void 0;
const csv_utils_1 = require("./csv-utils");
const csv_ingester_1 = require("./csv-ingester");
class CsvConnector {
    r2Service;
    type = 'csv';
    displayName = 'CSV File';
    description = 'Connector for ingesting CSV files with schema inference, preview, and validation.';
    constructor(r2Service) {
        this.r2Service = r2Service;
    }
    describeConnectionSchema() {
        return {
            type: 'object',
            properties: {
                filePath: { type: 'string' },
                delimiter: { type: 'string', default: ',' },
                encoding: { type: 'string', default: 'utf-8' },
                header: { type: 'boolean', default: true },
            },
            required: ['filePath'],
        };
    }
    async testConnection(connection) {
        const filePath = connection.config.filePath;
        if (!filePath) {
            throw new Error('CSV connector requires a filePath configuration.');
        }
        await (0, csv_utils_1.assertFileReadable)(filePath);
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
                metadata: { sourceType: 'csv', fileName },
            },
        ];
    }
    async previewDataset(connection, datasetId, options) {
        const filePath = connection.config.filePath;
        let sourceInput = filePath;
        let fileSize = 10240;
        if (filePath.startsWith('r2://') && this.r2Service) {
            const key = filePath.replace(/^r2:\/\/[^\/]+\//, '');
            const csvText = await this.r2Service.readFirstLines(key, 105);
            sourceInput = csvText;
            try {
                fileSize = connection.metadata?.size || 10240;
            }
            catch { }
        }
        const preview = await (0, csv_utils_1.loadCsvPreview)(sourceInput, datasetId, options.limit, {
            delimiter: connection.config.delimiter,
            encoding: connection.config.encoding,
            header: connection.config.header,
            fileSize,
        });
        return preview;
    }
    async inferSchema(connection, datasetId) {
        const filePath = connection.config.filePath;
        let sourceInput = filePath;
        if (filePath.startsWith('r2://') && this.r2Service) {
            const key = filePath.replace(/^r2:\/\/[^\/]+\//, '');
            const csvText = await this.r2Service.readFirstLines(key, 105);
            sourceInput = csvText;
        }
        const sample = await (0, csv_utils_1.sampleCsvRows)(sourceInput, {
            delimiter: connection.config.delimiter,
            encoding: connection.config.encoding,
            header: connection.config.header,
            limit: 50,
        });
        return {
            fields: sample.headers.map((header) => ({ name: header, type: 'string', nullable: true })),
            version: '1.0',
            raw: { sampleSize: sample.rows.length, headerCount: sample.headers.length },
        };
    }
    async validateDataset(connection, datasetId) {
        const filePath = connection.config.filePath;
        let sourceInput = filePath;
        if (filePath.startsWith('r2://') && this.r2Service) {
            const key = filePath.replace(/^r2:\/\/[^\/]+\//, '');
            const csvText = await this.r2Service.readFirstLines(key, 105);
            sourceInput = csvText;
        }
        const sample = await (0, csv_utils_1.sampleCsvRows)(sourceInput, {
            delimiter: connection.config.delimiter,
            encoding: connection.config.encoding,
            header: connection.config.header,
            limit: 100,
        });
        const validation = (0, csv_utils_1.validateCsvSample)(sample.headers, sample.rows);
        return {
            valid: validation.duplicateColumns.length === 0,
            issues: [
                ...validation.duplicateColumns.map((column) => ({
                    field: column,
                    severity: 'error',
                    code: 'duplicate_column',
                    message: `Duplicate column name detected: ${column}`,
                })),
                ...(validation.missingValues > 0
                    ? [{
                            field: '*',
                            severity: 'warning',
                            code: 'missing_values',
                            message: `${validation.missingValues} missing values detected in the sample rows`,
                        }]
                    : []),
            ],
            recordCount: validation.rowCount,
            fieldStatistics: {
                duplicateColumns: validation.duplicateColumns,
                missingValues: validation.missingValues,
            },
        };
    }
    async registerDataset(connection, dataset) {
        return { ...dataset, metadata: { ...dataset.metadata, registered: true } };
    }
    async ingestDataset(connection, dataset, options) {
        const filePath = connection.config.filePath;
        const schema = dataset.schema ?? (await this.inferSchema(connection, dataset.id));
        const ingester = new csv_ingester_1.CsvIngester(this.r2Service);
        const result = await ingester.ingest(filePath, schema, {
            ...options,
            destination: {
                ...(options.destination ?? {}),
                datasetId: dataset.id,
                delimiter: connection.config.delimiter ?? ',',
                encoding: connection.config.encoding ?? 'utf-8',
                header: connection.config.header ?? true,
            },
        });
        return {
            jobId: `csv-${dataset.id}-${Date.now()}`,
            status: 'completed',
            metadata: { bronzePath: result.path, rowCount: result.rows },
        };
    }
    async extractMetadata(connection, datasetId) {
        return {
            encoding: connection.config.encoding ?? 'utf-8',
            delimiter: connection.config.delimiter ?? ',',
            header: connection.config.header ?? true,
        };
    }
}
exports.CsvConnector = CsvConnector;
