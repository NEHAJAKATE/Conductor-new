"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValidationService = void 0;
class ValidationService {
    /**
     * Detect schema domain from headers
     */
    detectDomain(headers) {
        const lower = headers.map(h => h.toLowerCase());
        if (lower.some(h => ['vcn', 'c_date', 'type2', 'amount', 'qty', 'rate'].includes(h))) {
            return 'transaction';
        }
        if (lower.some(h => ['description', 'opening stock unit'].includes(h)) && !lower.includes('total')) {
            return 'inventory';
        }
        if (lower.includes('total') && (lower.includes('description') || lower.includes('groupuid') || lower.some(h => h.includes('older')))) {
            return 'outstanding';
        }
        if (lower.some(h => ['tin', 'panno', 'ledger', 'licence', 'cramount', 'crdays'].includes(h))) {
            return 'business';
        }
        if (lower.some(h => ['customer_id', 'customerid', 'pan', 'aadhaar', 'passport'].includes(h))) {
            return 'customer';
        }
        return 'generic';
    }
    async validate(headers, rows, rules = {}) {
        const issues = [];
        const recordCount = rows.length;
        const detectedDomain = this.detectDomain(headers);
        console.log(`[ValidationService] Auditing ${detectedDomain} dataset with ${headers.length} headers and ${rows.length} rows`);
        if (headers.length <= 1) {
            issues.push({
                field: '*',
                severity: 'warning',
                code: 'single_column',
                message: 'Dataset parsed as a single column. Verify delimiter settings.',
            });
        }
        // Determine required columns based on domain if not explicitly passed
        let required = rules.requiredColumns;
        if (!required) {
            switch (detectedDomain) {
                case 'transaction':
                    required = ['C_DATE', 'VCN', 'AMOUNT'];
                    break;
                case 'business':
                    required = ['name'];
                    break;
                case 'outstanding':
                    required = ['Description', 'Total'];
                    break;
                case 'inventory':
                    required = ['Description'];
                    break;
                case 'customer':
                    required = ['name'];
                    break;
                default:
                    required = [];
            }
        }
        const headerSet = new Set(headers.map(h => h.toLowerCase()));
        for (const reqCol of required) {
            const match = headers.find(h => h.toLowerCase() === reqCol.toLowerCase());
            if (!match) {
                issues.push({
                    field: reqCol,
                    severity: 'warning',
                    code: 'missing_required_column',
                    message: `Recommended column '${reqCol}' is missing from the dataset.`,
                });
            }
        }
        const seenHeaders = new Set();
        for (const header of headers) {
            if (seenHeaders.has(header)) {
                issues.push({
                    field: header,
                    severity: 'error',
                    code: 'duplicate_column',
                    message: `Duplicate column name detected: ${header}`,
                });
            }
            seenHeaders.add(header);
        }
        let nullCount = 0;
        let duplicateRowKeys = new Set();
        let duplicateRowCount = 0;
        let rejectedCount = 0;
        for (let rIdx = 0; rIdx < rows.length; rIdx += 1) {
            const row = rows[rIdx];
            const rowStr = row.join('|');
            if (duplicateRowKeys.has(rowStr)) {
                duplicateRowCount += 1;
            }
            duplicateRowKeys.add(rowStr);
            for (let cIdx = 0; cIdx < headers.length; cIdx += 1) {
                const value = row[cIdx]?.trim() || '';
                const header = headers[cIdx];
                if (value === '') {
                    nullCount += 1;
                }
                if (value !== '') {
                    if (header.toLowerCase() === 'email' && value.includes('@')) {
                        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                        if (!emailRegex.test(value)) {
                            issues.push({
                                field: header,
                                severity: 'info',
                                code: 'non_standard_email',
                                message: `Row ${rIdx + 1}: Non-standard email format: '${value}'`,
                                rowSample: { rowNumber: rIdx + 1, value },
                            });
                        }
                    }
                }
            }
        }
        if (duplicateRowCount > 0) {
            issues.push({
                field: '*',
                severity: 'info',
                code: 'duplicate_rows',
                message: `${duplicateRowCount} duplicate row values detected in dataset.`,
            });
        }
        const piiColumns = headers.filter(h => ['email', 'phone', 'ssn', 'credit_card', 'salary', 'password', 'mobile'].includes(h.toLowerCase()));
        if (piiColumns.length > 0) {
            issues.push({
                field: piiColumns.join(', '),
                severity: 'info',
                code: 'pii_detected',
                message: `PII attributes detected: ${piiColumns.join(', ')}. Field governance rules will apply.`,
            });
        }
        const errorCount = issues.filter(i => i.severity === 'error').length;
        const warningCount = issues.filter(i => i.severity === 'warning').length;
        return {
            valid: errorCount === 0,
            issues,
            recordCount,
            acceptedRecords: recordCount - rejectedCount,
            rejectedRecords: rejectedCount,
            warningCount,
            detectedDomain,
            fieldStatistics: {
                totalCells: headers.length * rows.length,
                nullCells: nullCount,
                duplicateRowsCount: duplicateRowCount,
                piiFieldsFound: piiColumns,
            },
        };
    }
}
exports.ValidationService = ValidationService;
