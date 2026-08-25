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
  ShieldAlert 
} from 'lucide-react';
import '../dashboard.css';
import '../business-pages.css';

export default function ReconciliationPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);

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
        const part = item.bankRow?.particulars?.toLowerCase() || '';
        const acct = item.bankRow?.bankAccount?.toLowerCase() || '';
        const vcn = item.matchedTransaction?.invoiceId?.toLowerCase() || '';
        const party = item.matchedTransaction?.partyName?.toLowerCase() || '';
        return part.includes(q) || acct.includes(q) || vcn.includes(q) || party.includes(q);
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
              <h1>Bank & Cash Ledger Reconciliation</h1>
              <p>Automated 4-rule matching between Bank Statements (BANK & CASH LEDGERS) and ERP Vouchers & Journal Invoices</p>
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
                <a 
                  href="/login"
                  style={{
                    background: 'transparent',
                    border: '1px solid #94a3b8',
                    color: '#f8fafc',
                    padding: '8px 14px',
                    borderRadius: '6px',
                    textDecoration: 'none',
                    fontSize: '0.85rem',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  Go to Login
                </a>
              </div>
            </div>
          )}

          {data && (
            <div className="kpi-grid">
              <div className="kpi-card">
                <div className="kpi-header">
                  <span>Total Bank Lines</span>
                  <Layers size={16} />
                </div>
                <div className="kpi-value">{data.totalBankEntries?.toLocaleString()}</div>
                <div className="kpi-subtext">Across 7 Bank & Cash Ledgers</div>
              </div>
              <div className="kpi-card">
                <div className="kpi-header">
                  <span>Matched Entries</span>
                  <CheckCircle2 size={16} color="#34d399" />
                </div>
                <div className="kpi-value" style={{ color: '#34d399' }}>{data.matchedCount?.toLocaleString()}</div>
                <div className="kpi-subtext">₹{(data.matchedAmount / 100000).toFixed(2)} Lakh verified</div>
              </div>
              <div className="kpi-card">
                <div className="kpi-header">
                  <span>Unmatched Bank Lines</span>
                  <HelpCircle size={16} color="#fbbf24" />
                </div>
                <div className="kpi-value" style={{ color: '#fbbf24' }}>{data.unmatchedCount?.toLocaleString()}</div>
                <div className="kpi-subtext">₹{(data.unmatchedAmount / 100000).toFixed(2)} Lakh unlinked</div>
              </div>
              <div className="kpi-card">
                <div className="kpi-header">
                  <span>Amount Mismatches</span>
                  <AlertTriangle size={16} color="#f87171" />
                </div>
                <div className="kpi-value" style={{ color: '#f87171' }}>{data.mismatchCount?.toLocaleString()}</div>
                <div className="kpi-subtext">₹{(data.mismatchAmount / 100000).toFixed(2)} Lakh variance</div>
              </div>
            </div>
          )}

          <div className="action-bar">
            <div className="filter-group">
              <label style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Status:</label>
              <select 
                className="filter-select"
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
              >
                <option value="ALL">All Reconciled Items</option>
                <option value="MATCHED">Matched Only</option>
                <option value="UNMATCHED_BANK">Unmatched Only</option>
                <option value="AMOUNT_MISMATCH">Amount Mismatch</option>
              </select>
            </div>

            <div className="search-input-group">
              <Search size={16} color="#94a3b8" />
              <input 
                type="text" 
                placeholder="Search by bank, voucher, party..." 
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Bank Account & Date</th>
                  <th>Particulars / Cheque</th>
                  <th>Bank Amount (₹)</th>
                  <th>Status</th>
                  <th>Matched ERP Transaction</th>
                  <th>Variance</th>
                  <th>Confidence & Notes</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                      Executing automated 4-rule reconciliation matching engine...
                    </td>
                  </tr>
                ) : filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                      No bank reconciliation records found.
                    </td>
                  </tr>
                ) : (
                  filteredItems.slice(0, 50).map((item: any, i: number) => {
                    const statusClass = 
                      item.matchStatus === 'MATCHED' ? 'badge-success' :
                      item.matchStatus === 'AMOUNT_MISMATCH' ? 'badge-danger' :
                      item.matchStatus === 'DATE_MISMATCH' ? 'badge-warning' : 'badge-neutral';
                    
                    return (
                      <tr key={i}>
                        <td>
                          <div style={{ fontWeight: 600, color: '#f8fafc' }}>{item.bankRow?.bankAccount}</div>
                          <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{item.bankRow?.date?.substring(0, 10)}</div>
                        </td>
                        <td style={{ maxWidth: '280px', fontSize: '0.8rem', color: '#cbd5e1' }}>
                          {item.bankRow?.particulars}
                        </td>
                        <td style={{ fontWeight: 600, color: item.bankRow?.type === 'RECEIPT' ? '#34d399' : '#f87171' }}>
                          ₹{item.bankRow?.amount?.toLocaleString()} ({item.bankRow?.type})
                        </td>
                        <td>
                          <span className={`badge ${statusClass}`}>
                            {item.matchStatus}
                          </span>
                        </td>
                        <td>
                          {item.matchedTransaction ? (
                            <div>
                              <div style={{ fontWeight: 600, color: '#60a5fa' }}>Voucher #{item.matchedTransaction.invoiceId}</div>
                              <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{item.matchedTransaction.partyName} (₹{item.matchedTransaction.grossAmount?.toLocaleString()})</div>
                            </div>
                          ) : (
                            <span style={{ color: '#64748b', fontSize: '0.8rem' }}>No ERP Match</span>
                          )}
                        </td>
                        <td style={{ fontWeight: 600, color: item.variance !== 0 ? '#f87171' : '#94a3b8' }}>
                          {item.variance !== 0 ? `₹${Math.abs(item.variance).toLocaleString()}` : '₹0.00'}
                        </td>
                        <td style={{ fontSize: '0.75rem', color: '#94a3b8', maxWidth: '250px' }}>
                          <div>Confidence: {item.matchConfidence}%</div>
                          <div>{item.notes}</div>
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

      <ContextualGuidancePanel />
    </div>
  );
}
