import {
  TransactionEntity,
  InventoryEntity,
  OutstandingEntity,
  PaymentEntity,
  ProductEntity,
} from '@/core/domain/canonical-models';

export class TransactionRepository {
  private transactions: TransactionEntity[] = [];

  async saveBatch(txs: TransactionEntity[]): Promise<number> {
    this.transactions.push(...txs);
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
  }
}

export class InventoryRepository {
  private inventory = new Map<string, InventoryEntity>();

  async saveBatch(items: InventoryEntity[]): Promise<number> {
    items.forEach(item => {
      this.inventory.set(item.productId, item);
    });
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
  }
}

export class OutstandingRepository {
  private outstandings = new Map<string, OutstandingEntity>();

  async saveBatch(items: OutstandingEntity[]): Promise<number> {
    items.forEach(item => {
      this.outstandings.set(item.businessId, item);
    });
    return items.length;
  }

  async list(filters?: { riskLevel?: string; search?: string }): Promise<OutstandingEntity[]> {
    let result = Array.from(this.outstandings.values());
    if (filters?.riskLevel) {
      result = result.filter(o => o.riskLevel === filters.riskLevel);
    }
    if (filters?.search) {
      const q = filters.search.toLowerCase().trim();
      result = result.filter(o => 
        o.businessName.toLowerCase().includes(q) ||
        (o.gstin && o.gstin.toLowerCase().includes(q))
      );
    }
    return result.sort((a, b) => b.totalOutstanding - a.totalOutstanding);
  }

  async findByBusinessId(id: string): Promise<OutstandingEntity | undefined> {
    return this.outstandings.get(id);
  }

  async clear(): Promise<void> {
    this.outstandings.clear();
  }
}

declare global {
  var __transactionRepositoryInstance__: TransactionRepository | undefined;
  var __inventoryRepositoryInstance__: InventoryRepository | undefined;
  var __outstandingRepositoryInstance__: OutstandingRepository | undefined;
}

if (!globalThis.__transactionRepositoryInstance__) {
  globalThis.__transactionRepositoryInstance__ = new TransactionRepository();
}
if (!globalThis.__inventoryRepositoryInstance__) {
  globalThis.__inventoryRepositoryInstance__ = new InventoryRepository();
}
if (!globalThis.__outstandingRepositoryInstance__) {
  globalThis.__outstandingRepositoryInstance__ = new OutstandingRepository();
}

export const transactionRepository = globalThis.__transactionRepositoryInstance__;
export const inventoryRepository = globalThis.__inventoryRepositoryInstance__;
export const outstandingRepository = globalThis.__outstandingRepositoryInstance__;
