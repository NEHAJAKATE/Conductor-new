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

export class ParquetConnector implements ConnectorPlugin {
  readonly type = 'parquet' as const;
  readonly displayName = 'Parquet Dataset';
  readonly description = 'Connector for reading high-performance columnar Apache Parquet files.';

  constructor(private readonly r2Service?: any) {}

  describeConnectionSchema(): ConnectorConfigSchema {
    return {
      type: 'object',
      properties: {
        filePath: { type: 'string' },
      },
      required: ['filePath'],
    };
  }

  async testConnection(connection: ConnectionConfig): Promise<void> {
    const filePath = connection.config.filePath as string;
    if (!filePath) {
      throw new Error('Parquet connector requires a filePath configuration.');
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
        metadata: { sourceType: 'parquet', fileName },
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
    const parsed = ParserFactory.parse(buffer, 'parquet');

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
        source: 'parquet',
      },
    };
  }

  async inferSchema(connection: ConnectionConfig, datasetId: string): Promise<SchemaDefinition> {
    const filePath = connection.config.filePath as string;
    const buffer = await this.getBuffer(filePath);
    const parsed = ParserFactory.parse(buffer, 'parquet');
    return {
      fields: parsed.headers.map(h => ({ name: h, type: 'string', nullable: true })),
      version: '1.0',
    };
  }

  async validateDataset(connection: ConnectionConfig, datasetId: string): Promise<ValidationResult> {
    const filePath = connection.config.filePath as string;
    const buffer = await this.getBuffer(filePath);
    const parsed = ParserFactory.parse(buffer, 'parquet');

    return {
      valid: true,
      issues: [],
      recordCount: parsed.rows.length,
    };
  }

  async registerDataset(connection: ConnectionConfig, dataset: DatasetDescriptor): Promise<DatasetDescriptor> {
    return { ...dataset, metadata: { ...dataset.metadata, registered: true } };
  }

  async ingestDataset(connection: ConnectionConfig, dataset: DatasetDescriptor, options: IngestOptions): Promise<IngestResult> {
    const filePath = connection.config.filePath as string;
    const buffer = await this.getBuffer(filePath);
    const parsed = ParserFactory.parse(buffer, 'parquet');

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
      jobId: `parquet-${dataset.id}-${Date.now()}`,
      status: 'completed',
      metadata: { bronzePath, rowCount: records.length },
    };
  }

  async extractMetadata(connection: ConnectionConfig, datasetId: string): Promise<Record<string, any>> {
    return { source: 'parquet' };
  }
}
