"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const bootstrap_1 = require("../src/core/services/bootstrap");
const business_repository_1 = require("../src/infrastructure/repositories/business-repository");
const report_service_1 = require("../src/core/reports/report.service");
async function testUserCsv() {
    console.log('=== TEST USER CSV INGESTION ===');
    const userCsvContent = `C_DATE,VCN,TYPE2,PNAME,PTGSTNO,NAME,COMPANY,BATCH,QTY,RATE,AMOUNT,GST,TAXAMT,AREANAME,ROUTNAME
15-Apr-2026,INV-1001,Sale,AJAY MEDICAL CENTRE,09ABIFA7889G1ZT,AUGMENTIN 625,GSK,BT-101,50,120.00,6000.00,12,720.00,Civil Lines,Route 1
16-Apr-2026,INV-1002,Sale,CITY HEALTHCARE PHARMA,09DZFPS5527D1Z4,PAN D CAP,ALKEM,BT-102,100,85.00,8500.00,12,1020.00,Leader Road,Route 2
17-Apr-2026,INV-1003,Sale,SHIVAM MEDICAL AGENCY,09AAACR5050K1Z2,TELMA 40,GLENMARK,BT-103,40,110.00,4400.00,12,528.00,Katra,Route 1`;
    const testFilePath = path_1.default.resolve(process.cwd(), 'data', 'user_sales_test.csv');
    await fs_1.default.promises.writeFile(testFilePath, userCsvContent, 'utf8');
    console.log('1. Wrote test CSV to:', testFilePath);
    const context = (0, bootstrap_1.bootstrap)();
    console.log('2. Starting workflow...');
    const workflow = await context.workflowService.startWorkflow({
        filePath: testFilePath,
        fileName: 'user_sales_test.csv',
        connectionName: 'User Mockaroo Test',
        connectorType: 'csv',
    });
    // Wait 1 second for preview and validation
    await new Promise(r => setTimeout(r, 1000));
    const wfState1 = await context.workflowRepository.findById(workflow.id);
    console.log('3. Workflow state after start:', wfState1?.status, 'currentStage:', wfState1?.currentStage);
    if (wfState1?.status === 'paused_waiting_confirmation') {
        console.log('4. Confirming workflow...');
        await context.workflowService.confirmWorkflow(workflow.id);
        // Wait 2 seconds for downstream processing
        await new Promise(r => setTimeout(r, 2000));
    }
    const wfState2 = await context.workflowRepository.findById(workflow.id);
    console.log('5. Workflow state after confirmation:', wfState2?.status, 'currentStage:', wfState2?.currentStage);
    // Check Sales Report
    const salesReport = await report_service_1.ReportService.generateReport({ dataset: 'sales', groupBy: 'party' });
    console.log('6. Sales Report KPIs:', JSON.stringify(salesReport.kpis, null, 2));
    console.log('7. Sales Report Rows (Top 5):', JSON.stringify(salesReport.rows.slice(0, 5), null, 2));
    // Check Business 360
    const businesses = await business_repository_1.businessRepository.list();
    console.log('8. Total Businesses in Directory:', businesses.length);
    const matched = businesses.filter(b => b.name.includes('AJAY') || b.name.includes('CITY') || b.name.includes('SHIVAM'));
    console.log('9. Matched New Businesses:', matched.map(b => ({ name: b.name, taxId: b.taxId, totalSales: b.totalSales })));
}
testUserCsv().catch(err => {
    console.error('Test error:', err);
});
