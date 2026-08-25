"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AtcIngestRunner = void 0;
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const erp_adapter_1 = require("../adapters/erp-adapter");
const business_repository_1 = require("@/infrastructure/repositories/business-repository");
const canonical_repositories_1 = require("@/infrastructure/repositories/canonical-repositories");
const scheduler_service_1 = require("../scheduler/scheduler.service");
class AtcIngestRunner {
    static isRunning = false;
    static isInitialized = false;
    static async runFullAtcIngestion(force = false) {
        const currentTxCount = (await canonical_repositories_1.transactionRepository.list({ limit: 1 })).total;
        if (this.isInitialized && !force && currentTxCount > 0) {
            const bCount = await business_repository_1.businessRepository.count();
            const txRes = await canonical_repositories_1.transactionRepository.list({ limit: 1 });
            const invList = await canonical_repositories_1.inventoryRepository.list();
            const outList = await canonical_repositories_1.outstandingRepository.list();
            return {
                status: 'COMPLETED',
                totalDurationMs: 0,
                datasets: [],
                totals: {
                    partiesLoaded: bCount,
                    transactionsLoaded: txRes.total,
                    outstandingAccountsLoaded: outList.length,
                    inventorySkusLoaded: invList.length,
                },
            };
        }
        if (this.isRunning) {
            // Wait or return current stats
            await new Promise(r => setTimeout(r, 1000));
        }
        this.isRunning = true;
        const startTime = Date.now();
        const reports = [];
        try {
            const dataDir = path_1.default.resolve(process.cwd(), 'data', 'atc_sample_data');
            // 1. Party Master Ingestion
            const partyPath = path_1.default.join(dataDir, 'partymASTER.xls');
            if (fs_1.default.existsSync(partyPath)) {
                const { businesses, report } = await erp_adapter_1.ErpAdapter.ingestPartyMaster(partyPath);
                for (const b of businesses) {
                    await business_repository_1.businessRepository.save(b);
                }
                reports.push(report);
                await scheduler_service_1.schedulerService.recordExecution('job-atc-party-master', {
                    status: 'SUCCESS',
                    durationMs: report.durationMs,
                    recordsProcessed: report.acceptedRecords,
                    recordsRejected: report.rejectedRecords,
                });
            }
            // 2. Sales & Purchases Journal Ingestion
            const journalPath = path_1.default.join(dataDir, 'date_wise_sale_&_purchase_analysis.csv');
            if (fs_1.default.existsSync(journalPath)) {
                const { transactions, report } = await erp_adapter_1.ErpAdapter.ingestJournal(journalPath);
                await canonical_repositories_1.transactionRepository.saveBatch(transactions);
                reports.push(report);
                // Update Party Sales and Purchases aggregations
                const salesByParty = new Map();
                const purchasesByParty = new Map();
                transactions.forEach(tx => {
                    if (tx.partyId) {
                        if (tx.type === 'sale') {
                            salesByParty.set(tx.partyId, (salesByParty.get(tx.partyId) || 0) + tx.netAmount);
                        }
                        else if (tx.type === 'sale_return') {
                            salesByParty.set(tx.partyId, (salesByParty.get(tx.partyId) || 0) - tx.netAmount);
                        }
                        else if (tx.type === 'purchase') {
                            purchasesByParty.set(tx.partyId, (purchasesByParty.get(tx.partyId) || 0) + tx.netAmount);
                        }
                        else if (tx.type === 'purchase_return') {
                            purchasesByParty.set(tx.partyId, (purchasesByParty.get(tx.partyId) || 0) - tx.netAmount);
                        }
                    }
                });
                for (const [partyId, sales] of Array.from(salesByParty.entries())) {
                    const b = await business_repository_1.businessRepository.findById(partyId);
                    if (b) {
                        b.totalSales = (b.totalSales || 0) + sales;
                        await business_repository_1.businessRepository.save(b);
                    }
                }
                for (const [partyId, purchases] of Array.from(purchasesByParty.entries())) {
                    const b = await business_repository_1.businessRepository.findById(partyId);
                    if (b) {
                        b.totalPurchases = (b.totalPurchases || 0) + purchases;
                        await business_repository_1.businessRepository.save(b);
                    }
                }
                await scheduler_service_1.schedulerService.recordExecution('job-atc-erp-daily', {
                    status: 'SUCCESS',
                    durationMs: report.durationMs,
                    recordsProcessed: report.acceptedRecords,
                    recordsRejected: report.rejectedRecords,
                });
            }
            // 3. Outstanding / Ageing Ingestion
            const outPath = path_1.default.join(dataDir, 'OUTSTANDING LEDGER.xls');
            if (fs_1.default.existsSync(outPath)) {
                const { outstandings, report } = await erp_adapter_1.ErpAdapter.ingestOutstanding(outPath);
                await canonical_repositories_1.outstandingRepository.saveBatch(outstandings);
                reports.push(report);
                // Link outstanding to businesses
                for (const out of outstandings) {
                    const b = await business_repository_1.businessRepository.findById(out.businessId);
                    if (b) {
                        b.currentOutstanding = out.totalOutstanding;
                        await business_repository_1.businessRepository.save(b);
                    }
                }
                await scheduler_service_1.schedulerService.recordExecution('job-atc-outstanding', {
                    status: 'SUCCESS',
                    durationMs: report.durationMs,
                    recordsProcessed: report.acceptedRecords,
                    recordsRejected: report.rejectedRecords,
                });
            }
            // 4. Opening Stock Inventory Ingestion
            const stockPath = path_1.default.join(dataDir, 'OPENING STOCK.XLS');
            if (fs_1.default.existsSync(stockPath)) {
                const { inventory, report } = await erp_adapter_1.ErpAdapter.ingestStock(stockPath);
                await canonical_repositories_1.inventoryRepository.saveBatch(inventory);
                reports.push(report);
                await scheduler_service_1.schedulerService.recordExecution('job-atc-inventory', {
                    status: 'SUCCESS',
                    durationMs: report.durationMs,
                    recordsProcessed: report.acceptedRecords,
                    recordsRejected: report.rejectedRecords,
                });
            }
            // 5. Bank & Cash Ledger Ingestion & Reconciliation
            const bankPath = path_1.default.join(dataDir, 'BANK & CASH LEDGERS.XLS');
            let bankLinesCount = 0;
            if (fs_1.default.existsSync(bankPath)) {
                const bankStart = Date.now();
                const buffer = await fs_1.default.promises.readFile(bankPath);
                const { BankReconciliationService } = await Promise.resolve().then(() => __importStar(require('@/core/reconciliation/bank-reconciliation.service')));
                const bankRows = BankReconciliationService.parseBankLedgerFile(buffer);
                bankLinesCount = bankRows.length;
                reports.push({
                    sourceFile: 'BANK & CASH LEDGERS.XLS',
                    sourceDomain: 'bank_cash_ledgers',
                    totalRecords: bankRows.length,
                    acceptedRecords: bankRows.length,
                    rejectedRecords: 0,
                    warningCount: 0,
                    durationMs: Date.now() - bankStart,
                });
                await scheduler_service_1.schedulerService.recordExecution('job-atc-bank-recon', {
                    status: 'SUCCESS',
                    durationMs: Date.now() - bankStart,
                    recordsProcessed: bankRows.length,
                    recordsRejected: 0,
                });
            }
            this.isInitialized = true;
            const totalDurationMs = Date.now() - startTime;
            const partiesLoaded = await business_repository_1.businessRepository.count();
            const txRes = await canonical_repositories_1.transactionRepository.list({ limit: 1 });
            const outList = await canonical_repositories_1.outstandingRepository.list();
            const invList = await canonical_repositories_1.inventoryRepository.list();
            return {
                status: 'COMPLETED',
                totalDurationMs,
                datasets: reports,
                totals: {
                    partiesLoaded,
                    transactionsLoaded: txRes.total,
                    outstandingAccountsLoaded: outList.length,
                    inventorySkusLoaded: invList.length,
                },
            };
        }
        catch (error) {
            console.error('[AtcIngestRunner] Ingestion error:', error);
            return {
                status: 'FAILED',
                totalDurationMs: Date.now() - startTime,
                datasets: reports,
                totals: {
                    partiesLoaded: 0,
                    transactionsLoaded: 0,
                    outstandingAccountsLoaded: 0,
                    inventorySkusLoaded: 0,
                },
            };
        }
        finally {
            this.isRunning = false;
        }
    }
}
exports.AtcIngestRunner = AtcIngestRunner;
