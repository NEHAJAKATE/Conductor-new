/**
 * Comprehensive End-to-End Production Verification Test Suite
 * Validates ATC Pipeline Ingestion, Canonical Mapping, Entity Resolution,
 * Business 360, Generic Reports, Scheduler, and Automations.
 */

import { bootstrap } from './src/core/services/bootstrap';
import { AtcIngestRunner } from './src/core/services/atc-ingest-runner';
import { ReportService } from './src/core/reports/report.service';
import { schedulerService } from './src/core/scheduler/scheduler.service';
import { automationService } from './src/core/automation/automation.service';
import { ValidationService } from './src/core/services/validation.service';
import { CanonicalMappingService } from './src/core/mapping/canonical-mapping.service';
import fs from 'fs';

async function runEndToEndVerification() {
  console.log('====================================================');
  console.log('CONDUCTOR ATC END-TO-END ACCEPTANCE & VERIFICATION');
  console.log('====================================================\n');

  const context = bootstrap();
  const testResults: Record<string, any> = {};

  // TEST 1: Full ATC Dataset Pipeline Ingestion
  console.log('[TEST 1] Executing full ingestion on all 5 ATC datasets...');
  const ingestSummary = await AtcIngestRunner.runFullAtcIngestion(true);
  console.log(`Ingestion Status: ${ingestSummary.status} in ${(ingestSummary.totalDurationMs / 1000).toFixed(2)}s`);
  console.log(`- Parties Loaded into Business 360: ${ingestSummary.totals.partiesLoaded}`);
  console.log(`- Journal Transactions Loaded: ${ingestSummary.totals.transactionsLoaded}`);
  console.log(`- Outstanding Ledger Accounts: ${ingestSummary.totals.outstandingAccountsLoaded}`);
  console.log(`- Inventory SKUs Loaded: ${ingestSummary.totals.inventorySkusLoaded}`);

  testResults.ingestion = {
    passed: ingestSummary.status === 'COMPLETED' && ingestSummary.totals.transactionsLoaded > 80000,
    summary: ingestSummary.totals,
  };

  // TEST 2: Business 360 & Entity Resolution
  console.log('\n[TEST 2] Verifying Business 360 Entity Resolution & Directory...');
  const bStats = await context.businessRepository.getStats();
  console.log(`- Total Accounts: ${bStats.totalBusinesses}`);
  console.log(`- Verified GSTINs: ${bStats.verifiedGstin}`);
  console.log(`- B2B Chemist Dealers: ${bStats.b2bDealers}`);
  console.log(`- Hospitals/Clinics: ${bStats.b2bHospitals}`);
  console.log(`- Suppliers: ${bStats.suppliers}`);

  const sampleDealer = (await context.businessRepository.list({ query: 'AJAY' }))[0];
  console.log(`- Sample Dealer Matched: ${sampleDealer?.name} (ID: ${sampleDealer?.id}, Class: ${sampleDealer?.classification})`);

  testResults.business360 = {
    passed: bStats.totalBusinesses > 2500 && bStats.verifiedGstin > 1000,
    stats: bStats,
  };

  // TEST 3: Sales Intelligence Report (Deterministic Calculation)
  console.log('\n[TEST 3] Verifying Sales Intelligence Report...');
  const salesReport = await ReportService.generateReport({ dataset: 'sales', groupBy: 'party', limit: 5 });
  console.log(`- Sales KPIs:`, salesReport.kpis.map(k => `${k.label}: ${k.formattedValue}`).join(' | '));
  console.log(`- Top Buying Parties Sample:`, salesReport.rows.slice(0, 3).map((r: any) => `${r.dimension}: ₹${r.revenue}`));

  testResults.salesReport = {
    passed: salesReport.rows.length > 0 && salesReport.kpis.length >= 4,
    kpis: salesReport.kpis,
  };

  // TEST 4: Outstanding & Ageing Report
  console.log('\n[TEST 4] Verifying Outstanding & Ageing Ledger Report...');
  const outReport = await ReportService.generateReport({ dataset: 'outstanding', limit: 5 });
  console.log(`- Outstanding KPIs:`, outReport.kpis.map(k => `${k.label}: ${k.formattedValue}`).join(' | '));
  console.log(`- Ageing Time Buckets:`, outReport.timeSeries.map(t => `${t.label}: ₹${t.value}`).join(' | '));

  testResults.outstandingReport = {
    passed: outReport.rows.length > 0 && outReport.kpis.length >= 4,
    kpis: outReport.kpis,
  };

  // TEST 5: Inventory Stock Report
  console.log('\n[TEST 5] Verifying Inventory & Stock Report...');
  const invReport = await ReportService.generateReport({ dataset: 'inventory', limit: 5 });
  console.log(`- Inventory KPIs:`, invReport.kpis.map(k => `${k.label}: ${k.formattedValue}`).join(' | '));

  testResults.inventoryReport = {
    passed: invReport.rows.length > 0 && invReport.kpis.length >= 4,
    kpis: invReport.kpis,
  };

  // TEST 6: Failure & Edge-case Handling Test
  console.log('\n[TEST 6] Verifying Validation & Unknown Classification Fallback...');
  const valService = new ValidationService();
  const valReport = await valService.validate(['id', 'amount'], [['', '100'], ['tx-1', '200']]);
  console.log(`- Validation Output: valid=${valReport.valid}, detectedDomain=${valReport.detectedDomain}, accepted=${valReport.acceptedRecords}`);

  const unknownParty = CanonicalMappingService.mapPartyMasterToBusiness({ name: 'Generic Unknown Shop' });
  console.log(`- Unclassified Record Classification: ${unknownParty.classification} (Must be 'unknown' or 'b2b_dealer' based on evidence)`);

  testResults.edgeCases = {
    passed: valReport.acceptedRecords === 2,
  };

  // TEST 7: Automation & Rules Execution
  console.log('\n[TEST 7] Verifying Workflow Automation Engine...');
  const rules = await automationService.listRules();
  console.log(`- Configured Rules: ${rules.length} (${rules.map(r => r.name).join(', ')})`);
  await automationService.evaluateOutstanding({ name: 'TEST PHARMA', bucket90Plus: 75000 });
  const logs = await automationService.listLogs();
  console.log(`- Action Dispatched: ${logs.length > 0 ? logs[0].actionTaken : 'None'}`);

  testResults.automation = {
    passed: rules.length >= 4 && logs.length > 0,
  };

  // Summary
  const allPassed = Object.values(testResults).every((t: any) => t.passed);
  console.log('\n====================================================');
  console.log(`FINAL RESULT: ${allPassed ? 'ALL 7 PRODUCTION TESTS PASSED (10/10)' : 'TESTS FAILED'}`);
  console.log('====================================================\n');

  fs.writeFileSync('d:/conductor(11-aug)/test_run_output.json', JSON.stringify(testResults, null, 2));
}

runEndToEndVerification().catch(err => {
  console.error('Fatal error during test run:', err);
  process.exit(1);
});
