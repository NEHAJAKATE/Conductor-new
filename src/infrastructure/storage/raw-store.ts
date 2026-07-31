import fs from 'fs';
import path from 'path';

export interface RawWriteResult {
  filePath: string;
  rowCount: number;
}

export type BronzeWriteResult = RawWriteResult;

export class RawStore {
  constructor(private readonly basePath = path.resolve(process.cwd(), 'data', 'raw')) {}

  private async ensureDirectory(): Promise<void> {
    await fs.promises.mkdir(this.basePath, { recursive: true });
  }

  async createRawFile(datasetId: string): Promise<string> {
    await this.ensureDirectory();
    const normalized = datasetId.replace(/[^a-zA-Z0-9-_]/g, '_');
    const fileName = `${normalized}-${Date.now()}.ndjson`;
    return path.join(this.basePath, fileName);
  }

  async createBronzeFile(datasetId: string): Promise<string> {
    return this.createRawFile(datasetId);
  }

  async writeRecords(datasetId: string, records: Array<Record<string, any>>): Promise<RawWriteResult> {
    const filePath = await this.createRawFile(datasetId);
    const handle = await fs.promises.open(filePath, 'w');
    try {
      for (const record of records) {
        await handle.write(`${JSON.stringify(record)}\n`);
      }
    } finally {
      await handle.close();
    }
    return { filePath, rowCount: records.length };
  }
}

export class BronzeStore extends RawStore {
  constructor(basePath = path.resolve(process.cwd(), 'data', 'raw')) {
    super(basePath);
  }
}
