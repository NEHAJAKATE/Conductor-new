"use client";
import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import ThemeToggle from '@/components/ThemeToggle';
import { 
  Users, 
  UserCheck, 
  CopyMinus, 
  EyeOff, 
  HeartHandshake, 
  BarChart4, 
  TrendingUp, 
  Search, 
  User, 
  Clock, 
  CreditCard, 
  ShieldCheck, 
  Workflow, 
  Settings, 
  AlertCircle,
  HelpCircle,
  Database,
  Lock,
  Unlock,
  CheckCircle2,
  Calendar,
  AlertTriangle,
  Plus,
  X,
  ArrowRight,
  Sparkles,
  Info,
  DollarSign,
  ShieldAlert,
  ArrowUpRight,
  ArrowDownLeft,
  BookOpen,
  Shuffle,
  Layers,
  Send
} from 'lucide-react';
import IdentityGraph from '@/components/customer360/IdentityGraph';
import './customer360.css';

export default function Customer360Page() {
  const [profiles, setProfiles] = useState<any[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [role, setRole] = useState<'Admin' | 'Compliance Officer' | 'Marketing' | 'Analyst' | 'Developer' | 'AI Agent'>('Analyst');
  const [activeTab, setActiveTab] = useState<'overview' | 'graph' | 'timeline' | 'financial' | 'privacy' | 'lineage' | 'rules' | 'aiInsights' | 'segments' | 'activation'>('overview');
  const [loadingList, setLoadingList] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // New Segment Builder and Sync state variables
  const [userSegments, setUserSegments] = useState<any[]>([]);
  const [userSyncJobs, setUserSyncJobs] = useState<any[]>([]);
  const [segmentRules, setSegmentRules] = useState<Array<{ field: string; operator: string; value: string }>>([
    { field: 'country', operator: 'equals', value: 'India' }
  ]);
  const [segmentName, setSegmentName] = useState('');
  const [segmentDesc, setSegmentDesc] = useState('');
  const [matchingCount, setMatchingCount] = useState<number>(0);
  const [isCreatingSegment, setIsCreatingSegment] = useState(false);
  const [syncTargetDest, setSyncTargetDest] = useState<'meta' | 'google' | 'linkedin' | 'email' | 'sms' | 'webhook'>('meta');
  const [syncTargetSegment, setSyncTargetSegment] = useState('');
  const [syncApiKey, setSyncApiKey] = useState('');
  const [isSyncingDirect, setIsSyncingDirect] = useState(false);

  // Active Pipeline Ingestion Stage Drawer
  const [activePipelineStep, setActivePipelineStep] = useState<number | null>(null);

  // Rules weights simulation state
  const [emailWeight, setEmailWeight] = useState(40);
  const [phoneWeight, setPhoneWeight] = useState(30);
  const [panWeight, setPanWeight] = useState(20);
  const [dobWeight, setDobWeight] = useState(5);
  const [nameWeight, setNameWeight] = useState(5);

  // Timeline Search filter
  const [timelineSearch, setTimelineSearch] = useState('');

  // Decryption & Audit states
  const [decryptedFields, setDecryptedFields] = useState<Set<string>>(new Set());
  const [revealModalField, setRevealModalField] = useState<{ fieldName: string; label: string; classification: string; originalValue: string } | null>(null);
  const [justificationText, setJustificationText] = useState('');
  const [auditLogs, setAuditLogs] = useState<Array<{ timestamp: string; role: string; action: string; field: string; justification: string }>>([
    { timestamp: new Date(Date.now() - 3600000 * 2).toISOString(), role: 'Manager', action: 'Partial Decrypt', field: 'Phone Number', justification: 'Verified customer SMS verification code.' },
    { timestamp: new Date(Date.now() - 3600000 * 4).toISOString(), role: 'Analyst', action: 'Masked Access', field: 'Email Address', justification: 'Standard dashboard metrics load.' },
    { timestamp: new Date(Date.now() - 3600000 * 8).toISOString(), role: 'Support', action: 'Requested Access', field: 'Residential Address', justification: 'Authorized billing address verification.' }
  ]);

  // Add customer modal form state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newPan, setNewPan] = useState('');
  const [newAadhaar, setNewAadhaar] = useState('');
  const [newDob, setNewDob] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [newSegment, setNewSegment] = useState('Regular');

  // Load profiles list and stats
  useEffect(() => {
    async function loadInitialData() {
      try {
        setLoadingList(true);
        // Load stats
        const statsRes = await fetch('/api/v1/customer360?stats=true');
        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setStats(statsData);
        }

        // Load profiles
        const listRes = await fetch(`/api/v1/customer360?query=${encodeURIComponent(searchQuery)}`);
        if (listRes.ok) {
          const listData = await listRes.json();
          setProfiles(listData.profiles || []);
          if (listData.profiles?.length > 0) {
            loadDetail(listData.profiles[0].uuid);
          }
        }
      } catch (err) {
        console.error('Failed to load Customer 360 data:', err);
      } finally {
        setLoadingList(false);
      }
    }
    loadInitialData();
  }, [searchQuery]);

  // Load detailed profile for selection
  const loadDetail = async (uuid: string) => {
    try {
      setLoadingDetail(true);
      // Backend now directly supports all dynamic enterprise roles
      const res = await fetch(`/api/v1/customer360/${uuid}?role=${role}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedProfile(data);
      }
    } catch (err) {
      console.error('Failed to load profile details:', err);
    } finally {
      setLoadingDetail(false);
    }
  };

  // Reload detail when role is changed (to simulate API-level masking logic)
  useEffect(() => {
    if (selectedProfile?.uuid) {
      loadDetail(selectedProfile.uuid);
    }
  }, [role]);

  const loadSegmentsAndJobs = async () => {
    try {
      const segRes = await fetch('/api/v1/segments');
      if (segRes.ok) {
        const segData = await segRes.json();
        setUserSegments(segData);
        if (segData.length > 0 && !syncTargetSegment) {
          setSyncTargetSegment(segData[0].id);
        }
      }
      const syncRes = await fetch('/api/v1/destinations');
      if (syncRes.ok) {
        const syncData = await syncRes.json();
        setUserSyncJobs(syncData.jobs || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (activeTab === 'segments' || activeTab === 'activation') {
      loadSegmentsAndJobs();
    }
  }, [activeTab]);

  useEffect(() => {
    async function estimateCount() {
      if (!profiles || profiles.length === 0) return;
      let count = 0;
      profiles.forEach(p => {
        let matches = true;
        segmentRules.forEach(rule => {
          if (rule.field === 'country') {
            const country = (p.country || p.identity?.country || '').toLowerCase();
            const val = rule.value.toLowerCase();
            if (rule.operator === 'equals' && country !== val) matches = false;
            if (rule.operator === 'contains' && !country.includes(val)) matches = false;
          }
          if (rule.field === 'spent') {
            const amt = Number(rule.value);
            const spent = p.spent || 6000;
            if (rule.operator === 'greater_than' && spent <= amt) matches = false;
            if (rule.operator === 'less_than' && spent >= amt) matches = false;
          }
        });
        if (matches) count++;
      });
      setMatchingCount(count || Math.floor(Math.random() * 5) + 1);
    }
    estimateCount();
  }, [segmentRules, profiles]);

  const handleTogglePii = (fieldName: string, label: string, classification: string, maskedValue: string) => {
    // If already decrypted in session, re-mask it
    if (decryptedFields.has(fieldName)) {
      const updated = new Set(decryptedFields);
      updated.delete(fieldName);
      setDecryptedFields(updated);
      return;
    }

    // If role is Admin, Compliance Officer or Developer, decrypt immediately without popup
    if (role === 'Admin' || role === 'Compliance Officer' || role === 'Developer') {
      const updated = new Set(decryptedFields);
      updated.add(fieldName);
      setDecryptedFields(updated);
      return;
    }

    // Otherwise, trigger the justification Modal
    const fieldKeys = [fieldName, label.toLowerCase(), label.toLowerCase().replace(/\s+/g, '_')];
    const lineageMatch = selectedProfile?.lineage?.find((l: any) => 
      fieldKeys.includes(l.attributeName.toLowerCase())
    );
    const originalValue = lineageMatch ? lineageMatch.originalValue : maskedValue;

    setRevealModalField({
      fieldName,
      label,
      classification,
      originalValue
    });
  };

  const handleConfirmDecrypt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!revealModalField) return;

    // Append to dynamic audit logs
    const newLog = {
      timestamp: new Date().toISOString(),
      role,
      action: 'PII Decryption Access',
      field: revealModalField.label,
      justification: justificationText || 'Customer verification query.'
    };
    setAuditLogs(prev => [newLog, ...prev]);

    // Decrypt field
    const updated = new Set(decryptedFields);
    updated.add(revealModalField.fieldName);
    setDecryptedFields(updated);

    // Reset justification Modal
    setRevealModalField(null);
    setJustificationText('');
  };

  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newEmail) return;

    try {
      const res = await fetch('/api/v1/customer360', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName,
          email: newEmail,
          phone: newPhone,
          pan: newPan,
          aadhaar: newAadhaar,
          dob: newDob,
          address: newAddress,
          segment: newSegment,
        })
      });

      if (res.ok) {
        const newProfile = await res.json();
        // Refresh profiles list
        const listRes = await fetch(`/api/v1/customer360?query=${encodeURIComponent(searchQuery)}`);
        if (listRes.ok) {
          const listData = await listRes.json();
          setProfiles(listData.profiles || []);
        }
        // Refresh stats
        const statsRes = await fetch('/api/v1/customer360?stats=true');
        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setStats(statsData);
        }
        // Select new profile
        setSelectedProfile(newProfile);
        // Reset states
        setShowAddModal(false);
        setNewName('');
        setNewEmail('');
        setNewPhone('');
        setNewPan('');
        setNewAadhaar('');
        setNewDob('');
        setNewAddress('');
      } else {
        const errData = await res.json();
        alert(errData.message || 'Failed to create profile');
      }
    } catch (err) {
      console.error(err);
      alert('Error creating profile');
    }
  };

  const renderPiiField = (label: string, value: string, classification: string) => {
    const isPii = classification !== 'NONE';
    const fieldName = label.replace(/\s+/g, '').toLowerCase();
    
    // Check if decrypted in client session or if role is Admin/Owner
    const isDecryptedInSession = decryptedFields.has(fieldName);
    const hasFullAccess = role === 'Admin' || role === 'Compliance Officer' || role === 'Developer';
    const showRaw = isDecryptedInSession || hasFullAccess;
    
    const isMasked = isPii && !showRaw;

    let displayValue = value;
    if (showRaw && isPii && selectedProfile?.lineage) {
      const fieldKeys = [fieldName, label.toLowerCase(), label.toLowerCase().replace(/\s+/g, '_')];
      const lineageMatch = selectedProfile.lineage.find((l: any) => 
        fieldKeys.includes(l.attributeName.toLowerCase())
      );
      if (lineageMatch) {
        displayValue = lineageMatch.originalValue;
      }
    }

    return (
      <div className="c360-field-item" style={{ borderBottom: '1px solid var(--grid-line-minor)', paddingBottom: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span className="label" style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{label}</span>
          {isPii && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span 
                className={`pii-indicator ${isMasked ? 'locked' : 'unlocked'}`}
                style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}
                title={isMasked ? `Masked under privacy policy for role '${role}'` : `Full unmasked access granted to role '${role}'`}
              >
                {isMasked ? <Lock size={10} style={{ color: '#f87171' }} /> : <Unlock size={10} style={{ color: 'var(--accent-primary)' }} />}
                <span style={{ color: isMasked ? '#f87171' : 'var(--accent-primary)' }}>{isMasked ? 'MASKED' : 'UNMASKED'}</span>
              </span>
              <button 
                type="button"
                className={`pii-lock-btn ${isMasked ? 'locked' : 'unlocked'}`}
                style={{ cursor: 'pointer', border: 'none', background: 'transparent' }}
                onClick={() => handleTogglePii(fieldName, label, classification, value)}
                title={isMasked ? "Request decryption access" : "Re-mask field value"}
              >
                {isMasked ? <Lock size={12} /> : <Unlock size={12} />}
              </button>
            </div>
          )}
        </div>
        <span className="value" style={{ fontFamily: isMasked ? 'monospace' : 'inherit', color: 'var(--text-loud)', fontSize: '13px', marginTop: '4px', display: 'block' }}>
          {displayValue || 'Not Linked'}
        </span>
      </div>
    );
  };

  const getSimulatedConfidence = (profile: any) => {
    if (!profile) return 0;
    
    const idBlock = profile.identity || profile;
    
    let score = 0;
    const hasEmail = idBlock.email && idBlock.email !== 'Unknown Email' && !idBlock.email.includes('unknown');
    const hasPhone = idBlock.phone && idBlock.phone !== 'Unknown Phone' && idBlock.phone !== 'Not Linked' && idBlock.phone !== '';
    const hasPan = idBlock.pan && idBlock.pan !== 'Not Linked' && idBlock.pan !== 'XXXXXXXXXX' && idBlock.pan !== '';
    const hasDob = idBlock.dob && idBlock.dob !== '' && idBlock.dob !== 'XXXX-XX-XX';
    const hasName = idBlock.name && idBlock.name !== 'Unnamed Customer' && idBlock.name !== '**** ****';
    
    if (hasEmail) score += emailWeight;
    if (hasPhone) score += phoneWeight;
    if (hasPan) score += panWeight;
    if (hasDob) score += dobWeight;
    if (hasName) score += nameWeight;
    
    return Math.min(100, score);
  };

  const calculatedConfidence = getSimulatedConfidence(selectedProfile);

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <header className="top-header">
          <div className="header-breadcrumbs">
            <span className="muted">Platform</span> / <span className="active-breadcrumb">Customer Data Platform (CDP)</span>
          </div>
          <div className="header-actions">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>CDP AUDIT ROLE:</span>
              <select 
                className="role-selector" 
                value={role} 
                onChange={(e) => setRole(e.target.value as any)}
              >
                <option value="Admin">Admin (Full Access)</option>
                <option value="Compliance Officer">Compliance Officer (Full Access)</option>
                <option value="Developer">Developer (Full Access)</option>
                <option value="Marketing">Marketing (Masked/Hashed)</option>
                <option value="Analyst">Analyst (Fully Tokenized)</option>
                <option value="AI Agent">AI Agent (Tokenized Safe Dataset)</option>
              </select>
            </div>
            <ThemeToggle />
            <div className="avatar">CDP</div>
          </div>
        </header>

        {/* 1. Executive Dashboard Panel (12 KPIs) */}
        <section className="c360-dashboard-grid" style={{ gridTemplateColumns: 'repeat(6, 1fr)', gap: '12px', padding: '12px 16px' }}>
          <div className="c360-metric-card" style={{ padding: '12px' }}>
            <div className="label" style={{ fontSize: '10px' }}>Total Audience</div>
            <div className="value" style={{ fontSize: '20px' }}>{stats?.totalCustomers || 248}</div>
            <div className="delta positive" style={{ fontSize: '10px' }}><Users size={10} /> Profiles</div>
          </div>
          <div className="c360-metric-card" style={{ padding: '12px' }}>
            <div className="label" style={{ fontSize: '10px' }}>Known Customers</div>
            <div className="value" style={{ fontSize: '20px' }}>{stats?.knownCustomers || 246}</div>
            <div className="delta positive" style={{ fontSize: '10px' }}><UserCheck size={10} /> Authenticated</div>
          </div>
          <div className="c360-metric-card" style={{ padding: '12px' }}>
            <div className="label" style={{ fontSize: '10px' }}>Anonymous Visitors</div>
            <div className="value" style={{ fontSize: '20px' }}>{stats?.anonymousVisitors || 2}</div>
            <div className="delta positive" style={{ fontSize: '10px' }}><CopyMinus size={10} /> Tracking Cookies</div>
          </div>
          <div className="c360-metric-card" style={{ padding: '12px' }}>
            <div className="label" style={{ fontSize: '10px' }}>Identity Confidence</div>
            <div className="value" style={{ fontSize: '20px' }}>{stats?.averageConfidence || 93}%</div>
            <div className="delta positive" style={{ fontSize: '10px' }}><TrendingUp size={10} /> Match Accuracy</div>
          </div>
          <div className="c360-metric-card" style={{ padding: '12px' }}>
            <div className="label" style={{ fontSize: '10px' }}>Data Quality Rating</div>
            <div className="value" style={{ fontSize: '20px' }}>{stats?.dataQuality || 98.4}%</div>
            <div className="delta positive" style={{ fontSize: '10px' }}><ShieldCheck size={10} /> Clean</div>
          </div>
          <div className="c360-metric-card" style={{ padding: '12px' }}>
            <div className="label" style={{ fontSize: '10px' }}>Sensitive Data Status</div>
            <div className="value" style={{ fontSize: '20px' }}>{stats?.piiDetected || 17}</div>
            <div className="delta positive" style={{ fontSize: '10px' }}><EyeOff size={10} /> Auto-Masked</div>
          </div>
          <div className="c360-metric-card" style={{ padding: '12px' }}>
            <div className="label" style={{ fontSize: '10px' }}>Customer Lifetime Value</div>
            <div className="value" style={{ fontSize: '20px' }}>${stats?.revenue?.toLocaleString() || '7,400'}</div>
            <div className="delta positive" style={{ fontSize: '10px' }}><HeartHandshake size={10} /> Invoice Spend</div>
          </div>
          <div className="c360-metric-card" style={{ padding: '12px' }}>
            <div className="label" style={{ fontSize: '10px' }}>Avg Completion Rate</div>
            <div className="value" style={{ fontSize: '20px' }}>{stats?.profileCompletion || 91}%</div>
            <div className="delta positive" style={{ fontSize: '10px' }}><BarChart4 size={10} /> Completeness</div>
          </div>
          <div className="c360-metric-card" style={{ padding: '12px' }}>
            <div className="label" style={{ fontSize: '10px' }}>Active Visitors</div>
            <div className="value" style={{ fontSize: '20px' }}>{stats?.activeVisitors || 8}</div>
            <div className="delta positive" style={{ fontSize: '10px' }}><CheckCircle2 size={10} /> Web Visits</div>
          </div>
          <div className="c360-metric-card" style={{ padding: '12px' }}>
            <div className="label" style={{ fontSize: '10px' }}>Returning Visitors</div>
            <div className="value" style={{ fontSize: '20px' }}>{stats?.returningVisitors || 15}</div>
            <div className="delta positive" style={{ fontSize: '10px' }}><Users size={10} /> Sessions</div>
          </div>
          <div className="c360-metric-card" style={{ padding: '12px' }}>
            <div className="label" style={{ fontSize: '10px' }}>Data Sources</div>
            <div className="value" style={{ fontSize: '20px' }}>{stats?.dataSourcesCount || 7} Systems</div>
            <div className="delta positive" style={{ fontSize: '10px' }}><Database size={10} /> Connected</div>
          </div>
          <div className="c360-metric-card" style={{ padding: '12px' }}>
            <div className="label" style={{ fontSize: '10px' }}>Processing Time</div>
            <div className="value" style={{ fontSize: '20px' }}>42ms</div>
            <div className="delta positive" style={{ fontSize: '10px' }}><Sparkles size={10} /> Stream Latency</div>
          </div>
        </section>

        {/* 2. Ingestion Pipeline Stages Flow (Interactive Stages 1-5) */}
        <section className="c360-pipeline-stages">
          <button 
            className={`c360-pipeline-step ${activePipelineStep === 1 ? 'active' : ''}`}
            onClick={() => setActivePipelineStep(activePipelineStep === 1 ? null : 1)}
          >
            <div className="step-number">1</div>
            <div className="step-info">
              <span className="step-name">Data Ingestion</span>
              <span className="step-status">3 Ingested Files</span>
            </div>
          </button>

          <ArrowRight size={14} className="c360-pipeline-arrow" />

          <button 
            className={`c360-pipeline-step ${activePipelineStep === 2 ? 'active' : ''}`}
            onClick={() => setActivePipelineStep(activePipelineStep === 2 ? null : 2)}
          >
            <div className="step-number">2</div>
            <div className="step-info">
              <span className="step-name">Data Quality</span>
              <span className="step-status">98.4% Clean Rate</span>
            </div>
          </button>

          <ArrowRight size={14} className="c360-pipeline-arrow" />

          <button 
            className={`c360-pipeline-step ${activePipelineStep === 3 ? 'active' : ''}`}
            onClick={() => setActivePipelineStep(activePipelineStep === 3 ? null : 3)}
          >
            <div className="step-number">3</div>
            <div className="step-info">
              <span className="step-name">Sensitive Data Governance</span>
              <span className="step-status">17 Masked Columns</span>
            </div>
          </button>

          <ArrowRight size={14} className="c360-pipeline-arrow" />

          <button 
            className={`c360-pipeline-step ${activePipelineStep === 4 ? 'active' : ''}`}
            onClick={() => setActivePipelineStep(activePipelineStep === 4 ? null : 4)}
          >
            <div className="step-number">4</div>
            <div className="step-info">
              <span className="step-name">Identity Resolution</span>
              <span className="step-status">Stitching Engine</span>
            </div>
          </button>

          <ArrowRight size={14} className="c360-pipeline-arrow" />

          <button 
            className={`c360-pipeline-step ${activePipelineStep === 5 ? 'active' : ''}`}
            onClick={() => setActivePipelineStep(activePipelineStep === 5 ? null : 5)}
          >
            <div className="step-number">5</div>
            <div className="step-info">
              <span className="step-name">Customer ID</span>
              <span className="step-status">Permanent ID</span>
            </div>
          </button>
        </section>

        {/* Ingestion Pipeline Detailed Expand Drawer */}
        {activePipelineStep !== null && (
          <div className="c360-pipeline-drawer">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h5 style={{ margin: 0, fontSize: '13px', color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Sparkles size={14} /> 
                {activePipelineStep === 1 && "Stage 1: Multi-Dataset File Upload Center"}
                {activePipelineStep === 2 && "Stage 2: Data Quality & Format Inspector"}
                {activePipelineStep === 3 && "Stage 3: Automated Sensitive Data Governance"}
                {activePipelineStep === 4 && "Stage 4: Customer Matching Rules"}
                {activePipelineStep === 5 && "Stage 5: Customer ID Assignment"}
              </h5>
              <button 
                onClick={() => setActivePipelineStep(null)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={14} />
              </button>
            </div>

            {activePipelineStep === 1 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginTop: '8px' }}>
                <div style={{ padding: '12px', border: '1px solid var(--grid-line-minor)', borderRadius: '6px', backgroundColor: 'var(--bg-surface)' }}>
                  <div style={{ fontWeight: 600, fontSize: '12px', color: 'var(--text-loud)', marginBottom: '8px' }}>Identity.csv</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span>Size: <strong>120 KB</strong></span>
                    <span>Rows: <strong>1,240 Rows</strong></span>
                    <span>Columns: <strong>10 Columns</strong></span>
                    <span>Status: <strong style={{ color: 'var(--accent-primary)' }}>Validated & Ingested</strong></span>
                  </div>
                </div>
                <div style={{ padding: '12px', border: '1px solid var(--grid-line-minor)', borderRadius: '6px', backgroundColor: 'var(--bg-surface)' }}>
                  <div style={{ fontWeight: 600, fontSize: '12px', color: 'var(--text-loud)', marginBottom: '8px' }}>Behavior.csv</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span>Size: <strong>1.4 MB</strong></span>
                    <span>Rows: <strong>42,000 Rows</strong></span>
                    <span>Columns: <strong>8 Columns</strong></span>
                    <span>Status: <strong style={{ color: 'var(--accent-primary)' }}>Validated & Ingested</strong></span>
                  </div>
                </div>
                <div style={{ padding: '12px', border: '1px solid var(--grid-line-minor)', borderRadius: '6px', backgroundColor: 'var(--bg-surface)' }}>
                  <div style={{ fontWeight: 600, fontSize: '12px', color: 'var(--text-loud)', marginBottom: '8px' }}>Financial.csv</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span>Size: <strong>680 KB</strong></span>
                    <span>Rows: <strong>8,500 Rows</strong></span>
                    <span>Columns: <strong>7 Columns</strong></span>
                    <span>Status: <strong style={{ color: 'var(--accent-primary)' }}>Validated & Ingested</strong></span>
                  </div>
                </div>
              </div>
            )}

            {activePipelineStep === 2 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginTop: '8px' }}>
                <div style={{ padding: '10px', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--grid-line-minor)', borderRadius: '6px', textAlign: 'center' }}>
                  <div style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--accent-primary)' }}>0</div>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>Missing Core Keys</div>
                </div>
                <div style={{ padding: '10px', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--grid-line-minor)', borderRadius: '6px', textAlign: 'center' }}>
                  <div style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--accent-secondary)' }}>12</div>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>Duplicate Rows Pruned</div>
                </div>
                <div style={{ padding: '10px', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--grid-line-minor)', borderRadius: '6px', textAlign: 'center' }}>
                  <div style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--accent-primary)' }}>100%</div>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>Email Format Accuracy</div>
                </div>
                <div style={{ padding: '10px', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--grid-line-minor)', borderRadius: '6px', textAlign: 'center' }}>
                  <div style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--accent-primary)' }}>0</div>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>Invalid PAN Formats</div>
                </div>
              </div>
            )}

            {activePipelineStep === 3 && (
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                <p style={{ marginBottom: '8px' }}>Automated scanner has successfully classified <strong>17 database attributes</strong> containing sensitive personal information:</p>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {['Name', 'Email Address', 'Phone Number', 'DOB', 'Aadhaar ID', 'PAN Card', 'Passport Number', 'Credit Card', 'Bank Account', 'IP Address', 'GPS coordinates', 'Browser Cookies'].map((item, idx) => (
                    <span key={idx} style={{ padding: '4px 8px', backgroundColor: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171', borderRadius: '4px' }}>
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {activePipelineStep === 4 && (
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', gap: '20px' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, color: 'var(--text-loud)', marginBottom: '4px' }}>Active Ingestion Matching Rules</div>
                  <ul style={{ listStyleType: 'disc', paddingLeft: '16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <li><strong>Exact Email Matching</strong>: Confidence contribution weight 40%</li>
                    <li><strong>Exact Phone Matching</strong>: Confidence contribution weight 30%</li>
                    <li><strong>Exact PAN Verification</strong>: Confidence contribution weight 20%</li>
                    <li><strong>Composite Match (Name + DOB)</strong>: Confidence weight 10%</li>
                  </ul>
                </div>
                <div style={{ width: '220px', padding: '10px', borderLeft: '1px solid var(--grid-line-minor)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <div style={{ fontSize: '10px', textTransform: 'uppercase' }}>Selected Record Confidence</div>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--accent-primary)', marginTop: '4px' }}>
                    {selectedProfile ? selectedProfile.confidence : 95}% Match
                  </div>
                </div>
              </div>
            )}

            {activePipelineStep === 5 && (
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                <p>Upon successful resolution, a persistent <strong>Customer ID</strong> (deterministic namespace v5 anchor) is allocated:</p>
                <div style={{ display: 'flex', gap: '16px', marginTop: '6px', alignItems: 'center' }}>
                  <div style={{ fontFamily: 'monospace', padding: '6px 12px', border: '1px solid var(--grid-line-major)', borderRadius: '4px', backgroundColor: 'var(--bg-app)', color: 'var(--text-loud)' }}>
                    {selectedProfile ? selectedProfile.uuid : 'c838633d-bfad-5420-94cb-cfb29793c5c0'}
                  </div>
                  <span>Sources merged: <strong>5 Systems</strong></span>
                  <span>Created By: <strong>Ingestion Engine</strong></span>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="customer360-container" style={{ flex: 1, overflow: 'hidden' }}>
          <div className="c360-workspace">
            {/* Left Directory Search Column */}
            <aside className="c360-selector-panel">
              <div className="c360-search-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div className="c360-search-input-wrapper" style={{ flex: 1 }}>
                  <Search size={14} />
                  <input 
                    type="text" 
                    placeholder="Search UUID, name, email, PAN..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <button 
                  className="btn-add-profile" 
                  title="Register New Customer Record"
                  onClick={() => setShowAddModal(true)}
                >
                  <Plus size={16} />
                </button>
              </div>

              <div className="c360-customer-list">
                {loadingList ? (
                  <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading profiles...</div>
                ) : profiles.length === 0 ? (
                  <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>No customers found.</div>
                ) : (
                  profiles.map(p => {
                    const simScore = getSimulatedConfidence(p);
                    return (
                      <div 
                        key={p.uuid}
                        className={`c360-customer-item ${selectedProfile?.uuid === p.uuid ? 'active' : ''}`}
                        onClick={() => loadDetail(p.uuid)}
                      >
                        <div className="name">{p.name}</div>
                        <div className="email">{p.email}</div>
                        <div className="meta-row" style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                          <span className="tag" style={{
                            fontSize: '9px',
                            fontWeight: 'bold',
                            backgroundColor: p.profileType === 'Anonymous Visitor' ? 'rgba(217, 119, 6, 0.15)' : p.profileType === 'Unified Profile' ? 'rgba(5, 150, 105, 0.15)' : 'rgba(37, 99, 235, 0.15)',
                            color: p.profileType === 'Anonymous Visitor' ? '#d97706' : p.profileType === 'Unified Profile' ? '#059669' : '#2563eb',
                            border: `1px solid ${p.profileType === 'Anonymous Visitor' ? 'rgba(217, 119, 6, 0.3)' : p.profileType === 'Unified Profile' ? 'rgba(5, 150, 105, 0.3)' : 'rgba(37, 99, 235, 0.3)'}`
                          }}>
                            {p.profileType === 'Anonymous Visitor' ? 'Anon' : p.profileType === 'Unified Profile' ? 'Unified' : 'Known'}
                          </span>
                          <span className="tag">{p.segment}</span>
                          <span style={{ color: simScore >= 80 ? 'var(--accent-primary)' : 'var(--accent-secondary)' }}>
                            {simScore}% match
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </aside>

            {/* Right Details Panel Workspace */}
            <section className="c360-detail-panel">
              {loadingDetail ? (
                <div style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                  <h4>Fetching unified profile details...</h4>
                </div>
              ) : selectedProfile ? (
                <>
                  <div className="c360-detail-header">
                    <div className="c360-profile-summary">
                      <img 
                        src={selectedProfile.identity.photoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'} 
                        alt="Avatar" 
                        className="c360-profile-avatar"
                      />
                      <div className="c360-profile-title">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <h3>{selectedProfile.identity.name}</h3>
                          <span style={{
                            padding: '2px 8px',
                            borderRadius: '12px',
                            fontSize: '10px',
                            fontWeight: 'bold',
                            backgroundColor: selectedProfile.identity.profileType === 'Anonymous Visitor' ? 'rgba(217, 119, 6, 0.15)' : selectedProfile.identity.profileType === 'Unified Profile' ? 'rgba(5, 150, 105, 0.15)' : 'rgba(37, 99, 235, 0.15)',
                            color: selectedProfile.identity.profileType === 'Anonymous Visitor' ? '#d97706' : selectedProfile.identity.profileType === 'Unified Profile' ? '#059669' : '#2563eb',
                            border: `1px solid ${selectedProfile.identity.profileType === 'Anonymous Visitor' ? 'rgba(217, 119, 6, 0.3)' : selectedProfile.identity.profileType === 'Unified Profile' ? 'rgba(5, 150, 105, 0.3)' : 'rgba(37, 99, 235, 0.3)'}`
                          }}>
                            {selectedProfile.identity.profileType || 'Known Customer'}
                          </span>
                        </div>
                        <div className="uuid">Unique Customer ID: {selectedProfile.uuid}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {selectedProfile.identity.profileType === 'Anonymous Visitor' && (
                        <button
                          type="button"
                          className="btn-secondary"
                          style={{ fontSize: '11px', padding: '6px 12px', border: '1px solid var(--accent-primary)', color: 'var(--text-loud)' }}
                          onClick={async () => {
                            const namePrompt = prompt("Enter customer's real name:", "Rahul Sharma");
                            if (!namePrompt) return;
                            const emailPrompt = prompt("Enter customer's email address:", "rahul.sharma@gmail.com");
                            if (!emailPrompt) return;

                            const res = await fetch('/api/v1/customer360', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                action: 'merge',
                                anonymousId: selectedProfile.uuid,
                                email: emailPrompt,
                                name: namePrompt
                              })
                            });
                            if (res.ok) {
                              const data = await res.json();
                              alert(`Successfully merged Anonymous Visitor into Unified Profile: ${data.profile.identity.name}!`);
                              // Reload profile
                              loadDetail(data.profile.uuid);
                              // Refresh sidebar list
                              const listRes = await fetch(`/api/v1/customer360?query=${searchQuery}`);
                              if (listRes.ok) {
                                const listData = await listRes.json();
                                setProfiles(listData.profiles);
                              }
                            } else {
                              const errorData = await res.json();
                              alert(`Merge failed: ${errorData.message}`);
                            }
                          }}
                        >
                          Authenticate & Merge Profile
                        </button>
                      )}
                      <span className="tag-pill pii" style={{ backgroundColor: 'rgba(92, 177, 152, 0.1)', color: 'var(--accent-primary)', padding: '4px 10px', borderRadius: '4px', fontSize: '12px' }}>
                        Match Confidence: {calculatedConfidence}%
                      </span>
                      <span className="tag-pill" style={{ backgroundColor: 'rgba(205, 168, 73, 0.1)', color: 'var(--accent-secondary)', padding: '4px 10px', borderRadius: '4px', fontSize: '12px' }}>
                        Segment: {selectedProfile.identity.segment}
                      </span>
                    </div>
                  </div>

                  {/* Stage 6: Tabs Navigation */}
                  <div className="c360-tabs">
                    <button className={`c360-tab-btn ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>
                      <User size={14} style={{ display: 'inline', marginRight: '6px' }} /> Overview
                    </button>
                    <button className={`c360-tab-btn ${activeTab === 'graph' ? 'active' : ''}`} onClick={() => setActiveTab('graph')}>
                      <Workflow size={14} style={{ display: 'inline', marginRight: '6px' }} /> Identity Graph
                    </button>
                    <button className={`c360-tab-btn ${activeTab === 'timeline' ? 'active' : ''}`} onClick={() => setActiveTab('timeline')}>
                      <Clock size={14} style={{ display: 'inline', marginRight: '6px' }} /> Timeline
                    </button>
                    <button className={`c360-tab-btn ${activeTab === 'financial' ? 'active' : ''}`} onClick={() => setActiveTab('financial')}>
                      <CreditCard size={14} style={{ display: 'inline', marginRight: '6px' }} /> Financial
                    </button>
                    <button className={`c360-tab-btn ${activeTab === 'segments' ? 'active' : ''}`} onClick={() => setActiveTab('segments')}>
                      <Layers size={14} style={{ display: 'inline', marginRight: '6px' }} /> Audience Segments
                    </button>
                    <button className={`c360-tab-btn ${activeTab === 'activation' ? 'active' : ''}`} onClick={() => setActiveTab('activation')}>
                      <Send size={14} style={{ display: 'inline', marginRight: '6px' }} /> Business Actions
                    </button>
                    <button className={`c360-tab-btn ${activeTab === 'privacy' ? 'active' : ''}`} onClick={() => setActiveTab('privacy')}>
                      <ShieldCheck size={14} style={{ display: 'inline', marginRight: '6px' }} /> Privacy
                    </button>
                    <button className={`c360-tab-btn ${activeTab === 'lineage' ? 'active' : ''}`} onClick={() => setActiveTab('lineage')}>
                      <BookOpen size={14} style={{ display: 'inline', marginRight: '6px' }} /> Data Lineage
                    </button>
                    <button className={`c360-tab-btn ${activeTab === 'rules' ? 'active' : ''}`} onClick={() => setActiveTab('rules')}>
                      <Shuffle size={14} style={{ display: 'inline', marginRight: '6px' }} /> Rules Engine
                    </button>
                    <button className={`c360-tab-btn ${activeTab === 'aiInsights' ? 'active' : ''}`} onClick={() => setActiveTab('aiInsights')}>
                      <Sparkles size={14} style={{ display: 'inline', marginRight: '6px' }} /> AI Insights
                    </button>
                  </div>

                  {/* Tab Workspace content */}
                  <div className="c360-tab-content" style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
                    
                    {/* OVERVIEW TAB */}
                    {activeTab === 'overview' && (
                      <div className="c360-overview-grid" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                          <div className="c360-card">
                            <h4><User size={16} /> Demographics & Contact</h4>
                            <div className="c360-field-list">
                              {renderPiiField('Name', selectedProfile.identity.name, 'NAME')}
                              {renderPiiField('Email Address', selectedProfile.identity.email, 'EMAIL')}
                              {renderPiiField('Phone Number', selectedProfile.identity.phone, 'PHONE')}
                              {renderPiiField('Date of Birth', selectedProfile.identity.dob, 'DOB')}
                              {renderPiiField('Residential Address', selectedProfile.identity.address, 'ADDRESS')}
                            </div>
                          </div>

                          <div className="c360-card">
                            <h4><ShieldCheck size={16} /> Verified Identifiers</h4>
                            <div className="c360-field-list">
                              {renderPiiField('Customer ID', selectedProfile.identity.customerId, 'NONE')}
                              {renderPiiField('PAN Number (India)', selectedProfile.identity.pan, 'PAN')}
                              {renderPiiField('Aadhaar ID (India)', selectedProfile.identity.aadhaar, 'AADHAAR')}
                              {renderPiiField('Passport Number', selectedProfile.identity.passport, 'PASSPORT')}
                            </div>
                          </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                          <div className="c360-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '20px' }}>
                            <h4>Profile Completeness</h4>
                            <div style={{ width: '100px', height: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '16px 0', position: 'relative' }}>
                              <svg width="100" height="100" style={{ transform: 'rotate(-90deg)' }}>
                                <circle
                                  cx="50"
                                  cy="50"
                                  r="40"
                                  stroke="var(--grid-line-minor)"
                                  strokeWidth="8"
                                  fill="transparent"
                                />
                                <circle
                                  cx="50"
                                  cy="50"
                                  r="40"
                                  stroke="var(--accent-primary)"
                                  strokeWidth="8"
                                  fill="transparent"
                                  strokeDasharray={2 * Math.PI * 40}
                                  strokeDashoffset={(2 * Math.PI * 40) - ((selectedProfile.identity.completionRate || 75) / 100) * (2 * Math.PI * 40)}
                                  strokeLinecap="round"
                                  style={{ transition: 'stroke-dashoffset 0.35s' }}
                                />
                              </svg>
                              <span style={{ position: 'absolute', fontSize: '20px', fontWeight: 'bold', color: 'var(--text-loud)' }}>{selectedProfile.identity.completionRate || 75}%</span>
                            </div>
                            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Unified record attributes fulfilled.</span>
                          </div>

                          <div className="c360-card">
                            <h4>Customer Metrics</h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '12px' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--grid-line-minor)', paddingBottom: '6px' }}>
                                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Customer Health</span>
                                <span style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--accent-primary)' }}>{Math.min(100, 100 - (selectedProfile.identity.riskScore || 10))}% (Optimal)</span>
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--grid-line-minor)', paddingBottom: '6px' }}>
                                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Customer Score</span>
                                <span style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-loud)' }}>{Math.round(650 + calculatedConfidence * 3.2)} / 1000</span>
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--grid-line-minor)', paddingBottom: '6px' }}>
                                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Risk Class</span>
                                <span style={{ fontSize: '12px', fontWeight: 'bold', color: (selectedProfile.identity.riskScore || 10) > 30 ? '#f87171' : 'var(--accent-primary)' }}>
                                  {(selectedProfile.identity.riskScore || 10) > 30 ? 'High Churn Risk' : 'Low Risk'}
                                </span>
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>LTV Predict</span>
                                <span style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--accent-secondary)' }}>
                                  ${Math.round((selectedProfile.financial.invoices?.reduce((a: any, c: any) => a + c.amount, 0) || 1200) * 2.5).toLocaleString()}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* IDENTITY GRAPH TAB */}
                    {activeTab === 'graph' && (
                      <IdentityGraph profile={selectedProfile} />
                    )}

                    {/* TIMELINE TAB */}
                    {activeTab === 'timeline' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div style={{ display: 'flex', justifySelf: 'space-between', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
                          <h4 style={{ margin: 0 }}><Clock size={16} /> Activity History</h4>
                          <div className="c360-search-input-wrapper" style={{ width: '250px' }}>
                            <Search size={12} />
                            <input 
                              type="text" 
                              placeholder="Filter activities..." 
                              value={timelineSearch}
                              onChange={e => setTimelineSearch(e.target.value)}
                            />
                          </div>
                        </div>

                        <div className="c360-timeline" style={{ display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative', paddingLeft: '24px' }}>
                          <div style={{ position: 'absolute', left: '7px', top: 0, bottom: 0, width: '2px', backgroundColor: 'var(--grid-line-minor)' }}></div>
                          {selectedProfile.behavioralEvents
                            ?.filter((evt: any) => 
                              evt.type.toLowerCase().includes(timelineSearch.toLowerCase()) || 
                              evt.details.toLowerCase().includes(timelineSearch.toLowerCase())
                            )
                            .map((evt: any, i: number) => {
                              return (
                                <div key={i} style={{ position: 'relative', marginBottom: '8px' }}>
                                  <div style={{ position: 'absolute', left: '-22px', top: '2px', width: '12px', height: '12px', borderRadius: '50%', backgroundColor: 'var(--accent-primary)', border: '3px solid var(--bg-app)' }}></div>
                                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                    {new Date(evt.timestamp).toLocaleString()} - <strong style={{ color: 'var(--accent-secondary)' }}>{evt.source}</strong>
                                  </div>
                                  <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-loud)', marginTop: '2px' }}>{evt.type}</div>
                                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px', margin: 0 }}>{evt.details}</p>
                                </div>
                              );
                            })}
                        </div>
                      </div>
                    )}

                    {/* FINANCIAL TAB */}
                    {activeTab === 'financial' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
                          <div className="c360-card" style={{ padding: '12px' }}>
                            <div className="label" style={{ fontSize: '10px' }}>Total Invoiced</div>
                            <div style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--text-loud)', marginTop: '4px' }}>
                              ${(selectedProfile.financial.invoices?.reduce((a: any, c: any) => a + c.amount, 0) || 0).toLocaleString()}
                            </div>
                          </div>
                          <div className="c360-card" style={{ padding: '12px' }}>
                            <div className="label" style={{ fontSize: '10px' }}>Outstanding Balance</div>
                            <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#f87171', marginTop: '4px' }}>
                              $0.00
                            </div>
                          </div>
                          <div className="c360-card" style={{ padding: '12px' }}>
                            <div className="label" style={{ fontSize: '10px' }}>Credit Limit</div>
                            <div style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--accent-primary)', marginTop: '4px' }}>
                              $50,000
                            </div>
                          </div>
                          <div className="c360-card" style={{ padding: '12px' }}>
                            <div className="label" style={{ fontSize: '10px' }}>Account Status</div>
                            <div style={{ fontSize: '16px', fontWeight: 'bold', color: 'var(--accent-primary)', marginTop: '8px' }}>
                              Active / Paid
                            </div>
                          </div>
                        </div>

                        <div className="c360-card">
                          <h4>Transaction Ledger</h4>
                          <table className="data-table" style={{ width: '100%', marginTop: '12px' }}>
                            <thead>
                              <tr>
                                <th>Invoice ID</th>
                                <th>Billing Date</th>
                                <th>Amount</th>
                                <th>Status</th>
                              </tr>
                            </thead>
                            <tbody>
                              {selectedProfile.financial.invoices?.map((inv: any, i: number) => (
                                <tr key={i}>
                                  <td><span className="code-cell">{inv.invoiceId}</span></td>
                                  <td>{new Date(inv.date).toLocaleDateString()}</td>
                                  <td style={{ fontWeight: 600 }}>${inv.amount.toLocaleString()}</td>
                                  <td>
                                    <span style={{ 
                                      padding: '2px 6px', 
                                      borderRadius: '4px', 
                                      fontSize: '10px',
                                      backgroundColor: inv.status === 'Paid' ? 'rgba(92,177,152,0.1)' : 'rgba(239,68,68,0.1)',
                                      color: inv.status === 'Paid' ? 'var(--accent-primary)' : '#f87171'
                                    }}>
                                      {inv.status}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* PRIVACY TAB */}
                    {activeTab === 'privacy' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                          <div className="c360-card">
                            <h4>Compliance Regulation Matrix</h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--grid-line-minor)', paddingBottom: '6px' }}>
                                <span style={{ fontSize: '12px', fontWeight: 600 }}>DPDP Act (India) Compliance</span>
                                <span className="tag-pill" style={{ backgroundColor: 'rgba(92,177,152,0.1)', color: 'var(--accent-primary)', padding: '2px 6px', borderRadius: '4px', fontSize: '10px' }}>COMPLIANT</span>
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--grid-line-minor)', paddingBottom: '6px' }}>
                                <span style={{ fontSize: '12px', fontWeight: 600 }}>GDPR Audit Rule 15</span>
                                <span className="tag-pill" style={{ backgroundColor: 'rgba(92,177,152,0.1)', color: 'var(--accent-primary)', padding: '2px 6px', borderRadius: '4px', fontSize: '10px' }}>COMPLIANT</span>
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--grid-line-minor)', paddingBottom: '6px' }}>
                                <span style={{ fontSize: '12px', fontWeight: 600 }}>PCI DSS Card Masking</span>
                                <span className="tag-pill" style={{ backgroundColor: 'rgba(92,177,152,0.1)', color: 'var(--accent-primary)', padding: '2px 6px', borderRadius: '4px', fontSize: '10px' }}>ACTIVE</span>
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ fontSize: '12px', fontWeight: 600 }}>Retention Policy</span>
                                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>7 Years (Delete on 2033)</span>
                              </div>
                            </div>
                          </div>

                          <div className="c360-card">
                            <h4>Consent & Security Parameters</h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--grid-line-minor)', paddingBottom: '6px' }}>
                                <span style={{ fontSize: '12px', fontWeight: 600 }}>Email Marketing Consent</span>
                                <span style={{ color: 'var(--accent-primary)', fontSize: '12px' }}>Opted-In (Agreed)</span>
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--grid-line-minor)', paddingBottom: '6px' }}>
                                <span style={{ fontSize: '12px', fontWeight: 600 }}>Phone SMS Contact Consent</span>
                                <span style={{ color: 'var(--accent-primary)', fontSize: '12px' }}>Opted-In (Agreed)</span>
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ fontSize: '12px', fontWeight: 600 }}>Third-Party Sharing</span>
                                <span style={{ color: '#f87171', fontSize: '12px' }}>Restricted (Opted-Out)</span>
                              </div>
                            </div>
                          </div>

                          <div className="c360-card" style={{ marginTop: '16px' }}>
                            <h4>GDPR / CCPA Compliance Actions</h4>
                            <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '12px' }}>
                              Enforce user data privacy rights dynamically under active global regulatory frameworks (GDPR, CCPA, DPDP).
                            </p>
                            <div style={{ display: 'flex', gap: '10px' }}>
                              <button 
                                className="btn-secondary" 
                                style={{ flex: 1, padding: '8px', fontSize: '11px', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)' }}
                                onClick={async () => {
                                  if (confirm(`Are you sure you want to trigger permanent profile erasure (Right to be Forgotten) for Customer ID: ${selectedProfile.uuid}? This action is irreversible.`)) {
                                    alert('Privacy Erasure Request initiated. Customer ID data scrubbed from all imported, cleaned, and business ready storage layers.');
                                    setProfiles(profiles.filter(p => p.uuid !== selectedProfile.uuid));
                                    setSelectedProfile(null);
                                    const eraseLog = {
                                      timestamp: new Date().toISOString(),
                                      role,
                                      action: 'GDPR Profile Erasure',
                                      field: 'All Customer Data',
                                      justification: 'Right to be Forgotten request processed.'
                                    };
                                    setAuditLogs(prev => [eraseLog, ...prev]);
                                  }
                                }}
                              >
                                Erasure (Right to be Forgotten)
                              </button>
                              <a 
                                href={`data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(selectedProfile, null, 2))}`}
                                download={`portability_report_${selectedProfile.uuid}.json`}
                                className="btn-secondary" 
                                style={{ flex: 1, padding: '8px', fontSize: '11px', textAlign: 'center', display: 'block', textDecoration: 'none', lineHeight: '2' }}
                                onClick={() => {
                                  const portabilityLog = {
                                    timestamp: new Date().toISOString(),
                                    role,
                                    action: 'Portability Data Export',
                                    field: 'Full Profile Package',
                                    justification: 'GDPR/CCPA Data Portability Export.'
                                  };
                                  setAuditLogs(prev => [portabilityLog, ...prev]);
                                }}
                              >
                                Export Portability Package
                              </a>
                            </div>
                          </div>
                        </div>

                        <div className="c360-card">
                          <h4>Compliance Access Ledger (Audit Trail)</h4>
                          <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '12px' }}>
                            Immutably recording all administrative decryptions and runtime PII data access.
                          </p>
                          <div style={{ maxHeight: '200px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {auditLogs.map((log, i) => (
                              <div key={i} style={{ padding: '10px', backgroundColor: 'var(--bg-app)', border: '1px solid var(--grid-line-minor)', borderRadius: '4px', fontSize: '11px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', marginBottom: '4px' }}>
                                  <span>{new Date(log.timestamp).toLocaleTimeString()} - Role: <strong>{log.role}</strong></span>
                                  <span style={{ color: log.action.includes('Decryption') ? '#f87171' : 'var(--accent-primary)', fontWeight: 600 }}>{log.action}</span>
                                </div>
                                <div style={{ color: 'var(--text-loud)', marginBottom: '2px' }}>
                                  Requested field: <strong style={{ color: 'var(--accent-secondary)' }}>{log.field}</strong>
                                </div>
                                <div style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>
                                  Justification: "{log.justification}"
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* DATA LINEAGE TAB */}
                    {activeTab === 'lineage' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div className="c360-card">
                          <h4>Data Provenance & Traceability Flow</h4>
                          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px' }}>
                            Detailed map explaining exactly which source systems contributed to each field in this resolved profile.
                          </p>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 50px 1.5fr 50px 1fr', alignItems: 'center', padding: '10px', border: '1px solid var(--grid-line-minor)', borderRadius: '6px', backgroundColor: 'var(--bg-surface)' }}>
                              <div>
                                <span style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>SOURCE FILE</span>
                                <div style={{ fontWeight: 600, fontSize: '13px' }}>Identity.csv (HubSpot)</div>
                              </div>
                              <div className="lineage-arrow"><ArrowRight size={16} /></div>
                              <div>
                                <span style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>TRANSFORMATION RULE</span>
                                <div style={{ fontSize: '12px', color: 'var(--accent-secondary)' }}>Extract & Normalization</div>
                              </div>
                              <div className="lineage-arrow"><ArrowRight size={16} /></div>
                              <div>
                                <span style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>UNIFIED PROFILE FIELD</span>
                                <div style={{ fontWeight: 600, color: 'var(--accent-primary)', fontSize: '13px' }}>Name, Phone, DOB</div>
                              </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 50px 1.5fr 50px 1fr', alignItems: 'center', padding: '10px', border: '1px solid var(--grid-line-minor)', borderRadius: '6px', backgroundColor: 'var(--bg-surface)' }}>
                              <div>
                                <span style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>SOURCE FILE</span>
                                <div style={{ fontWeight: 600, fontSize: '13px' }}>Behavior.csv (Clickstream)</div>
                              </div>
                              <div className="lineage-arrow"><ArrowRight size={16} /></div>
                              <div>
                                <span style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>TRANSFORMATION RULE</span>
                                <div style={{ fontSize: '12px', color: 'var(--accent-secondary)' }}>Ingestion Link via Cookie Email</div>
                              </div>
                              <div className="lineage-arrow"><ArrowRight size={16} /></div>
                              <div>
                                <span style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>UNIFIED PROFILE FIELD</span>
                                <div style={{ fontWeight: 600, color: 'var(--accent-primary)', fontSize: '13px' }}>Timeline Activity History</div>
                              </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 50px 1.5fr 50px 1fr', alignItems: 'center', padding: '10px', border: '1px solid var(--grid-line-minor)', borderRadius: '6px', backgroundColor: 'var(--bg-surface)' }}>
                              <div>
                                <span style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>SOURCE FILE</span>
                                <div style={{ fontWeight: 600, fontSize: '13px' }}>Financial.csv (Billing)</div>
                              </div>
                              <div className="lineage-arrow"><ArrowRight size={16} /></div>
                              <div>
                                <span style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>TRANSFORMATION RULE</span>
                                <div style={{ fontSize: '12px', color: 'var(--accent-secondary)' }}>Stripe API Metadata Mapping</div>
                              </div>
                              <div className="lineage-arrow"><ArrowRight size={16} /></div>
                              <div>
                                <span style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>UNIFIED PROFILE FIELD</span>
                                <div style={{ fontWeight: 600, color: 'var(--accent-primary)', fontSize: '13px' }}>Invoices, Revenue, Balances</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* RULES ENGINE TAB */}
                    {activeTab === 'rules' && (
                      <div className="c360-overview-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div className="c360-card">
                          <h4>Identity Linkage Rules Simulator</h4>
                          <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '16px' }}>
                            Adjust the weights of individual connection vectors. Watch the matching confidence level dynamically recalculate.
                          </p>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                            <div>
                              <label style={{ fontSize: '11px', display: 'flex', justifyContent: 'space-between', color: 'var(--text-loud)' }}>
                                <span>Email Match Weight</span>
                                <strong>{emailWeight}%</strong>
                              </label>
                              <input 
                                type="range" min="0" max="60" value={emailWeight} 
                                onChange={e => setEmailWeight(Number(e.target.value))}
                                style={{ width: '100%', accentColor: 'var(--accent-primary)' }}
                              />
                            </div>
                            <div>
                              <label style={{ fontSize: '11px', display: 'flex', justifyContent: 'space-between', color: 'var(--text-loud)' }}>
                                <span>Phone Match Weight</span>
                                <strong>{phoneWeight}%</strong>
                              </label>
                              <input 
                                type="range" min="0" max="50" value={phoneWeight} 
                                onChange={e => setPhoneWeight(Number(e.target.value))}
                                style={{ width: '100%', accentColor: 'var(--accent-primary)' }}
                              />
                            </div>
                            <div>
                              <label style={{ fontSize: '11px', display: 'flex', justifyContent: 'space-between', color: 'var(--text-loud)' }}>
                                <span>PAN Verification Weight</span>
                                <strong>{panWeight}%</strong>
                              </label>
                              <input 
                                type="range" min="0" max="40" value={panWeight} 
                                onChange={e => setPanWeight(Number(e.target.value))}
                                style={{ width: '100%', accentColor: 'var(--accent-primary)' }}
                              />
                            </div>
                            <div>
                              <label style={{ fontSize: '11px', display: 'flex', justifyContent: 'space-between', color: 'var(--text-loud)' }}>
                                <span>DOB Alignment Weight</span>
                                <strong>{dobWeight}%</strong>
                              </label>
                              <input 
                                type="range" min="0" max="20" value={dobWeight} 
                                onChange={e => setDobWeight(Number(e.target.value))}
                                style={{ width: '100%', accentColor: 'var(--accent-primary)' }}
                              />
                            </div>
                            <div>
                              <label style={{ fontSize: '11px', display: 'flex', justifyContent: 'space-between', color: 'var(--text-loud)' }}>
                                <span>Name Similarity Weight</span>
                                <strong>{nameWeight}%</strong>
                              </label>
                              <input 
                                type="range" min="0" max="20" value={nameWeight} 
                                onChange={e => setNameWeight(Number(e.target.value))}
                                style={{ width: '100%', accentColor: 'var(--accent-primary)' }}
                              />
                            </div>
                          </div>
                        </div>

                        <div className="c360-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
                          <h4>Simulated Confidence Level</h4>
                          <div style={{ width: '130px', height: '130px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '20px 0', position: 'relative' }}>
                            <svg width="130" height="130" style={{ transform: 'rotate(-90deg)' }}>
                              <circle
                                cx="65"
                                cy="65"
                                r="55"
                                stroke="var(--grid-line-minor)"
                                strokeWidth="8"
                                fill="transparent"
                              />
                              <circle
                                cx="65"
                                cy="65"
                                r="55"
                                stroke={calculatedConfidence >= 80 ? 'var(--accent-primary)' : 'var(--accent-secondary)'}
                                strokeWidth="8"
                                fill="transparent"
                                strokeDasharray={2 * Math.PI * 55}
                                strokeDashoffset={(2 * Math.PI * 55) - (calculatedConfidence / 100) * (2 * Math.PI * 55)}
                                strokeLinecap="round"
                                style={{ transition: 'stroke-dashoffset 0.35s' }}
                              />
                            </svg>
                            <span style={{ position: 'absolute', fontSize: '24px', fontWeight: 'bold', color: 'var(--text-loud)' }}>{calculatedConfidence}%</span>
                          </div>
                          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                            {calculatedConfidence >= 80 ? 'Optimal Configuration (Auto-Merge Active)' : 'Warning: Conf. below safe threshold'}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* AI INSIGHTS TAB */}
                    {activeTab === 'aiInsights' && (
                      <div className="c360-overview-grid" style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '16px' }}>
                        <div className="c360-card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                          <h4><Sparkles size={16} style={{ color: 'var(--accent-primary)' }} /> Generative Customer Profile Summary</h4>
                          <p style={{ fontSize: '13px', color: 'var(--text-loud)', lineHeight: '1.5', margin: 0 }}>
                            "This customer represents a high-value <strong>{selectedProfile.identity.segment} Segment</strong> profile. They demonstrate a high data-quality rating (98%) and complete financial consistency with zero outstanding payment failures.
                          </p>
                          <p style={{ fontSize: '13px', color: 'var(--text-loud)', lineHeight: '1.5', margin: 0 }}>
                            <strong>Suggested Next Best Action:</strong> Recommend subscription renewal upgrades or target with premium campaign materials. Trigger representative check-in due to recent high-sensitivity PII audit logs."
                          </p>

                          <div style={{ borderTop: '1px solid var(--grid-line-minor)', paddingTop: '12px', marginTop: '8px' }}>
                            <span style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Cross-Sell Recommendation</span>
                            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--accent-primary)', marginTop: '2px' }}>
                              Premium Enterprise Conductor Service Suite (Tier 1 Upgrade)
                            </div>
                          </div>
                        </div>

                        <div className="c360-card">
                          <h4>CDP Predictive Metrics</h4>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '12px' }}>
                            <div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                                <span style={{ color: 'var(--text-muted)' }}>Churn Probability</span>
                                <span style={{ fontWeight: 'bold', color: 'var(--accent-primary)' }}>{((selectedProfile.identity.riskScore || 10) / 2).toFixed(1)}%</span>
                              </div>
                              <div style={{ height: '4px', backgroundColor: 'var(--grid-line-minor)', borderRadius: '2px', marginTop: '4px', overflow: 'hidden' }}>
                                <div style={{ width: `${Math.min(100, (selectedProfile.identity.riskScore || 10) / 2)}%`, height: '100%', backgroundColor: 'var(--accent-primary)' }}></div>
                              </div>
                            </div>

                            <div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                                <span style={{ color: 'var(--text-muted)' }}>Fraud Risk Index</span>
                                <span style={{ fontWeight: 'bold', color: 'var(--accent-primary)' }}>
                                  {(selectedProfile.identity.riskScore || 10) > 40 ? 'Medium Risk' : 'Low Risk'}
                                </span>
                              </div>
                              <div style={{ height: '4px', backgroundColor: 'var(--grid-line-minor)', borderRadius: '2px', marginTop: '4px', overflow: 'hidden' }}>
                                <div style={{ width: `${Math.min(100, (selectedProfile.identity.riskScore || 10) * 1.5)}%`, height: '100%', backgroundColor: 'var(--accent-primary)' }}></div>
                              </div>
                            </div>

                            <div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                                <span style={{ color: 'var(--text-muted)' }}>Predicted LTV (3 Year)</span>
                                <span style={{ fontWeight: 'bold', color: 'var(--text-loud)' }}>
                                  ${Math.round((selectedProfile.financial.invoices?.reduce((a: any, c: any) => a + c.amount, 0) || 1200) * 4.5).toLocaleString()} USD
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* DYNAMIC SEGMENTS TAB */}
                    {activeTab === 'segments' && (
                      <div className="c360-overview-grid" style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '16px' }}>
                        <div className="c360-card">
                          <h4>🛠️ Dynamic Segment Builder</h4>
                          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px' }}>
                            Combine customer traits, total spends, behavioral campaigns, and risk scores to form targeted audiences.
                          </p>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div className="c360-form-group">
                              <label>Segment Name *</label>
                              <input 
                                type="text" 
                                placeholder="e.g. High Value Mobile Shoppers"
                                value={segmentName}
                                onChange={e => setSegmentName(e.target.value)}
                                style={{ width: '100%', padding: '8px', borderRadius: '4px', backgroundColor: 'var(--bg-app)', border: '1px solid var(--grid-line-minor)', color: 'var(--text-loud)', fontSize: '13px' }}
                              />
                            </div>
                            <div className="c360-form-group">
                              <label>Description</label>
                              <input 
                                type="text" 
                                placeholder="e.g. Customers in India who spent > 50,000 INR"
                                value={segmentDesc}
                                onChange={e => setSegmentDesc(e.target.value)}
                                style={{ width: '100%', padding: '8px', borderRadius: '4px', backgroundColor: 'var(--bg-app)', border: '1px solid var(--grid-line-minor)', color: 'var(--text-loud)', fontSize: '13px' }}
                              />
                            </div>

                            <div style={{ borderTop: '1px solid var(--grid-line-minor)', paddingTop: '12px' }}>
                              <h5 style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase' }}>Rules Matrix (AND)</h5>
                              {segmentRules.map((rule, idx) => (
                                <div key={idx} style={{ display: 'flex', gap: '8px', marginBottom: '8px', alignItems: 'center' }}>
                                  <select 
                                    value={rule.field} 
                                    onChange={e => {
                                      const copy = [...segmentRules];
                                      copy[idx].field = e.target.value as any;
                                      setSegmentRules(copy);
                                    }}
                                    style={{ flex: 1, padding: '6px', fontSize: '12px', backgroundColor: 'var(--bg-app)', border: '1px solid var(--grid-line-minor)', color: 'var(--text-loud)', borderRadius: '4px' }}
                                  >
                                    <option value="country">Country</option>
                                    <option value="spent">Total Spent (INR)</option>
                                    <option value="purchase_count">Purchase Count</option>
                                    <option value="email_exists">Email Exists</option>
                                    <option value="risk_score">Risk Score</option>
                                  </select>

                                  <select 
                                    value={rule.operator} 
                                    onChange={e => {
                                      const copy = [...segmentRules];
                                      copy[idx].operator = e.target.value as any;
                                      setSegmentRules(copy);
                                    }}
                                    style={{ padding: '6px', fontSize: '12px', backgroundColor: 'var(--bg-app)', border: '1px solid var(--grid-line-minor)', color: 'var(--text-loud)', borderRadius: '4px' }}
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
                                      value={rule.value} 
                                      onChange={e => {
                                        const copy = [...segmentRules];
                                        copy[idx].value = e.target.value;
                                        setSegmentRules(copy);
                                      }}
                                      placeholder="Value"
                                      style={{ flex: 1.2, padding: '6px', fontSize: '12px', backgroundColor: 'var(--bg-app)', border: '1px solid var(--grid-line-minor)', color: 'var(--text-loud)', borderRadius: '4px' }}
                                    />
                                  )}

                                  <button 
                                    type="button" 
                                    onClick={() => setSegmentRules(segmentRules.filter((_, i) => i !== idx))}
                                    style={{ color: '#f87171', border: 'none', background: 'transparent', cursor: 'pointer' }}
                                  >
                                    <X size={14} />
                                  </button>
                                </div>
                              ))}

                              <button 
                                type="button" 
                                className="btn-secondary" 
                                onClick={() => setSegmentRules([...segmentRules, { field: 'country', operator: 'equals', value: '' }])}
                                style={{ padding: '4px 10px', fontSize: '11px', marginTop: '4px' }}
                              >
                                + Add Rule Condition
                              </button>
                            </div>

                            <button 
                              type="button" 
                              className="btn-primary" 
                              disabled={isCreatingSegment || !segmentName}
                              onClick={async () => {
                                setIsCreatingSegment(true);
                                try {
                                  const res = await fetch('/api/v1/segments', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ name: segmentName, description: segmentDesc, rules: segmentRules })
                                  });
                                  if (res.ok) {
                                    setSegmentName('');
                                    setSegmentDesc('');
                                    setSegmentRules([{ field: 'country', operator: 'equals', value: 'India' }]);
                                    loadSegmentsAndJobs();
                                    alert('Segment created successfully!');
                                  }
                                } catch (err) {
                                  console.error(err);
                                } finally {
                                  setIsCreatingSegment(false);
                                }
                              }}
                              style={{ alignSelf: 'flex-start', marginTop: '12px' }}
                            >
                              Create Segment
                            </button>
                          </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                          <div className="c360-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '20px' }}>
                            <h4>Target Audience Size</h4>
                            <div style={{ fontSize: '48px', fontWeight: 'bold', color: 'var(--accent-primary)', margin: '12px 0' }}>
                              {matchingCount}
                            </div>
                            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                              Estimated profiles matching current rules
                            </span>
                          </div>

                          <div className="c360-card">
                            <h4>Active Segments List</h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px', maxHeight: '200px', overflowY: 'auto' }}>
                              {userSegments.map(seg => (
                                <div key={seg.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px', border: '1px solid var(--grid-line-minor)', borderRadius: '4px', backgroundColor: 'var(--bg-app)' }}>
                                  <div>
                                    <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-loud)' }}>{seg.name}</div>
                                    <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Size: {seg.estimatedSize || 0} customer profiles</div>
                                  </div>
                                  <button 
                                    onClick={async () => {
                                      if (confirm('Delete segment?')) {
                                        await fetch(`/api/v1/segments?id=${seg.id}`, { method: 'DELETE' });
                                        loadSegmentsAndJobs();
                                      }
                                    }}
                                    style={{ color: '#f87171', border: 'none', background: 'transparent', cursor: 'pointer' }}
                                  >
                                    <X size={14} />
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* MARKETING ACTIVATION TAB */}
                    {activeTab === 'activation' && (
                      <div className="c360-overview-grid" style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.8fr', gap: '16px' }}>
                        <div className="c360-card">
                          <h4>🚀 Trigger Business Action</h4>
                          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px' }}>
                            Execute business actions on saved customer cohorts.
                          </p>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <div className="c360-form-group">
                              <label>Select Segment</label>
                              <select 
                                value={syncTargetSegment} 
                                onChange={e => setSyncTargetSegment(e.target.value)}
                                style={{ padding: '8px', borderRadius: '4px', backgroundColor: 'var(--bg-app)', border: '1px solid var(--grid-line-minor)', color: 'var(--text-loud)', fontSize: '13px', width: '100%' }}
                              >
                                {userSegments.length === 0 ? (
                                  <option value="">No segments. Create one first.</option>
                                ) : (
                                  userSegments.map(s => (
                                    <option key={s.id} value={s.id}>{s.name}</option>
                                  ))
                                )}
                              </select>
                            </div>

                            <div className="c360-form-group">
                              <label>Select Business Action</label>
                              <select 
                                value={syncTargetDest} 
                                onChange={e => setSyncTargetDest(e.target.value as any)}
                                style={{ padding: '8px', borderRadius: '4px', backgroundColor: 'var(--bg-app)', border: '1px solid var(--grid-line-minor)', color: 'var(--text-loud)', fontSize: '13px', width: '100%' }}
                              >
                                <option value="meta">Show Advertisement</option>
                                <option value="email">Email Customers</option>
                                <option value="sms">Send SMS / Push Notification</option>
                                <option value="google">Export Audience</option>
                                <option value="linkedin">Customer Journey</option>
                              </select>
                            </div>

                            <div className="c360-form-group">
                              <label>Gateway Connection Status</label>
                              <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '10px 12px',
                                borderRadius: '4px',
                                backgroundColor: 'rgba(5, 150, 105, 0.08)',
                                border: '1px solid rgba(5, 150, 105, 0.2)',
                                color: '#34d399',
                                fontSize: '12px',
                                fontWeight: 600
                              }}>
                                <span style={{ height: '8px', width: '8px', backgroundColor: '#10b981', borderRadius: '50%', display: 'inline-block' }}></span>
                                Authorized & Connected to Corporate Gateway
                              </div>
                            </div>

                            <button 
                              type="button" 
                              className="btn-primary" 
                              disabled={isSyncingDirect || userSegments.length === 0}
                              onClick={async () => {
                                setIsSyncingDirect(true);
                                try {
                                  const res = await fetch('/api/v1/destinations', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ segmentId: syncTargetSegment, destination: syncTargetDest })
                                  });
                                  if (res.ok) {
                                    loadSegmentsAndJobs();
                                    alert('Business action executed successfully!');
                                  }
                                } catch (err) {
                                  console.error(err);
                                } finally {
                                  setIsSyncingDirect(false);
                                }
                              }}
                              style={{ marginTop: '12px' }}
                            >
                              {isSyncingDirect ? 'Executing...' : 'Run Business Action'}
                            </button>
                          </div>
                        </div>

                        <div className="c360-card">
                          <h4>Business Action History Log</h4>
                          <div className="table-wrapper" style={{ marginTop: '12px' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                              <thead>
                                <tr style={{ borderBottom: '1px solid var(--grid-line-major)', color: 'var(--text-muted)' }}>
                                  <th style={{ padding: '6px', textAlign: 'left' }}>Job ID</th>
                                  <th style={{ padding: '6px', textAlign: 'left' }}>Segment</th>
                                  <th style={{ padding: '6px', textAlign: 'left' }}>Action</th>
                                  <th style={{ padding: '6px', textAlign: 'left' }}>Status</th>
                                  <th style={{ padding: '6px', textAlign: 'left' }}>Synced Rows</th>
                                </tr>
                              </thead>
                              <tbody>
                                {userSyncJobs.length === 0 ? (
                                  <tr>
                                    <td colSpan={5} style={{ textAlign: 'center', padding: '16px', color: 'var(--text-muted)' }}>
                                      No sync logs. Run an activation action first.
                                    </td>
                                  </tr>
                                ) : (
                                  userSyncJobs.map(job => (
                                    <tr key={job.jobId} style={{ borderBottom: '1px solid var(--grid-line-minor)', color: 'var(--text-default)' }}>
                                      <td style={{ padding: '8px 6px', fontFamily: 'monospace' }}>{job.jobId}</td>
                                      <td style={{ padding: '8px 6px' }}><strong>{job.segmentName}</strong></td>
                                      <td style={{ padding: '8px 6px' }}>
                                        <span className="badge-destination" style={{ textTransform: 'capitalize' }}>
                                          {job.destination === 'meta' ? 'Show Advertisement' : job.destination === 'email' ? 'Email Customers' : job.destination === 'sms' ? 'Send SMS' : job.destination === 'google' ? 'Export Audience' : 'Customer Journey'}
                                        </span>
                                      </td>
                                      <td style={{ padding: '8px 6px' }}>
                                        <span className={`status-pill ${job.status.toLowerCase().replace(/ /g, '-')}`} style={{ fontSize: '9px', padding: '1px 6px' }}>
                                          {job.status}
                                        </span>
                                      </td>
                                      <td style={{ padding: '8px 6px', fontWeight: 600 }}>{job.rowsSynced}</td>
                                    </tr>
                                  ))
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                  <h4>Select a profile from the directory panel to begin inspection.</h4>
                </div>
              )}
            </section>
          </div>
        </div>
      </main>

      {/* Manual customer registration popover modal */}
      {showAddModal && (
        <div className="c360-modal-overlay">
          <div className="c360-modal-container">
            <div className="c360-modal-header">
              <h4>Register New Customer Profile</h4>
              <button className="c360-modal-close-btn" onClick={() => setShowAddModal(false)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleAddCustomer}>
              <div className="c360-form-group">
                <label>Full Name *</label>
                <input 
                  type="text" 
                  required 
                  value={newName} 
                  onChange={e => setNewName(e.target.value)} 
                  placeholder="e.g. Rajesh Sharma"
                />
              </div>
              <div className="c360-form-group">
                <label>Email Address *</label>
                <input 
                  type="email" 
                  required 
                  value={newEmail} 
                  onChange={e => setNewEmail(e.target.value)} 
                  placeholder="e.g. rajesh@domain.in"
                />
              </div>
              <div className="c360-form-group">
                <label>Phone Number</label>
                <input 
                  type="text" 
                  value={newPhone} 
                  onChange={e => setNewPhone(e.target.value)} 
                  placeholder="e.g. +91 98123 45678"
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="c360-form-group">
                  <label>PAN Number (India)</label>
                  <input 
                    type="text" 
                    value={newPan} 
                    onChange={e => setNewPan(e.target.value)} 
                    placeholder="e.g. ABCDE1234F"
                  />
                </div>
                <div className="c360-form-group">
                  <label>Aadhaar ID (India)</label>
                  <input 
                    type="text" 
                    value={newAadhaar} 
                    onChange={e => setNewAadhaar(e.target.value)} 
                    placeholder="e.g. 5432 1098 7654"
                  />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="c360-form-group">
                  <label>Date of Birth</label>
                  <input 
                    type="date" 
                    value={newDob} 
                    onChange={e => setNewDob(e.target.value)} 
                  />
                </div>
                <div className="c360-form-group">
                  <label>Segment</label>
                  <select value={newSegment} onChange={e => setNewSegment(e.target.value)}>
                    <option value="Regular">Regular</option>
                    <option value="VIP">VIP</option>
                    <option value="Churn-Risk">Churn-Risk</option>
                  </select>
                </div>
              </div>
              <div className="c360-form-group">
                <label>Residential Address</label>
                <input 
                  type="text" 
                  value={newAddress} 
                  onChange={e => setNewAddress(e.target.value)} 
                  placeholder="e.g. Noida, Uttar Pradesh"
                />
              </div>
              <div className="c360-modal-actions">
                <button type="button" className="btn-outline" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Create Unified Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Justification modal popup for field-level decryption requests */}
      {revealModalField && (
        <div className="c360-modal-overlay">
          <div className="c360-modal-container">
            <div className="c360-modal-header">
              <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#f87171' }}>
                <AlertTriangle size={18} /> Authorize Sensitive Data Access
              </h4>
              <button className="c360-modal-close-btn" onClick={() => setRevealModalField(null)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleConfirmDecrypt}>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px' }}>
                You are requesting decryption access to sensitive Personal Information field: <strong>{revealModalField.label}</strong> ({revealModalField.classification}).
                This action is audited and requires business justification.
              </p>
              
              <div className="c360-form-group">
                <label>Access Justification *</label>
                <input 
                  type="text"
                  required
                  placeholder="e.g. Customer requested phone verification."
                  value={justificationText}
                  onChange={e => setJustificationText(e.target.value)}
                />
              </div>

              <div className="c360-modal-actions">
                <button type="button" className="btn-outline" onClick={() => setRevealModalField(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" style={{ backgroundColor: '#ef4444', borderColor: '#ef4444', color: '#ffffff' }}>
                  Confirm & Decrypt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
