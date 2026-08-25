"use client";
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = PurchasesPage;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const Sidebar_1 = __importDefault(require("@/components/Sidebar"));
const ThemeToggle_1 = __importDefault(require("@/components/ThemeToggle"));
const ContextualGuidancePanel_1 = __importDefault(require("@/components/ContextualGuidancePanel"));
const lucide_react_1 = require("lucide-react");
require("../dashboard.css");
require("../business-pages.css");
function PurchasesPage() {
    const [report, setReport] = (0, react_1.useState)(null);
    const [loading, setLoading] = (0, react_1.useState)(true);
    const [search, setSearch] = (0, react_1.useState)('');
    const fetchPurchasesReport = async () => {
        try {
            setLoading(true);
            const res = await fetch(`/api/v1/reports?dataset=purchases&search=${encodeURIComponent(search)}`);
            if (res.ok) {
                const data = await res.json();
                setReport(data);
            }
        }
        catch (err) {
            console.error('Failed to fetch purchases report:', err);
        }
        finally {
            setLoading(false);
        }
    };
    (0, react_1.useEffect)(() => {
        fetchPurchasesReport();
    }, []);
    const handleSearchSubmit = (e) => {
        e.preventDefault();
        fetchPurchasesReport();
    };
    return ((0, jsx_runtime_1.jsxs)("div", { className: "dashboard-layout", children: [(0, jsx_runtime_1.jsx)(Sidebar_1.default, {}), (0, jsx_runtime_1.jsxs)("main", { className: "main-content", children: [(0, jsx_runtime_1.jsx)("div", { className: "top-menu", children: (0, jsx_runtime_1.jsx)(ThemeToggle_1.default, {}) }), (0, jsx_runtime_1.jsxs)("div", { className: "business-container", children: [(0, jsx_runtime_1.jsxs)("div", { className: "business-header", children: [(0, jsx_runtime_1.jsxs)("div", { className: "business-title-group", children: [(0, jsx_runtime_1.jsx)("h1", { children: "Purchase Intelligence & Supplier Spend" }), (0, jsx_runtime_1.jsx)("p", { children: "Procurement volumes, Input Tax Credit (ITC) reconciliation, supplier trends, and incoming batch tracking" })] }), (0, jsx_runtime_1.jsxs)("button", { className: "secondary-btn", onClick: fetchPurchasesReport, disabled: loading, children: [(0, jsx_runtime_1.jsx)(lucide_react_1.RefreshCw, { size: 15, className: loading ? 'animate-spin' : '' }), (0, jsx_runtime_1.jsx)("span", { children: "Refresh" })] })] }), report && report.kpis && ((0, jsx_runtime_1.jsx)("div", { className: "kpi-grid", children: report.kpis.map((kpi) => ((0, jsx_runtime_1.jsxs)("div", { className: "kpi-card", children: [(0, jsx_runtime_1.jsxs)("div", { className: "kpi-header", children: [(0, jsx_runtime_1.jsx)("span", { children: kpi.label }), (0, jsx_runtime_1.jsx)(lucide_react_1.ShoppingBag, { size: 16 })] }), (0, jsx_runtime_1.jsx)("div", { className: "kpi-value", children: kpi.formattedValue }), (0, jsx_runtime_1.jsx)("div", { className: "kpi-subtext", children: kpi.subtext })] }, kpi.id))) })), (0, jsx_runtime_1.jsxs)("div", { className: "action-bar", children: [(0, jsx_runtime_1.jsxs)("form", { onSubmit: handleSearchSubmit, className: "search-input-group", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Search, { size: 16, color: "#64748b" }), (0, jsx_runtime_1.jsx)("input", { type: "text", placeholder: "Search by supplier name, invoice voucher, product...", value: search, onChange: e => setSearch(e.target.value) })] }), (0, jsx_runtime_1.jsx)("button", { className: "primary-btn", onClick: fetchPurchasesReport, children: "Search" })] }), report?.status === 'NOT_CONNECTED' ? ((0, jsx_runtime_1.jsxs)("div", { style: {
                                    background: '#090d16',
                                    border: '1px solid #1e293b',
                                    borderRadius: '12px',
                                    padding: '3rem 2rem',
                                    textAlign: 'center',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    gap: '1rem',
                                    margin: '1.5rem 0'
                                }, children: [(0, jsx_runtime_1.jsx)(lucide_react_1.ShoppingBag, { size: 42, color: "#64748b" }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("h3", { style: { margin: '0 0 0.5rem 0', color: '#f8fafc', fontSize: '1.15rem' }, children: "Purchase Dataset Not Connected" }), (0, jsx_runtime_1.jsx)("p", { style: { margin: 0, color: '#94a3b8', maxWidth: '540px', fontSize: '0.875rem', lineHeight: 1.5 }, children: "No ERP purchase journal or supplier invoices have been ingested yet. Ingest your purchase analysis CSV or connect your ERP source to view procurement spend and Input Tax Credit (ITC)." })] }), (0, jsx_runtime_1.jsx)("a", { href: "/ingestion", className: "primary-btn", style: { textDecoration: 'none', marginTop: '0.5rem' }, children: (0, jsx_runtime_1.jsx)("span", { children: "Connect Purchase Data" }) })] })) : ((0, jsx_runtime_1.jsx)("div", { className: "data-table-container", children: (0, jsx_runtime_1.jsxs)("table", { className: "data-table", children: [(0, jsx_runtime_1.jsx)("thead", { children: (0, jsx_runtime_1.jsxs)("tr", { children: [(0, jsx_runtime_1.jsx)("th", { children: "Supplier / Creditor" }), (0, jsx_runtime_1.jsx)("th", { children: "Net Procurement Spend (\u20B9)" }), (0, jsx_runtime_1.jsx)("th", { children: "Input GST ITC (\u20B9)" }), (0, jsx_runtime_1.jsx)("th", { children: "Gross Bill Amount (\u20B9)" }), (0, jsx_runtime_1.jsx)("th", { children: "Units Procured" }), (0, jsx_runtime_1.jsx)("th", { children: "Purchase Invoices" })] }) }), (0, jsx_runtime_1.jsx)("tbody", { children: loading ? ((0, jsx_runtime_1.jsx)("tr", { children: (0, jsx_runtime_1.jsx)("td", { colSpan: 6, style: { textAlign: 'center', padding: '2rem', color: '#94a3b8' }, children: "Loading purchase intelligence..." }) })) : !report || report.rows.length === 0 ? ((0, jsx_runtime_1.jsx)("tr", { children: (0, jsx_runtime_1.jsx)("td", { colSpan: 6, style: { textAlign: 'center', padding: '2rem', color: '#94a3b8' }, children: "No purchase records found matching filter." }) })) : (report.rows.map((row, i) => ((0, jsx_runtime_1.jsxs)("tr", { children: [(0, jsx_runtime_1.jsx)("td", { style: { fontWeight: 600, color: '#f8fafc' }, children: row.dimension }), (0, jsx_runtime_1.jsxs)("td", { style: { fontWeight: 600, color: '#fbbf24' }, children: ["\u20B9", row.spend.toLocaleString()] }), (0, jsx_runtime_1.jsxs)("td", { style: { color: '#94a3b8' }, children: ["\u20B9", row.tax.toLocaleString()] }), (0, jsx_runtime_1.jsxs)("td", { style: { fontWeight: 600, color: '#f8fafc' }, children: ["\u20B9", row.gross.toLocaleString()] }), (0, jsx_runtime_1.jsx)("td", { children: row.units.toLocaleString() }), (0, jsx_runtime_1.jsx)("td", { children: (0, jsx_runtime_1.jsx)("span", { className: "badge badge-neutral", children: row.invoices }) })] }, i)))) })] }) }))] })] }), (0, jsx_runtime_1.jsx)(ContextualGuidancePanel_1.default, {})] }));
}
