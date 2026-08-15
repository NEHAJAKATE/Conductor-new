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
  Clock
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

export default function WorkflowsPage() {
  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [logs, setLogs] = useState<ExecutionLog[]>([]);
  const [loading, setLoading] = useState(true);

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
                  <th>Toggle</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                      Loading automation policies...
                    </td>
                  </tr>
                ) : rules.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                      No rules found.
                    </td>
                  </tr>
                ) : (
                  rules.map(rule => (
                    <tr key={rule.id}>
                      <td>
                        <div style={{ fontWeight: 600, color: '#f8fafc' }}>{rule.name}</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{rule.description}</div>
                      </td>
                      <td>
                        <div style={{ fontFamily: 'monospace', color: '#60a5fa', fontSize: '0.8rem' }}>
                          {rule.condition.field} {rule.condition.operator === 'greater_than' ? '>' : rule.condition.operator === 'less_than' ? '<' : '='} {String(rule.condition.value)}
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          {getChannelIcon(rule.action.channel)}
                          <span style={{ fontSize: '0.85rem', color: '#e2e8f0' }}>{rule.action.recipient}</span>
                        </div>
                      </td>
                      <td>
                        <span className="badge badge-neutral">{rule.executionCount}</span>
                      </td>
                      <td>
                        {rule.enabled ? (
                          <span className="badge badge-success">Active</span>
                        ) : (
                          <span className="badge badge-neutral">Disabled</span>
                        )}
                      </td>
                      <td>
                        <button 
                          onClick={() => handleToggle(rule.id)}
                          style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: rule.enabled ? '#3b82f6' : '#64748b' }}
                          title="Toggle Rule State"
                        >
                          {rule.enabled ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
                        </button>
                      </td>
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
