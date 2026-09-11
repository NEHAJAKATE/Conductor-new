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
  AlertCircle,
  Search,
  Pencil,
  RotateCcw,
  Sparkles,
  Info
} from 'lucide-react';
import './schema-studio-modal.css';

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
  isOverride?: boolean;
  originalLabel?: string;
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

  // Edit Field Modal Form State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingField, setEditingField] = useState<SchemaField | null>(null);
  const [editId, setEditId] = useState('');
  const [editLabel, setEditLabel] = useState('');
  const [editDomain, setEditDomain] = useState<'business' | 'transaction' | 'inventory' | 'outstanding' | 'payment'>('business');
  const [editDataType, setEditDataType] = useState<'text' | 'number' | 'boolean' | 'date' | 'currency'>('text');
  const [editDescription, setEditDescription] = useState('');

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

  const handleOpenEdit = (field: SchemaField) => {
    setEditingField(field);
    setEditId(field.id);
    setEditLabel(field.label);
    setEditDomain(field.domain);
    setEditDataType((field.dataType as any) || 'text');
    setEditDescription(field.description || '');
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingField || !editLabel.trim()) return;

    try {
      setIsSubmitting(true);
      setStatusMessage(null);

      const finalId = editingField.isCustom && editId.trim()
        ? editId.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_')
        : editingField.id;

      const res = await fetch('/api/v1/schema', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          oldId: editingField.id,
          id: finalId,
          domain: editDomain,
          label: editLabel.trim(),
          dataType: editDataType,
          description: editDescription.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setStatusMessage({ 
          type: 'success', 
          text: data.message || `Parameter '${editLabel}' updated successfully!` 
        });
        setIsEditModalOpen(false);
        setEditingField(null);
        fetchFields();
      } else {
        setStatusMessage({ type: 'error', text: data.error || 'Failed to update parameter' });
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Network error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetToDefault = async (field: SchemaField) => {
    if (!confirm(`Reset parameter name back to default ERP name '${field.originalLabel || field.id}'?`)) return;

    try {
      setIsSubmitting(true);
      setStatusMessage(null);
      const res = await fetch('/api/v1/schema', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          oldId: field.id,
          resetToDefault: true,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setStatusMessage({ type: 'success', text: `Parameter '${field.id}' reset to standard default label.` });
        if (isEditModalOpen) {
          setIsEditModalOpen(false);
          setEditingField(null);
        }
        fetchFields();
      } else {
        setStatusMessage({ type: 'error', text: data.error || 'Failed to reset parameter' });
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
        setStatusMessage({ type: 'success', text: `Parameter '${label}' removed successfully.` });
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
      (f.originalLabel && f.originalLabel.toLowerCase().includes(q)) ||
      (f.description && f.description.toLowerCase().includes(q));
    return matchesDomain && matchesSearch;
  });

  const getDomainBadge = (dom: string) => {
    switch (dom) {
      case 'business': return <span className="schema-badge business">Business 360</span>;
      case 'transaction': return <span className="schema-badge transaction">Transactions</span>;
      case 'inventory': return <span className="schema-badge inventory">Inventory</span>;
      case 'outstanding': return <span className="schema-badge outstanding">Outstanding</span>;
      case 'payment': return <span className="schema-badge payment">Bank & Cash</span>;
      default: return <span className="schema-badge standard">{dom}</span>;
    }
  };

  return (
    <div className="schema-studio-backdrop" onClick={onClose}>
      <div 
        className="schema-studio-container" 
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="schema-studio-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div className="schema-studio-icon">
              <Database size={22} />
            </div>
            <div>
              <h3 className="schema-studio-title">
                Editable Schema & Data Dictionary
              </h3>
              <p className="schema-studio-subtitle">
                Customize parameter names as per your company terminology. Renaming updates all views and datasets in real time.
              </p>
            </div>
          </div>
          <button 
            className="schema-close-btn"
            onClick={onClose}
            aria-label="Close Schema Studio"
          >
            <X size={20} />
          </button>
        </div>

        {/* Action Controls Bar */}
        <div className="schema-toolbar">
          {/* Domain Tabs */}
          <div className="schema-tab-group">
            {(['all', 'business', 'transaction', 'inventory', 'outstanding'] as const).map(d => (
              <button
                key={d}
                onClick={() => setSelectedDomain(d)}
                className={`schema-tab-btn ${selectedDomain === d ? 'active' : ''}`}
              >
                {d === 'all' ? 'All Domains' : d === 'business' ? 'Business 360' : d.charAt(0).toUpperCase() + d.slice(1)}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <input 
              type="text" 
              placeholder="Search parameters or keys..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="schema-search-input"
            />
            <button 
              className="schema-btn-submit" 
              onClick={() => setIsAddModalOpen(true)}
            >
              <Plus size={15} />
              <span>Add Custom Parameter</span>
            </button>
          </div>
        </div>

        {/* Notifications */}
        {statusMessage && (
          <div style={{ 
            margin: '0.75rem 1.75rem 0',
            padding: '10px 14px', 
            borderRadius: '8px', 
            fontSize: '0.85rem',
            backgroundColor: statusMessage.type === 'success' ? 'rgba(52, 211, 153, 0.12)' : 'rgba(239, 68, 68, 0.12)',
            border: `1px solid ${statusMessage.type === 'success' ? 'rgba(52, 211, 153, 0.4)' : 'rgba(239, 68, 68, 0.4)'}`,
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
        <div className="schema-table-wrapper">
          <table className="schema-data-table">
            <thead>
              <tr>
                <th style={{ width: '30%' }}>Parameter Name (Click ✏️ to Rename)</th>
                <th style={{ width: '15%' }}>Domain</th>
                <th style={{ width: '13%' }}>Data Type</th>
                <th style={{ width: '18%' }}>Field Key</th>
                <th style={{ width: '12%' }}>Origin</th>
                <th style={{ width: '12%', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
                    Loading schema definitions...
                  </td>
                </tr>
              ) : filteredFields.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
                    No parameters found matching your filter.
                  </td>
                </tr>
              ) : (
                filteredFields.map(f => (
                  <tr key={`${f.domain}-${f.id}`} className={f.isOverride ? 'schema-row-customized' : ''}>
                    <td>
                      <div className="schema-param-title-row">
                        <span className="schema-param-title">{f.label}</span>
                        <button 
                          className="schema-inline-edit-btn" 
                          onClick={() => handleOpenEdit(f)}
                          title={`Rename '${f.label}' as per company requirement`}
                          aria-label={`Edit ${f.label}`}
                        >
                          <Pencil size={13} />
                        </button>
                        {f.isOverride && (
                          <span className="schema-badge renamed" title={`Standard ERP Name: ${f.originalLabel}`}>
                            Custom Term
                          </span>
                        )}
                      </div>
                      {f.description && (
                        <div className="schema-param-desc">{f.description}</div>
                      )}
                      {f.isOverride && f.originalLabel && (
                        <div className="schema-param-original">
                          Standard ERP Default: <span>{f.originalLabel}</span>
                        </div>
                      )}
                    </td>
                    <td>{getDomainBadge(f.domain)}</td>
                    <td>
                      <span className="schema-type-pill">
                        {f.dataType.toUpperCase()}
                      </span>
                    </td>
                    <td>
                      <code className="schema-code-key">{f.id}</code>
                    </td>
                    <td>
                      {f.isCustom ? (
                        <span className="schema-badge custom">
                          Custom
                        </span>
                      ) : f.isOverride ? (
                        <span className="schema-badge standard-modified">
                          Standard (Renamed)
                        </span>
                      ) : (
                        <span className="schema-badge standard">
                          Standard ERP
                        </span>
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', justifyContent: 'flex-end' }}>
                        <button
                          onClick={() => handleOpenEdit(f)}
                          className="schema-action-btn edit"
                          title="Edit parameter name or settings"
                        >
                          <Pencil size={12} />
                          <span>Edit</span>
                        </button>
                        {f.isCustom ? (
                          <button
                            onClick={() => handleDeleteField(f.id, f.label)}
                            className="schema-action-btn delete"
                            title="Delete Custom Parameter"
                          >
                            <Trash2 size={12} />
                            <span>Remove</span>
                          </button>
                        ) : f.isOverride ? (
                          <button
                            onClick={() => handleResetToDefault(f)}
                            className="schema-action-btn reset"
                            title="Reset to default ERP terminology"
                          >
                            <RotateCcw size={12} />
                            <span>Reset</span>
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Edit / Rename Parameter Sub-Modal */}
        {isEditModalOpen && editingField && (
          <div 
            className="schema-add-backdrop"
            onClick={() => setIsEditModalOpen(false)}
          >
            <div 
              className="schema-add-dialog"
              onClick={e => e.stopPropagation()}
            >
              <div className="schema-add-header">
                <div>
                  <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Pencil size={16} color="#60a5fa" />
                    <span>Edit & Rename Schema Parameter</span>
                  </h4>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '3px' }}>
                    Domain: <strong style={{ color: 'var(--text-loud)', textTransform: 'capitalize' }}>{editingField.domain}</strong>
                    {editingField.isCustom ? ' (Custom Field)' : ' (Standard ERP Field)'}
                  </div>
                </div>
                <button 
                  onClick={() => setIsEditModalOpen(false)} 
                  className="schema-close-btn"
                  aria-label="Close edit form"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSaveEdit}>
                <div className="schema-form-group">
                  <label className="schema-form-label">
                    Parameter Display Name / Label *
                    <span style={{ fontSize: '0.75rem', fontWeight: 'normal', color: '#94a3b8', marginLeft: '6px' }}>
                      (How your company terms it)
                    </span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Customer Name, Doctor Specialty, WhatsApp Opt-in"
                    value={editLabel}
                    onChange={e => setEditLabel(e.target.value)}
                    className="schema-form-input"
                    autoFocus
                  />
                  {editingField.originalLabel && editingField.originalLabel !== editLabel && (
                    <div style={{ fontSize: '0.725rem', color: '#64748b', marginTop: '4px' }}>
                      Standard ERP default was: <em>{editingField.originalLabel}</em>
                    </div>
                  )}
                </div>

                {editingField.isCustom ? (
                  <>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }} className="schema-form-group">
                      <div>
                        <label className="schema-form-label">
                          Field Key (ID) *
                        </label>
                        <input
                          type="text"
                          required
                          value={editId}
                          onChange={e => setEditId(e.target.value)}
                          className="schema-form-input"
                          style={{ fontFamily: 'monospace' }}
                        />
                      </div>

                      <div>
                        <label className="schema-form-label">
                          Data Type
                        </label>
                        <select
                          value={editDataType}
                          onChange={e => setEditDataType(e.target.value as any)}
                          className="schema-form-select"
                        >
                          <option value="text">Text / String</option>
                          <option value="number">Number / Quantity</option>
                          <option value="currency">Currency (₹)</option>
                          <option value="date">Date</option>
                          <option value="boolean">Yes / No (Boolean)</option>
                        </select>
                      </div>
                    </div>

                    {editId.trim() !== editingField.id && (
                      <div style={{ 
                        margin: '0 0 1rem 0', 
                        padding: '8px 12px', 
                        borderRadius: '6px', 
                        backgroundColor: 'rgba(59, 130, 246, 0.1)', 
                        border: '1px solid rgba(59, 130, 246, 0.3)',
                        fontSize: '0.75rem',
                        color: '#93c5fd',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '6px'
                      }}>
                        <Info size={14} style={{ flexShrink: 0, marginTop: '2px' }} />
                        <span>
                          <strong>Real-time Data Cascade:</strong> Renaming field key from <code>{editingField.id}</code> to <code>{editId.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_')}</code> will automatically update all existing data records in real time.
                        </span>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="schema-form-group">
                    <label className="schema-form-label">
                      System Field Key
                    </label>
                    <div style={{ 
                      padding: '8px 12px', 
                      background: '#090e17', 
                      border: '1px solid #1e293b', 
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}>
                      <code style={{ fontFamily: 'monospace', color: '#94a3b8', fontSize: '0.85rem' }}>{editingField.id}</code>
                      <span style={{ fontSize: '0.7rem', color: '#64748b' }}>Core ERP Anchor (Protected)</span>
                    </div>
                  </div>
                )}

                <div className="schema-form-group" style={{ marginBottom: '1.5rem' }}>
                  <label className="schema-form-label">
                    Description & Company Usage Notes
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Describe how this parameter is used in your business workflows..."
                    value={editDescription}
                    onChange={e => setEditDescription(e.target.value)}
                    className="schema-form-textarea"
                    style={{ resize: 'vertical' }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    {editingField.isOverride && (
                      <button
                        type="button"
                        onClick={() => handleResetToDefault(editingField)}
                        className="schema-btn-cancel"
                        style={{ color: '#f59e0b', borderColor: 'rgba(245, 158, 11, 0.4)' }}
                      >
                        Restore ERP Default
                      </button>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                      type="button"
                      onClick={() => setIsEditModalOpen(false)}
                      className="schema-btn-cancel"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="schema-btn-submit"
                    >
                      {isSubmitting ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Add Parameter Sub-Modal */}
        {isAddModalOpen && (
          <div 
            className="schema-add-backdrop"
            onClick={() => setIsAddModalOpen(false)}
          >
            <div 
              className="schema-add-dialog"
              onClick={e => e.stopPropagation()}
            >
              <div className="schema-add-header">
                <h4>Add Custom Parameter</h4>
                <button 
                  onClick={() => setIsAddModalOpen(false)} 
                  className="schema-close-btn"
                  aria-label="Close form"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleAddField}>
                <div className="schema-form-group">
                  <label className="schema-form-label">
                    Parameter Display Label *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Doctor Specialty, WhatsApp Opt-in"
                    value={newLabel}
                    onChange={e => setNewLabel(e.target.value)}
                    className="schema-form-input"
                    autoFocus
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }} className="schema-form-group">
                  <div>
                    <label className="schema-form-label">
                      Target Domain
                    </label>
                    <select
                      value={newDomain}
                      onChange={e => setNewDomain(e.target.value as any)}
                      className="schema-form-select"
                    >
                      <option value="business">Business 360 (Parties)</option>
                      <option value="transaction">Transactions (Sales/Purchases)</option>
                      <option value="inventory">Inventory (Stock & SKUs)</option>
                      <option value="outstanding">Outstanding (Debt/Ageing)</option>
                      <option value="payment">Bank & Cash Vouchers</option>
                    </select>
                  </div>

                  <div>
                    <label className="schema-form-label">
                      Data Type
                    </label>
                    <select
                      value={newDataType}
                      onChange={e => setNewDataType(e.target.value as any)}
                      className="schema-form-select"
                    >
                      <option value="text">Text / String</option>
                      <option value="number">Number / Quantity</option>
                      <option value="currency">Currency (₹)</option>
                      <option value="date">Date</option>
                      <option value="boolean">Yes / No (Boolean)</option>
                    </select>
                  </div>
                </div>

                <div className="schema-form-group">
                  <label className="schema-form-label">
                    Field Key (Optional — auto-generated from label)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. doctor_specialty"
                    value={newId}
                    onChange={e => setNewId(e.target.value)}
                    className="schema-form-input"
                    style={{ fontFamily: 'monospace' }}
                  />
                </div>

                <div className="schema-form-group" style={{ marginBottom: '1.5rem' }}>
                  <label className="schema-form-label">
                    Description & Purpose
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Why is this parameter captured and how will it be used?"
                    value={newDescription}
                    onChange={e => setNewDescription(e.target.value)}
                    className="schema-form-textarea"
                    style={{ resize: 'vertical' }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="schema-btn-cancel"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="schema-btn-submit"
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
