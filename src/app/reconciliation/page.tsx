"use client";
import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import ThemeToggle from '@/components/ThemeToggle';
import ContextualGuidancePanel from '@/components/ContextualGuidancePanel';
import { 
  Building, 
  CheckCircle2, 
  AlertTriangle, 
  HelpCircle, 
  RefreshCw, 
  Search, 
  Filter, 
  Layers, 
  ArrowRightLeft, 
  ShieldAlert,
  Sparkles,
  ExternalLink,
  SlidersHorizontal,
  FileSpreadsheet,
  X,
  Info,
  Calendar,
  Layers2,
  CalendarX2,
  CopyX
} from 'lucide-react';
import '../dashboard.css';
import '../business-pages.css';

export default function ReconciliationPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [selectedMultiItem, setSelectedMultiItem] = useState<any | null>(null);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  const fetchReconciliation = async () => {
    try {
      setLoading(true);
      setError(null);
      let token = typeof window !== 'undefined' ? localStorage.getItem('conductor_session_token') : null;

      if (!token) {
        // Auto-authenticate as default demo Owner
        try {
          const authRes = await fetch('/api/v1/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'owner@agrawaltrading.com', password: 'owner123' }),
          });
          if (authRes.ok) {
            const authData = await authRes.json();
            token = authData.token;
            if (token && typeof window !== 'undefined') {
              localStorage.setItem('conductor_session_token', token);
              localStorage.setItem('conductor_user_role', 'OWNER');
              window.dispatchEvent(new Event('role_changed'));
            }
          }
        } catch (e) {
          console.warn('Auto-login attempt error:', e);
        }
      }

      const res = await fetch('/api/v1/reconciliation', {
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
      });

      if (res.status === 403 || res.status === 401) {
        setError('Access Denied (403 Forbidden): Valid Owner credentials required to access Bank Reconciliation. Please log in with Owner credentials.');
        setData(null);
        return;
      }
      if (res.ok) {
        const result = await res.json();
        setData(result);
      } else {
        const err = await res.json();
        setError(err.message || 'Failed to load bank reconciliation');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReconciliation();
    window.addEventListener('role_changed', fetchReconciliation);
    return () => {
      window.removeEventListener('role_changed', fetchReconciliation);
    };
  }, []);

  const getFilteredItems = () => {
    if (!data || !data.items) return [];
    return data.items.filter((item: any) => {
      if (filterStatus !== 'ALL' && item.matchStatus !== filterStatus) return false;
      if (search) {
        const q = search.toLowerCase();
        const part = item.bankRow?.rawNarration?.toLowerCase() || '';
        const acct = item.bankRow?.bankAccount?.toLowerCase() || '';
        const cls = item.classification?.toLowerCase() || '';
        const method = item.matchMethod?.toLowerCase() || '';
        const hasVcn = item.matchedTransactions?.some((t: any) => 
          t.invoiceId?.toLowerCase().includes(q) || t.partyName?.toLowerCase().includes(q)
        );
        return part.includes(q) || acct.includes(q) || cls.includes(q) || method.includes(q) || hasVcn;
      }
      return true;
    });
  };

  const handleQuickOwnerLogin = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'owner@agrawaltrading.com',
          password: 'owner123',
        }),
      });
      const authData = await res.json();
      if (res.ok && authData.token) {
        localStorage.setItem('conductor_session_token', authData.token);
        localStorage.setItem('conductor_user_role', 'OWNER');
        window.dispatchEvent(new Event('role_changed'));
        await fetchReconciliation();
      } else {
        setError(authData.message || 'Owner authentication failed');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = getFilteredItems();

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
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h1>Bank & Cash Ledger Reconciliation</h1>
                <span className="badge badge-certified" style={{ fontSize: '0.75rem' }}>Enterprise BRS Engine</span>
              </div>
              <p>Deterministic, evidence-gated matching between Bank Statements and ERP Vouchers with duplicate isolation, date gating & multi-reference aggregation</p>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button className="secondary-btn" onClick={fetchReconciliation} disabled={loading}>
                <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
                <span>Reconcile Now</span>
              </button>
            </div>
          </div>

          {error && (
            <div style={{
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '8px',
              padding: '1.2rem',
              color: '#f87171',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1.5rem',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                <ShieldAlert size={24} style={{ flexShrink: 0 }} />
                <div>
                  <strong>Authorization Notice</strong>
                  <p style={{ margin: 0, fontSize: '0.9rem' }}>{error}</p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '10px', flexShrink: 0 }}>
                <button 
                  onClick={handleQuickOwnerLogin}
                  style={{
                    background: 'linear-gradient(135deg, #34d399 0%, #059669 100%)',
                    color: '#000',
                    fontWeight: '700',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    boxShadow: '0 2px 8px rgba(52, 211, 153, 0.3)',
                  }}
                >
                  Sign in as Owner
                </button>
              </div>
            </div>
          )}

          {actionSuccessMsg && (
            <div style={{
              background: 'rgba(52, 211, 153, 0.12)',
              border: '1px solid rgba(52, 211, 153, 0.3)',
              borderRadius: '8px',
              padding: '0.8rem 1.2rem',
              color: 'var(--color-success)',
              marginBottom: '1.5rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span>{actionSuccessMsg}</span>
              <button onClick={() => setActionSuccessMsg(null)} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}>
                <X size={16} />
              </button>
            </div>
          )}

          {data && (
            <>
              {/* Comprehensive BRS Data Quality Audit Panel */}
              {data.dataQuality && (
                <div style={{
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--grid-line-major)',
                  borderLeft: '4px solid var(--color-warning)',
                  borderRadius: '10px',
                  padding: '1.25rem 1.5rem',
                  marginBottom: '1.5rem',
                  boxShadow: 'var(--shadow-card)',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', borderBottom: '1px solid var(--grid-line-minor)', paddingBottom: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ background: 'rgba(245, 158, 11, 0.12)', padding: '6px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Info size={18} color="var(--color-warning)" />
                      </div>
                      <div>
                        <strong style={{ fontSize: '0.95rem', color: 'var(--text-loud)', letterSpacing: '-0.01em' }}>BRS DATA QUALITY & AUDIT INTEGRITY GATE</strong>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Automated pre-reconciliation integrity check on passbook feeds & ERP ledgers</div>
                      </div>
                    </div>
                    <span className="badge badge-warning" style={{ fontSize: '0.75rem', fontWeight: 700, padding: '4px 10px' }}>
                      {data.dataQuality.statusLabel}
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', fontSize: '0.84rem' }}>
                    <div style={{ background: 'var(--bg-app)', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--grid-line-minor)' }}>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.74rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Bank Statement Span</div>
                      <div style={{ fontWeight: 700, color: 'var(--text-loud)', fontSize: '0.9rem', marginTop: '3px' }}>
                        {data.dataQuality.periodSummary?.bankEarliestDate} → {data.dataQuality.periodSummary?.bankLatestDate}
                      </div>
                    </div>
                    <div style={{ background: 'var(--bg-app)', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--grid-line-minor)' }}>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.74rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>ERP Ledger Span</div>
                      <div style={{ fontWeight: 700, color: 'var(--text-loud)', fontSize: '0.9rem', marginTop: '3px' }}>
                        {data.dataQuality.periodSummary?.erpEarliestDate} → {data.dataQuality.periodSummary?.erpLatestDate}
                      </div>
                    </div>
                    <div style={{ background: 'var(--bg-app)', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--grid-line-minor)' }}>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.74rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Duplicate Bank Rows</div>
                      <div style={{ fontWeight: 700, color: data.dataQuality.bankDuplicatesCount > 0 ? 'var(--color-warning)' : 'var(--color-success)', fontSize: '0.9rem', marginTop: '3px' }}>
                        {data.dataQuality.bankDuplicatesCount} isolated (Non-reconciled)
                      </div>
                    </div>
                    <div style={{ background: 'var(--bg-app)', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--grid-line-minor)' }}>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.74rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Date Conflicts Guarded</div>
                      <div style={{ fontWeight: 700, color: data.dateConflictCount > 0 ? 'var(--color-danger)' : 'var(--color-success)', fontSize: '0.9rem', marginTop: '3px' }}>
                        {data.dateConflictCount || 0} multi-year blocked
                      </div>
                    </div>
                  </div>

                  {data.dataQuality.issues?.length > 0 && (
                    <div style={{ 
                      marginTop: '12px', 
                      fontSize: '0.78rem', 
                      color: 'var(--text-default)', 
                      background: 'color-mix(in srgb, var(--color-warning) 8%, transparent)', 
                      border: '1px solid color-mix(in srgb, var(--color-warning) 25%, transparent)',
                      padding: '8px 12px', 
                      borderRadius: '6px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      <strong style={{ color: 'var(--color-warning)' }}>Audit Gate Summary:</strong> 
                      <span>{data.dataQuality.issues[0]?.message}</span>
                    </div>
                  )}
                </div>
              )}

              {/* 6-Column Financial KPI Grid */}
              <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
                <div className="kpi-card">
                  <div className="kpi-header">
                    <span>Total Bank Entries</span>
                    <Layers size={16} />
                  </div>
                  <div className="kpi-value">{data.totalRawBankEntries?.toLocaleString()}</div>
                  <div className="kpi-subtext">{data.totalCanonicalBankEntries} canonical + {data.totalDuplicateBankEntries} dups</div>
                </div>

                <div className="kpi-card">
                  <div className="kpi-header">
                    <span>High-Confidence Matched</span>
                    <CheckCircle2 size={16} color="var(--color-success)" />
                  </div>
                  <div className="kpi-value" style={{ color: 'var(--color-success)' }}>{data.matchedCount?.toLocaleString()}</div>
                  <div className="kpi-subtext">₹{(data.matchedAmount / 100000).toFixed(2)} Lakh verified</div>
                </div>

                <div className="kpi-card">
                  <div className="kpi-header">
                    <span>Date Conflicts (&gt;30d)</span>
                    <CalendarX2 size={16} color="#f87171" />
                  </div>
                  <div className="kpi-value" style={{ color: '#f87171' }}>{data.dateConflictCount?.toLocaleString()}</div>
                  <div className="kpi-subtext">Multi-year mismatch review</div>
                </div>

                <div className="kpi-card">
                  <div className="kpi-header">
                    <span>Partial Ref Resolution</span>
                    <AlertTriangle size={16} color="var(--color-warning)" />
                  </div>
                  <div className="kpi-value" style={{ color: 'var(--color-warning)' }}>{data.partialReferenceResolutionCount?.toLocaleString()}</div>
                  <div className="kpi-subtext">Multi-reference batch split</div>
                </div>

                <div className="kpi-card">
                  <div className="kpi-header">
                    <span>Special Items (No Invoice)</span>
                    <Sparkles size={16} color="#c084fc" />
                  </div>
                  <div className="kpi-value" style={{ color: '#c084fc' }}>{data.specialItemCount?.toLocaleString()}</div>
                  <div className="kpi-subtext">Opening, Charges, Taxes</div>
                </div>

                <div className="kpi-card">
                  <div className="kpi-header">
                    <span>Unmatched Bank Lines</span>
                    <HelpCircle size={16} color="var(--text-muted)" />
                  </div>
                  <div className="kpi-value" style={{ color: 'var(--text-loud)' }}>{data.unmatchedCount?.toLocaleString()}</div>
                  <div className="kpi-subtext">₹{(data.unmatchedAmount / 100000).toFixed(2)} Lakh unlinked</div>
                </div>
              </div>
            </>
          )}

          <div className="action-bar">
            <div className="filter-group">
              <label style={{ fontSize: '0.85rem', color: 'var(--text-loud)', fontWeight: 600 }}>Status Filter:</label>
              <select 
                className="filter-select"
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
              >
                <option value="ALL">All Reconciled Items</option>
                <option value="MATCHED">Matched (High/Medium/Low)</option>
                <option value="MATCHED_MULTI_REFERENCE">Multi-Reference Aggregate Match</option>
                <option value="PARTIAL_REFERENCE_RESOLUTION">Partial Reference Resolution</option>
                <option value="REFERENCE_DATE_CONFLICT">Date Conflict (&gt;30d window)</option>
                <option value="AMOUNT_MISMATCH">Amount Mismatch (in Date Window)</option>
                <option value="MULTI_REFERENCE_AMOUNT_MISMATCH">Multi-Ref Amount Mismatch</option>
                <option value="AMBIGUOUS">Ambiguous (Multiple Candidates)</option>
                <option value="SPECIAL_ITEM">Special Items (Opening Bal, Charges)</option>
                <option value="DUPLICATE_BANK_ENTRY">Duplicate Bank Entries (Isolated)</option>
                <option value="UNMATCHED_BANK">Unmatched Only</option>
              </select>
            </div>

            <div className="search-input-group">
              <Search size={16} color="var(--text-muted)" />
              <input 
                type="text" 
                placeholder="Search by bank, voucher, party, classification..." 
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="data-table-container" style={{ overflowX: 'auto', width: '100%' }}>
            <table className="data-table" style={{ minWidth: '1080px' }}>
              <thead>
                <tr>
                  <th style={{ minWidth: '120px' }}>Bank Account & Date</th>
                  <th style={{ minWidth: '160px', maxWidth: '220px' }}>Particulars / Narration</th>
                  <th style={{ minWidth: '110px' }}>Bank Amount (₹)</th>
                  <th style={{ minWidth: '130px' }}>Status & Method</th>
                  <th style={{ minWidth: '160px' }}>Matched ERP Transaction(s)</th>
                  <th style={{ minWidth: '90px' }}>Variance</th>
                  <th style={{ minWidth: '220px', maxWidth: '260px' }}>Confidence & Explanation</th>
                  <th style={{ minWidth: '110px', textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                      Executing deterministic 5-stage BRS reconciliation pipeline...
                    </td>
                  </tr>
                ) : filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                      No bank reconciliation records found matching selected filter.
                    </td>
                  </tr>
                ) : (
                  filteredItems.slice(0, 60).map((item: any, i: number) => {
                    const statusClass = 
                      item.matchStatus === 'MATCHED' || item.matchStatus === 'MATCHED_MULTI_REFERENCE' ? 'badge-success' :
                      item.matchStatus === 'PARTIAL_REFERENCE_RESOLUTION' ? 'badge-warning' :
                      item.matchStatus === 'REFERENCE_DATE_CONFLICT' ? 'badge-danger' :
                      item.matchStatus === 'AMOUNT_MISMATCH' || item.matchStatus === 'MULTI_REFERENCE_AMOUNT_MISMATCH' ? 'badge-danger' :
                      item.matchStatus === 'AMBIGUOUS' ? 'badge-warning' :
                      item.matchStatus === 'SPECIAL_ITEM' ? 'badge-certified' :
                      item.matchStatus === 'DUPLICATE_BANK_ENTRY' ? 'badge-warning' : 'badge-neutral';

                    const isMulti = (item.matchedTransactions?.length || 0) > 1;

                    return (
                      <tr key={item.id || i}>
                        <td style={{ verticalAlign: 'top' }}>
                          <div style={{ fontWeight: 700, color: 'var(--text-loud)', fontSize: '0.88rem' }}>{item.bankRow?.bankAccount}</div>
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>{item.bankRow?.transactionDate}</div>
                        </td>
                        <td style={{ maxWidth: '220px', fontSize: '0.82rem', color: 'var(--text-default)', verticalAlign: 'top' }}>
                          <div style={{ fontWeight: 600 }}>{item.bankRow?.rawNarration}</div>
                          {item.bankRow?.extractedReferences?.length > 0 && (
                            <div style={{ fontSize: '0.72rem', color: '#818cf8', marginTop: '2px', fontWeight: 600 }}>
                              Refs: {item.bankRow.extractedReferences.join(', ')}
                            </div>
                          )}
                          {item.classification && (
                            <span style={{ 
                              fontSize: '0.68rem', 
                              padding: '1px 6px', 
                              borderRadius: '4px', 
                              background: item.classification === 'OPENING_BALANCE' || item.classification === 'BANK_CHARGE' ? 'rgba(192, 132, 252, 0.15)' : 'rgba(129, 140, 248, 0.1)', 
                              color: item.classification === 'OPENING_BALANCE' || item.classification === 'BANK_CHARGE' ? '#c084fc' : '#818cf8', 
                              fontWeight: 700,
                              display: 'inline-block',
                              marginTop: '2px'
                            }}>
                              {item.classification}
                            </span>
                          )}
                        </td>
                        <td style={{ fontWeight: 700, color: item.bankRow?.debitCredit === 'CREDIT' ? 'var(--color-success)' : 'var(--color-danger)', verticalAlign: 'top' }}>
                          <div>₹{item.bankRow?.amount?.toLocaleString()}</div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>({item.bankRow?.debitCredit})</div>
                        </td>
                        <td style={{ verticalAlign: 'top' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <span className={`badge ${statusClass}`} style={{ fontSize: '0.72rem', whiteSpace: 'nowrap' }}>
                              {item.matchStatus}
                            </span>
                            {item.matchMethod && item.matchMethod !== 'UNMATCHED' && (
                              <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                                via {item.matchMethod}
                              </span>
                            )}
                          </div>
                        </td>
                        <td style={{ verticalAlign: 'top' }}>
                          {isMulti ? (
                            <div>
                              <div style={{ fontWeight: 700, color: 'var(--accent-secondary)', fontSize: '0.82rem' }}>
                                Aggregate ({item.matchedTransactions.length} Vouchers)
                              </div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                Sum: ₹{item.aggregateErpAmount?.toLocaleString()}
                              </div>
                              <button 
                                onClick={() => setSelectedMultiItem(item)}
                                style={{
                                  background: 'rgba(56, 189, 248, 0.12)',
                                  color: '#0284c7',
                                  border: '1px solid rgba(56, 189, 248, 0.35)',
                                  borderRadius: '4px',
                                  padding: '3px 8px',
                                  fontSize: '0.72rem',
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                  marginTop: '4px',
                                  display: 'inline-block'
                                }}
                              >
                                View {item.matchedTransactions.length} linked vouchers
                              </button>
                            </div>
                          ) : item.matchedTransaction ? (
                            <div>
                              <div style={{ fontWeight: 700, color: 'var(--accent-secondary)', fontSize: '0.85rem' }}>
                                Voucher #{item.matchedTransaction.invoiceId}
                              </div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                                {item.matchedTransaction.partyName} (₹{item.matchedTransaction.grossAmount?.toLocaleString()})
                              </div>
                              {item.dateDifferenceDays !== undefined && (
                                <div style={{ fontSize: '0.7rem', color: Math.abs(item.dateDifferenceDays) > 30 ? '#f87171' : 'var(--text-muted)', fontWeight: 600 }}>
                                  Date diff: {item.dateDifferenceDays > 0 ? `+${item.dateDifferenceDays}` : item.dateDifferenceDays}d
                                </div>
                              )}
                            </div>
                          ) : item.matchStatus === 'SPECIAL_ITEM' ? (
                            <span style={{ color: '#c084fc', fontSize: '0.78rem', fontWeight: 600 }}>
                              {item.classification} (Non-Commercial)
                            </span>
                          ) : item.matchStatus === 'DUPLICATE_BANK_ENTRY' ? (
                            <span style={{ color: 'var(--color-warning)', fontSize: '0.78rem', fontWeight: 600 }}>
                              Duplicate Bank Feed Row
                            </span>
                          ) : (
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600 }}>No ERP Match</span>
                          )}
                        </td>
                        <td style={{ fontWeight: 700, color: item.variance !== 0 ? 'var(--color-danger)' : 'var(--text-muted)', verticalAlign: 'top' }}>
                          {item.variance !== 0 ? `₹${Math.abs(item.variance).toLocaleString()}` : '₹0.00'}
                        </td>
                        <td style={{ fontSize: '0.76rem', maxWidth: '260px', verticalAlign: 'top' }}>
                          <div style={{ fontWeight: 700, color: item.confidenceLevel === 'HIGH' ? 'var(--color-success)' : item.confidenceLevel === 'MEDIUM' ? 'var(--color-warning)' : item.confidenceLevel === 'REVIEW' ? '#f87171' : 'var(--text-muted)' }}>
                            Confidence: {item.confidenceLevel} ({item.matchConfidence}%)
                          </div>
                          <div style={{ color: 'var(--text-muted)', fontWeight: 500, lineHeight: '1.3', marginTop: '2px' }}>
                            {item.explanation || item.notes}
                          </div>
                        </td>
                        <td style={{ verticalAlign: 'top', textAlign: 'center', whiteSpace: 'nowrap' }}>
                          {item.matchStatus === 'REFERENCE_DATE_CONFLICT' || item.matchStatus === 'PARTIAL_REFERENCE_RESOLUTION' || item.reviewRequired ? (
                            <button 
                              onClick={() => {
                                setActionSuccessMsg(`Row #${item.bankRow?.sourceRowNumber} marked for accountant review.`);
                              }}
                              style={{
                                background: 'rgba(217, 119, 6, 0.12)',
                                color: '#d97706',
                                border: '1px solid rgba(217, 119, 6, 0.4)',
                                borderRadius: '6px',
                                padding: '5px 12px',
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                              }}
                            >
                              Review Item
                            </button>
                          ) : item.matchStatus === 'UNMATCHED_BANK' ? (
                            <button 
                              onClick={() => {
                                setActionSuccessMsg(`Row #${item.bankRow?.sourceRowNumber} marked for ${item.classification} allocation.`);
                              }}
                              style={{
                                background: 'rgba(99, 102, 241, 0.1)',
                                color: '#6366f1',
                                border: '1px solid rgba(99, 102, 241, 0.35)',
                                borderRadius: '6px',
                                padding: '5px 12px',
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                              }}
                            >
                              Classify
                            </button>
                          ) : (
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Multi-Reference Voucher Breakdown Modal */}
      {selectedMultiItem && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px'
        }}>
          <div style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--grid-line-major)',
            borderRadius: '12px',
            width: '100%',
            maxWidth: '650px',
            padding: '24px',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.25)',
            color: 'var(--text-loud)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>Consolidated Multi-Voucher Settlement</h3>
                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Bank Amount: <strong>₹{selectedMultiItem.bankRow?.amount?.toLocaleString()}</strong> | Net Resolved ERP Sum: <strong>₹{selectedMultiItem.aggregateErpAmount?.toLocaleString()}</strong>
                </p>
              </div>
              <button onClick={() => setSelectedMultiItem(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ maxHeight: '350px', overflowY: 'auto', marginBottom: '20px' }}>
              <table className="data-table" style={{ fontSize: '0.82rem' }}>
                <thead>
                  <tr>
                    <th>Voucher #</th>
                    <th>Type</th>
                    <th>Date</th>
                    <th>Party Name</th>
                    <th>Amount (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedMultiItem.matchedTransactions?.map((v: any, idx: number) => (
                    <tr key={idx}>
                      <td style={{ fontWeight: 700, color: 'var(--accent-secondary)' }}>#{v.invoiceId}</td>
                      <td><span className="badge badge-neutral">{v.type}</span></td>
                      <td>{v.date}</td>
                      <td>{v.partyName}</td>
                      <td style={{ fontWeight: 700, color: v.type === 'sale_return' || v.invoiceId.startsWith('CN') ? 'var(--color-danger)' : 'var(--color-success)' }}>
                        {v.type === 'sale_return' || v.invoiceId.startsWith('CN') ? `-₹${v.grossAmount?.toLocaleString()}` : `₹${v.grossAmount?.toLocaleString()}`}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--grid-line-major)', paddingTop: '16px' }}>
              <div style={{ fontSize: '0.82rem' }}>
                Unresolved Variance: <strong style={{ color: selectedMultiItem.variance !== 0 ? 'var(--color-danger)' : 'var(--color-success)' }}>₹{Math.abs(selectedMultiItem.variance).toLocaleString()}</strong>
              </div>
              <button 
                onClick={() => setSelectedMultiItem(null)}
                style={{
                  background: 'var(--accent-primary, #6366f1)',
                  color: '#fff',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '0.85rem'
                }}
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}

      <ContextualGuidancePanel />
    </div>
  );
}
