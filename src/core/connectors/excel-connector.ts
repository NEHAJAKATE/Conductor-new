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
import { ParserFactory } from '@/core/parser/parser-factory';
import fs from 'fs';
import path from 'path';
import { Readable } from 'stream';

export class ExcelConnector implements ConnectorPlugin {
  readonly type = 'excel' as const;
  readonly displayName = 'Excel Spreadsheet';
  readonly description = 'Connector for ingesting .xlsx and .xls workbooks with automatic sheet parsing.';

  constructor(private readonly r2Service?: any) {}

  describeConnectionSchema(): ConnectorConfigSchema {
    return {
      type: 'object',
      properties: {
        filePath: { type: 'string' },
        sheetName: { type: 'string', default: '' },
      },
      required: ['filePath'],
    };
  }

  async testConnection(connection: ConnectionConfig): Promise<void> {
    const filePath = connection.config.filePath as string;
    if (!filePath) {
      throw new Error('Excel connector requires a filePath configuration.');
    }
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
        metadata: { sourceType: 'excel', fileName },
      },
    ];
  }

  private async getBuffer(filePath: string): Promise<Buffer> {
    let stream: Readable;
    if (filePath.startsWith('r2://') && this.r2Service) {
      const key = filePath.replace(/^r2:\/\/[^\/]+\//, '');
      stream = await this.r2Service.getReadStream(key);
    } else {
      stream = fs.createReadStream(filePath);
    }
    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
      chunks.push(chunk);
    }
    return Buffer.concat(chunks);
  }

  async previewDataset(connection: ConnectionConfig, datasetId: string, options: PreviewOptions): Promise<PreviewResult> {
    const filePath = connection.config.filePath as string;
    const buffer = await this.getBuffer(filePath);
    const parsed = ParserFactory.parse(buffer, 'xlsx');

    const limitRows = parsed.rows.slice(0, options.limit);
    const rows = limitRows.map(r => {
      const item: Record<string, any> = {};
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

  async inferSchema(connection: ConnectionConfig, datasetId: string): Promise<SchemaDefinition> {
    const filePath = connection.config.filePath as string;
    const buffer = await this.getBuffer(filePath);
    const parsed = ParserFactory.parse(buffer, 'xlsx');
    return {
      fields: parsed.headers.map(h => ({ name: h, type: 'string', nullable: true })),
      version: '1.0',
    };
  }

  async validateDataset(connection: ConnectionConfig, datasetId: string): Promise<ValidationResult> {
    const filePath = connection.config.filePath as string;
    const buffer = await this.getBuffer(filePath);
    const parsed = ParserFactory.parse(buffer, 'xlsx');

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

  async registerDataset(connection: ConnectionConfig, dataset: DatasetDescriptor): Promise<DatasetDescriptor> {
    return { ...dataset, metadata: { ...dataset.metadata, registered: true } };
  }

  async ingestDataset(connection: ConnectionConfig, dataset: DatasetDescriptor, options: IngestOptions): Promise<IngestResult> {
    const filePath = connection.config.filePath as string;
    const buffer = await this.getBuffer(filePath);
    const parsed = ParserFactory.parse(buffer, 'xlsx');

    const bronzeDir = path.resolve(process.cwd(), 'data', 'bronze');
    fs.mkdirSync(bronzeDir, { recursive: true });
    const bronzePath = path.join(bronzeDir, `${dataset.id.replace(/[^a-zA-Z0-9-_]/g, '_')}-${Date.now()}.ndjson`);
    
    const records = parsed.rows.map(r => {
      const item: Record<string, any> = {};
      parsed.headers.forEach((h, idx) => {
        item[h] = r[idx] ?? null;
      });
      return item;
    });

    const lines = records.map(rec => JSON.stringify(rec)).join('\n') + '\n';
    await fs.promises.writeFile(bronzePath, lines);

    return {
      jobId: `excel-${dataset.id}-${Date.now()}`,
      status: 'completed',
      metadata: { bronzePath, rowCount: records.length },
    };
  }

  async extractMetadata(connection: ConnectionConfig, datasetId: string): Promise<Record<string, any>> {
    return { source: 'excel' };
  }
}
