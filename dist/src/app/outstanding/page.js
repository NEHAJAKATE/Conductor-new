"use client";
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = OutstandingPage;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const Sidebar_1 = __importDefault(require("@/components/Sidebar"));
const ThemeToggle_1 = __importDefault(require("@/components/ThemeToggle"));
const ContextualGuidancePanel_1 = __importDefault(require("@/components/ContextualGuidancePanel"));
const lucide_react_1 = require("lucide-react");
require("../dashboard.css");
require("../business-pages.css");
function OutstandingPage() {
    const [report, setReport] = (0, react_1.useState)(null);
    const [loading, setLoading] = (0, react_1.useState)(true);
    const [search, setSearch] = (0, react_1.useState)('');
    const [riskFilter, setRiskFilter] = (0, react_1.useState)('');
    const [toastMessage, setToastMessage] = (0, react_1.useState)(null);
    // Reminder Modal State
    const [activeReminderAccount, setActiveReminderAccount] = (0, react_1.useState)(null);
    const [reminderChannel, setReminderChannel] = (0, react_1.useState)('WHATSAPP');
    const [customMessage, setCustomMessage] = (0, react_1.useState)('');
    const [recipientContact, setRecipientContact] = (0, react_1.useState)('');
    const [isDispatching, setIsDispatching] = (0, react_1.useState)(false);
    const [remindedAccounts, setRemindedAccounts] = (0, react_1.useState)(new Set());
    const fetchOutstandingReport = async () => {
        try {
            setLoading(true);
            const res = await fetch(`/api/v1/reports?dataset=outstanding&search=${encodeURIComponent(search)}&filterRisk=${riskFilter}`);
            if (res.ok) {
                const data = await res.json();
                setReport(data);
            }
        }
        catch (err) {
            console.error('Failed to fetch outstanding report:', err);
        }
        finally {
            setLoading(false);
        }
    };
    (0, react_1.useEffect)(() => {
        fetchOutstandingReport();
    }, [riskFilter]);
    // Open modal and generate pre-filled template
    const handleOpenReminderModal = (item) => {
        setActiveReminderAccount(item);
        setRecipientContact(item.mobile || item.phone || '+91 9452400038');
        const overdueAmt = Math.round(item.bucket90Plus || 0).toLocaleString();
        const totalAmt = Math.round(item.totalOutstanding || 0).toLocaleString();
        const template = `Dear ${item.businessName},

This is a gentle payment reminder from Agrawal Trading Company regarding your outstanding ledger balance:
• Total Outstanding: ₹${totalAmt}
• Overdue (>90 Days): ₹${overdueAmt}

Kindly arrange the payment remittance at your earliest convenience to maintain continuous credit dispatch:
Bank: HDFC Bank Ltd (Civil Lines, Prayagraj)
A/C No: 50200084729103
IFSC: HDFC0000123

For queries, please contact accounts@agrawaltrading.com. Thank you!`;
        setCustomMessage(template);
    };
    const handleDispatchReminder = async () => {
        if (!activeReminderAccount)
            return;
        setIsDispatching(true);
        try {
            // 1. Record in backend automation engine
            await fetch('/api/v1/automation', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'send_reminder',
                    payload: {
                        partyName: activeReminderAccount.businessName,
                        amount: activeReminderAccount.totalOutstanding,
                        overdue90Plus: activeReminderAccount.bucket90Plus,
                        channel: reminderChannel,
                        recipient: recipientContact,
                        message: customMessage,
                    }
                })
            });
            // 2. If WhatsApp, also open WhatsApp Web with prefilled message
            if (reminderChannel === 'WHATSAPP') {
                const cleanPhone = recipientContact.replace(/[^0-9]/g, '');
                const targetPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
                const waUrl = `https://api.whatsapp.com/send?phone=${targetPhone}&text=${encodeURIComponent(customMessage)}`;
                window.open(waUrl, '_blank');
            }
            setRemindedAccounts(prev => new Set(prev).add(activeReminderAccount.businessId));
            setToastMessage(`✓ ${reminderChannel} payment reminder sent to ${activeReminderAccount.businessName}`);
            setActiveReminderAccount(null);
            setTimeout(() => {
                setToastMessage(null);
            }, 5000);
        }
        catch (err) {
            console.error('Failed to dispatch reminder:', err);
            alert('Failed to dispatch reminder. Please check connectivity.');
        }
        finally {
            setIsDispatching(false);
        }
    };
    const getRiskBadge = (risk) => {
        switch (risk) {
            case 'CRITICAL':
                return (0, jsx_runtime_1.jsx)("span", { className: "badge badge-danger", children: "Critical Risk" });
            case 'HIGH':
                return (0, jsx_runtime_1.jsx)("span", { className: "badge badge-warning", children: "High Risk" });
            case 'MEDIUM':
                return (0, jsx_runtime_1.jsx)("span", { className: "badge badge-info", children: "Medium" });
            default:
                return (0, jsx_runtime_1.jsx)("span", { className: "badge badge-success", children: "Low Risk" });
        }
    };
    return ((0, jsx_runtime_1.jsxs)("div", { className: "dashboard-layout", children: [(0, jsx_runtime_1.jsx)(Sidebar_1.default, {}), (0, jsx_runtime_1.jsxs)("main", { className: "main-content", children: [(0, jsx_runtime_1.jsx)("div", { className: "top-menu", children: (0, jsx_runtime_1.jsx)(ThemeToggle_1.default, {}) }), (0, jsx_runtime_1.jsxs)("div", { className: "business-container", children: [(0, jsx_runtime_1.jsxs)("div", { className: "business-header", children: [(0, jsx_runtime_1.jsxs)("div", { className: "business-title-group", children: [(0, jsx_runtime_1.jsx)("h1", { children: "Outstanding & Ageing Ledger Intelligence" }), (0, jsx_runtime_1.jsx)("p", { children: "30-day interval receivables buckets, overdue credit monitoring, and proactive payment recovery reminders" })] }), (0, jsx_runtime_1.jsxs)("button", { className: "secondary-btn", onClick: fetchOutstandingReport, disabled: loading, children: [(0, jsx_runtime_1.jsx)(lucide_react_1.RefreshCw, { size: 15, className: loading ? 'animate-spin' : '' }), (0, jsx_runtime_1.jsx)("span", { children: "Refresh" })] })] }), report && report.kpis && ((0, jsx_runtime_1.jsx)("div", { className: "kpi-grid", children: report.kpis.map((kpi) => ((0, jsx_runtime_1.jsxs)("div", { className: "kpi-card", children: [(0, jsx_runtime_1.jsxs)("div", { className: "kpi-header", children: [(0, jsx_runtime_1.jsx)("span", { children: kpi.label }), (0, jsx_runtime_1.jsx)(lucide_react_1.Clock, { size: 16 })] }), (0, jsx_runtime_1.jsx)("div", { className: "kpi-value", children: kpi.formattedValue }), (0, jsx_runtime_1.jsx)("div", { className: "kpi-subtext", children: kpi.subtext })] }, kpi.id))) })), (0, jsx_runtime_1.jsxs)("div", { className: "action-bar", children: [(0, jsx_runtime_1.jsxs)("div", { className: "search-input-group", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Search, { size: 16, color: "#64748b" }), (0, jsx_runtime_1.jsx)("input", { type: "text", placeholder: "Search accounts by name or GSTIN...", value: search, onChange: e => setSearch(e.target.value) })] }), (0, jsx_runtime_1.jsxs)("div", { className: "filter-group", children: [(0, jsx_runtime_1.jsxs)("select", { className: "filter-select", value: riskFilter, onChange: e => setRiskFilter(e.target.value), children: [(0, jsx_runtime_1.jsx)("option", { value: "", children: "All Risk Tiers" }), (0, jsx_runtime_1.jsx)("option", { value: "CRITICAL", children: "Critical Risk Accounts" }), (0, jsx_runtime_1.jsx)("option", { value: "HIGH", children: "High Risk Accounts" }), (0, jsx_runtime_1.jsx)("option", { value: "MEDIUM", children: "Medium Risk Accounts" }), (0, jsx_runtime_1.jsx)("option", { value: "LOW", children: "Low Risk (Current)" })] }), (0, jsx_runtime_1.jsx)("button", { className: "primary-btn", onClick: fetchOutstandingReport, children: "Filter" })] })] }), report?.status === 'NOT_CONNECTED' ? ((0, jsx_runtime_1.jsxs)("div", { style: {
                                    background: '#090d16',
                                    border: '1px solid #1e293b',
                                    borderRadius: '12px',
                                    padding: '3rem 2rem',
                                    textAlign: 'center',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    gap: '1rem',
                                    margin: '1.5rem 0'
                                }, children: [(0, jsx_runtime_1.jsx)(lucide_react_1.AlertTriangle, { size: 42, color: "#64748b" }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("h3", { style: { margin: '0 0 0.5rem 0', color: '#f8fafc', fontSize: '1.15rem' }, children: "Outstanding Ageing Dataset Not Connected" }), (0, jsx_runtime_1.jsx)("p", { style: { margin: 0, color: '#94a3b8', maxWidth: '540px', fontSize: '0.875rem', lineHeight: 1.5 }, children: "No ERP receivables aging ledger has been ingested yet. Ingest your OUTSTANDING ledger CSV or connect your ERP source to view aging interval buckets, overdue risk tiers, and dispatch payment reminders." })] }), (0, jsx_runtime_1.jsx)("a", { href: "/ingestion", className: "primary-btn", style: { textDecoration: 'none', marginTop: '0.5rem' }, children: (0, jsx_runtime_1.jsx)("span", { children: "Connect Outstanding Ledger" }) })] })) : ((0, jsx_runtime_1.jsx)("div", { className: "data-table-container", children: (0, jsx_runtime_1.jsxs)("table", { className: "data-table", children: [(0, jsx_runtime_1.jsx)("thead", { children: (0, jsx_runtime_1.jsxs)("tr", { children: [(0, jsx_runtime_1.jsx)("th", { children: "Account Name" }), (0, jsx_runtime_1.jsx)("th", { children: "Total Outstanding (\u20B9)" }), (0, jsx_runtime_1.jsx)("th", { children: "0-30 Days" }), (0, jsx_runtime_1.jsx)("th", { children: "31-60 Days" }), (0, jsx_runtime_1.jsx)("th", { children: "61-90 Days" }), (0, jsx_runtime_1.jsx)("th", { children: "90+ Days (Overdue)" }), (0, jsx_runtime_1.jsx)("th", { children: "Risk Tier" }), (0, jsx_runtime_1.jsx)("th", { children: "Action" })] }) }), (0, jsx_runtime_1.jsx)("tbody", { children: loading ? ((0, jsx_runtime_1.jsx)("tr", { children: (0, jsx_runtime_1.jsx)("td", { colSpan: 8, style: { textAlign: 'center', padding: '2rem', color: '#94a3b8' }, children: "Loading outstanding aging matrix..." }) })) : !report || report.rows.length === 0 ? ((0, jsx_runtime_1.jsx)("tr", { children: (0, jsx_runtime_1.jsx)("td", { colSpan: 8, style: { textAlign: 'center', padding: '2rem', color: '#94a3b8' }, children: "No outstanding records found matching criteria." }) })) : (report.rows.slice(0, 50).map((row) => {
                                                const isSent = remindedAccounts.has(row.businessId);
                                                return ((0, jsx_runtime_1.jsxs)("tr", { children: [(0, jsx_runtime_1.jsxs)("td", { children: [(0, jsx_runtime_1.jsx)("div", { style: { fontWeight: 600, color: '#f8fafc' }, children: row.businessName }), row.gstin && ((0, jsx_runtime_1.jsx)("div", { style: { fontSize: '0.75rem', fontFamily: 'monospace', color: '#64748b' }, children: row.gstin }))] }), (0, jsx_runtime_1.jsxs)("td", { style: { fontWeight: 700, color: row.totalOutstanding > 0 ? '#f87171' : '#34d399' }, children: ["\u20B9", Math.round(row.totalOutstanding).toLocaleString()] }), (0, jsx_runtime_1.jsxs)("td", { children: ["\u20B9", Math.round(row.bucket0_30).toLocaleString()] }), (0, jsx_runtime_1.jsxs)("td", { children: ["\u20B9", Math.round(row.bucket31_60).toLocaleString()] }), (0, jsx_runtime_1.jsxs)("td", { children: ["\u20B9", Math.round(row.bucket61_90).toLocaleString()] }), (0, jsx_runtime_1.jsxs)("td", { style: { fontWeight: 600, color: row.bucket90Plus > 0 ? '#f87171' : '#94a3b8' }, children: ["\u20B9", Math.round(row.bucket90Plus).toLocaleString()] }), (0, jsx_runtime_1.jsx)("td", { children: getRiskBadge(row.riskLevel) }), (0, jsx_runtime_1.jsx)("td", { children: isSent ? ((0, jsx_runtime_1.jsxs)("button", { className: "secondary-btn reminder-btn-sent", disabled: true, children: [(0, jsx_runtime_1.jsx)(lucide_react_1.CheckCircle2, { size: 13, color: "#10b981" }), (0, jsx_runtime_1.jsx)("span", { children: "Reminder Sent" })] })) : ((0, jsx_runtime_1.jsxs)("button", { className: "secondary-btn", onClick: () => handleOpenReminderModal(row), style: { fontSize: '0.775rem', padding: '0.4rem 0.75rem' }, children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Send, { size: 12, color: "#60a5fa" }), (0, jsx_runtime_1.jsx)("span", { children: "Reminder" })] })) })] }, row.businessId));
                                            })) })] }) }))] }), activeReminderAccount && ((0, jsx_runtime_1.jsx)("div", { className: "modal-backdrop", onClick: () => setActiveReminderAccount(null), children: (0, jsx_runtime_1.jsxs)("div", { className: "modal-content", style: { maxWidth: '640px' }, onClick: e => e.stopPropagation(), children: [(0, jsx_runtime_1.jsxs)("div", { className: "modal-header", children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsxs)("h3", { style: { margin: 0, fontSize: '1.15rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '0.5rem' }, children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Send, { size: 18, color: "#60a5fa" }), (0, jsx_runtime_1.jsx)("span", { children: "Send Payment Recovery Reminder" })] }), (0, jsx_runtime_1.jsxs)("p", { style: { margin: 0, fontSize: '0.8rem', color: '#94a3b8' }, children: ["Account: ", (0, jsx_runtime_1.jsx)("strong", { style: { color: '#f8fafc' }, children: activeReminderAccount.businessName })] })] }), (0, jsx_runtime_1.jsx)("button", { onClick: () => setActiveReminderAccount(null), style: { background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }, children: (0, jsx_runtime_1.jsx)(lucide_react_1.X, { size: 20 }) })] }), (0, jsx_runtime_1.jsxs)("div", { className: "modal-body", children: [(0, jsx_runtime_1.jsxs)("div", { style: {
                                                display: 'grid',
                                                gridTemplateColumns: 'repeat(3, 1fr)',
                                                gap: '0.75rem',
                                                background: '#090d16',
                                                padding: '0.875rem',
                                                borderRadius: '8px',
                                                border: '1px solid #1e293b'
                                            }, children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("div", { style: { fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase' }, children: "Total Balance" }), (0, jsx_runtime_1.jsxs)("div", { style: { fontSize: '1rem', fontWeight: 700, color: '#f87171' }, children: ["\u20B9", Math.round(activeReminderAccount.totalOutstanding).toLocaleString()] })] }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("div", { style: { fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase' }, children: "Overdue (>90 Days)" }), (0, jsx_runtime_1.jsxs)("div", { style: { fontSize: '1rem', fontWeight: 700, color: '#fbbf24' }, children: ["\u20B9", Math.round(activeReminderAccount.bucket90Plus || 0).toLocaleString()] })] }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("div", { style: { fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase' }, children: "Risk Level" }), (0, jsx_runtime_1.jsx)("div", { style: { marginTop: '0.2rem' }, children: getRiskBadge(activeReminderAccount.riskLevel) })] })] }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("label", { style: { display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#94a3b8', marginBottom: '0.4rem' }, children: "Select Dispatch Channel:" }), (0, jsx_runtime_1.jsxs)("div", { className: "channel-tab-group", children: [(0, jsx_runtime_1.jsxs)("button", { className: `channel-tab-btn ${reminderChannel === 'WHATSAPP' ? 'active whatsapp' : ''}`, onClick: () => setReminderChannel('WHATSAPP'), children: [(0, jsx_runtime_1.jsx)(lucide_react_1.MessageSquare, { size: 16 }), (0, jsx_runtime_1.jsx)("span", { children: "WhatsApp Web" })] }), (0, jsx_runtime_1.jsxs)("button", { className: `channel-tab-btn ${reminderChannel === 'EMAIL' ? 'active' : ''}`, onClick: () => setReminderChannel('EMAIL'), children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Mail, { size: 16 }), (0, jsx_runtime_1.jsx)("span", { children: "Email Notice" })] }), (0, jsx_runtime_1.jsxs)("button", { className: `channel-tab-btn ${reminderChannel === 'SMS' ? 'active' : ''}`, onClick: () => setReminderChannel('SMS'), children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Smartphone, { size: 16 }), (0, jsx_runtime_1.jsx)("span", { children: "Direct SMS" })] })] })] }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("label", { style: { display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#94a3b8', marginBottom: '0.3rem' }, children: "Recipient Phone / Email:" }), (0, jsx_runtime_1.jsx)("input", { type: "text", className: "filter-select", style: { width: '100%', background: '#090d16' }, value: recipientContact, onChange: e => setRecipientContact(e.target.value), placeholder: "Enter 10-digit mobile or email..." })] }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("label", { style: { display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#94a3b8', marginBottom: '0.3rem' }, children: "Custom Reminder Notice:" }), (0, jsx_runtime_1.jsx)("textarea", { className: "reminder-textarea", rows: 6, value: customMessage, onChange: e => setCustomMessage(e.target.value) })] }), (0, jsx_runtime_1.jsxs)("div", { style: { display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }, children: [(0, jsx_runtime_1.jsx)("button", { className: "secondary-btn", onClick: () => setActiveReminderAccount(null), children: "Cancel" }), (0, jsx_runtime_1.jsx)("button", { className: "primary-btn", onClick: handleDispatchReminder, disabled: isDispatching, style: { background: reminderChannel === 'WHATSAPP' ? '#10b981' : '#3b82f6' }, children: isDispatching ? ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)(lucide_react_1.RefreshCw, { size: 14, className: "animate-spin" }), (0, jsx_runtime_1.jsx)("span", { children: "Dispatching..." })] })) : ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Send, { size: 14 }), (0, jsx_runtime_1.jsx)("span", { children: reminderChannel === 'WHATSAPP' ? 'Open & Send WhatsApp' : `Send ${reminderChannel} Notice` })] })) })] })] })] }) })), toastMessage && ((0, jsx_runtime_1.jsxs)("div", { className: "toast-notification", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.CheckCircle2, { size: 18, color: "#34d399" }), (0, jsx_runtime_1.jsx)("span", { children: toastMessage })] }))] }), (0, jsx_runtime_1.jsx)(ContextualGuidancePanel_1.default, {})] }));
}
