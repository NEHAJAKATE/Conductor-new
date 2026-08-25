"use client";
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = SpiderbrainPage;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const Sidebar_1 = __importDefault(require("@/components/Sidebar"));
const ThemeToggle_1 = __importDefault(require("@/components/ThemeToggle"));
const lucide_react_1 = require("lucide-react");
require("./spiderbrain.css");
function SpiderbrainPage() {
    const [rules, setRules] = (0, react_1.useState)([
        {
            title: 'MQL Definition',
            desc: "IF intent_score > 80 AND email NOT LIKE '%@gmail.com' THEN MQL = TRUE",
            target: 'dim_known_profiles',
            status: 'Ratified',
            updatedAt: '2h ago'
        },
        {
            title: 'VIP Customer',
            desc: 'IF ltv > $10,000 OR active_subscriptions > 3 THEN VIP = TRUE',
            target: 'fct_activation_metrics',
            status: 'Ratified',
            updatedAt: '1d ago'
        },
        {
            title: 'Anonymous TTL Drop',
            desc: 'IF last_seen < current_date - 90 days THEN Delete Profile',
            target: 'dim_anonymous_profiles',
            status: 'Pending Review',
            updatedAt: '45m ago'
        }
    ]);
    const [loading, setLoading] = (0, react_1.useState)(true);
    (0, react_1.useEffect)(() => {
        async function loadDynamicRules() {
            try {
                const res = await fetch('/api/v1/assets');
                if (res.ok) {
                    const data = await res.json();
                    const normalizedDataList = data.normalizedList || data.silverList;
                    if (normalizedDataList && normalizedDataList.length > 0) {
                        // Generate a rule for each dynamic conformed staging dataset
                        const newRules = normalizedDataList.map((item) => ({
                            title: `${item.name.replace(/^stg_/, '').toUpperCase()} Verification Rule`,
                            desc: `IF email IS NOT NULL AND phone REGEXP '^[0-9+]+$' THEN isValidEmailPhone = TRUE`,
                            target: item.name,
                            status: 'Ratified',
                            updatedAt: 'Just conformed'
                        }));
                        setRules(prev => [...newRules, ...prev]);
                    }
                }
            }
            catch (err) {
                console.error('Failed to load assets in Spiderbrain:', err);
            }
            finally {
                setLoading(false);
            }
        }
        loadDynamicRules();
    }, []);
    return ((0, jsx_runtime_1.jsxs)("div", { className: "app-layout", children: [(0, jsx_runtime_1.jsx)(Sidebar_1.default, {}), (0, jsx_runtime_1.jsxs)("main", { className: "main-content", children: [(0, jsx_runtime_1.jsxs)("header", { className: "top-header", children: [(0, jsx_runtime_1.jsxs)("div", { className: "header-breadcrumbs", children: [(0, jsx_runtime_1.jsx)("span", { className: "muted", children: "Platform" }), " / ", (0, jsx_runtime_1.jsx)("span", { className: "active-breadcrumb", children: "Spiderbrain Engine" })] }), (0, jsx_runtime_1.jsxs)("div", { className: "header-actions", children: [(0, jsx_runtime_1.jsx)(ThemeToggle_1.default, {}), (0, jsx_runtime_1.jsx)("div", { className: "avatar", children: "AD" })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "spiderbrain-wrapper", children: [(0, jsx_runtime_1.jsxs)("div", { className: "sb-overview", children: [(0, jsx_runtime_1.jsxs)("div", { className: "sb-title", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.BrainCircuit, { size: 24, className: "accent-icon" }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("h2", { children: "Deterministic Ontology Engine" }), (0, jsx_runtime_1.jsx)("p", { children: "Governing AI execution through ratified Memtree rules and Grounding Kernel metrics." })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "sb-stats", children: [(0, jsx_runtime_1.jsxs)("div", { className: "stat-box", children: [(0, jsx_runtime_1.jsx)("div", { className: "stat-label", children: "Active Rules" }), (0, jsx_runtime_1.jsx)("div", { className: "stat-value", children: rules.length })] }), (0, jsx_runtime_1.jsxs)("div", { className: "stat-box", children: [(0, jsx_runtime_1.jsx)("div", { className: "stat-label", children: "Centrality Avg" }), (0, jsx_runtime_1.jsx)("div", { className: "stat-value", children: "0.89" })] }), (0, jsx_runtime_1.jsxs)("div", { className: "stat-box", children: [(0, jsx_runtime_1.jsx)("div", { className: "stat-label", children: "Eval Pass Rate" }), (0, jsx_runtime_1.jsx)("div", { className: "stat-value success", children: "99.2%" })] })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "sb-content", children: [(0, jsx_runtime_1.jsxs)("div", { className: "sb-memtree", children: [(0, jsx_runtime_1.jsxs)("div", { className: "panel-header", children: [(0, jsx_runtime_1.jsxs)("h3", { children: [(0, jsx_runtime_1.jsx)(lucide_react_1.FileText, { size: 16 }), " Memtree (Business Logic)"] }), (0, jsx_runtime_1.jsx)("button", { className: "btn-secondary", children: "Add Rule" })] }), (0, jsx_runtime_1.jsx)("div", { className: "rule-list", children: rules.map((rule, idx) => ((0, jsx_runtime_1.jsxs)("div", { className: "rule-card", children: [(0, jsx_runtime_1.jsxs)("div", { className: "rule-header", children: [(0, jsx_runtime_1.jsx)("h4", { children: rule.title }), (0, jsx_runtime_1.jsxs)("span", { className: `badge ${rule.status === 'Ratified' ? 'badge-certified' : 'badge-pending'}`, children: [rule.status === 'Ratified' && (0, jsx_runtime_1.jsx)(lucide_react_1.CheckCircle2, { size: 12 }), " ", rule.status] })] }), (0, jsx_runtime_1.jsx)("p", { className: "rule-desc", children: rule.desc }), (0, jsx_runtime_1.jsxs)("div", { className: "rule-meta", children: [(0, jsx_runtime_1.jsxs)("span", { children: ["Target: ", rule.target] }), (0, jsx_runtime_1.jsxs)("span", { children: ["Last updated: ", rule.updatedAt] })] })] }, idx))) })] }), (0, jsx_runtime_1.jsxs)("div", { className: "sb-engine", children: [(0, jsx_runtime_1.jsx)("div", { className: "panel-header", children: (0, jsx_runtime_1.jsxs)("h3", { children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Network, { size: 16 }), " Grounding Kernel"] }) }), (0, jsx_runtime_1.jsx)("div", { className: "kernel-viz", children: (0, jsx_runtime_1.jsxs)("div", { className: "viz-placeholder", children: [(0, jsx_runtime_1.jsx)("div", { className: "viz-node center", children: "Spiderbrain" }), (0, jsx_runtime_1.jsx)("div", { className: "viz-node side top", children: "Tabular Parser" }), (0, jsx_runtime_1.jsx)("div", { className: "viz-node side bottom", children: "Engine Scores" }), (0, jsx_runtime_1.jsxs)("svg", { className: "viz-lines", width: "100%", height: "100%", children: [(0, jsx_runtime_1.jsx)("line", { x1: "50%", y1: "50%", x2: "20%", y2: "20%", stroke: "var(--accent-secondary)", strokeWidth: "2", strokeDasharray: "4" }), (0, jsx_runtime_1.jsx)("line", { x1: "50%", y1: "50%", x2: "80%", y2: "80%", stroke: "var(--accent-secondary)", strokeWidth: "2", strokeDasharray: "4" })] })] }) }), (0, jsx_runtime_1.jsxs)("div", { className: "evals-section", children: [(0, jsx_runtime_1.jsxs)("h4", { children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Target, { size: 14 }), " Continuous Evals"] }), (0, jsx_runtime_1.jsxs)("div", { className: "eval-row", children: [(0, jsx_runtime_1.jsx)("span", { className: "eval-name", children: "Tone & Brand Voice Check" }), (0, jsx_runtime_1.jsx)("div", { className: "eval-bar-bg", children: (0, jsx_runtime_1.jsx)("div", { className: "eval-bar-fill", style: { width: '98%' } }) }), (0, jsx_runtime_1.jsx)("span", { className: "eval-score", children: "98%" })] }), (0, jsx_runtime_1.jsxs)("div", { className: "eval-row", children: [(0, jsx_runtime_1.jsx)("span", { className: "eval-name", children: "PII Leakage Prevention" }), (0, jsx_runtime_1.jsx)("div", { className: "eval-bar-bg", children: (0, jsx_runtime_1.jsx)("div", { className: "eval-bar-fill", style: { width: '100%' } }) }), (0, jsx_runtime_1.jsx)("span", { className: "eval-score", children: "100%" })] }), (0, jsx_runtime_1.jsxs)("div", { className: "eval-row", children: [(0, jsx_runtime_1.jsx)("span", { className: "eval-name", children: "Logic Hallucination Check" }), (0, jsx_runtime_1.jsx)("div", { className: "eval-bar-bg", children: (0, jsx_runtime_1.jsx)("div", { className: "eval-bar-fill", style: { width: '95%' } }) }), (0, jsx_runtime_1.jsx)("span", { className: "eval-score", children: "95%" })] })] })] })] })] })] })] }));
}
