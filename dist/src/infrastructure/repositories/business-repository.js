"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.businessRepository = exports.BusinessRepository = void 0;
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
        console.error('[BusinessRepository] Failed to create data/ready dir:', err);
    }
}
class BusinessRepository {
    businesses = new Map();
    gstinIndex = new Map(); // GSTIN -> Business ID
    panIndex = new Map(); // PAN -> Business ID
    nameIndex = new Map(); // Normalized Name -> Business ID
    filePath = path_1.default.join(READY_DIR, 'businesses.json');
    constructor() {
        this.loadFromDisk();
    }
    loadFromDisk() {
        try {
            if (fs_1.default.existsSync(this.filePath)) {
                const raw = fs_1.default.readFileSync(this.filePath, 'utf8');
                const list = JSON.parse(raw);
                list.forEach(b => {
                    this.businesses.set(b.id, b);
                    this.updateIndexes(b);
                });
            }
        }
        catch (err) {
            console.error('[BusinessRepository] Failed to load from disk:', err);
        }
    }
    async persistToDisk() {
        try {
            ensureReadyDir();
            const list = Array.from(this.businesses.values());
            await fs_1.default.promises.writeFile(this.filePath, JSON.stringify(list, null, 2), 'utf8');
        }
        catch (err) {
            console.error('[BusinessRepository] Failed to persist to disk:', err);
        }
    }
    async save(business) {
        const existingId = this.findExistingId(business);
        const targetId = existingId || business.id;
        const existing = this.businesses.get(targetId);
        if (existing) {
            // Merge attributes preserving non-null values
            const merged = {
                ...existing,
                name: business.name || existing.name,
                legalName: business.legalName || existing.legalName,
                taxId: business.taxId || existing.taxId,
                pan: business.pan || existing.pan,
                drugLicenses: Array.from(new Set([...(existing.drugLicenses || []), ...(business.drugLicenses || [])])),
                classification: business.classification !== 'unknown' ? business.classification : existing.classification,
                address: { ...existing.address, ...business.address },
                contact: { ...existing.contact, ...business.contact },
                credit: {
                    creditDays: business.credit.creditDays || existing.credit.creditDays,
                    creditLimit: business.credit.creditLimit || existing.credit.creditLimit,
                    limitBills: business.credit.limitBills || existing.credit.limitBills,
                    limitDays: business.credit.limitDays || existing.credit.limitDays,
                    limitType: business.credit.limitType || existing.credit.limitType,
                    isFrozen: business.credit.isFrozen || existing.credit.isFrozen,
                },
                totalSales: (existing.totalSales || 0) + (business.totalSales || 0),
                totalPurchases: (existing.totalPurchases || 0) + (business.totalPurchases || 0),
                currentOutstanding: business.currentOutstanding !== undefined ? business.currentOutstanding : existing.currentOutstanding,
                updatedAt: new Date().toISOString(),
            };
            this.businesses.set(targetId, merged);
            this.updateIndexes(merged);
            await this.persistToDisk();
            return merged;
        }
        this.businesses.set(targetId, business);
        this.updateIndexes(business);
        await this.persistToDisk();
        return business;
    }
    findExistingId(b) {
        if (b.taxId && this.gstinIndex.has(b.taxId)) {
            return this.gstinIndex.get(b.taxId);
        }
        if (b.pan && this.panIndex.has(b.pan)) {
            return this.panIndex.get(b.pan);
        }
        const normName = this.normalizeName(b.name);
        if (normName && this.nameIndex.has(normName)) {
            return this.nameIndex.get(normName);
        }
        return null;
    }
    normalizeName(name) {
        return name.toLowerCase().replace(/[^a-z0-9]/g, '').trim();
    }
    updateIndexes(b) {
        if (b.taxId)
            this.gstinIndex.set(b.taxId, b.id);
        if (b.pan)
            this.panIndex.set(b.pan, b.id);
        const normName = this.normalizeName(b.name);
        if (normName)
            this.nameIndex.set(normName, b.id);
    }
    async findById(id) {
        if (this.businesses.size === 0)
            this.loadFromDisk();
        return this.businesses.get(id);
    }
    async list(filter) {
        if (this.businesses.size === 0)
            this.loadFromDisk();
        let result = Array.from(this.businesses.values());
        if (filter?.query) {
            const q = filter.query.toLowerCase().trim();
            result = result.filter(b => b.name.toLowerCase().includes(q) ||
                (b.legalName && b.legalName.toLowerCase().includes(q)) ||
                (b.taxId && b.taxId.toLowerCase().includes(q)) ||
                (b.pan && b.pan.toLowerCase().includes(q)) ||
                (b.erpCode && b.erpCode.toLowerCase().includes(q)) ||
                (b.address.city && b.address.city.toLowerCase().includes(q)) ||
                (b.address.area && b.address.area.toLowerCase().includes(q)));
        }
        if (filter?.classification) {
            result = result.filter(b => b.classification === filter.classification);
        }
        if (filter?.city) {
            result = result.filter(b => b.address.city?.toLowerCase() === filter.city?.toLowerCase());
        }
        if (filter?.hasGstin) {
            result = result.filter(b => !!b.taxId);
        }
        if (filter?.minOutstanding !== undefined) {
            result = result.filter(b => (b.currentOutstanding || 0) >= filter.minOutstanding);
        }
        return result;
    }
    async getStats() {
        if (this.businesses.size === 0)
            this.loadFromDisk();
        const all = Array.from(this.businesses.values());
        const totalBusinesses = all.length;
        let b2bDealers = 0;
        let b2bHospitals = 0;
        let suppliers = 0;
        let verifiedGstin = 0;
        let totalOutstanding = 0;
        let totalSales = 0;
        let totalPurchases = 0;
        all.forEach(b => {
            if (b.classification === 'b2b_dealer')
                b2bDealers++;
            else if (b.classification === 'b2b_hospital')
                b2bHospitals++;
            else if (b.classification === 'supplier')
                suppliers++;
            if (b.taxId)
                verifiedGstin++;
            if (b.currentOutstanding)
                totalOutstanding += b.currentOutstanding;
            if (b.totalSales)
                totalSales += b.totalSales;
            if (b.totalPurchases)
                totalPurchases += b.totalPurchases;
        });
        return {
            totalBusinesses,
            b2bDealers,
            b2bHospitals,
            suppliers,
            verifiedGstin,
            totalOutstanding: Math.round(totalOutstanding * 100) / 100,
            totalSales: Math.round(totalSales * 100) / 100,
            totalPurchases: Math.round(totalPurchases * 100) / 100,
            dataQuality: 99.2,
            lastUpdated: new Date().toISOString(),
        };
    }
    async count() {
        if (this.businesses.size === 0)
            this.loadFromDisk();
        return this.businesses.size;
    }
    async clear() {
        this.businesses.clear();
        this.gstinIndex.clear();
        this.panIndex.clear();
        this.nameIndex.clear();
        await this.persistToDisk();
    }
}
exports.BusinessRepository = BusinessRepository;
if (!globalThis.__businessRepositoryInstance__) {
    globalThis.__businessRepositoryInstance__ = new BusinessRepository();
}
exports.businessRepository = globalThis.__businessRepositoryInstance__;
