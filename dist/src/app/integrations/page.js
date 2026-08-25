"use client";
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = IntegrationsPage;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const Sidebar_1 = __importDefault(require("@/components/Sidebar"));
const ThemeToggle_1 = __importDefault(require("@/components/ThemeToggle"));
const ContextualGuidancePanel_1 = __importDefault(require("@/components/ContextualGuidancePanel"));
const lucide_react_1 = require("lucide-react");
require("../dashboard.css");
require("../business-pages.css");
function IntegrationsPage() {
    const [jobs, setJobs] = (0, react_1.useState)([]);
    const [loading, setLoading] = (0, react_1.useState)(true);
    const [syncing, setSyncing] = (0, react_1.useState)(false);
    const [statusMessage, setStatusMessage] = (0, react_1.useState)(null);
    const fetchJobs = async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/v1/scheduler');
            if (res.ok) {
                const data = await res.json();
                setJobs(data.jobs || []);
            }
        }
        catch (err) {
            console.error('Failed to load scheduler jobs:', err);
        }
        finally {
            setLoading(false);
        }
    };
    (0, react_1.useEffect)(() => {
        fetchJobs();
    }, []);
    const handleSyncNow = async () => {
        try {
            setSyncing(true);
            setStatusMessage('Executing pipeline synchronization across all 5 ATC datasets...');
            const res = await fetch('/api/v1/scheduler', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'sync_now' })
            });
            if (res.ok) {
                setStatusMessage('Sync completed successfully. Canonical repositories updated.');
                await fetchJobs();
                setTimeout(() => setStatusMessage(null), 5000);
            }
        }
        catch (err) {
            setStatusMessage('Sync failed. Check logs.');
        }
        finally {
            setSyncing(false);
        }
    };
    const getStatusBadge = (status) => {
        switch (status) {
            case 'SUCCESS':
                return (0, jsx_runtime_1.jsx)("span", { className: "badge badge-success", children: "Healthy Sync" });
            case 'RUNNING':
                return (0, jsx_runtime_1.jsx)("span", { className: "badge badge-info", children: "In Progress" });
            case 'FAILED':
                return (0, jsx_runtime_1.jsx)("span", { className: "badge badge-danger", children: "Failed" });
            default:
                return (0, jsx_runtime_1.jsx)("span", { className: "badge badge-neutral", children: "Idle" });
        }
    };
    return ((0, jsx_runtime_1.jsxs)("div", { className: "dashboard-layout", children: [(0, jsx_runtime_1.jsx)(Sidebar_1.default, {}), (0, jsx_runtime_1.jsxs)("main", { className: "main-content", children: [(0, jsx_runtime_1.jsx)("div", { className: "top-menu", children: (0, jsx_runtime_1.jsx)(ThemeToggle_1.default, {}) }), (0, jsx_runtime_1.jsxs)("div", { className: "business-container", children: [(0, jsx_runtime_1.jsxs)("div", { className: "business-header", children: [(0, jsx_runtime_1.jsxs)("div", { className: "business-title-group", children: [(0, jsx_runtime_1.jsx)("h1", { children: "Data Sources & Scheduling Observability" }), (0, jsx_runtime_1.jsx)("p", { children: "Continuous pipeline monitors, data freshness latency metrics, and automated batch/real-time sync jobs" })] }), (0, jsx_runtime_1.jsx)("div", { style: { display: 'flex', gap: '0.5rem' }, children: (0, jsx_runtime_1.jsxs)("button", { className: "primary-btn", onClick: handleSyncNow, disabled: syncing, children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Play, { size: 15, className: syncing ? 'animate-spin' : '' }), (0, jsx_runtime_1.jsx)("span", { children: syncing ? 'Syncing Pipeline...' : 'Sync All Sources Now' })] }) })] }), statusMessage && ((0, jsx_runtime_1.jsxs)("div", { style: {
                                    background: 'rgba(16, 185, 129, 0.15)',
                                    border: '1px solid #10b981',
                                    borderRadius: '8px',
                                    padding: '0.75rem 1rem',
                                    color: '#34d399',
                                    fontSize: '0.875rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem'
                                }, children: [(0, jsx_runtime_1.jsx)(lucide_react_1.CheckCircle2, { size: 16 }), (0, jsx_runtime_1.jsx)("span", { children: statusMessage })] })), (0, jsx_runtime_1.jsxs)("div", { className: "kpi-grid", children: [(0, jsx_runtime_1.jsxs)("div", { className: "kpi-card", children: [(0, jsx_runtime_1.jsxs)("div", { className: "kpi-header", children: [(0, jsx_runtime_1.jsx)("span", { children: "Configured Sources" }), (0, jsx_runtime_1.jsx)(lucide_react_1.Database, { size: 16 })] }), (0, jsx_runtime_1.jsx)("div", { className: "kpi-value", children: jobs.length }), (0, jsx_runtime_1.jsx)("div", { className: "kpi-subtext", children: "ERP, Excel & Journal files" })] }), (0, jsx_runtime_1.jsxs)("div", { className: "kpi-card", children: [(0, jsx_runtime_1.jsxs)("div", { className: "kpi-header", children: [(0, jsx_runtime_1.jsx)("span", { children: "Data Freshness SLA" }), (0, jsx_runtime_1.jsx)(lucide_react_1.Clock, { size: 16 })] }), (0, jsx_runtime_1.jsx)("div", { className: "kpi-value", children: "60m" }), (0, jsx_runtime_1.jsx)("div", { className: "kpi-subtext", children: "Automated daily sync interval" })] }), (0, jsx_runtime_1.jsxs)("div", { className: "kpi-card", children: [(0, jsx_runtime_1.jsxs)("div", { className: "kpi-header", children: [(0, jsx_runtime_1.jsx)("span", { children: "Records Processed" }), (0, jsx_runtime_1.jsx)(lucide_react_1.Layers, { size: 16 })] }), (0, jsx_runtime_1.jsx)("div", { className: "kpi-value", children: jobs.reduce((sum, j) => sum + (j.recordsProcessed || 0), 0).toLocaleString() }), (0, jsx_runtime_1.jsx)("div", { className: "kpi-subtext", children: "Across canonical stores" })] }), (0, jsx_runtime_1.jsxs)("div", { className: "kpi-card", children: [(0, jsx_runtime_1.jsxs)("div", { className: "kpi-header", children: [(0, jsx_runtime_1.jsx)("span", { children: "Pipeline Status" }), (0, jsx_runtime_1.jsx)(lucide_react_1.CheckCircle2, { size: 16 })] }), (0, jsx_runtime_1.jsx)("div", { className: "kpi-value", style: { color: '#34d399' }, children: "100%" }), (0, jsx_runtime_1.jsx)("div", { className: "kpi-subtext", children: "0 error records" })] })] }), (0, jsx_runtime_1.jsx)("div", { className: "data-table-container", children: (0, jsx_runtime_1.jsxs)("table", { className: "data-table", children: [(0, jsx_runtime_1.jsx)("thead", { children: (0, jsx_runtime_1.jsxs)("tr", { children: [(0, jsx_runtime_1.jsx)("th", { children: "Job / Connector Name" }), (0, jsx_runtime_1.jsx)("th", { children: "Source Type" }), (0, jsx_runtime_1.jsx)("th", { children: "Ingestion Mode" }), (0, jsx_runtime_1.jsx)("th", { children: "Schedule Frequency" }), (0, jsx_runtime_1.jsx)("th", { children: "Last Run Status" }), (0, jsx_runtime_1.jsx)("th", { children: "Records Processed" }), (0, jsx_runtime_1.jsx)("th", { children: "Latency / Duration" })] }) }), (0, jsx_runtime_1.jsx)("tbody", { children: loading ? ((0, jsx_runtime_1.jsx)("tr", { children: (0, jsx_runtime_1.jsx)("td", { colSpan: 7, style: { textAlign: 'center', padding: '2rem', color: '#94a3b8' }, children: "Loading scheduled connectors..." }) })) : jobs.length === 0 ? ((0, jsx_runtime_1.jsx)("tr", { children: (0, jsx_runtime_1.jsx)("td", { colSpan: 7, style: { textAlign: 'center', padding: '2rem', color: '#94a3b8' }, children: "No scheduled jobs configured." }) })) : (jobs.map(j => ((0, jsx_runtime_1.jsxs)("tr", { children: [(0, jsx_runtime_1.jsxs)("td", { children: [(0, jsx_runtime_1.jsx)("div", { style: { fontWeight: 600, color: '#f8fafc' }, children: j.name }), (0, jsx_runtime_1.jsx)("div", { style: { fontSize: '0.75rem', color: '#64748b' }, children: j.sourceLocation })] }), (0, jsx_runtime_1.jsx)("td", { children: (0, jsx_runtime_1.jsxs)("div", { style: { display: 'flex', alignItems: 'center', gap: '0.3rem' }, children: [(0, jsx_runtime_1.jsx)(lucide_react_1.FileSpreadsheet, { size: 14, color: "#60a5fa" }), (0, jsx_runtime_1.jsx)("span", { children: j.sourceType })] }) }), (0, jsx_runtime_1.jsx)("td", { children: (0, jsx_runtime_1.jsx)("span", { className: "badge badge-neutral", children: j.mode }) }), (0, jsx_runtime_1.jsx)("td", { style: { fontFamily: 'monospace', color: '#94a3b8' }, children: j.cronExpression || 'Manual Trigger' }), (0, jsx_runtime_1.jsx)("td", { children: getStatusBadge(j.lastStatus) }), (0, jsx_runtime_1.jsxs)("td", { children: [(0, jsx_runtime_1.jsx)("span", { style: { fontWeight: 600, color: '#f8fafc' }, children: j.recordsProcessed?.toLocaleString() || 0 }), j.recordsRejected && j.recordsRejected > 0 ? ((0, jsx_runtime_1.jsxs)("span", { style: { color: '#f87171', fontSize: '0.75rem', marginLeft: '0.4rem' }, children: ["(", j.recordsRejected, " rejected)"] })) : null] }), (0, jsx_runtime_1.jsx)("td", { children: j.lastDurationMs
                                                            ? `${(j.lastDurationMs / 1000).toFixed(1)}s`
                                                            : 'Instant' })] }, j.id)))) })] }) })] })] }), (0, jsx_runtime_1.jsx)(ContextualGuidancePanel_1.default, {})] }));
}
