"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const erp_adapter_1 = require("../src/core/adapters/erp-adapter");
const report_service_1 = require("../src/core/reports/report.service");
const canonical_repositories_1 = require("../src/infrastructure/repositories/canonical-repositories");
async function verifyFix3() {
    console.log('=== VERIFYING FIX 3: Outstanding Monthly Trend & Disclaimer ===\n');
    await canonical_repositories_1.outstandingRepository.clear();
    const filePath = path_1.default.resolve(process.cwd(), 'data', 'atc_sample_data', 'OUTSTANDING LEDGER.XLS');
    const { outstandings, report } = await erp_adapter_1.ErpAdapter.ingestOutstanding(filePath);
    await canonical_repositories_1.outstandingRepository.saveBatch(outstandings);
    console.log(`Ingested ${outstandings.length} outstanding accounts.`);
    // Test sample party total
    const sample = outstandings.find(o => o.totalOutstanding > 100000);
    if (!sample) {
        throw new Error('No sample outstanding account found');
    }
    console.log('\nSample Party Outstanding Record:');
    console.log(`  Party: ${sample.businessName}`);
    console.log(`  Total Outstanding: ₹${sample.totalOutstanding.toLocaleString()}`);
    console.log(`  Monthly Breakdown:`, JSON.stringify(sample.monthlyBreakdown, null, 2));
    console.log(`  Data Source Type: ${sample.dataSourceType}`);
    console.log(`  Notice: "${sample.notice}"`);
    console.log(`  Risk Level: ${sample.riskLevel} (${sample.riskRationale})`);
    // Verify monthly sum equals total
    const mb = sample.monthlyBreakdown;
    const sumMonths = Math.round((mb.march2026 + mb.feb2026 + mb.jan2026 + mb.dec2025 + mb.nov2025 + mb.oct2025 + mb.olderSep2025) * 100) / 100;
    console.log(`\nMonthly sum: ₹${sumMonths.toLocaleString()} vs Total: ₹${sample.totalOutstanding.toLocaleString()}`);
    const outReport = await report_service_1.ReportService.generateReport({ dataset: 'outstanding' });
    console.log(`\nReport Provenance: "${outReport.provenance?.sourceSystem}"`);
    console.log(`Report Formula: "${outReport.reconciliation?.formula}"`);
    const passed = sample.notice !== undefined &&
        sample.dataSourceType === 'monthly_snapshot' &&
        outReport.provenance?.sourceSystem.includes('Monthly Outstanding') &&
        Math.abs(sumMonths - sample.totalOutstanding) < 1.0;
    if (passed) {
        console.log('\n=====================================================================');
        console.log('>>> FIX 3 VERIFIED: Outstanding file accurately represented as monthly snapshot trend with clear notice! <<<');
        console.log('=====================================================================\n');
    }
    else {
        console.error('\n>>> FIX 3 FAILED! <<<');
        process.exit(1);
    }
}
verifyFix3().catch(err => {
    console.error(err);
    process.exit(1);
});
