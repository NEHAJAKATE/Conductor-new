import { 
  transactionRepository, 
  inventoryRepository, 
  outstandingRepository 
} from '@/infrastructure/repositories/canonical-repositories';

import { TransactionEntity, OutstandingEntity, InventoryEntity } from '@/core/domain/canonical-models';
import { formatINR } from '@/lib/formatters';

export type ResolutionResult<T> = 
  | { status: 'EXACT'; data: T }
  | { status: 'AMBIGUOUS'; matches: string[] }
  | { status: 'NOT_FOUND' };

export class AssistantBusinessService {

  // ─── CUSTOMER OUTSTANDING ──────────────────────────────────────────────
  async getCustomerOutstanding(customerQuery: string): Promise<ResolutionResult<OutstandingEntity>> {
    const allOutstandings = await outstandingRepository.list();
    const q = customerQuery.toLowerCase().trim();
    const matches = allOutstandings.filter(o => o.businessName.toLowerCase().includes(q));
    if (matches.length === 0) return { status: 'NOT_FOUND' };
    if (matches.length === 1) return { status: 'EXACT', data: matches[0] };
    const exactMatch = matches.find(o => o.businessName.toLowerCase() === q);
    if (exactMatch) return { status: 'EXACT', data: exactMatch };
    return { status: 'AMBIGUOUS', matches: matches.map(m => m.businessName) };
  }

  // ─── ALL OUTSTANDING SUMMARY ────────────────────────────────────────────
  async getAllOutstandingSummary(): Promise<{
    total: number;
    totalAmount: number;
    highRisk: OutstandingEntity[];
    mediumRisk: OutstandingEntity[];
    topDebtors: OutstandingEntity[];
  }> {
    const all = await outstandingRepository.list();
    const positive = all.filter(o => o.totalOutstanding > 0 && !o.isInternalAdjustment);
    const totalAmount = positive.reduce((s, o) => s + o.totalOutstanding, 0);
    const highRisk = positive.filter(o => o.riskLevel === 'HIGH' || o.riskLevel === 'CRITICAL');
    const mediumRisk = positive.filter(o => o.riskLevel === 'MEDIUM');
    const topDebtors = [...positive].sort((a, b) => b.totalOutstanding - a.totalOutstanding).slice(0, 5);
    return { total: positive.length, totalAmount, highRisk, mediumRisk, topDebtors };
  }

  // ─── OVERDUE / PENDING OUTSTANDING ─────────────────────────────────────
  async getOverdueOutstanding(): Promise<OutstandingEntity[]> {
    const all = await outstandingRepository.list();
    return all
      .filter(o => o.totalOutstanding > 0 && !o.isInternalAdjustment && (o.bucket61_90 > 0 || o.bucket90Plus > 0))
      .sort((a, b) => b.totalOutstanding - a.totalOutstanding);
  }

  // ─── CLOSING STOCK ──────────────────────────────────────────────────────
  async getClosingStock(productQuery: string): Promise<ResolutionResult<InventoryEntity>> {
    const allStock = await inventoryRepository.list();
    const q = productQuery.toLowerCase().trim();
    const matches = allStock.filter(i =>
      i.productName.toLowerCase().includes(q) ||
      (i.manufacturer && i.manufacturer.toLowerCase().includes(q))
    );
    if (matches.length === 0) return { status: 'NOT_FOUND' };
    if (matches.length === 1) return { status: 'EXACT', data: matches[0] };
    const exactMatch = matches.find(o => o.productName.toLowerCase() === q);
    if (exactMatch) return { status: 'EXACT', data: exactMatch };
    return { status: 'AMBIGUOUS', matches: matches.map(m => m.productName) };
  }

  // ─── LOW STOCK ──────────────────────────────────────────────────────────
  async getLowStockItems(): Promise<InventoryEntity[]> {
    const all = await inventoryRepository.list({ lowStockOnly: true });
    return all.sort((a, b) => a.quantityOnHand - b.quantityOnHand).slice(0, 10);
  }

  // ─── SALES BY DATE ──────────────────────────────────────────────────────
  async getSalesByDate(dateStr: string): Promise<{
    status: 'FOUND' | 'NOT_FOUND';
    totalAmount: number;
    transactionCount: number;
    customers: string[];
    transactions: TransactionEntity[];
  }> {
    const allTxsResult = await transactionRepository.list();
    const allTxs = allTxsResult.items;
    const sales = allTxs.filter(tx => tx.type === 'sale' && tx.date.startsWith(dateStr));
    if (sales.length === 0) return { status: 'NOT_FOUND', totalAmount: 0, transactionCount: 0, customers: [], transactions: [] };
    const totalAmount = sales.reduce((sum, tx) => sum + (tx.netAmount || 0), 0);
    const customers = Array.from(new Set(sales.map(tx => tx.partyName)));
    return { status: 'FOUND', totalAmount, transactionCount: sales.length, customers, transactions: sales };
  }

  // ─── MONTHLY SALES SUMMARY ──────────────────────────────────────────────
  async getMonthlySalesSummary(year: number, month: number): Promise<{
    totalAmount: number;
    transactionCount: number;
    topCustomers: { name: string; amount: number }[];
  }> {
    const prefix = `${year}-${String(month).padStart(2, '0')}`;
    const allTxsResult = await transactionRepository.list();
    const sales = allTxsResult.items.filter(tx => tx.type === 'sale' && tx.date.startsWith(prefix));
    const totalAmount = sales.reduce((sum, tx) => sum + (tx.netAmount || 0), 0);
    const byCustomer: Record<string, number> = {};
    sales.forEach(tx => {
      byCustomer[tx.partyName] = (byCustomer[tx.partyName] || 0) + (tx.netAmount || 0);
    });
    const topCustomers = Object.entries(byCustomer)
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);
    return { totalAmount, transactionCount: sales.length, topCustomers };
  }

  // ─── CUSTOMER SALES HISTORY ─────────────────────────────────────────────
  async getCustomerSales(customerQuery: string, limit = 10): Promise<{
    status: 'FOUND' | 'AMBIGUOUS' | 'NOT_FOUND';
    customerName?: string;
    matches?: string[];
    transactions?: TransactionEntity[];
    totalAmount?: number;
  }> {
    const allTxsResult = await transactionRepository.list();
    const q = customerQuery.toLowerCase().trim();
    const sales = allTxsResult.items.filter(tx =>
      tx.type === 'sale' && tx.partyName.toLowerCase().includes(q)
    );
    if (sales.length === 0) return { status: 'NOT_FOUND' };
    const names = Array.from(new Set(sales.map(t => t.partyName)));
    if (names.length > 1) {
      const exactName = names.find(n => n.toLowerCase() === q);
      if (!exactName) return { status: 'AMBIGUOUS', matches: names.slice(0, 5) };
    }
    const customerName = names.find(n => n.toLowerCase() === q) || names[0];
    const customerSales = sales.filter(t => t.partyName === customerName)
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, limit);
    const totalAmount = customerSales.reduce((s, t) => s + (t.netAmount || 0), 0);
    return { status: 'FOUND', customerName, transactions: customerSales, totalAmount };
  }

  // ─── BUILD PAYMENT ADVICE CONTEXT ──────────────────────────────────────
  // Returns a structured text summary of overdue customers for the LLM to use
  async buildPaymentAdviceContext(): Promise<string> {
    const overdue = await this.getOverdueOutstanding();
    if (overdue.length === 0) return 'No overdue outstanding balances found.';
    const lines = overdue.slice(0, 8).map(o =>
      `- ${o.businessName}: Total ${formatINR(o.totalOutstanding)} (61-90 days: ${formatINR(o.bucket61_90)}, 90+ days: ${formatINR(o.bucket90Plus)}, Risk: ${o.riskLevel})`
    );
    return `Overdue Customers:\n${lines.join('\n')}\n\nTotal overdue accounts: ${overdue.length}`;
  }
  // ─── FULL PAYMENT COLLECTION PLAN ──────────────────────────────────────
  // 100% deterministic. Every statement comes from ledger data. No guessing.
  async getPaymentCollectionPlan(): Promise<{
    asOf: string;
    totalCustomersWithBalance: number;
    totalOutstandingAmount: number;
    tier1_critical: { customers: OutstandingEntity[]; totalAmount: number; count: number }; // 90+ days
    tier2_urgent:   { customers: OutstandingEntity[]; totalAmount: number; count: number }; // 61-90 days
    tier3_moderate: { customers: OutstandingEntity[]; totalAmount: number; count: number }; // 31-60 days
    tier4_fresh:    { customers: OutstandingEntity[]; totalAmount: number; count: number }; // 0-30 days
    creditAccounts: { customers: OutstandingEntity[]; totalAmount: number; count: number }; // negative (advance)
  }> {
    const all = await outstandingRepository.list();
    const withBalance = all.filter(o => !o.isInternalAdjustment);

    const tier1 = withBalance.filter(o => o.bucket90Plus > 0).sort((a, b) => b.bucket90Plus - a.bucket90Plus);
    const tier2 = withBalance.filter(o => o.bucket90Plus === 0 && o.bucket61_90 > 0).sort((a, b) => b.bucket61_90 - a.bucket61_90);
    const tier3 = withBalance.filter(o => o.bucket90Plus === 0 && o.bucket61_90 === 0 && (o.bucket31_60 > 0 || (o.bucket30_45 && o.bucket30_45 > 0))).sort((a, b) => b.totalOutstanding - a.totalOutstanding);
    const tier4 = withBalance.filter(o => o.totalOutstanding > 0 && o.bucket90Plus === 0 && o.bucket61_90 === 0 && (o.bucket31_60 || 0) === 0).sort((a, b) => b.totalOutstanding - a.totalOutstanding);
    const credits = withBalance.filter(o => o.totalOutstanding < 0);

    const sum = (arr: OutstandingEntity[]) => arr.reduce((s, o) => s + o.totalOutstanding, 0);
    const positiveWithBalance = withBalance.filter(o => o.totalOutstanding > 0);

    return {
      asOf: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }),
      totalCustomersWithBalance: positiveWithBalance.length,
      totalOutstandingAmount: sum(positiveWithBalance),
      tier1_critical: { customers: tier1, totalAmount: sum(tier1), count: tier1.length },
      tier2_urgent:   { customers: tier2, totalAmount: sum(tier2), count: tier2.length },
      tier3_moderate: { customers: tier3, totalAmount: sum(tier3), count: tier3.length },
      tier4_fresh:    { customers: tier4, totalAmount: sum(tier4), count: tier4.length },
      creditAccounts: { customers: credits, totalAmount: Math.abs(sum(credits)), count: credits.length },
    };
  }
}

export const assistantBusinessService = new AssistantBusinessService();
