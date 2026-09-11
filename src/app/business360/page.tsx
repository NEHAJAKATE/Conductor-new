"use client";
import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import ThemeToggle from '@/components/ThemeToggle';
import ContextualGuidancePanel from '@/components/ContextualGuidancePanel';
import { 
  Building2, 
  Search, 
  Filter, 
  ShieldCheck, 
  CreditCard, 
  MapPin, 
  Phone, 
  Mail, 
  FileText, 
  ExternalLink,
  X,
  AlertTriangle,
  RefreshCw,
  List,
  FileCheck
} from 'lucide-react';
import '../dashboard.css';
import '../business-pages.css';
import { formatDate, formatINR } from '@/lib/formatters';

interface Business {
  id: string;
  name: string;
  legalName?: string;
  taxId?: string;
  pan?: string;
  drugLicenses?: string[];
  classification: string;
  address: {
    city?: string;
    area?: string;
    route?: string;
  };
  contact: {
    phone1?: string;
    mobile?: string;
    email?: string;
  };
  credit: {
    creditLimit: number;
    creditDays: number;
    limitType?: string;
    isFrozen?: boolean;
    dynamicCreditLimit?: number;
    avgMonthlySale?: number;
    monthsOfHistory?: number;
    creditMultiplier?: number;
    creditUtilization?: number;
    creditStatus?: 'WITHIN_LIMIT' | 'APPROACHING_LIMIT' | 'BREACHED' | 'NO_HISTORY';
    creditStatusReason?: string;
  };
  totalSales?: number;
  currentOutstanding?: number;
  customAttributes?: Record<string, any>;
  updatedAt: string;
}

export default function Business360Page() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClassification, setSelectedClassification] = useState('');
  const [activeBusiness, setActiveBusiness] = useState<Business | null>(null);
  const [activeTab, setActiveTab] = useState<'profile' | 'ledger' | 'reconciliation'>('profile');
  const [ledgerData, setLedgerData] = useState<{transactions: any[], outstanding: any} | null>(null);
  const [ledgerLoading, setLedgerLoading] = useState(false);
  const [reconData, setReconData] = useState<any>(null);
  const [reconLoading, setReconLoading] = useState(false);

  useEffect(() => {
    if (activeBusiness) {
      const fetchLedger = async () => {
        try {
          setLedgerLoading(true);
          const res = await fetch(`/api/v1/customer-transactions?businessId=${activeBusiness.id}&partyName=${encodeURIComponent(activeBusiness.name)}`);
          if (res.ok) {
            setLedgerData(await res.json());
          }
        } catch (err) {
          console.error(err);
        } finally {
          setLedgerLoading(false);
        }
      };
      
      const fetchRecon = async () => {
        try {
          setReconLoading(true);
          const res = await fetch(`/api/v1/reconciliation?account=${encodeURIComponent(activeBusiness.name)}`);
          if (res.ok) {
            setReconData(await res.json());
          }
        } catch (err) {
          console.error(err);
        } finally {
          setReconLoading(false);
        }
      };

      fetchLedger();
      fetchRecon();
    } else {
      setLedgerData(null);
      setReconData(null);
      setActiveTab('profile');
    }
  }, [activeBusiness]);

  const fetchStatsAndList = async () => {
    try {
      setLoading(true);
      const [statsRes, listRes] = await Promise.all([
        fetch('/api/v1/business360?stats=true'),
        fetch(`/api/v1/business360?query=${encodeURIComponent(searchQuery)}&classification=${selectedClassification}`)
      ]);

      if (statsRes.ok) {
        const sData = await statsRes.json();
        setStats(sData);
      }
      if (listRes.ok) {
        const lData = await listRes.json();
        setBusinesses(lData.businesses || []);
      }
    } catch (err) {
      console.error('Failed to load business data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatsAndList();
  }, [selectedClassification]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchStatsAndList();
  };

  const getClassificationBadge = (cls: string) => {
    switch (cls) {
      case 'b2b_dealer':
        return <span className="badge badge-success">Chemist Dealer</span>;
      case 'b2b_hospital':
        return <span className="badge badge-info">Hospital / Clinic</span>;
      case 'supplier':
        return <span className="badge badge-warning">Supplier</span>;
      case 'field_staff':
        return <span className="badge badge-neutral">Field Staff</span>;
      default:
        return <span className="badge badge-neutral">Standard Account</span>;
    }
  };

  const getCreditStatusBadge = (status?: string, utilization?: number) => {
    switch (status) {
      case 'BREACHED':
        return (
          <span className="badge" style={{ backgroundColor: 'rgba(239, 68, 68, 0.2)', color: '#f87171', border: '1px solid #ef4444' }}>
            BREACHED ({utilization}%)
          </span>
        );
      case 'APPROACHING_LIMIT':
        return (
          <span className="badge" style={{ backgroundColor: 'rgba(245, 158, 11, 0.2)', color: '#fbbf24', border: '1px solid #f59e0b' }}>
            NEAR LIMIT ({utilization}%)
          </span>
        );
      case 'WITHIN_LIMIT':
        return (
          <span className="badge" style={{ backgroundColor: 'rgba(16, 185, 129, 0.2)', color: '#34d399', border: '1px solid #10b981' }}>
            WITHIN LIMIT
          </span>
        );
      default:
        return <span className="badge badge-neutral">NO SALES HISTORY</span>;
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
              <h1>Business 360° Directory</h1>
              <p>Unified account profiles, GSTIN tax identifiers, credit limits, and outstanding ledger intelligence</p>
            </div>
            <button className="secondary-btn" onClick={fetchStatsAndList} disabled={loading}>
              <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
              <span>Refresh Data</span>
            </button>
          </div>

          {stats && (
            <div className="kpi-grid">
              <div className="kpi-card">
                <div className="kpi-header">
                  <span>Total Accounts</span>
                  <Building2 size={16} />
                </div>
                <div className="kpi-value">{stats.totalBusinesses.toLocaleString()}</div>
                <div className="kpi-subtext">Active trade ledgers</div>
              </div>
              <div className="kpi-card">
                <div className="kpi-header">
                  <span>Verified GSTINs</span>
                  <ShieldCheck size={16} />
                </div>
                <div className="kpi-value">{stats.verifiedGstin.toLocaleString()}</div>
                <div className="kpi-subtext">Tax compliant dealers</div>
              </div>
              <div className="kpi-card">
                <div className="kpi-header">
                  <span>Total Outstanding</span>
                  <CreditCard size={16} />
                </div>
                <div className="kpi-value">₹{(stats.totalOutstanding / 100000).toFixed(2)} L</div>
                <div className="kpi-subtext">Receivables ledger balance</div>
              </div>
              <div className="kpi-card">
                <div className="kpi-header">
                  <span>Lifetime Invoiced</span>
                  <FileText size={16} />
                </div>
                <div className="kpi-value">₹{(stats.totalSales / 100000).toFixed(2)} L</div>
                <div className="kpi-subtext">Total sales journal volume</div>
              </div>
            </div>
          )}

          <div className="action-bar">
            <form onSubmit={handleSearchSubmit} className="search-input-group">
              <Search size={16} color="#64748b" />
              <input 
                type="text" 
                placeholder="Search by Trade Name, GSTIN, PAN, City, Area..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </form>

            <div className="filter-group">
              <select 
                className="filter-select"
                value={selectedClassification}
                onChange={e => setSelectedClassification(e.target.value)}
              >
                <option value="">All Account Types</option>
                <option value="b2b_dealer">B2B Chemist Dealers</option>
                <option value="b2b_hospital">Hospitals & Clinics</option>
                <option value="supplier">Suppliers & Creditors</option>
                <option value="field_staff">Field Staff Accounts</option>
              </select>
              <button className="primary-btn" onClick={fetchStatsAndList}>Search</button>
            </div>
          </div>

          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Account Name</th>
                  <th>GSTIN / PAN</th>
                  <th>Location</th>
                  <th>Classification</th>
                  <th>Credit Limit</th>
                  <th>Outstanding</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                      Loading Business 360 directory...
                    </td>
                  </tr>
                ) : businesses.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                      No business accounts matched the filter.
                    </td>
                  </tr>
                ) : (
                  businesses.slice(0, 50).map(b => (
                    <tr key={b.id}>
                      <td>
                        <div style={{ fontWeight: 700, color: 'var(--text-loud)', fontSize: '0.925rem' }}>{b.name}</div>
                        {b.legalName && b.legalName !== b.name && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{b.legalName}</div>
                        )}
                      </td>
                      <td>
                        {b.taxId ? (
                          <span style={{ fontFamily: 'monospace', color: 'var(--accent-secondary)', fontWeight: 600 }}>{b.taxId}</span>
                        ) : b.pan ? (
                          <span style={{ fontFamily: 'monospace', color: 'var(--text-muted)' }}>PAN: {b.pan}</span>
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Unregistered</span>
                        )}
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                          <MapPin size={13} color="var(--text-muted)" />
                          <span>{b.address.city || 'Prayagraj'}{b.address.area ? `, ${b.address.area}` : ''}</span>
                        </div>
                      </td>
                      <td>{getClassificationBadge(b.classification)}</td>
                      <td>
                        {b.credit.dynamicCreditLimit && b.credit.dynamicCreditLimit > 0 ? (
                          <div>
                            <div style={{ fontWeight: 700, color: 'var(--text-loud)' }}>
                              ₹{Math.round(b.credit.dynamicCreditLimit).toLocaleString()}
                            </div>
                            <div style={{ fontSize: '0.75rem', marginTop: '0.2rem' }}>
                              {getCreditStatusBadge(b.credit.creditStatus, b.credit.creditUtilization)}
                            </div>
                          </div>
                        ) : b.credit.creditLimit > 0 ? (
                          <div>
                            <div style={{ fontWeight: 600, color: 'var(--text-loud)' }}>₹{b.credit.creditLimit.toLocaleString()} (Static)</div>
                            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{b.credit.creditDays} Days</div>
                          </div>
                        ) : (
                          <div>
                            <span style={{ color: '#64748b' }}>No History</span>
                          </div>
                        )}
                      </td>
                      <td>
                        {b.currentOutstanding !== undefined && b.currentOutstanding !== 0 ? (
                          <span style={{ 
                            fontWeight: 600, 
                            color: b.credit.creditStatus === 'BREACHED' ? '#f87171' : b.currentOutstanding < 0 ? '#60a5fa' : '#34d399' 
                          }}>
                            ₹{Math.round(b.currentOutstanding).toLocaleString()}
                          </span>
                        ) : (
                          <span style={{ color: '#64748b' }}>₹0</span>
                        )}
                      </td>
                      <td>
                        <button 
                          className="secondary-btn" 
                          onClick={() => setActiveBusiness(b)}
                        >
                          <span>360° View</span>
                          <ExternalLink size={13} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {activeBusiness && (
          <div className="modal-backdrop" onClick={() => setActiveBusiness(null)}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#fff' }}>{activeBusiness.name}</h3>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: '#94a3b8' }}>
                    Canonical ID: <code style={{ color: '#60a5fa' }}>{activeBusiness.id}</code>
                  </p>
                </div>
                <button 
                  onClick={() => setActiveBusiness(null)}
                  style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
                >
                  <X size={20} />
                </button>
              </div>
              <div className="modal-tabs" style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--grid-line-major)', padding: '0 1.5rem', background: 'var(--bg-app)' }}>
                <button 
                  className={`tab-btn ${activeTab === 'profile' ? 'active' : ''}`}
                  onClick={() => setActiveTab('profile')}
                  style={{ background: 'transparent', border: 'none', padding: '1rem 0', color: activeTab === 'profile' ? 'var(--accent-secondary)' : 'var(--text-muted)', borderBottom: activeTab === 'profile' ? '2px solid var(--accent-secondary)' : '2px solid transparent', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                  <Building2 size={16} /> Business Profile
                </button>
                <button 
                  className={`tab-btn ${activeTab === 'ledger' ? 'active' : ''}`}
                  onClick={() => setActiveTab('ledger')}
                  style={{ background: 'transparent', border: 'none', padding: '1rem 0', color: activeTab === 'ledger' ? '#60a5fa' : '#94a3b8', borderBottom: activeTab === 'ledger' ? '2px solid #60a5fa' : '2px solid transparent', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                  <List size={16} /> Sales Ledger & Outstanding
                </button>
                <button 
                  className={`tab-btn ${activeTab === 'reconciliation' ? 'active' : ''}`}
                  onClick={() => setActiveTab('reconciliation')}
                  style={{ background: 'transparent', border: 'none', padding: '1rem 0', color: activeTab === 'reconciliation' ? '#60a5fa' : '#94a3b8', borderBottom: activeTab === 'reconciliation' ? '2px solid #60a5fa' : '2px solid transparent', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                  <FileCheck size={16} /> Payments & Reconciliation
                </button>
              </div>
              
              <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                {activeTab === 'profile' && (
                  <>
                <div className="profile-section">
                  <h4>Identity & Registration</h4>
                  <div className="detail-grid">
                    <div className="detail-item">
                      <span className="detail-label">GSTIN / Tax ID</span>
                      <span className="detail-value" style={{ fontFamily: 'monospace' }}>
                        {activeBusiness.taxId || 'Not Registered'}
                      </span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">PAN Number</span>
                      <span className="detail-value" style={{ fontFamily: 'monospace' }}>
                        {activeBusiness.pan || 'N/A'}
                      </span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Classification</span>
                      <span className="detail-value">{getClassificationBadge(activeBusiness.classification)}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Drug Licenses</span>
                      <span className="detail-value">
                        {activeBusiness.drugLicenses && activeBusiness.drugLicenses.length > 0 
                          ? activeBusiness.drugLicenses.join(', ') 
                          : 'None on record'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="profile-section" style={{ borderLeft: '3px solid #60a5fa', paddingLeft: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <h4 style={{ margin: 0 }}>Dynamic Credit Engine (45-Day Threshold)</h4>
                    {getCreditStatusBadge(activeBusiness.credit.creditStatus, activeBusiness.credit.creditUtilization)}
                  </div>
                  
                  <div className="detail-grid">
                    <div className="detail-item">
                      <span className="detail-label">Dynamic Limit (1.5x Avg)</span>
                      <span className="detail-value" style={{ color: '#60a5fa', fontWeight: 700, fontSize: '1.05rem' }}>
                        ₹{activeBusiness.credit.dynamicCreditLimit ? Math.round(activeBusiness.credit.dynamicCreditLimit).toLocaleString() : 'N/A'}
                      </span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Avg Monthly Purchases</span>
                      <span className="detail-value">
                        ₹{activeBusiness.credit.avgMonthlySale ? Math.round(activeBusiness.credit.avgMonthlySale).toLocaleString() : 'N/A'}
                      </span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Current Outstanding</span>
                      <span className="detail-value" style={{ 
                        color: activeBusiness.credit.creditStatus === 'BREACHED' ? '#f87171' : '#34d399', 
                        fontWeight: 700 
                      }}>
                        ₹{Math.round(activeBusiness.currentOutstanding || 0).toLocaleString()}
                      </span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Limit Utilization</span>
                      <span className="detail-value" style={{ 
                        color: (activeBusiness.credit.creditUtilization || 0) >= 100 ? '#f87171' : '#38bdf8',
                        fontWeight: 600 
                      }}>
                        {activeBusiness.credit.creditUtilization !== undefined ? `${activeBusiness.credit.creditUtilization}%` : 'N/A'}
                      </span>
                    </div>
                  </div>
                  
                  {activeBusiness.credit.creditStatusReason && (
                    <div style={{ 
                      marginTop: '0.75rem', 
                      padding: '0.5rem 0.75rem', 
                      borderRadius: '6px', 
                      backgroundColor: 'rgba(255,255,255,0.03)', 
                      fontSize: '0.8rem',
                      color: '#94a3b8' 
                    }}>
                      <strong>Reason: </strong> {activeBusiness.credit.creditStatusReason}
                    </div>
                  )}
                </div>

                <div className="profile-section">
                  <h4>Static ERP Policy</h4>
                  <div className="detail-grid">
                    <div className="detail-item">
                      <span className="detail-label">ERP Stored Limit</span>
                      <span className="detail-value">₹{activeBusiness.credit.creditLimit.toLocaleString()}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">ERP Credit Days</span>
                      <span className="detail-value">{activeBusiness.credit.creditDays} Days</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Limit Action</span>
                      <span className="detail-value">{activeBusiness.credit.limitType || 'Standard'}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Months of Sales History</span>
                      <span className="detail-value">{activeBusiness.credit.monthsOfHistory || 0} Months</span>
                    </div>
                  </div>
                </div>

                <div className="profile-section">
                  <h4>Contact & Territory</h4>
                  <div className="detail-grid">
                    <div className="detail-item">
                      <span className="detail-label">City & Area</span>
                      <span className="detail-value">
                        {activeBusiness.address.city || 'Prayagraj'}{activeBusiness.address.area ? `, ${activeBusiness.address.area}` : ''}
                      </span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Delivery Route</span>
                      <span className="detail-value">{activeBusiness.address.route || 'Local Route'}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Mobile / Phone</span>
                      <span className="detail-value">{activeBusiness.contact.mobile || activeBusiness.contact.phone1 || 'N/A'}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Email</span>
                      <span className="detail-value">{activeBusiness.contact.email || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                {activeBusiness.customAttributes && Object.keys(activeBusiness.customAttributes).length > 0 && (
                  <div className="profile-section" style={{ borderLeft: '3px solid #a855f7', paddingLeft: '1rem' }}>
                    <h4>Custom Schema Parameters</h4>
                    <div className="detail-grid">
                      {Object.entries(activeBusiness.customAttributes).map(([key, val]) => (
                        <div key={key} className="detail-item">
                          <span className="detail-label" style={{ textTransform: 'capitalize' }}>
                            {key.replace(/_/g, ' ')}
                          </span>
                          <span className="detail-value" style={{ color: '#c084fc', fontWeight: 600 }}>
                            {typeof val === 'boolean' ? (val ? 'Yes (Opted In)' : 'No') : String(val)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                </>
                )}

                {activeTab === 'ledger' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {/* Outstanding Buckets */}
                    {ledgerData?.outstanding && (
                      <div className="profile-section" style={{ borderLeft: '3px solid var(--color-warning)', paddingLeft: '1rem' }}>
                        <h4>Outstanding Balance Breakdown</h4>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                          <div style={{ flex: 1, background: 'var(--bg-app)', border: '1px solid var(--grid-line-major)', padding: '1rem', borderRadius: '8px' }}>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem', fontWeight: 600 }}>0-30 Days</div>
                            <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-loud)' }}>{formatINR(ledgerData.outstanding.bucket0_30)}</div>
                          </div>
                          <div style={{ flex: 1, background: 'var(--bg-app)', border: '1px solid var(--grid-line-major)', padding: '1rem', borderRadius: '8px' }}>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem', fontWeight: 600 }}>31-60 Days</div>
                            <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--color-warning)' }}>{formatINR(ledgerData.outstanding.bucket31_60)}</div>
                          </div>
                          <div style={{ flex: 1, background: 'var(--bg-app)', border: '1px solid var(--grid-line-major)', padding: '1rem', borderRadius: '8px' }}>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem', fontWeight: 600 }}>61-90 Days</div>
                            <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--color-warning)' }}>{formatINR(ledgerData.outstanding.bucket61_90)}</div>
                          </div>
                          <div style={{ flex: 1, background: 'var(--bg-app)', border: '1px solid var(--grid-line-major)', padding: '1rem', borderRadius: '8px' }}>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem', fontWeight: 600 }}>90+ Days</div>
                            <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--color-danger)' }}>{formatINR(ledgerData.outstanding.bucket90Plus)}</div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Transactions */}
                    <div className="profile-section">
                      <h4>Transaction History</h4>
                      {ledgerLoading ? (
                        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Loading transactions...</div>
                      ) : !ledgerData?.transactions?.length ? (
                        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No transactions found for this customer.</div>
                      ) : (
                        <table className="data-table" style={{ width: '100%', fontSize: '0.9rem' }}>
                          <thead>
                            <tr>
                              <th>Date</th>
                              <th>Type</th>
                              <th>Invoice No.</th>
                              <th>Net Amount</th>
                              <th>Tax Amount</th>
                              <th>Gross Amount</th>
                            </tr>
                          </thead>
                          <tbody>
                            {ledgerData.transactions.map((tx: any) => (
                              <tr key={tx.id}>
                                <td style={{ color: 'var(--text-muted)' }}>{formatDate(tx.date)}</td>
                                <td style={{ textTransform: 'capitalize', color: tx.type === 'sale_return' ? 'var(--color-success)' : 'var(--text-muted)' }}>
                                  {tx.type.replace('_', ' ')}
                                </td>
                                <td style={{ fontFamily: 'monospace', color: 'var(--accent-secondary)' }}>{tx.invoiceId}</td>
                                <td style={{ fontWeight: 600, color: 'var(--text-loud)' }}>{formatINR(tx.netAmount)}</td>
                                <td style={{ color: 'var(--text-muted)' }}>{formatINR(tx.taxAmount)}</td>
                                <td style={{ fontWeight: 700, color: 'var(--text-loud)' }}>{formatINR(tx.grossAmount)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  </div>
                )}

                {activeTab === 'reconciliation' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div className="profile-section" style={{ borderLeft: '3px solid #10b981', paddingLeft: '1rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h4 style={{ margin: 0 }}>Automated Bank Reconciliation</h4>
                      </div>
                      
                      {reconLoading ? (
                        <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>Running reconciliation engine...</div>
                      ) : !reconData || !reconData.items || reconData.items.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                          No bank ledger entries found for this customer.
                        </div>
                      ) : (
                        <>
                          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                            <div style={{ flex: 1, background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '8px' }}>
                              <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.25rem' }}>Total Received</div>
                              <div style={{ fontSize: '1.2rem', fontWeight: 600, color: '#34d399' }}>{formatINR(reconData.totalReceiptAmount)}</div>
                            </div>
                            <div style={{ flex: 1, background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '8px' }}>
                              <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.25rem' }}>Matched Entries</div>
                              <div style={{ fontSize: '1.2rem', fontWeight: 600, color: '#60a5fa' }}>{reconData.matchedCount} / {reconData.totalBankEntries}</div>
                            </div>
                            <div style={{ flex: 1, background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '8px' }}>
                              <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.25rem' }}>Unmatched</div>
                              <div style={{ fontSize: '1.2rem', fontWeight: 600, color: '#f87171' }}>{reconData.unmatchedCount}</div>
                            </div>
                          </div>

                          <table className="data-table" style={{ width: '100%', fontSize: '0.9rem' }}>
                            <thead>
                              <tr>
                                <th>Date</th>
                                <th>Reference</th>
                                <th>Amount</th>
                                <th>Match Status</th>
                                <th>Linked Invoice</th>
                              </tr>
                            </thead>
                            <tbody>
                              {reconData.items.map((item: any) => (
                                <tr key={item.id} style={{ borderLeft: item.matchStatus === 'MATCHED' ? '3px solid #10b981' : item.matchStatus === 'UNMATCHED_BANK' ? '3px solid #f87171' : '3px solid #fbbf24' }}>
                                  <td style={{ color: '#cbd5e1' }}>{formatDate(item.bankRow.date)}</td>
                                  <td style={{ color: '#94a3b8', fontSize: '0.85rem' }}>
                                    {item.bankRow.particulars}
                                  </td>
                                  <td style={{ fontWeight: 600, color: item.bankRow.type === 'RECEIPT' ? '#34d399' : '#f87171' }}>
                                    {item.bankRow.type === 'RECEIPT' ? '+' : '-'}{formatINR(item.bankRow.amount)}
                                  </td>
                                  <td>
                                    <span style={{ 
                                      display: 'inline-block', 
                                      padding: '0.2rem 0.5rem', 
                                      borderRadius: '4px', 
                                      fontSize: '0.75rem',
                                      fontWeight: 600,
                                      backgroundColor: item.matchStatus === 'MATCHED' ? 'rgba(16, 185, 129, 0.1)' : item.matchStatus === 'UNMATCHED_BANK' ? 'rgba(248, 113, 113, 0.1)' : 'rgba(251, 191, 36, 0.1)',
                                      color: item.matchStatus === 'MATCHED' ? '#10b981' : item.matchStatus === 'UNMATCHED_BANK' ? '#f87171' : '#fbbf24'
                                    }}>
                                      {item.matchStatus.replace(/_/g, ' ')}
                                    </span>
                                  </td>
                                  <td>
                                    {item.matchedTransaction ? (
                                      <div>
                                        <span style={{ fontFamily: 'monospace', color: '#60a5fa' }}>{item.matchedTransaction.invoiceId}</span>
                                        <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{formatINR(item.matchedTransaction.grossAmount)}</div>
                                      </div>
                                    ) : (
                                      <span style={{ color: '#64748b', fontStyle: 'italic' }}>None</span>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      <ContextualGuidancePanel />
    </div>
  );
}
