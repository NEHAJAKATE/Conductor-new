import {
  ConnectorPlugin,
  ConnectorConfigSchema,
  ConnectionConfig,
  DatasetDescriptor,
  PreviewOptions,
  PreviewResult,
  SchemaDefinition,
  ValidationResult,
  IngestOptions,
  IngestResult,
} from './connector';
import { assertFileReadable, loadCsvPreview, sampleCsvRows, validateCsvSample } from './csv-utils';
import { CsvIngester } from './csv-ingester';
import { Readable } from 'stream';

export class CsvConnector implements ConnectorPlugin {
  readonly type = 'csv' as const;
  readonly displayName = 'CSV File';
  readonly description = 'Connector for ingesting CSV files with schema inference, preview, and validation.';

  constructor(private readonly r2Service?: any) {}

  describeConnectionSchema(): ConnectorConfigSchema {
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

  async testConnection(connection: ConnectionConfig): Promise<void> {
    const filePath = connection.config.filePath as string;
    if (!filePath) {
      throw new Error('CSV connector requires a filePath configuration.');
    }
    await assertFileReadable(filePath);
  }

  async discoverDatasets(connection: ConnectionConfig): Promise<DatasetDescriptor[]> {
    const filePath = connection.config.filePath as string;
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

  async previewDataset(connection: ConnectionConfig, datasetId: string, options: PreviewOptions): Promise<PreviewResult> {
    const filePath = connection.config.filePath as string;
    let sourceInput: string | Readable = filePath;
    let fileSize = 10240;

    if (filePath.startsWith('r2://') && this.r2Service) {
      const key = filePath.replace(/^r2:\/\/[^\/]+\//, '');
      const csvText = await this.r2Service.readFirstLines(key, 105);
      sourceInput = csvText;
      try {
        fileSize = connection.metadata?.size || 10240;
      } catch {}
    }

    const preview = await loadCsvPreview(sourceInput, datasetId, options.limit, {
      delimiter: connection.config.delimiter,
      encoding: connection.config.encoding,
      header: connection.config.header,
      fileSize,
    });
    return preview;
  }

  async inferSchema(connection: ConnectionConfig, datasetId: string): Promise<SchemaDefinition> {
    const filePath = connection.config.filePath as string;
    let sourceInput: string | Readable = filePath;

    if (filePath.startsWith('r2://') && this.r2Service) {
      const key = filePath.replace(/^r2:\/\/[^\/]+\//, '');
      const csvText = await this.r2Service.readFirstLines(key, 105);
      sourceInput = csvText;
    }

    const sample = await sampleCsvRows(sourceInput, {
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

  async validateDataset(connection: ConnectionConfig, datasetId: string): Promise<ValidationResult> {
    const filePath = connection.config.filePath as string;
    let sourceInput: string | Readable = filePath;

    if (filePath.startsWith('r2://') && this.r2Service) {
      const key = filePath.replace(/^r2:\/\/[^\/]+\//, '');
      const csvText = await this.r2Service.readFirstLines(key, 105);
      sourceInput = csvText;
    }

    const sample = await sampleCsvRows(sourceInput, {
      delimiter: connection.config.delimiter,
      encoding: connection.config.encoding,
      header: connection.config.header,
      limit: 100,
    });
    const validation = validateCsvSample(sample.headers, sample.rows);
    return {
      valid: validation.duplicateColumns.length === 0,
      issues: [
        ...validation.duplicateColumns.map((column) => ({
          field: column,
          severity: 'error' as const,
          code: 'duplicate_column',
          message: `Duplicate column name detected: ${column}`,
        })),
        ...(validation.missingValues > 0
          ? [{
              field: '*',
              severity: 'warning' as const,
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

  async registerDataset(connection: ConnectionConfig, dataset: DatasetDescriptor): Promise<DatasetDescriptor> {
    return { ...dataset, metadata: { ...dataset.metadata, registered: true } };
  }

  async ingestDataset(connection: ConnectionConfig, dataset: DatasetDescriptor, options: IngestOptions): Promise<IngestResult> {
    const filePath = connection.config.filePath as string;
    const schema = dataset.schema ?? (await this.inferSchema(connection, dataset.id));
    const ingester = new CsvIngester(this.r2Service);
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

  async extractMetadata(connection: ConnectionConfig, datasetId: string): Promise<Record<string, any>> {
    return {
      encoding: connection.config.encoding ?? 'utf-8',
      delimiter: connection.config.delimiter ?? ',',
      header: connection.config.header ?? true,
    };
  }
}
