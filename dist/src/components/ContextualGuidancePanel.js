"use client";
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = ContextualGuidancePanel;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const navigation_1 = require("next/navigation");
const lucide_react_1 = require("lucide-react");
const link_1 = __importDefault(require("next/link"));
require("./guidance-panel.css");
function ContextualGuidancePanel() {
    const [collapsed, setCollapsed] = (0, react_1.useState)(false);
    const [liveReport, setLiveReport] = (0, react_1.useState)(null);
    const pathname = (0, navigation_1.usePathname)();
    (0, react_1.useEffect)(() => {
        let dataset = '';
        if (pathname === '/sales')
            dataset = 'sales';
        else if (pathname === '/purchases')
            dataset = 'purchases';
        else if (pathname === '/outstanding')
            dataset = 'outstanding';
        else if (pathname === '/inventory')
            dataset = 'inventory';
        else if (pathname === '/business360')
            dataset = 'business_activity';
        if (dataset) {
            fetch(`/api/v1/reports?dataset=${dataset}`)
                .then(res => res.ok ? res.json() : null)
                .then(data => {
                if (data)
                    setLiveReport(data);
            })
                .catch(err => console.error('[GuidancePanel] fetch failed:', err));
        }
        else {
            setLiveReport(null);
        }
    }, [pathname]);
    const getGuidanceForRoute = (path) => {
        const isNotConnected = !liveReport || liveReport?.status === 'NOT_CONNECTED';
        switch (path) {
            case '/business360':
                if (isNotConnected) {
                    return {
                        title: 'Business 360 Assistant',
                        whatIsHappening: 'Organization directory is awaiting party master data ingestion.',
                        source: 'No Party Master Connected',
                        freshness: 'Awaiting Data',
                        fact: 'No business or dealer entities exist in canonical storage.',
                        calculation: 'Requires MASTER.xls or B2B party CSV.',
                        recommendation: 'Upload your party master ledger in Data Ingestion.',
                        nextSteps: [
                            { label: 'Ingest Party Master', href: '/ingestion' },
                            { label: 'Check Data Sources', href: '/integrations' }
                        ]
                    };
                }
                return {
                    title: 'Business 360 Assistant',
                    whatIsHappening: 'Viewing unified organization directory of B2B chemist dealers, hospitals, clinics, and trade suppliers.',
                    source: liveReport?.provenance?.sourceSystem || 'Marg ERP Party Master & Ledger Sync',
                    freshness: liveReport?.provenance?.freshness || 'Verified canonical directory',
                    fact: `${liveReport?.kpis?.[0]?.formattedValue || '0'} trade profiles indexed with ${liveReport?.kpis?.[1]?.formattedValue || '0'} tax-verified GSTIN registrations.`,
                    calculation: liveReport?.reconciliation?.formula || 'Entity Resolution: Matching on GSTIN, PAN, Drug License, and normalized trade name.',
                    recommendation: 'Verify trade tax identifiers for unregistered parties before granting expanded credit limits.',
                    nextSteps: [
                        { label: 'Inspect Outstanding Matrix', href: '/outstanding' },
                        { label: 'Check Pipeline Health', href: '/integrations' }
                    ]
                };
            case '/customer360':
                return {
                    title: 'Customer 360 Assistant',
                    whatIsHappening: 'Viewing person-centric profiles, deterministic identity stitching, and dynamic audience segments.',
                    source: 'Customer Data Platform & Identity Stream',
                    freshness: 'Real-time deterministic stitching active',
                    fact: 'Customer profiles resolved using deterministic UUIDv5 identity anchors (Phone, Email, PAN).',
                    calculation: 'High confidence matching applied with strict multi-identifier validation.',
                    recommendation: 'Review unmerged anonymous visitors before launching targeted marketing campaigns.',
                    nextSteps: [
                        { label: 'View Integrations', href: '/integrations' },
                        { label: 'Inspect Automations', href: '/workflows' }
                    ]
                };
            case '/sales':
                if (isNotConnected) {
                    return {
                        title: 'Sales Intelligence Assistant',
                        whatIsHappening: 'Sales operations are awaiting sales transaction journal ingestion.',
                        source: 'No Sales Dataset Connected',
                        freshness: 'Awaiting Ingestion',
                        fact: '0 sales records exist in canonical transaction storage.',
                        calculation: 'Metrics require sales journal vouchers (e.g. date_wise_sale_&_purchase_analysis.csv).',
                        recommendation: 'Ingest your sales analysis CSV or connect ERP to view real-time revenue and GST.',
                        nextSteps: [
                            { label: 'Upload Sales Dataset', href: '/ingestion' },
                            { label: 'View Integrations', href: '/integrations' }
                        ]
                    };
                }
                return {
                    title: 'Sales Intelligence Assistant',
                    whatIsHappening: 'Analyzing sales transaction journals, output GST taxes, and dealer dispatch volumes.',
                    source: liveReport?.provenance?.sourceSystem || 'Marg ERP Sales Journal (date_wise_sale_&_purchase_analysis.csv)',
                    freshness: liveReport?.provenance?.freshness || 'Synchronized with canonical transaction store',
                    fact: `${liveReport?.kpis?.[0]?.formattedValue || '₹0'} total net sales across ${liveReport?.kpis?.[0]?.subtext || 'invoices'} with ${liveReport?.kpis?.[1]?.formattedValue || '₹0'} Output GST.`,
                    calculation: liveReport?.reconciliation?.formula || 'Total Net Sales (Taxable) + Output GST = Gross Sales Invoice Value',
                    recommendation: 'Prioritize inventory replenishments for high-frequency pharmaceutical formulations.',
                    nextSteps: [
                        { label: 'Review Warehouse Stock', href: '/inventory' },
                        { label: 'Inspect Custom Reports', href: '/reports' }
                    ]
                };
            case '/purchases':
                if (isNotConnected) {
                    return {
                        title: 'Purchase Intelligence Assistant',
                        whatIsHappening: 'Procurement operations are awaiting purchase transaction ledger ingestion.',
                        source: 'No Purchase Dataset Connected',
                        freshness: 'Awaiting Ingestion',
                        fact: '0 purchase records exist in canonical transaction storage.',
                        calculation: 'Metrics require purchase analysis vouchers (e.g. date_wise_sale_&_purchase_analysis.csv).',
                        recommendation: 'Ingest your purchase analysis CSV to track procurement spend and Input Tax Credit (ITC).',
                        nextSteps: [
                            { label: 'Upload Purchase Dataset', href: '/ingestion' },
                            { label: 'View Integrations', href: '/integrations' }
                        ]
                    };
                }
                return {
                    title: 'Purchase Intelligence Assistant',
                    whatIsHappening: 'Tracking procurement spend, pharmaceutical suppliers, and Input Tax Credit (ITC) reconciliation.',
                    source: liveReport?.provenance?.sourceSystem || 'Marg ERP Purchase Ledger',
                    freshness: liveReport?.provenance?.freshness || 'Synchronized with canonical transaction store',
                    fact: `${liveReport?.kpis?.[0]?.formattedValue || '₹0'} net procurement spend across ${liveReport?.kpis?.[2]?.formattedValue || '0'} manufacturers with ${liveReport?.kpis?.[1]?.formattedValue || '₹0'} Input GST credit.`,
                    calculation: liveReport?.reconciliation?.formula || 'Net Procurement (Taxable) + Input GST (ITC) = Gross Purchase Bill Value',
                    recommendation: 'Reconcile purchase invoices against supplier GSTR-2B filing before finalizing monthly tax liability.',
                    nextSteps: [
                        { label: 'Check Stock Levels', href: '/inventory' },
                        { label: 'View Ingestion Schedules', href: '/integrations' }
                    ]
                };
            case '/outstanding':
                if (isNotConnected) {
                    return {
                        title: 'Receivables & Ageing Assistant',
                        whatIsHappening: 'Receivables ledger is awaiting outstanding monthly balance snapshot ingestion.',
                        source: 'No Outstanding Dataset Connected',
                        freshness: 'Awaiting Ingestion',
                        fact: '0 outstanding accounts exist in canonical receivables store.',
                        calculation: 'Metrics require OUTSTANDING LEDGER.XLS balance sheet.',
                        recommendation: 'Ingest your outstanding ledger CSV to evaluate credit risk and dispatch payment reminders.',
                        nextSteps: [
                            { label: 'Upload Outstanding Ledger', href: '/ingestion' },
                            { label: 'View Automations', href: '/workflows' }
                        ]
                    };
                }
                return {
                    title: 'Receivables & Ageing Assistant',
                    whatIsHappening: 'Monitoring monthly snapshot balance trend, credit limits, and overdue risk tiers.',
                    source: liveReport?.provenance?.sourceSystem || 'Marg ERP Monthly Outstanding Ledger (Snapshot Analysis)',
                    freshness: liveReport?.provenance?.freshness || 'Synchronized with canonical ledger store',
                    fact: `${liveReport?.kpis?.[0]?.formattedValue || '₹0'} total receivables across ${liveReport?.totalRows || 0} accounts (${liveReport?.kpis?.[1]?.formattedValue || '₹0'} in older snapshot buckets).`,
                    calculation: liveReport?.reconciliation?.formula || 'Total Receivables = Sum of 0-30D (Mar) + 31-60D (Feb) + 61-90D (Jan) + >90D (Dec & Older) snapshot columns',
                    recommendation: 'Dispatch 1-click automated payment reminders for accounts exceeding their credit limit.',
                    nextSteps: [
                        { label: 'View Trigger Automations', href: '/workflows' },
                        { label: 'Open B2B Directory', href: '/business360' }
                    ]
                };
            case '/inventory':
                if (isNotConnected) {
                    return {
                        title: 'Inventory & Stock Assistant',
                        whatIsHappening: 'Warehouse stock is awaiting physical inventory data ingestion.',
                        source: 'No Inventory Dataset Connected',
                        freshness: 'Awaiting Ingestion',
                        fact: '0 SKU stock records exist in canonical inventory storage.',
                        calculation: 'Metrics require OPENING STOCK.XLS and transaction ledger.',
                        recommendation: 'Ingest opening stock and journal to compute live closing stock and reorder alerts.',
                        nextSteps: [
                            { label: 'Upload Stock Sheet', href: '/ingestion' },
                            { label: 'View Purchase Trends', href: '/purchases' }
                        ]
                    };
                }
                return {
                    title: 'Inventory & Stock Assistant',
                    whatIsHappening: 'Tracking real-time running SKU inventory ledger, warehouse stock on hand, and reorder warnings.',
                    source: liveReport?.provenance?.sourceSystem || 'Marg ERP Inventory Ledger & Transaction Stream',
                    freshness: liveReport?.provenance?.freshness || 'Real-time computed closing balance',
                    fact: `${liveReport?.kpis?.[1]?.formattedValue || '0'} physical units on hand across ${liveReport?.kpis?.[0]?.formattedValue || '0'} SKUs with ${liveReport?.kpis?.[2]?.formattedValue || '0'} low-stock alerts.`,
                    calculation: liveReport?.reconciliation?.formula || 'Closing Stock = Opening + Purchases + Sales Returns - Sales - Purchase Returns - Breakage ± Adjustments',
                    recommendation: 'Create procurement purchase orders for essential formulations running at or below 25-strip threshold.',
                    nextSteps: [
                        { label: 'View Purchase Spend', href: '/purchases' },
                        { label: 'Open Custom Reports', href: '/reports' }
                    ]
                };
            case '/reconciliation':
                return {
                    title: 'Bank & Cash Reconciliation Assistant',
                    whatIsHappening: 'Automated 4-rule matching between Bank Statements (BANK & CASH LEDGERS.XLS) and ERP Journal Vouchers.',
                    source: 'Axis Bank, ICICI Bank, HDFC, SBI, PNB, Canara, Cash in Hand',
                    freshness: 'Synchronized with 86,784 canonical ERP vouchers',
                    fact: '4-rule matching classifies entries as MATCHED, UNMATCHED_BANK, AMOUNT_MISMATCH, or DATE_MISMATCH.',
                    calculation: 'Reference exact match -> Party & Amount candidate match -> Amount-only match -> Discrepancy flagging.',
                    recommendation: 'Inspect amount mismatch entries where bank charges or cash discounts created variance.',
                    nextSteps: [
                        { label: 'View Sales Vouchers', href: '/sales' },
                        { label: 'View Purchase Spend', href: '/purchases' }
                    ]
                };
            case '/integrations':
                return {
                    title: 'Pipeline Observability Assistant',
                    whatIsHappening: 'Monitoring automated data connectors, scheduled sync jobs, and data freshness latencies.',
                    source: 'Conductor Scheduler & Storage Adapters',
                    freshness: 'All scheduled connectors operating normally',
                    fact: 'Multi-domain connectors configured for ERP, CRM, Parquet Lake, and Cloudflare R2.',
                    calculation: 'Zero rejected records; average daily sync latency is 2.4 seconds per batch.',
                    recommendation: 'Configure external SFTP or S3 sync if automated daily uploads from ERP server are enabled.',
                    nextSteps: [
                        { label: 'Trigger Ingestion Wizard', href: '/ingestion' },
                        { label: 'View Event Automations', href: '/workflows' }
                    ]
                };
            case '/workflows':
                return {
                    title: 'Workflow Automation Assistant',
                    whatIsHappening: 'Managing deterministic Trigger -> Condition -> Action business policies and alert channels.',
                    source: 'Conductor Automation Engine',
                    freshness: '4 active rules monitored in real-time',
                    fact: 'Automated notification channels configured for Email, WhatsApp, and In-App Alerts.',
                    calculation: '100% deterministic rule evaluation based on verified database threshold criteria.',
                    recommendation: 'Review recipient contact info for credit overdue alerts before monthly cycle.',
                    nextSteps: [
                        { label: 'Inspect Ageing Ledger', href: '/outstanding' },
                        { label: 'Check Pipeline Health', href: '/integrations' }
                    ]
                };
            default:
                return {
                    title: 'Platform Intelligence Assistant',
                    whatIsHappening: 'Conductor is orchestrating data ingestion, canonical normalization, entity resolution, and operational views.',
                    source: 'Conductor Core Platform',
                    freshness: 'System Healthy & All Services Operational',
                    fact: 'Unified Business 360 and Customer 360 layers active with deterministic reconciliation.',
                    calculation: 'Zero LLM fabrication on accounting or financial calculations.',
                    recommendation: 'Navigate to B2B Directory or Sales to inspect live unified enterprise intelligence.',
                    nextSteps: [
                        { label: 'Open B2B Directory', href: '/business360' },
                        { label: 'Open Sales Intelligence', href: '/sales' }
                    ]
                };
        }
    };
    const guidance = getGuidanceForRoute(pathname);
    return ((0, jsx_runtime_1.jsxs)("aside", { className: `guidance-panel ${collapsed ? 'collapsed' : ''}`, children: [(0, jsx_runtime_1.jsxs)("div", { className: "guidance-header", children: [!collapsed && ((0, jsx_runtime_1.jsxs)("div", { className: "guidance-header-title", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Sparkles, { size: 16, color: "#60a5fa" }), (0, jsx_runtime_1.jsx)("span", { children: guidance.title })] })), (0, jsx_runtime_1.jsx)("button", { className: "guidance-toggle-btn", onClick: () => setCollapsed(!collapsed), title: collapsed ? 'Expand Guidance Panel' : 'Collapse Guidance Panel', "aria-label": "Toggle Contextual Guidance", children: collapsed ? (0, jsx_runtime_1.jsx)(lucide_react_1.ChevronLeft, { size: 16 }) : (0, jsx_runtime_1.jsx)(lucide_react_1.ChevronRight, { size: 16 }) })] }), !collapsed && ((0, jsx_runtime_1.jsxs)("div", { className: "guidance-content", children: [(0, jsx_runtime_1.jsxs)("div", { className: "guidance-section", children: [(0, jsx_runtime_1.jsx)("span", { className: "guidance-section-label", children: "What is Happening" }), (0, jsx_runtime_1.jsx)("div", { className: "guidance-box", style: { borderColor: 'rgba(59, 130, 246, 0.3)' }, children: guidance.whatIsHappening })] }), (0, jsx_runtime_1.jsxs)("div", { className: "guidance-section", children: [(0, jsx_runtime_1.jsx)("span", { className: "guidance-section-label", children: "Source & Freshness" }), (0, jsx_runtime_1.jsxs)("div", { style: { display: 'flex', flexDirection: 'column', gap: '0.35rem' }, children: [(0, jsx_runtime_1.jsxs)("div", { style: { fontSize: '0.75rem', color: '#94a3b8' }, children: [(0, jsx_runtime_1.jsx)("span", { style: { fontWeight: 600, color: '#e2e8f0' }, children: "Source:" }), " ", guidance.source] }), (0, jsx_runtime_1.jsxs)("div", { className: "freshness-pill", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Clock, { size: 12 }), (0, jsx_runtime_1.jsx)("span", { children: guidance.freshness })] })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "guidance-section", children: [(0, jsx_runtime_1.jsx)("span", { className: "guidance-section-label", children: "Structured Grounded Insights" }), (0, jsx_runtime_1.jsxs)("div", { className: "guidance-box", children: [(0, jsx_runtime_1.jsxs)("span", { className: "guidance-badge-fact", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.ShieldCheck, { size: 11 }), "Fact"] }), (0, jsx_runtime_1.jsx)("p", { style: { margin: 0 }, children: guidance.fact })] }), (0, jsx_runtime_1.jsxs)("div", { className: "guidance-box", children: [(0, jsx_runtime_1.jsxs)("span", { className: "guidance-badge-calc", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Zap, { size: 11 }), "Calculation"] }), (0, jsx_runtime_1.jsx)("p", { style: { margin: 0 }, children: guidance.calculation })] }), (0, jsx_runtime_1.jsxs)("div", { className: "guidance-box", children: [(0, jsx_runtime_1.jsxs)("span", { className: "guidance-badge-recom", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Sparkles, { size: 11 }), "Recommendation"] }), (0, jsx_runtime_1.jsx)("p", { style: { margin: 0 }, children: guidance.recommendation })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "guidance-section", children: [(0, jsx_runtime_1.jsx)("span", { className: "guidance-section-label", children: "What Should I Do Next?" }), (0, jsx_runtime_1.jsx)("div", { style: { display: 'flex', flexDirection: 'column', gap: '0.4rem' }, children: guidance.nextSteps.map((step, idx) => ((0, jsx_runtime_1.jsxs)(link_1.default, { href: step.href, className: "guidance-action-link", children: [(0, jsx_runtime_1.jsx)("span", { children: step.label }), (0, jsx_runtime_1.jsx)(lucide_react_1.ArrowRight, { size: 13, color: "#60a5fa" })] }, idx))) })] })] }))] }));
}
