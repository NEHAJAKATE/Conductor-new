"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Building2,
  Users,
  TrendingUp,
  ShoppingBag,
  Clock,
  Boxes,
  FileBarChart,
  UploadCloud,
  Workflow,
  Settings,
  PanelLeftClose,
  PanelLeftOpen,
  LogOut,
  CalendarCheck,
  Zap,
  Database
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
        <div className="logo-placeholder">ATC</div>
        {!collapsed && <h2>Conductor</h2>}
        <button className="collapse-btn" onClick={() => setCollapsed(!collapsed)} aria-label="Toggle Sidebar">
          {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
        </button>
      </div>
      
      <nav className="sidebar-nav">
        <div className="nav-group">
          {!collapsed && <p className="nav-group-title">360° Intelligence</p>}
          <Link href="/" className={getNavClass('/')}>
            <Workflow size={18} />
            {!collapsed && <span>Live Overview</span>}
          </Link>
          <Link href="/business360" className={getNavClass('/business360')}>
            <Building2 size={18} />
            {!collapsed && <span>Business 360</span>}
          </Link>
          <Link href="/customer360" className={getNavClass('/customer360')}>
            <Users size={18} />
            {!collapsed && <span>Customer 360</span>}
          </Link>
        </div>

        <div className="nav-group">
          {!collapsed && <p className="nav-group-title">Operations</p>}
          <Link href="/sales" className={getNavClass('/sales')}>
            <TrendingUp size={18} />
            {!collapsed && <span>Sales</span>}
          </Link>
          <Link href="/purchases" className={getNavClass('/purchases')}>
            <ShoppingBag size={18} />
            {!collapsed && <span>Purchases</span>}
          </Link>
          <Link href="/outstanding" className={getNavClass('/outstanding')}>
            <Clock size={18} />
            {!collapsed && <span>Outstanding</span>}
          </Link>
          <Link href="/inventory" className={getNavClass('/inventory')}>
            <Boxes size={18} />
            {!collapsed && <span>Inventory</span>}
          </Link>
          <Link href="/reports" className={getNavClass('/reports')}>
            <FileBarChart size={18} />
            {!collapsed && <span>Reports</span>}
          </Link>
        </div>

        <div className="nav-group">
          {!collapsed && <p className="nav-group-title">Data & Pipelines</p>}
          <Link href="/ingestion" className={getNavClass('/ingestion')}>
            <UploadCloud size={18} />
            {!collapsed && <span>Data Ingestion</span>}
          </Link>
          <Link href="/integrations" className={getNavClass('/integrations')}>
            <CalendarCheck size={18} />
            {!collapsed && <span>Data Sources & Jobs</span>}
          </Link>
          <Link href="/workflows" className={getNavClass('/workflows')}>
            <Zap size={18} />
            {!collapsed && <span>Automations</span>}
          </Link>
          <Link href="/contexthouse" className={getNavClass('/contexthouse')}>
            <Database size={18} />
            {!collapsed && <span>Contexthouse</span>}
          </Link>
        </div>
      </nav>

      <div className="sidebar-footer">
        <Link href="/settings" className="nav-link">
          <Settings size={18} />
          {!collapsed && <span>Settings</span>}
        </Link>
        <Link href="/login" className="nav-link text-danger">
          <LogOut size={18} />
          {!collapsed && <span>Sign Out</span>}
        </Link>
      </div>
    </aside>
  );
}
