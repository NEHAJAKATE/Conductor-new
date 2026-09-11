"use client";
import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import ThemeToggle from '@/components/ThemeToggle';
import ContextualGuidancePanel from '@/components/ContextualGuidancePanel';
import DateFilter from '@/components/DateFilter';
import { formatDate, formatINR } from '@/lib/formatters';
import { 
  TrendingUp, 
  Search, 
  Download, 
  Calendar, 
  ShoppingBag, 
  Users, 
  Layers,
  RefreshCw 
} from 'lucide-react';
import '../dashboard.css';
import '../business-pages.css';

export default function SalesPage() {
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [groupBy, setGroupBy] = useState<'party' | 'product' | 'company' | 'area' | 'route' | 'day' | 'invoice'>('party');
  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState<string | undefined>();
  const [endDate, setEndDate] = useState<string | undefined>();

  const fetchSalesReport = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('dataset', 'sales');
      params.append('groupBy', groupBy);
      if (search) params.append('search', search);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      
      const res = await fetch(`/api/v1/reports?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setReport(data);
      }
    } catch (err) {
      console.error('Failed to fetch sales report:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSalesReport();
  }, [groupBy, startDate, endDate]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchSalesReport();
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
              <h1>Sales Intelligence & Analysis</h1>
              <p>Real-time transaction volumes, output GST tax audit, brand distributions, and dealer order frequency</p>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <DateFilter onFilterChange={(start, end) => {
                setStartDate(start);
                setEndDate(end);
              }} />
              <button className="secondary-btn" onClick={fetchSalesReport} disabled={loading}>
                <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
                <span>Refresh</span>
              </button>
            </div>
          </div>

          {report && report.kpis && (
            <div className="kpi-grid">
              {report.kpis.map((kpi: any) => (
                <div key={kpi.id} className="kpi-card">
                  <div className="kpi-header">
                    <span>{kpi.label}</span>
                    <TrendingUp size={16} />
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
                placeholder="Search by party name, product SKU, invoice number..." 
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </form>

            <div className="filter-group">
              <label style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Aggregate By:</label>
              <select 
                className="filter-select"
                value={groupBy}
                onChange={e => setGroupBy(e.target.value as any)}
              >
                <option value="party">Buying Party / Dealer</option>
                <option value="product">Product SKU</option>
                <option value="company">Pharma Manufacturer</option>
                <option value="area">Geographic Area</option>
                <option value="route">Delivery Route</option>
                <option value="day">Daily Sales</option>
                <option value="invoice">Detailed Invoices</option>
              </select>
              <button className="primary-btn" onClick={fetchSalesReport}>Update</button>
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
              <TrendingUp size={42} color="#64748b" />
              <div>
                <h3 style={{ margin: '0 0 0.5rem 0', color: '#f8fafc', fontSize: '1.15rem' }}>Sales Dataset Not Connected</h3>
                <p style={{ margin: 0, color: '#94a3b8', maxWidth: '540px', fontSize: '0.875rem', lineHeight: 1.5 }}>
                  No ERP sales transaction journal or invoice vouchers have been ingested yet. Ingest your sales analysis CSV or connect your ERP stream to view real-time revenue, Output GST, and dealer order patterns.
                </p>
              </div>
              <a href="/ingestion" className="primary-btn" style={{ textDecoration: 'none', marginTop: '0.5rem' }}>
                <span>Connect Sales Journal Data</span>
              </a>
            </div>
          ) : (
            <div className="data-table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>
                      {groupBy === 'party' ? 'Buying Party' : 
                       groupBy === 'product' ? 'Product SKU' : 
                       groupBy === 'company' ? 'Manufacturer' : 
                       groupBy === 'day' ? 'Date' :
                       groupBy === 'invoice' ? 'Invoice ID' : 'Location / Route'}
                    </th>
                    <th>{groupBy === 'invoice' ? 'Party / Customer' : 'Category / Info'}</th>
                    <th>Net Invoiced (₹)</th>
                    <th>Output GST (₹)</th>
                    <th>Gross Total (₹)</th>
                    <th>Units Sold</th>
                    {groupBy !== 'invoice' && <th>Invoices</th>}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                        Calculating deterministic sales aggregations...
                      </td>
                    </tr>
                  ) : !report || report.rows.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                        No sales records found matching the criteria.
                      </td>
                    </tr>
                  ) : (
                    report.rows.map((row: any, i: number) => (
                      <tr key={i}>
                        <td style={{ fontWeight: 600, color: '#f8fafc' }}>
                          {groupBy === 'day' ? formatDate(row.dimension) : row.dimension}
                        </td>
                        <td style={{ color: '#94a3b8', fontSize: '0.8rem' }}>
                          {groupBy === 'invoice' ? row.partyName : (row.secondary || 'General')}
                        </td>
                        <td style={{ fontWeight: 600, color: '#60a5fa' }}>{formatINR(row.revenue)}</td>
                        <td style={{ color: '#94a3b8' }}>{formatINR(row.tax)}</td>
                        <td style={{ fontWeight: 600, color: '#34d399' }}>{formatINR(row.gross)}</td>
                        <td>{row.units.toLocaleString()}</td>
                        {groupBy !== 'invoice' && <td><span className="badge badge-neutral">{row.invoices}</span></td>}
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
