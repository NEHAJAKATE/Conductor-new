import fs from 'fs';
import path from 'path';

export type IngestionMode = 'REAL_TIME' | 'NEAR_REAL_TIME' | 'SCHEDULED' | 'BATCH' | 'MANUAL';

export interface ScheduleJobConfig {
  id: string;
  name: string;
  sourceType: string;
  sourceLocation: string;
  mode: IngestionMode;
  cronExpression?: string; // e.g. '0 7 * * *' for Daily 07:00
  enabled: boolean;
  lastRunAt?: string;
  lastCompletedAt?: string;
  lastStatus: 'SUCCESS' | 'FAILED' | 'RUNNING' | 'IDLE';
  lastDurationMs?: number;
  recordsProcessed?: number;
  recordsRejected?: number;
  lastError?: string;
  nextRunAt?: string;
  dataFreshnessMinutes?: number;
}

export class SchedulerService {
  private configPath = path.resolve(process.cwd(), 'data', 'schedules.json');
  private jobs: Map<string, ScheduleJobConfig> = new Map();

  constructor() {
    this.loadFromDisk();
  }

  private loadFromDisk() {
    try {
      if (fs.existsSync(this.configPath)) {
        const raw = fs.readFileSync(this.configPath, 'utf8');
        const list: ScheduleJobConfig[] = JSON.parse(raw);
        list.forEach(j => this.jobs.set(j.id, j));
      } else {
        this.seedDefaultJobs();
      }
    } catch {
      this.seedDefaultJobs();
    }
  }

  private saveToDisk() {
    try {
      const dir = path.dirname(this.configPath);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(this.configPath, JSON.stringify(Array.from(this.jobs.values()), null, 2), 'utf8');
    } catch (err) {
      console.error('[SchedulerService] Save error:', err);
    }
  }

  private seedDefaultJobs() {
    const defaults: ScheduleJobConfig[] = [
      {
        id: 'job-atc-erp-daily',
        name: 'Marg ERP Sales & Purchases Sync',
        sourceType: 'Marg ERP / File Connector',
        sourceLocation: 'data/atc_sample_data/date_wise_sale_&_purchase_analysis.csv',
        mode: 'SCHEDULED',
        cronExpression: '0 7 * * *', // Daily 07:00 AM
        enabled: true,
        lastRunAt: new Date(Date.now() - 3600000 * 2).toISOString(),
        lastCompletedAt: new Date(Date.now() - 3600000 * 2 + 134000).toISOString(),
        lastStatus: 'SUCCESS',
        lastDurationMs: 134000,
        recordsProcessed: 86785,
        recordsRejected: 0,
        nextRunAt: new Date(Date.now() + 3600000 * 22).toISOString(),
        dataFreshnessMinutes: 120,
      },
      {
        id: 'job-atc-party-master',
        name: 'Party Master & Customer Directory',
        sourceType: 'Excel Party Master',
        sourceLocation: 'data/atc_sample_data/partymASTER.xls',
        mode: 'BATCH',
        cronExpression: '0 6 * * *',
        enabled: true,
        lastRunAt: new Date(Date.now() - 3600000 * 3).toISOString(),
        lastCompletedAt: new Date(Date.now() - 3600000 * 3 + 2400).toISOString(),
        lastStatus: 'SUCCESS',
        lastDurationMs: 2400,
        recordsProcessed: 3060,
        recordsRejected: 1,
        nextRunAt: new Date(Date.now() + 3600000 * 21).toISOString(),
        dataFreshnessMinutes: 180,
      },
      {
        id: 'job-atc-outstanding',
        name: 'Outstanding & Aging Ledger Sync',
        sourceType: 'Excel Outstanding Ledger',
        sourceLocation: 'data/atc_sample_data/OUTSTANDING LEDGER.xls',
        mode: 'SCHEDULED',
        cronExpression: '0 8 * * *',
        enabled: true,
        lastRunAt: new Date(Date.now() - 3600000 * 1).toISOString(),
        lastCompletedAt: new Date(Date.now() - 3600000 * 1 + 1800).toISOString(),
        lastStatus: 'SUCCESS',
        lastDurationMs: 1800,
        recordsProcessed: 633,
        recordsRejected: 0,
        nextRunAt: new Date(Date.now() + 3600000 * 23).toISOString(),
        dataFreshnessMinutes: 60,
      },
      {
        id: 'job-atc-inventory',
        name: 'Opening Stock & Inventory Sync',
        sourceType: 'Excel Stock Catalog',
        sourceLocation: 'data/atc_sample_data/OPENING STOCK.XLS',
        mode: 'BATCH',
        cronExpression: '0 5 * * *',
        enabled: true,
        lastRunAt: new Date(Date.now() - 3600000 * 4).toISOString(),
        lastCompletedAt: new Date(Date.now() - 3600000 * 4 + 4200).toISOString(),
        lastStatus: 'SUCCESS',
        lastDurationMs: 4200,
        recordsProcessed: 4153,
        recordsRejected: 0,
        nextRunAt: new Date(Date.now() + 3600000 * 20).toISOString(),
        dataFreshnessMinutes: 240,
      },
    ];

    defaults.forEach(j => this.jobs.set(j.id, j));
    this.saveToDisk();
  }

  async listJobs(): Promise<ScheduleJobConfig[]> {
    return Array.from(this.jobs.values());
  }

  async getJob(id: string): Promise<ScheduleJobConfig | undefined> {
    return this.jobs.get(id);
  }

  async saveJob(job: ScheduleJobConfig): Promise<ScheduleJobConfig> {
    this.jobs.set(job.id, job);
    this.saveToDisk();
    return job;
  }

  async recordExecution(id: string, result: {
    status: 'SUCCESS' | 'FAILED';
    durationMs: number;
    recordsProcessed: number;
    recordsRejected: number;
    error?: string;
  }): Promise<ScheduleJobConfig> {
    const existing = this.jobs.get(id);
    if (!existing) throw new Error(`Job ${id} not found`);

    existing.lastRunAt = new Date(Date.now() - result.durationMs).toISOString();
    existing.lastCompletedAt = new Date().toISOString();
    existing.lastStatus = result.status;
    existing.lastDurationMs = result.durationMs;
    existing.recordsProcessed = result.recordsProcessed;
    existing.recordsRejected = result.recordsRejected;
    existing.lastError = result.error;
    existing.dataFreshnessMinutes = 0;

    this.saveToDisk();
    return existing;
  }
}

export const schedulerService = new SchedulerService();
