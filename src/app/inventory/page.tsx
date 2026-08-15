"use client";
import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import ThemeToggle from '@/components/ThemeToggle';
import ContextualGuidancePanel from '@/components/ContextualGuidancePanel';
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
  TrendingDown
} from 'lucide-react';
import '../dashboard.css';
import '../business-pages.css';

export default function InventoryPage() {
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

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
    setTargetSupplier(item.manufacturer || 'Direct Pharma Distributor');
  };

  const handleApproveDraftPO = async () => {
    if (!activeReorderItem) return;
    setIsSubmittingPO(true);

    try {
      // Record procurement draft alert in automation engine
      await fetch('/api/v1/automation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'send_reminder',
          payload: {
            partyName: targetSupplier,
            amount: orderQuantity * 100, // estimated
            channel: 'IN_APP_ALERT',
            recipient: 'procurement-desk@agrawaltrading.com',
            message: `Purchase Order Draft created for ${orderQuantity} units of ${activeReorderItem.productName} (${targetSupplier})`,
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
              <h1>Inventory & Warehouse Stock Intelligence</h1>
              <p>Physical batch balances, SKU catalog on hand, reorder thresholds, and guided procurement PO generation</p>
            </div>
            <button className="secondary-btn" onClick={fetchInventoryReport} disabled={loading}>
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
                    <Boxes size={16} />
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
                placeholder="Search product formulation, SKU, brand, manufacturer..." 
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </form>
            <button className="primary-btn" onClick={fetchInventoryReport}>Search</button>
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
              <Package size={42} color="#64748b" />
              <div>
                <h3 style={{ margin: '0 0 0.5rem 0', color: '#f8fafc', fontSize: '1.15rem' }}>Inventory Dataset Not Connected</h3>
                <p style={{ margin: 0, color: '#94a3b8', maxWidth: '540px', fontSize: '0.875rem', lineHeight: 1.5 }}>
                  No physical warehouse inventory or opening stock sheet has been ingested yet. Ingest your opening stock CSV or connect your ERP warehouse stream to view SKU quantities on hand and automated reorder alerts.
                </p>
              </div>
              <a href="/ingestion" className="primary-btn" style={{ textDecoration: 'none', marginTop: '0.5rem' }}>
                <span>Connect Warehouse Stock Data</span>
              </a>
            </div>
          ) : (
            <div className="data-table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Product SKU & Packaging</th>
                    <th>Manufacturer / Brand</th>
                    <th>Physical Stock on Hand</th>
                    <th>Reorder Baseline</th>
                    <th>Status & Risk</th>
                    <th>Procurement Action</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                        Loading warehouse stock catalog...
                      </td>
                    </tr>
                  ) : !report || report.rows.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                        No inventory records matched your search criteria.
                      </td>
                    </tr>
                  ) : (
                    report.rows.slice(0, 50).map((row: any, i: number) => {
                      const isLow = row.quantityOnHand <= (row.reorderLevel || 20);
                      const isDrafted = draftedPoItems.has(row.productId);
                      return (
                        <tr key={i}>
                          <td style={{ fontWeight: 600, color: '#f8fafc' }}>{row.productName}</td>
                          <td style={{ color: '#94a3b8' }}>{row.manufacturer || 'Pharmaceuticals'}</td>
                          <td style={{ fontWeight: 700, color: isLow ? '#f87171' : '#34d399' }}>
                            {Math.round(row.quantityOnHand * 100) / 100} {row.unit || 'Units'}
                          </td>
                          <td>{row.reorderLevel || 20} Units</td>
                          <td>
                            {isLow ? (
                              <span className="badge badge-danger">Low Stock Alert</span>
                            ) : (
                              <span className="badge badge-success">Sufficient</span>
                            )}
                          </td>
                          <td>
                            {isDrafted ? (
                              <button className="secondary-btn" disabled style={{ background: 'rgba(16, 185, 129, 0.15)', borderColor: '#10b981', color: '#34d399', fontSize: '0.75rem', padding: '0.35rem 0.65rem' }}>
                                <CheckCircle2 size={12} color="#10b981" />
                                <span>PO Drafted</span>
                              </button>
                            ) : isLow ? (
                              <button 
                                className="primary-btn" 
                                onClick={() => handleOpenReorderModal(row)}
                                style={{ fontSize: '0.75rem', padding: '0.35rem 0.65rem', background: '#3b82f6' }}
                              >
                                <PlusCircle size={12} />
                                <span>Reorder PO</span>
                              </button>
                            ) : (
                              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Healthy</span>
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

        {/* Guided Procurement PO Draft Modal */}
        {activeReorderItem && (
          <div className="modal-backdrop" onClick={() => setActiveReorderItem(null)}>
            <div className="modal-content" style={{ maxWidth: '600px' }} onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <FileText size={18} color="#60a5fa" />
                    <span>Generate Procurement Purchase Order Draft</span>
                  </h3>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: '#94a3b8' }}>
                    Product: <strong style={{ color: '#f8fafc' }}>{activeReorderItem.productName}</strong>
                  </p>
                </div>
                <button 
                  onClick={() => setActiveReorderItem(null)}
                  style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
                >
                  <X size={20} />
                </button>
              </div>

              <div className="modal-body">
                {/* Stock Math Breakdown */}
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
                    <div style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase' }}>Current Stock</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f87171' }}>
                      {activeReorderItem.quantityOnHand} Units
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase' }}>Reorder Threshold</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fbbf24' }}>
                      {activeReorderItem.reorderLevel || 20} Units
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase' }}>Suggested Order</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#34d399' }}>
                      {activeReorderItem.suggestedReorderQty || 30} Units
                    </div>
                  </div>
                </div>

                <div style={{ fontSize: '0.8rem', color: '#94a3b8', background: 'rgba(59, 130, 246, 0.08)', padding: '0.65rem 0.85rem', borderRadius: '6px', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                  <strong>Procurement Safety Rule:</strong> Calculated using standard 3x safety baseline. A recommendation is not a financial commitment until formally approved.
                </div>

                {/* Form fields */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#94a3b8', marginBottom: '0.3rem' }}>
                    Target Supplier / Manufacturer:
                  </label>
                  <input 
                    type="text" 
                    className="filter-select" 
                    style={{ width: '100%', background: '#090d16' }}
                    value={targetSupplier}
                    onChange={e => setTargetSupplier(e.target.value)}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#94a3b8', marginBottom: '0.3rem' }}>
                    Order Quantity (Units):
                  </label>
                  <input 
                    type="number" 
                    className="filter-select" 
                    style={{ width: '100%', background: '#090d16' }}
                    value={orderQuantity}
                    min={1}
                    onChange={e => setOrderQuantity(parseInt(e.target.value) || 1)}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                  <button className="secondary-btn" onClick={() => setActiveReorderItem(null)}>
                    Cancel
                  </button>
                  <button 
                    className="primary-btn" 
                    onClick={handleApproveDraftPO}
                    disabled={isSubmittingPO}
                    style={{ background: '#3b82f6' }}
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
