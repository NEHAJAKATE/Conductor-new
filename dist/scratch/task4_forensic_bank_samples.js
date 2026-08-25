"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const erp_adapter_1 = require("../src/core/adapters/erp-adapter");
const bank_reconciliation_service_1 = require("../src/core/reconciliation/bank-reconciliation.service");
const canonical_repositories_1 = require("../src/infrastructure/repositories/canonical-repositories");
async function forensicBankInvestigation() {
    console.log('=====================================================================');
    console.log('  TASK 4 FORENSIC: 10 UNMATCHED BANK ROWS DEEP AUDIT                 ');
    console.log('=====================================================================\n');
    // Ingest transactions and bank
    const journalPath = path_1.default.resolve(process.cwd(), 'data', 'atc_sample_data', 'date_wise_sale_&_purchase_analysis.csv');
    const { transactions } = await erp_adapter_1.ErpAdapter.ingestJournal(journalPath);
    await canonical_repositories_1.transactionRepository.saveBatch(transactions);
    const reconResult = await bank_reconciliation_service_1.BankReconciliationService.reconcile();
    const unmatched = reconResult.items.filter(i => i.matchStatus === 'UNMATCHED_BANK');
    console.log(`Total UNMATCHED_BANK rows: ${unmatched.length}\n`);
    // Pick 10 representative rows across different bank accounts and amounts
    const sampleIndices = [0, 50, 150, 300, 500, 750, 1000, 1200, 1350, 1500];
    const samples = sampleIndices.map(idx => unmatched[idx % unmatched.length]);
    const allTxs = await canonical_repositories_1.transactionRepository.getAll();
    for (let i = 0; i < samples.length; i++) {
        const item = samples[i];
        const b = item.bankRow;
        console.log(`---------------------------------------------------------------------`);
        console.log(`SAMPLE #${i + 1}:`);
        console.log(`  Bank Account : ${b.bankAccount}`);
        console.log(`  Bank Date    : ${b.date}`);
        console.log(`  Particulars  : "${b.particulars}"`);
        console.log(`  Cheque/Ref   : "${b.voucherNo || 'N/A'}"`);
        console.log(`  Amount (₹)   : ₹${b.amount.toLocaleString()} (${b.type})`);
        // Search transaction journal for any candidate with exact amount or nearby
        const exactAmountMatches = allTxs.filter(t => Math.abs(t.grossAmount - b.amount) < 0.05 || Math.abs(t.netAmount - b.amount) < 0.05);
        const dateMatches = allTxs.filter(t => t.date.substring(0, 10) === b.date.substring(0, 10));
        console.log(`  [ERP Search Results]`);
        console.log(`    Exact Amount Matches in ERP: ${exactAmountMatches.length}`);
        if (exactAmountMatches.length > 0) {
            console.log(`    Sample Amount Match: VCN #${exactAmountMatches[0].invoiceId}, Party: ${exactAmountMatches[0].partyName}, Date: ${exactAmountMatches[0].date}, Amount: ₹${exactAmountMatches[0].grossAmount}`);
        }
        console.log(`    Exact Date Matches in ERP: ${dateMatches.length}`);
        // Human Assessment
        let assessment = '';
        if (b.particulars.includes('Ag. *') || b.particulars.includes('Cheque No.')) {
            assessment = 'DATA SCOPE / CONSOLIDATED BATCH: Entry is a multi-bill consolidated cheque clearing multiple vouchers together (e.g. "Ag. *A029427,*A030624"), not a single invoice.';
        }
        else if (b.particulars.toLowerCase().includes('charges') || b.particulars.toLowerCase().includes('interest') || b.particulars.toLowerCase().includes('gst')) {
            assessment = 'NON-TRADE BANK CHARGE: Direct bank debit for service charges/interest/taxes not recorded as inventory purchase in sales journal.';
        }
        else if (exactAmountMatches.length === 0) {
            assessment = 'DATA SCOPE MISMATCH: Bank transaction amount does not exist as an individual line item in the sales/purchase journal (likely an account payment or external cash flow).';
        }
        else {
            assessment = `AMBIGUOUS MATCH: ${exactAmountMatches.length} transactions share this amount, but date/reference differed.`;
        }
        console.log(`  [Forensic Assessment]: ${assessment}\n`);
    }
}
forensicBankInvestigation().catch(console.error);
