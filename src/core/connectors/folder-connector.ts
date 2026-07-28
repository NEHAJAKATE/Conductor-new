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

export class FolderConnector implements ConnectorPlugin {
  readonly type = 'folder' as const;
  readonly displayName = 'Folder Upload';
  readonly description = 'Connector for bulk ingesting multi-file directory folders containing CSV, Excel, JSON, and Parquet.';

  constructor(private readonly r2Service?: any) {}

  describeConnectionSchema(): ConnectorConfigSchema {
    return {
      type: 'object',
      properties: {
        filePath: { type: 'string' }, // Folder path
      },
      required: ['filePath'],
    };
  }

  async testConnection(connection: ConnectionConfig): Promise<void> {
    const filePath = connection.config.filePath as string;
    if (!filePath) {
      throw new Error('Folder connector requires a filePath configuration.');
    }
  }

  async discoverDatasets(connection: ConnectionConfig): Promise<DatasetDescriptor[]> {
    const folderPath = connection.config.filePath as string;
    const datasets: DatasetDescriptor[] = [];
    
    const files = await this.scanFolder(folderPath);

    for (const file of files) {
      const ext = path.extname(file.name).toLowerCase();
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

  private async scanFolder(folderPath: string): Promise<Array<{ name: string; path: string; size: number }>> {
    const list: Array<{ name: string; path: string; size: number }> = [];

    if (folderPath.startsWith('r2://')) {
      const prefix = folderPath.replace(/^r2:\/\/[^\/]+\//, '');
      const simulationDir = path.resolve(process.cwd(), 'data', 'r2_simulation');
      if (fs.existsSync(simulationDir)) {
        const files = await fs.promises.readdir(simulationDir);
        for (const file of files) {
          const simulatedKey = file.replace(/_/g, '/');
          if (simulatedKey.startsWith(prefix)) {
            const stats = await fs.promises.stat(path.join(simulationDir, file));
            list.push({
              name: path.basename(simulatedKey),
              path: `r2://${folderPath.replace(/^r2:\/\//, '').split('/')[0]}/${simulatedKey}`,
              size: stats.size,
            });
          }
        }
      }
      if (list.length === 0) {
        return this.scanLocalDir(path.resolve(process.cwd(), 'sample-data'));
      }
    } else {
      const fullPath = path.isAbsolute(folderPath) ? folderPath : path.resolve(process.cwd(), folderPath);
      return this.scanLocalDir(fullPath);
    }

    return list;
  }

  private async scanLocalDir(dirPath: string): Promise<Array<{ name: string; path: string; size: number }>> {
    const list: Array<{ name: string; path: string; size: number }> = [];
    try {
      if (!fs.existsSync(dirPath)) return list;
      const files = await fs.promises.readdir(dirPath, { withFileTypes: true });
      for (const file of files) {
        if (file.isFile()) {
          const filePath = path.join(dirPath, file.name);
          const stats = await fs.promises.stat(filePath);
          list.push({
            name: file.name,
            path: filePath,
            size: stats.size,
          });
        }
      }
    } catch (e) {
      console.error('[FolderConnector] Failed to scan local directory:', e);
    }
    return list;
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
    const ext = path.extname(datasetId).toLowerCase().replace('.', '') || 'csv';
    const buffer = await this.getBuffer(datasetId);
    const parsed = ParserFactory.parse(buffer, ext);

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
        source: ext,
      },
    };
  }

  async inferSchema(connection: ConnectionConfig, datasetId: string): Promise<SchemaDefinition> {
    const ext = path.extname(datasetId).toLowerCase().replace('.', '') || 'csv';
    const buffer = await this.getBuffer(datasetId);
    const parsed = ParserFactory.parse(buffer, ext);
    return {
      fields: parsed.headers.map(h => ({ name: h, type: 'string', nullable: true })),
      version: '1.0',
    };
  }

  async validateDataset(connection: ConnectionConfig, datasetId: string): Promise<ValidationResult> {
    const ext = path.extname(datasetId).toLowerCase().replace('.', '') || 'csv';
    const buffer = await this.getBuffer(datasetId);
    const parsed = ParserFactory.parse(buffer, ext);

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
    const ext = path.extname(dataset.id).toLowerCase().replace('.', '') || 'csv';
    const buffer = await this.getBuffer(dataset.id);
    const parsed = ParserFactory.parse(buffer, ext);

    const bronzeDir = path.resolve(process.cwd(), 'data', 'bronze');
    fs.mkdirSync(bronzeDir, { recursive: true });
    const bronzePath = path.join(bronzeDir, `${dataset.displayName.replace(/[^a-zA-Z0-9-_]/g, '_')}-${Date.now()}.ndjson`);
    
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
      jobId: `folder-file-${dataset.displayName}-${Date.now()}`,
      status: 'completed',
      metadata: { bronzePath, rowCount: records.length },
    };
  }

  async extractMetadata(connection: ConnectionConfig, datasetId: string): Promise<Record<string, any>> {
    return { source: 'folder' };
  }
}
