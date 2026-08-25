"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.outstandingRepository = exports.inventoryRepository = exports.transactionRepository = exports.OutstandingRepository = exports.InventoryRepository = exports.TransactionRepository = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const READY_DIR = path_1.default.resolve(process.cwd(), 'data', 'ready');
function ensureReadyDir() {
    try {
        if (!fs_1.default.existsSync(READY_DIR)) {
            fs_1.default.mkdirSync(READY_DIR, { recursive: true });
        }
    }
    catch (err) {
        console.error('[Repositories] Failed to create data/ready dir:', err);
    }
}
class TransactionRepository {
    transactions = [];
    filePath = path_1.default.join(READY_DIR, 'transactions.json');
    constructor() {
        this.loadFromDisk();
    }
    loadFromDisk() {
        try {
            if (fs_1.default.existsSync(this.filePath)) {
                const raw = fs_1.default.readFileSync(this.filePath, 'utf8');
                this.transactions = JSON.parse(raw);
            }
        }
        catch (err) {
            console.error('[TransactionRepository] Failed to load from disk:', err);
        }
    }
    async persistToDisk() {
        try {
            ensureReadyDir();
            await fs_1.default.promises.writeFile(this.filePath, JSON.stringify(this.transactions, null, 2), 'utf8');
        }
        catch (err) {
            console.error('[TransactionRepository] Failed to persist to disk:', err);
        }
    }
    async saveBatch(txs) {
        this.transactions.push(...txs);
        await this.persistToDisk();
        return txs.length;
    }
    async list(filters) {
        let result = this.transactions;
        if (filters?.type) {
            result = result.filter(t => t.type === filters.type);
        }
        if (filters?.partyId) {
            result = result.filter(t => t.partyId === filters.partyId || t.partyName.toLowerCase().includes(filters.partyId.toLowerCase()));
        }
        if (filters?.startDate) {
            result = result.filter(t => t.date >= filters.startDate);
        }
        if (filters?.endDate) {
            result = result.filter(t => t.date <= filters.endDate);
        }
        if (filters?.search) {
            const q = filters.search.toLowerCase().trim();
            result = result.filter(t => t.invoiceId.toLowerCase().includes(q) ||
                t.partyName.toLowerCase().includes(q) ||
                (t.partyGstin && t.partyGstin.toLowerCase().includes(q)) ||
                t.items.some(i => i.productName.toLowerCase().includes(q) || (i.manufacturer && i.manufacturer.toLowerCase().includes(q))));
        }
        const total = result.length;
        const offset = filters?.offset || 0;
        const limit = filters?.limit || 50;
        return {
            items: result.slice(offset, offset + limit),
            total,
        };
    }
    async getAll() {
        return this.transactions;
    }
    async clear() {
        this.transactions = [];
        await this.persistToDisk();
    }
}
exports.TransactionRepository = TransactionRepository;
class InventoryRepository {
    inventory = new Map();
    filePath = path_1.default.join(READY_DIR, 'inventory.json');
    constructor() {
        this.loadFromDisk();
    }
    loadFromDisk() {
        try {
            if (fs_1.default.existsSync(this.filePath)) {
                const raw = fs_1.default.readFileSync(this.filePath, 'utf8');
                const list = JSON.parse(raw);
                list.forEach(item => this.inventory.set(item.productId, item));
            }
        }
        catch (err) {
            console.error('[InventoryRepository] Failed to load from disk:', err);
        }
    }
    async persistToDisk() {
        try {
            ensureReadyDir();
            const list = Array.from(this.inventory.values());
            await fs_1.default.promises.writeFile(this.filePath, JSON.stringify(list, null, 2), 'utf8');
        }
        catch (err) {
            console.error('[InventoryRepository] Failed to persist to disk:', err);
        }
    }
    async saveBatch(items) {
        items.forEach(item => {
            this.inventory.set(item.productId, item);
        });
        await this.persistToDisk();
        return items.length;
    }
    async list(filters) {
        let result = Array.from(this.inventory.values());
        if (filters?.search) {
            const q = filters.search.toLowerCase().trim();
            result = result.filter(i => i.productName.toLowerCase().includes(q) ||
                (i.manufacturer && i.manufacturer.toLowerCase().includes(q)));
        }
        if (filters?.lowStockOnly) {
            result = result.filter(i => i.quantityOnHand <= (i.reorderLevel || 20));
        }
        return result;
    }
    async clear() {
        this.inventory.clear();
        await this.persistToDisk();
    }
}
exports.InventoryRepository = InventoryRepository;
class OutstandingRepository {
    outstandings = new Map();
    filePath = path_1.default.join(READY_DIR, 'outstanding.json');
    constructor() {
        this.loadFromDisk();
    }
    loadFromDisk() {
        try {
            if (fs_1.default.existsSync(this.filePath)) {
                const raw = fs_1.default.readFileSync(this.filePath, 'utf8');
                const list = JSON.parse(raw);
                list.forEach(item => this.outstandings.set(item.businessId, item));
            }
        }
        catch (err) {
            console.error('[OutstandingRepository] Failed to load from disk:', err);
        }
    }
    async persistToDisk() {
        try {
            ensureReadyDir();
            const list = Array.from(this.outstandings.values());
            await fs_1.default.promises.writeFile(this.filePath, JSON.stringify(list, null, 2), 'utf8');
        }
        catch (err) {
            console.error('[OutstandingRepository] Failed to persist to disk:', err);
        }
    }
    async saveBatch(items) {
        items.forEach(item => {
            this.outstandings.set(item.businessId, item);
        });
        await this.persistToDisk();
        return items.length;
    }
    async list(filters) {
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
    async findByBusinessId(businessId) {
        return this.outstandings.get(businessId);
    }
    async clear() {
        this.outstandings.clear();
        await this.persistToDisk();
    }
}
exports.OutstandingRepository = OutstandingRepository;
if (!globalThis.__txRepoInstance__) {
    globalThis.__txRepoInstance__ = new TransactionRepository();
}
if (!globalThis.__invRepoInstance__) {
    globalThis.__invRepoInstance__ = new InventoryRepository();
}
if (!globalThis.__outRepoInstance__) {
    globalThis.__outRepoInstance__ = new OutstandingRepository();
}
exports.transactionRepository = globalThis.__txRepoInstance__;
exports.inventoryRepository = globalThis.__invRepoInstance__;
exports.outstandingRepository = globalThis.__outRepoInstance__;
