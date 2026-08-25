"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ErpAdapter = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const parser_factory_1 = require("@/core/parser/parser-factory");
const canonical_mapping_service_1 = require("@/core/mapping/canonical-mapping.service");
const rejection_log_service_1 = require("@/core/ingestion/rejection-log.service");
class ErpAdapter {
    /**
     * Process Party Master file into canonical Business Entities
     */
    static async ingestPartyMaster(filePath) {
        const start = Date.now();
        const buffer = await fs_1.default.promises.readFile(filePath);
        const ext = path_1.default.extname(filePath);
        const parsed = parser_factory_1.ParserFactory.parse(buffer, ext);
        const fileName = path_1.default.basename(filePath);
        const headers = parsed.headers;
        const businesses = [];
        let accepted = 0;
        let rejected = 0;
        for (let i = 0; i < parsed.rows.length; i++) {
            const row = parsed.rows[i];
            const record = {};
            headers.forEach((h, idx) => {
                record[h] = row[idx] ?? '';
            });
            const partyName = record.name || record.ledger || record.PNAME;
            if (!partyName || String(partyName).trim() === '') {
                rejected++;
                await rejection_log_service_1.RejectionLogService.recordRejection({
                    sourceFile: fileName,
                    rowNumber: i + 1,
                    rawContent: record,
                    reason: 'Missing or empty party ledger name',
                });
                continue;
            }
            const entity = canonical_mapping_service_1.CanonicalMappingService.mapPartyMasterToBusiness(record);
            businesses.push(entity);
            accepted++;
        }
        return {
            businesses,
            report: {
                sourceFile: fileName,
                sourceDomain: 'business_party_master',
                totalRecords: parsed.rows.length,
                acceptedRecords: accepted,
                rejectedRecords: rejected,
                warningCount: 0,
                durationMs: Date.now() - start,
            },
        };
    }
    /**
     * Process Sales and Purchase CSV journal into Transaction Entities
     */
    static async ingestJournal(filePath) {
        const start = Date.now();
        const buffer = await fs_1.default.promises.readFile(filePath);
        const ext = path_1.default.extname(filePath);
        const parsed = parser_factory_1.ParserFactory.parse(buffer, ext);
        const fileName = path_1.default.basename(filePath);
        const headers = parsed.headers;
        const transactions = [];
        let accepted = 0;
        let rejected = 0;
        for (let i = 0; i < parsed.rows.length; i++) {
            const row = parsed.rows[i];
            const record = {};
            headers.forEach((h, idx) => {
                record[h] = row[idx] ?? '';
            });
            const vcn = record.VCN || record.invoiceId || record.billNo;
            const date = record.C_DATE || record.date;
            const rawAmt = record.AMOUNT || record.amount;
            const parsedAmt = parseFloat(String(rawAmt).replace(/,/g, ''));
            if (!vcn && !date) {
                rejected++;
                await rejection_log_service_1.RejectionLogService.recordRejection({
                    sourceFile: fileName,
                    rowNumber: i + 1,
                    rawContent: record,
                    reason: 'Missing both voucher/invoice number (VCN) and transaction date (C_DATE)',
                });
                continue;
            }
            if (!vcn || String(vcn).trim() === '') {
                rejected++;
                await rejection_log_service_1.RejectionLogService.recordRejection({
                    sourceFile: fileName,
                    rowNumber: i + 1,
                    rawContent: record,
                    reason: 'Missing voucher / invoice number (VCN)',
                });
                continue;
            }
            if (!date || String(date).trim() === '') {
                rejected++;
                await rejection_log_service_1.RejectionLogService.recordRejection({
                    sourceFile: fileName,
                    rowNumber: i + 1,
                    rawContent: record,
                    reason: 'Missing transaction date (C_DATE)',
                });
                continue;
            }
            if (rawAmt !== undefined && rawAmt !== '' && isNaN(parsedAmt)) {
                rejected++;
                await rejection_log_service_1.RejectionLogService.recordRejection({
                    sourceFile: fileName,
                    rowNumber: i + 1,
                    rawContent: record,
                    reason: `Unparseable numerical amount: '${rawAmt}'`,
                });
                continue;
            }
            const tx = canonical_mapping_service_1.CanonicalMappingService.mapJournalRowToTransaction(record);
            transactions.push(tx);
            accepted++;
        }
        return {
            transactions,
            report: {
                sourceFile: fileName,
                sourceDomain: 'sales_purchase_journal',
                totalRecords: parsed.rows.length,
                acceptedRecords: accepted,
                rejectedRecords: rejected,
                warningCount: 0,
                durationMs: Date.now() - start,
            },
        };
    }
    /**
     * Process Outstanding & Ageing Ledger
     */
    static async ingestOutstanding(filePath) {
        const start = Date.now();
        const buffer = await fs_1.default.promises.readFile(filePath);
        const ext = path_1.default.extname(filePath);
        const parsed = parser_factory_1.ParserFactory.parse(buffer, ext);
        const fileName = path_1.default.basename(filePath);
        const headers = parsed.headers;
        const outstandings = [];
        let accepted = 0;
        let rejected = 0;
        for (let i = 0; i < parsed.rows.length; i++) {
            const row = parsed.rows[i];
            const record = {};
            headers.forEach((h, idx) => {
                record[h] = row[idx] ?? '';
            });
            const out = canonical_mapping_service_1.CanonicalMappingService.mapOutstandingRow(record);
            if (out) {
                outstandings.push(out);
                accepted++;
            }
            else {
                rejected++;
                await rejection_log_service_1.RejectionLogService.recordRejection({
                    sourceFile: fileName,
                    rowNumber: i + 1,
                    rawContent: record,
                    reason: 'Empty party ledger name or summary footer row in outstanding matrix',
                });
            }
        }
        return {
            outstandings,
            report: {
                sourceFile: fileName,
                sourceDomain: 'outstanding_receivables',
                totalRecords: parsed.rows.length,
                acceptedRecords: accepted,
                rejectedRecords: rejected,
                warningCount: 0,
                durationMs: Date.now() - start,
            },
        };
    }
    /**
     * Process Opening Stock Inventory
     */
    static async ingestStock(filePath) {
        const start = Date.now();
        const buffer = await fs_1.default.promises.readFile(filePath);
        const ext = path_1.default.extname(filePath);
        const parsed = parser_factory_1.ParserFactory.parse(buffer, ext);
        const fileName = path_1.default.basename(filePath);
        const headers = parsed.headers;
        const inventory = [];
        let accepted = 0;
        let rejected = 0;
        for (let i = 0; i < parsed.rows.length; i++) {
            const row = parsed.rows[i];
            const record = {};
            headers.forEach((h, idx) => {
                record[h] = row[idx] ?? '';
            });
            const item = canonical_mapping_service_1.CanonicalMappingService.mapStockRow(record);
            if (item) {
                inventory.push(item);
                accepted++;
            }
            else {
                rejected++;
                await rejection_log_service_1.RejectionLogService.recordRejection({
                    sourceFile: fileName,
                    rowNumber: i + 1,
                    rawContent: record,
                    reason: 'Empty product description or non-inventory header row',
                });
            }
        }
        return {
            inventory,
            report: {
                sourceFile: fileName,
                sourceDomain: 'inventory_catalog',
                totalRecords: parsed.rows.length,
                acceptedRecords: accepted,
                rejectedRecords: rejected,
                warningCount: 0,
                durationMs: Date.now() - start,
            },
        };
    }
}
exports.ErpAdapter = ErpAdapter;
