import fs from 'fs';
import path from 'path';

export interface BronzeWriteResult {
  filePath: string;
  rowCount: number;
}

export class BronzeStore {
  constructor(private readonly basePath = path.resolve(process.cwd(), 'data', 'bronze')) {}

  private async ensureDirectory(): Promise<void> {
    await fs.promises.mkdir(this.basePath, { recursive: true });
  }

  async createBronzeFile(datasetId: string): Promise<string> {
    await this.ensureDirectory();
    const normalized = datasetId.replace(/[^a-zA-Z0-9-_]/g, '_');
    const fileName = `${normalized}-${Date.now()}.ndjson`;
    return path.join(this.basePath, fileName);
  }

  async writeRecords(datasetId: string, records: Array<Record<string, any>>): Promise<BronzeWriteResult> {
    const filePath = await this.createBronzeFile(datasetId);
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
