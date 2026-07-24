"use client";
import React, { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import ThemeToggle from '@/components/ThemeToggle';
import { 
  Bot, 
  Mail, 
  Briefcase, 
  Shield, 
  BarChart, 
  Image as ImageIcon,
  Key,
  Plug,
  TerminalSquare
} from 'lucide-react';
import './agents.css';

const agentsList = [
  { id: 'email', name: 'Email Strategist', status: 'active', icon: Mail, context: 'dim_known_profiles', mcp: ['mcp-hubspot', 'mcp-sendgrid'] },
  { id: 'sales', name: 'Sales Agent', status: 'idle', icon: Briefcase, context: 'fct_activation_metrics', mcp: ['mcp-salesforce'] },
  { id: 'privacy', name: 'Privacy Engineer', status: 'active', icon: Shield, context: 'dim_anonymous_profiles', mcp: ['mcp-compliance-checker'] },
  { id: 'reports', name: 'Analytics Reporter', status: 'error', icon: BarChart, context: 'fct_engine_scores', mcp: ['mcp-slack', 'mcp-tableau'] },
  { id: 'creative', name: 'Visual Storyteller', status: 'idle', icon: ImageIcon, context: 'dim_known_profiles', mcp: ['mcp-dalle', 'mcp-figma'] },
];

export default function AgentsPage() {
  const [activeAgent, setActiveAgent] = useState(agentsList[0]);

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <header className="top-header">
          <div className="header-breadcrumbs">
            <span className="muted">Execution</span> / <span className="active-breadcrumb">Agency Agents</span>
          </div>
          <div className="header-actions">
            <ThemeToggle />
            <div className="avatar">AD</div>
          </div>
        </header>

        <div className="agents-wrapper">
          {/* Left Column: Catalog */}
          <div className="agents-catalog">
            <div className="catalog-header">
              <h3><Bot size={16}/> Active Swarm</h3>
              <button className="btn-secondary btn-sm">Deploy New</button>
            </div>
            
            <div className="agent-list">
              {agentsList.map(agent => {
                const Icon = agent.icon;
                return (
                  <div 
                    key={agent.id} 
                    className={`agent-row ${activeAgent.id === agent.id ? 'selected' : ''}`}
                    onClick={() => setActiveAgent(agent)}
                  >
                    <div className="agent-row-info">
                      <div className="agent-icon"><Icon size={16}/></div>
                      <span className="agent-name">{agent.name}</span>
                    </div>
                    <div className={`status-indicator status-${agent.status}`}></div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Right Column: Configuration Workspace */}
          <div className="agent-workspace">
            <div className="workspace-header">
              <div className="workspace-title">
                <activeAgent.icon size={24} className="accent-icon" />
                <div>
                  <h2>{activeAgent.name}</h2>
                  <div className="workspace-meta">
                    <span className={`badge-status status-${activeAgent.status}`}>
                      {activeAgent.status.toUpperCase()}
                    </span>
                    <span className="meta-id">ID: agt_{activeAgent.id}_prod</span>
                  </div>
                </div>
              </div>
              <div className="workspace-actions">
                <button className="btn-secondary">View Logs</button>
                <button className="btn-primary">Pause Agent</button>
              </div>
            </div>

            <div className="config-grid">
              {/* Context Assignment */}
              <div className="config-panel">
                <div className="panel-title">
                  <DatabaseIcon /> Data Contexthouse Assignment
                </div>
                <div className="context-card">
                  <span className="table-name">{activeAgent.context}</span>
                  <span className="table-access">READ_ONLY</span>
                </div>
                <p className="panel-hint">This agent grounds its memory strictly on this Lakehouse asset.</p>
              </div>

              {/* MCP Servers */}
              <div className="config-panel">
                <div className="panel-title">
                  <Plug size={16}/> MCP Tool Servers
                </div>
                <div className="mcp-list">
                  {activeAgent.mcp.map(srv => (
                    <div key={srv} className="mcp-card">
                      <div className="mcp-status"></div>
                      {srv}
                    </div>
                  ))}
                </div>
              </div>

              {/* System Prompt (Full Width) */}
              <div className="config-panel full-width">
                <div className="panel-title">
                  <TerminalSquare size={16}/> System Directive (Sonnet 5.0)
                </div>
                <div className="code-editor">
                  <div className="editor-lines">
                    1<br/>2<br/>3<br/>4
                  </div>
                  <pre className="editor-code">
                    <code>
<span className="keyword">You are the</span> {activeAgent.name}.<br/>
<span className="keyword">Your primary directive is to process</span> {activeAgent.context} <span className="keyword">records.</span><br/>
<br/>
<span className="comment">// Execution governed by Spiderbrain Memtree rules.</span>
                    </code>
                  </pre>
                </div>
              </div>

            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

const DatabaseIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <ellipse cx="12" cy="5" rx="9" ry="3"></ellipse>
    <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path>
    <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path>
  </svg>
);
