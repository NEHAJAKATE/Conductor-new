"use client";
import React, { useState, useRef, useEffect } from 'react';
import { Send, Database, BrainCircuit, MessageSquare, Loader2, ShieldCheck } from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import ThemeToggle from '@/components/ThemeToggle';
import './assistant.css';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  source?: string;
  status?: string;
  data?: any;
}

const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  VERIFIED:            { label: '✓ Verified from Conductor Data',  cls: 'badge-verified' },
  NEEDS_CLARIFICATION: { label: '⚠ Clarification Needed',          cls: 'badge-clarify' },
  DATA_UNAVAILABLE:    { label: '✗ Data Not Available',            cls: 'badge-unavailable' },
  GENERAL_ADVICE:      { label: '◈ General Advisory',              cls: 'badge-general' },
  ERROR:               { label: '✗ Error',                         cls: 'badge-unavailable' },
};

const CHIPS = [
  "Which outstanding ledger is pending?",
  "Show all overdue accounts",
  "What is the outstanding of Sakshi Chemist?",
  "Closing stock of Stugeron",
  "Which products are low on stock?",
  "Who bought from us today?",
  "What are this month's sales?",
  "How to ask payment from pending customers?",
];

export default function AssistantPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSend = async (text: string) => {
    const q = text.trim();
    if (!q || isLoading) return;

    setMessages(prev => [...prev, { id: Date.now().toString(), role: 'user', content: q }]);
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/v1/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response || data.error || 'Sorry, something went wrong.',
        source: data.source,
        status: data.status,
        data: data.data,
      }]);
    } catch {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '⚠️ Network error — could not reach Conductor services.',
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="dashboard-layout">
      <Sidebar />

      <main className="main-content assistant-main">

        {/* ── Top Bar ────────────────────────────────────────── */}
        <div className="assistant-topbar">
          <div className="assistant-topbar-title">
            <div className="assistant-topbar-icon">
              <BrainCircuit size={18} color="#fff" />
            </div>
            <div>
              <h1>Ask Conductor</h1>
              <p>Powered by Local On-Premise AI — your data never leaves the server</p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div className="assistant-status-pill">
              <span className="assistant-status-dot" />
              AI Online
            </div>
            <ThemeToggle />
          </div>
        </div>

        {/* ── Chat History ────────────────────────────────────── */}
        <div className="chat-history">
          {messages.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">
                <MessageSquare size={28} color="#818cf8" />
              </div>
              <h3>What would you like to know?</h3>
              <p>
                Ask anything about your customers, outstanding payments, stock, sales, or purchases.
                Every answer comes directly from your Conductor data.
              </p>
              <span className="empty-state-hint">
                <ShieldCheck size={12} style={{ display: 'inline', marginRight: 4 }} />
                100% private — runs entirely on your local server
              </span>
            </div>
          ) : (
            messages.map(msg => {
              const badge = msg.status ? STATUS_BADGE[msg.status] : undefined;
              return (
                <div key={msg.id} className={`message-wrapper ${msg.role}`}>
                  <div className={`message ${msg.role}`}>
                    {msg.content}
                    {(msg.source || badge) && (
                      <div className="message-source">
                        <Database size={11} />
                        {msg.source && <span>{msg.source}</span>}
                        {badge && <span className={badge.cls}>{badge.label}</span>}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}

          {isLoading && (
            <div className="message-wrapper assistant">
              <div className="typing-indicator">
                <div className="typing-dots">
                  <span /><span /><span />
                </div>
                Querying Conductor…
              </div>
            </div>
          )}

          <div ref={endRef} />
        </div>

        {/* ── Input Area ──────────────────────────────────────── */}
        <div className="input-area">
          <div className="quick-actions">
            {CHIPS.map((chip, i) => (
              <button key={i} className="chip" onClick={() => handleSend(chip)} disabled={isLoading}>
                {chip}
              </button>
            ))}
          </div>

          <form className="input-box" onSubmit={e => { e.preventDefault(); handleSend(input); }}>
            <input
              type="text"
              placeholder="Ask anything about your business…"
              value={input}
              onChange={e => setInput(e.target.value)}
              disabled={isLoading}
              autoFocus
            />
            <button type="submit" disabled={!input.trim() || isLoading}>
              {isLoading
                ? <Loader2 size={17} className="lucide-spin" />
                : <Send size={17} />
              }
            </button>
          </form>
        </div>

      </main>
    </div>
  );
}
