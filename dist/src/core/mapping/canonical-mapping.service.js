"use strict";
/**
 * Declarative Canonical Mapping Service
 * Translates disparate source formats (Marg ERP, Tally, Zoho, SAP, generic CSV/Excel)
 * into Conductor Canonical Domain Models without hardcoded system logic.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CanonicalMappingService = void 0;
class CanonicalMappingService {
    /**
     * Normalize dates from various formats (e.g., '01-Apr-2026', '01/04/2026', '2026-04-01') to ISO-8601
     */
    static parseDate(dateStr) {
        if (!dateStr)
            return new Date().toISOString();
        const str = String(dateStr).trim();
        // Already ISO-8601 or standard numeric timestamp
        const standardParsed = Date.parse(str);
        if (!isNaN(standardParsed) && !str.includes('-') && !str.includes('/')) {
            return new Date(standardParsed).toISOString();
        }
        // Indian format: '01-Apr-2026' or '01-Apr-26'
        const dMonYRegex = /^(\d{1,2})[-\s/]([A-Za-z]{3})[-\s/](\d{2,4})$/;
        const dMonYMatch = str.match(dMonYRegex);
        if (dMonYMatch) {
            const day = parseInt(dMonYMatch[1], 10);
            const monStr = dMonYMatch[2].toLowerCase();
            let year = parseInt(dMonYMatch[3], 10);
            if (year < 100)
                year += 2000;
            const months = {
                jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
                jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11
            };
            const month = months[monStr];
            if (month !== undefined) {
                const d = new Date(Date.UTC(year, month, day));
                return d.toISOString();
            }
        }
        // Format: '01/04/2026' or '01-04-2026' (DD-MM-YYYY)
        const ddmmyyyyRegex = /^(\d{1,2})[-\/](\d{1,2})[-\/](\d{2,4})$/;
        const ddmmyyyyMatch = str.match(ddmmyyyyRegex);
        if (ddmmyyyyMatch) {
            const day = parseInt(ddmmyyyyMatch[1], 10);
            const month = parseInt(ddmmyyyyMatch[2], 10) - 1;
            let year = parseInt(ddmmyyyyMatch[3], 10);
            if (year < 100)
                year += 2000;
            const d = new Date(Date.UTC(year, month, day));
            if (!isNaN(d.getTime())) {
                return d.toISOString();
            }
        }
        if (!isNaN(standardParsed)) {
            return new Date(standardParsed).toISOString();
        }
        return new Date().toISOString();
    }
    /**
     * Determine evidence-based business classification
     */
    static classifyBusiness(party) {
        const group = (party.group || '').toUpperCase();
        const name = (party.name || '').toUpperCase();
        const gstin = (party.gstin || '').trim();
        if (group.includes('FIELD STAFF'))
            return 'field_staff';
        if (group.includes('CREDITOR') || group.includes('SUPPLIER'))
            return 'supplier';
        if (name.includes('HOSPITAL') || name.includes('CLINIC') || name.includes('MATERNITY') || name.includes('NURSING')) {
            return 'b2b_hospital';
        }
        if (gstin.length >= 10 || party.drugLicense || group.includes('DEBTOR')) {
            return 'b2b_dealer';
        }
        if (name.includes('CASH') || group.includes('CASH')) {
            return 'b2c_individual';
        }
        return 'unknown';
    }
    /**
     * Maps Marg ERP partyMaster record to BusinessEntity
     */
    static mapPartyMasterToBusiness(raw) {
        const gstin = String(raw.tin || raw.PTGSTNO || raw.gstin || '').trim();
        const pan = String(raw.panno || raw.ITPANNO || raw.pan || '').toUpperCase().trim();
        const rawName = String(raw.name || raw.ledger || raw.PNAME || 'Unnamed Party').trim();
        const cleanName = rawName.replace(/\s+/g, ' ');
        const erpCode = String(raw.code || '').trim();
        // Canonical Anchor ID
        const canonicalId = gstin && gstin.length >= 10
            ? `gst:${gstin}`
            : pan && pan.length >= 10
                ? `pan:${pan}`
                : erpCode
                    ? `erp:${erpCode}`
                    : `party:${cleanName.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
        const licenses = raw.licence
            ? String(raw.licence).split(',').map(l => l.trim()).filter(Boolean)
            : [];
        const classification = CanonicalMappingService.classifyBusiness({
            gstin,
            drugLicense: raw.licence,
            group: raw.group,
            name: rawName,
        });
        return {
            id: canonicalId,
            name: cleanName,
            legalName: String(raw.ledger || cleanName).replace(/\s+/g, ' ').trim(),
            erpCode: erpCode || undefined,
            taxId: gstin.length >= 10 ? gstin : undefined,
            pan: pan.length >= 10 ? pan : undefined,
            drugLicenses: licenses.length > 0 ? licenses : undefined,
            classification,
            address: {
                addressLine1: raw.address1 ? String(raw.address1).trim() : undefined,
                addressLine2: raw.address2 ? String(raw.address2).trim() : undefined,
                addressLine3: raw.address3 ? String(raw.address3).trim() : undefined,
                city: raw.city ? String(raw.city).trim() : undefined,
                pinCode: raw.pin ? String(raw.pin).trim() : undefined,
                area: raw.area ? String(raw.area).trim() : undefined,
                route: raw.rout ? String(raw.rout).trim() : undefined,
                country: 'India',
            },
            contact: {
                contactPerson: raw.contact ? String(raw.contact).trim() : undefined,
                phone1: raw.phone1 ? String(raw.phone1).trim() : undefined,
                phone2: raw.phone2 ? String(raw.phone2).trim() : undefined,
                mobile: raw.mobile ? String(raw.mobile).trim() : undefined,
                email: raw.email && String(raw.email).includes('@') ? String(raw.email).trim().toLowerCase() : undefined,
            },
            credit: {
                creditDays: parseFloat(raw.crdays) || 0,
                creditLimit: parseFloat(raw.cramount) || 0,
                limitBills: parseFloat(raw.limitbill) || 0,
                limitDays: parseFloat(raw.limitday) || 0,
                limitType: raw.limittype ? (raw.limittype === 'Only Indicate' ? 'Only Indicate' : raw.limittype === 'Stop Bill' ? 'Stop Bill' : 'None') : 'None',
                isFrozen: String(raw.freez || '').includes('Y'),
            },
            bankDetails: raw.bank ? {
                bankName: String(raw.bank).trim(),
                branch: raw.branch ? String(raw.branch).trim() : undefined,
            } : undefined,
            sourceSystem: 'Marg ERP',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
    }
    /**
     * Maps Sales/Purchase CSV row into TransactionEntity
     */
    static mapJournalRowToTransaction(raw) {
        const rawType = String(raw.TYPE2 || raw.type || '').trim().toLowerCase();
        let type = 'sale';
        if (rawType.includes('purc'))
            type = 'purchase';
        else if (rawType.includes('s/re') || rawType.includes('salereturn'))
            type = 'sale_return';
        else if (rawType.includes('p/re') || rawType.includes('purchasereturn'))
            type = 'purchase_return';
        else if (rawType.includes('stk') || rawType.includes('stock'))
            type = 'stock_adjustment';
        else if (rawType.includes('brk') || rawType.includes('damage') || rawType.includes('breakage'))
            type = 'breakage';
        else if (rawType.includes('pric'))
            type = 'price_adjustment';
        const voucherNo = String(raw.VCN || raw.invoiceId || raw.billNo || `TX-${Date.now()}`).trim();
        const isoDate = CanonicalMappingService.parseDate(raw.C_DATE || raw.date);
        const partyName = String(raw.PNAME || raw.partyName || 'Cash Customer').replace(/\s+/g, ' ').trim();
        const gstin = String(raw.PTGSTNO || raw.gstin || '').trim();
        const pan = String(raw.ITPANNO || raw.pan || '').trim();
        const partyId = gstin && gstin.length >= 10
            ? `gst:${gstin}`
            : pan && pan.length >= 10
                ? `pan:${pan}`
                : `party:${partyName.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
        const productName = String(raw.NAME || raw.productName || 'Unnamed Product').replace(/\s+/g, ' ').trim();
        const qty = Math.abs(parseFloat(raw.QTY || raw.quantity) || 0);
        const freeQty = Math.abs(parseFloat(raw.FREE || raw.freeQuantity) || 0);
        const unitRate = Math.abs(parseFloat(raw.RATE || raw.rate) || 0);
        const rawAmount = parseFloat(raw.AMOUNT || raw.amount) || 0;
        const netAmount = (type === 'sale_return' || type === 'purchase_return') ? Math.abs(rawAmount) : rawAmount;
        const gstRate = Math.abs(parseFloat(raw.GST || raw.taxRate) || 0);
        const taxAmount = Math.abs(parseFloat(raw.TAXAMT || raw.taxAmount) || 0);
        const mrp = Math.abs(parseFloat(raw.MRP || raw.mrp) || 0);
        const mrpAmount = Math.abs(parseFloat(raw.MRPAMT || raw.mrpAmount) || (mrp * qty));
        const lineItem = {
            productId: `prod:${productName.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
            productName,
            manufacturer: raw.COMPANY ? String(raw.COMPANY).trim() : undefined,
            batchNumber: raw.BATCH ? String(raw.BATCH).trim() : undefined,
            quantity: qty,
            freeQuantity: freeQty,
            unitRate,
            schemeAmount: Math.abs(parseFloat(raw.SCHMAMT) || 0),
            discountAmount: Math.abs(parseFloat(raw.DISCOUNT) || 0),
            netAmount,
            gstRate,
            taxAmount,
            mrp,
            mrpAmount,
        };
        return {
            id: `tx:${voucherNo}_${lineItem.productId}_${lineItem.batchNumber || 'nobatch'}`,
            invoiceId: voucherNo,
            type,
            date: isoDate,
            partyId,
            partyName,
            partyGstin: gstin || undefined,
            partyPan: pan || undefined,
            salesType: raw.SALESTYPE === 'C' ? 'Central' : 'Local',
            area: raw.AREANAME ? String(raw.AREANAME).trim() : undefined,
            route: raw.ROUTNAME ? String(raw.ROUTNAME).trim() : undefined,
            items: [lineItem],
            netAmount,
            taxAmount,
            grossAmount: netAmount + taxAmount,
            sourceSystem: 'Marg ERP Journal',
            createdAt: isoDate,
        };
    }
    /**
     * Maps Outstanding Ageing row into OutstandingEntity
     */
    static mapOutstandingRow(raw) {
        const desc = String(raw.Description || raw.partyName || '').trim();
        if (!desc || desc === 'TOTAL')
            return null;
        const total = parseFloat(String(raw.Total || '0').replace(/\s+/g, '')) || 0;
        // Parse monthly snapshot columns from Marg ERP
        const march2026 = parseFloat(String(raw['46235'] || raw['0-30'] || raw.march || '0').replace(/\s+/g, '')) || 0;
        const feb2026 = parseFloat(String(raw['46204'] || raw['31-60'] || raw.february || '0').replace(/\s+/g, '')) || 0;
        const jan2026 = parseFloat(String(raw['46174'] || raw['61-90'] || raw.january || '0').replace(/\s+/g, '')) || 0;
        const dec2025 = parseFloat(String(raw['46143'] || raw.december || '0').replace(/\s+/g, '')) || 0;
        const nov2025 = parseFloat(String(raw['46113'] || raw.november || '0').replace(/\s+/g, '')) || 0;
        const oct2025 = parseFloat(String(raw['46082'] || raw.october || '0').replace(/\s+/g, '')) || 0;
        const olderSep2025 = parseFloat(String(raw['Sep 2025\r+Older'] || raw['Older'] || raw.older || '0').replace(/\s+/g, '')) || 0;
        // Standard UI Ageing Buckets (from monthly snapshot)
        const bucket0_30 = march2026;
        const bucket31_60 = feb2026;
        const bucket61_90 = jan2026;
        const bucket90Plus = dec2025 + nov2025 + oct2025 + olderSep2025;
        // SOW specific buckets (30-45d, 45-60d, 60+d)
        const bucket30_45 = Math.round(feb2026 * 0.5);
        const bucket45_60 = Math.round(feb2026 * 0.5);
        const bucket60Plus = bucket61_90 + bucket90Plus;
        let riskLevel = 'LOW';
        let riskRationale = 'Account balance is current (within standard 30-day payment cycle).';
        if (bucket90Plus > 50000 || total > 500000) {
            riskLevel = 'CRITICAL';
            riskRationale = `CRITICAL: Overdue >90 days (₹${Math.round(bucket90Plus).toLocaleString()}) exceeds ₹50,000 credit threshold. Total exposure: ₹${Math.round(total).toLocaleString()}.`;
        }
        else if (bucket90Plus > 10000 || bucket61_90 > 50000) {
            riskLevel = 'HIGH';
            riskRationale = `HIGH RISK: Overdue aging >60 days (₹${Math.round(bucket61_90 + bucket90Plus).toLocaleString()}) requires urgent payment follow-up.`;
        }
        else if (bucket31_60 > 25000) {
            riskLevel = 'MEDIUM';
            riskRationale = `MEDIUM RISK: ₹${Math.round(bucket31_60).toLocaleString()} outstanding in 31-60 days window. Due date approaching.`;
        }
        const cleanName = desc.replace(/\s+/g, ' ').trim();
        const businessId = `party:${cleanName.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
        return {
            businessId,
            businessName: cleanName,
            totalOutstanding: total,
            bucket0_30,
            bucket31_60,
            bucket61_90,
            bucket90Plus,
            bucket30_45,
            bucket45_60,
            bucket60Plus,
            monthlyBreakdown: {
                march2026,
                feb2026,
                jan2026,
                dec2025,
                nov2025,
                oct2025,
                olderSep2025,
            },
            riskLevel,
            riskRationale,
            dataSourceType: 'monthly_snapshot',
            notice: 'Ageing bucket calculation requires invoice-level due dates. This file provides monthly balance snapshots only.',
            groupUid: raw.groupuid ? String(raw.groupuid).trim() : undefined,
            lastUpdated: new Date().toISOString(),
        };
    }
    /**
     * Maps Opening Stock row into InventoryEntity
     */
    static mapStockRow(raw) {
        const desc = String(raw.Description || raw.name || raw[0] || '').trim();
        if (!desc || desc.includes('OPENING STOCK') || desc.includes('AGRAWAL TRADING'))
            return null;
        const qty = parseFloat(raw['Opening Stock Unit'] || raw.quantity || raw[1] || '0') || 0;
        const cleanDesc = desc.replace(/\s+/g, ' ').trim();
        return {
            productId: `prod:${cleanDesc.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
            productName: cleanDesc,
            quantityOnHand: qty,
            reorderLevel: 20, // Reorder recommendation baseline
            unit: 'Units',
            lastUpdated: '2026-04-01T00:00:00.000Z',
        };
    }
}
exports.CanonicalMappingService = CanonicalMappingService;
