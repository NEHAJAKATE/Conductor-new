"use client";
import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import ThemeToggle from '@/components/ThemeToggle';
import ContextualGuidancePanel from '@/components/ContextualGuidancePanel';
import DateFilter from '@/components/DateFilter';
import DataQualityIndicator from '@/components/DataQualityIndicator';
import { 
  Package, 
  Search, 
  RefreshCw,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  RotateCcw,
  Trash2,
  FilePlus2,
  AlertCircle
} from 'lucide-react';
import '../dashboard.css';
import '../business-pages.css';
import { formatDate, formatINR } from '@/lib/formatters';

export default function ItemLedgerPage() {
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState<string | undefined>();
  const [endDate, setEndDate] = useState<string | undefined>();

  // Pagination
  const [offset, setOffset] = useState(0);
  const limit = 50;

  const fetchLedger = async (currentOffset: number = 0, overrideSearch?: string) => {
    const searchTerm = overrideSearch !== undefined ? overrideSearch : search;
    if (!searchTerm && !report?.summary?.productId) return;
    
    try {
      setLoading(true);
      // Determine query params
      const params = new URLSearchParams();
      if (searchTerm) {
        params.append('search', searchTerm);
      } else if (report?.summary?.productId) {
        params.append('productId', report.summary.productId);
      }
      
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      params.append('limit', limit.toString());
      params.append('offset', currentOffset.toString());

      const res = await fetch(`/api/v1/item-ledger?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setReport(data);
      } else {
        setReport(null);
      }
    } catch (err) {
      console.error('Failed to fetch item ledger:', err);
      setReport(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (search || report?.summary?.productId) {
      fetchLedger(0);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const querySearch = params.get('search');
    if (querySearch) {
      setSearch(querySearch);
      fetchLedger(0, querySearch);
    }
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setOffset(0);
    fetchLedger(0);
  };

  const handleNextPage = () => {
    const nextOffset = offset + limit;
    setOffset(nextOffset);
    fetchLedger(nextOffset);
  };

  const handlePrevPage = () => {
    const prevOffset = Math.max(0, offset - limit);
    setOffset(prevOffset);
    fetchLedger(prevOffset);
  };

  const renderTypeIcon = (type: string) => {
    switch (type) {
      case 'purchase': return <FilePlus2 size={14} color="#60a5fa" />;
      case 'sale': return <ArrowRight size={14} color="#f43f5e" />;
      case 'sale_return': return <RotateCcw size={14} color="#34d399" />;
      case 'purchase_return': return <RotateCcw size={14} color="#f43f5e" />;
      case 'breakage': return <Trash2 size={14} color="#f87171" />;
      case 'stock_adjustment': return <AlertCircle size={14} color="#fbbf24" />;
      default: return null;
    }
  };

  const formatTypeLabel = (type: string) => {
    switch (type) {
      case 'purchase': return 'Purchase';
      case 'sale': return 'Sale';
      case 'sale_return': return 'Sale Return';
      case 'purchase_return': return 'Purchase Return';
      case 'breakage': return 'Breakage';
      case 'stock_adjustment': return 'Adjustment';
      default: return type;
    }
  };

  const getRowColor = (type: string) => {
    switch (type) {
      case 'purchase': 
      case 'sale_return': 
      case 'stock_adjustment':
        return '#34d399'; // Positive flow
      case 'sale': 
      case 'purchase_return': 
      case 'breakage':
        return '#f43f5e'; // Negative flow
      default: return 'var(--text-loud)';
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
              <h1>Item Ledger</h1>
              <p>Trace chronological transaction history and running stock balance for any product.</p>
            </div>
            {report?.summary && (
              <DateFilter 
                onFilterChange={(start, end) => {
                  setStartDate(start);
                  setEndDate(end);
                }} 
              />
            )}
          </div>

          <div className="action-bar" style={{ marginBottom: '1.5rem' }}>
            <form onSubmit={handleSearchSubmit} className="search-input-group" style={{ flex: 1 }}>
              <Search size={16} color="#64748b" />
              <input 
                type="text" 
                placeholder="Search product by name, ID, or manufacturer..." 
                value={search}
                onChange={e => setSearch(e.target.value)}
                autoFocus
              />
            </form>
            <button className="primary-btn" onClick={() => fetchLedger(0)} disabled={loading}>
              {loading ? <RefreshCw size={15} className="animate-spin" /> : <Search size={15} />}
              <span>Search Ledger</span>
            </button>
          </div>

          {!report ? (
            <div style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--grid-line-major)',
              borderRadius: '12px',
              padding: '4rem 2rem',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '1rem',
              boxShadow: 'var(--shadow-card)'
            }}>
              <Package size={48} color="var(--text-muted)" />
              <div>
                <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-loud)', fontSize: '1.15rem' }}>Search for a Product</h3>
                <p style={{ margin: 0, color: 'var(--text-muted)', maxWidth: '400px', fontSize: '0.875rem', lineHeight: 1.5 }}>
                  Enter a product name or manufacturer to view its complete movement history and running balance.
                </p>
              </div>
            </div>
          ) : report.summary === null ? (
            <div style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--grid-line-major)',
              borderRadius: '12px',
              padding: '3rem 2rem',
              textAlign: 'center',
              color: 'var(--text-muted)',
              boxShadow: 'var(--shadow-card)'
            }}>
              No product matched your search. Try adjusting your query.
            </div>
          ) : (
            <>
              {/* Product Summary Card */}
              <div style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--grid-line-major)',
                borderRadius: '8px',
                padding: '1.5rem',
                marginBottom: '1.5rem',
                boxShadow: 'var(--shadow-card)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                  <div>
                    <h2 style={{ margin: '0 0 0.25rem 0', color: 'var(--text-loud)', fontSize: '1.25rem', fontWeight: 700 }}>
                      {report.summary.productName}
                    </h2>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 500 }}>
                      {report.summary.manufacturer || 'Manufacturer Not Available'}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Current Stock</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 800, color: report.summary.closingStock < 0 ? 'var(--color-danger)' : 'var(--color-success)' }}>
                      {report.summary.closingStock.toLocaleString('en-IN')}
                    </div>
                  </div>
                </div>

                {/* Stock Movement Summary */}
                <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Opening:</div>
                    <div style={{ fontWeight: 700, color: 'var(--text-loud)' }}>{report.summary.openingStock}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Purchases:</div>
                    <div style={{ fontWeight: 700, color: 'var(--purchases-color)' }}>+{report.summary.purchases}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Sales:</div>
                    <div style={{ fontWeight: 700, color: 'var(--sales-color)' }}>-{report.summary.sales}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Returns/Adj:</div>
                    <div style={{ fontWeight: 700, color: 'var(--color-success)' }}>
                      {report.summary.salesReturns + report.summary.adjustments - report.summary.purchaseReturns - report.summary.breakage}
                    </div>
                  </div>
                </div>
              </div>

              {/* Transactions Table */}
              <div className="data-table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Type</th>
                      <th>Party / Customer</th>
                      <th>Invoice/Ref</th>
                      <th>Qty (+/-)</th>
                      <th>Value (₹)</th>
                      <th>Running Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.items.length === 0 ? (
                      <tr>
                        <td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                          No transactions found for the selected period.
                        </td>
                      </tr>
                    ) : (
                      report.items.map((row: any) => (
                        <tr key={row.id}>
                          <td style={{ color: 'var(--text-muted)' }}>{formatDate(row.date)}</td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', color: 'var(--text-default)' }}>
                              {renderTypeIcon(row.type)}
                              <span>{formatTypeLabel(row.type)}</span>
                            </div>
                          </td>
                          <td style={{ fontWeight: 700, color: 'var(--text-loud)' }}>
                            {row.partyName || '—'}
                          </td>
                          <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                            {row.invoiceId || '—'}
                          </td>
                          <td style={{ fontWeight: 700, color: getRowColor(row.type) }}>
                            {row.qtyChange > 0 ? `+${row.qtyChange}` : row.qtyChange}
                          </td>
                          <td style={{ color: 'var(--text-loud)', fontWeight: 600 }}>
                            <DataQualityIndicator value={row.amount} type="currency" isZeroMode="show_dash" />
                          </td>
                          <td style={{ fontWeight: 800, color: row.runningBalance < 0 ? 'var(--color-danger)' : 'var(--text-loud)' }}>
                            <DataQualityIndicator value={row.runningBalance} type="number" />
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {report.total > limit && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
                  <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
                    Showing {offset + 1} - {Math.min(offset + limit, report.total)} of {report.total} records
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button 
                      className="secondary-btn" 
                      onClick={handlePrevPage} 
                      disabled={offset === 0}
                    >
                      Previous
                    </button>
                    <button 
                      className="secondary-btn" 
                      onClick={handleNextPage} 
                      disabled={offset + limit >= report.total}
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      <ContextualGuidancePanel />
    </div>
  );
}
