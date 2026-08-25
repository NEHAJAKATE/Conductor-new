import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

export type AuditAction = 
  | 'DATA_INGESTION'
  | 'ORDER_DRAFT_CREATED'
  | 'ORDER_APPROVED'
  | 'PAYMENT_REMINDER_SENT'
  | 'BANK_RECONCILIATION_MATCH'
  | 'LEDGER_CORRECTION'
  | 'RBAC_ACCESS_DENIED'
  | 'CONFIG_UPDATED'
  | 'LOGIN_SUCCESS'
  | 'LOGIN_FAILURE';

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  actorId: string;
  actorRole: string;
  action: AuditAction;
  entityType: string;
  entityId: string;
  description: string;
  metadata?: Record<string, any>;
  status: 'SUCCESS' | 'DENIED' | 'FAILED';
}

const AUDIT_DIR = path.resolve(process.cwd(), 'data');
const AUDIT_FILE = path.join(AUDIT_DIR, 'audit_logs.jsonl');

function ensureAuditDir() {
  try {
    if (!fs.existsSync(AUDIT_DIR)) {
      fs.mkdirSync(AUDIT_DIR, { recursive: true });
    }
  } catch (err) {
    console.error('[AuditService] Failed to create audit dir:', err);
  }
}

export class AuditService {
  /**
   * Append an immutable audit event to audit_logs.jsonl
   */
  public static async log(entry: {
    actorId?: string;
    actorRole?: string;
    action: AuditAction;
    entityType: string;
    entityId: string;
    description: string;
    metadata?: Record<string, any>;
    status?: 'SUCCESS' | 'DENIED' | 'FAILED';
  }): Promise<AuditLogEntry> {
    ensureAuditDir();

    const record: AuditLogEntry = {
      id: `audit_${Date.now()}_${uuidv4().substring(0, 8)}`,
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
      await fs.promises.appendFile(AUDIT_FILE, line, 'utf8');
    } catch (err) {
      console.error('[AuditService] Failed to append audit log:', err);
    }

    return record;
  }

  /**
   * Retrieve recent audit logs
   */
  public static async list(params: {
    limit?: number;
    action?: AuditAction;
  } = {}): Promise<AuditLogEntry[]> {
    if (!fs.existsSync(AUDIT_FILE)) {
      return [];
    }

    try {
      const content = await fs.promises.readFile(AUDIT_FILE, 'utf8');
      const lines = content.trim().split('\n').filter(Boolean);
      let logs: AuditLogEntry[] = lines.map(line => {
        try {
          return JSON.parse(line);
        } catch {
          return null;
        }
      }).filter(Boolean);

      if (params.action) {
        logs = logs.filter(l => l.action === params.action);
      }

      logs.reverse(); // Newest first
      return logs.slice(0, params.limit || 50);
    } catch (err) {
      console.error('[AuditService] Failed to read audit logs:', err);
      return [];
    }
  }
}
