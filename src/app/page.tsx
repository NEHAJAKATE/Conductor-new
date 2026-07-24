import React from 'react';
import Sidebar from '@/components/Sidebar';
import ThemeToggle from '@/components/ThemeToggle';
import InteractiveWorkflow from '@/components/InteractiveWorkflow';
import './dashboard.css';

const CornerCrosshairs = () => (
  <div className="corner-accent-wrapper">
    <div className="corner-accent corner-tl"></div>
    <div className="corner-accent corner-tr"></div>
    <div className="corner-accent corner-bl"></div>
    <div className="corner-accent corner-br"></div>
  </div>
);

export default function Home() {
  return (
    <div className="dashboard-layout">
      <Sidebar />
      
      <main className="main-content">
        <div className="top-menu">
          <ThemeToggle />
        </div>
        
        <div className="dashboard-inner">
          <header className="content-header">
            <div>
              <h1 className="page-title">Live Workflow</h1>
              <p className="page-subtitle">Real-time data telemetry and agentic execution pipeline.</p>
            </div>
            <div className="status-pill">
              <span className="status-dot green"></span>
              System Healthy
            </div>
          </header>

        <div className="workflow-wrapper" style={{ height: '70vh' }}>
          <InteractiveWorkflow />
        </div>
        </div>
      </main>
    </div>
  );
}
