"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const erp_adapter_1 = require("../src/core/adapters/erp-adapter");
const bank_reconciliation_service_1 = require("../src/core/reconciliation/bank-reconciliation.service");
const canonical_repositories_1 = require("../src/infrastructure/repositories/canonical-repositories");
async function testBankReconciliation() {
    console.log('Testing Step 6: Bank Ledger Integration & Reconciliation Engine...');
    // 1. Ingest Journal Transactions to provide matching candidates
    const journalPath = path_1.default.resolve(process.cwd(), 'data', 'atc_sample_data', 'date_wise_sale_&_purchase_analysis.csv');
    const { transactions } = await erp_adapter_1.ErpAdapter.ingestJournal(journalPath);
    await canonical_repositories_1.transactionRepository.saveBatch(transactions);
    console.log(`Saved ${transactions.length} canonical transactions to repository.`);
    // 2. Run Bank Reconciliation
    const recon = await bank_reconciliation_service_1.BankReconciliationService.reconcile();
    console.log('\n--- BANK RECONCILIATION SUMMARY ---');
    console.log(`Total Bank Lines: ${recon.totalBankEntries}`);
    console.log(`Total Receipts: ₹${recon.totalReceiptAmount.toLocaleString()}`);
    console.log(`Total Payments: ₹${recon.totalPaymentAmount.toLocaleString()}`);
    console.log(`MATCHED Entries: ${recon.matchedCount} (₹${recon.matchedAmount.toLocaleString()})`);
    console.log(`UNMATCHED Entries: ${recon.unmatchedCount} (₹${recon.unmatchedAmount.toLocaleString()})`);
    console.log(`MISMATCH Entries: ${recon.mismatchCount} (₹${recon.mismatchAmount.toLocaleString()})`);
    const matchedRow = recon.items.find(i => i.matchStatus === 'MATCHED');
    const unmatchedRow = recon.items.find(i => i.matchStatus === 'UNMATCHED_BANK' && i.bankRow.type !== 'OPENING');
    const mismatchRow = recon.items.find(i => i.matchStatus === 'AMOUNT_MISMATCH' || i.matchStatus === 'DATE_MISMATCH');
    if (matchedRow) {
        console.log('\n>>> Sample MATCHED Row:');
        console.log(`  Bank: ${matchedRow.bankRow.bankAccount} | ${matchedRow.bankRow.date} | ₹${matchedRow.bankRow.amount} | ${matchedRow.bankRow.particulars.substring(0, 50)}`);
        console.log(`  Matched ERP: Voucher #${matchedRow.matchedTransaction?.invoiceId} (${matchedRow.matchedTransaction?.partyName}) | ₹${matchedRow.matchedTransaction?.grossAmount}`);
        console.log(`  Confidence: ${matchedRow.matchConfidence}% | Notes: ${matchedRow.notes}`);
    }
    if (unmatchedRow) {
        console.log('\n>>> Sample UNMATCHED Row:');
        console.log(`  Bank: ${unmatchedRow.bankRow.bankAccount} | ${unmatchedRow.bankRow.date} | ₹${unmatchedRow.bankRow.amount} | ${unmatchedRow.bankRow.particulars.substring(0, 50)}`);
        console.log(`  Status: ${unmatchedRow.matchStatus} | Notes: ${unmatchedRow.notes}`);
    }
    // Acceptance Test Verification: Bank file produces at least one MATCHED and at least one MISMATCH/UNMATCHED row
    if (recon.matchedCount > 0 && (recon.unmatchedCount > 0 || recon.mismatchCount > 0)) {
        console.log('\n=====================================================================');
        console.log(`>>> STEP 6 PASSED: Bank reconciliation produced ${recon.matchedCount} MATCHED and ${recon.unmatchedCount + recon.mismatchCount} UNMATCHED/MISMATCH rows! <<<`);
        console.log('=====================================================================\n');
    }
    else {
        console.error('\n>>> STEP 6 FAILED: Expected both matched and unmatched rows! <<<');
        process.exit(1);
    }
}
testBankReconciliation().catch(err => {
    console.error(err);
    process.exit(1);
});
