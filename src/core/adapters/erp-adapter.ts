import fs from 'fs';
import path from 'path';
import { ParserFactory } from '@/core/parser/parser-factory';
import { CanonicalMappingService } from '@/core/mapping/canonical-mapping.service';
import { RejectionLogService } from '@/core/ingestion/rejection-log.service';
import {
  BusinessEntity,
  TransactionEntity,
  InventoryEntity,
  OutstandingEntity,
} from '@/core/domain/canonical-models';

export interface IngestReport {
  sourceFile: string;
  sourceDomain: string;
  totalRecords: number;
  acceptedRecords: number;
  rejectedRecords: number;
  warningCount: number;
  durationMs: number;
}

export class ErpAdapter {
  /**
   * Process Party Master file into canonical Business Entities
   */
  static async ingestPartyMaster(filePath: string): Promise<{
    businesses: BusinessEntity[];
    report: IngestReport;
  }> {
    const start = Date.now();
    const buffer = await fs.promises.readFile(filePath);
    const ext = path.extname(filePath);
    const parsed = ParserFactory.parse(buffer, ext);
    const fileName = path.basename(filePath);

    const headers = parsed.headers;
    const businesses: BusinessEntity[] = [];
    let accepted = 0;
    let rejected = 0;

    for (let i = 0; i < parsed.rows.length; i++) {
      const row = parsed.rows[i];
      const record: Record<string, any> = {};
      headers.forEach((h, idx) => {
        record[h] = row[idx] ?? '';
      });

      const partyName = record.name || record.ledger || record.PNAME;
      if (!partyName || String(partyName).trim() === '') {
        rejected++;
        await RejectionLogService.recordRejection({
          sourceFile: fileName,
          rowNumber: i + 1,
          rawContent: record,
          reason: 'Missing or empty party ledger name',
        });
        continue;
      }

      const entity = CanonicalMappingService.mapPartyMasterToBusiness(record);
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
  static async ingestJournal(filePath: string): Promise<{
    transactions: TransactionEntity[];
    report: IngestReport;
  }> {
    const start = Date.now();
    const buffer = await fs.promises.readFile(filePath);
    const ext = path.extname(filePath);
    const parsed = ParserFactory.parse(buffer, ext);
    const fileName = path.basename(filePath);

    const headers = parsed.headers;
    const transactions: TransactionEntity[] = [];
    let accepted = 0;
    let rejected = 0;

    for (let i = 0; i < parsed.rows.length; i++) {
      const row = parsed.rows[i];
      const record: Record<string, any> = {};
      headers.forEach((h, idx) => {
        record[h] = row[idx] ?? '';
      });

      const vcn = record.VCN || record.invoiceId || record.billNo;
      const date = record.C_DATE || record.date;
      const rawAmt = record.AMOUNT || record.amount;
      const parsedAmt = parseFloat(String(rawAmt).replace(/,/g, ''));

      if (!vcn && !date) {
        rejected++;
        await RejectionLogService.recordRejection({
          sourceFile: fileName,
          rowNumber: i + 1,
          rawContent: record,
          reason: 'Missing both voucher/invoice number (VCN) and transaction date (C_DATE)',
        });
        continue;
      }

      if (!vcn || String(vcn).trim() === '') {
        rejected++;
        await RejectionLogService.recordRejection({
          sourceFile: fileName,
          rowNumber: i + 1,
          rawContent: record,
          reason: 'Missing voucher / invoice number (VCN)',
        });
        continue;
      }

      if (!date || String(date).trim() === '') {
        rejected++;
        await RejectionLogService.recordRejection({
          sourceFile: fileName,
          rowNumber: i + 1,
          rawContent: record,
          reason: 'Missing transaction date (C_DATE)',
        });
        continue;
      }

      if (rawAmt !== undefined && rawAmt !== '' && isNaN(parsedAmt)) {
        rejected++;
        await RejectionLogService.recordRejection({
          sourceFile: fileName,
          rowNumber: i + 1,
          rawContent: record,
          reason: `Unparseable numerical amount: '${rawAmt}'`,
        });
        continue;
      }

      const tx = CanonicalMappingService.mapJournalRowToTransaction(record);
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
  static async ingestOutstanding(filePath: string): Promise<{
    outstandings: OutstandingEntity[];
    report: IngestReport;
  }> {
    const start = Date.now();
    const buffer = await fs.promises.readFile(filePath);
    const ext = path.extname(filePath);
    const parsed = ParserFactory.parse(buffer, ext);
    const fileName = path.basename(filePath);

    const headers = parsed.headers;
    const outstandings: OutstandingEntity[] = [];
    let accepted = 0;
    let rejected = 0;

    for (let i = 0; i < parsed.rows.length; i++) {
      const row = parsed.rows[i];
      const record: Record<string, any> = {};
      headers.forEach((h, idx) => {
        record[h] = row[idx] ?? '';
      });

      const out = CanonicalMappingService.mapOutstandingRow(record);
      if (out) {
        outstandings.push(out);
        accepted++;
      } else {
        rejected++;
        await RejectionLogService.recordRejection({
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
  static async ingestStock(filePath: string): Promise<{
    inventory: InventoryEntity[];
    report: IngestReport;
  }> {
    const start = Date.now();
    const buffer = await fs.promises.readFile(filePath);
    const ext = path.extname(filePath);
    const parsed = ParserFactory.parse(buffer, ext);
    const fileName = path.basename(filePath);

    const headers = parsed.headers;
    const inventory: InventoryEntity[] = [];
    let accepted = 0;
    let rejected = 0;

    for (let i = 0; i < parsed.rows.length; i++) {
      const row = parsed.rows[i];
      const record: Record<string, any> = {};
      headers.forEach((h, idx) => {
        record[h] = row[idx] ?? '';
      });

      const item = CanonicalMappingService.mapStockRow(record);
      if (item) {
        inventory.push(item);
        accepted++;
      } else {
        rejected++;
        await RejectionLogService.recordRejection({
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
