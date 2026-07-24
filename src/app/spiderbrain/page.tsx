"use client";
import React from 'react';
import Sidebar from '@/components/Sidebar';
import ThemeToggle from '@/components/ThemeToggle';
import { 
  BrainCircuit, 
  FileText, 
  Network, 
  Zap, 
  CheckCircle2, 
  Target
} from 'lucide-react';
import './spiderbrain.css';

export default function SpiderbrainPage() {
  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <header className="top-header">
          <div className="header-breadcrumbs">
            <span className="muted">Platform</span> / <span className="active-breadcrumb">Spiderbrain Engine</span>
          </div>
          <div className="header-actions">
            <ThemeToggle />
            <div className="avatar">AD</div>
          </div>
        </header>

        <div className="spiderbrain-wrapper">
          {/* Top Section: Overview */}
          <div className="sb-overview">
            <div className="sb-title">
              <BrainCircuit size={24} className="accent-icon" />
              <div>
                <h2>Deterministic Ontology Engine</h2>
                <p>Governing AI execution through ratified Memtree rules and Grounding Kernel metrics.</p>
              </div>
            </div>
            
            <div className="sb-stats">
              <div className="stat-box">
                <div className="stat-label">Active Rules</div>
                <div className="stat-value">142</div>
              </div>
              <div className="stat-box">
                <div className="stat-label">Centrality Avg</div>
                <div className="stat-value">0.89</div>
              </div>
              <div className="stat-box">
                <div className="stat-label">Eval Pass Rate</div>
                <div className="stat-value success">99.2%</div>
              </div>
            </div>
          </div>

          <div className="sb-content">
            {/* Left Column: Memtree Glossary */}
            <div className="sb-memtree">
              <div className="panel-header">
                <h3><FileText size={16} /> Memtree (Business Logic)</h3>
                <button className="btn-secondary">Add Rule</button>
              </div>
              
              <div className="rule-list">
                <div className="rule-card">
                  <div className="rule-header">
                    <h4>MQL Definition</h4>
                    <span className="badge badge-certified"><CheckCircle2 size={12}/> Ratified</span>
                  </div>
                  <p className="rule-desc">IF intent_score {'>'} 80 AND email NOT LIKE '%@gmail.com' THEN MQL = TRUE</p>
                  <div className="rule-meta">
                    <span>Target: dim_known_profiles</span>
                    <span>Last updated: 2h ago</span>
                  </div>
                </div>

                <div className="rule-card">
                  <div className="rule-header">
                    <h4>VIP Customer</h4>
                    <span className="badge badge-certified"><CheckCircle2 size={12}/> Ratified</span>
                  </div>
                  <p className="rule-desc">IF ltv {'>'} $10,000 OR active_subscriptions {'>'} 3 THEN VIP = TRUE</p>
                  <div className="rule-meta">
                    <span>Target: fct_activation_metrics</span>
                    <span>Last updated: 1d ago</span>
                  </div>
                </div>

                <div className="rule-card">
                  <div className="rule-header">
                    <h4>Anonymous TTL Drop</h4>
                    <span className="badge badge-pending">Pending Review</span>
                  </div>
                  <p className="rule-desc">IF last_seen {'<'} current_date - 90 days THEN Delete Profile</p>
                  <div className="rule-meta">
                    <span>Target: dim_anonymous_profiles</span>
                    <span>Last updated: 45m ago</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Engine & Graph */}
            <div className="sb-engine">
              <div className="panel-header">
                <h3><Network size={16} /> Grounding Kernel</h3>
              </div>
              
              <div className="kernel-viz">
                <div className="viz-placeholder">
                  {/* CSS-drawn mock nodes for the ontology graph */}
                  <div className="viz-node center">Spiderbrain</div>
                  <div className="viz-node side top">Tabular Parser</div>
                  <div className="viz-node side bottom">Engine Scores</div>
                  
                  <svg className="viz-lines" width="100%" height="100%">
                    <line x1="50%" y1="50%" x2="20%" y2="20%" stroke="var(--accent-secondary)" strokeWidth="2" strokeDasharray="4" />
                    <line x1="50%" y1="50%" x2="80%" y2="80%" stroke="var(--accent-secondary)" strokeWidth="2" strokeDasharray="4" />
                  </svg>
                </div>
              </div>

              <div className="evals-section">
                <h4><Target size={14}/> Continuous Evals</h4>
                <div className="eval-row">
                  <span className="eval-name">Tone & Brand Voice Check</span>
                  <div className="eval-bar-bg"><div className="eval-bar-fill" style={{width: '98%'}}></div></div>
                  <span className="eval-score">98%</span>
                </div>
                <div className="eval-row">
                  <span className="eval-name">PII Leakage Prevention</span>
                  <div className="eval-bar-bg"><div className="eval-bar-fill" style={{width: '100%'}}></div></div>
                  <span className="eval-score">100%</span>
                </div>
                <div className="eval-row">
                  <span className="eval-name">Logic Hallucination Check</span>
                  <div className="eval-bar-bg"><div className="eval-bar-fill" style={{width: '95%'}}></div></div>
                  <span className="eval-score">95%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
