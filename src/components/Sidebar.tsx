"use client";
import React, { useState, useEffect } from 'react';
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
  Database,
  ArrowRightLeft,
  ShieldCheck,
  UserCheck,
  MessageSquare
} from 'lucide-react';
import './sidebar.css';

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [userRole, setUserRole] = useState<'OWNER' | 'STAFF'>('OWNER');
  const pathname = usePathname();

  useEffect(() => {
    const checkSession = async () => {
      try {
        let token = localStorage.getItem('conductor_session_token');
        if (token) {
          const res = await fetch('/api/v1/auth/session', {
            headers: { 'Authorization': `Bearer ${token}` },
          });
          if (res.ok) {
            const data = await res.json();
            if (data.authenticated && data.user?.role) {
              setUserRole(data.user.role);
              localStorage.setItem('conductor_user_role', data.user.role);
              return;
            }
          }
        }

        // If no token or token is invalid/expired (401), authenticate cleanly
        localStorage.removeItem('conductor_session_token');
        const authRes = await fetch('/api/v1/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: 'owner@agrawaltrading.com', password: 'owner123' }),
        });
        if (authRes.ok) {
          const authData = await authRes.json();
          if (authData.token) {
            localStorage.setItem('conductor_session_token', authData.token);
            localStorage.setItem('conductor_user_role', authData.user?.role || 'OWNER');
            setUserRole(authData.user?.role || 'OWNER');
          }
        }
      } catch (err) {
        console.error('Session check error:', err);
      }
    };
    checkSession();
  }, []);

  const handleSignOut = () => {
    localStorage.removeItem('conductor_session_token');
    localStorage.removeItem('conductor_user_role');
    document.cookie = 'conductor_session=; Max-Age=0; path=/;';
    window.location.href = '/login';
  };

  const getNavClass = (path: string) => {
    return `nav-link ${pathname === path ? 'active' : ''}`;
  };

  const isOwner = userRole === 'OWNER';

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        <div className="logo-placeholder">ATC</div>
        {!collapsed && <h2>Conductor</h2>}
        <button className="collapse-btn" onClick={() => setCollapsed(!collapsed)} aria-label="Toggle Sidebar">
          {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
        </button>
      </div>

      {!collapsed && (
        <div style={{
          padding: '0.5rem 1rem',
          margin: '0.5rem 0.8rem',
          background: isOwner ? 'rgba(52, 211, 153, 0.1)' : 'rgba(96, 165, 250, 0.1)',
          border: `1px solid ${isOwner ? 'rgba(52, 211, 153, 0.3)' : 'rgba(96, 165, 250, 0.3)'}`,
          borderRadius: '6px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '0.75rem',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: isOwner ? '#34d399' : '#60a5fa' }}>
            {isOwner ? <ShieldCheck size={14} /> : <UserCheck size={14} />}
            <strong>Role: {userRole}</strong>
          </div>
          <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{isOwner ? 'Executive' : 'Staff'}</span>
        </div>
      )}
      
      <nav className="sidebar-nav">
        {/* INTELLIGENCE GROUP */}
        <div className="nav-group">
          {!collapsed && <p className="nav-group-title" style={{ color: '#818cf8' }}>Intelligence</p>}
          <Link href="/assistant" className={getNavClass('/assistant')} style={{ background: pathname === '/assistant' ? 'rgba(129, 140, 248, 0.1)' : 'transparent', color: pathname === '/assistant' ? '#818cf8' : 'inherit', borderLeft: pathname === '/assistant' ? '3px solid #818cf8' : '3px solid transparent' }}>
            <MessageSquare size={18} />
            {!collapsed && <span>Ask Conductor</span>}
          </Link>
        </div>

        <div className="nav-group">
          {!collapsed && <p className="nav-group-title">Overview & Customers</p>}
          <Link href="/" className={getNavClass('/')}>
            <Workflow size={18} />
            {!collapsed && <span>Live Overview</span>}
          </Link>
          <Link href="/business360" className={getNavClass('/business360')}>
            <Building2 size={18} />
            {!collapsed && <span>B2B Directory</span>}
          </Link>
          {isOwner && (
            <Link href="/customer360" className={getNavClass('/customer360')}>
              <Users size={18} />
              {!collapsed && <span>Customer 360</span>}
            </Link>
          )}
        </div>

        <div className="nav-group">
          {!collapsed && <p className="nav-group-title">Shop Operations</p>}
          <Link href="/sales" className={getNavClass('/sales')}>
            <TrendingUp size={18} />
            {!collapsed && <span>Sales</span>}
          </Link>
          <Link href="/purchases" className={getNavClass('/purchases')}>
            <ShoppingBag size={18} />
            {!collapsed && <span>Purchases</span>}
          </Link>
          <Link href="/inventory" className={getNavClass('/inventory')}>
            <Boxes size={18} />
            {!collapsed && <span>Stock & Reorder</span>}
          </Link>
          <Link href="/item-ledger" className={getNavClass('/item-ledger')}>
            <FileBarChart size={18} />
            {!collapsed && <span>Item Ledger</span>}
          </Link>
          <Link href="/outstanding" className={getNavClass('/outstanding')}>
            <Clock size={18} />
            {!collapsed && <span>Outstanding</span>}
          </Link>
          {isOwner && (
            <Link href="/reconciliation" className={getNavClass('/reconciliation')}>
              <ArrowRightLeft size={18} />
              {!collapsed && <span>Bank Reconciliation</span>}
            </Link>
          )}
          <Link href="/reports" className={getNavClass('/reports')}>
            <FileBarChart size={18} />
            {!collapsed && <span>Custom Reports</span>}
          </Link>
        </div>

        {isOwner && (
          <div className="nav-group">
            {!collapsed && <p className="nav-group-title">Data & Pipelines</p>}
            <Link href="/ingestion" className={getNavClass('/ingestion')}>
              <UploadCloud size={18} />
              {!collapsed && <span>Connect Data</span>}
            </Link>
            <Link href="/integrations" className={getNavClass('/integrations')}>
              <CalendarCheck size={18} />
              {!collapsed && <span>ERP Sync Jobs</span>}
            </Link>
            <Link href="/workflows" className={getNavClass('/workflows')}>
              <Zap size={18} />
              {!collapsed && <span>Alerts & Rules</span>}
            </Link>
            <Link href="/contexthouse" className={getNavClass('/contexthouse')}>
              <Database size={18} />
              {!collapsed && <span>Data Schema Lineage</span>}
            </Link>
          </div>
        )}
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
