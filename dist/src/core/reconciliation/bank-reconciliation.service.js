"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BankReconciliationService = void 0;
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const parser_factory_1 = require("@/core/parser/parser-factory");
const canonical_mapping_service_1 = require("@/core/mapping/canonical-mapping.service");
const canonical_repositories_1 = require("@/infrastructure/repositories/canonical-repositories");
class BankReconciliationService {
    /**
     * Parses the Marg ERP multi-account bank & cash ledger XLS file
     */
    static parseBankLedgerFile(buffer) {
        const parsed = parser_factory_1.ParserFactory.parse(buffer, '.xls');
        const rows = parsed.rows;
        const records = [];
        let currentAccount = 'DEFAULT BANK';
        let lastDate = '2026-04-01';
        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            const col0 = String(row[0] || '').trim();
            const col1 = String(row[1] || '').trim();
            const col2 = String(row[2] || '').trim();
            const receiptStr = String(row[5] || row[4] || '').trim();
            const paymentStr = String(row[6] || row[5] || '').trim();
            const balanceStr = String(row[7] || row[6] || '').trim();
            // Check for ledger header
            if (col0.toLowerCase().includes('ledger account') || col0.toLowerCase().includes('bank of') || col0.toLowerCase().includes('axis bank') || col0.toLowerCase().includes('cash')) {
                const cleanName = col0.replace(/ledger account\s*:\s*/gi, '').trim();
                if (cleanName) {
                    currentAccount = cleanName;
                }
                continue;
            }
            if (col0 === 'TOTAL' || col0.includes('TOTAL') || col0.startsWith('20027805111')) {
                continue;
            }
            const receipt = parseFloat(receiptStr.replace(/,/g, '')) || 0;
            const payment = parseFloat(paymentStr.replace(/,/g, '')) || 0;
            const balance = parseFloat(balanceStr.replace(/,/g, '')) || 0;
            if (receipt === 0 && payment === 0 && !col2.toLowerCase().includes('opening balance')) {
                continue;
            }
            if (col0 && col0.length > 2) {
                lastDate = canonical_mapping_service_1.CanonicalMappingService.parseDate(col0);
            }
            const particulars = [col2, row[3], row[4]].filter(Boolean).map(s => String(s).trim()).join(' ');
            // Extract invoice/bill references (e.g. A012158, CN00032, VCN numbers)
            const refMatches = particulars.match(/([A-Za-z0-9_-]{5,20})/g) || [];
            const extractedRefs = Array.from(new Set(refMatches.filter(r => !['Cheque', 'No', 'Ag', 'Transfer', 'RTGS', 'NEFT', 'IMPS', 'Deposit', 'Withdrawal', 'Opening', 'Balance'].includes(r))));
            let type = 'RECEIPT';
            let amount = receipt;
            if (payment > 0) {
                type = 'PAYMENT';
                amount = payment;
            }
            else if (particulars.toLowerCase().includes('opening balance')) {
                type = 'OPENING';
                amount = balance;
            }
            records.push({
                id: `bank_${currentAccount.replace(/[^a-z0-9]/gi, '_')}_${i}_${Date.now()}`,
                bankAccount: currentAccount,
                date: lastDate,
                rawDate: col0 || lastDate,
                voucherNo: col1 || undefined,
                particulars,
                type,
                amount: Math.abs(amount),
                balance,
                extractedRefs,
            });
        }
        return records;
    }
    /**
     * Runs the automated bank reconciliation engine matching bank lines against canonical transactions
     */
    static async reconcile(params = {}) {
        let bankRows = params.bankRows;
        if (!bankRows || bankRows.length === 0) {
            const bankFilePath = path_1.default.resolve(process.cwd(), 'data', 'atc_sample_data', 'BANK & CASH LEDGERS.XLS');
            if (fs_1.default.existsSync(bankFilePath)) {
                const buffer = await fs_1.default.promises.readFile(bankFilePath);
                bankRows = this.parseBankLedgerFile(buffer);
            }
            else {
                bankRows = [];
            }
        }
        if (params.accountFilter) {
            const filter = params.accountFilter.toLowerCase();
            bankRows = bankRows.filter(r => r.bankAccount.toLowerCase().includes(filter));
        }
        const allTransactions = await canonical_repositories_1.transactionRepository.getAll();
        // Index transactions by invoiceId and partyName
        const txByInvoiceId = new Map();
        const txByGrossAmount = new Map();
        for (const tx of allTransactions) {
            if (tx.invoiceId) {
                txByInvoiceId.set(tx.invoiceId.toLowerCase().trim(), tx);
            }
            const roundedGross = Math.round(tx.grossAmount);
            const existing = txByGrossAmount.get(roundedGross) || [];
            existing.push(tx);
            txByGrossAmount.set(roundedGross, existing);
        }
        let totalReceiptAmount = 0;
        let totalPaymentAmount = 0;
        let closingBankBalance = 0;
        let matchedCount = 0;
        let matchedAmount = 0;
        let unmatchedCount = 0;
        let unmatchedAmount = 0;
        let mismatchCount = 0;
        let mismatchAmount = 0;
        const reconciledItems = [];
        const usedTxIds = new Set();
        for (const bankRow of bankRows) {
            if (bankRow.type === 'RECEIPT')
                totalReceiptAmount += bankRow.amount;
            if (bankRow.type === 'PAYMENT')
                totalPaymentAmount += bankRow.amount;
            closingBankBalance = bankRow.balance;
            let matchedTx;
            let matchStatus = 'UNMATCHED_BANK';
            let matchType = undefined;
            let matchConfidence = 0;
            let variance = 0;
            let notes;
            // Rule 1: Exact Reference Match from extracted invoice/bill references
            for (const ref of bankRow.extractedRefs) {
                const cleanRef = ref.toLowerCase().trim();
                const candidate = txByInvoiceId.get(cleanRef);
                if (candidate && !usedTxIds.has(candidate.id)) {
                    matchedTx = candidate;
                    matchType = 'REFERENCE_EXACT';
                    break;
                }
            }
            // Rule 2: Amount & Party Match
            if (!matchedTx && bankRow.amount > 0) {
                const roundedBankAmt = Math.round(bankRow.amount);
                const candidates = txByGrossAmount.get(roundedBankAmt) || [];
                for (const candidate of candidates) {
                    if (!usedTxIds.has(candidate.id)) {
                        const cleanPart = bankRow.particulars.toLowerCase();
                        const party = candidate.partyName.toLowerCase();
                        if (cleanPart.includes(party) || party.includes(cleanPart.substring(0, 8))) {
                            matchedTx = candidate;
                            matchType = 'PARTY_AND_AMOUNT';
                            break;
                        }
                    }
                }
            }
            // Rule 3: Amount-only Candidate
            if (!matchedTx && bankRow.amount > 1000) {
                const roundedBankAmt = Math.round(bankRow.amount);
                const candidates = txByGrossAmount.get(roundedBankAmt) || [];
                for (const candidate of candidates) {
                    if (!usedTxIds.has(candidate.id)) {
                        matchedTx = candidate;
                        matchType = 'AMOUNT_ONLY';
                        break;
                    }
                }
            }
            if (matchedTx) {
                usedTxIds.add(matchedTx.id);
                const amtDiff = Math.abs(bankRow.amount - matchedTx.grossAmount);
                variance = Math.round((bankRow.amount - matchedTx.grossAmount) * 100) / 100;
                if (amtDiff < 1.0) {
                    matchStatus = 'MATCHED';
                    matchConfidence = matchType === 'REFERENCE_EXACT' ? 98 : matchType === 'PARTY_AND_AMOUNT' ? 90 : 75;
                    matchedCount++;
                    matchedAmount += bankRow.amount;
                    notes = `Successfully matched via ${matchType} against Voucher #${matchedTx.invoiceId} (${matchedTx.partyName}).`;
                }
                else {
                    matchStatus = 'AMOUNT_MISMATCH';
                    matchConfidence = 60;
                    mismatchCount++;
                    mismatchAmount += Math.abs(variance);
                    notes = `Amount variance of ₹${Math.abs(variance).toLocaleString()} detected against ERP Invoice #${matchedTx.invoiceId} (ERP: ₹${matchedTx.grossAmount.toLocaleString()} vs Bank: ₹${bankRow.amount.toLocaleString()}).`;
                }
            }
            else {
                matchStatus = 'UNMATCHED_BANK';
                unmatchedCount++;
                unmatchedAmount += bankRow.amount;
                notes = bankRow.type === 'OPENING'
                    ? 'Opening balance entry in bank ledger.'
                    : 'Unmatched bank entry. No corresponding ERP voucher or transaction found.';
            }
            reconciledItems.push({
                id: `recon_${bankRow.id}`,
                bankRow,
                matchedTransaction: matchedTx ? {
                    id: matchedTx.id,
                    invoiceId: matchedTx.invoiceId,
                    partyName: matchedTx.partyName,
                    date: matchedTx.date,
                    grossAmount: matchedTx.grossAmount,
                    type: matchedTx.type,
                } : undefined,
                matchStatus,
                matchType,
                variance,
                matchConfidence,
                notes,
            });
        }
        return {
            bankAccount: params.accountFilter || 'All Bank & Cash Accounts',
            totalBankEntries: bankRows.length,
            totalReceiptAmount: Math.round(totalReceiptAmount * 100) / 100,
            totalPaymentAmount: Math.round(totalPaymentAmount * 100) / 100,
            closingBankBalance: Math.round(closingBankBalance * 100) / 100,
            matchedCount,
            matchedAmount: Math.round(matchedAmount * 100) / 100,
            unmatchedCount,
            unmatchedAmount: Math.round(unmatchedAmount * 100) / 100,
            mismatchCount,
            mismatchAmount: Math.round(mismatchAmount * 100) / 100,
            items: reconciledItems,
            generatedAt: new Date().toISOString(),
        };
    }
}
exports.BankReconciliationService = BankReconciliationService;
