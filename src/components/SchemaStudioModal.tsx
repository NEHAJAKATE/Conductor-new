"use client";
import React, { useState, useEffect } from 'react';
import { 
  Database, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  X, 
  Layers, 
  Tag, 
  HelpCircle,
  AlertCircle
} from 'lucide-react';

export interface SchemaField {
  id: string;
  domain: 'business' | 'transaction' | 'inventory' | 'outstanding' | 'payment';
  label: string;
  dataType: 'text' | 'number' | 'boolean' | 'date' | 'currency' | 'select';
  description?: string;
  options?: string[];
  defaultValue?: any;
  required?: boolean;
  isCustom: boolean;
  createdAt: string;
}

interface SchemaStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SchemaStudioModal({ isOpen, onClose }: SchemaStudioModalProps) {
  const [fields, setFields] = useState<SchemaField[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDomain, setSelectedDomain] = useState<'all' | 'business' | 'transaction' | 'inventory' | 'outstanding' | 'payment'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // New Field Modal Form State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newId, setNewId] = useState('');
  const [newLabel, setNewLabel] = useState('');
  const [newDomain, setNewDomain] = useState<'business' | 'transaction' | 'inventory' | 'outstanding' | 'payment'>('business');
  const [newDataType, setNewDataType] = useState<'text' | 'number' | 'boolean' | 'date' | 'currency'>('text');
  const [newDescription, setNewDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchFields = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/v1/schema');
      if (res.ok) {
        const data = await res.json();
        setFields(data.fields || []);
      }
    } catch (err) {
      console.error('Failed to load schema fields:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchFields();
    }
  }, [isOpen]);

  const handleAddField = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLabel.trim()) return;

    // Generate clean ID from label if not explicitly typed
    const finalId = newId.trim() 
      ? newId.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_')
      : newLabel.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_');

    try {
      setIsSubmitting(true);
      setStatusMessage(null);
      const res = await fetch('/api/v1/schema', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: finalId,
          domain: newDomain,
          label: newLabel.trim(),
          dataType: newDataType,
          description: newDescription.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setStatusMessage({ type: 'success', text: `Parameter '${newLabel}' added successfully!` });
        setNewLabel('');
        setNewId('');
        setNewDescription('');
        setIsAddModalOpen(false);
        fetchFields();
      } else {
        setStatusMessage({ type: 'error', text: data.error || 'Failed to add parameter' });
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Network error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteField = async (id: string, label: string) => {
    if (!confirm(`Are you sure you want to remove custom parameter '${label}'?`)) return;

    try {
      const res = await fetch(`/api/v1/schema?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        fetchFields();
      }
    } catch (err) {
      console.error('Failed to delete field:', err);
    }
  };

  if (!isOpen) return null;

  const filteredFields = fields.filter(f => {
    const matchesDomain = selectedDomain === 'all' || f.domain === selectedDomain;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q || 
      f.label.toLowerCase().includes(q) || 
      f.id.toLowerCase().includes(q) || 
      (f.description && f.description.toLowerCase().includes(q));
    return matchesDomain && matchesSearch;
  });

  const getDomainBadge = (dom: string) => {
    switch (dom) {
      case 'business': return <span className="badge badge-success">Business 360</span>;
      case 'transaction': return <span className="badge badge-info">Transactions</span>;
      case 'inventory': return <span className="badge badge-warning">Inventory</span>;
      case 'outstanding': return <span className="badge" style={{ backgroundColor: 'rgba(239, 68, 68, 0.2)', color: '#f87171' }}>Outstanding</span>;
      default: return <span className="badge badge-neutral">{dom}</span>;
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 1000 }}>
      <div 
        className="modal-content" 
        onClick={e => e.stopPropagation()}
        style={{ maxWidth: '900px', width: '95%', maxHeight: '88vh', display: 'flex', flexDirection: 'column' }}
      >
        {/* Header */}
        <div className="modal-header" style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--grid-line-major)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ padding: '8px', borderRadius: '8px', backgroundColor: 'rgba(96, 165, 250, 0.1)', color: '#60a5fa' }}>
              <Database size={22} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#fff', fontWeight: 600 }}>
                Editable Schema & Data Dictionary
              </h3>
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#94a3b8' }}>
                Define and customize parameters so future Excel/CSV report uploads are seamlessly mapped without dropping data.
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Action Controls Bar */}
        <div style={{ padding: '1rem 1.5rem', background: 'rgba(255, 255, 255, 0.02)', borderBottom: '1px solid var(--grid-line-major)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          {/* Domain Tabs */}
          <div style={{ display: 'flex', gap: '6px', overflowX: 'auto' }}>
            {(['all', 'business', 'transaction', 'inventory', 'outstanding'] as const).map(d => (
              <button
                key={d}
                onClick={() => setSelectedDomain(d)}
                style={{
                  padding: '5px 12px',
                  borderRadius: '6px',
                  fontSize: '0.8rem',
                  fontWeight: selectedDomain === d ? 600 : 400,
                  backgroundColor: selectedDomain === d ? 'var(--accent-primary)' : 'rgba(255,255,255,0.05)',
                  color: selectedDomain === d ? '#000' : 'var(--text-muted)',
                  border: '1px solid var(--grid-line-major)',
                  cursor: 'pointer',
                  textTransform: 'capitalize'
                }}
              >
                {d === 'all' ? 'All Domains' : d === 'business' ? 'Business 360' : d}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <input 
              type="text" 
              placeholder="Search parameters..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{
                background: 'var(--bg-app)',
                border: '1px solid var(--grid-line-major)',
                color: 'var(--text-loud)',
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '0.8rem',
                width: '180px'
              }}
            />
            <button 
              className="btn-primary" 
              onClick={() => setIsAddModalOpen(true)}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', padding: '6px 14px', height: '32px' }}
            >
              <Plus size={15} />
              <span>Add Custom Parameter</span>
            </button>
          </div>
        </div>

        {/* Notifications */}
        {statusMessage && (
          <div style={{ 
            margin: '0.75rem 1.5rem 0',
            padding: '8px 14px', 
            borderRadius: '6px', 
            fontSize: '0.85rem',
            backgroundColor: statusMessage.type === 'success' ? 'rgba(52, 211, 153, 0.1)' : 'rgba(239, 68, 68, 0.1)',
            border: `1px solid ${statusMessage.type === 'success' ? '#10b981' : '#ef4444'}`,
            color: statusMessage.type === 'success' ? '#34d399' : '#f87171',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            {statusMessage.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            <span>{statusMessage.text}</span>
          </div>
        )}

        {/* Table Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1rem 1.5rem' }}>
          <table className="business-table" style={{ width: '100%' }}>
            <thead>
              <tr>
                <th>Parameter Label</th>
                <th>Target Domain</th>
                <th>Data Type</th>
                <th>Field Key</th>
                <th>Origin</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                    Loading schema definitions...
                  </td>
                </tr>
              ) : filteredFields.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                    No parameters found matching your filter.
                  </td>
                </tr>
              ) : (
                filteredFields.map(f => (
                  <tr key={`${f.domain}-${f.id}`}>
                    <td>
                      <div style={{ fontWeight: 600, color: '#f8fafc' }}>{f.label}</div>
                      {f.description && (
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{f.description}</div>
                      )}
                    </td>
                    <td>{getDomainBadge(f.domain)}</td>
                    <td>
                      <span style={{ 
                        fontSize: '0.75rem', 
                        padding: '2px 8px', 
                        borderRadius: '4px', 
                        backgroundColor: 'rgba(255,255,255,0.05)',
                        fontFamily: 'monospace',
                        color: '#38bdf8'
                      }}>
                        {f.dataType.toUpperCase()}
                      </span>
                    </td>
                    <td>
                      <code style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{f.id}</code>
                    </td>
                    <td>
                      {f.isCustom ? (
                        <span className="badge" style={{ backgroundColor: 'rgba(168, 85, 247, 0.2)', color: '#c084fc', border: '1px solid #a855f7' }}>
                          Custom (User)
                        </span>
                      ) : (
                        <span className="badge badge-neutral" style={{ fontSize: '0.75rem' }}>
                          Standard ERP
                        </span>
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {f.isCustom ? (
                        <button
                          onClick={() => handleDeleteField(f.id, f.label)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#f87171',
                            cursor: 'pointer',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '0.75rem'
                          }}
                          title="Delete Custom Parameter"
                        >
                          <Trash2 size={14} />
                          <span>Remove</span>
                        </button>
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: '#475569' }}>Protected</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Add Parameter Sub-Modal */}
        {isAddModalOpen && (
          <div 
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.7)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1100
            }}
            onClick={() => setIsAddModalOpen(false)}
          >
            <div 
              style={{
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--grid-line-major)',
                borderRadius: '12px',
                padding: '1.5rem',
                width: '460px',
                maxWidth: '90%',
                boxShadow: '0 20px 40px rgba(0,0,0,0.5)'
              }}
              onClick={e => e.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h4 style={{ margin: 0, fontSize: '1.1rem', color: '#fff' }}>Add Custom Parameter</h4>
                <button onClick={() => setIsAddModalOpen(false)} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleAddField}>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '4px' }}>
                    Parameter Display Label *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Doctor Specialty, WhatsApp Opt-in"
                    value={newLabel}
                    onChange={e => setNewLabel(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      background: 'var(--bg-app)',
                      border: '1px solid var(--grid-line-major)',
                      color: '#fff',
                      fontSize: '0.85rem'
                    }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '4px' }}>
                      Target Domain
                    </label>
                    <select
                      value={newDomain}
                      onChange={e => setNewDomain(e.target.value as any)}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: '6px',
                        background: 'var(--bg-app)',
                        border: '1px solid var(--grid-line-major)',
                        color: '#fff',
                        fontSize: '0.85rem'
                      }}
                    >
                      <option value="business">Business 360</option>
                      <option value="transaction">Transactions / Journal</option>
                      <option value="inventory">Opening Stock</option>
                      <option value="outstanding">Outstanding / Debtors</option>
                      <option value="payment">Bank & Cash</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '4px' }}>
                      Data Type
                    </label>
                    <select
                      value={newDataType}
                      onChange={e => setNewDataType(e.target.value as any)}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: '6px',
                        background: 'var(--bg-app)',
                        border: '1px solid var(--grid-line-major)',
                        color: '#fff',
                        fontSize: '0.85rem'
                      }}
                    >
                      <option value="text">Text / String</option>
                      <option value="number">Number / Quantity</option>
                      <option value="currency">Currency (₹)</option>
                      <option value="date">Date</option>
                      <option value="boolean">Yes / No</option>
                    </select>
                  </div>
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '4px' }}>
                    Field Key (Optional — auto-generated from label)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. doctor_specialty"
                    value={newId}
                    onChange={e => setNewId(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      background: 'var(--bg-app)',
                      border: '1px solid var(--grid-line-major)',
                      color: '#fff',
                      fontSize: '0.85rem',
                      fontFamily: 'monospace'
                    }}
                  />
                </div>

                <div style={{ marginBottom: '1.25rem' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '4px' }}>
                    Description & Purpose
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Why is this parameter captured and how will it be used?"
                    value={newDescription}
                    onChange={e => setNewDescription(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      background: 'var(--bg-app)',
                      border: '1px solid var(--grid-line-major)',
                      color: '#fff',
                      fontSize: '0.85rem',
                      resize: 'none'
                    }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    style={{
                      padding: '6px 14px',
                      borderRadius: '6px',
                      background: 'transparent',
                      border: '1px solid var(--grid-line-major)',
                      color: '#94a3b8',
                      cursor: 'pointer'
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="btn-primary"
                    style={{ padding: '6px 18px' }}
                  >
                    {isSubmitting ? 'Saving...' : 'Create Parameter'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
