"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.GroupNode = exports.HexNode = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("@xyflow/react");
const Icons = __importStar(require("lucide-react"));
const CornerCrosshairs = () => ((0, jsx_runtime_1.jsxs)("div", { className: "corner-accent-wrapper", children: [(0, jsx_runtime_1.jsx)("div", { className: "corner-accent corner-tl" }), (0, jsx_runtime_1.jsx)("div", { className: "corner-accent corner-tr" }), (0, jsx_runtime_1.jsx)("div", { className: "corner-accent corner-bl" }), (0, jsx_runtime_1.jsx)("div", { className: "corner-accent corner-br" })] }));
const HexNode = ({ data }) => {
    const Icon = data.icon ? Icons[data.icon] : Icons.Box;
    return ((0, jsx_runtime_1.jsxs)("div", { className: `hex-card node-card ${data.highlight ? 'highlight' : ''} ${data.className || ''}`, style: { width: '260px' }, children: [(0, jsx_runtime_1.jsx)(CornerCrosshairs, {}), (0, jsx_runtime_1.jsx)(react_1.Handle, { type: "target", position: react_1.Position.Left, style: { background: 'var(--accent-primary)', border: '2px solid var(--bg-surface)', width: '10px', height: '10px', left: '-5px' } }), (0, jsx_runtime_1.jsxs)("div", { className: "node-title", children: [(0, jsx_runtime_1.jsx)(Icon, { size: 16 }), data.title] }), (0, jsx_runtime_1.jsx)("div", { className: "node-desc", children: data.desc }), data.metric && ((0, jsx_runtime_1.jsx)("div", { className: `node-metric ${data.metricClass || ''}`, children: data.metric })), data.tags && ((0, jsx_runtime_1.jsx)("div", { className: "node-tags", children: data.tags.map((t, i) => (0, jsx_runtime_1.jsx)("span", { className: "tag", children: t }, i)) })), (0, jsx_runtime_1.jsx)(react_1.Handle, { type: "source", position: react_1.Position.Right, style: { background: 'var(--accent-primary)', border: '2px solid var(--bg-surface)', width: '10px', height: '10px', right: '-5px' } })] }));
};
exports.HexNode = HexNode;
const GroupNode = ({ data }) => {
    return ((0, jsx_runtime_1.jsx)("div", { className: "group-node-container", style: { width: data.width, height: data.height }, children: (0, jsx_runtime_1.jsx)("div", { className: "group-node-label", children: data.label }) }));
};
exports.GroupNode = GroupNode;
