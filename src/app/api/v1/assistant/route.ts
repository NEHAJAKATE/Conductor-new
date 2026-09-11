import { NextRequest, NextResponse } from 'next/server';
import { assistantBusinessService } from '@/core/assistant/assistant-business.service';
import { formatINR } from '@/lib/formatters';

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://127.0.0.1:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3';

// ─── System Prompt for Intent Extraction ─────────────────────────────────────
function buildSystemPrompt(): string {
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];
  const month = today.getMonth() + 1;
  const year = today.getFullYear();

  return `You are a strict JSON-only Intent and Entity extraction engine for ATC, a pharmaceutical wholesale business.

Analyze the user's query and return ONLY a valid JSON object. No markdown, no explanation, just JSON.

INTENT LIST (pick exactly ONE):
- CUSTOMER_OUTSTANDING: Outstanding balance of a specific customer (e.g. "what does Sharma owe", "outstanding of ABC Pharma")
- ALL_OUTSTANDING: All pending/overdue outstanding summary (e.g. "which ledger is pending", "show all outstanding", "who owes us money", "pending payments")
- OVERDUE_OUTSTANDING: Specifically overdue/late payments (e.g. "overdue accounts", "late payments", "which accounts are overdue")
- STOCK_DETAIL: Stock of a specific product (e.g. "closing stock of Crocin", "how much Dolo do we have")
- LOW_STOCK: Products with low stock (e.g. "which products are low", "what needs restocking", "out of stock items")
- SALES_BY_DATE: Who bought on a specific date (e.g. "who bought yesterday", "sales on 10 Sept", "today's customers")
- MONTHLY_SALES: Monthly sales summary (e.g. "this month's sales", "September sales", "monthly performance")
- CUSTOMER_SALES: Sales history of a specific customer (e.g. "what did ABC buy", "purchases by Sharma Pharma")
- PURCHASE_SUMMARY: Summary of all purchases/procurement done (e.g. "all purchases till now", "total procurement", "what did we buy", "purchase summary", "supplier purchases", "how much did we purchase")
- PAYMENT_ADVICE: How to collect payment / payment strategy (e.g. "how to ask for payment", "payment collection strategy", "how to follow up")
- BUSINESS_ADVICE: General business guidance (e.g. "what should I reorder", "how to improve sales")
- UNKNOWN: Cannot determine intent

ENTITY EXTRACTION RULES:
- customerName: Extract the customer/party name if mentioned, else null
- productName: Extract the product name if mentioned, else null
- dateStr: Resolve date references to YYYY-MM-DD format. Today=${todayStr}, Yesterday=${yesterdayStr}
- month: If a month is mentioned, return as number (1-12), else ${month}
- year: If a year is mentioned, return as number, else ${year}

Return ONLY this JSON structure:
{
  "intent": "INTENT_NAME",
  "entities": {
    "customerName": null,
    "productName": null,
    "dateStr": null,
    "month": ${month},
    "year": ${year}
  },
  "dataRequired": "short_snake_case_name_of_what_data_is_needed",
  "questionSummary": "one line plain English restatement of what the user is asking"
}

For dataRequired, use one of these exact values if applicable:
- outstanding_ledger
- sales_ledger
- purchase_ledger
- inventory_stock
- bank_reconciliation
- customer_profile
- expense_data
- profit_loss
- gst_tax_returns
- staff_hr_payroll
- delivery_logistics
- competitor_pricing
- other`;
}

// ─── Ollama LLM Call ──────────────────────────────────────────────────────────
async function callOllamaForIntent(query: string): Promise<{ intent: string; entities: any }> {
  const res = await fetch(`${OLLAMA_URL}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: OLLAMA_MODEL,
      system: buildSystemPrompt(),
      prompt: `User Query: "${query}"`,
      format: 'json',
      stream: false
    })
  });
  if (!res.ok) throw new Error(`Ollama responded with ${res.status}`);
  const data = await res.json();
  return JSON.parse(data.response);
}

async function callOllamaForAnswer(systemContext: string, userQuery: string): Promise<string> {
  const res = await fetch(`${OLLAMA_URL}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: OLLAMA_MODEL,
      system: `You are Ask Conductor, a business assistant for ATC, a pharmaceutical wholesaler. 
You provide practical, concise, professional business advice in plain English.
Use the provided data context to ground your answer. Be specific, not generic.
Never invent financial numbers. If no data context is provided, give general best-practice advice.`,
      prompt: `Business Context:\n${systemContext}\n\nUser Question: "${userQuery}"\n\nProvide a clear, practical, professional answer in 3-5 sentences.`,
      stream: false
    })
  });
  if (!res.ok) throw new Error(`Ollama responded with ${res.status}`);
  const data = await res.json();
  return data.response?.trim() || 'I was unable to generate a response.';
}

// ─── Main Route ───────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const query = (body.query as string)?.trim();
    if (!query) return NextResponse.json({ error: 'Query is required' }, { status: 400 });

    // Step 1: Extract intent via local LLM
    let parsed: { intent: string; entities: any };
    try {
      parsed = await callOllamaForIntent(query);
    } catch (err: any) {
      console.error('Ollama intent extraction failed:', err);
      return NextResponse.json({
        intent: 'SYSTEM_ERROR',
        status: 'ERROR',
        response: `Could not connect to Local On-Premise AI (Ollama). Please ensure Ollama is running on port 11434 with the ${OLLAMA_MODEL} model installed.\n\nRun: ollama run ${OLLAMA_MODEL}`
      }, { status: 503 });
    }

    const { intent, entities } = parsed;
    const e = entities || {};

    // ── CUSTOMER_OUTSTANDING ─────────────────────────────────────────────
    if (intent === 'CUSTOMER_OUTSTANDING') {
      if (!e.customerName) {
        return NextResponse.json({ intent, status: 'NEEDS_CLARIFICATION', response: 'Please tell me which customer you want to check the outstanding for.' });
      }
      const result = await assistantBusinessService.getCustomerOutstanding(e.customerName);
      if (result.status === 'EXACT') {
        const o = result.data;
        const isCredit = o.totalOutstanding < 0;
        const msg = isCredit
          ? `${o.businessName} has a credit/advance balance of ${formatINR(Math.abs(o.totalOutstanding))}. No outstanding payment is due from them.`
          : `${o.businessName} currently has an outstanding balance of ${formatINR(o.totalOutstanding)}.\n\n📊 Ageing Breakdown:\n• 0-30 days: ${formatINR(o.bucket0_30)}\n• 31-60 days: ${formatINR(o.bucket31_60)}\n• 61-90 days: ${formatINR(o.bucket61_90)}\n• 90+ days: ${formatINR(o.bucket90Plus)}\n\n⚠️ Risk Level: ${o.riskLevel}`;
        return NextResponse.json({ intent, status: 'VERIFIED', response: msg, data: o, source: 'Outstanding Ledger' });
      }
      if (result.status === 'AMBIGUOUS') {
        return NextResponse.json({ intent, status: 'NEEDS_CLARIFICATION', response: `I found multiple customers matching "${e.customerName}". Please clarify:\n${result.matches.slice(0, 5).map((m, i) => `${i + 1}. ${m}`).join('\n')}` });
      }
      return NextResponse.json({ intent, status: 'DATA_UNAVAILABLE', response: `No outstanding record found for "${e.customerName}". They may have zero balance or may not exist in the ledger.` });
    }

    // ── ALL_OUTSTANDING ──────────────────────────────────────────────────
    if (intent === 'ALL_OUTSTANDING') {
      const summary = await assistantBusinessService.getAllOutstandingSummary();
      const topLines = summary.topDebtors.map((d, i) => `${i + 1}. ${d.businessName}: ${formatINR(d.totalOutstanding)}`).join('\n');
      const msg = `📋 Outstanding Summary:\n\n• Total accounts with pending balance: ${summary.total}\n• Total outstanding amount: ${formatINR(summary.totalAmount)}\n• High/Critical risk accounts: ${summary.highRisk.length}\n• Medium risk accounts: ${summary.mediumRisk.length}\n\n🔴 Top 5 Outstanding Accounts:\n${topLines}\n\nFor full details, go to the Outstanding section.`;
      return NextResponse.json({ intent, status: 'VERIFIED', response: msg, data: summary, source: 'Outstanding Ledger' });
    }

    // ── OVERDUE_OUTSTANDING ──────────────────────────────────────────────
    if (intent === 'OVERDUE_OUTSTANDING') {
      const overdue = await assistantBusinessService.getOverdueOutstanding();
      if (overdue.length === 0) {
        return NextResponse.json({ intent, status: 'VERIFIED', response: '✅ Great news! No accounts are currently overdue (beyond 60 days).' });
      }
      const lines = overdue.slice(0, 8).map((o, i) =>
        `${i + 1}. ${o.businessName}: ${formatINR(o.totalOutstanding)} (61-90d: ${formatINR(o.bucket61_90)}, 90+d: ${formatINR(o.bucket90Plus)}) — ${o.riskLevel}`
      ).join('\n');
      const msg = `⚠️ Overdue Accounts (60+ days):\n\n${lines}\n\nTotal overdue accounts: ${overdue.length}\nAction recommended: Prioritize collection for HIGH and CRITICAL risk accounts.`;
      return NextResponse.json({ intent, status: 'VERIFIED', response: msg, data: overdue, source: 'Outstanding Ledger' });
    }

    // ── STOCK_DETAIL ─────────────────────────────────────────────────────
    if (intent === 'STOCK_DETAIL') {
      if (!e.productName) {
        return NextResponse.json({ intent, status: 'NEEDS_CLARIFICATION', response: 'Please tell me which product you want to check the stock for.' });
      }
      const result = await assistantBusinessService.getClosingStock(e.productName);
      if (result.status === 'EXACT') {
        const item = result.data;
        const stockStatus = item.quantityOnHand <= 0 ? '🔴 OUT OF STOCK' : item.quantityOnHand <= (item.reorderLevel || 20) ? '🟡 LOW STOCK' : '🟢 In Stock';
        const msg = `${stockStatus}\n\n📦 ${item.productName}\n• Closing Stock: ${item.quantityOnHand} ${item.packing || item.unit || 'units'}\n• Manufacturer: ${item.manufacturer || 'N/A'}\n• Reorder Level: ${item.reorderLevel || 'Not set'}`;
        return NextResponse.json({ intent, status: 'VERIFIED', response: msg, data: item, source: 'Inventory Ledger' });
      }
      if (result.status === 'AMBIGUOUS') {
        return NextResponse.json({ intent, status: 'NEEDS_CLARIFICATION', response: `I found multiple products matching "${e.productName}". Please clarify:\n${result.matches.slice(0, 5).map((m, i) => `${i + 1}. ${m}`).join('\n')}` });
      }
      return NextResponse.json({ intent, status: 'DATA_UNAVAILABLE', response: `No stock record found for "${e.productName}". Please check the product name and try again.` });
    }

    // ── LOW_STOCK ────────────────────────────────────────────────────────
    if (intent === 'LOW_STOCK') {
      const items = await assistantBusinessService.getLowStockItems();
      if (items.length === 0) {
        return NextResponse.json({ intent, status: 'VERIFIED', response: '✅ All products are currently above their reorder levels. No low stock alerts.' });
      }
      const lines = items.map((i, idx) =>
        `${idx + 1}. ${i.productName}: ${i.quantityOnHand} ${i.packing || i.unit || 'units'} ${i.quantityOnHand <= 0 ? '🔴' : '🟡'}`
      ).join('\n');
      return NextResponse.json({ intent, status: 'VERIFIED', response: `⚠️ Low Stock / Out of Stock Items:\n\n${lines}\n\nPlease review these products and place reorder as needed.`, data: items, source: 'Inventory Ledger' });
    }

    // ── SALES_BY_DATE ────────────────────────────────────────────────────
    if (intent === 'SALES_BY_DATE') {
      if (!e.dateStr) {
        return NextResponse.json({ intent, status: 'NEEDS_CLARIFICATION', response: `Please specify a date (e.g. "today", "yesterday", or a specific date like "10 September").` });
      }
      const result = await assistantBusinessService.getSalesByDate(e.dateStr);
      if (result.status === 'FOUND') {
        const custList = result.customers.slice(0, 8).join(', ');
        const msg = `📅 Sales on ${e.dateStr}:\n\n• Total Sales: ${formatINR(result.totalAmount)}\n• Number of Transactions: ${result.transactionCount}\n• Customers (${result.customers.length}): ${custList}${result.customers.length > 8 ? '...' : ''}`;
        return NextResponse.json({ intent, status: 'VERIFIED', response: msg, data: result, source: 'Sales Ledger' });
      }
      return NextResponse.json({ intent, status: 'DATA_UNAVAILABLE', response: `No sales transactions found for ${e.dateStr}. The business may have been closed or no sales were recorded.` });
    }

    // ── MONTHLY_SALES ────────────────────────────────────────────────────
    if (intent === 'MONTHLY_SALES') {
      try {
        const baseUrl = req.nextUrl.origin;
        const reportRes = await fetch(`${baseUrl}/api/v1/reports?dataset=sales`);
        const report = await reportRes.json();
        const timeSeries: { label: string; value: number; count: number }[] = report.timeSeries || [];
        const kpis: any[] = report.kpis || [];

        if (timeSeries.length === 0) {
          return NextResponse.json({ intent, status: 'DATA_UNAVAILABLE', response: 'No monthly sales data found in the system.' });
        }

        // Find the requested month, or fall back to the latest month that has data
        const requestedLabel = `${e.year || new Date().getFullYear()}-${String(e.month || new Date().getMonth() + 1).padStart(2, '0')}`;
        let target = timeSeries.find(t => t.label === requestedLabel);

        const fallbackNotice = !target
          ? `\n\n⚠️ Note: No data found for ${requestedLabel}. Showing the latest available month instead.`
          : '';

        if (!target) {
          // Use latest month with meaningful data (ignore anomalous future dates)
          const validMonths = timeSeries.filter(t => t.label <= '2026-12' && t.value > 0);
          target = validMonths[validMonths.length - 1];
        }

        if (!target) {
          return NextResponse.json({ intent, status: 'DATA_UNAVAILABLE', response: 'No sales data available.' });
        }

        const monthName = new Date(target.label + '-01').toLocaleString('en-IN', { month: 'long', year: 'numeric' });

        // Get all-time totals from KPIs
        const totalSales = kpis.find((k: any) => k.id === 'total_net_sales');
        const activeCustomers = kpis.find((k: any) => k.id === 'active_customers');

        const msg = `📊 Sales Summary — ${monthName}:\n\n` +
          `• Total Sales: ${formatINR(target.value)}\n` +
          `• Total Transactions: ${target.count.toLocaleString('en-IN')}\n\n` +
          `📈 All-Time Totals:\n` +
          `• Total Net Sales (all months): ${totalSales ? formatINR(totalSales.value) : '—'}\n` +
          `• Active Customers: ${activeCustomers ? activeCustomers.formattedValue : '—'}\n\n` +
          `📅 Available months: ${timeSeries.filter(t => t.label <= '2026-12').map(t => t.label).join(', ')}` +
          fallbackNotice;

        return NextResponse.json({ intent, status: 'VERIFIED', response: msg, data: { target, timeSeries }, source: 'Sales Ledger' });
      } catch (err: any) {
        return NextResponse.json({ intent, status: 'ERROR', response: `Failed to load sales data: ${err.message}` });
      }
    }

    // ── CUSTOMER_SALES ───────────────────────────────────────────────────
    if (intent === 'CUSTOMER_SALES') {
      if (!e.customerName) {
        return NextResponse.json({ intent, status: 'NEEDS_CLARIFICATION', response: 'Please tell me which customer you want to see sales for.' });
      }
      const result = await assistantBusinessService.getCustomerSales(e.customerName);
      if (result.status === 'FOUND' && result.transactions) {
        const lines = result.transactions.slice(0, 5).map(t => `• ${t.date} — Bill ${t.invoiceId}: ${formatINR(t.netAmount)}`).join('\n');
        const msg = `🛒 Recent Purchases by ${result.customerName}:\n\nTotal purchased: ${formatINR(result.totalAmount)}\nTransactions shown: ${result.transactions.length}\n\n${lines}`;
        return NextResponse.json({ intent, status: 'VERIFIED', response: msg, data: result, source: 'Sales Ledger' });
      }
      if (result.status === 'AMBIGUOUS') {
        return NextResponse.json({ intent, status: 'NEEDS_CLARIFICATION', response: `Multiple customers match "${e.customerName}". Please clarify:\n${result.matches!.slice(0, 5).map((m, i) => `${i + 1}. ${m}`).join('\n')}` });
      }
      return NextResponse.json({ intent, status: 'DATA_UNAVAILABLE', response: `No purchase history found for "${e.customerName}".` });
    }

    // ── PURCHASE_SUMMARY ─────────────────────────────────────────────────
    if (intent === 'PURCHASE_SUMMARY') {
      try {
        // Read from the existing canonical purchases report
        const baseUrl = req.nextUrl.origin;
        const reportRes = await fetch(`${baseUrl}/api/v1/reports?dataset=purchases`);
        const report = await reportRes.json();
        const kpis: any[] = report.kpis || [];

        const totalProcurement = kpis.find((k: any) => k.id === 'total_purchase_spend');
        const inputGST = kpis.find((k: any) => k.id === 'input_gst_tax');
        const activeSuppliers = kpis.find((k: any) => k.id === 'active_suppliers');
        const unitsProcured = kpis.find((k: any) => k.id === 'purchased_units');

        const dateRange = report.dateRange || {};
        const from = dateRange.from ? dateRange.from.slice(0, 10) : 'beginning';
        const to = dateRange.to ? dateRange.to.slice(0, 10) : 'now';

        const msg = `📦 Purchase / Procurement Summary (${from} to ${to}):\n\n` +
          `• Total Procurement Value: ${totalProcurement ? formatINR(totalProcurement.value) : '—'}\n` +
          `• Input GST Credit (ITC): ${inputGST ? formatINR(inputGST.value) : '—'}\n` +
          `• Active Suppliers: ${activeSuppliers ? activeSuppliers.formattedValue : '—'}\n` +
          `• Total Units Procured: ${unitsProcured ? unitsProcured.formattedValue : '—'}\n\n` +
          `For supplier-wise and product-wise details, go to the Purchases section.`;

        return NextResponse.json({ intent, status: 'VERIFIED', response: msg, data: kpis, source: 'Purchases Ledger' });
      } catch (err: any) {
        return NextResponse.json({ intent, status: 'ERROR', response: `Failed to load purchase data: ${err.message}` });
      }
    }


    // ── PAYMENT_ADVICE ───────────────────────────────────────────────────
    if (intent === 'PAYMENT_ADVICE') {
      const plan = await assistantBusinessService.getPaymentCollectionPlan();

      const fmtList = (
        customers: any[],
        maxShow: number,
        bucketKey: 'bucket90Plus' | 'bucket61_90' | 'bucket31_60' | 'totalOutstanding'
      ) =>
        customers.slice(0, maxShow).map((o, i) =>
          `   ${i + 1}. ${o.businessName} — Total: ${formatINR(o.totalOutstanding)}  |  Overdue: ${formatINR(o[bucketKey])}`
        ).join('\n');

      let response = `💰 Payment Collection Plan — As of ${plan.asOf}\n`;
      response += `Based on your Conductor Outstanding Ledger (${plan.totalCustomersWithBalance} customers, ${formatINR(plan.totalOutstandingAmount)} total pending)\n`;
      response += `${'─'.repeat(55)}\n\n`;

      // TIER 1 — CRITICAL
      if (plan.tier1_critical.count > 0) {
        response += `🔴 COLLECT TODAY — 90+ Days Overdue\n`;
        response += `   ${plan.tier1_critical.count} customers owe ${formatINR(plan.tier1_critical.totalAmount)} that is more than 3 months old.\n`;
        response += `   ⚡ Action: Call them personally today. Do not give more goods until payment is received.\n\n`;
        response += fmtList(plan.tier1_critical.customers, 5, 'bucket90Plus') + '\n';
        if (plan.tier1_critical.count > 5) response += `   ... and ${plan.tier1_critical.count - 5} more.\n`;
        response += '\n';
      }

      // TIER 2 — URGENT
      if (plan.tier2_urgent.count > 0) {
        response += `🟠 FOLLOW UP THIS WEEK — 61 to 90 Days Overdue\n`;
        response += `   ${plan.tier2_urgent.count} customers owe ${formatINR(plan.tier2_urgent.totalAmount)} that is 2 to 3 months old.\n`;
        response += `   ⚡ Action: Send them the invoice copy on WhatsApp/call. Ask for a specific payment date.\n\n`;
        response += fmtList(plan.tier2_urgent.customers, 5, 'bucket61_90') + '\n';
        if (plan.tier2_urgent.count > 5) response += `   ... and ${plan.tier2_urgent.count - 5} more.\n`;
        response += '\n';
      }

      // TIER 3 — MODERATE
      if (plan.tier3_moderate.count > 0) {
        response += `🟡 REMIND NEXT WEEK — 31 to 60 Days Overdue\n`;
        response += `   ${plan.tier3_moderate.count} customers owe ${formatINR(plan.tier3_moderate.totalAmount)} that is 1 to 2 months old.\n`;
        response += `   ⚡ Action: Send a polite WhatsApp reminder with the bill amount. Keep it friendly.\n\n`;
        response += fmtList(plan.tier3_moderate.customers, 3, 'totalOutstanding') + '\n';
        if (plan.tier3_moderate.count > 3) response += `   ... and ${plan.tier3_moderate.count - 3} more.\n`;
        response += '\n';
      }

      // TIER 4 — FRESH
      if (plan.tier4_fresh.count > 0) {
        response += `🟢 WITHIN PAYMENT TERMS — 0 to 30 Days\n`;
        response += `   ${plan.tier4_fresh.count} customers owe ${formatINR(plan.tier4_fresh.totalAmount)}. These are still within normal credit period.\n`;
        response += `   ⚡ Action: No immediate action needed. Keep record and watch.\n\n`;
      }

      // CREDIT ACCOUNTS
      if (plan.creditAccounts.count > 0) {
        response += `🔵 ADVANCE / CREDIT BALANCE\n`;
        response += `   ${plan.creditAccounts.count} customers have paid in advance — total advance of ${formatINR(plan.creditAccounts.totalAmount)}.\n`;
        response += `   ⚡ This will be adjusted against their next purchase automatically.\n\n`;
      }

      response += `${'─'.repeat(55)}\n`;
      response += `📌 Quick Summary:\n`;
      response += `   • Must collect today (90+ days): ${formatINR(plan.tier1_critical.totalAmount)} from ${plan.tier1_critical.count} customers\n`;
      response += `   • Follow up this week (61-90 days): ${formatINR(plan.tier2_urgent.totalAmount)} from ${plan.tier2_urgent.count} customers\n`;
      response += `   • Total pending: ${formatINR(plan.totalOutstandingAmount)} across ${plan.totalCustomersWithBalance} customers`;

      return NextResponse.json({
        intent,
        status: 'VERIFIED',
        response,
        data: {
          tier1Count: plan.tier1_critical.count,
          tier2Count: plan.tier2_urgent.count,
          tier3Count: plan.tier3_moderate.count,
          totalAmount: plan.totalOutstandingAmount,
        },
        source: 'Outstanding Ledger — 100% Conductor Data'
      });
    }


    // ── BUSINESS_ADVICE / UNKNOWN — Smart Data-Aware Fallback ────────────
    // Conductor data catalogue: what IS and IS NOT tracked
    const CONDUCTOR_DATA_MAP: Record<string, {
      available: boolean;
      label: string;
      section: string;
      note?: string;
    }> = {
      outstanding_ledger:   { available: true,  label: 'Outstanding / Receivables',   section: 'Outstanding section' },
      sales_ledger:         { available: true,  label: 'Sales Transactions',           section: 'Sales section' },
      purchase_ledger:      { available: true,  label: 'Purchase / Procurement',       section: 'Purchases section' },
      inventory_stock:      { available: true,  label: 'Stock & Inventory',            section: 'Stock & Reorder section' },
      bank_reconciliation:  { available: true,  label: 'Bank Reconciliation',          section: 'Bank Reconciliation section' },
      customer_profile:     { available: true,  label: 'Customer / Party Details',     section: 'B2B Directory section' },
      expense_data:         { available: false, label: 'Business Expenses',            section: 'N/A', note: 'Expense tracking is not currently recorded in Conductor. You would need to connect your expense data (petrol, salaries, rent, etc.) through the ERP Sync section.' },
      profit_loss:          { available: false, label: 'Profit & Loss Statement',      section: 'N/A', note: 'Profit & Loss requires both your sales revenue AND your cost/expense data. Currently only sales and procurement are in Conductor — expense data is missing. Connect expense data to unlock P&L.' },
      gst_tax_returns:      { available: false, label: 'GST / Tax Returns',            section: 'N/A', note: 'GST return filing data is not in Conductor. You can export invoice data from the Sales section for your CA or tax software.' },
      staff_hr_payroll:     { available: false, label: 'Staff / HR / Payroll',         section: 'N/A', note: 'Employee and payroll data is not tracked in Conductor.' },
      delivery_logistics:   { available: false, label: 'Delivery & Logistics',         section: 'N/A', note: 'Delivery, dispatch, and logistics data is not currently recorded in Conductor.' },
      competitor_pricing:   { available: false, label: 'Competitor Pricing',           section: 'N/A', note: 'Market or competitor pricing data is external and not available in Conductor.' },
    };

    const dataReq = parsed.dataRequired as string | undefined;
    const questionSummary = parsed.questionSummary as string | undefined;
    const dataInfo = dataReq ? CONDUCTOR_DATA_MAP[dataReq] : undefined;

    // Case A: Data is available in Conductor but question type not yet mapped
    if (dataInfo?.available) {
      return NextResponse.json({
        intent,
        status: 'NEEDS_CLARIFICATION',
        response:
          `📊 Your question is about: "${questionSummary || query}"\n\n` +
          `This relates to: ${dataInfo.label}\n\n` +
          `✅ This data IS available in Conductor (${dataInfo.section}).\n\n` +
          `However, I need a more specific question to give you an exact answer from the data. Try asking:\n` +
          `• A specific customer name (e.g. "outstanding of ABC Pharma")\n` +
          `• A specific product (e.g. "stock of Crocin")\n` +
          `• A specific date or month (e.g. "sales in August")\n\n` +
          `Or go to the ${dataInfo.section} directly in Conductor to see full details.`,
        source: dataInfo.label
      });
    }

    // Case B: Data is NOT available in Conductor — tell user exactly what's missing
    if (dataInfo && !dataInfo.available) {
      return NextResponse.json({
        intent,
        status: 'DATA_UNAVAILABLE',
        response:
          `❌ Cannot Answer: "${questionSummary || query}"\n\n` +
          `To answer this, I need: ${dataInfo.label}\n\n` +
          `⚠️ This data is NOT currently recorded in Conductor:\n` +
          `${dataInfo.note}\n\n` +
          `What IS available in Conductor:\n` +
          `• Outstanding & Receivables\n` +
          `• Sales Transactions\n` +
          `• Purchases & Procurement\n` +
          `• Stock & Inventory\n` +
          `• Bank Reconciliation\n` +
          `• Customer Profiles`,
        source: 'Conductor Data Catalogue'
      });
    }

    // Case C: Completely unknown — tell user what Conductor can and cannot answer
    return NextResponse.json({
      intent,
      status: 'DATA_UNAVAILABLE',
      response:
        `❓ I could not understand what data is needed to answer: "${query}"\n\n` +
        `Ask Conductor can answer questions about:\n` +
        `✅ Outstanding & pending payments (e.g. "who owes us money?")\n` +
        `✅ Stock levels (e.g. "closing stock of Paracetamol")\n` +
        `✅ Sales (e.g. "who bought yesterday?", "this month's sales")\n` +
        `✅ Purchases & procurement (e.g. "total purchase done till now")\n` +
        `✅ Payment collection plan (e.g. "how to collect from overdue customers")\n` +
        `✅ Customer info (e.g. "outstanding of Sakshi Chemist")\n\n` +
        `❌ Cannot answer (data not in Conductor):\n` +
        `• Business expenses / P&L\n` +
        `• Staff or payroll\n` +
        `• GST filing\n` +
        `• Competitor pricing\n\n` +
        `Please rephrase your question or check the relevant section in Conductor directly.`,
      source: 'Conductor Data Catalogue'
    });

  } catch (err: any) {
    console.error('[Assistant API Error]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
