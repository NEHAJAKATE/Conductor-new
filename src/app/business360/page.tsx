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
  RefreshCw
} from 'lucide-react';
import '../dashboard.css';
import '../business-pages.css';

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
  };
  totalSales?: number;
  currentOutstanding?: number;
  updatedAt: string;
}

export default function Business360Page() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClassification, setSelectedClassification] = useState('');
  const [activeBusiness, setActiveBusiness] = useState<Business | null>(null);

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
                        <div style={{ fontWeight: 600, color: '#f8fafc' }}>{b.name}</div>
                        {b.legalName && b.legalName !== b.name && (
                          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{b.legalName}</div>
                        )}
                      </td>
                      <td>
                        {b.taxId ? (
                          <span style={{ fontFamily: 'monospace', color: '#60a5fa' }}>{b.taxId}</span>
                        ) : b.pan ? (
                          <span style={{ fontFamily: 'monospace', color: '#94a3b8' }}>PAN: {b.pan}</span>
                        ) : (
                          <span style={{ color: '#475569', fontSize: '0.8rem' }}>Unregistered</span>
                        )}
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                          <MapPin size={13} color="#94a3b8" />
                          <span>{b.address.city || 'Prayagraj'}{b.address.area ? `, ${b.address.area}` : ''}</span>
                        </div>
                      </td>
                      <td>{getClassificationBadge(b.classification)}</td>
                      <td>
                        {b.credit.creditLimit > 0 ? (
                          <div>
                            <div>₹{b.credit.creditLimit.toLocaleString()}</div>
                            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{b.credit.creditDays} Days</div>
                          </div>
                        ) : (
                          <span style={{ color: '#64748b' }}>Not Set</span>
                        )}
                      </td>
                      <td>
                        {b.currentOutstanding !== undefined && b.currentOutstanding !== 0 ? (
                          <span style={{ 
                            fontWeight: 600, 
                            color: b.currentOutstanding > (b.credit.creditLimit || 0) && b.credit.creditLimit > 0 ? '#f87171' : '#34d399' 
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
              
              <div className="modal-body">
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

                <div className="profile-section">
                  <h4>Credit Policy & Financial Standing</h4>
                  <div className="detail-grid">
                    <div className="detail-item">
                      <span className="detail-label">Credit Limit</span>
                      <span className="detail-value">₹{activeBusiness.credit.creditLimit.toLocaleString()}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Credit Period</span>
                      <span className="detail-value">{activeBusiness.credit.creditDays} Days</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Limit Action</span>
                      <span className="detail-value">{activeBusiness.credit.limitType || 'Standard'}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Current Outstanding</span>
                      <span className="detail-value" style={{ color: '#34d399', fontWeight: 700 }}>
                        ₹{Math.round(activeBusiness.currentOutstanding || 0).toLocaleString()}
                      </span>
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
              </div>
            </div>
          </div>
        )}
      </main>

      <ContextualGuidancePanel />
    </div>
  );
}
