"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Home;
const jsx_runtime_1 = require("react/jsx-runtime");
const Sidebar_1 = __importDefault(require("@/components/Sidebar"));
const ThemeToggle_1 = __importDefault(require("@/components/ThemeToggle"));
const InteractiveWorkflow_1 = __importDefault(require("@/components/InteractiveWorkflow"));
const ContextualGuidancePanel_1 = __importDefault(require("@/components/ContextualGuidancePanel"));
require("./dashboard.css");
function Home() {
    return ((0, jsx_runtime_1.jsxs)("div", { className: "dashboard-layout", children: [(0, jsx_runtime_1.jsx)(Sidebar_1.default, {}), (0, jsx_runtime_1.jsxs)("main", { className: "main-content", children: [(0, jsx_runtime_1.jsx)("div", { className: "top-menu", children: (0, jsx_runtime_1.jsx)(ThemeToggle_1.default, {}) }), (0, jsx_runtime_1.jsxs)("div", { className: "dashboard-inner", children: [(0, jsx_runtime_1.jsxs)("header", { className: "content-header", children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("h1", { className: "page-title", children: "Live Workflow & Pipeline" }), (0, jsx_runtime_1.jsx)("p", { className: "page-subtitle", children: "Real-time data telemetry and agentic execution pipeline." })] }), (0, jsx_runtime_1.jsxs)("div", { className: "status-pill", children: [(0, jsx_runtime_1.jsx)("span", { className: "status-dot green" }), "System Healthy"] })] }), (0, jsx_runtime_1.jsx)("div", { className: "workflow-wrapper", style: { height: '70vh' }, children: (0, jsx_runtime_1.jsx)(InteractiveWorkflow_1.default, {}) })] })] }), (0, jsx_runtime_1.jsx)(ContextualGuidancePanel_1.default, {})] }));
}
