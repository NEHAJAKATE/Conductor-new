"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.schedulerService = exports.SchedulerService = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
class SchedulerService {
    configPath = path_1.default.resolve(process.cwd(), 'data', 'schedules.json');
    jobs = new Map();
    constructor() {
        this.loadFromDisk();
    }
    loadFromDisk() {
        try {
            if (fs_1.default.existsSync(this.configPath)) {
                const raw = fs_1.default.readFileSync(this.configPath, 'utf8');
                const list = JSON.parse(raw);
                list.forEach(j => this.jobs.set(j.id, j));
            }
            else {
                this.seedDefaultJobs();
            }
        }
        catch {
            this.seedDefaultJobs();
        }
    }
    saveToDisk() {
        try {
            const dir = path_1.default.dirname(this.configPath);
            if (!fs_1.default.existsSync(dir))
                fs_1.default.mkdirSync(dir, { recursive: true });
            fs_1.default.writeFileSync(this.configPath, JSON.stringify(Array.from(this.jobs.values()), null, 2), 'utf8');
        }
        catch (err) {
            console.error('[SchedulerService] Save error:', err);
        }
    }
    seedDefaultJobs() {
        const defaults = [
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
            {
                id: 'job-atc-bank-recon',
                name: 'Bank & Cash Ledgers Reconciliation',
                sourceType: 'Excel Bank Statement',
                sourceLocation: 'data/atc_sample_data/BANK & CASH LEDGERS.XLS',
                mode: 'BATCH',
                cronExpression: '0 9 * * *',
                enabled: true,
                lastRunAt: new Date(Date.now() - 3600000 * 2).toISOString(),
                lastCompletedAt: new Date(Date.now() - 3600000 * 2 + 1500).toISOString(),
                lastStatus: 'SUCCESS',
                lastDurationMs: 1500,
                recordsProcessed: 3349,
                recordsRejected: 0,
                nextRunAt: new Date(Date.now() + 3600000 * 22).toISOString(),
                dataFreshnessMinutes: 120,
            },
        ];
        defaults.forEach(j => this.jobs.set(j.id, j));
        this.saveToDisk();
    }
    async listJobs() {
        return Array.from(this.jobs.values());
    }
    async getJob(id) {
        return this.jobs.get(id);
    }
    async saveJob(job) {
        this.jobs.set(job.id, job);
        this.saveToDisk();
        return job;
    }
    async recordExecution(id, result) {
        let existing = this.jobs.get(id);
        if (!existing) {
            existing = {
                id,
                name: id.replace(/[-_]/g, ' ').toUpperCase(),
                sourceType: 'File Connector',
                sourceLocation: 'data/ready/',
                mode: 'BATCH',
                enabled: true,
                lastStatus: 'SUCCESS',
            };
            this.jobs.set(id, existing);
        }
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
exports.SchedulerService = SchedulerService;
exports.schedulerService = new SchedulerService();
