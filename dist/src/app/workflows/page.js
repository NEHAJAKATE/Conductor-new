"use client";
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = WorkflowsPage;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const Sidebar_1 = __importDefault(require("@/components/Sidebar"));
const ThemeToggle_1 = __importDefault(require("@/components/ThemeToggle"));
const ContextualGuidancePanel_1 = __importDefault(require("@/components/ContextualGuidancePanel"));
const lucide_react_1 = require("lucide-react");
require("../dashboard.css");
require("../business-pages.css");
function WorkflowsPage() {
    const [rules, setRules] = (0, react_1.useState)([]);
    const [logs, setLogs] = (0, react_1.useState)([]);
    const [loading, setLoading] = (0, react_1.useState)(true);
    const fetchRules = async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/v1/automation');
            if (res.ok) {
                const data = await res.json();
                setRules(data.rules || []);
                setLogs(data.logs || []);
            }
        }
        catch (err) {
            console.error('Failed to load rules:', err);
        }
        finally {
            setLoading(false);
        }
    };
    (0, react_1.useEffect)(() => {
        fetchRules();
    }, []);
    const handleToggle = async (ruleId) => {
        try {
            const res = await fetch('/api/v1/automation', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'toggle', ruleId })
            });
            if (res.ok) {
                setRules(prev => prev.map(r => r.id === ruleId ? { ...r, enabled: !r.enabled } : r));
            }
        }
        catch (err) {
            console.error('Failed to toggle rule:', err);
        }
    };
    const getChannelIcon = (channel) => {
        switch (channel) {
            case 'EMAIL':
                return (0, jsx_runtime_1.jsx)(lucide_react_1.Mail, { size: 15, color: "#60a5fa" });
            case 'WHATSAPP':
                return (0, jsx_runtime_1.jsx)(lucide_react_1.MessageSquare, { size: 15, color: "#34d399" });
            default:
                return (0, jsx_runtime_1.jsx)(lucide_react_1.Bell, { size: 15, color: "#fbbf24" });
        }
    };
    return ((0, jsx_runtime_1.jsxs)("div", { className: "dashboard-layout", children: [(0, jsx_runtime_1.jsx)(Sidebar_1.default, {}), (0, jsx_runtime_1.jsxs)("main", { className: "main-content", children: [(0, jsx_runtime_1.jsx)("div", { className: "top-menu", children: (0, jsx_runtime_1.jsx)(ThemeToggle_1.default, {}) }), (0, jsx_runtime_1.jsxs)("div", { className: "business-container", children: [(0, jsx_runtime_1.jsxs)("div", { className: "business-header", children: [(0, jsx_runtime_1.jsxs)("div", { className: "business-title-group", children: [(0, jsx_runtime_1.jsx)("h1", { children: "Workflow & Event Automation" }), (0, jsx_runtime_1.jsx)("p", { children: "Deterministic business logic triggers: overdue aging alerts, inventory reorder recommendations, and notification routing" })] }), (0, jsx_runtime_1.jsxs)("button", { className: "secondary-btn", onClick: fetchRules, disabled: loading, children: [(0, jsx_runtime_1.jsx)(lucide_react_1.RefreshCw, { size: 15, className: loading ? 'animate-spin' : '' }), (0, jsx_runtime_1.jsx)("span", { children: "Refresh" })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "kpi-grid", children: [(0, jsx_runtime_1.jsxs)("div", { className: "kpi-card", children: [(0, jsx_runtime_1.jsxs)("div", { className: "kpi-header", children: [(0, jsx_runtime_1.jsx)("span", { children: "Active Automation Rules" }), (0, jsx_runtime_1.jsx)(lucide_react_1.Zap, { size: 16 })] }), (0, jsx_runtime_1.jsxs)("div", { className: "kpi-value", children: [rules.filter(r => r.enabled).length, " of ", rules.length] }), (0, jsx_runtime_1.jsx)("div", { className: "kpi-subtext", children: "Trigger-Condition-Action workflows" })] }), (0, jsx_runtime_1.jsxs)("div", { className: "kpi-card", children: [(0, jsx_runtime_1.jsxs)("div", { className: "kpi-header", children: [(0, jsx_runtime_1.jsx)("span", { children: "Executed Actions" }), (0, jsx_runtime_1.jsx)(lucide_react_1.CheckCircle2, { size: 16 })] }), (0, jsx_runtime_1.jsx)("div", { className: "kpi-value", children: rules.reduce((sum, r) => sum + (r.executionCount || 0), 0) }), (0, jsx_runtime_1.jsx)("div", { className: "kpi-subtext", children: "Dispatched notifications & alerts" })] })] }), (0, jsx_runtime_1.jsx)("div", { className: "data-table-container", children: (0, jsx_runtime_1.jsxs)("table", { className: "data-table", children: [(0, jsx_runtime_1.jsx)("thead", { children: (0, jsx_runtime_1.jsxs)("tr", { children: [(0, jsx_runtime_1.jsx)("th", { children: "Automation Rule" }), (0, jsx_runtime_1.jsx)("th", { children: "Trigger & Condition" }), (0, jsx_runtime_1.jsx)("th", { children: "Action Channel & Target" }), (0, jsx_runtime_1.jsx)("th", { children: "Executions" }), (0, jsx_runtime_1.jsx)("th", { children: "Status" }), (0, jsx_runtime_1.jsx)("th", { children: "Toggle" })] }) }), (0, jsx_runtime_1.jsx)("tbody", { children: loading ? ((0, jsx_runtime_1.jsx)("tr", { children: (0, jsx_runtime_1.jsx)("td", { colSpan: 6, style: { textAlign: 'center', padding: '2rem', color: '#94a3b8' }, children: "Loading automation policies..." }) })) : rules.length === 0 ? ((0, jsx_runtime_1.jsx)("tr", { children: (0, jsx_runtime_1.jsx)("td", { colSpan: 6, style: { textAlign: 'center', padding: '2rem', color: '#94a3b8' }, children: "No rules found." }) })) : (rules.map(rule => ((0, jsx_runtime_1.jsxs)("tr", { children: [(0, jsx_runtime_1.jsxs)("td", { children: [(0, jsx_runtime_1.jsx)("div", { style: { fontWeight: 600, color: '#f8fafc' }, children: rule.name }), (0, jsx_runtime_1.jsx)("div", { style: { fontSize: '0.75rem', color: '#64748b' }, children: rule.description })] }), (0, jsx_runtime_1.jsx)("td", { children: (0, jsx_runtime_1.jsxs)("div", { style: { fontFamily: 'monospace', color: '#60a5fa', fontSize: '0.8rem' }, children: [rule.condition.field, " ", rule.condition.operator === 'greater_than' ? '>' : rule.condition.operator === 'less_than' ? '<' : '=', " ", String(rule.condition.value)] }) }), (0, jsx_runtime_1.jsx)("td", { children: (0, jsx_runtime_1.jsxs)("div", { style: { display: 'flex', alignItems: 'center', gap: '0.4rem' }, children: [getChannelIcon(rule.action.channel), (0, jsx_runtime_1.jsx)("span", { style: { fontSize: '0.85rem', color: '#e2e8f0' }, children: rule.action.recipient })] }) }), (0, jsx_runtime_1.jsx)("td", { children: (0, jsx_runtime_1.jsx)("span", { className: "badge badge-neutral", children: rule.executionCount }) }), (0, jsx_runtime_1.jsx)("td", { children: rule.enabled ? ((0, jsx_runtime_1.jsx)("span", { className: "badge badge-success", children: "Active" })) : ((0, jsx_runtime_1.jsx)("span", { className: "badge badge-neutral", children: "Disabled" })) }), (0, jsx_runtime_1.jsx)("td", { children: (0, jsx_runtime_1.jsx)("button", { onClick: () => handleToggle(rule.id), style: { background: 'transparent', border: 'none', cursor: 'pointer', color: rule.enabled ? '#3b82f6' : '#64748b' }, title: "Toggle Rule State", children: rule.enabled ? (0, jsx_runtime_1.jsx)(lucide_react_1.ToggleRight, { size: 28 }) : (0, jsx_runtime_1.jsx)(lucide_react_1.ToggleLeft, { size: 28 }) }) })] }, rule.id)))) })] }) })] })] }), (0, jsx_runtime_1.jsx)(ContextualGuidancePanel_1.default, {})] }));
}
