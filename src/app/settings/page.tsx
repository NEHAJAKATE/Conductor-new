"use client";
import React, { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import ThemeToggle from '@/components/ThemeToggle';
import ContextualGuidancePanel from '@/components/ContextualGuidancePanel';
import { 
  Settings, 
  Database, 
  ShieldCheck, 
  Sliders, 
  Bell, 
  Bot, 
  Save, 
  CheckCircle2, 
  Building2, 
  Server,
  RefreshCw
} from 'lucide-react';
import '../dashboard.css';
import '../business-pages.css';

export default function SettingsPage() {
  const [businessName, setBusinessName] = useState('Agrawal Trading Company (ATC)');
  const [gstin, setGstin] = useState('23AAAAA0000A1Z5');
  const [city, setCity] = useState('Indore, Madhya Pradesh');
  const [erpType, setErpType] = useState('Marg ERP 9+');
  const [reorderThreshold, setReorderThreshold] = useState('25');
  const [aiModel, setAiModel] = useState('llama3 (Local On-Premise Ollama)');
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="main-content">
        <div className="top-menu">
          <ThemeToggle />
        </div>

        <div className="business-container" style={{ maxWidth: '1000px' }}>
          <div className="business-header">
            <div className="business-title-group">
              <h1>System Settings</h1>
              <p>Configure wholesale business profile, ERP data synchronization, reorder policies, and AI preferences.</p>
            </div>
          </div>

          {saved && (
            <div style={{
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: '8px',
              padding: '12px 16px',
              marginBottom: '20px',
              color: '#10b981',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '0.9rem'
            }}>
              <CheckCircle2 size={18} />
              <span>Settings successfully updated!</span>
            </div>
          )}

          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Wholesale Profile */}
            <div className="kpi-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid var(--grid-line-major)', paddingBottom: '12px' }}>
                <Building2 size={20} color="#0d9488" />
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.05rem', color: 'var(--text-loud)' }}>Business Profile</h3>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>Wholesale pharmaceutical firm identity & GST credentials</p>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                    Firm / Business Name
                  </label>
                  <input 
                    type="text" 
                    value={businessName} 
                    onChange={e => setBusinessName(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      background: 'var(--bg-app)',
                      border: '1px solid var(--grid-line-major)',
                      borderRadius: '6px',
                      color: 'var(--text-loud)',
                      fontSize: '0.9rem'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                    GSTIN
                  </label>
                  <input 
                    type="text" 
                    value={gstin} 
                    onChange={e => setGstin(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      background: 'var(--bg-app)',
                      border: '1px solid var(--grid-line-major)',
                      borderRadius: '6px',
                      color: 'var(--text-loud)',
                      fontSize: '0.9rem'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                    Operating City & State
                  </label>
                  <input 
                    type="text" 
                    value={city} 
                    onChange={e => setCity(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      background: 'var(--bg-app)',
                      border: '1px solid var(--grid-line-major)',
                      borderRadius: '6px',
                      color: 'var(--text-loud)',
                      fontSize: '0.9rem'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                    Connected ERP System
                  </label>
                  <select 
                    value={erpType} 
                    onChange={e => setErpType(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      background: 'var(--bg-app)',
                      border: '1px solid var(--grid-line-major)',
                      borderRadius: '6px',
                      color: 'var(--text-loud)',
                      fontSize: '0.9rem'
                    }}
                  >
                    <option value="Marg ERP 9+">Marg ERP 9+</option>
                    <option value="Tally Prime">Tally Prime</option>
                    <option value="Busy Accounting">Busy Accounting</option>
                    <option value="Custom CSV / Excel Ingestion">Custom CSV / Excel Ingestion</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Inventory & Reorder Rules */}
            <div className="kpi-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid var(--grid-line-major)', paddingBottom: '12px' }}>
                <Sliders size={20} color="#f59e0b" />
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.05rem', color: 'var(--text-loud)' }}>Inventory & Reorder Thresholds</h3>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>Default stock levels that trigger automated alerts and draft POs</p>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                    Default Reorder Alert Threshold (Units / Strips)
                  </label>
                  <input 
                    type="number" 
                    value={reorderThreshold} 
                    onChange={e => setReorderThreshold(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      background: 'var(--bg-app)',
                      border: '1px solid var(--grid-line-major)',
                      borderRadius: '6px',
                      color: 'var(--text-loud)',
                      fontSize: '0.9rem'
                    }}
                  />
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                    Items with stock falling to or below this amount trigger automated reorder flags.
                  </span>
                </div>
              </div>
            </div>

            {/* AI Assistant Config */}
            <div className="kpi-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid var(--grid-line-major)', paddingBottom: '12px' }}>
                <Bot size={20} color="#818cf8" />
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.05rem', color: 'var(--text-loud)' }}>Ask Conductor AI Preferences</h3>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>Local on-premise AI intelligence settings</p>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                  Local LLM Engine
                </label>
                <input 
                  type="text" 
                  value={aiModel} 
                  disabled
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    background: 'var(--bg-app)',
                    border: '1px solid var(--grid-line-major)',
                    borderRadius: '6px',
                    color: 'var(--text-muted)',
                    fontSize: '0.9rem',
                    cursor: 'not-allowed'
                  }}
                />
                <span style={{ fontSize: '0.75rem', color: '#10b981', marginTop: '4px', display: 'block' }}>
                  ✓ 100% Private & On-Premise — No business financial data leaves your local network.
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button type="submit" className="primary-btn" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 20px' }}>
                <Save size={16} />
                <span>Save Settings</span>
              </button>
            </div>
          </form>
        </div>
      </main>
      <ContextualGuidancePanel />
    </div>
  );
}
