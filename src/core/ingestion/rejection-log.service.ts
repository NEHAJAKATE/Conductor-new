import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

export interface RejectedRowRecord {
  id: string;
  sourceFile: string;
  batchId: string;
  rowNumber: number;
  rawContent: any;
  reason: string;
  rejectedAt: string;
}

const READY_DIR = path.resolve(process.cwd(), 'data', 'ready');
const LOG_FILE = path.join(READY_DIR, 'rejected_rows.jsonl');

function ensureReadyDir() {
  if (!fs.existsSync(READY_DIR)) {
    fs.mkdirSync(READY_DIR, { recursive: true });
  }
}

export class RejectionLogService {
  /**
   * Appends a single rejected row to the persistent rejection log
   */
  public static async recordRejection(entry: {
    sourceFile: string;
    batchId?: string;
    rowNumber: number;
    rawContent: any;
    reason: string;
  }): Promise<RejectedRowRecord> {
    ensureReadyDir();
    const record: RejectedRowRecord = {
      id: `rej_${Date.now()}_${uuidv4().substring(0, 8)}`,
      sourceFile: entry.sourceFile,
      batchId: entry.batchId || `batch_${Date.now()}`,
      rowNumber: entry.rowNumber,
      rawContent: entry.rawContent,
      reason: entry.reason,
      rejectedAt: new Date().toISOString(),
    };

    const line = JSON.stringify(record) + '\n';
    await fs.promises.appendFile(LOG_FILE, line, 'utf8');
    return record;
  }

  /**
   * Appends a batch of rejected rows
   */
  public static async recordBatch(entries: Array<{
    sourceFile: string;
    batchId?: string;
    rowNumber: number;
    rawContent: any;
    reason: string;
  }>): Promise<number> {
    if (entries.length === 0) return 0;
    ensureReadyDir();
    const batchId = entries[0].batchId || `batch_${Date.now()}`;
    const lines = entries.map(entry => {
      const record: RejectedRowRecord = {
        id: `rej_${Date.now()}_${uuidv4().substring(0, 8)}`,
        sourceFile: entry.sourceFile,
        batchId: entry.batchId || batchId,
        rowNumber: entry.rowNumber,
        rawContent: entry.rawContent,
        reason: entry.reason,
        rejectedAt: new Date().toISOString(),
      };
      return JSON.stringify(record);
    }).join('\n') + '\n';

    await fs.promises.appendFile(LOG_FILE, lines, 'utf8');
    return entries.length;
  }

  /**
   * Reads all rejected rows from the persistent log, supporting filtering and pagination
   */
  public static async listRejections(params: {
    sourceFile?: string;
    batchId?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<{ total: number; rows: RejectedRowRecord[] }> {
    ensureReadyDir();
    if (!fs.existsSync(LOG_FILE)) {
      return { total: 0, rows: [] };
    }

    const content = await fs.promises.readFile(LOG_FILE, 'utf8');
    const lines = content.split('\n').map(l => l.trim()).filter(Boolean);
    
    let records: RejectedRowRecord[] = [];
    for (const line of lines) {
      try {
        records.push(JSON.parse(line));
      } catch {}
    }

    // Reverse to show latest rejections first
    records.reverse();

    if (params.sourceFile) {
      const q = params.sourceFile.toLowerCase();
      records = records.filter(r => r.sourceFile.toLowerCase().includes(q));
    }

    if (params.batchId) {
      records = records.filter(r => r.batchId === params.batchId);
    }

    const total = records.length;
    const offset = params.offset || 0;
    const limit = params.limit || 50;

    return {
      total,
      rows: records.slice(offset, offset + limit),
    };
  }

  /**
   * Clears the rejection log
   */
  public static async clear(): Promise<void> {
    ensureReadyDir();
    if (fs.existsSync(LOG_FILE)) {
      await fs.promises.unlink(LOG_FILE);
    }
  }
}
