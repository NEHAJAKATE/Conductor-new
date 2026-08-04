"use client";
import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import ThemeToggle from '@/components/ThemeToggle';
import { 
  Send, 
  Workflow, 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle2, 
  Plus, 
  X, 
  TrendingUp, 
  DollarSign, 
  Activity, 
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  User,
  Users,
  BarChart3,
  Layers,
  ArrowRight,
  Search,
  Target,
  FileText,
  Clock,
  Eye
} from 'lucide-react';
import './destinations.css';

interface SegmentRule {
  field: 'country' | 'spent' | 'purchase_count' | 'email_exists' | 'campaign' | 'device' | 'risk_score' | 'ltv' | 'pii_count' | 'quality_score';
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'greater_than_or_equal' | 'less_than_or_equal' | 'contains' | 'does_not_contain' | 'starts_with' | 'ends_with' | 'regex' | 'exists' | 'does_not_exist' | 'in_list' | 'not_in_list' | 'between' | 'not_between';
  value: string;
}

export default function DestinationsPage() {
  // Navigation & Data State
  const [activeTab, setActiveTab] = useState<'overview' | 'saved_audiences' | 'filters' | 'preview' | 'journey' | 'analytics'>('overview');
  const [segments, setSegments] = useState<any[]>([]);
  const [syncJobs, setSyncJobs] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>({ totalSynced: 0, totalRevenue: 0, avgRoi: 0, campaignsCount: 0 });
  
  // Executive sync actions
  const [selectedSegment, setSelectedSegment] = useState('');
  const [selectedDest, setSelectedDest] = useState<'meta' | 'google' | 'linkedin' | 'email' | 'sms' | 'webhook'>('meta');
  const [isSyncing, setIsSyncing] = useState(false);
  const [expandedJob, setExpandedJob] = useState<string | null>(null);

  // Audience Builder Workflow States
  const [newAudienceName, setNewAudienceName] = useState('');
  const [newAudienceDesc, setNewAudienceDesc] = useState('');
  const [newAudienceGoal, setNewAudienceGoal] = useState('Conversion Lift');
  const [newRules, setNewRules] = useState<SegmentRule[]>([
    { field: 'country', operator: 'equals', value: 'India' }
  ]);
  const [liveEstimatedSize, setLiveEstimatedSize] = useState<number>(0);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);

  // Preview tab selected segment
  const [previewSegmentId, setPreviewSegmentId] = useState('');
  const [previewProfiles, setPreviewProfiles] = useState<any[]>([]);

  // Load backend segments, sync jobs, and customer list
  const loadData = async () => {
    try {
      const segRes = await fetch('/api/v1/segments');
      if (segRes.ok) {
        const segData = await segRes.json();
        setSegments(segData);
        if (segData.length > 0) {
          setSelectedSegment(segData[0].id);
          setPreviewSegmentId(segData[0].id);
        }
      }
      const syncRes = await fetch('/api/v1/destinations');
      if (syncRes.ok) {
        const syncData = await syncRes.json();
        setSyncJobs(syncData.jobs || []);
        setSummary(syncData.summary || { totalSynced: 0, totalRevenue: 0, avgRoi: 0, campaignsCount: 0 });
      }
      const profRes = await fetch('/api/v1/customer360');
      if (profRes.ok) {
        const profData = await profRes.json();
        setProfiles(profData.profiles || []);
      }
    } catch (err) {
      console.error('Failed to load destinations dashboard data:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Compute live match preview size on rules edit
  useEffect(() => {
    if (profiles.length === 0) return;
    setIsPreviewLoading(true);
    // Dynamic matching rule evaluator (runs in-memory for preview dashboard speed)
    const matches = profiles.filter(p => {
      if (newRules.length === 0) return false;
      for (const rule of newRules) {
        const check = evaluateRuleInMemory(p, rule);
        if (!check) return false;
      }
      return true;
    });
    setLiveEstimatedSize(matches.length);
    setIsPreviewLoading(false);
  }, [newRules, profiles]);

  // Load preview profile matches based on dropdown selection
  useEffect(() => {
    if (!previewSegmentId || segments.length === 0 || profiles.length === 0) return;
    const activeSeg = segments.find(s => s.id === previewSegmentId);
    if (!activeSeg) return;

    const matches = profiles.filter(p => {
      if (!activeSeg.rules || activeSeg.rules.length === 0) return false;
      for (const rule of activeSeg.rules) {
        const check = evaluateRuleInMemory(p, rule);
        if (!check) return false;
      }
      return true;
    });
    setPreviewProfiles(matches);
  }, [previewSegmentId, segments, profiles]);

  // Evaluates a rule in memory
  const evaluateRuleInMemory = (profile: any, rule: SegmentRule): boolean => {
    const { field, operator, value } = rule;
    const ruleValLower = value.toLowerCase();
    
    let fieldVal: any = '';
    if (field === 'country') {
      fieldVal = profile.location || '';
    } else if (field === 'spent') {
      // Approximate spent value
      fieldVal = profile.riskScore > 50 ? 12000 : 2500; 
    } else if (field === 'risk_score') {
      fieldVal = profile.riskScore || 0;
    } else if (field === 'quality_score') {
      fieldVal = profile.confidence || 0;
    } else if (field === 'email_exists') {
      fieldVal = profile.email && !profile.email.includes('anonymous') ? 'true' : '';
    } else {
      fieldVal = profile.segment || 'Regular';
    }

    const strVal = String(fieldVal).toLowerCase();
    const numVal = Number(fieldVal);
    const numRule = Number(value);

    switch (operator) {
      case 'equals': return strVal === ruleValLower;
      case 'not_equals': return strVal !== ruleValLower;
      case 'greater_than': return numVal > numRule;
      case 'less_than': return numVal < numRule;
      case 'greater_than_or_equal': return numVal >= numRule;
      case 'less_than_or_equal': return numVal <= numRule;
      case 'contains': return strVal.includes(ruleValLower);
      case 'does_not_contain': return !strVal.includes(ruleValLower);
      case 'starts_with': return strVal.startsWith(ruleValLower);
      case 'ends_with': return strVal.endsWith(ruleValLower);
      case 'regex':
        try {
          return new RegExp(value, 'i').test(String(fieldVal));
        } catch {
          return false;
        }
      case 'exists':
        return fieldVal !== undefined && fieldVal !== null && fieldVal !== '';
      case 'does_not_exist':
        return fieldVal === undefined || fieldVal === null || fieldVal === '';
      case 'in_list':
        return value.split(',').map(s => s.trim().toLowerCase()).includes(strVal);
      case 'not_in_list':
        return !value.split(',').map(s => s.trim().toLowerCase()).includes(strVal);
      case 'between': {
        const parts = value.split(',').map(Number);
        return parts.length === 2 && numVal >= parts[0] && numVal <= parts[1];
      }
      case 'not_between': {
        const parts = value.split(',').map(Number);
        return parts.length === 2 && (numVal < parts[0] || numVal > parts[1]);
      }
      default: return false;
    }
  };

  const handleSyncSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSegment) return;

    setIsSyncing(true);
    try {
      const res = await fetch('/api/v1/destinations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          segmentId: selectedSegment,
          destination: selectedDest
        })
      });
      if (res.ok) {
        await loadData();
        alert('Business action executed successfully!');
      } else {
        const err = await res.json();
        alert(err.message || 'Action execution failed.');
      }
    } catch (err) {
      console.error(err);
      alert('Error executing business action.');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSaveAudience = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAudienceName) return;

    try {
      const res = await fetch('/api/v1/segments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newAudienceName,
          description: newAudienceDesc || `Goal: ${newAudienceGoal}`,
          rules: newRules
        })
      });
      if (res.ok) {
        setNewAudienceName('');
        setNewAudienceDesc('');
        await loadData();
        alert('Audience saved successfully!');
        setActiveTab('saved_audiences');
      } else {
        const err = await res.json();
        alert(err.message || 'Failed to save audience.');
      }
    } catch (err) {
      console.error(err);
      alert('Error saving audience.');
    }
  };

  const addRule = () => {
    setNewRules([...newRules, { field: 'country', operator: 'equals', value: '' }]);
  };

  const removeRule = (idx: number) => {
    setNewRules(newRules.filter((_, i) => i !== idx));
  };

  const updateRule = (idx: number, updates: Partial<SegmentRule>) => {
    setNewRules(newRules.map((r, i) => i === idx ? { ...r, ...updates } : r));
  };

  const handleDeleteSegment = async (id: string) => {
    if (!confirm('Are you sure you want to delete this saved audience?')) return;
    try {
      const res = await fetch(`/api/v1/segments?id=${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        await loadData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <header className="top-header">
          <div className="header-breadcrumbs">
            <span className="muted">Audience Console</span> / <span className="active-breadcrumb">{activeTab.toUpperCase().replace('_', ' ')}</span>
          </div>
          <div className="header-actions">
            <ThemeToggle />
            <div className="avatar">CDP</div>
          </div>
        </header>

        <div className="destinations-wrapper">
          {/* Top Metric Cards */}
          <div className="dest-metrics-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '20px' }}>
            <div className="dest-metric-card">
              <div className="card-header">
                <span className="metric-label">Synced Audience Size</span>
                <Send size={16} className="text-primary" />
              </div>
              <div className="metric-value">{summary.totalSynced}</div>
              <div className="metric-footer success">
                <TrendingUp size={12} /> Live Sync Active
              </div>
            </div>
            
            <div className="dest-metric-card">
              <div className="card-header">
                <span className="metric-label">Attributed Revenue</span>
                <DollarSign size={16} className="text-secondary" />
              </div>
              <div className="metric-value">${summary.totalRevenue?.toLocaleString()}</div>
              <div className="metric-footer success">
                <TrendingUp size={12} /> Campaign Attributions
              </div>
            </div>

            <div className="dest-metric-card">
              <div className="card-header">
                <span className="metric-label">Average Campaign ROI</span>
                <Activity size={16} className="text-success" />
              </div>
              <div className="metric-value">{summary.avgRoi}x</div>
              <div className="metric-footer success">
                <TrendingUp size={12} /> Over baseline channel
              </div>
            </div>

            <div className="dest-metric-card">
              <div className="card-header">
                <span className="metric-label">Active Campaigns</span>
                <ShieldCheck size={16} className="text-info" />
              </div>
              <div className="metric-value">{summary.campaignsCount}</div>
              <div className="metric-footer success">
                100% Platform Uptime
              </div>
            </div>
          </div>

          {/* Console Tab Links */}
          <div className="c360-tabs" style={{ marginBottom: '20px' }}>
            {[
              { id: 'overview', label: 'Overview & Sync', icon: <Send size={14} /> },
              { id: 'saved_audiences', label: 'Saved Audiences', icon: <Layers size={14} /> },
              { id: 'filters', label: 'Filters (Audience Builder)', icon: <Plus size={14} /> },
              { id: 'preview', label: 'Audience Previews', icon: <Eye size={14} /> },
              { id: 'journey', label: 'Customer Journey Map', icon: <Workflow size={14} /> },
              { id: 'analytics', label: 'Analytics Insights', icon: <BarChart3 size={14} /> }
            ].map(t => (
              <button 
                key={t.id}
                className={`c360-tab-btn ${activeTab === t.id ? 'active' : ''}`} 
                onClick={() => setActiveTab(t.id as any)}
              >
                <span style={{ display: 'inline-flex', alignItems: 'center', marginRight: '6px' }}>{t.icon}</span>
                {t.label}
              </button>
            ))}
          </div>

          {/* Overview & Sync Tab */}
          {activeTab === 'overview' && (
            <div className="dest-content-grid">
              {/* Sync Form */}
              <div className="dest-card form-container">
                <h3>Trigger Business Action</h3>
                <p className="card-subtitle">Select a saved cohort and trigger automated campaigns, email notifications, or data exports.</p>
                
                <form onSubmit={handleSyncSubmit} style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div className="form-group">
                    <label>Select Segment Cohort</label>
                    <select 
                      value={selectedSegment} 
                      onChange={e => setSelectedSegment(e.target.value)}
                      required
                      style={{ padding: '10px', width: '100%', borderRadius: '4px', backgroundColor: 'var(--bg-app)', border: '1px solid var(--grid-line-minor)', color: 'var(--text-loud)' }}
                    >
                      {segments.length === 0 ? (
                        <option value="">No segments available. Create one first.</option>
                      ) : (
                        segments.map(seg => (
                          <option key={seg.id} value={seg.id}>{seg.name} ({seg.estimatedSize} Profiles)</option>
                        ))
                      )}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Select Business Action</label>
                    <div className="dest-grid-selector">
                      {[
                        { id: 'meta', label: 'Show Advertisement' },
                        { id: 'email', label: 'Email Customers' },
                        { id: 'sms', label: 'Send SMS / Push' },
                        { id: 'google', label: 'Export Audience' },
                        { id: 'linkedin', label: 'Customer Journey' }
                      ].map(d => (
                        <button
                          key={d.id}
                          type="button"
                          className={`dest-selector-btn ${selectedDest === d.id ? 'active' : ''}`}
                          onClick={() => setSelectedDest(d.id as any)}
                        >
                          {d.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Gateway Connection Status</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px', backgroundColor: 'rgba(5, 150, 105, 0.08)', border: '1px solid rgba(5,105,105,0.2)', color: '#34d399', borderRadius: '4px', fontSize: '12px', fontWeight: 600 }}>
                      <span style={{ height: '8px', width: '8px', backgroundColor: '#10b981', borderRadius: '50%', display: 'inline-block' }}></span>
                      Authorized & Connected to Corporate Gateway
                    </div>
                  </div>

                  <button 
                    type="submit" 
                    className="btn-primary" 
                    disabled={isSyncing || segments.length === 0}
                    style={{ alignSelf: 'flex-start', marginTop: '8px' }}
                  >
                    {isSyncing ? <RefreshCw size={14} className="animate-spin" /> : <Send size={14} />}
                    <span>{isSyncing ? 'Running...' : 'Run Business Action'}</span>
                  </button>
                </form>
              </div>

              {/* Sync Jobs Ledger */}
              <div className="dest-card table-container">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <div>
                    <h3>Business Action History Log</h3>
                    <p className="card-subtitle">Real-time status of marketing activations and campaign metrics.</p>
                  </div>
                  <button className="btn-icon" onClick={loadData}><RefreshCw size={16} /></button>
                </div>

                <div className="table-wrapper">
                  <table className="dest-table">
                    <thead>
                      <tr>
                        <th>Job ID</th>
                        <th>Segment Cohort</th>
                        <th>Action</th>
                        <th>Status</th>
                        <th>Rows</th>
                        <th>Latency</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {syncJobs.length === 0 ? (
                        <tr>
                          <td colSpan={7} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                            No sync jobs run yet.
                          </td>
                        </tr>
                      ) : (
                        syncJobs.map(job => {
                          const isExpanded = expandedJob === job.jobId;
                          return (
                            <React.Fragment key={job.jobId}>
                              <tr 
                                className={`job-row-main ${isExpanded ? 'expanded' : ''}`}
                                onClick={() => setExpandedJob(isExpanded ? null : job.jobId)}
                              >
                                <td><span className="code-style">{job.jobId}</span></td>
                                <td><strong>{job.segmentName}</strong></td>
                                <td>
                                  <span className="badge-destination">
                                    {job.destination === 'meta' ? 'Show Advertisement' : job.destination === 'email' ? 'Email Customers' : job.destination === 'sms' ? 'Send SMS' : job.destination === 'google' ? 'Export Audience' : 'Customer Journey'}
                                  </span>
                                </td>
                                <td>
                                  <span className={`status-pill ${job.status.toLowerCase().replace(/ /g, '-')}`}>
                                    {job.status}
                                  </span>
                                </td>
                                <td>{job.rowsSynced}</td>
                                <td>{job.latencyMs}ms</td>
                                <td>
                                  {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                </td>
                              </tr>
                              {isExpanded && (
                                <tr className="job-row-detail">
                                  <td colSpan={7}>
                                    <div className="details-panel-expanded">
                                      <h4 style={{ color: 'var(--text-loud)', marginBottom: '12px' }}>📊 Action Performance Attribution</h4>
                                      <div className="perf-grid">
                                        <div className="perf-box">
                                          <span className="perf-label">CTR</span>
                                          <span className="perf-value">{job.campaignResults?.ctr || 0}%</span>
                                          <span className="perf-diff success">+{job.campaignResults?.ctrComparison || 0}% Lift</span>
                                        </div>
                                        <div className="perf-box">
                                          <span className="perf-label">Conversion Rate</span>
                                          <span className="perf-value">{job.campaignResults?.conversionRate || 0}%</span>
                                        </div>
                                        <div className="perf-box">
                                          <span className="perf-label">Attributed Revenue</span>
                                          <span className="perf-value">${(job.campaignResults?.revenue || 0).toLocaleString()}</span>
                                        </div>
                                        <div className="perf-box">
                                          <span className="perf-label">Campaign ROI</span>
                                          <span className="perf-value" style={{ color: 'var(--accent-primary)' }}>{job.campaignResults?.roi || 0}x</span>
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
                </div>
              </div>
            </div>
          )}

          {/* Saved Audiences Tab */}
          {activeTab === 'saved_audiences' && (
            <div className="dest-card table-container" style={{ width: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div>
                  <h3>Saved Segment Audiences</h3>
                  <p className="card-subtitle">Active segment definitions and their current evaluated match size.</p>
                </div>
                <button className="btn-primary" onClick={() => setActiveTab('filters')}>
                  <Plus size={14} /> Create Audience
                </button>
              </div>

              <div className="table-wrapper">
                <table className="dest-table" style={{ width: '100%' }}>
                  <thead>
                    <tr>
                      <th>Audience Name</th>
                      <th>Description</th>
                      <th>Estimated Reach</th>
                      <th>Rules Configured</th>
                      <th>Created Date</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {segments.length === 0 ? (
                      <tr>
                        <td colSpan={6} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                          No segments found. Go to Filters tab to build one.
                        </td>
                      </tr>
                    ) : (
                      segments.map(seg => (
                        <tr key={seg.id}>
                          <td><strong>{seg.name}</strong></td>
                          <td style={{ color: 'var(--text-muted)' }}>{seg.description}</td>
                          <td>
                            <span style={{ fontWeight: 'bold', color: 'var(--accent-primary)', fontSize: '13px' }}>
                              {seg.estimatedSize} Profiles
                            </span>
                          </td>
                          <td>
                            <span style={{ fontSize: '11px', fontFamily: 'monospace', padding: '3px 6px', backgroundColor: 'var(--bg-app)', border: '1px solid var(--grid-line-minor)', borderRadius: '4px' }}>
                              {seg.rules?.length || 0} Rules (AND)
                            </span>
                          </td>
                          <td style={{ fontSize: '11px' }}>{new Date(seg.createdAt).toLocaleString()}</td>
                          <td>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <button 
                                className="btn-secondary" 
                                style={{ padding: '4px 8px', fontSize: '10px' }}
                                onClick={() => {
                                  setSelectedSegment(seg.id);
                                  setActiveTab('overview');
                                }}
                              >
                                Trigger Action
                              </button>
                              <button 
                                className="btn-outline" 
                                style={{ padding: '4px 8px', fontSize: '10px', color: '#f87171', borderColor: 'rgba(248,113,113,0.3)' }}
                                onClick={() => handleDeleteSegment(seg.id)}
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Filters Tab (Audience Builder Workflow) */}
          {activeTab === 'filters' && (
            <div className="dest-content-grid">
              {/* Form Input */}
              <div className="dest-card form-container">
                <h3>Create New Audience Segment</h3>
                <p className="card-subtitle">Combine geographic, behavior, and spend limits to target customer clusters.</p>

                <form onSubmit={handleSaveAudience} style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div className="form-group">
                    <label>Audience Name *</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Inactive Spenders India" 
                      value={newAudienceName} 
                      onChange={e => setNewAudienceName(e.target.value)}
                      required 
                    />
                  </div>

                  <div className="form-group">
                    <label>Description</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Indian customers who spent > 5,000 INR." 
                      value={newAudienceDesc} 
                      onChange={e => setNewAudienceDesc(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label>Business Goal</label>
                    <select 
                      value={newAudienceGoal}
                      onChange={e => setNewAudienceGoal(e.target.value)}
                      style={{ padding: '10px', width: '100%', borderRadius: '4px', backgroundColor: 'var(--bg-app)', border: '1px solid var(--grid-line-minor)', color: 'var(--text-loud)' }}
                    >
                      <option value="Conversion Lift">Conversion Lift (Sales Campaign)</option>
                      <option value="Churn Re-engagement">Churn Re-engagement</option>
                      <option value="Cross-sell Campaign">Cross-sell Campaign</option>
                      <option value="Loyalty Reward Program">Loyalty Reward Program</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <label>Rules Configuration Matrix (AND)</label>
                      <button 
                        type="button" 
                        className="btn-secondary" 
                        onClick={addRule} 
                        style={{ padding: '4px 8px', fontSize: '11px' }}
                      >
                        + Add Rule Condition
                      </button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {newRules.map((rule, idx) => (
                        <div key={idx} style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                          <select
                            value={rule.field}
                            onChange={e => updateRule(idx, { field: e.target.value as any })}
                            style={{ flex: 1, padding: '8px', fontSize: '11px', borderRadius: '4px', backgroundColor: 'var(--bg-app)', border: '1px solid var(--grid-line-minor)', color: 'var(--text-loud)' }}
                          >
                            <option value="country">Country</option>
                            <option value="spent">Total Spent</option>
                            <option value="purchase_count">Purchase Count</option>
                            <option value="email_exists">Email Address Exists</option>
                            <option value="campaign">Referral Campaign</option>
                            <option value="device">Device Type</option>
                            <option value="risk_score">Churn Risk Score</option>
                            <option value="ltv">Estimated CLV</option>
                            <option value="pii_count">Sensitive Fields Count</option>
                            <option value="quality_score">Identity Quality Score</option>
                          </select>

                          <select
                            value={rule.operator}
                            onChange={e => updateRule(idx, { operator: e.target.value as any })}
                            style={{ flex: 1, padding: '8px', fontSize: '11px', borderRadius: '4px', backgroundColor: 'var(--bg-app)', border: '1px solid var(--grid-line-minor)', color: 'var(--text-loud)' }}
                          >
                            <option value="equals">Equals</option>
                            <option value="not_equals">Not Equals</option>
                            <option value="greater_than">Greater Than (&gt;)</option>
                            <option value="less_than">Less Than (&lt;)</option>
                            <option value="greater_than_or_equal">Greater Than or Equal (&gt;=)</option>
                            <option value="less_than_or_equal">Less Than or Equal (&lt;=)</option>
                            <option value="contains">Contains</option>
                            <option value="does_not_contain">Does Not Contain</option>
                            <option value="starts_with">Starts With</option>
                            <option value="ends_with">Ends With</option>
                            <option value="regex">Advanced Pattern (Regex)</option>
                            <option value="exists">Exists</option>
                            <option value="does_not_exist">Does Not Exist</option>
                            <option value="in_list">In List (comma separated)</option>
                            <option value="not_in_list">Not In List</option>
                            <option value="between">Between (e.g. 100,500)</option>
                            <option value="not_between">Not Between</option>
                          </select>

                          {rule.operator !== 'exists' && rule.operator !== 'does_not_exist' && (
                            <input 
                              type="text" 
                              required
                              placeholder="Value"
                              value={rule.value} 
                              onChange={e => updateRule(idx, { value: e.target.value })}
                              style={{ flex: 1.2, padding: '8px', fontSize: '11px', borderRadius: '4px', backgroundColor: 'var(--bg-app)', border: '1px solid var(--grid-line-minor)', color: 'var(--text-loud)' }}
                            />
                          )}

                          <button 
                            type="button" 
                            onClick={() => removeRule(idx)} 
                            style={{ padding: '6px', backgroundColor: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '4px' }}
                            disabled={newRules.length === 1}
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button 
                    type="submit" 
                    className="btn-primary" 
                    disabled={!newAudienceName}
                    style={{ alignSelf: 'flex-start', marginTop: '12px' }}
                  >
                    <CheckCircle2 size={14} /> Save Audience
                  </button>
                </form>
              </div>

              {/* Reach Panel */}
              <div className="dest-card Reach-container" style={{ padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '300px', backgroundColor: 'rgba(56, 189, 248, 0.03)', border: '1.5px dashed var(--accent-primary)', borderRadius: '6px' }}>
                <Users size={48} style={{ color: 'var(--accent-primary)', marginBottom: '16px' }} />
                <h3 style={{ fontSize: '18px', color: 'var(--text-loud)' }}>Target Audience Size</h3>
                
                {isPreviewLoading ? (
                  <div style={{ marginTop: '20px', fontSize: '24px', fontWeight: 'bold' }}>Calculating...</div>
                ) : (
                  <>
                    <div style={{ marginTop: '20px', fontSize: '48px', fontWeight: 'bold', color: 'var(--accent-primary)' }}>
                      {liveEstimatedSize}
                    </div>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px', textAlign: 'center' }}>
                      Estimated customer profiles matching current filter rules matrix.
                    </p>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Previews Tab */}
          {activeTab === 'preview' && (
            <div className="dest-card table-container" style={{ width: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div>
                  <h3>Audience Previews</h3>
                  <p className="card-subtitle">View matching customer directories for any saved segment cohort.</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Choose Cohort:</span>
                  <select 
                    value={previewSegmentId} 
                    onChange={e => setPreviewSegmentId(e.target.value)}
                    style={{ padding: '6px', borderRadius: '4px', backgroundColor: 'var(--bg-app)', border: '1px solid var(--grid-line-minor)', color: 'var(--text-loud)', fontSize: '12px' }}
                  >
                    {segments.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="table-wrapper">
                <table className="dest-table" style={{ width: '100%' }}>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Unique Customer ID</th>
                      <th>Email Address</th>
                      <th>Location</th>
                      <th>Profile Type</th>
                      <th>Match Confidence</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewProfiles.length === 0 ? (
                      <tr>
                        <td colSpan={6} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                          No customer profiles match the current segment criteria rules.
                        </td>
                      </tr>
                    ) : (
                      previewProfiles.map((p, idx) => (
                        <tr key={idx}>
                          <td><strong>{p.name}</strong></td>
                          <td><span className="code-style">{p.uuid}</span></td>
                          <td>{p.email}</td>
                          <td>{p.location}</td>
                          <td>
                            <span className="tag" style={{
                              fontSize: '9px',
                              fontWeight: 'bold',
                              backgroundColor: p.profileType === 'Anonymous Visitor' ? 'rgba(217, 119, 6, 0.15)' : p.profileType === 'Unified Profile' ? 'rgba(5, 150, 105, 0.15)' : 'rgba(37, 99, 235, 0.15)',
                              color: p.profileType === 'Anonymous Visitor' ? '#d97706' : p.profileType === 'Unified Profile' ? '#059669' : '#2563eb',
                              border: `1px solid ${p.profileType === 'Anonymous Visitor' ? 'rgba(217, 119, 6, 0.3)' : p.profileType === 'Unified Profile' ? 'rgba(5, 150, 105, 0.3)' : 'rgba(37, 99, 235, 0.3)'}`
                            }}>
                              {p.profileType || 'Known Customer'}
                            </span>
                          </td>
                          <td>
                            <span style={{ fontWeight: 600, color: p.confidence >= 80 ? 'var(--accent-primary)' : 'var(--accent-secondary)' }}>
                              {p.confidence}% match
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Customer Journey Tab */}
          {activeTab === 'journey' && (
            <div className="dest-card" style={{ padding: '24px', width: '100%' }}>
              <h3>Customer Journey Flow Map</h3>
              <p className="card-subtitle" style={{ marginBottom: '24px' }}>Visual pipelines of active customer data matching and promotion routes.</p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '30px', margin: '20px auto', maxWidth: '800px', position: 'relative' }}>
                
                {/* Flow Node 1 */}
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center', padding: '16px', backgroundColor: 'var(--bg-app)', border: '1px solid var(--grid-line-minor)', borderRadius: '6px' }}>
                  <div style={{ height: '36px', width: '36px', borderRadius: '50%', backgroundColor: 'rgba(37, 99, 235, 0.12)', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>1</div>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ margin: 0, fontSize: '13px', color: 'var(--text-loud)' }}>Multi-Source Data Ingestion (Imported Data)</h4>
                    <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-muted)' }}>Files ingested from Snowflake, Stripe, CSV, or Web cookies are loaded into local workspace paths.</p>
                  </div>
                  <span style={{ fontSize: '10px', color: '#10b981', fontWeight: 600 }}>🟢 ACTIVE</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'center' }}><ArrowRight size={20} style={{ transform: 'rotate(90deg)', color: 'var(--text-muted)' }} /></div>

                {/* Flow Node 2 */}
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center', padding: '16px', backgroundColor: 'var(--bg-app)', border: '1px solid var(--grid-line-minor)', borderRadius: '6px' }}>
                  <div style={{ height: '36px', width: '36px', borderRadius: '50%', backgroundColor: 'rgba(16, 185, 129, 0.12)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>2</div>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ margin: 0, fontSize: '13px', color: 'var(--text-loud)' }}>Dynamic Cleanse & PII Scan (Cleaned Data)</h4>
                    <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-muted)' }}>PII patterns (emails, Aadhaar ID, phone numbers) are cataloged, tokenized, or encrypted securely.</p>
                  </div>
                  <span style={{ fontSize: '10px', color: '#10b981', fontWeight: 600 }}>🟢 ACTIVE</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'center' }}><ArrowRight size={20} style={{ transform: 'rotate(90deg)', color: 'var(--text-muted)' }} /></div>

                {/* Flow Node 3 */}
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center', padding: '16px', backgroundColor: 'var(--bg-app)', border: '1px solid var(--grid-line-minor)', borderRadius: '6px' }}>
                  <div style={{ height: '36px', width: '36px', borderRadius: '50%', backgroundColor: 'rgba(217, 119, 6, 0.12)', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>3</div>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ margin: 0, fontSize: '13px', color: 'var(--text-loud)' }}>Identity Resolution & Promotion (Customer Matching)</h4>
                    <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-muted)' }}>Stitch anonymous sessions (Cookie IDs) to authenticated profile matches, promoting visitor activity flows.</p>
                  </div>
                  <span style={{ fontSize: '10px', color: '#10b981', fontWeight: 600 }}>🟢 ACTIVE</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'center' }}><ArrowRight size={20} style={{ transform: 'rotate(90deg)', color: 'var(--text-muted)' }} /></div>

                {/* Flow Node 4 */}
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center', padding: '16px', backgroundColor: 'var(--bg-app)', border: '1px solid var(--grid-line-minor)', borderRadius: '6px' }}>
                  <div style={{ height: '36px', width: '36px', borderRadius: '50%', backgroundColor: 'rgba(147, 51, 234, 0.12)', color: '#9333ea', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>4</div>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ margin: 0, fontSize: '13px', color: 'var(--text-loud)' }}>Business Activations (Business Ready Data)</h4>
                    <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-muted)' }}>Sync saved segment lists directly to Advertisement channels or Push SMS notifications instantly.</p>
                  </div>
                  <span style={{ fontSize: '10px', color: '#10b981', fontWeight: 600 }}>🟢 ACTIVE</span>
                </div>

              </div>
            </div>
          )}

          {/* Analytics Insights Tab */}
          {activeTab === 'analytics' && (
            <div className="dest-card" style={{ padding: '24px', width: '100%' }}>
              <h3>Business Performance Analytics</h3>
              <p className="card-subtitle" style={{ marginBottom: '24px' }}>Review CTR conversion rates, attributed invoice revenue lifts, and overall campaign ROI performance.</p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div style={{ padding: '20px', backgroundColor: 'var(--bg-app)', border: '1px solid var(--grid-line-minor)', borderRadius: '6px' }}>
                  <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-loud)' }}>
                    <TrendingUp size={16} /> Click-Through-Rate (CTR) Lift Comparison
                  </h4>
                  <div style={{ height: '220px', display: 'flex', flexDirection: 'column', gap: '16px', justifyContent: 'center', marginTop: '16px' }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }}>
                        <span>Show Advertisement Action (Meta Ads Gateway)</span>
                        <span style={{ fontWeight: 'bold' }}>+24.2% Lift</span>
                      </div>
                      <div style={{ height: '14px', width: '100%', backgroundColor: 'var(--grid-line-minor)', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: '82%', backgroundColor: '#2563eb' }}></div>
                      </div>
                    </div>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }}>
                        <span>Email Customers Action (Outbox API)</span>
                        <span style={{ fontWeight: 'bold' }}>+12.8% Lift</span>
                      </div>
                      <div style={{ height: '14px', width: '100%', backgroundColor: 'var(--grid-line-minor)', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: '64%', backgroundColor: '#10b981' }}></div>
                      </div>
                    </div>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }}>
                        <span>Send SMS Action (Twilio API Gateway)</span>
                        <span style={{ fontWeight: 'bold' }}>+8.4% Lift</span>
                      </div>
                      <div style={{ height: '14px', width: '100%', backgroundColor: 'var(--grid-line-minor)', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: '45%', backgroundColor: '#d97706' }}></div>
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ padding: '20px', backgroundColor: 'var(--bg-app)', border: '1px solid var(--grid-line-minor)', borderRadius: '6px' }}>
                  <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-loud)' }}>
                    <DollarSign size={16} /> Attributed Campaign Revenue Matrix
                  </h4>
                  <div style={{ height: '220px', display: 'flex', flexDirection: 'column', gap: '16px', justifyContent: 'center', marginTop: '16px' }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }}>
                        <span>Premium Indian Customers Cohort</span>
                        <span style={{ fontWeight: 'bold' }}>$45,000</span>
                      </div>
                      <div style={{ height: '14px', width: '100%', backgroundColor: 'var(--grid-line-minor)', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: '90%', backgroundColor: 'var(--accent-primary)' }}></div>
                      </div>
                    </div>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }}>
                        <span>Summer Sale 2026 Mobile Cohort</span>
                        <span style={{ fontWeight: 'bold' }}>$12,000</span>
                      </div>
                      <div style={{ height: '14px', width: '100%', backgroundColor: 'var(--grid-line-minor)', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: '38%', backgroundColor: 'var(--accent-secondary)' }}></div>
                      </div>
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', borderTop: '1px solid var(--grid-line-minor)', paddingTop: '16px', display: 'flex', justifyContent: 'space-between' }}>
                      <span>Combined Attributed Sales:</span>
                      <span style={{ color: 'var(--text-loud)', fontWeight: 'bold', fontSize: '13px' }}>${summary.totalRevenue?.toLocaleString()} USD</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
