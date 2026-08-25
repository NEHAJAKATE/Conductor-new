"use client";
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = DestinationsPage;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = __importStar(require("react"));
const Sidebar_1 = __importDefault(require("@/components/Sidebar"));
const ThemeToggle_1 = __importDefault(require("@/components/ThemeToggle"));
const lucide_react_1 = require("lucide-react");
require("./destinations.css");
function DestinationsPage() {
    // Navigation & Data State
    const [activeTab, setActiveTab] = (0, react_1.useState)('overview');
    const [segments, setSegments] = (0, react_1.useState)([]);
    const [syncJobs, setSyncJobs] = (0, react_1.useState)([]);
    const [profiles, setProfiles] = (0, react_1.useState)([]);
    const [summary, setSummary] = (0, react_1.useState)({ totalSynced: 0, totalRevenue: 0, avgRoi: 0, campaignsCount: 0 });
    // Executive sync actions
    const [selectedSegment, setSelectedSegment] = (0, react_1.useState)('');
    const [selectedDest, setSelectedDest] = (0, react_1.useState)('meta');
    const [isSyncing, setIsSyncing] = (0, react_1.useState)(false);
    const [expandedJob, setExpandedJob] = (0, react_1.useState)(null);
    // Audience Builder Workflow States
    const [newAudienceName, setNewAudienceName] = (0, react_1.useState)('');
    const [newAudienceDesc, setNewAudienceDesc] = (0, react_1.useState)('');
    const [newAudienceGoal, setNewAudienceGoal] = (0, react_1.useState)('Conversion Lift');
    const [newRules, setNewRules] = (0, react_1.useState)([
        { field: 'country', operator: 'equals', value: 'India' }
    ]);
    const [liveEstimatedSize, setLiveEstimatedSize] = (0, react_1.useState)(0);
    const [isPreviewLoading, setIsPreviewLoading] = (0, react_1.useState)(false);
    // Preview tab selected segment
    const [previewSegmentId, setPreviewSegmentId] = (0, react_1.useState)('');
    const [previewProfiles, setPreviewProfiles] = (0, react_1.useState)([]);
    // Load backend segments, sync jobs, and customer list
    const loadData = async () => {
        try {
            const segRes = await fetch('/api/v1/segments');
            if (segRes.ok) {
                const segData = await segRes.json();
                setSegments(segData);
                if (segData.length > 0) {
                    setSelectedSegment(segData[0].id);
                    setPreviewSegmentId(segData[0].id);
                }
            }
            const syncRes = await fetch('/api/v1/destinations');
            if (syncRes.ok) {
                const syncData = await syncRes.json();
                setSyncJobs(syncData.jobs || []);
                setSummary(syncData.summary || { totalSynced: 0, totalRevenue: 0, avgRoi: 0, campaignsCount: 0 });
            }
            const profRes = await fetch('/api/v1/customer360');
            if (profRes.ok) {
                const profData = await profRes.json();
                setProfiles(profData.profiles || []);
            }
        }
        catch (err) {
            console.error('Failed to load destinations dashboard data:', err);
        }
    };
    (0, react_1.useEffect)(() => {
        loadData();
    }, []);
    // Compute live match preview size on rules edit
    (0, react_1.useEffect)(() => {
        if (profiles.length === 0)
            return;
        setIsPreviewLoading(true);
        // Dynamic matching rule evaluator (runs in-memory for preview dashboard speed)
        const matches = profiles.filter(p => {
            if (newRules.length === 0)
                return false;
            for (const rule of newRules) {
                const check = evaluateRuleInMemory(p, rule);
                if (!check)
                    return false;
            }
            return true;
        });
        setLiveEstimatedSize(matches.length);
        setIsPreviewLoading(false);
    }, [newRules, profiles]);
    // Load preview profile matches based on dropdown selection
    (0, react_1.useEffect)(() => {
        if (!previewSegmentId || segments.length === 0 || profiles.length === 0)
            return;
        const activeSeg = segments.find(s => s.id === previewSegmentId);
        if (!activeSeg)
            return;
        const matches = profiles.filter(p => {
            if (!activeSeg.rules || activeSeg.rules.length === 0)
                return false;
            for (const rule of activeSeg.rules) {
                const check = evaluateRuleInMemory(p, rule);
                if (!check)
                    return false;
            }
            return true;
        });
        setPreviewProfiles(matches);
    }, [previewSegmentId, segments, profiles]);
    // Evaluates a rule in memory
    const evaluateRuleInMemory = (profile, rule) => {
        const { field, operator, value } = rule;
        const ruleValLower = value.toLowerCase();
        let fieldVal = '';
        if (field === 'country') {
            fieldVal = profile.location || '';
        }
        else if (field === 'spent') {
            // Approximate spent value
            fieldVal = profile.riskScore > 50 ? 12000 : 2500;
        }
        else if (field === 'risk_score') {
            fieldVal = profile.riskScore || 0;
        }
        else if (field === 'quality_score') {
            fieldVal = profile.confidence || 0;
        }
        else if (field === 'email_exists') {
            fieldVal = profile.email && !profile.email.includes('anonymous') ? 'true' : '';
        }
        else {
            fieldVal = profile.segment || 'Regular';
        }
        const strVal = String(fieldVal).toLowerCase();
        const numVal = Number(fieldVal);
        const numRule = Number(value);
        switch (operator) {
            case 'equals': return strVal === ruleValLower;
            case 'not_equals': return strVal !== ruleValLower;
            case 'greater_than': return numVal > numRule;
            case 'less_than': return numVal < numRule;
            case 'greater_than_or_equal': return numVal >= numRule;
            case 'less_than_or_equal': return numVal <= numRule;
            case 'contains': return strVal.includes(ruleValLower);
            case 'does_not_contain': return !strVal.includes(ruleValLower);
            case 'starts_with': return strVal.startsWith(ruleValLower);
            case 'ends_with': return strVal.endsWith(ruleValLower);
            case 'regex':
                try {
                    return new RegExp(value, 'i').test(String(fieldVal));
                }
                catch {
                    return false;
                }
            case 'exists':
                return fieldVal !== undefined && fieldVal !== null && fieldVal !== '';
            case 'does_not_exist':
                return fieldVal === undefined || fieldVal === null || fieldVal === '';
            case 'in_list':
                return value.split(',').map(s => s.trim().toLowerCase()).includes(strVal);
            case 'not_in_list':
                return !value.split(',').map(s => s.trim().toLowerCase()).includes(strVal);
            case 'between': {
                const parts = value.split(',').map(Number);
                return parts.length === 2 && numVal >= parts[0] && numVal <= parts[1];
            }
            case 'not_between': {
                const parts = value.split(',').map(Number);
                return parts.length === 2 && (numVal < parts[0] || numVal > parts[1]);
            }
            default: return false;
        }
    };
    const handleSyncSubmit = async (e) => {
        e.preventDefault();
        if (!selectedSegment)
            return;
        setIsSyncing(true);
        try {
            const res = await fetch('/api/v1/destinations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    segmentId: selectedSegment,
                    destination: selectedDest
                })
            });
            if (res.ok) {
                await loadData();
                alert('Business action executed successfully!');
            }
            else {
                const err = await res.json();
                alert(err.message || 'Action execution failed.');
            }
        }
        catch (err) {
            console.error(err);
            alert('Error executing business action.');
        }
        finally {
            setIsSyncing(false);
        }
    };
    const handleSaveAudience = async (e) => {
        e.preventDefault();
        if (!newAudienceName)
            return;
        try {
            const res = await fetch('/api/v1/segments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: newAudienceName,
                    description: newAudienceDesc || `Goal: ${newAudienceGoal}`,
                    rules: newRules
                })
            });
            if (res.ok) {
                setNewAudienceName('');
                setNewAudienceDesc('');
                await loadData();
                alert('Audience saved successfully!');
                setActiveTab('saved_audiences');
            }
            else {
                const err = await res.json();
                alert(err.message || 'Failed to save audience.');
            }
        }
        catch (err) {
            console.error(err);
            alert('Error saving audience.');
        }
    };
    const addRule = () => {
        setNewRules([...newRules, { field: 'country', operator: 'equals', value: '' }]);
    };
    const removeRule = (idx) => {
        setNewRules(newRules.filter((_, i) => i !== idx));
    };
    const updateRule = (idx, updates) => {
        setNewRules(newRules.map((r, i) => i === idx ? { ...r, ...updates } : r));
    };
    const handleDeleteSegment = async (id) => {
        if (!confirm('Are you sure you want to delete this saved audience?'))
            return;
        try {
            const res = await fetch(`/api/v1/segments?id=${id}`, {
                method: 'DELETE'
            });
            if (res.ok) {
                await loadData();
            }
        }
        catch (err) {
            console.error(err);
        }
    };
    return ((0, jsx_runtime_1.jsxs)("div", { className: "app-layout", children: [(0, jsx_runtime_1.jsx)(Sidebar_1.default, {}), (0, jsx_runtime_1.jsxs)("main", { className: "main-content", children: [(0, jsx_runtime_1.jsxs)("header", { className: "top-header", children: [(0, jsx_runtime_1.jsxs)("div", { className: "header-breadcrumbs", children: [(0, jsx_runtime_1.jsx)("span", { className: "muted", children: "Audience Console" }), " / ", (0, jsx_runtime_1.jsx)("span", { className: "active-breadcrumb", children: activeTab.toUpperCase().replace('_', ' ') })] }), (0, jsx_runtime_1.jsxs)("div", { className: "header-actions", children: [(0, jsx_runtime_1.jsx)(ThemeToggle_1.default, {}), (0, jsx_runtime_1.jsx)("div", { className: "avatar", children: "CDP" })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "destinations-wrapper", children: [(0, jsx_runtime_1.jsxs)("div", { className: "dest-metrics-grid", style: { gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '20px' }, children: [(0, jsx_runtime_1.jsxs)("div", { className: "dest-metric-card", children: [(0, jsx_runtime_1.jsxs)("div", { className: "card-header", children: [(0, jsx_runtime_1.jsx)("span", { className: "metric-label", children: "Synced Audience Size" }), (0, jsx_runtime_1.jsx)(lucide_react_1.Send, { size: 16, className: "text-primary" })] }), (0, jsx_runtime_1.jsx)("div", { className: "metric-value", children: summary.totalSynced }), (0, jsx_runtime_1.jsxs)("div", { className: "metric-footer success", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.TrendingUp, { size: 12 }), " Live Sync Active"] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "dest-metric-card", children: [(0, jsx_runtime_1.jsxs)("div", { className: "card-header", children: [(0, jsx_runtime_1.jsx)("span", { className: "metric-label", children: "Attributed Revenue" }), (0, jsx_runtime_1.jsx)(lucide_react_1.DollarSign, { size: 16, className: "text-secondary" })] }), (0, jsx_runtime_1.jsxs)("div", { className: "metric-value", children: ["$", summary.totalRevenue?.toLocaleString()] }), (0, jsx_runtime_1.jsxs)("div", { className: "metric-footer success", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.TrendingUp, { size: 12 }), " Campaign Attributions"] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "dest-metric-card", children: [(0, jsx_runtime_1.jsxs)("div", { className: "card-header", children: [(0, jsx_runtime_1.jsx)("span", { className: "metric-label", children: "Average Campaign ROI" }), (0, jsx_runtime_1.jsx)(lucide_react_1.Activity, { size: 16, className: "text-success" })] }), (0, jsx_runtime_1.jsxs)("div", { className: "metric-value", children: [summary.avgRoi, "x"] }), (0, jsx_runtime_1.jsxs)("div", { className: "metric-footer success", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.TrendingUp, { size: 12 }), " Over baseline channel"] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "dest-metric-card", children: [(0, jsx_runtime_1.jsxs)("div", { className: "card-header", children: [(0, jsx_runtime_1.jsx)("span", { className: "metric-label", children: "Active Campaigns" }), (0, jsx_runtime_1.jsx)(lucide_react_1.ShieldCheck, { size: 16, className: "text-info" })] }), (0, jsx_runtime_1.jsx)("div", { className: "metric-value", children: summary.campaignsCount }), (0, jsx_runtime_1.jsx)("div", { className: "metric-footer success", children: "100% Platform Uptime" })] })] }), (0, jsx_runtime_1.jsx)("div", { className: "c360-tabs", style: { marginBottom: '20px' }, children: [
                                    { id: 'overview', label: 'Overview & Sync', icon: (0, jsx_runtime_1.jsx)(lucide_react_1.Send, { size: 14 }) },
                                    { id: 'saved_audiences', label: 'Saved Audiences', icon: (0, jsx_runtime_1.jsx)(lucide_react_1.Layers, { size: 14 }) },
                                    { id: 'filters', label: 'Filters (Audience Builder)', icon: (0, jsx_runtime_1.jsx)(lucide_react_1.Plus, { size: 14 }) },
                                    { id: 'preview', label: 'Audience Previews', icon: (0, jsx_runtime_1.jsx)(lucide_react_1.Eye, { size: 14 }) },
                                    { id: 'journey', label: 'Customer Journey Map', icon: (0, jsx_runtime_1.jsx)(lucide_react_1.Workflow, { size: 14 }) },
                                    { id: 'analytics', label: 'Analytics Insights', icon: (0, jsx_runtime_1.jsx)(lucide_react_1.BarChart3, { size: 14 }) }
                                ].map(t => ((0, jsx_runtime_1.jsxs)("button", { className: `c360-tab-btn ${activeTab === t.id ? 'active' : ''}`, onClick: () => setActiveTab(t.id), children: [(0, jsx_runtime_1.jsx)("span", { style: { display: 'inline-flex', alignItems: 'center', marginRight: '6px' }, children: t.icon }), t.label] }, t.id))) }), activeTab === 'overview' && ((0, jsx_runtime_1.jsxs)("div", { className: "dest-content-grid", children: [(0, jsx_runtime_1.jsxs)("div", { className: "dest-card form-container", children: [(0, jsx_runtime_1.jsx)("h3", { children: "Trigger Business Action" }), (0, jsx_runtime_1.jsx)("p", { className: "card-subtitle", children: "Select a saved cohort and trigger automated campaigns, email notifications, or data exports." }), (0, jsx_runtime_1.jsxs)("form", { onSubmit: handleSyncSubmit, style: { marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }, children: [(0, jsx_runtime_1.jsxs)("div", { className: "form-group", children: [(0, jsx_runtime_1.jsx)("label", { children: "Select Segment Cohort" }), (0, jsx_runtime_1.jsx)("select", { value: selectedSegment, onChange: e => setSelectedSegment(e.target.value), required: true, style: { padding: '10px', width: '100%', borderRadius: '4px', backgroundColor: 'var(--bg-app)', border: '1px solid var(--grid-line-minor)', color: 'var(--text-loud)' }, children: segments.length === 0 ? ((0, jsx_runtime_1.jsx)("option", { value: "", children: "No segments available. Create one first." })) : (segments.map(seg => ((0, jsx_runtime_1.jsxs)("option", { value: seg.id, children: [seg.name, " (", seg.estimatedSize, " Profiles)"] }, seg.id)))) })] }), (0, jsx_runtime_1.jsxs)("div", { className: "form-group", children: [(0, jsx_runtime_1.jsx)("label", { children: "Select Business Action" }), (0, jsx_runtime_1.jsx)("div", { className: "dest-grid-selector", children: [
                                                                    { id: 'meta', label: 'Show Advertisement' },
                                                                    { id: 'email', label: 'Email Customers' },
                                                                    { id: 'sms', label: 'Send SMS / Push' },
                                                                    { id: 'google', label: 'Export Audience' },
                                                                    { id: 'linkedin', label: 'Customer Journey' }
                                                                ].map(d => ((0, jsx_runtime_1.jsx)("button", { type: "button", className: `dest-selector-btn ${selectedDest === d.id ? 'active' : ''}`, onClick: () => setSelectedDest(d.id), children: d.label }, d.id))) })] }), (0, jsx_runtime_1.jsxs)("div", { className: "form-group", children: [(0, jsx_runtime_1.jsx)("label", { children: "Gateway Connection Status" }), (0, jsx_runtime_1.jsxs)("div", { style: { display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px', backgroundColor: 'rgba(5, 150, 105, 0.08)', border: '1px solid rgba(5,105,105,0.2)', color: '#34d399', borderRadius: '4px', fontSize: '12px', fontWeight: 600 }, children: [(0, jsx_runtime_1.jsx)("span", { style: { height: '8px', width: '8px', backgroundColor: '#10b981', borderRadius: '50%', display: 'inline-block' } }), "Authorized & Connected to Corporate Gateway"] })] }), (0, jsx_runtime_1.jsxs)("button", { type: "submit", className: "btn-primary", disabled: isSyncing || segments.length === 0, style: { alignSelf: 'flex-start', marginTop: '8px' }, children: [isSyncing ? (0, jsx_runtime_1.jsx)(lucide_react_1.RefreshCw, { size: 14, className: "animate-spin" }) : (0, jsx_runtime_1.jsx)(lucide_react_1.Send, { size: 14 }), (0, jsx_runtime_1.jsx)("span", { children: isSyncing ? 'Running...' : 'Run Business Action' })] })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "dest-card table-container", children: [(0, jsx_runtime_1.jsxs)("div", { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }, children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("h3", { children: "Business Action History Log" }), (0, jsx_runtime_1.jsx)("p", { className: "card-subtitle", children: "Real-time status of marketing activations and campaign metrics." })] }), (0, jsx_runtime_1.jsx)("button", { className: "btn-icon", onClick: loadData, children: (0, jsx_runtime_1.jsx)(lucide_react_1.RefreshCw, { size: 16 }) })] }), (0, jsx_runtime_1.jsx)("div", { className: "table-wrapper", children: (0, jsx_runtime_1.jsxs)("table", { className: "dest-table", children: [(0, jsx_runtime_1.jsx)("thead", { children: (0, jsx_runtime_1.jsxs)("tr", { children: [(0, jsx_runtime_1.jsx)("th", { children: "Job ID" }), (0, jsx_runtime_1.jsx)("th", { children: "Segment Cohort" }), (0, jsx_runtime_1.jsx)("th", { children: "Action" }), (0, jsx_runtime_1.jsx)("th", { children: "Status" }), (0, jsx_runtime_1.jsx)("th", { children: "Rows" }), (0, jsx_runtime_1.jsx)("th", { children: "Latency" }), (0, jsx_runtime_1.jsx)("th", {})] }) }), (0, jsx_runtime_1.jsx)("tbody", { children: syncJobs.length === 0 ? ((0, jsx_runtime_1.jsx)("tr", { children: (0, jsx_runtime_1.jsx)("td", { colSpan: 7, style: { textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }, children: "No sync jobs run yet." }) })) : (syncJobs.map(job => {
                                                                const isExpanded = expandedJob === job.jobId;
                                                                return ((0, jsx_runtime_1.jsxs)(react_1.default.Fragment, { children: [(0, jsx_runtime_1.jsxs)("tr", { className: `job-row-main ${isExpanded ? 'expanded' : ''}`, onClick: () => setExpandedJob(isExpanded ? null : job.jobId), children: [(0, jsx_runtime_1.jsx)("td", { children: (0, jsx_runtime_1.jsx)("span", { className: "code-style", children: job.jobId }) }), (0, jsx_runtime_1.jsx)("td", { children: (0, jsx_runtime_1.jsx)("strong", { children: job.segmentName }) }), (0, jsx_runtime_1.jsx)("td", { children: (0, jsx_runtime_1.jsx)("span", { className: "badge-destination", children: job.destination === 'meta' ? 'Show Advertisement' : job.destination === 'email' ? 'Email Customers' : job.destination === 'sms' ? 'Send SMS' : job.destination === 'google' ? 'Export Audience' : 'Customer Journey' }) }), (0, jsx_runtime_1.jsx)("td", { children: (0, jsx_runtime_1.jsx)("span", { className: `status-pill ${job.status.toLowerCase().replace(/ /g, '-')}`, children: job.status }) }), (0, jsx_runtime_1.jsx)("td", { children: job.rowsSynced }), (0, jsx_runtime_1.jsxs)("td", { children: [job.latencyMs, "ms"] }), (0, jsx_runtime_1.jsx)("td", { children: isExpanded ? (0, jsx_runtime_1.jsx)(lucide_react_1.ChevronUp, { size: 16 }) : (0, jsx_runtime_1.jsx)(lucide_react_1.ChevronDown, { size: 16 }) })] }), isExpanded && ((0, jsx_runtime_1.jsx)("tr", { className: "job-row-detail", children: (0, jsx_runtime_1.jsx)("td", { colSpan: 7, children: (0, jsx_runtime_1.jsxs)("div", { className: "details-panel-expanded", children: [(0, jsx_runtime_1.jsx)("h4", { style: { color: 'var(--text-loud)', marginBottom: '12px' }, children: "\uD83D\uDCCA Action Performance Attribution" }), (0, jsx_runtime_1.jsxs)("div", { className: "perf-grid", children: [(0, jsx_runtime_1.jsxs)("div", { className: "perf-box", children: [(0, jsx_runtime_1.jsx)("span", { className: "perf-label", children: "CTR" }), (0, jsx_runtime_1.jsxs)("span", { className: "perf-value", children: [job.campaignResults?.ctr || 0, "%"] }), (0, jsx_runtime_1.jsxs)("span", { className: "perf-diff success", children: ["+", job.campaignResults?.ctrComparison || 0, "% Lift"] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "perf-box", children: [(0, jsx_runtime_1.jsx)("span", { className: "perf-label", children: "Conversion Rate" }), (0, jsx_runtime_1.jsxs)("span", { className: "perf-value", children: [job.campaignResults?.conversionRate || 0, "%"] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "perf-box", children: [(0, jsx_runtime_1.jsx)("span", { className: "perf-label", children: "Attributed Revenue" }), (0, jsx_runtime_1.jsxs)("span", { className: "perf-value", children: ["$", (job.campaignResults?.revenue || 0).toLocaleString()] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "perf-box", children: [(0, jsx_runtime_1.jsx)("span", { className: "perf-label", children: "Campaign ROI" }), (0, jsx_runtime_1.jsxs)("span", { className: "perf-value", style: { color: 'var(--accent-primary)' }, children: [job.campaignResults?.roi || 0, "x"] })] })] })] }) }) }))] }, job.jobId));
                                                            })) })] }) })] })] })), activeTab === 'saved_audiences' && ((0, jsx_runtime_1.jsxs)("div", { className: "dest-card table-container", style: { width: '100%' }, children: [(0, jsx_runtime_1.jsxs)("div", { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }, children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("h3", { children: "Saved Segment Audiences" }), (0, jsx_runtime_1.jsx)("p", { className: "card-subtitle", children: "Active segment definitions and their current evaluated match size." })] }), (0, jsx_runtime_1.jsxs)("button", { className: "btn-primary", onClick: () => setActiveTab('filters'), children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Plus, { size: 14 }), " Create Audience"] })] }), (0, jsx_runtime_1.jsx)("div", { className: "table-wrapper", children: (0, jsx_runtime_1.jsxs)("table", { className: "dest-table", style: { width: '100%' }, children: [(0, jsx_runtime_1.jsx)("thead", { children: (0, jsx_runtime_1.jsxs)("tr", { children: [(0, jsx_runtime_1.jsx)("th", { children: "Audience Name" }), (0, jsx_runtime_1.jsx)("th", { children: "Description" }), (0, jsx_runtime_1.jsx)("th", { children: "Estimated Reach" }), (0, jsx_runtime_1.jsx)("th", { children: "Rules Configured" }), (0, jsx_runtime_1.jsx)("th", { children: "Created Date" }), (0, jsx_runtime_1.jsx)("th", { children: "Action" })] }) }), (0, jsx_runtime_1.jsx)("tbody", { children: segments.length === 0 ? ((0, jsx_runtime_1.jsx)("tr", { children: (0, jsx_runtime_1.jsx)("td", { colSpan: 6, style: { textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }, children: "No segments found. Go to Filters tab to build one." }) })) : (segments.map(seg => ((0, jsx_runtime_1.jsxs)("tr", { children: [(0, jsx_runtime_1.jsx)("td", { children: (0, jsx_runtime_1.jsx)("strong", { children: seg.name }) }), (0, jsx_runtime_1.jsx)("td", { style: { color: 'var(--text-muted)' }, children: seg.description }), (0, jsx_runtime_1.jsx)("td", { children: (0, jsx_runtime_1.jsxs)("span", { style: { fontWeight: 'bold', color: 'var(--accent-primary)', fontSize: '13px' }, children: [seg.estimatedSize, " Profiles"] }) }), (0, jsx_runtime_1.jsx)("td", { children: (0, jsx_runtime_1.jsxs)("span", { style: { fontSize: '11px', fontFamily: 'monospace', padding: '3px 6px', backgroundColor: 'var(--bg-app)', border: '1px solid var(--grid-line-minor)', borderRadius: '4px' }, children: [seg.rules?.length || 0, " Rules (AND)"] }) }), (0, jsx_runtime_1.jsx)("td", { style: { fontSize: '11px' }, children: new Date(seg.createdAt).toLocaleString() }), (0, jsx_runtime_1.jsx)("td", { children: (0, jsx_runtime_1.jsxs)("div", { style: { display: 'flex', gap: '8px' }, children: [(0, jsx_runtime_1.jsx)("button", { className: "btn-secondary", style: { padding: '4px 8px', fontSize: '10px' }, onClick: () => {
                                                                                setSelectedSegment(seg.id);
                                                                                setActiveTab('overview');
                                                                            }, children: "Trigger Action" }), (0, jsx_runtime_1.jsx)("button", { className: "btn-outline", style: { padding: '4px 8px', fontSize: '10px', color: '#f87171', borderColor: 'rgba(248,113,113,0.3)' }, onClick: () => handleDeleteSegment(seg.id), children: "Delete" })] }) })] }, seg.id)))) })] }) })] })), activeTab === 'filters' && ((0, jsx_runtime_1.jsxs)("div", { className: "dest-content-grid", children: [(0, jsx_runtime_1.jsxs)("div", { className: "dest-card form-container", children: [(0, jsx_runtime_1.jsx)("h3", { children: "Create New Audience Segment" }), (0, jsx_runtime_1.jsx)("p", { className: "card-subtitle", children: "Combine geographic, behavior, and spend limits to target customer clusters." }), (0, jsx_runtime_1.jsxs)("form", { onSubmit: handleSaveAudience, style: { marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }, children: [(0, jsx_runtime_1.jsxs)("div", { className: "form-group", children: [(0, jsx_runtime_1.jsx)("label", { children: "Audience Name *" }), (0, jsx_runtime_1.jsx)("input", { type: "text", placeholder: "e.g. Inactive Spenders India", value: newAudienceName, onChange: e => setNewAudienceName(e.target.value), required: true })] }), (0, jsx_runtime_1.jsxs)("div", { className: "form-group", children: [(0, jsx_runtime_1.jsx)("label", { children: "Description" }), (0, jsx_runtime_1.jsx)("input", { type: "text", placeholder: "e.g. Indian customers who spent > 5,000 INR.", value: newAudienceDesc, onChange: e => setNewAudienceDesc(e.target.value) })] }), (0, jsx_runtime_1.jsxs)("div", { className: "form-group", children: [(0, jsx_runtime_1.jsx)("label", { children: "Business Goal" }), (0, jsx_runtime_1.jsxs)("select", { value: newAudienceGoal, onChange: e => setNewAudienceGoal(e.target.value), style: { padding: '10px', width: '100%', borderRadius: '4px', backgroundColor: 'var(--bg-app)', border: '1px solid var(--grid-line-minor)', color: 'var(--text-loud)' }, children: [(0, jsx_runtime_1.jsx)("option", { value: "Conversion Lift", children: "Conversion Lift (Sales Campaign)" }), (0, jsx_runtime_1.jsx)("option", { value: "Churn Re-engagement", children: "Churn Re-engagement" }), (0, jsx_runtime_1.jsx)("option", { value: "Cross-sell Campaign", children: "Cross-sell Campaign" }), (0, jsx_runtime_1.jsx)("option", { value: "Loyalty Reward Program", children: "Loyalty Reward Program" })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "form-group", children: [(0, jsx_runtime_1.jsxs)("div", { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }, children: [(0, jsx_runtime_1.jsx)("label", { children: "Rules Configuration Matrix (AND)" }), (0, jsx_runtime_1.jsx)("button", { type: "button", className: "btn-secondary", onClick: addRule, style: { padding: '4px 8px', fontSize: '11px' }, children: "+ Add Rule Condition" })] }), (0, jsx_runtime_1.jsx)("div", { style: { display: 'flex', flexDirection: 'column', gap: '8px' }, children: newRules.map((rule, idx) => ((0, jsx_runtime_1.jsxs)("div", { style: { display: 'flex', gap: '6px', alignItems: 'center' }, children: [(0, jsx_runtime_1.jsxs)("select", { value: rule.field, onChange: e => updateRule(idx, { field: e.target.value }), style: { flex: 1, padding: '8px', fontSize: '11px', borderRadius: '4px', backgroundColor: 'var(--bg-app)', border: '1px solid var(--grid-line-minor)', color: 'var(--text-loud)' }, children: [(0, jsx_runtime_1.jsx)("option", { value: "country", children: "Country" }), (0, jsx_runtime_1.jsx)("option", { value: "spent", children: "Total Spent" }), (0, jsx_runtime_1.jsx)("option", { value: "purchase_count", children: "Purchase Count" }), (0, jsx_runtime_1.jsx)("option", { value: "email_exists", children: "Email Address Exists" }), (0, jsx_runtime_1.jsx)("option", { value: "campaign", children: "Referral Campaign" }), (0, jsx_runtime_1.jsx)("option", { value: "device", children: "Device Type" }), (0, jsx_runtime_1.jsx)("option", { value: "risk_score", children: "Churn Risk Score" }), (0, jsx_runtime_1.jsx)("option", { value: "ltv", children: "Estimated CLV" }), (0, jsx_runtime_1.jsx)("option", { value: "pii_count", children: "Sensitive Fields Count" }), (0, jsx_runtime_1.jsx)("option", { value: "quality_score", children: "Identity Quality Score" })] }), (0, jsx_runtime_1.jsxs)("select", { value: rule.operator, onChange: e => updateRule(idx, { operator: e.target.value }), style: { flex: 1, padding: '8px', fontSize: '11px', borderRadius: '4px', backgroundColor: 'var(--bg-app)', border: '1px solid var(--grid-line-minor)', color: 'var(--text-loud)' }, children: [(0, jsx_runtime_1.jsx)("option", { value: "equals", children: "Equals" }), (0, jsx_runtime_1.jsx)("option", { value: "not_equals", children: "Not Equals" }), (0, jsx_runtime_1.jsx)("option", { value: "greater_than", children: "Greater Than (>)" }), (0, jsx_runtime_1.jsx)("option", { value: "less_than", children: "Less Than (<)" }), (0, jsx_runtime_1.jsx)("option", { value: "greater_than_or_equal", children: "Greater Than or Equal (>=)" }), (0, jsx_runtime_1.jsx)("option", { value: "less_than_or_equal", children: "Less Than or Equal (<=)" }), (0, jsx_runtime_1.jsx)("option", { value: "contains", children: "Contains" }), (0, jsx_runtime_1.jsx)("option", { value: "does_not_contain", children: "Does Not Contain" }), (0, jsx_runtime_1.jsx)("option", { value: "starts_with", children: "Starts With" }), (0, jsx_runtime_1.jsx)("option", { value: "ends_with", children: "Ends With" }), (0, jsx_runtime_1.jsx)("option", { value: "regex", children: "Advanced Pattern (Regex)" }), (0, jsx_runtime_1.jsx)("option", { value: "exists", children: "Exists" }), (0, jsx_runtime_1.jsx)("option", { value: "does_not_exist", children: "Does Not Exist" }), (0, jsx_runtime_1.jsx)("option", { value: "in_list", children: "In List (comma separated)" }), (0, jsx_runtime_1.jsx)("option", { value: "not_in_list", children: "Not In List" }), (0, jsx_runtime_1.jsx)("option", { value: "between", children: "Between (e.g. 100,500)" }), (0, jsx_runtime_1.jsx)("option", { value: "not_between", children: "Not Between" })] }), rule.operator !== 'exists' && rule.operator !== 'does_not_exist' && ((0, jsx_runtime_1.jsx)("input", { type: "text", required: true, placeholder: "Value", value: rule.value, onChange: e => updateRule(idx, { value: e.target.value }), style: { flex: 1.2, padding: '8px', fontSize: '11px', borderRadius: '4px', backgroundColor: 'var(--bg-app)', border: '1px solid var(--grid-line-minor)', color: 'var(--text-loud)' } })), (0, jsx_runtime_1.jsx)("button", { type: "button", onClick: () => removeRule(idx), style: { padding: '6px', backgroundColor: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '4px' }, disabled: newRules.length === 1, children: (0, jsx_runtime_1.jsx)(lucide_react_1.X, { size: 12 }) })] }, idx))) })] }), (0, jsx_runtime_1.jsxs)("button", { type: "submit", className: "btn-primary", disabled: !newAudienceName, style: { alignSelf: 'flex-start', marginTop: '12px' }, children: [(0, jsx_runtime_1.jsx)(lucide_react_1.CheckCircle2, { size: 14 }), " Save Audience"] })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "dest-card Reach-container", style: { padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '300px', backgroundColor: 'rgba(56, 189, 248, 0.03)', border: '1.5px dashed var(--accent-primary)', borderRadius: '6px' }, children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Users, { size: 48, style: { color: 'var(--accent-primary)', marginBottom: '16px' } }), (0, jsx_runtime_1.jsx)("h3", { style: { fontSize: '18px', color: 'var(--text-loud)' }, children: "Target Audience Size" }), isPreviewLoading ? ((0, jsx_runtime_1.jsx)("div", { style: { marginTop: '20px', fontSize: '24px', fontWeight: 'bold' }, children: "Calculating..." })) : ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)("div", { style: { marginTop: '20px', fontSize: '48px', fontWeight: 'bold', color: 'var(--accent-primary)' }, children: liveEstimatedSize }), (0, jsx_runtime_1.jsx)("p", { style: { fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px', textAlign: 'center' }, children: "Estimated customer profiles matching current filter rules matrix." })] }))] })] })), activeTab === 'preview' && ((0, jsx_runtime_1.jsxs)("div", { className: "dest-card table-container", style: { width: '100%' }, children: [(0, jsx_runtime_1.jsxs)("div", { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }, children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("h3", { children: "Audience Previews" }), (0, jsx_runtime_1.jsx)("p", { className: "card-subtitle", children: "View matching customer directories for any saved segment cohort." })] }), (0, jsx_runtime_1.jsxs)("div", { style: { display: 'flex', alignItems: 'center', gap: '8px' }, children: [(0, jsx_runtime_1.jsx)("span", { style: { fontSize: '12px', color: 'var(--text-muted)' }, children: "Choose Cohort:" }), (0, jsx_runtime_1.jsx)("select", { value: previewSegmentId, onChange: e => setPreviewSegmentId(e.target.value), style: { padding: '6px', borderRadius: '4px', backgroundColor: 'var(--bg-app)', border: '1px solid var(--grid-line-minor)', color: 'var(--text-loud)', fontSize: '12px' }, children: segments.map(s => ((0, jsx_runtime_1.jsx)("option", { value: s.id, children: s.name }, s.id))) })] })] }), (0, jsx_runtime_1.jsx)("div", { className: "table-wrapper", children: (0, jsx_runtime_1.jsxs)("table", { className: "dest-table", style: { width: '100%' }, children: [(0, jsx_runtime_1.jsx)("thead", { children: (0, jsx_runtime_1.jsxs)("tr", { children: [(0, jsx_runtime_1.jsx)("th", { children: "Name" }), (0, jsx_runtime_1.jsx)("th", { children: "Unique Customer ID" }), (0, jsx_runtime_1.jsx)("th", { children: "Email Address" }), (0, jsx_runtime_1.jsx)("th", { children: "Location" }), (0, jsx_runtime_1.jsx)("th", { children: "Profile Type" }), (0, jsx_runtime_1.jsx)("th", { children: "Match Confidence" })] }) }), (0, jsx_runtime_1.jsx)("tbody", { children: previewProfiles.length === 0 ? ((0, jsx_runtime_1.jsx)("tr", { children: (0, jsx_runtime_1.jsx)("td", { colSpan: 6, style: { textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }, children: "No customer profiles match the current segment criteria rules." }) })) : (previewProfiles.map((p, idx) => ((0, jsx_runtime_1.jsxs)("tr", { children: [(0, jsx_runtime_1.jsx)("td", { children: (0, jsx_runtime_1.jsx)("strong", { children: p.name }) }), (0, jsx_runtime_1.jsx)("td", { children: (0, jsx_runtime_1.jsx)("span", { className: "code-style", children: p.uuid }) }), (0, jsx_runtime_1.jsx)("td", { children: p.email }), (0, jsx_runtime_1.jsx)("td", { children: p.location }), (0, jsx_runtime_1.jsx)("td", { children: (0, jsx_runtime_1.jsx)("span", { className: "tag", style: {
                                                                        fontSize: '9px',
                                                                        fontWeight: 'bold',
                                                                        backgroundColor: p.profileType === 'Anonymous Visitor' ? 'rgba(217, 119, 6, 0.15)' : p.profileType === 'Unified Profile' ? 'rgba(5, 150, 105, 0.15)' : 'rgba(37, 99, 235, 0.15)',
                                                                        color: p.profileType === 'Anonymous Visitor' ? '#d97706' : p.profileType === 'Unified Profile' ? '#059669' : '#2563eb',
                                                                        border: `1px solid ${p.profileType === 'Anonymous Visitor' ? 'rgba(217, 119, 6, 0.3)' : p.profileType === 'Unified Profile' ? 'rgba(5, 150, 105, 0.3)' : 'rgba(37, 99, 235, 0.3)'}`
                                                                    }, children: p.profileType || 'Known Customer' }) }), (0, jsx_runtime_1.jsx)("td", { children: (0, jsx_runtime_1.jsxs)("span", { style: { fontWeight: 600, color: p.confidence >= 80 ? 'var(--accent-primary)' : 'var(--accent-secondary)' }, children: [p.confidence, "% match"] }) })] }, idx)))) })] }) })] })), activeTab === 'journey' && ((0, jsx_runtime_1.jsxs)("div", { className: "dest-card", style: { padding: '24px', width: '100%' }, children: [(0, jsx_runtime_1.jsx)("h3", { children: "Customer Journey Flow Map" }), (0, jsx_runtime_1.jsx)("p", { className: "card-subtitle", style: { marginBottom: '24px' }, children: "Visual pipelines of active customer data matching and promotion routes." }), (0, jsx_runtime_1.jsxs)("div", { style: { display: 'flex', flexDirection: 'column', gap: '30px', margin: '20px auto', maxWidth: '800px', position: 'relative' }, children: [(0, jsx_runtime_1.jsxs)("div", { style: { display: 'flex', gap: '16px', alignItems: 'center', padding: '16px', backgroundColor: 'var(--bg-app)', border: '1px solid var(--grid-line-minor)', borderRadius: '6px' }, children: [(0, jsx_runtime_1.jsx)("div", { style: { height: '36px', width: '36px', borderRadius: '50%', backgroundColor: 'rgba(37, 99, 235, 0.12)', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }, children: "1" }), (0, jsx_runtime_1.jsxs)("div", { style: { flex: 1 }, children: [(0, jsx_runtime_1.jsx)("h4", { style: { margin: 0, fontSize: '13px', color: 'var(--text-loud)' }, children: "Multi-Source Data Ingestion (Imported Data)" }), (0, jsx_runtime_1.jsx)("p", { style: { margin: 0, fontSize: '11px', color: 'var(--text-muted)' }, children: "Files ingested from Snowflake, Stripe, CSV, or Web cookies are loaded into local workspace paths." })] }), (0, jsx_runtime_1.jsx)("span", { style: { fontSize: '10px', color: '#10b981', fontWeight: 600 }, children: "\uD83D\uDFE2 ACTIVE" })] }), (0, jsx_runtime_1.jsx)("div", { style: { display: 'flex', justifyContent: 'center' }, children: (0, jsx_runtime_1.jsx)(lucide_react_1.ArrowRight, { size: 20, style: { transform: 'rotate(90deg)', color: 'var(--text-muted)' } }) }), (0, jsx_runtime_1.jsxs)("div", { style: { display: 'flex', gap: '16px', alignItems: 'center', padding: '16px', backgroundColor: 'var(--bg-app)', border: '1px solid var(--grid-line-minor)', borderRadius: '6px' }, children: [(0, jsx_runtime_1.jsx)("div", { style: { height: '36px', width: '36px', borderRadius: '50%', backgroundColor: 'rgba(16, 185, 129, 0.12)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }, children: "2" }), (0, jsx_runtime_1.jsxs)("div", { style: { flex: 1 }, children: [(0, jsx_runtime_1.jsx)("h4", { style: { margin: 0, fontSize: '13px', color: 'var(--text-loud)' }, children: "Dynamic Cleanse & PII Scan (Cleaned Data)" }), (0, jsx_runtime_1.jsx)("p", { style: { margin: 0, fontSize: '11px', color: 'var(--text-muted)' }, children: "PII patterns (emails, Aadhaar ID, phone numbers) are cataloged, tokenized, or encrypted securely." })] }), (0, jsx_runtime_1.jsx)("span", { style: { fontSize: '10px', color: '#10b981', fontWeight: 600 }, children: "\uD83D\uDFE2 ACTIVE" })] }), (0, jsx_runtime_1.jsx)("div", { style: { display: 'flex', justifyContent: 'center' }, children: (0, jsx_runtime_1.jsx)(lucide_react_1.ArrowRight, { size: 20, style: { transform: 'rotate(90deg)', color: 'var(--text-muted)' } }) }), (0, jsx_runtime_1.jsxs)("div", { style: { display: 'flex', gap: '16px', alignItems: 'center', padding: '16px', backgroundColor: 'var(--bg-app)', border: '1px solid var(--grid-line-minor)', borderRadius: '6px' }, children: [(0, jsx_runtime_1.jsx)("div", { style: { height: '36px', width: '36px', borderRadius: '50%', backgroundColor: 'rgba(217, 119, 6, 0.12)', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }, children: "3" }), (0, jsx_runtime_1.jsxs)("div", { style: { flex: 1 }, children: [(0, jsx_runtime_1.jsx)("h4", { style: { margin: 0, fontSize: '13px', color: 'var(--text-loud)' }, children: "Identity Resolution & Promotion (Customer Matching)" }), (0, jsx_runtime_1.jsx)("p", { style: { margin: 0, fontSize: '11px', color: 'var(--text-muted)' }, children: "Stitch anonymous sessions (Cookie IDs) to authenticated profile matches, promoting visitor activity flows." })] }), (0, jsx_runtime_1.jsx)("span", { style: { fontSize: '10px', color: '#10b981', fontWeight: 600 }, children: "\uD83D\uDFE2 ACTIVE" })] }), (0, jsx_runtime_1.jsx)("div", { style: { display: 'flex', justifyContent: 'center' }, children: (0, jsx_runtime_1.jsx)(lucide_react_1.ArrowRight, { size: 20, style: { transform: 'rotate(90deg)', color: 'var(--text-muted)' } }) }), (0, jsx_runtime_1.jsxs)("div", { style: { display: 'flex', gap: '16px', alignItems: 'center', padding: '16px', backgroundColor: 'var(--bg-app)', border: '1px solid var(--grid-line-minor)', borderRadius: '6px' }, children: [(0, jsx_runtime_1.jsx)("div", { style: { height: '36px', width: '36px', borderRadius: '50%', backgroundColor: 'rgba(147, 51, 234, 0.12)', color: '#9333ea', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }, children: "4" }), (0, jsx_runtime_1.jsxs)("div", { style: { flex: 1 }, children: [(0, jsx_runtime_1.jsx)("h4", { style: { margin: 0, fontSize: '13px', color: 'var(--text-loud)' }, children: "Business Activations (Business Ready Data)" }), (0, jsx_runtime_1.jsx)("p", { style: { margin: 0, fontSize: '11px', color: 'var(--text-muted)' }, children: "Sync saved segment lists directly to Advertisement channels or Push SMS notifications instantly." })] }), (0, jsx_runtime_1.jsx)("span", { style: { fontSize: '10px', color: '#10b981', fontWeight: 600 }, children: "\uD83D\uDFE2 ACTIVE" })] })] })] })), activeTab === 'analytics' && ((0, jsx_runtime_1.jsxs)("div", { className: "dest-card", style: { padding: '24px', width: '100%' }, children: [(0, jsx_runtime_1.jsx)("h3", { children: "Business Performance Analytics" }), (0, jsx_runtime_1.jsx)("p", { className: "card-subtitle", style: { marginBottom: '24px' }, children: "Review CTR conversion rates, attributed invoice revenue lifts, and overall campaign ROI performance." }), (0, jsx_runtime_1.jsxs)("div", { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }, children: [(0, jsx_runtime_1.jsxs)("div", { style: { padding: '20px', backgroundColor: 'var(--bg-app)', border: '1px solid var(--grid-line-minor)', borderRadius: '6px' }, children: [(0, jsx_runtime_1.jsxs)("h4", { style: { display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-loud)' }, children: [(0, jsx_runtime_1.jsx)(lucide_react_1.TrendingUp, { size: 16 }), " Click-Through-Rate (CTR) Lift Comparison"] }), (0, jsx_runtime_1.jsxs)("div", { style: { height: '220px', display: 'flex', flexDirection: 'column', gap: '16px', justifyContent: 'center', marginTop: '16px' }, children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsxs)("div", { style: { display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }, children: [(0, jsx_runtime_1.jsx)("span", { children: "Show Advertisement Action (Meta Ads Gateway)" }), (0, jsx_runtime_1.jsx)("span", { style: { fontWeight: 'bold' }, children: "+24.2% Lift" })] }), (0, jsx_runtime_1.jsx)("div", { style: { height: '14px', width: '100%', backgroundColor: 'var(--grid-line-minor)', borderRadius: '3px', overflow: 'hidden' }, children: (0, jsx_runtime_1.jsx)("div", { style: { height: '100%', width: '82%', backgroundColor: '#2563eb' } }) })] }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsxs)("div", { style: { display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }, children: [(0, jsx_runtime_1.jsx)("span", { children: "Email Customers Action (Outbox API)" }), (0, jsx_runtime_1.jsx)("span", { style: { fontWeight: 'bold' }, children: "+12.8% Lift" })] }), (0, jsx_runtime_1.jsx)("div", { style: { height: '14px', width: '100%', backgroundColor: 'var(--grid-line-minor)', borderRadius: '3px', overflow: 'hidden' }, children: (0, jsx_runtime_1.jsx)("div", { style: { height: '100%', width: '64%', backgroundColor: '#10b981' } }) })] }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsxs)("div", { style: { display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }, children: [(0, jsx_runtime_1.jsx)("span", { children: "Send SMS Action (Twilio API Gateway)" }), (0, jsx_runtime_1.jsx)("span", { style: { fontWeight: 'bold' }, children: "+8.4% Lift" })] }), (0, jsx_runtime_1.jsx)("div", { style: { height: '14px', width: '100%', backgroundColor: 'var(--grid-line-minor)', borderRadius: '3px', overflow: 'hidden' }, children: (0, jsx_runtime_1.jsx)("div", { style: { height: '100%', width: '45%', backgroundColor: '#d97706' } }) })] })] })] }), (0, jsx_runtime_1.jsxs)("div", { style: { padding: '20px', backgroundColor: 'var(--bg-app)', border: '1px solid var(--grid-line-minor)', borderRadius: '6px' }, children: [(0, jsx_runtime_1.jsxs)("h4", { style: { display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-loud)' }, children: [(0, jsx_runtime_1.jsx)(lucide_react_1.DollarSign, { size: 16 }), " Attributed Campaign Revenue Matrix"] }), (0, jsx_runtime_1.jsxs)("div", { style: { height: '220px', display: 'flex', flexDirection: 'column', gap: '16px', justifyContent: 'center', marginTop: '16px' }, children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsxs)("div", { style: { display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }, children: [(0, jsx_runtime_1.jsx)("span", { children: "Premium Indian Customers Cohort" }), (0, jsx_runtime_1.jsx)("span", { style: { fontWeight: 'bold' }, children: "$45,000" })] }), (0, jsx_runtime_1.jsx)("div", { style: { height: '14px', width: '100%', backgroundColor: 'var(--grid-line-minor)', borderRadius: '3px', overflow: 'hidden' }, children: (0, jsx_runtime_1.jsx)("div", { style: { height: '100%', width: '90%', backgroundColor: 'var(--accent-primary)' } }) })] }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsxs)("div", { style: { display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }, children: [(0, jsx_runtime_1.jsx)("span", { children: "Summer Sale 2026 Mobile Cohort" }), (0, jsx_runtime_1.jsx)("span", { style: { fontWeight: 'bold' }, children: "$12,000" })] }), (0, jsx_runtime_1.jsx)("div", { style: { height: '14px', width: '100%', backgroundColor: 'var(--grid-line-minor)', borderRadius: '3px', overflow: 'hidden' }, children: (0, jsx_runtime_1.jsx)("div", { style: { height: '100%', width: '38%', backgroundColor: 'var(--accent-secondary)' } }) })] }), (0, jsx_runtime_1.jsxs)("div", { style: { fontSize: '11px', color: 'var(--text-muted)', borderTop: '1px solid var(--grid-line-minor)', paddingTop: '16px', display: 'flex', justifyContent: 'space-between' }, children: [(0, jsx_runtime_1.jsx)("span", { children: "Combined Attributed Sales:" }), (0, jsx_runtime_1.jsxs)("span", { style: { color: 'var(--text-loud)', fontWeight: 'bold', fontSize: '13px' }, children: ["$", summary.totalRevenue?.toLocaleString(), " USD"] })] })] })] })] })] }))] })] })] }));
}
