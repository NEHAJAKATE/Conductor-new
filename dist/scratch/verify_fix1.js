"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const report_service_1 = require("../src/core/reports/report.service");
const canonical_repositories_1 = require("../src/infrastructure/repositories/canonical-repositories");
const business_repository_1 = require("../src/infrastructure/repositories/business-repository");
async function verifyFix1() {
    console.log('=== VERIFYING FIX 1: Empty Tenant & No Auto-Load Backdoor ===\n');
    // 1. Clear all repositories to simulate empty tenant
    await canonical_repositories_1.transactionRepository.clear();
    await canonical_repositories_1.inventoryRepository.clear();
    await canonical_repositories_1.outstandingRepository.clear();
    await business_repository_1.businessRepository.clear();
    // 2. Query Sales Report
    const salesReport = await report_service_1.ReportService.generateReport({ dataset: 'sales' });
    console.log('1. Sales Report on Empty Tenant:');
    console.log(`   Status: "${salesReport.status}"`);
    console.log(`   Status Message: "${salesReport.statusMessage}"`);
    console.log(`   Rows Count: ${salesReport.rows.length}`);
    console.log(`   Reconciliation Net Amount: ₹${salesReport.reconciliation?.netAmount || 0}`);
    // 3. Query Purchases Report
    const purcReport = await report_service_1.ReportService.generateReport({ dataset: 'purchases' });
    console.log('\n2. Purchases Report on Empty Tenant:');
    console.log(`   Status: "${purcReport.status}"`);
    console.log(`   Rows Count: ${purcReport.rows.length}`);
    // 4. Query Inventory Report
    const invReport = await report_service_1.ReportService.generateReport({ dataset: 'inventory' });
    console.log('\n3. Inventory Report on Empty Tenant:');
    console.log(`   Status: "${invReport.status}"`);
    console.log(`   Rows Count: ${invReport.rows.length}`);
    // 5. Query Outstanding Report
    const outReport = await report_service_1.ReportService.generateReport({ dataset: 'outstanding' });
    console.log('\n4. Outstanding Report on Empty Tenant:');
    console.log(`   Status: "${outReport.status}"`);
    console.log(`   Rows Count: ${outReport.rows.length}`);
    // 6. Query Business 360 Stats & List
    const bizList = await business_repository_1.businessRepository.list();
    const bizStats = await business_repository_1.businessRepository.getStats();
    console.log('\n5. Business 360 on Empty Tenant:');
    console.log(`   Total Businesses: ${bizList.length}`);
    console.log(`   Stats Total Sales: ₹${bizStats.totalSales}`);
    console.log(`   Stats Total Outstanding: ₹${bizStats.totalOutstanding}`);
    const passed = salesReport.status === 'NOT_CONNECTED' && salesReport.rows.length === 0 &&
        purcReport.status === 'NOT_CONNECTED' && purcReport.rows.length === 0 &&
        invReport.status === 'NOT_CONNECTED' && invReport.rows.length === 0 &&
        outReport.status === 'NOT_CONNECTED' && outReport.rows.length === 0 &&
        bizList.length === 0 && bizStats.totalSales === 0;
    if (passed) {
        console.log('\n=====================================================================');
        console.log('>>> FIX 1 VERIFIED: Empty tenant shows clean NOT_CONNECTED state with 0 records across all screens! <<<');
        console.log('=====================================================================\n');
    }
    else {
        console.error('\n>>> FIX 1 FAILED! Sample data was unexpectedly populated! <<<');
        process.exit(1);
    }
}
verifyFix1().catch(err => {
    console.error(err);
    process.exit(1);
});
