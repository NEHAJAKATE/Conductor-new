import { identityRepository, behaviorRepository, financialRepository, IdentityRecord, BehaviorRecord, FinancialRecord } from '@/infrastructure/repositories/cdp-repositories';
import { piiDetectorService } from './pii-detector.service';
import * as xlsx from 'xlsx';

export interface ParseResult {
  rowCount: number;
  columns: string[];
  dataTypes: Record<string, string>;
  piiColumns: string[];
  completeness: number;
  duplicates: number;
}

export class DatasetParserService {
  async parseAndIngest(buffer: Buffer, filename: string): Promise<ParseResult> {
    const ext = filename.split('.').pop()?.toLowerCase();
    let rawRows: any[] = [];

    if (ext === 'json') {
      try {
        const text = buffer.toString('utf8');
        const parsed = JSON.parse(text);
        rawRows = Array.isArray(parsed) ? parsed : [parsed];
      } catch (err) {
        throw new Error('Failed to parse JSON file: ' + (err as Error).message);
      }
    } else if (ext === 'xlsx' || ext === 'xls') {
      try {
        const workbook = xlsx.read(buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        rawRows = xlsx.utils.sheet_to_json(sheet);
      } catch (err) {
        throw new Error('Failed to parse Excel file: ' + (err as Error).message);
      }
    } else {
      // Default: CSV parsing
      try {
        const text = buffer.toString('utf8');
        const lines = text.split('\n').filter(l => l.trim() !== '');
        if (lines.length > 0) {
          const headers = lines[0].split(',').map(h => h.trim().replace(/^["']|["']$/g, ''));
          for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',').map(v => v.trim().replace(/^["']|["']$/g, ''));
            const row: any = {};
            headers.forEach((h, idx) => {
              row[h] = values[idx] || '';
            });
            rawRows.push(row);
          }
        }
      } catch (err) {
        throw new Error('Failed to parse CSV file: ' + (err as Error).message);
      }
    }

    if (rawRows.length === 0) {
      throw new Error('Dataset is empty');
    }

    // 1. Detect columns
    const columns = Object.keys(rawRows[0]);

    // 2. Infer data types
    const dataTypes: Record<string, string> = {};
    columns.forEach(col => {
      let isNumeric = true;
      let isDate = true;
      rawRows.forEach(row => {
        const val = String(row[col] || '').trim();
        if (val === '') return;
        if (isNaN(Number(val))) isNumeric = false;
        if (isNaN(Date.parse(val))) isDate = false;
      });

      if (isNumeric) dataTypes[col] = 'NUMBER';
      else if (isDate) dataTypes[col] = 'DATE';
      else dataTypes[col] = 'STRING';
    });

    // 3. Detect PII columns automatically
    const piiColumns: string[] = [];
    columns.forEach(col => {
      const sampleValues = rawRows.slice(0, 10).map(r => String(r[col] || ''));
      const piiTag = piiDetectorService.detectColumn(col, sampleValues);
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
    const seen = new Set<string>();
    let duplicates = 0;
    rawRows.forEach(row => {
      const hashKey = JSON.stringify(row);
      if (seen.has(hashKey)) {
        duplicates++;
      } else {
        seen.add(hashKey);
      }
    });

    // 5. Store parsed records in memory (repository) depending on filename category
    const lowerFilename = filename.toLowerCase();
    if (lowerFilename.includes('identity') || lowerFilename.includes('crm') || lowerFilename.includes('customer')) {
      for (const row of rawRows) {
        await identityRepository.save({
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
    } else if (lowerFilename.includes('behavior') || lowerFilename.includes('activity') || lowerFilename.includes('click')) {
      for (const row of rawRows) {
        await behaviorRepository.save({
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
    } else if (lowerFilename.includes('financial') || lowerFilename.includes('billing') || lowerFilename.includes('invoice')) {
      for (const row of rawRows) {
        await financialRepository.save({
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

export const datasetParserService = new DatasetParserService();
