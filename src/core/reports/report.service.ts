import {
  transactionRepository,
  inventoryRepository,
  outstandingRepository,
} from '@/infrastructure/repositories/canonical-repositories';
import { businessRepository } from '@/infrastructure/repositories/business-repository';
import { TransactionEntity } from '@/core/domain/canonical-models';

export interface ReportQueryParams {
  dataset: 'sales' | 'purchases' | 'outstanding' | 'inventory' | 'business_activity';
  startDate?: string;
  endDate?: string;
  groupBy?: 'party' | 'product' | 'company' | 'area' | 'route' | 'month' | 'day';
  filterParty?: string;
  filterCompany?: string;
  filterRisk?: string;
  search?: string;
  limit?: number;
  offset?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ReportSummaryKpi {
  id: string;
  label: string;
  value: string | number;
  formattedValue: string;
  subtext?: string;
  trend?: string;
}

export interface ReportTableRow {
  [key: string]: any;
}

export interface ReportResult {
  dataset: string;
  status: 'LOADED' | 'NOT_CONNECTED' | 'NO_RECORDS';
  statusMessage?: string;
  generatedAt: string;
  dateRange: { start?: string; end?: string };
  kpis: ReportSummaryKpi[];
  timeSeries: Array<{ label: string; value: number; count: number }>;
  rows: ReportTableRow[];
  totalRows: number;
  reconciliation?: {
    isReconciled: boolean;
    netAmount?: number;
    taxAmount?: number;
    grossAmount?: number;
    formula: string;
    unreconciledDifference?: number;
  };
  provenance?: {
    sourceSystem: string;
    recordCount: number;
    freshness: string;
  };
}

export class ReportService {
  /**
   * Main generic report entrypoint
   */
  static async generateReport(params: ReportQueryParams): Promise<ReportResult> {
    switch (params.dataset) {
      case 'sales':
        return ReportService.generateSalesReport(params);
      case 'purchases':
        return ReportService.generatePurchasesReport(params);
      case 'outstanding':
        return ReportService.generateOutstandingReport(params);
      case 'inventory':
        return ReportService.generateInventoryReport(params);
      case 'business_activity':
      default:
        return ReportService.generateBusinessActivityReport(params);
    }
  }

  /**
   * 1. Sales Intelligence Report
   */
  private static async generateSalesReport(params: ReportQueryParams): Promise<ReportResult> {
    const allTx = await transactionRepository.getAll();
    let sales = allTx.filter(t => t.type === 'sale' || t.type === 'sale_return');
    console.log(`[ReportService] generateSalesReport - allTx: ${allTx.length}, sales: ${sales.length}`);

    if (params.startDate) {
      sales = sales.filter(s => s.date >= params.startDate!);
    }
    if (params.endDate) {
      sales = sales.filter(s => s.date <= params.endDate!);
    }
    if (params.search) {
      const q = params.search.toLowerCase().trim();
      sales = sales.filter(s => 
        s.partyName.toLowerCase().includes(q) ||
        s.invoiceId.toLowerCase().includes(q) ||
        s.items.some(i => i.productName.toLowerCase().includes(q) || (i.manufacturer && i.manufacturer.toLowerCase().includes(q)))
      );
    }
    if (params.filterParty) {
      sales = sales.filter(s => s.partyName.toLowerCase().includes(params.filterParty!.toLowerCase()));
    }
    if (params.filterCompany) {
      sales = sales.filter(s => s.items.some(i => i.manufacturer?.toLowerCase() === params.filterCompany!.toLowerCase()));
    }

    let totalRevenue = 0;
    let totalTax = 0;
    let totalUnits = 0;
    const partiesSet = new Set<string>();
    const timeSeriesMap = new Map<string, { value: number; count: number }>();
    const groupedMap = new Map<string, {
      dimension: string;
      revenue: number;
      tax: number;
      units: number;
      invoices: number;
      secondary?: string;
    }>();

    for (const tx of sales) {
      const isReturn = tx.type === 'sale_return';
      const multiplier = isReturn ? -1 : 1;
      const net = tx.netAmount * multiplier;
      const tax = tx.taxAmount * multiplier;
      
      totalRevenue += net;
      totalTax += tax;
      partiesSet.add(tx.partyName);

      // Time series aggregation (by YYYY-MM)
      const monthKey = tx.date.substring(0, 7) || '2026-04';
      const currentTs = timeSeriesMap.get(monthKey) || { value: 0, count: 0 };
      currentTs.value += net;
      currentTs.count += 1;
      timeSeriesMap.set(monthKey, currentTs);

      // Dimension Grouping
      for (const item of tx.items) {
        totalUnits += item.quantity * multiplier;
        let dimKey = tx.partyName;
        let sec = tx.area || 'Unknown Area';

        if (params.groupBy === 'product') {
          dimKey = item.productName;
          sec = item.manufacturer || 'General';
        } else if (params.groupBy === 'company') {
          dimKey = item.manufacturer || 'Other';
          sec = 'Brand';
        } else if (params.groupBy === 'route') {
          dimKey = tx.route || 'Direct Route';
          sec = tx.area || '';
        } else if (params.groupBy === 'area') {
          dimKey = tx.area || 'Unassigned Area';
          sec = tx.route || '';
        }

        const existing = groupedMap.get(dimKey) || {
          dimension: dimKey,
          revenue: 0,
          tax: 0,
          units: 0,
          invoices: 0,
          secondary: sec,
        };
        existing.revenue += item.netAmount * multiplier;
        existing.tax += item.taxAmount * multiplier;
        existing.units += item.quantity * multiplier;
        existing.invoices += 1;
        groupedMap.set(dimKey, existing);
      }
    }

    const timeSeries = Array.from(timeSeriesMap.entries())
      .map(([label, d]) => ({ label, value: Math.round(d.value), count: d.count }))
      .sort((a, b) => a.label.localeCompare(b.label));

    let rows = Array.from(groupedMap.values()).map(r => ({
      dimension: r.dimension,
      secondary: r.secondary,
      revenue: Math.round(r.revenue * 100) / 100,
      tax: Math.round(r.tax * 100) / 100,
      gross: Math.round((r.revenue + r.tax) * 100) / 100,
      units: Math.round(r.units),
      invoices: r.invoices,
    }));

    // Sorting
    const sortBy = params.sortBy || 'revenue';
    const isAsc = params.sortOrder === 'asc';
    rows.sort((a: any, b: any) => {
      const valA = a[sortBy] ?? 0;
      const valB = b[sortBy] ?? 0;
      if (typeof valA === 'number') {
        return isAsc ? valA - valB : valB - valA;
      }
      return isAsc ? String(valA).localeCompare(String(valB)) : String(valB).localeCompare(String(valA));
    });

    const totalRows = rows.length;
    const offset = params.offset || 0;
    const limit = params.limit || 50;

    const totalSalesInRepo = allTx.filter(t => t.type === 'sale' || t.type === 'sale_return').length;
    const isNotConnected = totalSalesInRepo === 0;
    const isNoRecords = !isNotConnected && sales.length === 0;
    const status = isNotConnected ? 'NOT_CONNECTED' : isNoRecords ? 'NO_RECORDS' : 'LOADED';
    const statusMessage = isNotConnected 
      ? 'No sales dataset connected. Ingest sales analysis CSV or connect ERP to view revenue, invoices, and output GST.'
      : isNoRecords
      ? 'No sales records match the selected filter or search criteria.'
      : undefined;

    return {
      dataset: 'sales',
      status,
      statusMessage,
      generatedAt: new Date().toISOString(),
      dateRange: { start: params.startDate, end: params.endDate },
      kpis: [
        {
          id: 'total_sales_revenue',
          label: 'Total Net Sales',
          value: Math.round(totalRevenue),
          formattedValue: isNotConnected ? 'Not Connected' : `₹${(totalRevenue / 100000).toFixed(2)} Lakh`,
          subtext: isNotConnected ? 'Awaiting Sales Ingestion' : `Across ${sales.length.toLocaleString()} invoices`,
        },
        {
          id: 'total_gst_collected',
          label: 'GST Collected',
          value: Math.round(totalTax),
          formattedValue: isNotConnected ? 'Not Connected' : `₹${(totalTax / 100000).toFixed(2)} Lakh`,
          subtext: 'Output GST Tax',
        },
        {
          id: 'active_buying_customers',
          label: 'Active Customers',
          value: partiesSet.size,
          formattedValue: isNotConnected ? '0' : partiesSet.size.toLocaleString(),
          subtext: 'Unique buying parties',
        },
        {
          id: 'total_units_sold',
          label: 'Units Dispatched',
          value: Math.round(totalUnits),
          formattedValue: isNotConnected ? '0' : Math.round(totalUnits).toLocaleString(),
          subtext: 'Product quantity',
        },
      ],
      timeSeries,
      rows: rows.slice(offset, offset + limit),
      totalRows,
      reconciliation: {
        isReconciled: true,
        netAmount: Math.round(totalRevenue * 100) / 100,
        taxAmount: Math.round(totalTax * 100) / 100,
        grossAmount: Math.round((totalRevenue + totalTax) * 100) / 100,
        formula: 'Total Net Sales (Taxable) + Output GST = Gross Sales Invoice Value',
      },
      provenance: {
        sourceSystem: 'Marg ERP Sales Journal / Ingestion Stream',
        recordCount: sales.length,
        freshness: isNotConnected ? 'No data' : 'Synchronized with canonical transaction store',
      },
    };
  }

  /**
   * 2. Purchase Intelligence Report
   */
  private static async generatePurchasesReport(params: ReportQueryParams): Promise<ReportResult> {
    const allTx = await transactionRepository.getAll();
    let purchases = allTx.filter(t => t.type === 'purchase' || t.type === 'purchase_return');

    if (params.startDate) purchases = purchases.filter(p => p.date >= params.startDate!);
    if (params.endDate) purchases = purchases.filter(p => p.date <= params.endDate!);
    if (params.search) {
      const q = params.search.toLowerCase().trim();
      purchases = purchases.filter(p => 
        p.partyName.toLowerCase().includes(q) ||
        p.invoiceId.toLowerCase().includes(q) ||
        p.items.some(i => i.productName.toLowerCase().includes(q))
      );
    }

    let totalSpend = 0;
    let totalTax = 0;
    let totalUnits = 0;
    const suppliersSet = new Set<string>();
    const timeSeriesMap = new Map<string, { value: number; count: number }>();
    const supplierMap = new Map<string, {
      supplierName: string;
      spend: number;
      tax: number;
      units: number;
      invoices: number;
    }>();

    for (const tx of purchases) {
      const isReturn = tx.type === 'purchase_return';
      const mult = isReturn ? -1 : 1;
      const net = tx.netAmount * mult;
      const tax = tx.taxAmount * mult;

      totalSpend += net;
      totalTax += tax;
      suppliersSet.add(tx.partyName);

      const monthKey = tx.date.substring(0, 7) || '2026-04';
      const curr = timeSeriesMap.get(monthKey) || { value: 0, count: 0 };
      curr.value += net;
      curr.count += 1;
      timeSeriesMap.set(monthKey, curr);

      for (const item of tx.items) {
        totalUnits += item.quantity * mult;
        const sKey = tx.partyName;
        const existing = supplierMap.get(sKey) || {
          supplierName: sKey,
          spend: 0,
          tax: 0,
          units: 0,
          invoices: 0,
        };
        existing.spend += item.netAmount * mult;
        existing.tax += item.taxAmount * mult;
        existing.units += item.quantity * mult;
        existing.invoices += 1;
        supplierMap.set(sKey, existing);
      }
    }

    const timeSeries = Array.from(timeSeriesMap.entries())
      .map(([label, d]) => ({ label, value: Math.round(d.value), count: d.count }))
      .sort((a, b) => a.label.localeCompare(b.label));

    const rows = Array.from(supplierMap.values()).map(s => ({
      dimension: s.supplierName,
      spend: Math.round(s.spend * 100) / 100,
      tax: Math.round(s.tax * 100) / 100,
      gross: Math.round((s.spend + s.tax) * 100) / 100,
      units: Math.round(s.units),
      invoices: s.invoices,
    })).sort((a, b) => b.spend - a.spend);

    const offset = params.offset || 0;
    const limit = params.limit || 50;

    const totalPurchasesInRepo = allTx.filter(t => t.type === 'purchase' || t.type === 'purchase_return').length;
    const isNotConnected = totalPurchasesInRepo === 0;
    const isNoRecords = !isNotConnected && purchases.length === 0;
    const status = isNotConnected ? 'NOT_CONNECTED' : isNoRecords ? 'NO_RECORDS' : 'LOADED';
    const statusMessage = isNotConnected 
      ? 'No purchase dataset connected. Ingest purchase analysis CSV or connect ERP to view procurement spend and Input Tax Credit (ITC).'
      : isNoRecords 
      ? 'No purchase records match the selected filter or search criteria.'
      : undefined;

    return {
      dataset: 'purchases',
      status,
      statusMessage,
      generatedAt: new Date().toISOString(),
      dateRange: { start: params.startDate, end: params.endDate },
      kpis: [
        {
          id: 'total_purchase_spend',
          label: 'Total Procurement',
          value: Math.round(totalSpend),
          formattedValue: isNotConnected ? 'Not Connected' : `₹${(totalSpend / 100000).toFixed(2)} Lakh`,
          subtext: isNotConnected ? 'Awaiting Procurement Ingestion' : 'Net procurement spend',
        },
        {
          id: 'input_gst_tax',
          label: 'Input GST Credit',
          value: Math.round(totalTax),
          formattedValue: isNotConnected ? 'Not Connected' : `₹${(totalTax / 100000).toFixed(2)} Lakh`,
          subtext: 'Eligible ITC credit',
        },
        {
          id: 'active_suppliers',
          label: 'Active Suppliers',
          value: suppliersSet.size,
          formattedValue: isNotConnected ? '0' : suppliersSet.size.toLocaleString(),
          subtext: 'Pharma manufacturers',
        },
        {
          id: 'purchased_units',
          label: 'Units Procured',
          value: Math.round(totalUnits),
          formattedValue: isNotConnected ? '0' : Math.round(totalUnits).toLocaleString(),
          subtext: 'Stock received',
        },
      ],
      timeSeries,
      rows: rows.slice(offset, offset + limit),
      totalRows: rows.length,
      reconciliation: {
        isReconciled: true,
        netAmount: Math.round(totalSpend * 100) / 100,
        taxAmount: Math.round(totalTax * 100) / 100,
        grossAmount: Math.round((totalSpend + totalTax) * 100) / 100,
        formula: 'Net Procurement (Taxable) + Input GST (ITC) = Gross Purchase Bill Value',
      },
      provenance: {
        sourceSystem: 'Marg ERP Purchase Ledger',
        recordCount: purchases.length,
        freshness: isNotConnected ? 'No data' : 'Synchronized with canonical transaction store',
      },
    };
  }

  /**
   * 3. Outstanding / Receivables & Aging Report
   */
  private static async generateOutstandingReport(params: ReportQueryParams): Promise<ReportResult> {
    const rawList = await outstandingRepository.list();
    const isNotConnected = rawList.length === 0;

    let list = await outstandingRepository.list({
      riskLevel: params.filterRisk,
      search: params.search,
    });
    const isNoRecords = !isNotConnected && list.length === 0;
    const status = isNotConnected ? 'NOT_CONNECTED' : isNoRecords ? 'NO_RECORDS' : 'LOADED';
    const statusMessage = isNotConnected
      ? 'No outstanding receivables dataset connected. Ingest OUTSTANDING ledger CSV or connect ERP to view aging buckets and credit risks.'
      : isNoRecords
      ? 'No outstanding accounts match the selected filter or search criteria.'
      : undefined;

    let totalReceivables = 0;
    let totalBucket0_30 = 0;
    let totalBucket31_60 = 0;
    let totalBucket61_90 = 0;
    let totalBucket90Plus = 0;
    let criticalRiskCount = 0;

    list.forEach(item => {
      if (item.totalOutstanding > 0) {
        totalReceivables += item.totalOutstanding;
        totalBucket0_30 += item.bucket0_30;
        totalBucket31_60 += item.bucket31_60;
        totalBucket61_90 += item.bucket61_90;
        totalBucket90Plus += item.bucket90Plus;
      }
      if (item.riskLevel === 'CRITICAL' || item.riskLevel === 'HIGH') {
        criticalRiskCount++;
      }
    });

    const timeSeries = [
      { label: '0-30 Days', value: Math.round(totalBucket0_30), count: 0 },
      { label: '31-60 Days', value: Math.round(totalBucket31_60), count: 0 },
      { label: '61-90 Days', value: Math.round(totalBucket61_90), count: 0 },
      { label: '90+ Days', value: Math.round(totalBucket90Plus), count: 0 },
    ];

    const offset = params.offset || 0;
    const limit = params.limit || 50;

    return {
      dataset: 'outstanding',
      status,
      statusMessage,
      generatedAt: new Date().toISOString(),
      dateRange: { start: params.startDate, end: params.endDate },
      kpis: [
        {
          id: 'total_outstanding_receivables',
          label: 'Total Receivables',
          value: Math.round(totalReceivables),
          formattedValue: isNotConnected ? 'Not Connected' : `₹${(totalReceivables / 100000).toFixed(2)} Lakh`,
          subtext: isNotConnected ? 'Awaiting Receivables Ingestion' : `From ${list.length} accounts`,
        },
        {
          id: 'overdue_90_plus',
          label: 'Overdue >90 Days',
          value: Math.round(totalBucket90Plus),
          formattedValue: isNotConnected ? 'Not Connected' : `₹${(totalBucket90Plus / 100000).toFixed(2)} Lakh`,
          subtext: 'High recovery priority',
          trend: totalBucket90Plus > 0 ? 'warning' : undefined,
        },
        {
          id: 'current_0_30_days',
          label: 'Current (0-30 Days)',
          value: Math.round(totalBucket0_30),
          formattedValue: isNotConnected ? 'Not Connected' : `₹${(totalBucket0_30 / 100000).toFixed(2)} Lakh`,
          subtext: 'Healthy credit cycle',
        },
        {
          id: 'high_risk_accounts',
          label: 'Risk Accounts',
          value: criticalRiskCount,
          formattedValue: isNotConnected ? '0' : criticalRiskCount.toLocaleString(),
          subtext: 'Overdue or limit exceeded',
          trend: criticalRiskCount > 0 ? 'warning' : undefined,
        },
      ],
      timeSeries,
      rows: list.slice(offset, offset + limit),
      totalRows: list.length,
      reconciliation: {
        isReconciled: true,
        netAmount: Math.round(totalReceivables * 100) / 100,
        formula: 'Total Receivables = Sum of positive 0-30D + 31-60D + 61-90D + >90D aging buckets',
      },
      provenance: {
        sourceSystem: 'Marg ERP Outstanding Ledger',
        recordCount: list.length,
        freshness: isNotConnected ? 'No data' : 'Synchronized with canonical ledger store',
      },
    };
  }

  /**
   * 4. Inventory Stock Report
   */
  private static async generateInventoryReport(params: ReportQueryParams): Promise<ReportResult> {
    const rawList = await inventoryRepository.list();
    const isNotConnected = rawList.length === 0;

    const list = await inventoryRepository.list({
      search: params.search,
    });
    const isNoRecords = !isNotConnected && list.length === 0;
    const status = isNotConnected ? 'NOT_CONNECTED' : isNoRecords ? 'NO_RECORDS' : 'LOADED';
    const statusMessage = isNotConnected
      ? 'No inventory dataset connected. Ingest opening stock CSV or connect ERP warehouse stream to view SKU stock on hand and reorder alerts.'
      : isNoRecords
      ? 'No inventory items match the selected search criteria.'
      : undefined;

    let totalQuantity = 0;
    let lowStockCount = 0;
    const brandMap = new Map<string, { brand: string; count: number; totalUnits: number }>();

    list.forEach(item => {
      totalQuantity += item.quantityOnHand;
      if (item.quantityOnHand <= (item.reorderLevel || 20)) {
        lowStockCount++;
      }
      const bKey = item.manufacturer || 'General Catalog';
      const curr = brandMap.get(bKey) || { brand: bKey, count: 0, totalUnits: 0 };
      curr.count += 1;
      curr.totalUnits += item.quantityOnHand;
      brandMap.set(bKey, curr);
    });

    const timeSeries = Array.from(brandMap.values())
      .sort((a, b) => b.totalUnits - a.totalUnits)
      .slice(0, 8)
      .map(b => ({ label: b.brand, value: Math.round(b.totalUnits), count: b.count }));

    const offset = params.offset || 0;
    const limit = params.limit || 50;

    // Attach suggested reorder recommendations
    const enrichedRows = list.map(item => {
      const reorderLevel = item.reorderLevel || 20;
      const isLowStock = item.quantityOnHand <= reorderLevel;
      const suggestedReorderQty = isLowStock ? Math.max(reorderLevel * 3 - item.quantityOnHand, 30) : 0;
      return {
        ...item,
        isLowStock,
        suggestedReorderQty,
      };
    });

    return {
      dataset: 'inventory',
      status,
      statusMessage,
      generatedAt: new Date().toISOString(),
      dateRange: { start: params.startDate, end: params.endDate },
      kpis: [
        {
          id: 'total_skus',
          label: 'Total SKUs',
          value: list.length,
          formattedValue: isNotConnected ? 'Not Connected' : list.length.toLocaleString(),
          subtext: isNotConnected ? 'Awaiting Inventory Ingestion' : 'Active product catalog',
        },
        {
          id: 'total_stock_units',
          label: 'Stock on Hand',
          value: Math.round(totalQuantity),
          formattedValue: isNotConnected ? 'Not Connected' : Math.round(totalQuantity).toLocaleString(),
          subtext: 'Total physical units',
        },
        {
          id: 'low_stock_alerts',
          label: 'Reorder Alerts',
          value: lowStockCount,
          formattedValue: isNotConnected ? '0' : lowStockCount.toLocaleString(),
          subtext: 'Below reorder threshold',
          trend: lowStockCount > 0 ? 'warning' : undefined,
        },
        {
          id: 'active_manufacturers',
          label: 'Pharma Brands',
          value: brandMap.size,
          formattedValue: isNotConnected ? '0' : brandMap.size.toLocaleString(),
          subtext: 'Distinct suppliers',
        },
      ],
      timeSeries,
      rows: enrichedRows.slice(offset, offset + limit),
      totalRows: list.length,
      reconciliation: {
        isReconciled: true,
        netAmount: Math.round(totalQuantity),
        formula: 'Stock on Hand = Current Physical SKU Inventory Count',
      },
      provenance: {
        sourceSystem: 'Marg ERP Opening Inventory / Warehouse Stream',
        recordCount: list.length,
        freshness: isNotConnected ? 'No data' : 'Verified warehouse balance',
      },
    };
  }

  /**
   * 5. Business Activity Report
   */
  private static async generateBusinessActivityReport(params: ReportQueryParams): Promise<ReportResult> {
    const businesses = await businessRepository.list();
    const isNotConnected = businesses.length === 0;
    const stats = await businessRepository.getStats();
    const status = isNotConnected ? 'NOT_CONNECTED' : 'LOADED';
    const statusMessage = isNotConnected 
      ? 'No business directory connected. Ingest party master CSV to view unified trade entities.'
      : undefined;

    return {
      dataset: 'business_activity',
      status,
      statusMessage,
      generatedAt: new Date().toISOString(),
      dateRange: { start: params.startDate, end: params.endDate },
      kpis: [
        {
          id: 'total_registered_accounts',
          label: 'Total Accounts',
          value: stats.totalBusinesses,
          formattedValue: isNotConnected ? 'Not Connected' : stats.totalBusinesses.toLocaleString(),
          subtext: isNotConnected ? 'Awaiting Party Master' : 'B2B Dealers & Suppliers',
        },
        {
          id: 'verified_gstin',
          label: 'Verified GSTINs',
          value: stats.verifiedGstin,
          formattedValue: isNotConnected ? '0' : stats.verifiedGstin.toLocaleString(),
          subtext: 'Tax registered entities',
        },
        {
          id: 'b2b_dealers',
          label: 'B2B Chemist Stores',
          value: stats.b2bDealers,
          formattedValue: isNotConnected ? '0' : stats.b2bDealers.toLocaleString(),
          subtext: 'Authorized distributors',
        },
        {
          id: 'b2b_hospitals',
          label: 'Hospitals & Clinics',
          value: stats.b2bHospitals,
          formattedValue: isNotConnected ? '0' : stats.b2bHospitals.toLocaleString(),
          subtext: 'Healthcare institutions',
        },
      ],
      timeSeries: [
        { label: 'B2B Dealers', value: stats.b2bDealers, count: stats.b2bDealers },
        { label: 'Hospitals/Clinics', value: stats.b2bHospitals, count: stats.b2bHospitals },
        { label: 'Suppliers', value: stats.suppliers, count: stats.suppliers },
      ],
      rows: businesses.slice(params.offset || 0, (params.offset || 0) + (params.limit || 50)),
      totalRows: businesses.length,
      reconciliation: {
        isReconciled: true,
        formula: 'Total Accounts = Unique Master Party Identifiers (GSTIN, PAN, ERP Code)',
      },
      provenance: {
        sourceSystem: 'Marg ERP Party Master',
        recordCount: businesses.length,
        freshness: isNotConnected ? 'No data' : 'Verified canonical directory',
      },
    };
  }
}
