"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Database, 
  Workflow, 
  Settings, 
  Bot, 
  BrainCircuit,
  PanelLeftClose,
  PanelLeftOpen,
  Send,
  LogOut,
  UploadCloud
} from 'lucide-react';
import './sidebar.css';

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  const getNavClass = (path: string) => {
    return `nav-link ${pathname === path ? 'active' : ''}`;
  };

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        <div className="logo-placeholder">PD</div>
        {!collapsed && <h2>Conductor</h2>}
        <button className="collapse-btn" onClick={() => setCollapsed(!collapsed)}>
          {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
        </button>
      </div>
      
      <nav className="sidebar-nav">
        <div className="nav-group">
          {!collapsed && <p className="nav-group-title">Platform</p>}
          <Link href="/" className={getNavClass('/')}>
            <Workflow size={18} />
            {!collapsed && <span>Live Workflow</span>}
          </Link>
          <Link href="/ingestion" className={getNavClass('/ingestion')}>
            <UploadCloud size={18} />
            {!collapsed && <span>Data Ingestion</span>}
          </Link>
          <Link href="/contexthouse" className={getNavClass('/contexthouse')}>
            <Database size={18} />
            {!collapsed && <span>Data Contexthouse</span>}
          </Link>
          <Link href="/spiderbrain" className={getNavClass('/spiderbrain')}>
            <BrainCircuit size={18} />
            {!collapsed && <span>Spiderbrain Engine</span>}
          </Link>
        </div>

        <div className="nav-group">
          {!collapsed && <p className="nav-group-title">Execution</p>}
          <Link href="/agents" className={getNavClass('/agents')}>
            <Bot size={18} />
            {!collapsed && <span>Agency Agents</span>}
          </Link>
          <Link href="/destinations" className={getNavClass('/destinations')}>
            <Send size={18} />
            {!collapsed && <span>Destinations</span>}
          </Link>
        </div>
      </nav>

      <div className="sidebar-footer">
        <Link href="/settings" className="nav-link">
          <Settings size={18} />
          <span>Settings</span>
        </Link>
        <Link href="/login" className="nav-link text-danger">
          <LogOut size={18} />
          <span>Sign Out</span>
        </Link>
      </div>
    </aside>
  );
}
