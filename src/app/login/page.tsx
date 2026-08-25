"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, UserCheck, Lock, AlertCircle, ArrowRight } from 'lucide-react';
import './login.css';

const CornerCrosshairs = () => (
  <div className="corner-accent-wrapper">
    <div className="corner-accent corner-tl"></div>
    <div className="corner-accent corner-tr"></div>
    <div className="corner-accent corner-bl"></div>
    <div className="corner-accent corner-br"></div>
  </div>
);

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('owner@agrawaltrading.com');
  const [password, setPassword] = useState('owner123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e?: React.FormEvent, customEmail?: string, customPassword?: string) => {
    if (e) e.preventDefault();
    setError(null);
    setLoading(true);

    const loginEmail = customEmail || email;
    const loginPassword = customPassword || password;

    try {
      const res = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });

      const data = await res.json();

      if (res.ok && data.token) {
        localStorage.setItem('conductor_session_token', data.token);
        localStorage.setItem('conductor_user_role', data.user.role);
        window.dispatchEvent(new Event('role_changed'));
        router.push('/');
      } else {
        setError(data.message || 'Invalid email or password');
      }
    } catch (err: any) {
      setError(err.message || 'Network error connecting to login service');
    } finally {
      setLoading(false);
    }
  };

  const loginAs = (role: 'OWNER' | 'STAFF') => {
    if (role === 'OWNER') {
      setEmail('owner@agrawaltrading.com');
      setPassword('owner123');
      handleLogin(undefined, 'owner@agrawaltrading.com', 'owner123');
    } else {
      setEmail('staff@agrawaltrading.com');
      setPassword('staff123');
      handleLogin(undefined, 'staff@agrawaltrading.com', 'staff123');
    }
  };

  return (
    <div className="login-container">
      <div className="studio-grid"></div>
      <div className="login-card hex-card" style={{ maxWidth: '440px' }}>
        <CornerCrosshairs />
        <div className="login-header">
          <div className="logo-placeholder lg">ATC</div>
          <h1>ATC Conductor</h1>
          <p>Enterprise Pharma Intelligence Platform</p>
        </div>

        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '8px',
            padding: '10px 14px',
            color: '#f87171',
            fontSize: '13px',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form className="login-form" onSubmit={handleLogin}>
          <div className="form-group">
            <label htmlFor="email">Work Email</label>
            <input 
              type="email" 
              id="email" 
              className="hex-input" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@agrawaltrading.com" 
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input 
              type="password" 
              id="password" 
              className="hex-input" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••" 
              required
            />
          </div>

          <button 
            type="submit" 
            className="btn-primary" 
            disabled={loading}
            style={{ width: '100%', marginTop: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
          >
            <Lock size={15} />
            <span>{loading ? 'Authenticating...' : 'Sign In Securely'}</span>
          </button>
        </form>

        <div className="tron-divider" style={{ margin: '20px 0 16px' }}>
          <div className="divider-line"></div>
          <div className="divider-line"></div>
          <div className="divider-line"></div>
        </div>

        <div style={{ fontSize: '11px', color: '#94a3b8', textAlign: 'center', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Quick Demo Access
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            type="button"
            className="btn-outline" 
            onClick={() => loginAs('OWNER')}
            style={{ flex: 1, fontSize: '12px', padding: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', borderColor: 'rgba(52, 211, 153, 0.4)', color: '#34d399' }}
          >
            <ShieldCheck size={14} />
            <span>Owner (Executive)</span>
          </button>
          <button 
            type="button"
            className="btn-outline" 
            onClick={() => loginAs('STAFF')}
            style={{ flex: 1, fontSize: '12px', padding: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', borderColor: 'rgba(96, 165, 250, 0.4)', color: '#60a5fa' }}
          >
            <UserCheck size={14} />
            <span>Staff (Counter)</span>
          </button>
        </div>
      </div>
    </div>
  );
}
