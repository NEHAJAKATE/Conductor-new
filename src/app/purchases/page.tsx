"use client";
import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import ThemeToggle from '@/components/ThemeToggle';
import ContextualGuidancePanel from '@/components/ContextualGuidancePanel';
import { 
  ShoppingBag, 
  Search, 
  Download, 
  Building2, 
  Boxes, 
  RefreshCw 
} from 'lucide-react';
import '../dashboard.css';
import '../business-pages.css';

export default function PurchasesPage() {
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchPurchasesReport = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/v1/reports?dataset=purchases&search=${encodeURIComponent(search)}`);
      if (res.ok) {
        const data = await res.json();
        setReport(data);
      }
    } catch (err) {
      console.error('Failed to fetch purchases report:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPurchasesReport();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchPurchasesReport();
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
              <h1>Purchase Intelligence & Supplier Spend</h1>
              <p>Procurement volumes, Input Tax Credit (ITC) reconciliation, supplier trends, and incoming batch tracking</p>
            </div>
            <button className="secondary-btn" onClick={fetchPurchasesReport} disabled={loading}>
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
                    <ShoppingBag size={16} />
                  </div>
                  <div className="kpi-value">{kpi.formattedValue}</div>
                  <div className="kpi-subtext">{kpi.subtext}</div>
                </div>
              ))}
            </div>
          )}

          <div className="action-bar">
            <form onSubmit={handleSearchSubmit} className="search-input-group">
              <Search size={16} color="#64748b" />
              <input 
                type="text" 
                placeholder="Search by supplier name, invoice voucher, product..." 
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </form>
            <button className="primary-btn" onClick={fetchPurchasesReport}>Search</button>
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
              <ShoppingBag size={42} color="#64748b" />
              <div>
                <h3 style={{ margin: '0 0 0.5rem 0', color: '#f8fafc', fontSize: '1.15rem' }}>Purchase Dataset Not Connected</h3>
                <p style={{ margin: 0, color: '#94a3b8', maxWidth: '540px', fontSize: '0.875rem', lineHeight: 1.5 }}>
                  No ERP purchase journal or supplier invoices have been ingested yet. Ingest your purchase analysis CSV or connect your ERP source to view procurement spend and Input Tax Credit (ITC).
                </p>
              </div>
              <a href="/ingestion" className="primary-btn" style={{ textDecoration: 'none', marginTop: '0.5rem' }}>
                <span>Connect Purchase Data</span>
              </a>
            </div>
          ) : (
            <div className="data-table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Supplier / Creditor</th>
                    <th>Net Procurement Spend (₹)</th>
                    <th>Input GST ITC (₹)</th>
                    <th>Gross Bill Amount (₹)</th>
                    <th>Units Procured</th>
                    <th>Purchase Invoices</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                        Loading purchase intelligence...
                      </td>
                    </tr>
                  ) : !report || report.rows.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                        No purchase records found matching filter.
                      </td>
                    </tr>
                  ) : (
                    report.rows.map((row: any, i: number) => (
                      <tr key={i}>
                        <td style={{ fontWeight: 600, color: '#f8fafc' }}>{row.dimension}</td>
                        <td style={{ fontWeight: 600, color: '#fbbf24' }}>₹{row.spend.toLocaleString()}</td>
                        <td style={{ color: '#94a3b8' }}>₹{row.tax.toLocaleString()}</td>
                        <td style={{ fontWeight: 600, color: '#f8fafc' }}>₹{row.gross.toLocaleString()}</td>
                        <td>{row.units.toLocaleString()}</td>
                        <td><span className="badge badge-neutral">{row.invoices}</span></td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      <ContextualGuidancePanel />
    </div>
  );
}
