import fs from 'fs';
import path from 'path';
import {
  TransactionEntity,
  InventoryEntity,
  OutstandingEntity,
  PaymentEntity,
  ProductEntity,
} from '@/core/domain/canonical-models';

const READY_DIR = path.resolve(process.cwd(), 'data', 'ready');

function ensureReadyDir() {
  try {
    if (!fs.existsSync(READY_DIR)) {
      fs.mkdirSync(READY_DIR, { recursive: true });
    }
  } catch (err) {
    console.error('[Repositories] Failed to create data/ready dir:', err);
  }
}

export class TransactionRepository {
  private transactions: TransactionEntity[] = [];
  private filePath = path.join(READY_DIR, 'transactions.json');

  constructor() {
    this.loadFromDisk();
  }

  private loadFromDisk() {
    try {
      if (fs.existsSync(this.filePath)) {
        const raw = fs.readFileSync(this.filePath, 'utf8');
        this.transactions = JSON.parse(raw);
      }
    } catch (err) {
      console.error('[TransactionRepository] Failed to load from disk:', err);
    }
  }

  private async persistToDisk() {
    try {
      ensureReadyDir();
      await fs.promises.writeFile(this.filePath, JSON.stringify(this.transactions, null, 2), 'utf8');
    } catch (err) {
      console.error('[TransactionRepository] Failed to persist to disk:', err);
    }
  }

  async saveBatch(txs: TransactionEntity[]): Promise<number> {
    this.transactions.push(...txs);
    await this.persistToDisk();
    return txs.length;
  }

  async list(filters?: {
    type?: string;
    partyId?: string;
    startDate?: string;
    endDate?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ items: TransactionEntity[]; total: number }> {
    let result = this.transactions;

    if (filters?.type) {
      result = result.filter(t => t.type === filters.type);
    }
    if (filters?.partyId) {
      result = result.filter(t => t.partyId === filters.partyId || t.partyName.toLowerCase().includes(filters.partyId!.toLowerCase()));
    }
    if (filters?.startDate) {
      result = result.filter(t => t.date >= filters.startDate!);
    }
    if (filters?.endDate) {
      result = result.filter(t => t.date <= filters.endDate!);
    }
    if (filters?.search) {
      const q = filters.search.toLowerCase().trim();
      result = result.filter(t => 
        t.invoiceId.toLowerCase().includes(q) ||
        t.partyName.toLowerCase().includes(q) ||
        (t.partyGstin && t.partyGstin.toLowerCase().includes(q)) ||
        t.items.some(i => i.productName.toLowerCase().includes(q) || (i.manufacturer && i.manufacturer.toLowerCase().includes(q)))
      );
    }

    const total = result.length;
    const offset = filters?.offset || 0;
    const limit = filters?.limit || 50;

    return {
      items: result.slice(offset, offset + limit),
      total,
    };
  }

  async getAll(): Promise<TransactionEntity[]> {
    return this.transactions;
  }

  async clear(): Promise<void> {
    this.transactions = [];
    await this.persistToDisk();
  }
}

export class InventoryRepository {
  private inventory = new Map<string, InventoryEntity>();
  private filePath = path.join(READY_DIR, 'inventory.json');

  constructor() {
    this.loadFromDisk();
  }

  private loadFromDisk() {
    try {
      if (fs.existsSync(this.filePath)) {
        const raw = fs.readFileSync(this.filePath, 'utf8');
        const list: InventoryEntity[] = JSON.parse(raw);
        list.forEach(item => this.inventory.set(item.productId, item));
      }
    } catch (err) {
      console.error('[InventoryRepository] Failed to load from disk:', err);
    }
  }

  private async persistToDisk() {
    try {
      ensureReadyDir();
      const list = Array.from(this.inventory.values());
      await fs.promises.writeFile(this.filePath, JSON.stringify(list, null, 2), 'utf8');
    } catch (err) {
      console.error('[InventoryRepository] Failed to persist to disk:', err);
    }
  }

  async saveBatch(items: InventoryEntity[]): Promise<number> {
    items.forEach(item => {
      this.inventory.set(item.productId, item);
    });
    await this.persistToDisk();
    return items.length;
  }

  async list(filters?: { search?: string; lowStockOnly?: boolean }): Promise<InventoryEntity[]> {
    let result = Array.from(this.inventory.values());
    if (filters?.search) {
      const q = filters.search.toLowerCase().trim();
      result = result.filter(i => 
        i.productName.toLowerCase().includes(q) ||
        (i.manufacturer && i.manufacturer.toLowerCase().includes(q))
      );
    }
    if (filters?.lowStockOnly) {
      result = result.filter(i => i.quantityOnHand <= (i.reorderLevel || 20));
    }
    return result;
  }

  async clear(): Promise<void> {
    this.inventory.clear();
    await this.persistToDisk();
  }
}

export class OutstandingRepository {
  private outstandings = new Map<string, OutstandingEntity>();
  private filePath = path.join(READY_DIR, 'outstanding.json');

  constructor() {
    this.loadFromDisk();
  }

  private loadFromDisk() {
    try {
      if (fs.existsSync(this.filePath)) {
        const raw = fs.readFileSync(this.filePath, 'utf8');
        const list: OutstandingEntity[] = JSON.parse(raw);
        list.forEach(item => this.outstandings.set(item.businessId, item));
      }
    } catch (err) {
      console.error('[OutstandingRepository] Failed to load from disk:', err);
    }
  }

  private async persistToDisk() {
    try {
      ensureReadyDir();
      const list = Array.from(this.outstandings.values());
      await fs.promises.writeFile(this.filePath, JSON.stringify(list, null, 2), 'utf8');
    } catch (err) {
      console.error('[OutstandingRepository] Failed to persist to disk:', err);
    }
  }

  async saveBatch(items: OutstandingEntity[]): Promise<number> {
    items.forEach(item => {
      this.outstandings.set(item.businessId, item);
    });
    await this.persistToDisk();
    return items.length;
  }

  async list(filters?: { riskLevel?: string; search?: string }): Promise<OutstandingEntity[]> {
    let result = Array.from(this.outstandings.values());
    if (filters?.riskLevel) {
      result = result.filter(o => o.riskLevel === filters.riskLevel);
    }
    if (filters?.search) {
      const q = filters.search.toLowerCase().trim();
      result = result.filter(o => o.businessName.toLowerCase().includes(q));
    }
    return result;
  }

  async findByBusinessId(businessId: string): Promise<OutstandingEntity | undefined> {
    const direct = this.outstandings.get(businessId);
    if (direct) return direct;

    // Fallback: Match by normalized business name if ID prefix differs
    const clean = businessId.replace(/^(party|gst|pan|erp):/i, '').toLowerCase().replace(/[^a-z0-9]/g, '');
    for (const out of this.outstandings.values()) {
      const outClean = out.businessName.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (outClean === clean) return out;
    }
    return undefined;
  }

  async clear(): Promise<void> {
    this.outstandings.clear();
    await this.persistToDisk();
  }
}

// Global Singletons
declare global {
  var __txRepoInstance__: TransactionRepository | undefined;
  var __invRepoInstance__: InventoryRepository | undefined;
  var __outRepoInstance__: OutstandingRepository | undefined;
}

if (!globalThis.__txRepoInstance__) {
  globalThis.__txRepoInstance__ = new TransactionRepository();
}
if (!globalThis.__invRepoInstance__) {
  globalThis.__invRepoInstance__ = new InventoryRepository();
}
if (!globalThis.__outRepoInstance__) {
  globalThis.__outRepoInstance__ = new OutstandingRepository();
}

export const transactionRepository = globalThis.__txRepoInstance__;
export const inventoryRepository = globalThis.__invRepoInstance__;
export const outstandingRepository = globalThis.__outRepoInstance__;
