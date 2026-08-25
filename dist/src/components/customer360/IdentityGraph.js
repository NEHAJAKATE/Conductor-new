"use client";
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = IdentityGraph;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const react_2 = require("@xyflow/react");
require("@xyflow/react/dist/style.css");
const lucide_react_1 = require("lucide-react");
function IdentityGraph({ profile }) {
    const [selectedNode, setSelectedNode] = (0, react_1.useState)(null);
    // Define nodes dynamically based on profile
    const initialNodes = [
        // Center Node: Golden UUID
        {
            id: 'golden-uuid',
            position: { x: 380, y: 220 },
            data: {
                label: ((0, jsx_runtime_1.jsxs)("div", { style: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }, children: [(0, jsx_runtime_1.jsxs)("div", { style: { display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent-primary)', fontWeight: 'bold' }, children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Sparkles, { size: 14, className: "animate-pulse" }), (0, jsx_runtime_1.jsx)("span", { children: "UNIFIED CUSTOMER" })] }), (0, jsx_runtime_1.jsxs)("div", { style: { fontSize: '10px', color: 'var(--text-loud)', fontFamily: 'monospace' }, children: [profile.uuid.slice(0, 16), "..."] })] }))
            },
            style: {
                background: 'rgba(92, 177, 152, 0.1)',
                border: '2px solid var(--accent-primary)',
                boxShadow: '0 0 15px rgba(92, 177, 152, 0.25)',
                color: 'var(--text-loud)',
                padding: '12px 16px',
                borderRadius: '8px',
                width: 250,
                zIndex: 50
            }
        },
        // Left Nodes: Ingestion Channels & Identity/Behavioral/Financial linkages
        {
            id: 'src-crm',
            position: { x: 50, y: 40 },
            data: {
                label: 'HubSpot CRM',
                icon: lucide_react_1.Database,
                desc: 'Contact demographic profiles',
                details: {
                    'Type': 'Identity Ingestion',
                    'Frequency': 'Real-time sync',
                    'Value Matched': profile.identity.name || 'Unnamed'
                }
            },
            style: { background: 'var(--bg-app)', border: '1px solid var(--accent-secondary)', color: 'var(--text-loud)', borderRadius: '6px', width: 180 }
        },
        {
            id: 'src-website',
            position: { x: 50, y: 130 },
            data: {
                label: 'Web SDK Ingest',
                icon: lucide_react_1.Globe,
                desc: 'Website visitor clickstream',
                details: {
                    'Type': 'Behavioral Streams',
                    'Matched Via': 'Aadhaar / Email Cookie',
                    'Visits Logged': `${profile.behavioralEvents.length} events`
                }
            },
            style: { background: 'var(--bg-app)', border: '1px solid var(--accent-secondary)', color: 'var(--text-loud)', borderRadius: '6px', width: 180 }
        },
        {
            id: 'src-finance',
            position: { x: 50, y: 220 },
            data: {
                label: 'Stripe Billing System',
                icon: lucide_react_1.CreditCard,
                desc: 'Transactions and Invoices',
                details: {
                    'Type': 'Financial Ledger',
                    'Matched Via': 'PAN / Aadhaar Linkage',
                    'Revenue Contributed': `$${profile.financial.invoices ? profile.financial.invoices.reduce((a, c) => a + c.amount, 0) : 0}`
                }
            },
            style: { background: 'var(--bg-app)', border: '1px solid var(--accent-secondary)', color: 'var(--text-loud)', borderRadius: '6px', width: 180 }
        },
        {
            id: 'src-support',
            position: { x: 50, y: 310 },
            data: {
                label: 'ZenDesk Support',
                icon: lucide_react_1.HelpCircle,
                desc: 'Support Tickets & Helpdesk',
                details: {
                    'Type': 'Service Operations',
                    'Matched Via': 'Normalized Email Lookup',
                    'Linked Tickets': '3 Active Tickets'
                }
            },
            style: { background: 'var(--bg-app)', border: '1px solid var(--accent-secondary)', color: 'var(--text-loud)', borderRadius: '6px', width: 180 }
        },
        {
            id: 'src-marketing',
            position: { x: 50, y: 400 },
            data: {
                label: 'Marketo Campaigns',
                icon: lucide_react_1.Mail,
                desc: 'Marketing list campaign clicks',
                details: {
                    'Type': 'Campaign Engagement',
                    'Matched Via': 'Phone / Email match',
                    'Consent Status': 'Opted-In'
                }
            },
            style: { background: 'var(--bg-app)', border: '1px solid var(--accent-secondary)', color: 'var(--text-loud)', borderRadius: '6px', width: 180 }
        },
        // Right Nodes: Linked Identifier Nodes
        {
            id: 'id-email',
            position: { x: 700, y: 80 },
            data: {
                label: 'Email Identity',
                icon: lucide_react_1.Mail,
                desc: 'Primary email address token',
                details: {
                    'Raw Value': profile.identity.email,
                    'PII Classification': 'Highly Sensitive (Masked)',
                    'Match Confidence': '100% (Exact Match)'
                }
            },
            style: { background: 'var(--bg-app)', border: '1px solid var(--grid-line-major)', color: 'var(--text-loud)', borderRadius: '6px', width: 180 }
        },
        {
            id: 'id-phone',
            position: { x: 700, y: 170 },
            data: {
                label: 'Phone Identity',
                icon: lucide_react_1.Phone,
                desc: 'Normalized E.164 phone token',
                details: {
                    'Raw Value': profile.identity.phone,
                    'PII Classification': 'Highly Sensitive (Masked)',
                    'Match Confidence': '90% (Normalized Match)'
                }
            },
            style: { background: 'var(--bg-app)', border: '1px solid var(--grid-line-major)', color: 'var(--text-loud)', borderRadius: '6px', width: 180 }
        },
        {
            id: 'id-pan',
            position: { x: 700, y: 260 },
            data: {
                label: 'PAN Government ID',
                icon: lucide_react_1.Fingerprint,
                desc: 'Indian Permanent Account Number',
                details: {
                    'Raw Value': profile.identity.pan || 'Not Linked',
                    'PII Classification': 'Highly Sensitive (Masked)',
                    'Match Confidence': '100% (Government Registry Match)'
                }
            },
            style: { background: 'var(--bg-app)', border: '1px solid var(--grid-line-major)', color: 'var(--text-loud)', borderRadius: '6px', width: 180 }
        },
        {
            id: 'id-aadhaar',
            position: { x: 700, y: 350 },
            data: {
                label: 'Aadhaar Government ID',
                icon: lucide_react_1.Fingerprint,
                desc: 'Indian UIDAI identification',
                details: {
                    'Raw Value': profile.identity.aadhaar || 'Not Linked',
                    'PII Classification': 'Highly Sensitive (Masked)',
                    'Match Confidence': '100% (Deterministic Match)'
                }
            },
            style: { background: 'var(--bg-app)', border: '1px solid var(--grid-line-major)', color: 'var(--text-loud)', borderRadius: '6px', width: 180 }
        }
    ];
    // Define edges with relationship labels
    const initialEdges = [
        // Source linkages to Unified Profile
        { id: 'e-crm-golden', source: 'src-crm', target: 'golden-uuid', animated: true, label: 'CRM Identity Link', style: { stroke: 'var(--accent-secondary)', strokeWidth: 1.5 }, labelStyle: { fill: 'var(--text-muted)', fontSize: 9 } },
        { id: 'e-website-golden', source: 'src-website', target: 'golden-uuid', animated: true, label: 'Email Cookie Match', style: { stroke: 'var(--accent-secondary)', strokeWidth: 1.5 }, labelStyle: { fill: 'var(--text-muted)', fontSize: 9 } },
        { id: 'e-finance-golden', source: 'src-finance', target: 'golden-uuid', animated: true, label: 'PAN Ingestion Match', style: { stroke: 'var(--accent-secondary)', strokeWidth: 1.5 }, labelStyle: { fill: 'var(--text-muted)', fontSize: 9 } },
        { id: 'e-support-golden', source: 'src-support', target: 'golden-uuid', animated: true, label: 'Email Helpdesk Link', style: { stroke: 'var(--accent-secondary)', strokeWidth: 1.5 }, labelStyle: { fill: 'var(--text-muted)', fontSize: 9 } },
        { id: 'e-marketing-golden', source: 'src-marketing', target: 'golden-uuid', animated: true, label: 'Campaign Click Match', style: { stroke: 'var(--accent-secondary)', strokeWidth: 1.5 }, labelStyle: { fill: 'var(--text-muted)', fontSize: 9 } },
        // Unified Profile identifiers mapping
        { id: 'e-golden-email', source: 'golden-uuid', target: 'id-email', label: 'Primary Email', style: { stroke: 'var(--accent-primary)', strokeWidth: 1.5 }, labelStyle: { fill: 'var(--text-muted)', fontSize: 9 } },
        { id: 'e-golden-phone', source: 'golden-uuid', target: 'id-phone', label: 'Primary Phone', style: { stroke: 'var(--accent-primary)', strokeWidth: 1.5 }, labelStyle: { fill: 'var(--text-muted)', fontSize: 9 } },
        { id: 'e-golden-pan', source: 'golden-uuid', target: 'id-pan', label: 'Verified PAN', style: { stroke: 'var(--accent-primary)', strokeWidth: 1.5 }, labelStyle: { fill: 'var(--text-muted)', fontSize: 9 } },
        { id: 'e-golden-aadhaar', source: 'golden-uuid', target: 'id-aadhaar', label: 'Verified Aadhaar', style: { stroke: 'var(--accent-primary)', strokeWidth: 1.5 }, labelStyle: { fill: 'var(--text-muted)', fontSize: 9 } }
    ];
    const handleNodeClick = (_, node) => {
        // Look up original label or details
        const match = initialNodes.find(n => n.id === node.id);
        if (match && match.data.details) {
            setSelectedNode({
                label: match.data.label,
                desc: match.data.desc,
                icon: match.data.icon || lucide_react_1.Sparkles,
                details: match.data.details
            });
        }
        else {
            setSelectedNode({
                label: 'Unified Customer Profile',
                desc: 'Permanent Unified Customer profile containing verified identifiers from multiple connected records.',
                icon: lucide_react_1.Sparkles,
                details: {
                    'Customer ID': profile.uuid,
                    'Resolution Engine': 'Rule-based stitcher',
                    'Confidence Rating': `${profile.confidence}%`,
                    'Lineage Sources': 'CRM, Web, Stripe, Support, Campaigns'
                }
            });
        }
    };
    return ((0, jsx_runtime_1.jsxs)("div", { style: { display: 'flex', flexDirection: 'column', gap: '16px' }, children: [(0, jsx_runtime_1.jsxs)("div", { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' }, children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsxs)("h4", { style: { margin: 0, fontSize: '15px', color: 'var(--text-loud)', display: 'flex', alignItems: 'center', gap: '8px' }, children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Layers, { size: 16 }), " Upgraded Enterprise Identity Graph"] }), (0, jsx_runtime_1.jsx)("p", { style: { fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }, children: "Interactive xyflow canvas showing connected channels, matching rules, and verified identifier nodes resolved to the Customer ID." })] }), (0, jsx_runtime_1.jsxs)("div", { style: { display: 'flex', gap: '12px', fontSize: '11px' }, children: [(0, jsx_runtime_1.jsx)("span", { style: { display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--accent-primary)' }, children: "\u25CF Unified Profile" }), (0, jsx_runtime_1.jsx)("span", { style: { display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--accent-secondary)' }, children: "\u25CF Ingest Source" }), (0, jsx_runtime_1.jsx)("span", { style: { display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-muted)' }, children: "\u25CF Linked ID" })] })] }), (0, jsx_runtime_1.jsxs)("div", { style: { display: 'flex', gap: '16px' }, children: [(0, jsx_runtime_1.jsx)("div", { className: "c360-graph-container", style: { flex: 1, minHeight: '480px', height: '480px', position: 'relative', border: '1px solid var(--grid-line-minor)', borderRadius: 'var(--radius-lg)' }, children: (0, jsx_runtime_1.jsxs)(react_2.ReactFlow, { nodes: initialNodes, edges: initialEdges, onNodeClick: handleNodeClick, fitView: true, style: { width: '100%', height: '100%' }, children: [(0, jsx_runtime_1.jsx)(react_2.Background, { color: "var(--grid-line-minor)", variant: react_2.BackgroundVariant.Dots }), (0, jsx_runtime_1.jsx)(react_2.Controls, { style: { background: 'var(--bg-surface)', border: '1px solid var(--grid-line-major)', color: 'var(--text-default)' } })] }) }), (0, jsx_runtime_1.jsx)("div", { style: { width: '300px', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--grid-line-minor)', borderRadius: 'var(--radius-lg)', padding: '16px', display: 'flex', flexDirection: 'column' }, children: selectedNode ? ((0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsxs)("div", { style: { display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--grid-line-minor)', paddingBottom: '10px', marginBottom: '12px' }, children: [(0, jsx_runtime_1.jsx)(selectedNode.icon, { size: 16, style: { color: 'var(--accent-primary)' } }), (0, jsx_runtime_1.jsx)("h5", { style: { margin: 0, fontSize: '13px', color: 'var(--text-loud)' }, children: typeof selectedNode.label === 'string' ? selectedNode.label : 'Unified record' })] }), (0, jsx_runtime_1.jsx)("p", { style: { fontSize: '11px', color: 'var(--text-muted)', marginBottom: '12px' }, children: selectedNode.desc }), (0, jsx_runtime_1.jsx)("div", { style: { display: 'flex', flexDirection: 'column', gap: '10px' }, children: Object.entries(selectedNode.details).map(([key, val]) => ((0, jsx_runtime_1.jsxs)("div", { style: { display: 'flex', flexDirection: 'column', gap: '2px' }, children: [(0, jsx_runtime_1.jsx)("span", { style: { fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-muted)' }, children: key }), (0, jsx_runtime_1.jsx)("span", { style: { fontSize: '12px', color: 'var(--text-loud)', fontFamily: 'monospace', wordBreak: 'break-all' }, children: val })] }, key))) })] })) : ((0, jsx_runtime_1.jsxs)("div", { style: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)', textAlign: 'center', padding: '20px' }, children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Info, { size: 24, style: { marginBottom: '8px' } }), (0, jsx_runtime_1.jsx)("p", { style: { fontSize: '12px' }, children: "Click any node on the graph canvas (CRM, Stripe, Web, or Unified Record) to inspect metadata and matching rules." })] })) })] })] }));
}
