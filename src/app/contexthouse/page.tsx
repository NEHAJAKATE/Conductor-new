"use client";
import React from 'react';
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

export default function ContexthousePage() {
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
                <input type="text" placeholder="Search catalogs..." />
              </div>
            </div>
            
            <div className="tree-group">
              <div className="tree-group-title"><HardDrive size={14}/> Bronze Lake (Raw)</div>
              <div className="tree-item">src_hubspot_contacts</div>
              <div className="tree-item">src_snow_telemetry</div>
              <div className="tree-item">src_sdk_events</div>
            </div>

            <div className="tree-group">
              <div className="tree-group-title"><Layers size={14}/> Silver Lake (Norm)</div>
              <div className="tree-item">stg_users</div>
              <div className="tree-item">stg_pageviews</div>
            </div>

            <div className="tree-group">
              <div className="tree-group-title active-tree-title"><Workflow size={14}/> Identity Graph</div>
              <div className="tree-item active">dim_known_profiles</div>
              <div className="tree-item">dim_anonymous_profiles</div>
            </div>

            <div className="tree-group">
              <div className="tree-group-title"><Star size={14}/> Gold Marts (Ready)</div>
              <div className="tree-item">fct_activation_metrics</div>
              <div className="tree-item">fct_engine_scores</div>
            </div>
          </div>

          {/* Middle Column: Data Grid */}
          <div className="data-grid-container">
            <div className="grid-header">
              <div className="grid-title">
                <h2>dim_known_profiles</h2>
                <span className="badge badge-certified"><ShieldCheck size={12}/> Certified</span>
              </div>
              <div className="grid-actions">
                <button className="btn-secondary"><Filter size={14} /> Filter</button>
                <button className="btn-icon"><MoreHorizontal size={16} /></button>
              </div>
            </div>

            <div className="table-wrapper">
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
                  <tr>
                    <td><span className="code-cell">kp_9821</span></td>
                    <td>sarah.j@example.com</td>
                    <td>2026-07-20 14:22:00</td>
                    <td><span className="metric-high">92</span></td>
                    <td><span className="tag">MQL</span></td>
                  </tr>
                  <tr>
                    <td><span className="code-cell">kp_9822</span></td>
                    <td>m.roberts@acme.inc</td>
                    <td>2026-07-21 09:11:43</td>
                    <td><span className="metric-med">65</span></td>
                    <td><span className="tag">Lead</span></td>
                  </tr>
                  <tr>
                    <td><span className="code-cell">kp_9823</span></td>
                    <td>alex@startups.co</td>
                    <td>2026-07-22 18:45:10</td>
                    <td><span className="metric-high">88</span></td>
                    <td><span className="tag">SQL</span></td>
                  </tr>
                  <tr>
                    <td><span className="code-cell">kp_9824</span></td>
                    <td>unknown_lead</td>
                    <td>2026-07-23 11:05:00</td>
                    <td><span className="metric-low">21</span></td>
                    <td><span className="tag">Prospect</span></td>
                  </tr>
                </tbody>
              </table>
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
                  This table contains deterministic, identity-stitched profiles merged from HubSpot and Snowflake telemetry. It is the primary driving table for all downstream Agency Agents.
                </p>
              </div>

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
                  <div className="lineage-node">stg_users</div>
                  <div className="lineage-arrow">↓</div>
                  <div className="lineage-node active">dim_known_profiles</div>
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
