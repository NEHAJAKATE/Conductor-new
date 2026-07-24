import React from 'react';
import { Handle, Position } from '@xyflow/react';
import * as Icons from 'lucide-react';

const CornerCrosshairs = () => (
  <div className="corner-accent-wrapper">
    <div className="corner-accent corner-tl"></div>
    <div className="corner-accent corner-tr"></div>
    <div className="corner-accent corner-bl"></div>
    <div className="corner-accent corner-br"></div>
  </div>
);

export const HexNode = ({ data }: any) => {
  const Icon = data.icon ? (Icons as any)[data.icon] : Icons.Box;

  return (
    <div className={`hex-card node-card ${data.highlight ? 'highlight' : ''} ${data.className || ''}`} style={{ width: '260px' }}>
      <CornerCrosshairs />
      
      <Handle type="target" position={Position.Left} style={{ background: 'var(--accent-primary)', border: '2px solid var(--bg-surface)', width: '10px', height: '10px', left: '-5px' }} />
      
      <div className="node-title">
        <Icon size={16} /> 
        {data.title}
      </div>
      <div className="node-desc">{data.desc}</div>
      
      {data.metric && (
        <div className={`node-metric ${data.metricClass || ''}`}>{data.metric}</div>
      )}
      
      {data.tags && (
        <div className="node-tags">
          {data.tags.map((t: string, i: number) => <span key={i} className="tag">{t}</span>)}
        </div>
      )}

      <Handle type="source" position={Position.Right} style={{ background: 'var(--accent-primary)', border: '2px solid var(--bg-surface)', width: '10px', height: '10px', right: '-5px' }} />
    </div>
  );
};

export const GroupNode = ({ data }: any) => {
  return (
    <div className="group-node-container" style={{ width: data.width, height: data.height }}>
      <div className="group-node-label">{data.label}</div>
    </div>
  );
};
