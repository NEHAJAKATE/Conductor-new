import fs from 'fs';
import path from 'path';
import { businessRepository } from './src/infrastructure/repositories/business-repository';
import { transactionRepository } from './src/infrastructure/repositories/canonical-repositories';
import { CreditLimitService } from './src/core/pipeline/credit-limit.service';

async function audit() {
  console.log('=====================================================================');
  console.log('               DEEP DIVE AUDIT: 3 CRITICAL CHECKS                   ');
  console.log('=====================================================================\n');

  const allBusinesses = await businessRepository.list();
  const allTransactions = await transactionRepository.getAll();
  const resolvedSalesMap = await CreditLimitService.buildResolvedMonthlySalesMap(allTransactions);

  // -------------------------------------------------------------------------
  // CHECK 1: The 30 non-GSTIN businesses with totalSales > 0 but dynamicCreditLimit === 0
  // -------------------------------------------------------------------------
  console.log('>>> CHECK 1: Investigating the 30 non-GSTIN businesses without dynamic limits...');
  const nonGstinWithSales = allBusinesses.filter(
    b => b.id.startsWith('party:') && (b.totalSales ?? 0) > 0
  );
  
  const unresolvedNonGstin = nonGstinWithSales.filter(
    b => (b.credit?.dynamicCreditLimit ?? 0) === 0
  );

  console.log(`Total non-GSTIN with sales: ${nonGstinWithSales.length}`);
  console.log(`Unresolved non-GSTIN count: ${unresolvedNonGstin.length}\n`);

  for (const b of unresolvedNonGstin) {
    const monthMap = resolvedSalesMap.get(b.id);
    const hasResolvedSales = monthMap && monthMap.size > 0;
    const isPayable = (b.currentOutstanding ?? 0) < 0;
    console.log(`- ID: ${b.id}`);
    console.log(`  Name: "${b.name}" | Ledger: "${b.ledgerName || ''}"`);
    console.log(`  TotalSales recorded on entity: ₹${b.totalSales}`);
    console.log(`  Current Outstanding: ₹${b.currentOutstanding ?? 0}`);
    console.log(`  Has entries in resolvedSalesMap: ${hasResolvedSales} (month count: ${monthMap?.size ?? 0})`);
    console.log(`  Reason for dynamicCreditLimit=0: ${isPayable ? 'NEGATIVE OUTSTANDING (Payable)' : (b.credit?.creditStatusReason || 'Unknown')}`);
    console.log('  ---');
  }

  // -------------------------------------------------------------------------
  // CHECK 2: Manual Spot Check on BEE PEE CHEMIST & DRUGGIST
  // -------------------------------------------------------------------------
  console.log('\n=====================================================================');
  console.log('>>> CHECK 2: Manual Spot Check on BEE PEE CHEMIST & DRUGGIST (gst:09AFDPJ6809G1ZE)');
  console.log('=====================================================================');

  const beePee = await businessRepository.findById('gst:09AFDPJ6809G1ZE');
  console.log('Business Entity State in DB:', JSON.stringify(beePee?.credit, null, 2));

  // Find all transactions in canonical transaction list for BEE PEE CHEMIST
  const beePeeTxs = allTransactions.filter(
    tx => tx.partyGstin === '09AFDPJ6809G1ZE' || tx.partyId === 'gst:09AFDPJ6809G1ZE' || tx.partyName.includes('BEE PEE')
  );

  console.log(`Found ${beePeeTxs.length} transactions for BEE PEE CHEMIST:`);
  const monthlyTxs = new Map<string, { count: number; netSales: number; returns: number; rows: any[] }>();

  for (const tx of beePeeTxs) {
    const month = tx.date.substring(0, 7);
    if (!monthlyTxs.has(month)) {
      monthlyTxs.set(month, { count: 0, netSales: 0, returns: 0, rows: [] });
    }
    const m = monthlyTxs.get(month)!;
    m.count++;
    if (tx.type === 'sale') m.netSales += tx.netAmount;
    if (tx.type === 'sale_return') m.returns += tx.netAmount;
    m.rows.push({
      date: tx.date.substring(0, 10),
      type: tx.type,
      invoice: tx.invoiceId,
      product: tx.items[0]?.productName,
      netAmount: tx.netAmount,
    });
  }

  let grandTotalNet = 0;
  for (const [month, data] of Array.from(monthlyTxs.entries()).sort()) {
    const monthNet = data.netSales - data.returns;
    grandTotalNet += monthNet;
    console.log(`  Month ${month}: ${data.count} txs | Sales: ₹${data.netSales.toFixed(2)} | Returns: ₹${data.returns.toFixed(2)} | Net: ₹${monthNet.toFixed(2)}`);
  }

  const monthCount = monthlyTxs.size;
  const manualAvgMonthlySale = grandTotalNet / monthCount;
  const manualDynamicLimit = manualAvgMonthlySale * 1.5;
  const manualUtilization = (beePee?.currentOutstanding ?? 0) / manualDynamicLimit * 100;

  console.log('\n  Independent Manual Calculation:');
  console.log(`  - Months with sales: ${monthCount}`);
  console.log(`  - Total Net Sales: ₹${grandTotalNet.toFixed(2)}`);
  console.log(`  - Manual Avg Monthly Sale: ₹${manualAvgMonthlySale.toFixed(2)}`);
  console.log(`  - Manual Dynamic Limit (1.5x): ₹${manualDynamicLimit.toFixed(2)}`);
  console.log(`  - Outstanding: ₹${beePee?.currentOutstanding}`);
  console.log(`  - Manual Utilization: ${manualUtilization.toFixed(2)}%`);
  console.log(`  - Matches System Result? ${Math.abs(manualAvgMonthlySale - (beePee?.credit.avgMonthlySale || 0)) < 1 ? 'YES (EXACT MATCH)' : 'MISMATCH'}`);

  // -------------------------------------------------------------------------
  // CHECK 3: Breakdown of NO_HISTORY (1,733 accounts)
  // -------------------------------------------------------------------------
  console.log('\n=====================================================================');
  console.log('>>> CHECK 3: Deep Breakdown of NO_HISTORY accounts (1,733 total)');
  console.log('=====================================================================');

  const noHistoryAccounts = allBusinesses.filter(b => b.credit?.creditStatus === 'NO_HISTORY');
  console.log(`Total NO_HISTORY accounts: ${noHistoryAccounts.length}`);

  let payablesCount = 0;
  let suppliersCount = 0;
  let fieldStaffCount = 0;
  let zeroSalesReceivables = 0;
  let zeroSalesNoOutstanding = 0;
  let hasSalesButUnresolved = 0;

  for (const b of noHistoryAccounts) {
    const out = b.currentOutstanding ?? 0;
    const sales = b.totalSales ?? 0;

    if (out < 0) {
      payablesCount++;
    } else if (b.classification === 'supplier') {
      suppliersCount++;
    } else if (b.classification === 'field_staff') {
      fieldStaffCount++;
    } else if (sales === 0 && out > 0) {
      zeroSalesReceivables++;
    } else if (sales === 0 && out === 0) {
      zeroSalesNoOutstanding++;
    } else if (sales > 0) {
      hasSalesButUnresolved++;
    }
  }

  console.log(`  1. Negative Outstanding (Creditors / Payables ATC owes): ${payablesCount}`);
  console.log(`  2. Pure Supplier accounts: ${suppliersCount}`);
  console.log(`  3. Field staff accounts: ${fieldStaffCount}`);
  console.log(`  4. Zero Sales + Zero Outstanding (Dormant Party Master entries): ${zeroSalesNoOutstanding}`);
  console.log(`  5. Zero Sales + Positive Outstanding (Debtors with prior year debt, no FY26-27 sales): ${zeroSalesReceivables}`);
  console.log(`  6. Has Sales recorded on entity but unresolved in CreditLimitService: ${hasSalesButUnresolved}`);

  console.log('\n=====================================================================');
  console.log('                         AUDIT COMPLETE                              ');
  console.log('=====================================================================');
}

audit().catch(console.error);
