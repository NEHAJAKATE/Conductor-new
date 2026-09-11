"use client";
import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import ThemeToggle from '@/components/ThemeToggle';
import ContextualGuidancePanel from '@/components/ContextualGuidancePanel';
import { 
  Zap, 
  ToggleLeft, 
  ToggleRight, 
  Mail, 
  MessageSquare, 
  Bell, 
  Play, 
  CheckCircle2, 
  RefreshCw,
  Clock,
  Plus,
  Pencil,
  Trash2,
  X
} from 'lucide-react';
import '../dashboard.css';
import '../business-pages.css';

interface AutomationRule {
  id: string;
  name: string;
  description: string;
  triggerType: string;
  condition: {
    field: string;
    operator: string;
    value: any;
  };
  action: {
    channel: string;
    recipient: string;
    template: string;
  };
  enabled: boolean;
  lastTriggeredAt?: string;
  executionCount: number;
}

interface ExecutionLog {
  id: string;
  ruleName: string;
  triggeredAt: string;
  actionTaken: string;
  status: string;
}

type RuleForm = Omit<AutomationRule, 'id' | 'executionCount' | 'lastTriggeredAt'>;

const emptyRule: RuleForm = {
  name: '',
  description: '',
  triggerType: 'OUTSTANDING_EXCEEDED',
  condition: { field: 'bucket90Plus', operator: 'greater_than', value: 50000 },
  action: { channel: 'EMAIL', recipient: '', template: '' },
  enabled: true,
};

export default function WorkflowsPage() {
  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [logs, setLogs] = useState<ExecutionLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
  const [ruleForm, setRuleForm] = useState<RuleForm>(emptyRule);
  const [isSaving, setIsSaving] = useState(false);

  const fetchRules = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/v1/automation');
      if (res.ok) {
        const data = await res.json();
        setRules(data.rules || []);
        setLogs(data.logs || []);
      }
    } catch (err) {
      console.error('Failed to load rules:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRules();
  }, []);

  const handleToggle = async (ruleId: string) => {
    try {
      const res = await fetch('/api/v1/automation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'toggle', ruleId })
      });
      if (res.ok) {
        setRules(prev => prev.map(r => r.id === ruleId ? { ...r, enabled: !r.enabled } : r));
      }
    } catch (err) {
      console.error('Failed to toggle rule:', err);
    }
  };

  const openCreateRule = () => {
    setEditingRuleId(null);
    setRuleForm({ ...emptyRule, condition: { ...emptyRule.condition }, action: { ...emptyRule.action } });
    setIsEditorOpen(true);
  };

  const openEditRule = (rule: AutomationRule) => {
    setEditingRuleId(rule.id);
    setRuleForm({ name: rule.name, description: rule.description, triggerType: rule.triggerType, condition: { ...rule.condition }, action: { ...rule.action }, enabled: rule.enabled });
    setIsEditorOpen(true);
  };

  const saveRule = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSaving(true);
    try {
      const response = await fetch('/api/v1/automation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: editingRuleId ? 'update' : 'create', ruleId: editingRuleId, rule: ruleForm }),
      });
      if (!response.ok) throw new Error((await response.json()).message || 'Unable to save rule');
      setIsEditorOpen(false);
      await fetchRules();
    } catch (error) {
      window.alert((error as Error).message);
    } finally {
      setIsSaving(false);
    }
  };

  const deleteRule = async (ruleId: string) => {
    if (!window.confirm('Delete this automation rule?')) return;
    const response = await fetch('/api/v1/automation', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'delete', ruleId }) });
    if (response.ok) await fetchRules();
  };

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'EMAIL':
        return <Mail size={15} color="#60a5fa" />;
      case 'WHATSAPP':
        return <MessageSquare size={15} color="#34d399" />;
      default:
        return <Bell size={15} color="#fbbf24" />;
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
              <h1>Workflow & Event Automation</h1>
              <p>Deterministic business logic triggers: overdue aging alerts, inventory reorder recommendations, and notification routing</p>
            </div>
            <button className="secondary-btn" onClick={fetchRules} disabled={loading}>
              <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
              <span>Refresh</span>
            </button>
            <button className="primary-btn" onClick={openCreateRule}><Plus size={15} /><span>Add Rule</span></button>
          </div>

          <div className="kpi-grid">
            <div className="kpi-card">
              <div className="kpi-header">
                <span>Active Automation Rules</span>
                <Zap size={16} />
              </div>
              <div className="kpi-value">{rules.filter(r => r.enabled).length} of {rules.length}</div>
              <div className="kpi-subtext">Trigger-Condition-Action workflows</div>
            </div>
            <div className="kpi-card">
              <div className="kpi-header">
                <span>Executed Actions</span>
                <CheckCircle2 size={16} />
              </div>
              <div className="kpi-value">
                {rules.reduce((sum, r) => sum + (r.executionCount || 0), 0)}
              </div>
              <div className="kpi-subtext">Dispatched notifications & alerts</div>
            </div>
          </div>

          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Automation Rule</th>
                  <th>Trigger & Condition</th>
                  <th>Action Channel & Target</th>
                  <th>Executions</th>
                  <th>Status</th>
                  <th>Manage</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                      Loading automation policies...
                    </td>
                  </tr>
                ) : rules.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                      No rules found.
                    </td>
                  </tr>
                ) : (
                  rules.map(rule => (
                    <tr key={rule.id}>
                      <td>
                        <div style={{ fontWeight: 700, color: 'var(--text-loud)', fontSize: '0.925rem' }}>{rule.name}</div>
                        <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)', fontWeight: 500, marginTop: '2px' }}>{rule.description}</div>
                      </td>
                      <td>
                        <div style={{ fontFamily: 'monospace', color: 'var(--accent-secondary)', fontSize: '0.825rem', fontWeight: 600 }}>
                          {rule.condition.field} {rule.condition.operator === 'greater_than' ? '>' : rule.condition.operator === 'less_than' ? '<' : '='} {String(rule.condition.value)}
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          {getChannelIcon(rule.action.channel)}
                          <span style={{ fontSize: '0.85rem', color: 'var(--text-loud)', fontWeight: 500 }}>{rule.action.recipient}</span>
                        </div>
                      </td>
                      <td>
                        <span style={{ fontWeight: 700, color: 'var(--text-loud)', fontSize: '0.9rem' }}>{rule.executionCount}</span>
                      </td>
                      <td>
                        {rule.enabled ? (
                          <span className="badge badge-success">Active</span>
                        ) : (
                          <span className="badge badge-neutral">Disabled</span>
                        )}
                      </td>
                      <td>
                        <div className="rule-actions">
                        <button
                          onClick={() => handleToggle(rule.id)}
                          style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: rule.enabled ? 'var(--accent-secondary)' : 'var(--text-muted)' }}
                          title="Toggle Rule State"
                        >
                          {rule.enabled ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
                        </button>
                        <button className="icon-action-btn" onClick={() => openEditRule(rule)} title="Edit rule"><Pencil size={16} /></button>
                        <button className="icon-action-btn danger" onClick={() => deleteRule(rule.id)} title="Delete rule"><Trash2 size={16} /></button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {isEditorOpen && (
            <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="rule-editor-title">
              <form className="modal-content rule-editor" onSubmit={saveRule}>
                <div className="modal-header"><div><h2 id="rule-editor-title">{editingRuleId ? 'Edit Automation Rule' : 'Add Automation Rule'}</h2><p>Define the trigger, condition, and action the owner wants Conductor to manage.</p></div><button type="button" className="icon-action-btn" onClick={() => setIsEditorOpen(false)} title="Close"><X size={18} /></button></div>
                <div className="rule-form-grid">
                  <label>Rule name<input required value={ruleForm.name} onChange={e => setRuleForm({ ...ruleForm, name: e.target.value })} placeholder="e.g. Critical customer overdue alert" /></label>
                  <label>Description<textarea required value={ruleForm.description} onChange={e => setRuleForm({ ...ruleForm, description: e.target.value })} placeholder="What business situation does this rule handle?" /></label>
                  <label>Trigger<select value={ruleForm.triggerType} onChange={e => setRuleForm({ ...ruleForm, triggerType: e.target.value })}><option value="OUTSTANDING_EXCEEDED">Outstanding exceeded</option><option value="STOCK_LOW">Stock low</option><option value="INGESTION_FAILED">Ingestion failed</option><option value="HIGH_VALUE_SALE">High-value sale</option></select></label>
                  <label>Condition field<input required value={ruleForm.condition.field} onChange={e => setRuleForm({ ...ruleForm, condition: { ...ruleForm.condition, field: e.target.value } })} placeholder="e.g. bucket90Plus" /></label>
                  <label>Operator<select value={ruleForm.condition.operator} onChange={e => setRuleForm({ ...ruleForm, condition: { ...ruleForm.condition, operator: e.target.value } })}><option value="greater_than">Greater than</option><option value="less_than">Less than</option><option value="equals">Equals</option></select></label>
                  <label>Threshold / value<input required value={String(ruleForm.condition.value)} onChange={e => setRuleForm({ ...ruleForm, condition: { ...ruleForm.condition, value: /^\d+(\.\d+)?$/.test(e.target.value) ? Number(e.target.value) : e.target.value } })} /></label>
                  <label>Action channel<select value={ruleForm.action.channel} onChange={e => setRuleForm({ ...ruleForm, action: { ...ruleForm.action, channel: e.target.value } })}><option value="EMAIL">Email</option><option value="WHATSAPP">WhatsApp</option><option value="IN_APP_ALERT">In-app alert</option><option value="WEBHOOK">Webhook</option></select></label>
                  <label>Recipient<input required value={ruleForm.action.recipient} onChange={e => setRuleForm({ ...ruleForm, action: { ...ruleForm.action, recipient: e.target.value } })} placeholder="Email, phone, or team name" /></label>
                  <label className="full-width">Message template<textarea value={ruleForm.action.template} onChange={e => setRuleForm({ ...ruleForm, action: { ...ruleForm.action, template: e.target.value } })} placeholder="Use fields such as {{partyName}} or {{amount}}" /></label>
                </div>
                <div className="modal-footer"><button type="button" className="secondary-btn" onClick={() => setIsEditorOpen(false)}>Cancel</button><button type="submit" className="primary-btn" disabled={isSaving}>{isSaving ? 'Saving...' : editingRuleId ? 'Save Changes' : 'Create Rule'}</button></div>
              </form>
            </div>
          )}
        </div>
      </main>

      <ContextualGuidancePanel />
    </div>
  );
}
