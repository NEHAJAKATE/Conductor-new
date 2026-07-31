"use client";
import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import ThemeToggle from '@/components/ThemeToggle';
import { 
  HardDrive, 
  Layers, 
  Star, 
  Workflow, 
  Search, 
  Filter, 
  MoreHorizontal, 
  ShieldCheck, 
  Bot, 
  Network
} from 'lucide-react';
import './contexthouse.css';

interface DatasetItem {
  id: string;
  displayName: string;
}

interface ProfileItem {
  profile_id: string;
  email: string;
  first_seen: string;
  intent_score: number;
  lifecycle_stage: string;
  matching_reason?: string;
  ingestion_lineage?: string;
}

export default function ContexthousePage() {
  const [rawList, setRawList] = useState<Array<{ name: string; id: string }>>([
    { name: 'src_hubspot_contacts', id: 'hubspot' },
    { name: 'src_snow_telemetry', id: 'snow' },
    { name: 'src_sdk_events', id: 'sdk' }
  ]);
  const [normalizedList, setNormalizedList] = useState<Array<{ name: string; path: string }>>([
    { name: 'stg_users', path: 'stg_users' },
    { name: 'stg_pageviews', path: 'stg_pageviews' }
  ]);
  const [identityList, setIdentityList] = useState<ProfileItem[]>([
    { profile_id: 'kp_9821', email: 'sarah.j@example.com', first_seen: '2026-07-20 14:22:00', intent_score: 92, lifecycle_stage: 'MQL' },
    { profile_id: 'kp_9822', email: 'm.roberts@acme.inc', first_seen: '2026-07-21 09:11:43', intent_score: 65, lifecycle_stage: 'Lead' },
    { profile_id: 'kp_9823', email: 'alex@startups.co', first_seen: '2026-07-22 18:45:10', intent_score: 88, lifecycle_stage: 'SQL' },
    { profile_id: 'kp_9824', email: 'unknown_lead', first_seen: '2026-07-23 11:05:00', intent_score: 21, lifecycle_stage: 'Prospect' }
  ]);

  const [activeCatalog, setActiveCatalog] = useState('dim_known_profiles');
  const [activeCategory, setActiveCategory] = useState<'raw' | 'normalized' | 'identity' | 'ready'>('identity');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAssets() {
      try {
        const res = await fetch('/api/v1/assets');
        if (res.ok) {
          const data = await res.json();
          const rawData = data.raw || data.rawList || data.bronze || data.bronzeList;
          if (rawData?.length > 0) {
            setRawList(prev => [
              ...rawData.map((item: any) => ({ name: item.name.replace(/\.[^/.]+$/, ''), id: item.id })),
              ...prev
            ]);
          }
          const normalizedData = data.normalized || data.normalizedList || data.silver || data.silverList;
          if (normalizedData?.length > 0) {
            setNormalizedList(prev => [
              ...normalizedData.map((item: any) => ({ name: item.name, path: item.path })),
              ...prev
            ]);
          }
          if (data.identityList?.length > 0) {
            setIdentityList(prev => [
              ...data.identityList,
              ...prev
            ]);
          }
        }
      } catch (err) {
        console.error('Failed to load dynamic assets:', err);
      } finally {
        setLoading(false);
      }
    }
    loadAssets();
  }, []);

  const handleSelectItem = (name: string, category: typeof activeCategory) => {
    setActiveCatalog(name);
    setActiveCategory(category);
  };

  const getFilteredProfiles = () => {
    if (!searchQuery) return identityList;
    return identityList.filter(p => 
      p.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.profile_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.lifecycle_stage.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  const activeProfileDetails = identityList.find(p => p.profile_id === activeCatalog || p.email === activeCatalog) || identityList[0];

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <header className="top-header">
          <div className="header-breadcrumbs">
            <span className="muted">Platform</span> / <span className="active-breadcrumb">Data Contexthouse</span>
          </div>
          <div className="header-actions">
            <ThemeToggle />
            <div className="avatar">AD</div>
          </div>
        </header>

        <div className="contexthouse-wrapper">
          {/* Left Column: Asset Browser */}
          <div className="asset-browser">
            <div className="browser-header">
              <h3>Assets</h3>
              <div className="search-bar">
                <Search size={14} />
                <input 
                  type="text" 
                  placeholder="Search catalogs..." 
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            
            <div className="tree-group">
              <div className="tree-group-title"><HardDrive size={14}/> Raw Imported Data</div>
              {rawList.map((item, idx) => (
                <div 
                  key={`${item.name}-${idx}`} 
                  className={`tree-item ${activeCatalog === item.name ? 'active' : ''}`}
                  onClick={() => handleSelectItem(item.name, 'raw')}
                >
                  {item.name}
                </div>
              ))}
            </div>

            <div className="tree-group">
              <div className="tree-group-title"><Layers size={14}/> Clean & Standardized Data</div>
              {normalizedList.map((item, idx) => (
                <div 
                  key={`${item.name}-${idx}`} 
                  className={`tree-item ${activeCatalog === item.name ? 'active' : ''}`}
                  onClick={() => handleSelectItem(item.name, 'normalized')}
                >
                  {item.name}
                </div>
              ))}
            </div>

            <div className="tree-group">
              <div className="tree-group-title active-tree-title"><Workflow size={14}/> Identity Graph</div>
              <div 
                className={`tree-item ${activeCatalog === 'dim_known_profiles' ? 'active' : ''}`}
                onClick={() => handleSelectItem('dim_known_profiles', 'identity')}
              >
                Known Customer Profiles
              </div>
              <div 
                className={`tree-item ${activeCatalog === 'dim_anonymous_profiles' ? 'active' : ''}`}
                onClick={() => handleSelectItem('dim_anonymous_profiles', 'identity')}
              >
                Anonymous Visitor Profiles
              </div>
            </div>

            <div className="tree-group">
              <div className="tree-group-title"><Star size={14}/> Business Ready Data</div>
              <div className="tree-item">fct_activation_metrics</div>
              <div className="tree-item">fct_engine_scores</div>
            </div>
          </div>

          {/* Middle Column: Data Grid */}
          <div className="data-grid-container">
            <div className="grid-header">
              <div className="grid-title">
                <h2>{activeCatalog}</h2>
                <span className="badge badge-certified"><ShieldCheck size={12}/> Certified</span>
              </div>
              <div className="grid-actions">
                <button className="btn-secondary"><Filter size={14} /> Filter</button>
                <button className="btn-icon"><MoreHorizontal size={16} /></button>
              </div>
            </div>

            <div className="table-wrapper">
              {activeCategory === 'identity' || activeCategory === 'normalized' ? (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>profile_id</th>
                      <th>email</th>
                      <th>first_seen</th>
                      <th>intent_score</th>
                      <th>lifecycle_stage</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getFilteredProfiles().map((profile, idx) => (
                      <tr key={idx} style={{ cursor: 'pointer' }} onClick={() => setActiveCatalog(profile.profile_id)}>
                        <td><span className="code-cell">{profile.profile_id}</span></td>
                        <td>{profile.email}</td>
                        <td>{new Date(profile.first_seen).toLocaleString()}</td>
                        <td>
                          <span className={profile.intent_score > 80 ? "metric-high" : profile.intent_score > 50 ? "metric-med" : "metric-low"}>
                            {profile.intent_score}
                          </span>
                        </td>
                        <td><span className="tag">{profile.lifecycle_stage}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  <h4>No records in viewport</h4>
                  <p style={{ fontSize: '13px', marginTop: '6px' }}>Showing preview for raw metadata registry. Select "dim_known_profiles" to inspect linked identity vectors.</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Active Metadata Inspector (Atlan style) */}
          <div className="metadata-inspector">
            <div className="inspector-header">
              <h3>Asset Details</h3>
            </div>
            
            <div className="inspector-content">
              <div className="metadata-section">
                <h4><Bot size={14}/> AI Summary</h4>
                <p className="ai-text">
                  {activeCategory === 'identity' 
                    ? `This table contains deterministic, identity-stitched profiles merged from HubSpot and active telemetry. It is the primary driving table for all downstream Agency Agents.`
                    : `Raw or schema-conformed staging directory in Conductor Raw Lake, registered by active connector workers.`
                  }
                </p>
              </div>

              {activeProfileDetails && activeCategory === 'identity' && (
                <div className="metadata-section" style={{ borderTop: '1px solid var(--grid-line-minor)', paddingTop: '12px' }}>
                  <h4>Stitching Details</h4>
                  <div style={{ fontSize: '12px', color: 'var(--text-default)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div><strong>Reason:</strong> {activeProfileDetails.matching_reason || 'Unique Primary Identifier Match'}</div>
                    <div><strong>Lineage:</strong> {activeProfileDetails.ingestion_lineage || 'Ingested'}</div>
                  </div>
                </div>
              )}

              <div className="metadata-section">
                <h4>Columns (5)</h4>
                <div className="column-list">
                  <div className="col-item">
                    <span className="col-name">profile_id</span>
                    <span className="col-type">VARCHAR</span>
                  </div>
                  <div className="col-item">
                    <span className="col-name">email</span>
                    <span className="col-type">VARCHAR</span>
                    <span className="tag pii-tag">PII</span>
                  </div>
                  <div className="col-item">
                    <span className="col-name">intent_score</span>
                    <span className="col-type">INT</span>
                  </div>
                </div>
              </div>

              <div className="metadata-section">
                <h4><Network size={14}/> Lineage Preview</h4>
                <div className="mini-lineage">
                  <div className="lineage-node">{activeCategory === 'raw' ? activeCatalog : 'stg_users'}</div>
                  <div className="lineage-arrow">↓</div>
                  <div className="lineage-node active">{activeCatalog}</div>
                  <div className="lineage-arrow">↓</div>
                  <div className="lineage-node">agent-email</div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
