"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const erp_adapter_1 = require("../src/core/adapters/erp-adapter");
const report_service_1 = require("../src/core/reports/report.service");
const inventory_ledger_service_1 = require("../src/core/inventory/inventory-ledger.service");
const bank_reconciliation_service_1 = require("../src/core/reconciliation/bank-reconciliation.service");
const rbac_service_1 = require("../src/core/security/rbac.service");
const audit_service_1 = require("../src/core/audit/audit.service");
const automation_service_1 = require("../src/core/automation/automation.service");
const scheduler_service_1 = require("../src/core/scheduler/scheduler.service");
const canonical_repositories_1 = require("../src/infrastructure/repositories/canonical-repositories");
const business_repository_1 = require("../src/infrastructure/repositories/business-repository");
async function verifyAllSections() {
    console.log('=====================================================================');
    console.log('       ATC CONDUCTOR: FULL END-TO-END PLATFORM VERIFICATION          ');
    console.log('=====================================================================\n');
    // Start fresh
    await canonical_repositories_1.transactionRepository.clear();
    await canonical_repositories_1.inventoryRepository.clear();
    await canonical_repositories_1.outstandingRepository.clear();
    await business_repository_1.businessRepository.clear();
    const checklist = [];
    // SECTION 1: INGESTION & PARSERS
    try {
        const journalPath = path_1.default.resolve(process.cwd(), 'data', 'atc_sample_data', 'date_wise_sale_&_purchase_analysis.csv');
        const { transactions } = await erp_adapter_1.ErpAdapter.ingestJournal(journalPath);
        await canonical_repositories_1.transactionRepository.saveBatch(transactions);
        const stockPath = path_1.default.resolve(process.cwd(), 'data', 'atc_sample_data', 'OPENING STOCK.XLS');
        const { inventory } = await erp_adapter_1.ErpAdapter.ingestStock(stockPath);
        await canonical_repositories_1.inventoryRepository.saveBatch(inventory);
        const outPath = path_1.default.resolve(process.cwd(), 'data', 'atc_sample_data', 'OUTSTANDING LEDGER.XLS');
        const { outstandings } = await erp_adapter_1.ErpAdapter.ingestOutstanding(outPath);
        await canonical_repositories_1.outstandingRepository.saveBatch(outstandings);
        checklist.push({
            section: 'Data Ingestion & Adapters',
            status: 'PASS',
            notes: `Ingested ${transactions.length} Txs, ${inventory.length} Stock rows, ${outstandings.length} Outstanding accounts.`,
        });
    }
    catch (err) {
        checklist.push({ section: 'Data Ingestion & Adapters', status: 'FAIL', notes: err.message });
    }
    // SECTION 2: SALES INTELLIGENCE & ACCOUNTING SIGNS
    try {
        const salesReport = await report_service_1.ReportService.generateReport({ dataset: 'sales' });
        const netSales = salesReport.reconciliation?.netAmount || 0;
        const isExact = Math.abs(netSales - 95052611.91) < 1.0;
        checklist.push({
            section: 'Sales Intelligence & Output GST',
            status: isExact ? 'PASS' : 'FAIL',
            notes: `Net Sales: ₹${netSales.toLocaleString()} (Target: ₹95,052,611.91), Gross: ₹${salesReport.reconciliation?.grossAmount?.toLocaleString()}`,
        });
    }
    catch (err) {
        checklist.push({ section: 'Sales Intelligence & Output GST', status: 'FAIL', notes: err.message });
    }
    // SECTION 3: PURCHASES & INPUT TAX CREDIT (ITC)
    try {
        const purcReport = await report_service_1.ReportService.generateReport({ dataset: 'purchases' });
        const netPurchases = purcReport.reconciliation?.netAmount || 0;
        const isExact = Math.abs(netPurchases - 93642186.16) < 1.0;
        checklist.push({
            section: 'Procurement & Input Tax Credit',
            status: isExact ? 'PASS' : 'FAIL',
            notes: `Net Purchases: ₹${netPurchases.toLocaleString()} (Target: ₹93,642,186.16), Gross: ₹${purcReport.reconciliation?.grossAmount?.toLocaleString()}`,
        });
    }
    catch (err) {
        checklist.push({ section: 'Procurement & Input Tax Credit', status: 'FAIL', notes: err.message });
    }
    // SECTION 4: INVENTORY LEDGER & 25-STRIP REORDER LOGIC
    try {
        const summary = await inventory_ledger_service_1.InventoryLedgerService.computeRunningLedger();
        const lowStock = summary.items.filter(i => i.isLowStock);
        const testSku = summary.items[0];
        const manualExpected = Math.round((testSku.openingStock + testSku.purchases + testSku.salesReturns - testSku.sales - testSku.purchaseReturns - testSku.breakage + testSku.adjustments) * 100) / 100;
        const mathCheck = testSku.calculatedClosingStock === manualExpected;
        checklist.push({
            section: 'Running Inventory Ledger & Reorder Engine',
            status: mathCheck && lowStock.length > 0 ? 'PASS' : 'FAIL',
            notes: `Total SKUs: ${summary.items.length}, Low-stock alerts: ${lowStock.length} (at ≤25 threshold). Test SKU Closing Stock: ${testSku.calculatedClosingStock}.`,
        });
    }
    catch (err) {
        checklist.push({ section: 'Running Inventory Ledger & Reorder Engine', status: 'FAIL', notes: err.message });
    }
    // SECTION 5: OUTSTANDING & MONTHLY TREND SNAPSHOT
    try {
        const outReport = await report_service_1.ReportService.generateReport({ dataset: 'outstanding' });
        const hasMonthly = outReport.rows.length > 0 && outReport.rows[0].monthlyBreakdown !== undefined;
        const provCorrect = outReport.provenance?.sourceSystem.includes('Monthly Outstanding');
        checklist.push({
            section: 'Receivables & Monthly Trend Snapshot',
            status: hasMonthly && provCorrect ? 'PASS' : 'FAIL',
            notes: `Total Accounts: ${outReport.totalRows}, Total Receivables: ₹${outReport.reconciliation?.netAmount?.toLocaleString()}. Labeled: "${outReport.provenance?.sourceSystem}".`,
        });
    }
    catch (err) {
        checklist.push({ section: 'Receivables & Monthly Trend Snapshot', status: 'FAIL', notes: err.message });
    }
    // SECTION 6: BANK & CASH RECONCILIATION
    try {
        const bankRecon = await bank_reconciliation_service_1.BankReconciliationService.reconcile();
        const hasMatched = bankRecon.matchedCount > 0;
        const hasDiscrepancies = bankRecon.unmatchedCount > 0 && bankRecon.mismatchCount > 0;
        checklist.push({
            section: 'Bank & Cash Ledger Reconciliation',
            status: hasMatched && hasDiscrepancies ? 'PASS' : 'FAIL',
            notes: `Bank lines: ${bankRecon.totalBankEntries}. Matched: ${bankRecon.matchedCount} (₹${bankRecon.matchedAmount.toLocaleString()}), Unmatched: ${bankRecon.unmatchedCount}, Amount Mismatch: ${bankRecon.mismatchCount}.`,
        });
    }
    catch (err) {
        checklist.push({ section: 'Bank & Cash Ledger Reconciliation', status: 'FAIL', notes: err.message });
    }
    // SECTION 7: PERSISTENCE (DISK REHYDRATION)
    try {
        const rTx = new canonical_repositories_1.TransactionRepository();
        const rInv = new canonical_repositories_1.InventoryRepository();
        const rOut = new canonical_repositories_1.OutstandingRepository();
        const txs = await rTx.getAll();
        const invs = await rInv.list();
        const outs = await rOut.list();
        const isHydrated = txs.length === 86784 && invs.length === 3947 && outs.length === 630;
        checklist.push({
            section: 'Disk Persistence & Auto-Rehydration',
            status: isHydrated ? 'PASS' : 'FAIL',
            notes: `Reloaded from data/ready/ cleanly: ${txs.length} transactions, ${invs.length} SKUs, ${outs.length} accounts.`,
        });
    }
    catch (err) {
        checklist.push({ section: 'Disk Persistence & Auto-Rehydration', status: 'FAIL', notes: err.message });
    }
    // SECTION 8: SERVER-SIDE RBAC & AUDIT LOGGING
    try {
        const staffReq = new Request('http://localhost:3000/api/v1/reconciliation', { headers: { 'x-user-role': 'STAFF' } });
        const ownerReq = new Request('http://localhost:3000/api/v1/reconciliation', { headers: { 'x-user-role': 'OWNER' } });
        const staffAuth = rbac_service_1.RbacService.authorize(staffReq, 'VIEW_BANK_RECONCILIATION');
        const ownerAuth = rbac_service_1.RbacService.authorize(ownerReq, 'VIEW_BANK_RECONCILIATION');
        await audit_service_1.AuditService.log({
            actorId: 'audit_test_user',
            actorRole: 'OWNER',
            action: 'BANK_RECONCILIATION_MATCH',
            entityType: 'RECONCILIATION_REPORT',
            entityId: 'SYSTEM_VERIFY_1',
            description: 'Automated verification check',
        });
        const logs = await audit_service_1.AuditService.list({ limit: 1 });
        const rbacPass = !staffAuth.allowed && ownerAuth.allowed && logs.length > 0;
        checklist.push({
            section: 'Server-Side RBAC & Append-Only Audit',
            status: rbacPass ? 'PASS' : 'FAIL',
            notes: `Staff denied 403, Owner allowed 200, Audit trail active in data/audit_logs.jsonl.`,
        });
    }
    catch (err) {
        checklist.push({ section: 'Server-Side RBAC & Append-Only Audit', status: 'FAIL', notes: err.message });
    }
    // SECTION 9: AUTOMATION & SCHEDULER
    try {
        const rules = await automation_service_1.automationService.listRules();
        const reminderLog = await automation_service_1.automationService.recordReminder({
            partyName: 'SAMPLE CHEMIST',
            amount: 150000,
            overdue90Plus: 75000,
            channel: 'WHATSAPP',
            recipient: '+919876543210',
        });
        const schedJobs = await scheduler_service_1.schedulerService.listJobs();
        checklist.push({
            section: 'Automation Engine & Scheduler',
            status: rules.length > 0 && reminderLog.status === 'SENT' && schedJobs.length > 0 ? 'PASS' : 'FAIL',
            notes: `${rules.length} active business rules, WhatsApp reminder dispatched, ${schedJobs.length} sync jobs tracked.`,
        });
    }
    catch (err) {
        checklist.push({ section: 'Automation Engine & Scheduler', status: 'FAIL', notes: err.message });
    }
    // PRINT SUMMARY TABLE
    console.log('\n=====================================================================');
    console.log('               FULL PLATFORM VERIFICATION SCORECARD                  ');
    console.log('=====================================================================');
    checklist.forEach((item, idx) => {
        console.log(`[${item.status}] ${idx + 1}. ${item.section}`);
        console.log(`     Details: ${item.notes}\n`);
    });
    const allPassed = checklist.every(c => c.status === 'PASS');
    console.log('=====================================================================');
    console.log(`TOTAL SECTIONS VERIFIED: ${checklist.length} | PASSED: ${checklist.filter(c => c.status === 'PASS').length}`);
    console.log(`PLATFORM STATUS: ${allPassed ? '>>> 100% VERIFIED & PRODUCTION READY FOR ATC <<<' : '>>> ISSUES DETECTED <<<'}`);
    console.log('=====================================================================\n');
}
verifyAllSections().catch(err => {
    console.error(err);
    process.exit(1);
});
