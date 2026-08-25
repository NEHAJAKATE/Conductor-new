"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const report_service_1 = require("../src/core/reports/report.service");
const canonical_repositories_1 = require("../src/infrastructure/repositories/canonical-repositories");
const business_repository_1 = require("../src/infrastructure/repositories/business-repository");
async function step2FreshProcessRead() {
    console.log('=== TASK 5: STEP 2 - NEW PROCESS READING FROM DISK PERSISTENCE ===');
    console.log(`Current Process ID: ${process.pid}`);
    console.log(`No ingestion adapter or file upload called in this script.`);
    const txCount = (await canonical_repositories_1.transactionRepository.list({ limit: 1 })).total;
    const bizCount = await business_repository_1.businessRepository.count();
    const invCount = (await canonical_repositories_1.inventoryRepository.list()).length;
    const outCount = (await canonical_repositories_1.outstandingRepository.list()).length;
    console.log(`\n[REHYDRATED STORAGE COUNTS FROM DISK]`);
    console.log(`  Businesses Count: ${bizCount}`);
    console.log(`  Transactions Count: ${txCount}`);
    console.log(`  Inventory SKUs Count: ${invCount}`);
    console.log(`  Outstanding Accounts Count: ${outCount}`);
    // Query reports API service
    const salesReport = await report_service_1.ReportService.generateReport({ dataset: 'sales' });
    const purcReport = await report_service_1.ReportService.generateReport({ dataset: 'purchases' });
    const invReport = await report_service_1.ReportService.generateReport({ dataset: 'inventory' });
    const outReport = await report_service_1.ReportService.generateReport({ dataset: 'outstanding' });
    console.log(`\n[REPORT API SERVICE QUERIES ON FRESH PROCESS]`);
    console.log(`  Sales Report Status: ${salesReport.status}, Net Sales: ₹${salesReport.reconciliation?.netAmount?.toLocaleString()}`);
    console.log(`  Purchases Report Status: ${purcReport.status}, Net Purchases: ₹${purcReport.reconciliation?.netAmount?.toLocaleString()}`);
    console.log(`  Inventory Report Status: ${invReport.status}, Rows: ${invReport.rows.length}`);
    console.log(`  Outstanding Report Status: ${outReport.status}, Total Receivables: ₹${outReport.reconciliation?.netAmount?.toLocaleString()}`);
}
step2FreshProcessRead().catch(console.error);
