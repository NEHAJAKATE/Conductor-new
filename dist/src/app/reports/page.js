"use client";
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = ReportsPage;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const Sidebar_1 = __importDefault(require("@/components/Sidebar"));
const ThemeToggle_1 = __importDefault(require("@/components/ThemeToggle"));
const ContextualGuidancePanel_1 = __importDefault(require("@/components/ContextualGuidancePanel"));
const lucide_react_1 = require("lucide-react");
require("../dashboard.css");
require("../business-pages.css");
function ReportsPage() {
    const [dataset, setDataset] = (0, react_1.useState)('sales');
    const [groupBy, setGroupBy] = (0, react_1.useState)('party');
    const [search, setSearch] = (0, react_1.useState)('');
    const [report, setReport] = (0, react_1.useState)(null);
    const [loading, setLoading] = (0, react_1.useState)(true);
    const fetchCustomReport = async () => {
        try {
            setLoading(true);
            const res = await fetch(`/api/v1/reports?dataset=${dataset}&groupBy=${groupBy}&search=${encodeURIComponent(search)}`);
            if (res.ok) {
                const data = await res.json();
                setReport(data);
            }
        }
        catch (err) {
            console.error('Failed to generate report:', err);
        }
        finally {
            setLoading(false);
        }
    };
    (0, react_1.useEffect)(() => {
        fetchCustomReport();
    }, [dataset, groupBy]);
    const handleExportCsv = () => {
        if (!report || !report.rows || report.rows.length === 0)
            return;
        const headers = Object.keys(report.rows[0]);
        const csvContent = [
            headers.join(','),
            ...report.rows.map((r) => headers.map(h => JSON.stringify(r[h] ?? '')).join(','))
        ].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `conductor_${dataset}_report.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };
    return ((0, jsx_runtime_1.jsxs)("div", { className: "dashboard-layout", children: [(0, jsx_runtime_1.jsx)(Sidebar_1.default, {}), (0, jsx_runtime_1.jsxs)("main", { className: "main-content", children: [(0, jsx_runtime_1.jsx)("div", { className: "top-menu", children: (0, jsx_runtime_1.jsx)(ThemeToggle_1.default, {}) }), (0, jsx_runtime_1.jsxs)("div", { className: "business-container", children: [(0, jsx_runtime_1.jsxs)("div", { className: "business-header", children: [(0, jsx_runtime_1.jsxs)("div", { className: "business-title-group", children: [(0, jsx_runtime_1.jsx)("h1", { children: "Generic Report Builder" }), (0, jsx_runtime_1.jsx)("p", { children: "Configurable dimensional analytics, deterministic mathematical aggregations, and multi-format data export" })] }), (0, jsx_runtime_1.jsxs)("div", { style: { display: 'flex', gap: '0.5rem' }, children: [(0, jsx_runtime_1.jsxs)("button", { className: "secondary-btn", onClick: handleExportCsv, disabled: !report || report.rows?.length === 0, children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Download, { size: 15 }), (0, jsx_runtime_1.jsx)("span", { children: "Export CSV" })] }), (0, jsx_runtime_1.jsxs)("button", { className: "primary-btn", onClick: fetchCustomReport, disabled: loading, children: [(0, jsx_runtime_1.jsx)(lucide_react_1.RefreshCw, { size: 15, className: loading ? 'animate-spin' : '' }), (0, jsx_runtime_1.jsx)("span", { children: "Generate Report" })] })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "action-bar", children: [(0, jsx_runtime_1.jsxs)("div", { className: "filter-group", children: [(0, jsx_runtime_1.jsx)("label", { style: { fontSize: '0.85rem', color: '#94a3b8' }, children: "Target Dataset:" }), (0, jsx_runtime_1.jsxs)("select", { className: "filter-select", value: dataset, onChange: e => setDataset(e.target.value), children: [(0, jsx_runtime_1.jsx)("option", { value: "sales", children: "Sales Transactions & Revenue" }), (0, jsx_runtime_1.jsx)("option", { value: "purchases", children: "Procurement & Supplier Spend" }), (0, jsx_runtime_1.jsx)("option", { value: "outstanding", children: "Outstanding & Receivables Ageing" }), (0, jsx_runtime_1.jsx)("option", { value: "inventory", children: "Warehouse Inventory & Stock" }), (0, jsx_runtime_1.jsx)("option", { value: "business_activity", children: "B2B Directory & Business Activity" })] })] }), dataset === 'sales' && ((0, jsx_runtime_1.jsxs)("div", { className: "filter-group", children: [(0, jsx_runtime_1.jsx)("label", { style: { fontSize: '0.85rem', color: '#94a3b8' }, children: "Dimension:" }), (0, jsx_runtime_1.jsxs)("select", { className: "filter-select", value: groupBy, onChange: e => setGroupBy(e.target.value), children: [(0, jsx_runtime_1.jsx)("option", { value: "party", children: "By Buying Party" }), (0, jsx_runtime_1.jsx)("option", { value: "product", children: "By Product SKU" }), (0, jsx_runtime_1.jsx)("option", { value: "company", children: "By Manufacturer" }), (0, jsx_runtime_1.jsx)("option", { value: "area", children: "By Geographic Area" }), (0, jsx_runtime_1.jsx)("option", { value: "route", children: "By Delivery Route" })] })] })), (0, jsx_runtime_1.jsx)("div", { className: "search-input-group", style: { minWidth: '200px' }, children: (0, jsx_runtime_1.jsx)("input", { type: "text", placeholder: "Search keywords...", value: search, onChange: e => setSearch(e.target.value) }) })] }), report && report.kpis && ((0, jsx_runtime_1.jsx)("div", { className: "kpi-grid", children: report.kpis.map((kpi) => ((0, jsx_runtime_1.jsxs)("div", { className: "kpi-card", children: [(0, jsx_runtime_1.jsxs)("div", { className: "kpi-header", children: [(0, jsx_runtime_1.jsx)("span", { children: kpi.label }), (0, jsx_runtime_1.jsx)(lucide_react_1.FileBarChart, { size: 16 })] }), (0, jsx_runtime_1.jsx)("div", { className: "kpi-value", children: kpi.formattedValue }), (0, jsx_runtime_1.jsx)("div", { className: "kpi-subtext", children: kpi.subtext })] }, kpi.id))) })), (0, jsx_runtime_1.jsx)("div", { className: "data-table-container", children: (0, jsx_runtime_1.jsxs)("table", { className: "data-table", children: [(0, jsx_runtime_1.jsx)("thead", { children: (0, jsx_runtime_1.jsx)("tr", { children: report && report.rows && report.rows.length > 0 ? (Object.keys(report.rows[0]).map((key, i) => ((0, jsx_runtime_1.jsx)("th", { style: { textTransform: 'capitalize' }, children: key.replace(/([A-Z])/g, ' $1') }, i)))) : ((0, jsx_runtime_1.jsx)("th", { children: "Results" })) }) }), (0, jsx_runtime_1.jsx)("tbody", { children: loading ? ((0, jsx_runtime_1.jsx)("tr", { children: (0, jsx_runtime_1.jsx)("td", { colSpan: 10, style: { textAlign: 'center', padding: '2rem', color: '#94a3b8' }, children: "Processing report aggregation query..." }) })) : !report || !report.rows || report.rows.length === 0 ? ((0, jsx_runtime_1.jsx)("tr", { children: (0, jsx_runtime_1.jsx)("td", { colSpan: 10, style: { textAlign: 'center', padding: '2rem', color: '#94a3b8' }, children: "No data points match the selected criteria." }) })) : (report.rows.slice(0, 50).map((row, rIdx) => ((0, jsx_runtime_1.jsx)("tr", { children: Object.values(row).map((val, cIdx) => ((0, jsx_runtime_1.jsx)("td", { children: typeof val === 'number'
                                                        ? val.toLocaleString()
                                                        : typeof val === 'object' && val !== null
                                                            ? JSON.stringify(val)
                                                            : String(val) }, cIdx))) }, rIdx)))) })] }) })] })] }), (0, jsx_runtime_1.jsx)(ContextualGuidancePanel_1.default, {})] }));
}
