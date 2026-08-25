"use client";
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = ContexthousePage;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const Sidebar_1 = __importDefault(require("@/components/Sidebar"));
const ThemeToggle_1 = __importDefault(require("@/components/ThemeToggle"));
const lucide_react_1 = require("lucide-react");
require("./contexthouse.css");
function ContexthousePage() {
    const [rawList, setRawList] = (0, react_1.useState)([
        { name: 'src_hubspot_contacts', id: 'hubspot' },
        { name: 'src_snow_telemetry', id: 'snow' },
        { name: 'src_sdk_events', id: 'sdk' }
    ]);
    const [normalizedList, setNormalizedList] = (0, react_1.useState)([
        { name: 'stg_users', path: 'stg_users' },
        { name: 'stg_pageviews', path: 'stg_pageviews' }
    ]);
    const [identityList, setIdentityList] = (0, react_1.useState)([
        { profile_id: 'kp_9821', email: 'sarah.j@example.com', first_seen: '2026-07-20 14:22:00', intent_score: 92, lifecycle_stage: 'MQL' },
        { profile_id: 'kp_9822', email: 'm.roberts@acme.inc', first_seen: '2026-07-21 09:11:43', intent_score: 65, lifecycle_stage: 'Lead' },
        { profile_id: 'kp_9823', email: 'alex@startups.co', first_seen: '2026-07-22 18:45:10', intent_score: 88, lifecycle_stage: 'SQL' },
        { profile_id: 'kp_9824', email: 'unknown_lead', first_seen: '2026-07-23 11:05:00', intent_score: 21, lifecycle_stage: 'Prospect' }
    ]);
    const [activeCatalog, setActiveCatalog] = (0, react_1.useState)('dim_known_profiles');
    const [activeCategory, setActiveCategory] = (0, react_1.useState)('identity');
    const [searchQuery, setSearchQuery] = (0, react_1.useState)('');
    const [loading, setLoading] = (0, react_1.useState)(true);
    (0, react_1.useEffect)(() => {
        async function loadAssets() {
            try {
                const res = await fetch('/api/v1/assets');
                if (res.ok) {
                    const data = await res.json();
                    const rawData = data.raw || data.rawList || data.bronze || data.bronzeList;
                    if (rawData?.length > 0) {
                        setRawList(prev => [
                            ...rawData.map((item) => ({ name: item.name.replace(/\.[^/.]+$/, ''), id: item.id })),
                            ...prev
                        ]);
                    }
                    const normalizedData = data.normalized || data.normalizedList || data.silver || data.silverList;
                    if (normalizedData?.length > 0) {
                        setNormalizedList(prev => [
                            ...normalizedData.map((item) => ({ name: item.name, path: item.path })),
                            ...prev
                        ]);
                    }
                    if (data.identityList?.length > 0) {
                        setIdentityList(prev => [
                            ...data.identityList,
                            ...prev
                        ]);
                    }
                }
            }
            catch (err) {
                console.error('Failed to load dynamic assets:', err);
            }
            finally {
                setLoading(false);
            }
        }
        loadAssets();
    }, []);
    const handleSelectItem = (name, category) => {
        setActiveCatalog(name);
        setActiveCategory(category);
    };
    const getFilteredProfiles = () => {
        if (!searchQuery)
            return identityList;
        return identityList.filter(p => p.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.profile_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.lifecycle_stage.toLowerCase().includes(searchQuery.toLowerCase()));
    };
    const activeProfileDetails = identityList.find(p => p.profile_id === activeCatalog || p.email === activeCatalog) || identityList[0];
    return ((0, jsx_runtime_1.jsxs)("div", { className: "app-layout", children: [(0, jsx_runtime_1.jsx)(Sidebar_1.default, {}), (0, jsx_runtime_1.jsxs)("main", { className: "main-content", children: [(0, jsx_runtime_1.jsxs)("header", { className: "top-header", children: [(0, jsx_runtime_1.jsxs)("div", { className: "header-breadcrumbs", children: [(0, jsx_runtime_1.jsx)("span", { className: "muted", children: "Platform" }), " / ", (0, jsx_runtime_1.jsx)("span", { className: "active-breadcrumb", children: "Data Contexthouse" })] }), (0, jsx_runtime_1.jsxs)("div", { className: "header-actions", children: [(0, jsx_runtime_1.jsx)(ThemeToggle_1.default, {}), (0, jsx_runtime_1.jsx)("div", { className: "avatar", children: "AD" })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "contexthouse-wrapper", children: [(0, jsx_runtime_1.jsxs)("div", { className: "asset-browser", children: [(0, jsx_runtime_1.jsxs)("div", { className: "browser-header", children: [(0, jsx_runtime_1.jsx)("h3", { children: "Assets" }), (0, jsx_runtime_1.jsxs)("div", { className: "search-bar", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Search, { size: 14 }), (0, jsx_runtime_1.jsx)("input", { type: "text", placeholder: "Search catalogs...", value: searchQuery, onChange: e => setSearchQuery(e.target.value) })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "tree-group", children: [(0, jsx_runtime_1.jsxs)("div", { className: "tree-group-title", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.HardDrive, { size: 14 }), " Raw Imported Data"] }), rawList.map((item, idx) => ((0, jsx_runtime_1.jsx)("div", { className: `tree-item ${activeCatalog === item.name ? 'active' : ''}`, onClick: () => handleSelectItem(item.name, 'raw'), children: item.name }, `${item.name}-${idx}`)))] }), (0, jsx_runtime_1.jsxs)("div", { className: "tree-group", children: [(0, jsx_runtime_1.jsxs)("div", { className: "tree-group-title", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Layers, { size: 14 }), " Clean & Standardized Data"] }), normalizedList.map((item, idx) => ((0, jsx_runtime_1.jsx)("div", { className: `tree-item ${activeCatalog === item.name ? 'active' : ''}`, onClick: () => handleSelectItem(item.name, 'normalized'), children: item.name }, `${item.name}-${idx}`)))] }), (0, jsx_runtime_1.jsxs)("div", { className: "tree-group", children: [(0, jsx_runtime_1.jsxs)("div", { className: "tree-group-title active-tree-title", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Workflow, { size: 14 }), " Identity Graph"] }), (0, jsx_runtime_1.jsx)("div", { className: `tree-item ${activeCatalog === 'dim_known_profiles' ? 'active' : ''}`, onClick: () => handleSelectItem('dim_known_profiles', 'identity'), children: "Known Customer Profiles" }), (0, jsx_runtime_1.jsx)("div", { className: `tree-item ${activeCatalog === 'dim_anonymous_profiles' ? 'active' : ''}`, onClick: () => handleSelectItem('dim_anonymous_profiles', 'identity'), children: "Anonymous Visitor Profiles" })] }), (0, jsx_runtime_1.jsxs)("div", { className: "tree-group", children: [(0, jsx_runtime_1.jsxs)("div", { className: "tree-group-title", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Star, { size: 14 }), " Business Ready Data"] }), (0, jsx_runtime_1.jsx)("div", { className: "tree-item", children: "fct_activation_metrics" }), (0, jsx_runtime_1.jsx)("div", { className: "tree-item", children: "fct_engine_scores" })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "data-grid-container", children: [(0, jsx_runtime_1.jsxs)("div", { className: "grid-header", children: [(0, jsx_runtime_1.jsxs)("div", { className: "grid-title", children: [(0, jsx_runtime_1.jsx)("h2", { children: activeCatalog }), (0, jsx_runtime_1.jsxs)("span", { className: "badge badge-certified", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.ShieldCheck, { size: 12 }), " Certified"] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "grid-actions", children: [(0, jsx_runtime_1.jsxs)("button", { className: "btn-secondary", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Filter, { size: 14 }), " Filter"] }), (0, jsx_runtime_1.jsx)("button", { className: "btn-icon", children: (0, jsx_runtime_1.jsx)(lucide_react_1.MoreHorizontal, { size: 16 }) })] })] }), (0, jsx_runtime_1.jsx)("div", { className: "table-wrapper", children: activeCategory === 'identity' || activeCategory === 'normalized' ? ((0, jsx_runtime_1.jsxs)("table", { className: "data-table", children: [(0, jsx_runtime_1.jsx)("thead", { children: (0, jsx_runtime_1.jsxs)("tr", { children: [(0, jsx_runtime_1.jsx)("th", { children: "profile_id" }), (0, jsx_runtime_1.jsx)("th", { children: "email" }), (0, jsx_runtime_1.jsx)("th", { children: "first_seen" }), (0, jsx_runtime_1.jsx)("th", { children: "intent_score" }), (0, jsx_runtime_1.jsx)("th", { children: "lifecycle_stage" })] }) }), (0, jsx_runtime_1.jsx)("tbody", { children: getFilteredProfiles().map((profile, idx) => ((0, jsx_runtime_1.jsxs)("tr", { style: { cursor: 'pointer' }, onClick: () => setActiveCatalog(profile.profile_id), children: [(0, jsx_runtime_1.jsx)("td", { children: (0, jsx_runtime_1.jsx)("span", { className: "code-cell", children: profile.profile_id }) }), (0, jsx_runtime_1.jsx)("td", { children: profile.email }), (0, jsx_runtime_1.jsx)("td", { suppressHydrationWarning: true, children: new Date(profile.first_seen).toLocaleString() }), (0, jsx_runtime_1.jsx)("td", { children: (0, jsx_runtime_1.jsx)("span", { className: profile.intent_score > 80 ? "metric-high" : profile.intent_score > 50 ? "metric-med" : "metric-low", children: profile.intent_score }) }), (0, jsx_runtime_1.jsx)("td", { children: (0, jsx_runtime_1.jsx)("span", { className: "tag", children: profile.lifecycle_stage }) })] }, idx))) })] })) : ((0, jsx_runtime_1.jsxs)("div", { style: { padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }, children: [(0, jsx_runtime_1.jsx)("h4", { children: "No records in viewport" }), (0, jsx_runtime_1.jsx)("p", { style: { fontSize: '13px', marginTop: '6px' }, children: "Showing preview for raw metadata registry. Select \"dim_known_profiles\" to inspect linked identity vectors." })] })) })] }), (0, jsx_runtime_1.jsxs)("div", { className: "metadata-inspector", children: [(0, jsx_runtime_1.jsx)("div", { className: "inspector-header", children: (0, jsx_runtime_1.jsx)("h3", { children: "Asset Details" }) }), (0, jsx_runtime_1.jsxs)("div", { className: "inspector-content", children: [(0, jsx_runtime_1.jsxs)("div", { className: "metadata-section", children: [(0, jsx_runtime_1.jsxs)("h4", { children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Bot, { size: 14 }), " AI Summary"] }), (0, jsx_runtime_1.jsx)("p", { className: "ai-text", children: activeCategory === 'identity'
                                                            ? `This table contains deterministic, identity-stitched profiles merged from HubSpot and active telemetry. It is the primary driving table for all downstream Agency Agents.`
                                                            : `Raw or schema-conformed staging directory in Conductor Raw Lake, registered by active connector workers.` })] }), activeProfileDetails && activeCategory === 'identity' && ((0, jsx_runtime_1.jsxs)("div", { className: "metadata-section", style: { borderTop: '1px solid var(--grid-line-minor)', paddingTop: '12px' }, children: [(0, jsx_runtime_1.jsx)("h4", { children: "Stitching Details" }), (0, jsx_runtime_1.jsxs)("div", { style: { fontSize: '12px', color: 'var(--text-default)', display: 'flex', flexDirection: 'column', gap: '6px' }, children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("strong", { children: "Reason:" }), " ", activeProfileDetails.matching_reason || 'Unique Primary Identifier Match'] }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("strong", { children: "Lineage:" }), " ", activeProfileDetails.ingestion_lineage || 'Ingested'] })] })] })), (0, jsx_runtime_1.jsxs)("div", { className: "metadata-section", children: [(0, jsx_runtime_1.jsx)("h4", { children: "Columns (5)" }), (0, jsx_runtime_1.jsxs)("div", { className: "column-list", children: [(0, jsx_runtime_1.jsxs)("div", { className: "col-item", children: [(0, jsx_runtime_1.jsx)("span", { className: "col-name", children: "profile_id" }), (0, jsx_runtime_1.jsx)("span", { className: "col-type", children: "VARCHAR" })] }), (0, jsx_runtime_1.jsxs)("div", { className: "col-item", children: [(0, jsx_runtime_1.jsx)("span", { className: "col-name", children: "email" }), (0, jsx_runtime_1.jsx)("span", { className: "col-type", children: "VARCHAR" }), (0, jsx_runtime_1.jsx)("span", { className: "tag pii-tag", children: "PII" })] }), (0, jsx_runtime_1.jsxs)("div", { className: "col-item", children: [(0, jsx_runtime_1.jsx)("span", { className: "col-name", children: "intent_score" }), (0, jsx_runtime_1.jsx)("span", { className: "col-type", children: "INT" })] })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "metadata-section", children: [(0, jsx_runtime_1.jsxs)("h4", { children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Network, { size: 14 }), " Lineage Preview"] }), (0, jsx_runtime_1.jsxs)("div", { className: "mini-lineage", children: [(0, jsx_runtime_1.jsx)("div", { className: "lineage-node", children: activeCategory === 'raw' ? activeCatalog : 'stg_users' }), (0, jsx_runtime_1.jsx)("div", { className: "lineage-arrow", children: "\u2193" }), (0, jsx_runtime_1.jsx)("div", { className: "lineage-node active", children: activeCatalog }), (0, jsx_runtime_1.jsx)("div", { className: "lineage-arrow", children: "\u2193" }), (0, jsx_runtime_1.jsx)("div", { className: "lineage-node", children: "agent-email" })] })] })] })] })] })] })] }));
}
