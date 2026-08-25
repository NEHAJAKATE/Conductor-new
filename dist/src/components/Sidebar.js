"use client";
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Sidebar;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const link_1 = __importDefault(require("next/link"));
const navigation_1 = require("next/navigation");
const lucide_react_1 = require("lucide-react");
require("./sidebar.css");
function Sidebar() {
    const [collapsed, setCollapsed] = (0, react_1.useState)(false);
    const [userRole, setUserRole] = (0, react_1.useState)('OWNER');
    const pathname = (0, navigation_1.usePathname)();
    (0, react_1.useEffect)(() => {
        const checkSession = async () => {
            try {
                const token = localStorage.getItem('conductor_session_token');
                const res = await fetch('/api/v1/auth/session', {
                    headers: token ? { 'Authorization': `Bearer ${token}` } : {},
                });
                if (res.ok) {
                    const data = await res.json();
                    if (data.authenticated && data.user?.role) {
                        setUserRole(data.user.role);
                        localStorage.setItem('conductor_user_role', data.user.role);
                    }
                }
            }
            catch (err) {
                console.error('Session check error:', err);
            }
        };
        checkSession();
    }, []);
    const handleSignOut = () => {
        localStorage.removeItem('conductor_session_token');
        localStorage.removeItem('conductor_user_role');
        document.cookie = 'conductor_session=; Max-Age=0; path=/;';
        window.location.href = '/login';
    };
    const getNavClass = (path) => {
        return `nav-link ${pathname === path ? 'active' : ''}`;
    };
    const isOwner = userRole === 'OWNER';
    return ((0, jsx_runtime_1.jsxs)("aside", { className: `sidebar ${collapsed ? 'collapsed' : ''}`, children: [(0, jsx_runtime_1.jsxs)("div", { className: "sidebar-header", children: [(0, jsx_runtime_1.jsx)("div", { className: "logo-placeholder", children: "ATC" }), !collapsed && (0, jsx_runtime_1.jsx)("h2", { children: "Conductor" }), (0, jsx_runtime_1.jsx)("button", { className: "collapse-btn", onClick: () => setCollapsed(!collapsed), "aria-label": "Toggle Sidebar", children: collapsed ? (0, jsx_runtime_1.jsx)(lucide_react_1.PanelLeftOpen, { size: 18 }) : (0, jsx_runtime_1.jsx)(lucide_react_1.PanelLeftClose, { size: 18 }) })] }), !collapsed && ((0, jsx_runtime_1.jsxs)("div", { style: {
                    padding: '0.5rem 1rem',
                    margin: '0.5rem 0.8rem',
                    background: isOwner ? 'rgba(52, 211, 153, 0.1)' : 'rgba(96, 165, 250, 0.1)',
                    border: `1px solid ${isOwner ? 'rgba(52, 211, 153, 0.3)' : 'rgba(96, 165, 250, 0.3)'}`,
                    borderRadius: '6px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: '0.75rem',
                }, children: [(0, jsx_runtime_1.jsxs)("div", { style: { display: 'flex', alignItems: 'center', gap: '0.4rem', color: isOwner ? '#34d399' : '#60a5fa' }, children: [isOwner ? (0, jsx_runtime_1.jsx)(lucide_react_1.ShieldCheck, { size: 14 }) : (0, jsx_runtime_1.jsx)(lucide_react_1.UserCheck, { size: 14 }), (0, jsx_runtime_1.jsxs)("strong", { children: ["Role: ", userRole] })] }), (0, jsx_runtime_1.jsx)("span", { style: { fontSize: '0.7rem', color: '#94a3b8' }, children: isOwner ? 'Executive' : 'Staff' })] })), (0, jsx_runtime_1.jsxs)("nav", { className: "sidebar-nav", children: [(0, jsx_runtime_1.jsxs)("div", { className: "nav-group", children: [!collapsed && (0, jsx_runtime_1.jsx)("p", { className: "nav-group-title", children: "Overview & Customers" }), (0, jsx_runtime_1.jsxs)(link_1.default, { href: "/", className: getNavClass('/'), children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Workflow, { size: 18 }), !collapsed && (0, jsx_runtime_1.jsx)("span", { children: "Live Overview" })] }), (0, jsx_runtime_1.jsxs)(link_1.default, { href: "/business360", className: getNavClass('/business360'), children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Building2, { size: 18 }), !collapsed && (0, jsx_runtime_1.jsx)("span", { children: "B2B Directory" })] }), isOwner && ((0, jsx_runtime_1.jsxs)(link_1.default, { href: "/customer360", className: getNavClass('/customer360'), children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Users, { size: 18 }), !collapsed && (0, jsx_runtime_1.jsx)("span", { children: "Customer 360" })] }))] }), (0, jsx_runtime_1.jsxs)("div", { className: "nav-group", children: [!collapsed && (0, jsx_runtime_1.jsx)("p", { className: "nav-group-title", children: "Shop Operations" }), (0, jsx_runtime_1.jsxs)(link_1.default, { href: "/sales", className: getNavClass('/sales'), children: [(0, jsx_runtime_1.jsx)(lucide_react_1.TrendingUp, { size: 18 }), !collapsed && (0, jsx_runtime_1.jsx)("span", { children: "Sales (Invoices)" })] }), (0, jsx_runtime_1.jsxs)(link_1.default, { href: "/purchases", className: getNavClass('/purchases'), children: [(0, jsx_runtime_1.jsx)(lucide_react_1.ShoppingBag, { size: 18 }), !collapsed && (0, jsx_runtime_1.jsx)("span", { children: "Purchases (Spend)" })] }), (0, jsx_runtime_1.jsxs)(link_1.default, { href: "/inventory", className: getNavClass('/inventory'), children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Boxes, { size: 18 }), !collapsed && (0, jsx_runtime_1.jsx)("span", { children: "Stock & Reorder" })] }), (0, jsx_runtime_1.jsxs)(link_1.default, { href: "/outstanding", className: getNavClass('/outstanding'), children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Clock, { size: 18 }), !collapsed && (0, jsx_runtime_1.jsx)("span", { children: "Receivables & Ageing" })] }), isOwner && ((0, jsx_runtime_1.jsxs)(link_1.default, { href: "/reconciliation", className: getNavClass('/reconciliation'), children: [(0, jsx_runtime_1.jsx)(lucide_react_1.ArrowRightLeft, { size: 18 }), !collapsed && (0, jsx_runtime_1.jsx)("span", { children: "Bank Reconciliation" })] })), (0, jsx_runtime_1.jsxs)(link_1.default, { href: "/reports", className: getNavClass('/reports'), children: [(0, jsx_runtime_1.jsx)(lucide_react_1.FileBarChart, { size: 18 }), !collapsed && (0, jsx_runtime_1.jsx)("span", { children: "Custom Reports" })] })] }), isOwner && ((0, jsx_runtime_1.jsxs)("div", { className: "nav-group", children: [!collapsed && (0, jsx_runtime_1.jsx)("p", { className: "nav-group-title", children: "Data & Pipelines" }), (0, jsx_runtime_1.jsxs)(link_1.default, { href: "/ingestion", className: getNavClass('/ingestion'), children: [(0, jsx_runtime_1.jsx)(lucide_react_1.UploadCloud, { size: 18 }), !collapsed && (0, jsx_runtime_1.jsx)("span", { children: "Connect Data" })] }), (0, jsx_runtime_1.jsxs)(link_1.default, { href: "/integrations", className: getNavClass('/integrations'), children: [(0, jsx_runtime_1.jsx)(lucide_react_1.CalendarCheck, { size: 18 }), !collapsed && (0, jsx_runtime_1.jsx)("span", { children: "ERP Sync Jobs" })] }), (0, jsx_runtime_1.jsxs)(link_1.default, { href: "/workflows", className: getNavClass('/workflows'), children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Zap, { size: 18 }), !collapsed && (0, jsx_runtime_1.jsx)("span", { children: "Alerts & Rules" })] }), (0, jsx_runtime_1.jsxs)(link_1.default, { href: "/contexthouse", className: getNavClass('/contexthouse'), children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Database, { size: 18 }), !collapsed && (0, jsx_runtime_1.jsx)("span", { children: "Data Schema Lineage" })] })] }))] }), (0, jsx_runtime_1.jsxs)("div", { className: "sidebar-footer", children: [(0, jsx_runtime_1.jsxs)(link_1.default, { href: "/settings", className: "nav-link", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Settings, { size: 18 }), !collapsed && (0, jsx_runtime_1.jsx)("span", { children: "Settings" })] }), (0, jsx_runtime_1.jsxs)(link_1.default, { href: "/login", className: "nav-link text-danger", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.LogOut, { size: 18 }), !collapsed && (0, jsx_runtime_1.jsx)("span", { children: "Sign Out" })] })] })] }));
}
