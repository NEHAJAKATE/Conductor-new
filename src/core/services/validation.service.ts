import { ValidationIssue, ValidationResult } from '@/core/connectors/connector';

export class ValidationService {
  async validate(headers: string[], rows: string[][], rules: {
    requiredColumns?: string[];
    regexRules?: Record<string, RegExp>;
    expectedTypes?: Record<string, string>;
  } = {}): Promise<ValidationResult> {
    const issues: ValidationIssue[] = [];
    const recordCount = rows.length;

    console.log(`[ValidationService] Auditing dataset with ${headers.length} headers and ${rows.length} sample rows`);

    if (headers.length <= 1) {
      issues.push({
        field: '*',
        severity: 'warning',
        code: 'single_column',
        message: 'Dataset parsed as a single column. Verify delimiter settings.',
      });
    }

    const required = rules.requiredColumns || ['id', 'email', 'name', 'timestamp'];
    const headerSet = new Set(headers.map(h => h.toLowerCase()));
    for (const reqCol of required) {
      const match = headers.find(h => h.toLowerCase() === reqCol.toLowerCase());
      if (!match) {
        issues.push({
          field: reqCol,
          severity: 'warning',
          code: 'missing_required_column',
          message: `Recommended/Required column '${reqCol}' is missing from the dataset.`,
        });
      }
    }

    const seenHeaders = new Set<string>();
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
    let duplicateRowKeys = new Set<string>();
    let duplicateRowCount = 0;

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
          if (header.toLowerCase().includes('email')) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(value)) {
              issues.push({
                field: header,
                severity: 'warning',
                code: 'invalid_email_format',
                message: `Row ${rIdx + 1}: Invalid email address format: '${value}'`,
                rowSample: { rowNumber: rIdx + 1, value },
              });
            }
          }

          if (header.toLowerCase().includes('phone')) {
            const phoneRegex = /^\+?[0-9\s\-()]{7,18}$/;
            if (!phoneRegex.test(value)) {
              issues.push({
                field: header,
                severity: 'info',
                code: 'invalid_phone_format',
                message: `Row ${rIdx + 1}: Non-standard phone format: '${value}'`,
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
        message: `${duplicateRowCount} duplicate row values detected in sample data.`,
      });
    }

    const piiColumns = headers.filter(h => 
      ['email', 'phone', 'ssn', 'credit_card', 'salary', 'password', 'mobile'].includes(h.toLowerCase())
    );
    if (piiColumns.length > 0) {
      issues.push({
        field: piiColumns.join(', '),
        severity: 'info',
        code: 'pii_detected',
        message: `PII attributes detected: ${piiColumns.join(', ')}. Field encryption/masking policies will apply.`,
      });
    }

    if (nullCount > 0) {
      issues.push({
        field: '*',
        severity: 'warning',
        code: 'null_values_present',
        message: `${nullCount} empty cells found. Null-replacement rules will replace these with database defaults.`,
      });
    }

    return {
      valid: issues.filter(i => i.severity === 'error').length === 0,
      issues,
      recordCount,
      fieldStatistics: {
        totalCells: headers.length * rows.length,
        nullCells: nullCount,
        duplicateRowsCount: duplicateRowCount,
        piiFieldsFound: piiColumns,
      },
    };
  }
}
