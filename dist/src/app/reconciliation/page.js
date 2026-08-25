"use client";
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = ReconciliationPage;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const Sidebar_1 = __importDefault(require("@/components/Sidebar"));
const ThemeToggle_1 = __importDefault(require("@/components/ThemeToggle"));
const ContextualGuidancePanel_1 = __importDefault(require("@/components/ContextualGuidancePanel"));
const lucide_react_1 = require("lucide-react");
require("../dashboard.css");
require("../business-pages.css");
function ReconciliationPage() {
    const [data, setData] = (0, react_1.useState)(null);
    const [loading, setLoading] = (0, react_1.useState)(true);
    const [filterStatus, setFilterStatus] = (0, react_1.useState)('ALL');
    const [search, setSearch] = (0, react_1.useState)('');
    const [error, setError] = (0, react_1.useState)(null);
    const fetchReconciliation = async () => {
        try {
            setLoading(true);
            setError(null);
            const token = typeof window !== 'undefined' ? localStorage.getItem('conductor_session_token') : null;
            const res = await fetch('/api/v1/reconciliation', {
                headers: {
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
                },
            });
            if (res.status === 403 || res.status === 401) {
                setError('Access Denied (403 Forbidden): Valid Owner credentials required to access Bank Reconciliation. Please log in with Owner credentials.');
                setData(null);
                return;
            }
            if (res.ok) {
                const result = await res.json();
                setData(result);
            }
            else {
                const err = await res.json();
                setError(err.message || 'Failed to load bank reconciliation');
            }
        }
        catch (err) {
            setError(err.message);
        }
        finally {
            setLoading(false);
        }
    };
    (0, react_1.useEffect)(() => {
        fetchReconciliation();
        window.addEventListener('role_changed', fetchReconciliation);
        return () => {
            window.removeEventListener('role_changed', fetchReconciliation);
        };
    }, []);
    const getFilteredItems = () => {
        if (!data || !data.items)
            return [];
        return data.items.filter((item) => {
            if (filterStatus !== 'ALL' && item.matchStatus !== filterStatus)
                return false;
            if (search) {
                const q = search.toLowerCase();
                const part = item.bankRow?.particulars?.toLowerCase() || '';
                const acct = item.bankRow?.bankAccount?.toLowerCase() || '';
                const vcn = item.matchedTransaction?.invoiceId?.toLowerCase() || '';
                const party = item.matchedTransaction?.partyName?.toLowerCase() || '';
                return part.includes(q) || acct.includes(q) || vcn.includes(q) || party.includes(q);
            }
            return true;
        });
    };
    const filteredItems = getFilteredItems();
    return ((0, jsx_runtime_1.jsxs)("div", { className: "dashboard-layout", children: [(0, jsx_runtime_1.jsx)(Sidebar_1.default, {}), (0, jsx_runtime_1.jsxs)("main", { className: "main-content", children: [(0, jsx_runtime_1.jsx)("div", { className: "top-menu", children: (0, jsx_runtime_1.jsx)(ThemeToggle_1.default, {}) }), (0, jsx_runtime_1.jsxs)("div", { className: "business-container", children: [(0, jsx_runtime_1.jsxs)("div", { className: "business-header", children: [(0, jsx_runtime_1.jsxs)("div", { className: "business-title-group", children: [(0, jsx_runtime_1.jsx)("h1", { children: "Bank & Cash Ledger Reconciliation" }), (0, jsx_runtime_1.jsx)("p", { children: "Automated 4-rule matching between Bank Statements (BANK & CASH LEDGERS) and ERP Vouchers & Journal Invoices" })] }), (0, jsx_runtime_1.jsx)("div", { style: { display: 'flex', gap: '0.5rem' }, children: (0, jsx_runtime_1.jsxs)("button", { className: "secondary-btn", onClick: fetchReconciliation, disabled: loading, children: [(0, jsx_runtime_1.jsx)(lucide_react_1.RefreshCw, { size: 15, className: loading ? 'animate-spin' : '' }), (0, jsx_runtime_1.jsx)("span", { children: "Reconcile Now" })] }) })] }), error && ((0, jsx_runtime_1.jsxs)("div", { style: {
                                    background: 'rgba(239, 68, 68, 0.1)',
                                    border: '1px solid rgba(239, 68, 68, 0.3)',
                                    borderRadius: '8px',
                                    padding: '1.2rem',
                                    color: '#f87171',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.8rem',
                                    marginBottom: '1.5rem',
                                }, children: [(0, jsx_runtime_1.jsx)(lucide_react_1.ShieldAlert, { size: 24 }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("strong", { children: "Authorization Notice" }), (0, jsx_runtime_1.jsx)("p", { style: { margin: 0, fontSize: '0.9rem' }, children: error })] })] })), data && ((0, jsx_runtime_1.jsxs)("div", { className: "kpi-grid", children: [(0, jsx_runtime_1.jsxs)("div", { className: "kpi-card", children: [(0, jsx_runtime_1.jsxs)("div", { className: "kpi-header", children: [(0, jsx_runtime_1.jsx)("span", { children: "Total Bank Lines" }), (0, jsx_runtime_1.jsx)(lucide_react_1.Layers, { size: 16 })] }), (0, jsx_runtime_1.jsx)("div", { className: "kpi-value", children: data.totalBankEntries?.toLocaleString() }), (0, jsx_runtime_1.jsx)("div", { className: "kpi-subtext", children: "Across 7 Bank & Cash Ledgers" })] }), (0, jsx_runtime_1.jsxs)("div", { className: "kpi-card", children: [(0, jsx_runtime_1.jsxs)("div", { className: "kpi-header", children: [(0, jsx_runtime_1.jsx)("span", { children: "Matched Entries" }), (0, jsx_runtime_1.jsx)(lucide_react_1.CheckCircle2, { size: 16, color: "#34d399" })] }), (0, jsx_runtime_1.jsx)("div", { className: "kpi-value", style: { color: '#34d399' }, children: data.matchedCount?.toLocaleString() }), (0, jsx_runtime_1.jsxs)("div", { className: "kpi-subtext", children: ["\u20B9", (data.matchedAmount / 100000).toFixed(2), " Lakh verified"] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "kpi-card", children: [(0, jsx_runtime_1.jsxs)("div", { className: "kpi-header", children: [(0, jsx_runtime_1.jsx)("span", { children: "Unmatched Bank Lines" }), (0, jsx_runtime_1.jsx)(lucide_react_1.HelpCircle, { size: 16, color: "#fbbf24" })] }), (0, jsx_runtime_1.jsx)("div", { className: "kpi-value", style: { color: '#fbbf24' }, children: data.unmatchedCount?.toLocaleString() }), (0, jsx_runtime_1.jsxs)("div", { className: "kpi-subtext", children: ["\u20B9", (data.unmatchedAmount / 100000).toFixed(2), " Lakh unlinked"] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "kpi-card", children: [(0, jsx_runtime_1.jsxs)("div", { className: "kpi-header", children: [(0, jsx_runtime_1.jsx)("span", { children: "Amount Mismatches" }), (0, jsx_runtime_1.jsx)(lucide_react_1.AlertTriangle, { size: 16, color: "#f87171" })] }), (0, jsx_runtime_1.jsx)("div", { className: "kpi-value", style: { color: '#f87171' }, children: data.mismatchCount?.toLocaleString() }), (0, jsx_runtime_1.jsxs)("div", { className: "kpi-subtext", children: ["\u20B9", (data.mismatchAmount / 100000).toFixed(2), " Lakh variance"] })] })] })), (0, jsx_runtime_1.jsxs)("div", { className: "action-bar", children: [(0, jsx_runtime_1.jsxs)("div", { className: "filter-group", children: [(0, jsx_runtime_1.jsx)("label", { style: { fontSize: '0.85rem', color: '#94a3b8' }, children: "Status:" }), (0, jsx_runtime_1.jsxs)("select", { className: "filter-select", value: filterStatus, onChange: e => setFilterStatus(e.target.value), children: [(0, jsx_runtime_1.jsx)("option", { value: "ALL", children: "All Reconciled Items" }), (0, jsx_runtime_1.jsx)("option", { value: "MATCHED", children: "Matched Only" }), (0, jsx_runtime_1.jsx)("option", { value: "UNMATCHED_BANK", children: "Unmatched Only" }), (0, jsx_runtime_1.jsx)("option", { value: "AMOUNT_MISMATCH", children: "Amount Mismatch" })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "search-input-group", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Search, { size: 16, color: "#94a3b8" }), (0, jsx_runtime_1.jsx)("input", { type: "text", placeholder: "Search by bank, voucher, party...", value: search, onChange: e => setSearch(e.target.value) })] })] }), (0, jsx_runtime_1.jsx)("div", { className: "data-table-container", children: (0, jsx_runtime_1.jsxs)("table", { className: "data-table", children: [(0, jsx_runtime_1.jsx)("thead", { children: (0, jsx_runtime_1.jsxs)("tr", { children: [(0, jsx_runtime_1.jsx)("th", { children: "Bank Account & Date" }), (0, jsx_runtime_1.jsx)("th", { children: "Particulars / Cheque" }), (0, jsx_runtime_1.jsx)("th", { children: "Bank Amount (\u20B9)" }), (0, jsx_runtime_1.jsx)("th", { children: "Status" }), (0, jsx_runtime_1.jsx)("th", { children: "Matched ERP Transaction" }), (0, jsx_runtime_1.jsx)("th", { children: "Variance" }), (0, jsx_runtime_1.jsx)("th", { children: "Confidence & Notes" })] }) }), (0, jsx_runtime_1.jsx)("tbody", { children: loading ? ((0, jsx_runtime_1.jsx)("tr", { children: (0, jsx_runtime_1.jsx)("td", { colSpan: 7, style: { textAlign: 'center', padding: '2rem', color: '#94a3b8' }, children: "Executing automated 4-rule reconciliation matching engine..." }) })) : filteredItems.length === 0 ? ((0, jsx_runtime_1.jsx)("tr", { children: (0, jsx_runtime_1.jsx)("td", { colSpan: 7, style: { textAlign: 'center', padding: '2rem', color: '#94a3b8' }, children: "No bank reconciliation records found." }) })) : (filteredItems.slice(0, 50).map((item, i) => {
                                                const statusClass = item.matchStatus === 'MATCHED' ? 'badge-success' :
                                                    item.matchStatus === 'AMOUNT_MISMATCH' ? 'badge-danger' :
                                                        item.matchStatus === 'DATE_MISMATCH' ? 'badge-warning' : 'badge-neutral';
                                                return ((0, jsx_runtime_1.jsxs)("tr", { children: [(0, jsx_runtime_1.jsxs)("td", { children: [(0, jsx_runtime_1.jsx)("div", { style: { fontWeight: 600, color: '#f8fafc' }, children: item.bankRow?.bankAccount }), (0, jsx_runtime_1.jsx)("div", { style: { fontSize: '0.75rem', color: '#94a3b8' }, children: item.bankRow?.date?.substring(0, 10) })] }), (0, jsx_runtime_1.jsx)("td", { style: { maxWidth: '280px', fontSize: '0.8rem', color: '#cbd5e1' }, children: item.bankRow?.particulars }), (0, jsx_runtime_1.jsxs)("td", { style: { fontWeight: 600, color: item.bankRow?.type === 'RECEIPT' ? '#34d399' : '#f87171' }, children: ["\u20B9", item.bankRow?.amount?.toLocaleString(), " (", item.bankRow?.type, ")"] }), (0, jsx_runtime_1.jsx)("td", { children: (0, jsx_runtime_1.jsx)("span", { className: `badge ${statusClass}`, children: item.matchStatus }) }), (0, jsx_runtime_1.jsx)("td", { children: item.matchedTransaction ? ((0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsxs)("div", { style: { fontWeight: 600, color: '#60a5fa' }, children: ["Voucher #", item.matchedTransaction.invoiceId] }), (0, jsx_runtime_1.jsxs)("div", { style: { fontSize: '0.75rem', color: '#94a3b8' }, children: [item.matchedTransaction.partyName, " (\u20B9", item.matchedTransaction.grossAmount?.toLocaleString(), ")"] })] })) : ((0, jsx_runtime_1.jsx)("span", { style: { color: '#64748b', fontSize: '0.8rem' }, children: "No ERP Match" })) }), (0, jsx_runtime_1.jsx)("td", { style: { fontWeight: 600, color: item.variance !== 0 ? '#f87171' : '#94a3b8' }, children: item.variance !== 0 ? `₹${Math.abs(item.variance).toLocaleString()}` : '₹0.00' }), (0, jsx_runtime_1.jsxs)("td", { style: { fontSize: '0.75rem', color: '#94a3b8', maxWidth: '250px' }, children: [(0, jsx_runtime_1.jsxs)("div", { children: ["Confidence: ", item.matchConfidence, "%"] }), (0, jsx_runtime_1.jsx)("div", { children: item.notes })] })] }, i));
                                            })) })] }) })] })] }), (0, jsx_runtime_1.jsx)(ContextualGuidancePanel_1.default, {})] }));
}
