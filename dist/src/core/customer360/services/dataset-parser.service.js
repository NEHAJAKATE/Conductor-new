"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.datasetParserService = exports.DatasetParserService = void 0;
const cdp_repositories_1 = require("@/infrastructure/repositories/cdp-repositories");
const pii_detector_service_1 = require("./pii-detector.service");
const xlsx = __importStar(require("xlsx"));
class DatasetParserService {
    async parseAndIngest(buffer, filename) {
        const ext = filename.split('.').pop()?.toLowerCase();
        let rawRows = [];
        if (ext === 'json') {
            try {
                const text = buffer.toString('utf8');
                const parsed = JSON.parse(text);
                rawRows = Array.isArray(parsed) ? parsed : [parsed];
            }
            catch (err) {
                throw new Error('Failed to parse JSON file: ' + err.message);
            }
        }
        else if (ext === 'xlsx' || ext === 'xls') {
            try {
                const workbook = xlsx.read(buffer, { type: 'buffer' });
                const sheetName = workbook.SheetNames[0];
                const sheet = workbook.Sheets[sheetName];
                rawRows = xlsx.utils.sheet_to_json(sheet);
            }
            catch (err) {
                throw new Error('Failed to parse Excel file: ' + err.message);
            }
        }
        else {
            // Default: CSV parsing
            try {
                const text = buffer.toString('utf8');
                const lines = text.split('\n').filter(l => l.trim() !== '');
                if (lines.length > 0) {
                    const headers = lines[0].split(',').map(h => h.trim().replace(/^["']|["']$/g, ''));
                    for (let i = 1; i < lines.length; i++) {
                        const values = lines[i].split(',').map(v => v.trim().replace(/^["']|["']$/g, ''));
                        const row = {};
                        headers.forEach((h, idx) => {
                            row[h] = values[idx] || '';
                        });
                        rawRows.push(row);
                    }
                }
            }
            catch (err) {
                throw new Error('Failed to parse CSV file: ' + err.message);
            }
        }
        if (rawRows.length === 0) {
            throw new Error('Dataset is empty');
        }
        // 1. Detect columns
        const columns = Object.keys(rawRows[0]);
        // 2. Infer data types
        const dataTypes = {};
        columns.forEach(col => {
            let isNumeric = true;
            let isDate = true;
            rawRows.forEach(row => {
                const val = String(row[col] || '').trim();
                if (val === '')
                    return;
                if (isNaN(Number(val)))
                    isNumeric = false;
                if (isNaN(Date.parse(val)))
                    isDate = false;
            });
            if (isNumeric)
                dataTypes[col] = 'NUMBER';
            else if (isDate)
                dataTypes[col] = 'DATE';
            else
                dataTypes[col] = 'STRING';
        });
        // 3. Detect PII columns automatically
        const piiColumns = [];
        columns.forEach(col => {
            const sampleValues = rawRows.slice(0, 10).map(r => String(r[col] || ''));
            const piiTag = pii_detector_service_1.piiDetectorService.detectColumn(col, sampleValues);
            if (piiTag.classification !== 'NONE') {
                piiColumns.push(col);
            }
        });
        // 4. Calculate Data Quality metrics
        let missingValuesCount = 0;
        const totalCells = rawRows.length * columns.length;
        rawRows.forEach(row => {
            columns.forEach(col => {
                if (row[col] === undefined || row[col] === null || String(row[col]).trim() === '') {
                    missingValuesCount++;
                }
            });
        });
        const completeness = Math.round(((totalCells - missingValuesCount) / totalCells) * 100);
        // Count duplicate rows
        const seen = new Set();
        let duplicates = 0;
        rawRows.forEach(row => {
            const hashKey = JSON.stringify(row);
            if (seen.has(hashKey)) {
                duplicates++;
            }
            else {
                seen.add(hashKey);
            }
        });
        // 5. Store parsed records in memory (repository) depending on filename category
        const lowerFilename = filename.toLowerCase();
        if (lowerFilename.includes('identity') || lowerFilename.includes('crm') || lowerFilename.includes('customer')) {
            for (const row of rawRows) {
                await cdp_repositories_1.identityRepository.save({
                    customerId: row.customerId || row.Customer_ID || `CUST-${Math.floor(1000 + Math.random() * 9000)}`,
                    name: row.name || row.Name || 'Unnamed Customer',
                    email: row.email || row.Email || '',
                    phone: row.phone || row.Phone || '',
                    dob: row.dob || row.DOB || '',
                    gender: row.gender || row.Gender || 'Unknown',
                    address: row.address || row.Address || '',
                    pan: row.pan || row.PAN || 'Not Linked',
                    aadhaar: row.aadhaar || row.Aadhaar || 'Not Linked',
                    passport: row.passport || row.Passport || 'Not Linked',
                    segment: row.segment || row.Segment || 'Regular',
                    sourceSystem: filename,
                    ingestedAt: new Date().toISOString()
                });
            }
        }
        else if (lowerFilename.includes('behavior') || lowerFilename.includes('activity') || lowerFilename.includes('click')) {
            for (const row of rawRows) {
                await cdp_repositories_1.behaviorRepository.save({
                    eventId: row.eventId || row.Event_ID || `evt-${Math.floor(100000 + Math.random() * 900000)}`,
                    customerId: row.customerId || row.Customer_ID || undefined,
                    email: row.email || row.Email || undefined,
                    phone: row.phone || row.Phone || undefined,
                    type: row.type || row.Type || 'Website Visit',
                    timestamp: row.timestamp || row.Timestamp || new Date().toISOString(),
                    source: row.source || row.Source || filename,
                    details: row.details || row.Details || 'Details not provided.'
                });
            }
        }
        else if (lowerFilename.includes('financial') || lowerFilename.includes('billing') || lowerFilename.includes('invoice')) {
            for (const row of rawRows) {
                await cdp_repositories_1.financialRepository.save({
                    transactionId: row.transactionId || row.Transaction_ID || `tx-${Math.floor(1000 + Math.random() * 9000)}`,
                    customerId: row.customerId || row.Customer_ID || undefined,
                    email: row.email || row.Email || undefined,
                    invoiceId: row.invoiceId || row.Invoice_ID || `INV-${Math.floor(1000 + Math.random() * 9000)}`,
                    amount: Number(row.amount || row.Amount || 0),
                    date: row.date || row.Date || new Date().toISOString(),
                    status: row.status || row.Status || 'Paid',
                    outstandingBalance: Number(row.outstandingBalance || row.Outstanding_Balance || 0),
                    creditLimit: Number(row.creditLimit || row.Credit_Limit || 10000),
                    subscriptionName: row.subscriptionName || row.Subscription_Name || undefined,
                    subscriptionPrice: Number(row.subscriptionPrice || row.Subscription_Price || 0)
                });
            }
        }
        return {
            rowCount: rawRows.length,
            columns,
            dataTypes,
            piiColumns,
            completeness,
            duplicates
        };
    }
}
exports.DatasetParserService = DatasetParserService;
exports.datasetParserService = new DatasetParserService();
