"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RejectionLogService = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const uuid_1 = require("uuid");
const READY_DIR = path_1.default.resolve(process.cwd(), 'data', 'ready');
const LOG_FILE = path_1.default.join(READY_DIR, 'rejected_rows.jsonl');
function ensureReadyDir() {
    if (!fs_1.default.existsSync(READY_DIR)) {
        fs_1.default.mkdirSync(READY_DIR, { recursive: true });
    }
}
class RejectionLogService {
    /**
     * Appends a single rejected row to the persistent rejection log
     */
    static async recordRejection(entry) {
        ensureReadyDir();
        const record = {
            id: `rej_${Date.now()}_${(0, uuid_1.v4)().substring(0, 8)}`,
            sourceFile: entry.sourceFile,
            batchId: entry.batchId || `batch_${Date.now()}`,
            rowNumber: entry.rowNumber,
            rawContent: entry.rawContent,
            reason: entry.reason,
            rejectedAt: new Date().toISOString(),
        };
        const line = JSON.stringify(record) + '\n';
        await fs_1.default.promises.appendFile(LOG_FILE, line, 'utf8');
        return record;
    }
    /**
     * Appends a batch of rejected rows
     */
    static async recordBatch(entries) {
        if (entries.length === 0)
            return 0;
        ensureReadyDir();
        const batchId = entries[0].batchId || `batch_${Date.now()}`;
        const lines = entries.map(entry => {
            const record = {
                id: `rej_${Date.now()}_${(0, uuid_1.v4)().substring(0, 8)}`,
                sourceFile: entry.sourceFile,
                batchId: entry.batchId || batchId,
                rowNumber: entry.rowNumber,
                rawContent: entry.rawContent,
                reason: entry.reason,
                rejectedAt: new Date().toISOString(),
            };
            return JSON.stringify(record);
        }).join('\n') + '\n';
        await fs_1.default.promises.appendFile(LOG_FILE, lines, 'utf8');
        return entries.length;
    }
    /**
     * Reads all rejected rows from the persistent log, supporting filtering and pagination
     */
    static async listRejections(params = {}) {
        ensureReadyDir();
        if (!fs_1.default.existsSync(LOG_FILE)) {
            return { total: 0, rows: [] };
        }
        const content = await fs_1.default.promises.readFile(LOG_FILE, 'utf8');
        const lines = content.split('\n').map(l => l.trim()).filter(Boolean);
        let records = [];
        for (const line of lines) {
            try {
                records.push(JSON.parse(line));
            }
            catch { }
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
    static async clear() {
        ensureReadyDir();
        if (fs_1.default.existsSync(LOG_FILE)) {
            await fs_1.default.promises.unlink(LOG_FILE);
        }
    }
}
exports.RejectionLogService = RejectionLogService;
