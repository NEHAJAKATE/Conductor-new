"use client";
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = InventoryPage;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const Sidebar_1 = __importDefault(require("@/components/Sidebar"));
const ThemeToggle_1 = __importDefault(require("@/components/ThemeToggle"));
const ContextualGuidancePanel_1 = __importDefault(require("@/components/ContextualGuidancePanel"));
const lucide_react_1 = require("lucide-react");
require("../dashboard.css");
require("../business-pages.css");
function InventoryPage() {
    const [report, setReport] = (0, react_1.useState)(null);
    const [loading, setLoading] = (0, react_1.useState)(true);
    const [search, setSearch] = (0, react_1.useState)('');
    const [toastMessage, setToastMessage] = (0, react_1.useState)(null);
    // Reorder Recommendation Modal State
    const [activeReorderItem, setActiveReorderItem] = (0, react_1.useState)(null);
    const [orderQuantity, setOrderQuantity] = (0, react_1.useState)(30);
    const [targetSupplier, setTargetSupplier] = (0, react_1.useState)('');
    const [isSubmittingPO, setIsSubmittingPO] = (0, react_1.useState)(false);
    const [draftedPoItems, setDraftedPoItems] = (0, react_1.useState)(new Set());
    const fetchInventoryReport = async () => {
        try {
            setLoading(true);
            const res = await fetch(`/api/v1/reports?dataset=inventory&search=${encodeURIComponent(search)}`);
            if (res.ok) {
                const data = await res.json();
                setReport(data);
            }
        }
        catch (err) {
            console.error('Failed to fetch inventory report:', err);
        }
        finally {
            setLoading(false);
        }
    };
    (0, react_1.useEffect)(() => {
        fetchInventoryReport();
    }, []);
    const handleSearchSubmit = (e) => {
        e.preventDefault();
        fetchInventoryReport();
    };
    const handleOpenReorderModal = (item) => {
        setActiveReorderItem(item);
        setOrderQuantity(item.suggestedReorderQty || 30);
        setTargetSupplier(item.manufacturer || 'Direct Pharma Distributor');
    };
    const handleApproveDraftPO = async () => {
        if (!activeReorderItem)
            return;
        setIsSubmittingPO(true);
        try {
            // Record procurement draft alert in automation engine
            await fetch('/api/v1/automation', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'send_reminder',
                    payload: {
                        partyName: targetSupplier,
                        amount: orderQuantity * 100, // estimated
                        channel: 'IN_APP_ALERT',
                        recipient: 'procurement-desk@agrawaltrading.com',
                        message: `Purchase Order Draft created for ${orderQuantity} units of ${activeReorderItem.productName} (${targetSupplier})`,
                    }
                })
            });
            setDraftedPoItems(prev => new Set(prev).add(activeReorderItem.productId));
            setToastMessage(`✓ Draft Purchase Order generated for ${orderQuantity} units of ${activeReorderItem.productName}`);
            setActiveReorderItem(null);
            setTimeout(() => {
                setToastMessage(null);
            }, 5000);
        }
        catch (err) {
            console.error('Failed to create draft PO:', err);
        }
        finally {
            setIsSubmittingPO(false);
        }
    };
    return ((0, jsx_runtime_1.jsxs)("div", { className: "dashboard-layout", children: [(0, jsx_runtime_1.jsx)(Sidebar_1.default, {}), (0, jsx_runtime_1.jsxs)("main", { className: "main-content", children: [(0, jsx_runtime_1.jsx)("div", { className: "top-menu", children: (0, jsx_runtime_1.jsx)(ThemeToggle_1.default, {}) }), (0, jsx_runtime_1.jsxs)("div", { className: "business-container", children: [(0, jsx_runtime_1.jsxs)("div", { className: "business-header", children: [(0, jsx_runtime_1.jsxs)("div", { className: "business-title-group", children: [(0, jsx_runtime_1.jsx)("h1", { children: "Inventory & Warehouse Stock Intelligence" }), (0, jsx_runtime_1.jsx)("p", { children: "Physical batch balances, SKU catalog on hand, reorder thresholds, and guided procurement PO generation" })] }), (0, jsx_runtime_1.jsxs)("button", { className: "secondary-btn", onClick: fetchInventoryReport, disabled: loading, children: [(0, jsx_runtime_1.jsx)(lucide_react_1.RefreshCw, { size: 15, className: loading ? 'animate-spin' : '' }), (0, jsx_runtime_1.jsx)("span", { children: "Refresh" })] })] }), report && report.kpis && ((0, jsx_runtime_1.jsx)("div", { className: "kpi-grid", children: report.kpis.map((kpi) => ((0, jsx_runtime_1.jsxs)("div", { className: "kpi-card", children: [(0, jsx_runtime_1.jsxs)("div", { className: "kpi-header", children: [(0, jsx_runtime_1.jsx)("span", { children: kpi.label }), (0, jsx_runtime_1.jsx)(lucide_react_1.Boxes, { size: 16 })] }), (0, jsx_runtime_1.jsx)("div", { className: "kpi-value", children: kpi.formattedValue }), (0, jsx_runtime_1.jsx)("div", { className: "kpi-subtext", children: kpi.subtext })] }, kpi.id))) })), (0, jsx_runtime_1.jsxs)("div", { className: "action-bar", children: [(0, jsx_runtime_1.jsxs)("form", { onSubmit: handleSearchSubmit, className: "search-input-group", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Search, { size: 16, color: "#64748b" }), (0, jsx_runtime_1.jsx)("input", { type: "text", placeholder: "Search product formulation, SKU, brand, manufacturer...", value: search, onChange: e => setSearch(e.target.value) })] }), (0, jsx_runtime_1.jsx)("button", { className: "primary-btn", onClick: fetchInventoryReport, children: "Search" })] }), report?.status === 'NOT_CONNECTED' ? ((0, jsx_runtime_1.jsxs)("div", { style: {
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
                                }, children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Package, { size: 42, color: "#64748b" }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("h3", { style: { margin: '0 0 0.5rem 0', color: '#f8fafc', fontSize: '1.15rem' }, children: "Inventory Dataset Not Connected" }), (0, jsx_runtime_1.jsx)("p", { style: { margin: 0, color: '#94a3b8', maxWidth: '540px', fontSize: '0.875rem', lineHeight: 1.5 }, children: "No physical warehouse inventory or opening stock sheet has been ingested yet. Ingest your opening stock CSV or connect your ERP warehouse stream to view SKU quantities on hand and automated reorder alerts." })] }), (0, jsx_runtime_1.jsx)("a", { href: "/ingestion", className: "primary-btn", style: { textDecoration: 'none', marginTop: '0.5rem' }, children: (0, jsx_runtime_1.jsx)("span", { children: "Connect Warehouse Stock Data" }) })] })) : ((0, jsx_runtime_1.jsx)("div", { className: "data-table-container", children: (0, jsx_runtime_1.jsxs)("table", { className: "data-table", children: [(0, jsx_runtime_1.jsx)("thead", { children: (0, jsx_runtime_1.jsxs)("tr", { children: [(0, jsx_runtime_1.jsx)("th", { children: "Product SKU & Brand" }), (0, jsx_runtime_1.jsx)("th", { children: "Opening" }), (0, jsx_runtime_1.jsx)("th", { children: "Purchases (+)" }), (0, jsx_runtime_1.jsx)("th", { children: "Sales (-)" }), (0, jsx_runtime_1.jsx)("th", { children: "Closing Stock" }), (0, jsx_runtime_1.jsx)("th", { children: "Reorder Threshold" }), (0, jsx_runtime_1.jsx)("th", { children: "Status & Risk" }), (0, jsx_runtime_1.jsx)("th", { children: "Procurement Action" })] }) }), (0, jsx_runtime_1.jsx)("tbody", { children: loading ? ((0, jsx_runtime_1.jsx)("tr", { children: (0, jsx_runtime_1.jsx)("td", { colSpan: 8, style: { textAlign: 'center', padding: '2rem', color: '#94a3b8' }, children: "Calculating real-time running SKU inventory ledger..." }) })) : !report || report.rows.length === 0 ? ((0, jsx_runtime_1.jsx)("tr", { children: (0, jsx_runtime_1.jsx)("td", { colSpan: 8, style: { textAlign: 'center', padding: '2rem', color: '#94a3b8' }, children: "No inventory records matched your search criteria." }) })) : (report.rows.slice(0, 50).map((row, i) => {
                                                const threshold = row.reorderThreshold || row.reorderLevel || 25;
                                                const isLow = row.isLowStock !== undefined ? row.isLowStock : row.quantityOnHand <= threshold;
                                                const isDrafted = draftedPoItems.has(row.productId);
                                                return ((0, jsx_runtime_1.jsxs)("tr", { children: [(0, jsx_runtime_1.jsxs)("td", { children: [(0, jsx_runtime_1.jsx)("div", { style: { fontWeight: 600, color: '#f8fafc' }, children: row.productName }), (0, jsx_runtime_1.jsx)("div", { style: { fontSize: '0.75rem', color: '#94a3b8' }, children: row.manufacturer || 'General' })] }), (0, jsx_runtime_1.jsx)("td", { style: { color: '#94a3b8' }, children: row.openingStock ?? 0 }), (0, jsx_runtime_1.jsxs)("td", { style: { color: '#60a5fa' }, children: ["+", row.purchases ?? 0] }), (0, jsx_runtime_1.jsxs)("td", { style: { color: '#f43f5e' }, children: ["-", row.sales ?? 0] }), (0, jsx_runtime_1.jsxs)("td", { style: { fontWeight: 700, color: isLow ? '#f87171' : '#34d399' }, children: [Math.round(row.quantityOnHand * 100) / 100, " ", row.unit || 'Strips'] }), (0, jsx_runtime_1.jsxs)("td", { style: { color: '#fbbf24', fontSize: '0.85rem' }, children: [threshold, " Strips"] }), (0, jsx_runtime_1.jsx)("td", { children: isLow ? ((0, jsx_runtime_1.jsxs)("span", { className: "badge badge-danger", children: ["Low Stock (\u2264", threshold, ")"] })) : ((0, jsx_runtime_1.jsx)("span", { className: "badge badge-success", children: "Sufficient" })) }), (0, jsx_runtime_1.jsx)("td", { children: isDrafted ? ((0, jsx_runtime_1.jsxs)("button", { className: "secondary-btn", disabled: true, style: { background: 'rgba(16, 185, 129, 0.15)', borderColor: '#10b981', color: '#34d399', fontSize: '0.75rem', padding: '0.35rem 0.65rem' }, children: [(0, jsx_runtime_1.jsx)(lucide_react_1.CheckCircle2, { size: 12, color: "#10b981" }), (0, jsx_runtime_1.jsx)("span", { children: "PO Drafted" })] })) : isLow ? ((0, jsx_runtime_1.jsxs)("button", { className: "primary-btn", onClick: () => handleOpenReorderModal(row), style: { fontSize: '0.75rem', padding: '0.35rem 0.65rem', background: '#3b82f6' }, children: [(0, jsx_runtime_1.jsx)(lucide_react_1.PlusCircle, { size: 12 }), (0, jsx_runtime_1.jsx)("span", { children: "Reorder PO" })] })) : ((0, jsx_runtime_1.jsx)("span", { style: { fontSize: '0.75rem', color: '#64748b' }, children: "Healthy" })) })] }, i));
                                            })) })] }) }))] }), activeReorderItem && ((0, jsx_runtime_1.jsx)("div", { className: "modal-backdrop", onClick: () => setActiveReorderItem(null), children: (0, jsx_runtime_1.jsxs)("div", { className: "modal-content", style: { maxWidth: '600px' }, onClick: e => e.stopPropagation(), children: [(0, jsx_runtime_1.jsxs)("div", { className: "modal-header", children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsxs)("h3", { style: { margin: 0, fontSize: '1.15rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '0.5rem' }, children: [(0, jsx_runtime_1.jsx)(lucide_react_1.FileText, { size: 18, color: "#60a5fa" }), (0, jsx_runtime_1.jsx)("span", { children: "Generate Procurement Purchase Order Draft" })] }), (0, jsx_runtime_1.jsxs)("p", { style: { margin: 0, fontSize: '0.8rem', color: '#94a3b8' }, children: ["Product: ", (0, jsx_runtime_1.jsx)("strong", { style: { color: '#f8fafc' }, children: activeReorderItem.productName })] })] }), (0, jsx_runtime_1.jsx)("button", { onClick: () => setActiveReorderItem(null), style: { background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }, children: (0, jsx_runtime_1.jsx)(lucide_react_1.X, { size: 20 }) })] }), (0, jsx_runtime_1.jsxs)("div", { className: "modal-body", children: [(0, jsx_runtime_1.jsxs)("div", { style: {
                                                display: 'grid',
                                                gridTemplateColumns: 'repeat(3, 1fr)',
                                                gap: '0.75rem',
                                                background: '#090d16',
                                                padding: '0.875rem',
                                                borderRadius: '8px',
                                                border: '1px solid #1e293b'
                                            }, children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("div", { style: { fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase' }, children: "Current Stock" }), (0, jsx_runtime_1.jsxs)("div", { style: { fontSize: '1.1rem', fontWeight: 700, color: '#f87171' }, children: [activeReorderItem.quantityOnHand, " Units"] })] }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("div", { style: { fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase' }, children: "Reorder Threshold" }), (0, jsx_runtime_1.jsxs)("div", { style: { fontSize: '1.1rem', fontWeight: 700, color: '#fbbf24' }, children: [activeReorderItem.reorderThreshold || activeReorderItem.reorderLevel || 25, " Strips"] })] }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("div", { style: { fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase' }, children: "Suggested Order" }), (0, jsx_runtime_1.jsxs)("div", { style: { fontSize: '1.1rem', fontWeight: 700, color: '#34d399' }, children: [activeReorderItem.suggestedReorderQty || 30, " Units"] })] })] }), (0, jsx_runtime_1.jsxs)("div", { style: { fontSize: '0.8rem', color: '#94a3b8', background: 'rgba(59, 130, 246, 0.08)', padding: '0.65rem 0.85rem', borderRadius: '6px', border: '1px solid rgba(59, 130, 246, 0.2)' }, children: [(0, jsx_runtime_1.jsx)("strong", { children: "Procurement Safety Rule:" }), " Calculated using standard 3x safety baseline. A recommendation is not a financial commitment until formally approved."] }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("label", { style: { display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#94a3b8', marginBottom: '0.3rem' }, children: "Target Supplier / Manufacturer:" }), (0, jsx_runtime_1.jsx)("input", { type: "text", className: "filter-select", style: { width: '100%', background: '#090d16' }, value: targetSupplier, onChange: e => setTargetSupplier(e.target.value) })] }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("label", { style: { display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#94a3b8', marginBottom: '0.3rem' }, children: "Order Quantity (Units):" }), (0, jsx_runtime_1.jsx)("input", { type: "number", className: "filter-select", style: { width: '100%', background: '#090d16' }, value: orderQuantity, min: 1, onChange: e => setOrderQuantity(parseInt(e.target.value) || 1) })] }), (0, jsx_runtime_1.jsxs)("div", { style: { display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }, children: [(0, jsx_runtime_1.jsx)("button", { className: "secondary-btn", onClick: () => setActiveReorderItem(null), children: "Cancel" }), (0, jsx_runtime_1.jsx)("button", { className: "primary-btn", onClick: handleApproveDraftPO, disabled: isSubmittingPO, style: { background: '#3b82f6' }, children: isSubmittingPO ? ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)(lucide_react_1.RefreshCw, { size: 14, className: "animate-spin" }), (0, jsx_runtime_1.jsx)("span", { children: "Generating PO Draft..." })] })) : ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)(lucide_react_1.CheckCircle2, { size: 14 }), (0, jsx_runtime_1.jsx)("span", { children: "Approve & Create Draft PO" })] })) })] })] })] }) })), toastMessage && ((0, jsx_runtime_1.jsxs)("div", { className: "toast-notification", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.CheckCircle2, { size: 18, color: "#34d399" }), (0, jsx_runtime_1.jsx)("span", { children: toastMessage })] }))] }), (0, jsx_runtime_1.jsx)(ContextualGuidancePanel_1.default, {})] }));
}
