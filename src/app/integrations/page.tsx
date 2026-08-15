"use client";
import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import ThemeToggle from '@/components/ThemeToggle';
import ContextualGuidancePanel from '@/components/ContextualGuidancePanel';
import { 
  CalendarCheck, 
  Play, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Database, 
  RefreshCw,
  Layers,
  FileSpreadsheet,
  Cloud,
  FolderSync,
  Mail,
  Plus,
  ShieldCheck
} from 'lucide-react';
import '../dashboard.css';
import '../business-pages.css';

interface ScheduleJob {
  id: string;
  name: string;
  sourceType: string;
  sourceLocation: string;
  mode: string;
  cronExpression?: string;
  enabled: boolean;
  lastRunAt?: string;
  lastCompletedAt?: string;
  lastStatus: 'SUCCESS' | 'FAILED' | 'RUNNING' | 'IDLE';
  lastDurationMs?: number;
  recordsProcessed?: number;
  recordsRejected?: number;
  dataFreshnessMinutes?: number;
}

export default function IntegrationsPage() {
  const [jobs, setJobs] = useState<ScheduleJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/v1/scheduler');
      if (res.ok) {
        const data = await res.json();
        setJobs(data.jobs || []);
      }
    } catch (err) {
      console.error('Failed to load scheduler jobs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const handleSyncNow = async () => {
    try {
      setSyncing(true);
      setStatusMessage('Executing pipeline synchronization across all 5 ATC datasets...');
      const res = await fetch('/api/v1/scheduler', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'sync_now' })
      });
      if (res.ok) {
        setStatusMessage('Sync completed successfully. Canonical repositories updated.');
        await fetchJobs();
        setTimeout(() => setStatusMessage(null), 5000);
      }
    } catch (err) {
      setStatusMessage('Sync failed. Check logs.');
    } finally {
      setSyncing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'SUCCESS':
        return <span className="badge badge-success">Healthy Sync</span>;
      case 'RUNNING':
        return <span className="badge badge-info">In Progress</span>;
      case 'FAILED':
        return <span className="badge badge-danger">Failed</span>;
      default:
        return <span className="badge badge-neutral">Idle</span>;
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
              <h1>Data Sources & Scheduling Observability</h1>
              <p>Continuous pipeline monitors, data freshness latency metrics, and automated batch/real-time sync jobs</p>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button className="primary-btn" onClick={handleSyncNow} disabled={syncing}>
                <Play size={15} className={syncing ? 'animate-spin' : ''} />
                <span>{syncing ? 'Syncing Pipeline...' : 'Sync All Sources Now'}</span>
              </button>
            </div>
          </div>

          {statusMessage && (
            <div style={{
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid #10b981',
              borderRadius: '8px',
              padding: '0.75rem 1rem',
              color: '#34d399',
              fontSize: '0.875rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <CheckCircle2 size={16} />
              <span>{statusMessage}</span>
            </div>
          )}

          <div className="kpi-grid">
            <div className="kpi-card">
              <div className="kpi-header">
                <span>Configured Sources</span>
                <Database size={16} />
              </div>
              <div className="kpi-value">{jobs.length}</div>
              <div className="kpi-subtext">ERP, Excel & Journal files</div>
            </div>
            <div className="kpi-card">
              <div className="kpi-header">
                <span>Data Freshness SLA</span>
                <Clock size={16} />
              </div>
              <div className="kpi-value">60m</div>
              <div className="kpi-subtext">Automated daily sync interval</div>
            </div>
            <div className="kpi-card">
              <div className="kpi-header">
                <span>Records Processed</span>
                <Layers size={16} />
              </div>
              <div className="kpi-value">
                {jobs.reduce((sum, j) => sum + (j.recordsProcessed || 0), 0).toLocaleString()}
              </div>
              <div className="kpi-subtext">Across canonical stores</div>
            </div>
            <div className="kpi-card">
              <div className="kpi-header">
                <span>Pipeline Status</span>
                <CheckCircle2 size={16} />
              </div>
              <div className="kpi-value" style={{ color: '#34d399' }}>100%</div>
              <div className="kpi-subtext">0 error records</div>
            </div>
          </div>

          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Job / Connector Name</th>
                  <th>Source Type</th>
                  <th>Ingestion Mode</th>
                  <th>Schedule Frequency</th>
                  <th>Last Run Status</th>
                  <th>Records Processed</th>
                  <th>Latency / Duration</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                      Loading scheduled connectors...
                    </td>
                  </tr>
                ) : jobs.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                      No scheduled jobs configured.
                    </td>
                  </tr>
                ) : (
                  jobs.map(j => (
                    <tr key={j.id}>
                      <td>
                        <div style={{ fontWeight: 600, color: '#f8fafc' }}>{j.name}</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{j.sourceLocation}</div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                          <FileSpreadsheet size={14} color="#60a5fa" />
                          <span>{j.sourceType}</span>
                        </div>
                      </td>
                      <td><span className="badge badge-neutral">{j.mode}</span></td>
                      <td style={{ fontFamily: 'monospace', color: '#94a3b8' }}>
                        {j.cronExpression || 'Manual Trigger'}
                      </td>
                      <td>{getStatusBadge(j.lastStatus)}</td>
                      <td>
                        <span style={{ fontWeight: 600, color: '#f8fafc' }}>
                          {j.recordsProcessed?.toLocaleString() || 0}
                        </span>
                        {j.recordsRejected && j.recordsRejected > 0 ? (
                          <span style={{ color: '#f87171', fontSize: '0.75rem', marginLeft: '0.4rem' }}>
                            ({j.recordsRejected} rejected)
                          </span>
                        ) : null}
                      </td>
                      <td>
                        {j.lastDurationMs 
                          ? `${(j.lastDurationMs / 1000).toFixed(1)}s` 
                          : 'Instant'}
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
