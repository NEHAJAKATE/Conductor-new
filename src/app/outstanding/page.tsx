"use client";
import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import ThemeToggle from '@/components/ThemeToggle';
import ContextualGuidancePanel from '@/components/ContextualGuidancePanel';
import { 
  Clock, 
  Search, 
  AlertTriangle, 
  Send, 
  CheckCircle2, 
  RefreshCw,
  TrendingDown,
  X,
  MessageSquare,
  Mail,
  Smartphone,
  ExternalLink,
  ShieldAlert,
  Building2
} from 'lucide-react';
import '../dashboard.css';
import '../business-pages.css';

export default function OutstandingPage() {
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [riskFilter, setRiskFilter] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Reminder Modal State
  const [activeReminderAccount, setActiveReminderAccount] = useState<any | null>(null);
  const [reminderChannel, setReminderChannel] = useState<'WHATSAPP' | 'EMAIL' | 'SMS'>('WHATSAPP');
  const [customMessage, setCustomMessage] = useState('');
  const [recipientContact, setRecipientContact] = useState('');
  const [isDispatching, setIsDispatching] = useState(false);
  const [remindedAccounts, setRemindedAccounts] = useState<Set<string>>(new Set());

  const fetchOutstandingReport = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/v1/reports?dataset=outstanding&search=${encodeURIComponent(search)}&filterRisk=${riskFilter}`);
      if (res.ok) {
        const data = await res.json();
        setReport(data);
      }
    } catch (err) {
      console.error('Failed to fetch outstanding report:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOutstandingReport();
  }, [riskFilter]);

  // Open modal and generate pre-filled template
  const handleOpenReminderModal = (item: any) => {
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
    if (!activeReminderAccount) return;
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
    } catch (err) {
      console.error('Failed to dispatch reminder:', err);
      alert('Failed to dispatch reminder. Please check connectivity.');
    } finally {
      setIsDispatching(false);
    }
  };

  const getRiskBadge = (risk: string) => {
    switch (risk) {
      case 'CRITICAL':
        return <span className="badge badge-danger">Critical Risk</span>;
      case 'HIGH':
        return <span className="badge badge-warning">High Risk</span>;
      case 'MEDIUM':
        return <span className="badge badge-info">Medium</span>;
      default:
        return <span className="badge badge-success">Low Risk</span>;
    }
  };

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="main-content">
        <div className="top-menu">
          <ThemeToggle />
        </div>

        <div className="business-container">
          <div className="business-header">
            <div className="business-title-group">
              <h1>Outstanding & Ageing Ledger Intelligence</h1>
              <p>30-day interval receivables buckets, overdue credit monitoring, and proactive payment recovery reminders</p>
            </div>
            <button className="secondary-btn" onClick={fetchOutstandingReport} disabled={loading}>
              <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
              <span>Refresh</span>
            </button>
          </div>

          {report && report.kpis && (
            <div className="kpi-grid">
              {report.kpis.map((kpi: any) => (
                <div key={kpi.id} className="kpi-card">
                  <div className="kpi-header">
                    <span>{kpi.label}</span>
                    <Clock size={16} />
                  </div>
                  <div className="kpi-value">{kpi.formattedValue}</div>
                  <div className="kpi-subtext">{kpi.subtext}</div>
                </div>
              ))}
            </div>
          )}

          <div className="action-bar">
            <div className="search-input-group">
              <Search size={16} color="#64748b" />
              <input 
                type="text" 
                placeholder="Search accounts by name or GSTIN..." 
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>

            <div className="filter-group">
              <select 
                className="filter-select"
                value={riskFilter}
                onChange={e => setRiskFilter(e.target.value)}
              >
                <option value="">All Risk Tiers</option>
                <option value="CRITICAL">Critical Risk Accounts</option>
                <option value="HIGH">High Risk Accounts</option>
                <option value="MEDIUM">Medium Risk Accounts</option>
                <option value="LOW">Low Risk (Current)</option>
              </select>
              <button className="primary-btn" onClick={fetchOutstandingReport}>Filter</button>
            </div>
          </div>

          {report?.status === 'NOT_CONNECTED' ? (
            <div style={{
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
            }}>
              <AlertTriangle size={42} color="#64748b" />
              <div>
                <h3 style={{ margin: '0 0 0.5rem 0', color: '#f8fafc', fontSize: '1.15rem' }}>Outstanding Ageing Dataset Not Connected</h3>
                <p style={{ margin: 0, color: '#94a3b8', maxWidth: '540px', fontSize: '0.875rem', lineHeight: 1.5 }}>
                  No ERP receivables aging ledger has been ingested yet. Ingest your OUTSTANDING ledger CSV or connect your ERP source to view aging interval buckets, overdue risk tiers, and dispatch payment reminders.
                </p>
              </div>
              <a href="/ingestion" className="primary-btn" style={{ textDecoration: 'none', marginTop: '0.5rem' }}>
                <span>Connect Outstanding Ledger</span>
              </a>
            </div>
          ) : (
            <div className="data-table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Account Name</th>
                    <th>Total Outstanding (₹)</th>
                    <th>0-30 Days</th>
                    <th>31-60 Days</th>
                    <th>61-90 Days</th>
                    <th>90+ Days (Overdue)</th>
                    <th>Risk Tier</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={8} style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                        Loading outstanding aging matrix...
                      </td>
                    </tr>
                  ) : !report || report.rows.length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                        No outstanding records found matching criteria.
                      </td>
                    </tr>
                  ) : (
                    report.rows.slice(0, 50).map((row: any) => {
                      const isSent = remindedAccounts.has(row.businessId);
                      return (
                        <tr key={row.businessId}>
                          <td>
                            <div style={{ fontWeight: 600, color: '#f8fafc' }}>{row.businessName}</div>
                            {row.gstin && (
                              <div style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: '#64748b' }}>
                                {row.gstin}
                              </div>
                            )}
                          </td>
                          <td style={{ fontWeight: 700, color: row.totalOutstanding > 0 ? '#f87171' : '#34d399' }}>
                            ₹{Math.round(row.totalOutstanding).toLocaleString()}
                          </td>
                          <td>₹{Math.round(row.bucket0_30).toLocaleString()}</td>
                          <td>₹{Math.round(row.bucket31_60).toLocaleString()}</td>
                          <td>₹{Math.round(row.bucket61_90).toLocaleString()}</td>
                          <td style={{ fontWeight: 600, color: row.bucket90Plus > 0 ? '#f87171' : '#94a3b8' }}>
                            ₹{Math.round(row.bucket90Plus).toLocaleString()}
                          </td>
                          <td>{getRiskBadge(row.riskLevel)}</td>
                          <td>
                            {isSent ? (
                              <button className="secondary-btn reminder-btn-sent" disabled>
                                <CheckCircle2 size={13} color="#10b981" />
                                <span>Reminder Sent</span>
                              </button>
                            ) : (
                              <button 
                                className="secondary-btn" 
                                onClick={() => handleOpenReminderModal(row)}
                                style={{ fontSize: '0.775rem', padding: '0.4rem 0.75rem' }}
                              >
                                <Send size={12} color="#60a5fa" />
                                <span>Reminder</span>
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Interactive Payment Recovery & Reminder Modal */}
        {activeReminderAccount && (
          <div className="modal-backdrop" onClick={() => setActiveReminderAccount(null)}>
            <div className="modal-content" style={{ maxWidth: '640px' }} onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Send size={18} color="#60a5fa" />
                    <span>Send Payment Recovery Reminder</span>
                  </h3>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: '#94a3b8' }}>
                    Account: <strong style={{ color: '#f8fafc' }}>{activeReminderAccount.businessName}</strong>
                  </p>
                </div>
                <button 
                  onClick={() => setActiveReminderAccount(null)}
                  style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
                >
                  <X size={20} />
                </button>
              </div>

              <div className="modal-body">
                {/* Balance Summary Header */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '0.75rem',
                  background: '#090d16',
                  padding: '0.875rem',
                  borderRadius: '8px',
                  border: '1px solid #1e293b'
                }}>
                  <div>
                    <div style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase' }}>Total Balance</div>
                    <div style={{ fontSize: '1rem', fontWeight: 700, color: '#f87171' }}>
                      ₹{Math.round(activeReminderAccount.totalOutstanding).toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase' }}>Overdue (&gt;90 Days)</div>
                    <div style={{ fontSize: '1rem', fontWeight: 700, color: '#fbbf24' }}>
                      ₹{Math.round(activeReminderAccount.bucket90Plus || 0).toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase' }}>Risk Level</div>
                    <div style={{ marginTop: '0.2rem' }}>
                      {getRiskBadge(activeReminderAccount.riskLevel)}
                    </div>
                  </div>
                </div>

                {/* Dispatch Channel Selector */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#94a3b8', marginBottom: '0.4rem' }}>
                    Select Dispatch Channel:
                  </label>
                  <div className="channel-tab-group">
                    <button 
                      className={`channel-tab-btn ${reminderChannel === 'WHATSAPP' ? 'active whatsapp' : ''}`}
                      onClick={() => setReminderChannel('WHATSAPP')}
                    >
                      <MessageSquare size={16} />
                      <span>WhatsApp Web</span>
                    </button>
                    <button 
                      className={`channel-tab-btn ${reminderChannel === 'EMAIL' ? 'active' : ''}`}
                      onClick={() => setReminderChannel('EMAIL')}
                    >
                      <Mail size={16} />
                      <span>Email Notice</span>
                    </button>
                    <button 
                      className={`channel-tab-btn ${reminderChannel === 'SMS' ? 'active' : ''}`}
                      onClick={() => setReminderChannel('SMS')}
                    >
                      <Smartphone size={16} />
                      <span>Direct SMS</span>
                    </button>
                  </div>
                </div>

                {/* Target Contact */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#94a3b8', marginBottom: '0.3rem' }}>
                    Recipient Phone / Email:
                  </label>
                  <input 
                    type="text" 
                    className="filter-select" 
                    style={{ width: '100%', background: '#090d16' }}
                    value={recipientContact}
                    onChange={e => setRecipientContact(e.target.value)}
                    placeholder="Enter 10-digit mobile or email..."
                  />
                </div>

                {/* Message Template Editor */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#94a3b8', marginBottom: '0.3rem' }}>
                    Custom Reminder Notice:
                  </label>
                  <textarea 
                    className="reminder-textarea"
                    rows={6}
                    value={customMessage}
                    onChange={e => setCustomMessage(e.target.value)}
                  />
                </div>

                {/* Modal Actions */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                  <button className="secondary-btn" onClick={() => setActiveReminderAccount(null)}>
                    Cancel
                  </button>
                  <button 
                    className="primary-btn" 
                    onClick={handleDispatchReminder} 
                    disabled={isDispatching}
                    style={{ background: reminderChannel === 'WHATSAPP' ? '#10b981' : '#3b82f6' }}
                  >
                    {isDispatching ? (
                      <>
                        <RefreshCw size={14} className="animate-spin" />
                        <span>Dispatching...</span>
                      </>
                    ) : (
                      <>
                        <Send size={14} />
                        <span>{reminderChannel === 'WHATSAPP' ? 'Open & Send WhatsApp' : `Send ${reminderChannel} Notice`}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Global Toast Notification */}
        {toastMessage && (
          <div className="toast-notification">
            <CheckCircle2 size={18} color="#34d399" />
            <span>{toastMessage}</span>
          </div>
        )}
      </main>

      <ContextualGuidancePanel />
    </div>
  );
}
