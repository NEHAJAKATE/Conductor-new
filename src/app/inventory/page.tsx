"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';
import ThemeToggle from '@/components/ThemeToggle';
import ContextualGuidancePanel from '@/components/ContextualGuidancePanel';
import DataQualityIndicator from '@/components/DataQualityIndicator';
import { 
  Package, 
  Search, 
  AlertTriangle, 
  Boxes, 
  RefreshCw,
  PlusCircle,
  X,
  CheckCircle2,
  FileText,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import '../dashboard.css';
import '../business-pages.css';

export default function InventoryPage() {
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'stock' | 'reorder'>('stock');

  // Expanded Row State
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);

  // Reorder Recommendation Modal State
  const [activeReorderItem, setActiveReorderItem] = useState<any | null>(null);
  const [orderQuantity, setOrderQuantity] = useState<number>(30);
  const [targetSupplier, setTargetSupplier] = useState<string>('');
  const [isSubmittingPO, setIsSubmittingPO] = useState<boolean>(false);
  const [draftedPoItems, setDraftedPoItems] = useState<Set<string>>(new Set());

  const fetchInventoryReport = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/v1/reports?dataset=inventory&search=${encodeURIComponent(search)}`);
      if (res.ok) {
        const data = await res.json();
        setReport(data);
      }
    } catch (err) {
      console.error('Failed to fetch inventory report:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventoryReport();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchInventoryReport();
  };

  const handleOpenReorderModal = (item: any) => {
    setActiveReorderItem(item);
    setOrderQuantity(item.suggestedReorderQty || 30);
    setTargetSupplier(item.manufacturer || '');
  };

  const handleApproveDraftPO = async () => {
    if (!activeReorderItem) return;
    setIsSubmittingPO(true);

    try {
      await fetch('/api/v1/automation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'send_reminder',
          payload: {
            partyName: targetSupplier || 'Unknown Supplier',
            amount: orderQuantity * 100,
            channel: 'IN_APP_ALERT',
            recipient: 'procurement-desk@agrawaltrading.com',
            message: `Purchase Order Draft created for ${orderQuantity} units of ${activeReorderItem.productName}`,
          }
        })
      });

      setDraftedPoItems(prev => new Set(prev).add(activeReorderItem.productId));
      setToastMessage(`✓ Draft Purchase Order generated for ${orderQuantity} units of ${activeReorderItem.productName}`);
      setActiveReorderItem(null);

      setTimeout(() => {
        setToastMessage(null);
      }, 5000);
    } catch (err) {
      console.error('Failed to create draft PO:', err);
    } finally {
      setIsSubmittingPO(false);
    }
  };

  const toggleRowExpansion = (productId: string) => {
    setExpandedRowId(expandedRowId === productId ? null : productId);
  };

  // Reorder tab shows products that need reordering, sorted by status severity
  const reorderItems = report?.rows?.filter((r: any) => r.isLowStock) || [];

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
              <h1>Stock & Reorder</h1>
              <p>Physical inventory, stock movements, and actual sales-based reorder alerts</p>
            </div>
            <button className="secondary-btn" onClick={fetchInventoryReport} disabled={loading}>
              <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
              <span>Refresh</span>
            </button>
          </div>

          <div className="tabs-container" style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--grid-line-major)', display: 'flex', gap: '2rem' }}>
            <button 
              className={`tab-btn ${activeTab === 'stock' ? 'active' : ''}`}
              onClick={() => setActiveTab('stock')}
              style={{ padding: '0.75rem 0', background: 'transparent', border: 'none', color: activeTab === 'stock' ? 'var(--text-loud)' : 'var(--text-muted)', borderBottom: activeTab === 'stock' ? '2px solid var(--accent-primary)' : '2px solid transparent', cursor: 'pointer', fontWeight: 700 }}
            >
              All Stock
            </button>
            <button 
              className={`tab-btn ${activeTab === 'reorder' ? 'active' : ''}`}
              onClick={() => setActiveTab('reorder')}
              style={{ padding: '0.75rem 0', background: 'transparent', border: 'none', color: activeTab === 'reorder' ? 'var(--text-loud)' : 'var(--text-muted)', borderBottom: activeTab === 'reorder' ? '2px solid var(--accent-primary)' : '2px solid transparent', cursor: 'pointer', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              Reorder Alerts
              {reorderItems.length > 0 && (
                <span style={{ background: 'var(--color-danger)', color: '#fff', fontSize: '0.7rem', padding: '0.1rem 0.4rem', borderRadius: '10px', fontWeight: 700 }}>
                  {reorderItems.length}
                </span>
              )}
            </button>
          </div>

          <div className="action-bar">
            <form onSubmit={handleSearchSubmit} className="search-input-group">
              <Search size={16} color="var(--text-muted)" />
              <input 
                type="text" 
                placeholder="Search product name or manufacturer..." 
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </form>
            <button className="primary-btn" onClick={fetchInventoryReport}>Search</button>
          </div>

          {report?.status === 'NOT_CONNECTED' ? (
            <div style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--grid-line-major)',
              borderRadius: '12px',
              padding: '3rem 2rem',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '1rem',
              margin: '1.5rem 0'
            }}>
              <Package size={42} color="var(--text-muted)" />
              <div>
                <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-loud)', fontSize: '1.15rem' }}>Inventory Not Connected</h3>
                <p style={{ margin: 0, color: 'var(--text-muted)', maxWidth: '540px', fontSize: '0.875rem', lineHeight: 1.5 }}>
                  No physical warehouse inventory or opening stock sheet has been ingested yet.
                </p>
              </div>
            </div>
          ) : (
            <div className="data-table-container">
              {activeTab === 'stock' ? (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th style={{ width: '40px' }}></th>
                      <th>Product & Manufacturer</th>
                      <th>Opening</th>
                      <th>Purchases</th>
                      <th>Sales</th>
                      <th>Returns/Adj</th>
                      <th>Closing Stock</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={8} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                          Calculating stock ledger...
                        </td>
                      </tr>
                    ) : !report || report.rows.length === 0 ? (
                      <tr>
                        <td colSpan={8} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                          No products found.
                        </td>
                      </tr>
                    ) : (
                      report.rows.slice(0, 50).map((row: any) => {
                        const isExpanded = expandedRowId === row.productId;
                        const totalReturnsAndAdj = (row.salesReturns || 0) + (row.adjustments || 0) - (row.purchaseReturns || 0) - (row.breakage || 0);
                        
                        return (
                          <React.Fragment key={row.productId}>
                            <tr 
                              onClick={() => toggleRowExpansion(row.productId)}
                              style={{ cursor: 'pointer', background: isExpanded ? 'var(--bg-surface-hover)' : 'transparent' }}
                            >
                              <td style={{ color: 'var(--text-muted)' }}>
                                {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                              </td>
                              <td>
                                <div style={{ fontWeight: 700, color: 'var(--text-loud)', fontSize: '0.925rem' }}>{row.productName}</div>
                                <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)', fontWeight: 500, marginTop: '2px' }}>
                                  <DataQualityIndicator 
                                    value={row.manufacturer} 
                                    missingText="Manufacturer Not Available" 
                                    hasIssue={!row.manufacturer} 
                                  />
                                </div>
                              </td>
                              <td style={{ fontWeight: 600, color: 'var(--text-loud)', fontSize: '0.95rem' }}>
                                <DataQualityIndicator 
                                  value={row.openingStock} 
                                  type="number"
                                  hasIssue={row.openingStock !== null && row.openingStock < 0}
                                  issueExplanation={row.openingStock < 0 ? 'Negative opening stock' : undefined}
                                />
                              </td>
                              <td style={{ fontWeight: 600, color: 'var(--purchases-color)', fontSize: '0.95rem' }}>
                                {row.purchases ? `+${row.purchases.toLocaleString('en-IN')}` : '—'}
                              </td>
                              <td style={{ fontWeight: 600, color: 'var(--sales-color)', fontSize: '0.95rem' }}>
                                {row.sales ? `-${row.sales.toLocaleString('en-IN')}` : '—'}
                              </td>
                              <td style={{ fontWeight: 600, color: totalReturnsAndAdj > 0 ? 'var(--color-success)' : totalReturnsAndAdj < 0 ? 'var(--sales-color)' : 'var(--text-muted)', fontSize: '0.95rem' }}>
                                {totalReturnsAndAdj !== 0 ? (totalReturnsAndAdj > 0 ? `+${totalReturnsAndAdj}` : totalReturnsAndAdj) : '—'}
                              </td>
                              <td style={{ fontWeight: 800, fontSize: '1.1rem', color: row.calculatedClosingStock !== null && row.calculatedClosingStock < 0 ? 'var(--color-danger)' : 'var(--text-loud)' }}>
                                <DataQualityIndicator 
                                  value={row.calculatedClosingStock} 
                                  type="number"
                                  hasIssue={row.calculatedClosingStock !== null && row.calculatedClosingStock < 0}
                                  issueExplanation={row.calculatedClosingStock < 0 ? 'Negative closing stock indicates a data discrepancy' : undefined}
                                />
                              </td>
                              <td>
                                {row.stockStatus === 'Healthy' ? (
                                  <span className="badge badge-success">Healthy</span>
                                ) : row.stockStatus === 'Needs Review' || row.stockStatus === 'Missing Opening Data' ? (
                                  <span className="badge badge-warning">
                                    {row.stockStatus}
                                  </span>
                                ) : row.stockStatus === 'Out of Stock' ? (
                                  <span className="badge badge-danger">Out of Stock</span>
                                ) : (
                                  <span className="badge badge-danger">
                                    {row.stockStatus}
                                  </span>
                                )}
                              </td>
                            </tr>
                            {isExpanded && (
                              <tr style={{ background: 'var(--bg-surface-hover)' }}>
                                <td></td>
                                <td colSpan={7} style={{ padding: '1.5rem', borderTop: 'none' }}>
                                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                                    
                                    {/* Left Col: Explanation & Reorder */}
                                    <div>
                                      <h4 style={{ margin: '0 0 0.75rem 0', color: 'var(--text-loud)', fontSize: '0.9rem', fontWeight: 700 }}>Stock Status Explanation</h4>
                                      <div style={{ background: 'var(--bg-app)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--grid-line-major)', fontSize: '0.85rem', color: 'var(--text-default)', lineHeight: 1.5, marginBottom: '1rem' }}>
                                        {row.reorderRationale || 'Status is normal.'}
                                      </div>

                                      <h4 style={{ margin: '0 0 0.75rem 0', color: 'var(--text-loud)', fontSize: '0.9rem', fontWeight: 700 }}>Reorder Policy</h4>
                                      <div style={{ background: 'var(--bg-app)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--grid-line-major)', display: 'flex', gap: '2rem' }}>
                                        <div>
                                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Avg Monthly Sales</div>
                                          <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-loud)' }}>
                                            <DataQualityIndicator value={row.monthlyBaselineConsumption} type="number" />
                                          </div>
                                        </div>
                                        <div>
                                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Reorder Threshold</div>
                                          <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-warning)' }}>
                                            <DataQualityIndicator value={row.reorderThreshold} type="number" />
                                          </div>
                                        </div>
                                        <div>
                                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Suggested Order</div>
                                          <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-success)' }}>
                                            <DataQualityIndicator value={row.suggestedReorderQty} type="number" />
                                          </div>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Right Col: Calculation Breakdown */}
                                    <div>
                                      <h4 style={{ margin: '0 0 0.75rem 0', color: 'var(--text-loud)', fontSize: '0.9rem', fontWeight: 700 }}>Calculation Breakdown</h4>
                                      <div style={{ background: 'var(--bg-app)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--grid-line-major)', fontSize: '0.85rem' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid var(--grid-line-major)' }}>
                                          <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Opening Stock</span>
                                          <span style={{ fontWeight: 700, color: 'var(--text-loud)' }}><DataQualityIndicator value={row.openingStock} /></span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '0.5rem' }}>
                                          <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Purchases</span>
                                          <span style={{ color: 'var(--purchases-color)', fontWeight: 700 }}>+{row.purchases || 0}</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '0.25rem' }}>
                                          <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Sales Returns (Stock In)</span>
                                          <span style={{ color: 'var(--purchases-color)', fontWeight: 700 }}>+{row.salesReturns || 0}</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '0.25rem' }}>
                                          <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Stock Adjustments (In)</span>
                                          <span style={{ color: 'var(--purchases-color)', fontWeight: 700 }}>+{row.adjustments || 0}</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '0.5rem', borderTop: '1px dashed var(--grid-line-major)', marginTop: '0.5rem' }}>
                                          <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Sales</span>
                                          <span style={{ color: 'var(--sales-color)', fontWeight: 700 }}>-{row.sales || 0}</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '0.25rem' }}>
                                          <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Purchase Returns (Stock Out)</span>
                                          <span style={{ color: 'var(--sales-color)', fontWeight: 700 }}>-{row.purchaseReturns || 0}</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '0.25rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--grid-line-major)' }}>
                                          <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Breakage</span>
                                          <span style={{ color: 'var(--sales-color)', fontWeight: 700 }}>-{row.breakage || 0}</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '0.5rem', fontWeight: 800, fontSize: '1rem', color: row.calculatedClosingStock !== null && row.calculatedClosingStock < 0 ? 'var(--color-danger)' : 'var(--text-loud)' }}>
                                          <span>Closing Stock</span>
                                          <span><DataQualityIndicator value={row.calculatedClosingStock} /></span>
                                        </div>
                                      </div>

                                      <div style={{ marginTop: '1.5rem', borderTop: '1px solid var(--grid-line-major)', paddingTop: '1.5rem' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                          <div>
                                            <h4 style={{ margin: '0 0 0.25rem 0', color: 'var(--text-loud)', fontSize: '0.9rem', fontWeight: 700 }}>Customer & Movement Ledger</h4>
                                            <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.8rem', maxWidth: '300px', lineHeight: 1.4 }}>View all businesses and customers who bought this product, exactly like a wholesaler ERP.</p>
                                          </div>
                                          <Link href={`/item-ledger?search=${encodeURIComponent(row.productName)}`} passHref>
                                            <button className="secondary-btn" style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}>
                                              <FileText size={14} />
                                              <span>View Item Ledger</span>
                                            </button>
                                          </Link>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })
                    )}
                  </tbody>
                </table>
              ) : (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Product & Manufacturer</th>
                      <th>Avg Monthly Sales</th>
                      <th>Closing Stock</th>
                      <th>Threshold</th>
                      <th>Status</th>
                      <th>Procurement Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reorderItems.length === 0 ? (
                      <tr>
                        <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                          No products currently need reordering.
                        </td>
                      </tr>
                    ) : (
                      reorderItems.map((row: any) => {
                        const isDrafted = draftedPoItems.has(row.productId);
                        return (
                          <tr key={row.productId}>
                            <td>
                              <div style={{ fontWeight: 700, color: 'var(--text-loud)', fontSize: '0.925rem' }}>{row.productName}</div>
                              <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)', fontWeight: 500, marginTop: '2px' }}>{row.manufacturer || 'Manufacturer Not Available'}</div>
                            </td>
                            <td style={{ fontWeight: 600, color: 'var(--text-loud)' }}>{row.monthlyBaselineConsumption?.toLocaleString('en-IN') || '—'} / month</td>
                            <td style={{ fontWeight: 800, fontSize: '1rem', color: row.calculatedClosingStock === 0 ? 'var(--color-danger)' : 'var(--color-warning)' }}>
                              {row.calculatedClosingStock ?? '—'}
                            </td>
                            <td style={{ color: 'var(--text-muted)', fontWeight: 600 }}>{row.reorderThreshold ?? '—'}</td>
                            <td>
                              <span className="badge badge-danger">{row.stockStatus}</span>
                            </td>
                            <td>
                              {isDrafted ? (
                                <button className="secondary-btn" disabled style={{ background: 'rgba(16, 185, 129, 0.15)', borderColor: '#10b981', color: '#10b981', fontSize: '0.75rem', padding: '0.35rem 0.65rem' }}>
                                  <CheckCircle2 size={12} color="#10b981" />
                                  <span>PO Drafted</span>
                                </button>
                              ) : (
                                <button 
                                  className="primary-btn" 
                                  onClick={() => handleOpenReorderModal(row)}
                                  style={{ fontSize: '0.75rem', padding: '0.35rem 0.65rem' }}
                                >
                                  <PlusCircle size={12} />
                                  <span>Draft PO</span>
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>

        {/* Guided Procurement PO Draft Modal */}
        {activeReorderItem && (
          <div className="modal-backdrop" onClick={() => setActiveReorderItem(null)}>
            <div className="modal-content" style={{ maxWidth: '600px', background: 'var(--bg-surface)', border: '1px solid var(--grid-line-major)' }} onClick={e => e.stopPropagation()}>
              <div className="modal-header" style={{ borderBottom: '1px solid var(--grid-line-major)', padding: '1.25rem' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.15rem', color: 'var(--text-loud)', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700 }}>
                    <FileText size={18} color="var(--accent-secondary)" />
                    <span>Generate Procurement Purchase Order Draft</span>
                  </h3>
                  <p style={{ margin: '0.25rem 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Product: <strong style={{ color: 'var(--text-loud)' }}>{activeReorderItem.productName}</strong>
                  </p>
                </div>
                <button 
                  onClick={() => setActiveReorderItem(null)}
                  style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                >
                  <X size={20} />
                </button>
              </div>

              <div className="modal-body" style={{ padding: '1.25rem' }}>
                {/* Stock Math Breakdown */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '0.75rem',
                  background: 'var(--bg-app)',
                  padding: '0.875rem',
                  borderRadius: '8px',
                  border: '1px solid var(--grid-line-major)'
                }}>
                  <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Current Stock</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-danger)' }}>
                      {activeReorderItem.calculatedClosingStock ?? '—'} Units
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Reorder Threshold</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-warning)' }}>
                      {activeReorderItem.reorderThreshold ?? '—'} Units
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Suggested Order</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-success)' }}>
                      {activeReorderItem.suggestedReorderQty || 30} Units
                    </div>
                  </div>
                </div>

                <div style={{ fontSize: '0.8rem', color: 'var(--text-default)', background: 'var(--bg-surface-hover)', padding: '0.65rem 0.85rem', borderRadius: '6px', border: '1px solid var(--grid-line-major)', marginTop: '1rem' }}>
                  <strong>Procurement Safety Rule:</strong> Calculated using average monthly sales coverage. A recommendation is not a financial commitment until formally approved.
                </div>

                {/* Form fields */}
                <div style={{ marginTop: '1.5rem' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-loud)', marginBottom: '0.3rem' }}>
                    Target Supplier / Manufacturer:
                  </label>
                  <input 
                    type="text" 
                    className="filter-select" 
                    style={{ width: '100%', background: 'var(--bg-app)', color: 'var(--text-loud)' }}
                    value={targetSupplier}
                    onChange={e => setTargetSupplier(e.target.value)}
                  />
                </div>

                <div style={{ marginTop: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-loud)', marginBottom: '0.3rem' }}>
                    Order Quantity (Units):
                  </label>
                  <input 
                    type="number" 
                    className="filter-select" 
                    style={{ width: '100%', background: 'var(--bg-app)', color: 'var(--text-loud)' }}
                    value={orderQuantity}
                    min={1}
                    onChange={e => setOrderQuantity(parseInt(e.target.value) || 1)}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                  <button className="secondary-btn" onClick={() => setActiveReorderItem(null)}>
                    Cancel
                  </button>
                  <button 
                    className="primary-btn" 
                    onClick={handleApproveDraftPO}
                    disabled={isSubmittingPO}
                  >
                    {isSubmittingPO ? (
                      <>
                        <RefreshCw size={14} className="animate-spin" />
                        <span>Generating PO Draft...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 size={14} />
                        <span>Approve & Create Draft PO</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Global Toast */}
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
