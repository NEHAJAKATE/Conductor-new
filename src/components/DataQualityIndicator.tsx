import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface DataQualityIndicatorProps {
  value: number | string | null | undefined;
  type?: 'number' | 'currency' | 'text';
  missingText?: string;
  hasIssue?: boolean;
  issueExplanation?: string;
  isZeroMode?: 'show_zero' | 'show_dash';
}

export default function DataQualityIndicator({
  value,
  type = 'text',
  missingText = '—',
  hasIssue = false,
  issueExplanation,
  isZeroMode = 'show_zero'
}: DataQualityIndicatorProps) {
  
  const isMissing = value === null || value === undefined || (typeof value === 'number' && isNaN(value));
  const isZero = value === 0 || value === '0';

  if (isMissing) {
    return <span style={{ color: '#64748b', fontStyle: 'italic' }}>{missingText}</span>;
  }

  if (isZero && isZeroMode === 'show_dash') {
    return <span style={{ color: '#64748b' }}>—</span>;
  }

  const displayValue = type === 'number' && typeof value === 'number'
    ? value.toLocaleString('en-IN')
    : type === 'currency' && typeof value === 'number'
    ? `₹${value.toLocaleString('en-IN')}`
    : value;

  if (hasIssue) {
    return (
      <div className="tooltip-container" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
        <span style={{ color: '#f87171', fontWeight: 500 }}>{displayValue}</span>
        <AlertTriangle size={14} color="#f87171" style={{ cursor: 'help' }} />
        {issueExplanation && (
          <div className="tooltip-content" style={{
            position: 'absolute',
            bottom: '100%',
            left: '50%',
            transform: 'translateX(-50%)',
            background: '#1e293b',
            color: '#f8fafc',
            padding: '0.5rem 0.75rem',
            borderRadius: '6px',
            fontSize: '0.75rem',
            width: 'max-content',
            maxWidth: '250px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            zIndex: 10,
            marginBottom: '0.5rem',
            border: '1px solid #334155'
          }}>
            {issueExplanation}
          </div>
        )}
      </div>
    );
  }

  return <span>{displayValue}</span>;
}
