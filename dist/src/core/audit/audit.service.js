"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditService = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const uuid_1 = require("uuid");
const AUDIT_DIR = path_1.default.resolve(process.cwd(), 'data');
const AUDIT_FILE = path_1.default.join(AUDIT_DIR, 'audit_logs.jsonl');
function ensureAuditDir() {
    try {
        if (!fs_1.default.existsSync(AUDIT_DIR)) {
            fs_1.default.mkdirSync(AUDIT_DIR, { recursive: true });
        }
    }
    catch (err) {
        console.error('[AuditService] Failed to create audit dir:', err);
    }
}
class AuditService {
    /**
     * Append an immutable audit event to audit_logs.jsonl
     */
    static async log(entry) {
        ensureAuditDir();
        const record = {
            id: `audit_${Date.now()}_${(0, uuid_1.v4)().substring(0, 8)}`,
            timestamp: new Date().toISOString(),
            actorId: entry.actorId || 'system',
            actorRole: entry.actorRole || 'SYSTEM',
            action: entry.action,
            entityType: entry.entityType,
            entityId: entry.entityId,
            description: entry.description,
            metadata: entry.metadata,
            status: entry.status || 'SUCCESS',
        };
        const line = JSON.stringify(record) + '\n';
        try {
            await fs_1.default.promises.appendFile(AUDIT_FILE, line, 'utf8');
        }
        catch (err) {
            console.error('[AuditService] Failed to append audit log:', err);
        }
        return record;
    }
    /**
     * Retrieve recent audit logs
     */
    static async list(params = {}) {
        if (!fs_1.default.existsSync(AUDIT_FILE)) {
            return [];
        }
        try {
            const content = await fs_1.default.promises.readFile(AUDIT_FILE, 'utf8');
            const lines = content.trim().split('\n').filter(Boolean);
            let logs = lines.map(line => {
                try {
                    return JSON.parse(line);
                }
                catch {
                    return null;
                }
            }).filter(Boolean);
            if (params.action) {
                logs = logs.filter(l => l.action === params.action);
            }
            logs.reverse(); // Newest first
            return logs.slice(0, params.limit || 50);
        }
        catch (err) {
            console.error('[AuditService] Failed to read audit logs:', err);
            return [];
        }
    }
}
exports.AuditService = AuditService;
