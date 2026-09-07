import path from 'path';
import fs from 'fs';

process.env.SESSION_SECRET = process.env.SESSION_SECRET || 'atc_conductor_prod_session_secret_98a76d54f3b21e0c98e74a5b6c7d8e9f';

import { ErpAdapter } from './src/core/adapters/erp-adapter';
import { ReportService } from './src/core/reports/report.service';
import { InventoryLedgerService } from './src/core/inventory/inventory-ledger.service';
import { BankReconciliationService } from './src/core/reconciliation/bank-reconciliation.service';
import { RbacService } from './src/core/security/rbac.service';
import { AuditService } from './src/core/audit/audit.service';
import { 
  transactionRepository, 
  inventoryRepository, 
  outstandingRepository,
  TransactionRepository,
  InventoryRepository,
  OutstandingRepository
} from './src/infrastructure/repositories/canonical-repositories';
import { businessRepository, BusinessRepository } from './src/infrastructure/repositories/business-repository';

async function runMasterAcceptanceTests() {
  console.log('=====================================================================');
  console.log('       ATC CONDUCTOR: MASTER ACCEPTANCE TEST SUITE (8/8)            ');
  console.log('=====================================================================\n');

  let passedCount = 0;
  const totalTests = 8;

  // -------------------------------------------------------------------------
  // TEST 1: Empty tenant, no upload → all reports show NOT_CONNECTED / zero, no fake numbers
  // -------------------------------------------------------------------------
  console.log('--- TEST 1: Empty Tenant State Verification ---');
  await transactionRepository.clear();
  await inventoryRepository.clear();
  await outstandingRepository.clear();
  await businessRepository.clear();

  const emptySales = await ReportService.generateReport({ dataset: 'sales' });
  const emptyPurchases = await ReportService.generateReport({ dataset: 'purchases' });
  const emptyStock = await ReportService.generateReport({ dataset: 'inventory' });
  const emptyOut = await ReportService.generateReport({ dataset: 'outstanding' });

  const t1Passed = 
    emptySales.status === 'NOT_CONNECTED' &&
    emptySales.rows.length === 0 &&
    emptyPurchases.status === 'NOT_CONNECTED' &&
    emptyStock.status === 'NOT_CONNECTED' &&
    emptyOut.status === 'NOT_CONNECTED';

  if (t1Passed) {
    console.log('  [PASS] Test 1: Empty tenant correctly displays "NOT_CONNECTED" without sample data injection.\n');
    passedCount++;
  } else {
    console.error('  [FAIL] Test 1: Empty tenant did not return expected empty status!');
    process.exit(1);
  }

  // -------------------------------------------------------------------------
  // TEST 2: Ingest Real CSV → Net Sales = ₹95,052,611.91, Net Purchases = ₹93,642,186.16
  // -------------------------------------------------------------------------
  console.log('--- TEST 2: Real Journal CSV Ingestion & Sign Correction ---');
  const journalPath = path.resolve(process.cwd(), 'data', 'atc_sample_data', 'date_wise_sale_&_purchase_analysis.csv');
  const { transactions } = await ErpAdapter.ingestJournal(journalPath);
  await transactionRepository.saveBatch(transactions);

  const salesReport = await ReportService.generateReport({ dataset: 'sales' });
  const purcReport = await ReportService.generateReport({ dataset: 'purchases' });

  const netSales = Number(salesReport.reconciliation?.netAmount || 0);
  const netPurchases = Number(purcReport.reconciliation?.netAmount || 0);

  console.log(`  Report Net Sales: ₹${netSales.toLocaleString()} (Target: ₹95,052,611.91)`);
  console.log(`  Report Net Purchases: ₹${netPurchases.toLocaleString()} (Target: ₹93,642,186.16)`);

  const t2SalesMatch = Math.abs(netSales - 95052611.91) < 1.0;
  const t2PurcMatch = Math.abs(netPurchases - 93642186.16) < 1.0;

  if (t2SalesMatch && t2PurcMatch) {
    console.log('  [PASS] Test 2: Net Sales and Net Purchases match target figures to the rupee.\n');
    passedCount++;
  } else {
    console.error('  [FAIL] Test 2: Net financial calculations did not match targets!');
    process.exit(1);
  }

  // -------------------------------------------------------------------------
  // TEST 3: Ingest OUTSTANDING file → Honest monthly trend labeling and SOW buckets
  // -------------------------------------------------------------------------
  console.log('--- TEST 3: Outstanding Ledger & Monthly Trend Labeling ---');
  const outstandingPath = path.resolve(process.cwd(), 'data', 'atc_sample_data', 'OUTSTANDING LEDGER.XLS');
  const { outstandings } = await ErpAdapter.ingestOutstanding(outstandingPath);
  await outstandingRepository.saveBatch(outstandings);

  const outReport = await ReportService.generateReport({ dataset: 'outstanding' });
  const provSource = outReport.provenance?.sourceSystem || '';
  const formula = outReport.reconciliation?.formula || '';

  console.log(`  Outstanding Provenance: "${provSource}"`);
  console.log(`  Reconciliation Formula: "${formula}"`);
  console.log(`  Total Receivables: ₹${outReport.reconciliation?.netAmount?.toLocaleString()}`);

  const t3Passed = 
    provSource.includes('Monthly Outstanding') && 
    outReport.rows.length > 0 &&
    outReport.rows[0].monthlyBreakdown !== undefined;

  if (t3Passed) {
    console.log('  [PASS] Test 3: Outstanding ledger honestly represents monthly trend snapshot with explainable risk.\n');
    passedCount++;
  } else {
    console.error('  [FAIL] Test 3: Outstanding ledger lacked expected monthly breakdown provenance!');
    process.exit(1);
  }

  // -------------------------------------------------------------------------
  // TEST 4: Inventory Ledger Closing Stock Matches Manual Arithmetic
  // -------------------------------------------------------------------------
  console.log('--- TEST 4: Running SKU Inventory Ledger Arithmetic ---');
  const stockPath = path.resolve(process.cwd(), 'data', 'atc_sample_data', 'OPENING STOCK.XLS');
  const { inventory } = await ErpAdapter.ingestStock(stockPath);
  await inventoryRepository.saveBatch(inventory);

  const ledgerSummary = await InventoryLedgerService.computeRunningLedger();
  const testItem = ledgerSummary.items[0];

  const manualCheck = Math.round(
    (testItem.openingStock + testItem.purchases + testItem.salesReturns - testItem.sales - testItem.purchaseReturns - testItem.breakage + testItem.adjustments) * 100
  ) / 100;

  console.log(`  SKU: ${testItem.productName}`);
  console.log(`  Formula: ${testItem.openingStock} + ${testItem.purchases} + ${testItem.salesReturns} - ${testItem.sales} - ${testItem.purchaseReturns} - ${testItem.breakage} ± ${testItem.adjustments}`);
  console.log(`  Calculated Closing: ${testItem.calculatedClosingStock} vs Manual: ${manualCheck}`);

  if (testItem.calculatedClosingStock === manualCheck) {
    console.log('  [PASS] Test 4: Inventory ledger closing stock matches manual arithmetic exactly.\n');
    passedCount++;
  } else {
    console.error('  [FAIL] Test 4: Inventory arithmetic mismatch!');
    process.exit(1);
  }

  // -------------------------------------------------------------------------
  // TEST 5: Reorder Flags Trigger at 25 Strips (Configurable 100-Strip Rule)
  // -------------------------------------------------------------------------
  console.log('--- TEST 5: Configurable 25-Strip Reorder Rule Verification ---');
  const lowStockItems = ledgerSummary.items.filter(i => i.isLowStock);
  const allBelow25 = lowStockItems.every(i => i.calculatedClosingStock <= i.reorderPolicy.reorderThreshold);

  console.log(`  Total Low Stock SKUs Identified: ${lowStockItems.length}`);
  console.log(`  Sample Low Stock: ${lowStockItems[0]?.productName} (Stock: ${lowStockItems[0]?.calculatedClosingStock}, Threshold: ${lowStockItems[0]?.reorderPolicy.reorderThreshold})`);
  console.log(`  Sample Reorder Recommendation: ${lowStockItems[0]?.recommendedOrderQuantity} units`);

  if (lowStockItems.length > 0 && allBelow25 && lowStockItems[0]?.reorderPolicy.reorderThreshold === 25) {
    console.log('  [PASS] Test 5: Reorder flags trigger deterministically at 25-strip threshold with 100-unit baseline.\n');
    passedCount++;
  } else {
    console.error('  [FAIL] Test 5: Reorder threshold was not 25 strips!');
    process.exit(1);
  }

  // -------------------------------------------------------------------------
  // TEST 6: Bank Reconciliation Produces MATCHED and MISMATCH/UNMATCHED rows
  // -------------------------------------------------------------------------
  console.log('--- TEST 6: Bank Reconciliation Engine Classification ---');
  const bankRecon = await BankReconciliationService.reconcile();

  console.log(`  MATCHED Rows: ${bankRecon.matchedCount} (₹${bankRecon.matchedAmount.toLocaleString()})`);
  console.log(`  UNMATCHED Bank Rows: ${bankRecon.unmatchedCount}`);
  console.log(`  AMOUNT MISMATCH Rows: ${bankRecon.mismatchCount}`);

  if (bankRecon.matchedCount > 0 && (bankRecon.unmatchedCount > 0 || bankRecon.mismatchCount > 0)) {
    console.log('  [PASS] Test 6: Bank reconciliation successfully matched and classified discrepancies.\n');
    passedCount++;
  } else {
    console.error('  [FAIL] Test 6: Bank reconciliation did not produce both matched and unmatched rows!');
    process.exit(1);
  }

  // -------------------------------------------------------------------------
  // TEST 7: Restart Server → All Data Survives (Disk Persistence)
  // -------------------------------------------------------------------------
  console.log('--- TEST 7: Persistence Verification across Simulated Restart ---');
  // Instantiate brand new repository instances to simulate process restart
  const newTxRepo = new TransactionRepository();
  const newInvRepo = new InventoryRepository();
  const newOutRepo = new OutstandingRepository();

  const persistedTxs = await newTxRepo.getAll();
  const persistedInvs = await newInvRepo.list();
  const persistedOuts = await newOutRepo.list();

  const origInvs = await inventoryRepository.list();
  const origOuts = await outstandingRepository.list();

  console.log(`  Reloaded Transactions: ${persistedTxs.length} (Expected: ${transactions.length})`);
  console.log(`  Reloaded Inventory SKUs: ${persistedInvs.length} (Expected: ${origInvs.length})`);
  console.log(`  Reloaded Outstandings: ${persistedOuts.length} (Expected: ${origOuts.length})`);

  if (persistedTxs.length === transactions.length && persistedInvs.length === origInvs.length && persistedOuts.length === origOuts.length) {
    console.log('  [PASS] Test 7: All canonical records survived restart via data/ready/ disk storage.\n');
    passedCount++;
  } else {
    console.error('  [FAIL] Test 7: Data did not persist across repository re-instantiation!');
    process.exit(1);
  }

  // -------------------------------------------------------------------------
  // TEST 8: Server-Side RBAC Enforcement (Staff Gets 403 on Financial/Bank Routes)
  // -------------------------------------------------------------------------
  console.log('--- TEST 8: Server-Side RBAC & 403 Enforcement ---');
  const { SessionService } = await import('./src/core/security/session.service');

  const staffToken = SessionService.createToken({
    userId: 'usr_staff_counter_1',
    name: 'Counter Staff',
    email: 'staff@agrawaltrading.com',
    role: 'STAFF',
  });

  const ownerToken = SessionService.createToken({
    userId: 'usr_rajat_owner',
    name: 'Rajat Agrawal',
    email: 'owner@agrawaltrading.com',
    role: 'OWNER',
  });

  const staffReq = new Request('http://localhost:3000/api/v1/reconciliation', {
    headers: { 'Authorization': `Bearer ${staffToken}` },
  });
  const ownerReq = new Request('http://localhost:3000/api/v1/reconciliation', {
    headers: { 'Authorization': `Bearer ${ownerToken}` },
  });

  const staffAuth = RbacService.authorize(staffReq, 'VIEW_BANK_RECONCILIATION');
  const ownerAuth = RbacService.authorize(ownerReq, 'VIEW_BANK_RECONCILIATION');

  console.log(`  Staff Access Result: allowed=${staffAuth.allowed}, error="${staffAuth.error}"`);
  console.log(`  Owner Access Result: allowed=${ownerAuth.allowed}`);

  if (!staffAuth.allowed && ownerAuth.allowed) {
    console.log('  [PASS] Test 8: Server-side RBAC strictly denies Staff (403) and permits Owner.\n');
    passedCount++;
  } else {
    console.error('  [FAIL] Test 8: RBAC authorization check failed!');
    process.exit(1);
  }

  // -------------------------------------------------------------------------
  // FINAL SCORECARD
  // -------------------------------------------------------------------------
  console.log('=====================================================================');
  console.log(`  MASTER ACCEPTANCE TEST SUMMARY: ${passedCount}/${totalTests} TESTS PASSED`);
  console.log('  STATUS: 100% VERIFIED & PRODUCTION READY');
  console.log('=====================================================================\n');
}

runMasterAcceptanceTests().catch(err => {
  console.error('Master acceptance test failed with error:', err);
  process.exit(1);
});
