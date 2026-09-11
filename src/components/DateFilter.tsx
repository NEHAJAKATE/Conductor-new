"use client";
import React, { useState } from 'react';
import { Calendar, ChevronDown } from 'lucide-react';
import { todayISO, yesterdayISO } from '@/lib/formatters';

export type DateFilterMode = 'all' | 'today' | 'yesterday' | 'this_week' | 'this_month' | 'custom_date' | 'date_range';

interface DateFilterProps {
  onFilterChange: (startDate?: string, endDate?: string) => void;
  defaultMode?: DateFilterMode;
}

export default function DateFilter({ onFilterChange, defaultMode = 'all' }: DateFilterProps) {
  const [mode, setMode] = useState<DateFilterMode>(defaultMode);
  const [customDate, setCustomDate] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [isOpen, setIsOpen] = useState(false);

  const applyPreset = (newMode: DateFilterMode) => {
    setMode(newMode);
    let start, end;
    
    const today = new Date();
    
    switch (newMode) {
      case 'all':
        break;
      case 'today':
        start = end = todayISO();
        break;
      case 'yesterday':
        start = end = yesterdayISO();
        break;
      case 'this_week':
        const firstDayOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));
        start = firstDayOfWeek.toISOString().split('T')[0];
        end = todayISO();
        break;
      case 'this_month':
        start = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`;
        end = todayISO();
        break;
    }

    setIsOpen(false);
    if (newMode !== 'custom_date' && newMode !== 'date_range') {
      onFilterChange(start, end);
    }
  };

  const handleCustomDateSubmit = () => {
    if (customDate) {
      onFilterChange(customDate, customDate);
      setIsOpen(false);
    }
  };

  const handleDateRangeSubmit = () => {
    if (startDate && endDate) {
      onFilterChange(startDate, endDate);
      setIsOpen(false);
    }
  };

  const getButtonLabel = () => {
    switch (mode) {
      case 'all': return 'All Time';
      case 'today': return 'Today';
      case 'yesterday': return 'Yesterday';
      case 'this_week': return 'This Week';
      case 'this_month': return 'This Month';
      case 'custom_date': return customDate ? customDate : 'Select Date';
      case 'date_range': return (startDate && endDate) ? `${startDate} to ${endDate}` : 'Select Range';
    }
  };

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button 
        className="secondary-btn" 
        onClick={() => setIsOpen(!isOpen)}
        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--bg-surface)', border: '1px solid var(--grid-line-major)', color: 'var(--text-loud)' }}
      >
        <Calendar size={15} color="var(--text-muted)" />
        <span style={{ fontWeight: 600 }}>{getButtonLabel()}</span>
        <ChevronDown size={14} color="var(--text-muted)" />
      </button>

      {isOpen && (
        <div style={{
          position: 'absolute',
          top: '100%',
          right: 0,
          marginTop: '0.5rem',
          background: 'var(--bg-surface)',
          border: '1px solid var(--grid-line-major)',
          borderRadius: '8px',
          boxShadow: 'var(--shadow-drop-layer)',
          zIndex: 50,
          minWidth: '220px',
          overflow: 'hidden'
        }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <button className="dropdown-item" onClick={() => applyPreset('all')}>All Time</button>
            <button className="dropdown-item" onClick={() => applyPreset('today')}>Today</button>
            <button className="dropdown-item" onClick={() => applyPreset('yesterday')}>Yesterday</button>
            <button className="dropdown-item" onClick={() => applyPreset('this_week')}>This Week</button>
            <button className="dropdown-item" onClick={() => applyPreset('this_month')}>This Month</button>
            
            <div style={{ borderTop: '1px solid var(--grid-line-major)', margin: '0.25rem 0' }}></div>
            
            <button className="dropdown-item" onClick={() => setMode('custom_date')}>Specific Date...</button>
            {mode === 'custom_date' && (
              <div style={{ padding: '0.5rem', display: 'flex', gap: '0.5rem', flexDirection: 'column' }}>
                <input 
                  type="date" 
                  value={customDate} 
                  onChange={e => setCustomDate(e.target.value)} 
                  style={{ background: 'var(--bg-app)', border: '1px solid var(--grid-line-major)', color: 'var(--text-loud)', padding: '0.5rem', borderRadius: '4px' }}
                />
                <button className="primary-btn" onClick={handleCustomDateSubmit} style={{ width: '100%' }}>Apply</button>
              </div>
            )}

            <button className="dropdown-item" onClick={() => setMode('date_range')}>Date Range...</button>
            {mode === 'date_range' && (
              <div style={{ padding: '0.5rem', display: 'flex', gap: '0.5rem', flexDirection: 'column' }}>
                <input 
                  type="date" 
                  value={startDate} 
                  onChange={e => setStartDate(e.target.value)} 
                  style={{ background: 'var(--bg-app)', border: '1px solid var(--grid-line-major)', color: 'var(--text-loud)', padding: '0.5rem', borderRadius: '4px' }}
                />
                <input 
                  type="date" 
                  value={endDate} 
                  onChange={e => setEndDate(e.target.value)} 
                  style={{ background: 'var(--bg-app)', border: '1px solid var(--grid-line-major)', color: 'var(--text-loud)', padding: '0.5rem', borderRadius: '4px' }}
                />
                <button className="primary-btn" onClick={handleDateRangeSubmit} style={{ width: '100%' }}>Apply Range</button>
              </div>
            )}
          </div>
        </div>
      )}
      
      <style dangerouslySetInnerHTML={{__html: `
        .dropdown-item {
          background: transparent;
          border: none;
          color: var(--text-loud);
          padding: 0.75rem 1rem;
          text-align: left;
          cursor: pointer;
          font-size: 0.85rem;
          font-weight: 500;
          width: 100%;
          transition: background 0.15s ease;
        }
        .dropdown-item:hover {
          background: var(--bg-surface-hover);
          color: var(--text-loud);
        }
      `}} />
    </div>
  );
}
