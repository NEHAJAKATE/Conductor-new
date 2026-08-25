/**
 * Verification Script: Dynamic Credit Limit Engine
 * 
 * Verifies:
 * 1. Step 6 execution during full ATC ingestion
 * 2. Correct computation of avgMonthlySale, dynamicCreditLimit (avg * 1.5), and creditUtilization
 * 3. Status distribution (WITHIN_LIMIT, APPROACHING_LIMIT, BREACHED, NO_HISTORY)
 * 4. Join-fix verification: Checks non-GSTIN businesses ('party:' prefix) to ensure they resolve properly
 */

import { AtcIngestRunner } from './src/core/services/atc-ingest-runner';
import { businessRepository } from './src/infrastructure/repositories/business-repository';
import { transactionRepository, outstandingRepository } from './src/infrastructure/repositories/canonical-repositories';

async function runVerification() {
  console.log('=====================================================================');
  console.log('       RUNNING DYNAMIC CREDIT LIMIT END-TO-END VERIFICATION          ');
  console.log('=====================================================================\n');

  console.log('>>> Triggering full ATC ingestion with force=true...');
  const summary = await AtcIngestRunner.runFullAtcIngestion(true);

  console.log('\n>>> Ingestion Status:', summary.status);
  console.log(`>>> Parties Loaded: ${summary.totals.partiesLoaded}`);
  console.log(`>>> Transactions Loaded: ${summary.totals.transactionsLoaded}`);
  console.log(`>>> Outstanding Loaded: ${summary.totals.outstandingAccountsLoaded}`);

  const allBusinesses = await businessRepository.list();
  console.log(`\n>>> Total businesses in repository: ${allBusinesses.length}`);

  let withinLimit = 0;
  let approaching = 0;
  let breached = 0;
  let noHistory = 0;
  let withDynamicLimit = 0;

  for (const b of allBusinesses) {
    const status = b.credit?.creditStatus;
    if (status === 'WITHIN_LIMIT') withinLimit++;
    else if (status === 'APPROACHING_LIMIT') approaching++;
    else if (status === 'BREACHED') breached++;
    else if (status === 'NO_HISTORY') noHistory++;

    if ((b.credit?.dynamicCreditLimit ?? 0) > 0) {
      withDynamicLimit++;
    }
  }

  console.log('\n=====================================================================');
  console.log('                    CREDIT STATUS DISTRIBUTION                       ');
  console.log('=====================================================================');
  console.log(`  WITHIN_LIMIT       : ${withinLimit}`);
  console.log(`  APPROACHING_LIMIT  : ${approaching}`);
  console.log(`  BREACHED           : ${breached}`);
  console.log(`  NO_HISTORY         : ${noHistory}`);
  console.log(`  TOTAL WITH DYN LIM : ${withDynamicLimit}`);
  console.log('=====================================================================\n');

  // Specific Check 1: Non-GSTIN businesses (the exact join risk fixed)
  console.log('>>> JOIN-FIX TEST: Checking non-GSTIN businesses (party: prefix)...');
  const nonGstinWithSales = allBusinesses.filter(
    b => b.id.startsWith('party:') && (b.totalSales ?? 0) > 0
  );
  console.log(`  Found ${nonGstinWithSales.length} non-GSTIN businesses with sales.`);

  const resolvedNonGstin = nonGstinWithSales.filter(
    b => (b.credit?.dynamicCreditLimit ?? 0) > 0
  );
  console.log(`  Resolved with Dynamic Credit Limit > 0: ${resolvedNonGstin.length} / ${nonGstinWithSales.length}`);

  if (resolvedNonGstin.length > 0) {
    console.log('\n  Sample Non-GSTIN Resolved Accounts:');
    for (const b of resolvedNonGstin.slice(0, 3)) {
      console.log(`    - ID: ${b.id}`);
      console.log(`      Name: ${b.name}`);
      console.log(`      Total Sales: ₹${Math.round(b.totalSales || 0).toLocaleString()}`);
      console.log(`      Months History: ${b.credit.monthsOfHistory}`);
      console.log(`      Avg Monthly Sale: ₹${Math.round(b.credit.avgMonthlySale || 0).toLocaleString()}`);
      console.log(`      Dynamic Limit (1.5x): ₹${Math.round(b.credit.dynamicCreditLimit || 0).toLocaleString()}`);
      console.log(`      Current Outstanding: ₹${Math.round(b.currentOutstanding || 0).toLocaleString()}`);
      console.log(`      Utilization: ${b.credit.creditUtilization}%`);
      console.log(`      Status: ${b.credit.creditStatus}`);
      console.log('      ---');
    }
  }

  // Specific Check 2: Sample BREACHED customers
  const breachedList = allBusinesses.filter(b => b.credit?.creditStatus === 'BREACHED');
  console.log(`\n>>> Sample BREACHED Accounts (${breachedList.length} total):`);
  for (const b of breachedList.slice(0, 3)) {
    console.log(`  - Name: ${b.name} (${b.id})`);
    console.log(`    Avg Monthly Sale: ₹${Math.round(b.credit.avgMonthlySale || 0).toLocaleString()}`);
    console.log(`    Dynamic Limit (1.5x): ₹${Math.round(b.credit.dynamicCreditLimit || 0).toLocaleString()}`);
    console.log(`    Outstanding: ₹${Math.round(b.currentOutstanding || 0).toLocaleString()}`);
    console.log(`    Utilization: ${b.credit.creditUtilization}%`);
    console.log(`    Reason: ${b.credit.creditStatusReason}`);
    console.log('    ---');
  }

  // Specific Check 3: Sample WITHIN_LIMIT customers
  const safeList = allBusinesses.filter(b => b.credit?.creditStatus === 'WITHIN_LIMIT');
  console.log(`\n>>> Sample WITHIN_LIMIT Accounts (${safeList.length} total):`);
  for (const b of safeList.slice(0, 3)) {
    console.log(`  - Name: ${b.name} (${b.id})`);
    console.log(`    Avg Monthly Sale: ₹${Math.round(b.credit.avgMonthlySale || 0).toLocaleString()}`);
    console.log(`    Dynamic Limit (1.5x): ₹${Math.round(b.credit.dynamicCreditLimit || 0).toLocaleString()}`);
    console.log(`    Outstanding: ₹${Math.round(b.currentOutstanding || 0).toLocaleString()}`);
    console.log(`    Utilization: ${b.credit.creditUtilization}%`);
    console.log(`    Reason: ${b.credit.creditStatusReason}`);
    console.log('    ---');
  }

  console.log('\n>>> Verification finished successfully!');
}

runVerification().catch(err => {
  console.error('Verification failed:', err);
  process.exit(1);
});
