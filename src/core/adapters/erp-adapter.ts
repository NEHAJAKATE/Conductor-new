import fs from 'fs';
import path from 'path';
import { ParserFactory } from '@/core/parser/parser-factory';
import { CanonicalMappingService } from '@/core/mapping/canonical-mapping.service';
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

    const headers = parsed.headers;
    const businesses: BusinessEntity[] = [];
    let accepted = 0;
    let rejected = 0;

    for (const row of parsed.rows) {
      const record: Record<string, any> = {};
      headers.forEach((h, i) => {
        record[h] = row[i] ?? '';
      });

      const partyName = record.name || record.ledger || record.PNAME;
      if (!partyName || partyName.trim() === '') {
        rejected++;
        continue;
      }

      const entity = CanonicalMappingService.mapPartyMasterToBusiness(record);
      businesses.push(entity);
      accepted++;
    }

    return {
      businesses,
      report: {
        sourceFile: path.basename(filePath),
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

    const headers = parsed.headers;
    const transactions: TransactionEntity[] = [];
    let accepted = 0;
    let rejected = 0;

    for (const row of parsed.rows) {
      const record: Record<string, any> = {};
      headers.forEach((h, i) => {
        record[h] = row[i] ?? '';
      });

      const vcn = record.VCN || record.invoiceId || record.billNo;
      if (!vcn || !record.C_DATE) {
        rejected++;
        continue;
      }

      const tx = CanonicalMappingService.mapJournalRowToTransaction(record);
      transactions.push(tx);
      accepted++;
    }

    return {
      transactions,
      report: {
        sourceFile: path.basename(filePath),
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

    const headers = parsed.headers;
    const outstandings: OutstandingEntity[] = [];
    let accepted = 0;
    let rejected = 0;

    for (const row of parsed.rows) {
      const record: Record<string, any> = {};
      headers.forEach((h, i) => {
        record[h] = row[i] ?? '';
      });

      const out = CanonicalMappingService.mapOutstandingRow(record);
      if (out) {
        outstandings.push(out);
        accepted++;
      } else {
        rejected++;
      }
    }

    return {
      outstandings,
      report: {
        sourceFile: path.basename(filePath),
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

    const headers = parsed.headers;
    const inventory: InventoryEntity[] = [];
    let accepted = 0;
    let rejected = 0;

    for (const row of parsed.rows) {
      const record: Record<string, any> = {};
      headers.forEach((h, i) => {
        record[h] = row[i] ?? '';
      });

      const item = CanonicalMappingService.mapStockRow(record);
      if (item) {
        inventory.push(item);
        accepted++;
      } else {
        rejected++;
      }
    }

    return {
      inventory,
      report: {
        sourceFile: path.basename(filePath),
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
