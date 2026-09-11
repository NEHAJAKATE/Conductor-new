"use client";
import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import ThemeToggle from '@/components/ThemeToggle';
import ContextualGuidancePanel from '@/components/ContextualGuidancePanel';
import { 
  FileBarChart, 
  Download, 
  Sliders, 
  Layers, 
  Calendar, 
  RefreshCw, 
  Table, 
  CheckCircle2 
} from 'lucide-react';
import '../dashboard.css';
import '../business-pages.css';

export default function ReportsPage() {
  const [dataset, setDataset] = useState<'sales' | 'purchases' | 'outstanding' | 'inventory' | 'business_activity'>('sales');
  const [groupBy, setGroupBy] = useState('party');
  const [search, setSearch] = useState('');
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchCustomReport = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/v1/reports?dataset=${dataset}&groupBy=${groupBy}&search=${encodeURIComponent(search)}`);
      if (res.ok) {
        const data = await res.json();
        setReport(data);
      }
    } catch (err) {
      console.error('Failed to generate report:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomReport();
  }, [dataset, groupBy]);

  const handleExportCsv = () => {
    if (!report || !report.rows || report.rows.length === 0) return;
    const headers = Object.keys(report.rows[0]);
    const csvContent = [
      headers.join(','),
      ...report.rows.map((r: any) => headers.map(h => JSON.stringify(r[h] ?? '')).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `conductor_${dataset}_report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
              <h1>Generic Report Builder</h1>
              <p>Configurable dimensional analytics, deterministic mathematical aggregations, and multi-format data export</p>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button className="secondary-btn" onClick={handleExportCsv} disabled={!report || report.rows?.length === 0}>
                <Download size={15} />
                <span>Export CSV</span>
              </button>
              <button className="primary-btn" onClick={fetchCustomReport} disabled={loading}>
                <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
                <span>Generate Report</span>
              </button>
            </div>
          </div>

          <div className="action-bar">
            <div className="filter-group">
              <label style={{ fontSize: '0.85rem', color: 'var(--text-loud)', fontWeight: 600 }}>Target Dataset:</label>
              <select 
                className="filter-select"
                value={dataset}
                onChange={e => setDataset(e.target.value as any)}
              >
                <option value="sales">Sales Transactions & Revenue</option>
                <option value="purchases">Procurement & Supplier Spend</option>
                <option value="outstanding">Outstanding & Receivables Ageing</option>
                <option value="inventory">Warehouse Inventory & Stock</option>
                <option value="business_activity">B2B Directory & Business Activity</option>
              </select>
            </div>

            {dataset === 'sales' && (
              <div className="filter-group">
                <label style={{ fontSize: '0.85rem', color: 'var(--text-loud)', fontWeight: 600 }}>Dimension:</label>
                <select 
                  className="filter-select"
                  value={groupBy}
                  onChange={e => setGroupBy(e.target.value)}
                >
                  <option value="party">By Buying Party</option>
                  <option value="product">By Product SKU</option>
                  <option value="company">By Manufacturer</option>
                  <option value="area">By Geographic Area</option>
                  <option value="route">By Delivery Route</option>
                </select>
              </div>
            )}

            <div className="search-input-group" style={{ minWidth: '200px' }}>
              <input 
                type="text" 
                placeholder="Search keywords..." 
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>

          {report && report.kpis && (
            <div className="kpi-grid">
              {report.kpis.map((kpi: any) => (
                <div key={kpi.id} className="kpi-card">
                  <div className="kpi-header">
                    <span>{kpi.label}</span>
                    <FileBarChart size={16} />
                  </div>
                  <div className="kpi-value">{kpi.formattedValue}</div>
                  <div className="kpi-subtext">{kpi.subtext}</div>
                </div>
              ))}
            </div>
          )}

          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  {report && report.rows && report.rows.length > 0 ? (
                    Object.keys(report.rows[0]).map((key, i) => (
                      <th key={i} style={{ textTransform: 'capitalize' }}>
                        {key.replace(/([A-Z])/g, ' $1')}
                      </th>
                    ))
                  ) : (
                    <th>Results</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={10} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                      Processing report aggregation query...
                    </td>
                  </tr>
                ) : !report || !report.rows || report.rows.length === 0 ? (
                  <tr>
                    <td colSpan={10} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                      No data points match the selected criteria.
                    </td>
                  </tr>
                ) : (
                  report.rows.slice(0, 50).map((row: any, rIdx: number) => (
                    <tr key={rIdx}>
                      {Object.values(row).map((val: any, cIdx: number) => (
                        <td key={cIdx}>
                          {typeof val === 'number' 
                            ? val.toLocaleString() 
                            : typeof val === 'object' && val !== null 
                              ? JSON.stringify(val) 
                              : String(val)}
                        </td>
                      ))}
                    </tr>
                  ))
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
