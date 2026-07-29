"use client";
import React, { useState } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  BackgroundVariant
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { 
  Sparkles, 
  Database, 
  Globe, 
  CreditCard, 
  Mail, 
  Phone, 
  Layers, 
  Info,
  HelpCircle,
  Fingerprint
} from 'lucide-react';
import { GoldenCustomerProfile } from '../../core/customer360/domain/types';

interface IdentityGraphProps {
  profile: GoldenCustomerProfile;
}

export default function IdentityGraph({ profile }: IdentityGraphProps) {
  const [selectedNode, setSelectedNode] = useState<any>(null);

  // Define nodes dynamically based on profile
  const initialNodes = [
    // Center Node: Golden UUID
    {
      id: 'golden-uuid',
      position: { x: 380, y: 220 },
      data: { 
        label: (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent-primary)', fontWeight: 'bold' }}>
              <Sparkles size={14} className="animate-pulse" />
              <span>GOLDEN CUSTOMER</span>
            </div>
            <div style={{ fontSize: '10px', color: 'var(--text-loud)', fontFamily: 'monospace' }}>
              {profile.uuid.slice(0, 16)}...
            </div>
          </div>
        )
      },
      style: { 
        background: 'rgba(92, 177, 152, 0.1)', 
        border: '2px solid var(--accent-primary)', 
        boxShadow: '0 0 15px rgba(92, 177, 152, 0.25)',
        color: 'var(--text-loud)', 
        padding: '12px 16px', 
        borderRadius: '8px',
        width: 250,
        zIndex: 50
      }
    },
    // Left Nodes: Ingestion Channels & Identity/Behavioral/Financial linkages
    {
      id: 'src-crm',
      position: { x: 50, y: 40 },
      data: {
        label: 'HubSpot CRM',
        icon: Database,
        desc: 'Contact demographic profiles',
        details: {
          'Type': 'Identity Ingestion',
          'Frequency': 'Real-time sync',
          'Value Matched': profile.identity.name || 'Unnamed'
        }
      },
      style: { background: 'var(--bg-app)', border: '1px solid var(--accent-secondary)', color: 'var(--text-loud)', borderRadius: '6px', width: 180 }
    },
    {
      id: 'src-website',
      position: { x: 50, y: 130 },
      data: {
        label: 'Web SDK Ingest',
        icon: Globe,
        desc: 'Website visitor clickstream',
        details: {
          'Type': 'Behavioral Streams',
          'Matched Via': 'Aadhaar / Email Cookie',
          'Visits Logged': `${profile.behavioralEvents.length} events`
        }
      },
      style: { background: 'var(--bg-app)', border: '1px solid var(--accent-secondary)', color: 'var(--text-loud)', borderRadius: '6px', width: 180 }
    },
    {
      id: 'src-finance',
      position: { x: 50, y: 220 },
      data: {
        label: 'Stripe Billing System',
        icon: CreditCard,
        desc: 'Transactions and Invoices',
        details: {
          'Type': 'Financial Ledger',
          'Matched Via': 'PAN / Aadhaar Linkage',
          'Revenue Contributed': `$${profile.financial.invoices ? profile.financial.invoices.reduce((a: any, c: any) => a + c.amount, 0) : 0}`
        }
      },
      style: { background: 'var(--bg-app)', border: '1px solid var(--accent-secondary)', color: 'var(--text-loud)', borderRadius: '6px', width: 180 }
    },
    {
      id: 'src-support',
      position: { x: 50, y: 310 },
      data: {
        label: 'ZenDesk Support',
        icon: HelpCircle,
        desc: 'Support Tickets & Helpdesk',
        details: {
          'Type': 'Service Operations',
          'Matched Via': 'Normalized Email Lookup',
          'Linked Tickets': '3 Active Tickets'
        }
      },
      style: { background: 'var(--bg-app)', border: '1px solid var(--accent-secondary)', color: 'var(--text-loud)', borderRadius: '6px', width: 180 }
    },
    {
      id: 'src-marketing',
      position: { x: 50, y: 400 },
      data: {
        label: 'Marketo Campaigns',
        icon: Mail,
        desc: 'Marketing list campaign clicks',
        details: {
          'Type': 'Campaign Engagement',
          'Matched Via': 'Phone / Email match',
          'Consent Status': 'Opted-In'
        }
      },
      style: { background: 'var(--bg-app)', border: '1px solid var(--accent-secondary)', color: 'var(--text-loud)', borderRadius: '6px', width: 180 }
    },
    // Right Nodes: Linked Identifier Nodes
    {
      id: 'id-email',
      position: { x: 700, y: 80 },
      data: {
        label: 'Email Identity',
        icon: Mail,
        desc: 'Primary email address token',
        details: {
          'Raw Value': profile.identity.email,
          'PII Classification': 'Highly Sensitive (Masked)',
          'Match Confidence': '100% (Exact Match)'
        }
      },
      style: { background: 'var(--bg-app)', border: '1px solid var(--grid-line-major)', color: 'var(--text-loud)', borderRadius: '6px', width: 180 }
    },
    {
      id: 'id-phone',
      position: { x: 700, y: 170 },
      data: {
        label: 'Phone Identity',
        icon: Phone,
        desc: 'Normalized E.164 phone token',
        details: {
          'Raw Value': profile.identity.phone,
          'PII Classification': 'Highly Sensitive (Masked)',
          'Match Confidence': '90% (Normalized Match)'
        }
      },
      style: { background: 'var(--bg-app)', border: '1px solid var(--grid-line-major)', color: 'var(--text-loud)', borderRadius: '6px', width: 180 }
    },
    {
      id: 'id-pan',
      position: { x: 700, y: 260 },
      data: {
        label: 'PAN Government ID',
        icon: Fingerprint,
        desc: 'Indian Permanent Account Number',
        details: {
          'Raw Value': profile.identity.pan || 'Not Linked',
          'PII Classification': 'Highly Sensitive (Masked)',
          'Match Confidence': '100% (Government Registry Match)'
        }
      },
      style: { background: 'var(--bg-app)', border: '1px solid var(--grid-line-major)', color: 'var(--text-loud)', borderRadius: '6px', width: 180 }
    },
    {
      id: 'id-aadhaar',
      position: { x: 700, y: 350 },
      data: {
        label: 'Aadhaar Government ID',
        icon: Fingerprint,
        desc: 'Indian UIDAI identification',
        details: {
          'Raw Value': profile.identity.aadhaar || 'Not Linked',
          'PII Classification': 'Highly Sensitive (Masked)',
          'Match Confidence': '100% (Deterministic Match)'
        }
      },
      style: { background: 'var(--bg-app)', border: '1px solid var(--grid-line-major)', color: 'var(--text-loud)', borderRadius: '6px', width: 180 }
    }
  ];

  // Define edges with relationship labels
  const initialEdges = [
    // Source linkages to Golden Record
    { id: 'e-crm-golden', source: 'src-crm', target: 'golden-uuid', animated: true, label: 'CRM Identity Link', style: { stroke: 'var(--accent-secondary)', strokeWidth: 1.5 }, labelStyle: { fill: 'var(--text-muted)', fontSize: 9 } },
    { id: 'e-website-golden', source: 'src-website', target: 'golden-uuid', animated: true, label: 'Email Cookie Match', style: { stroke: 'var(--accent-secondary)', strokeWidth: 1.5 }, labelStyle: { fill: 'var(--text-muted)', fontSize: 9 } },
    { id: 'e-finance-golden', source: 'src-finance', target: 'golden-uuid', animated: true, label: 'PAN Ingestion Match', style: { stroke: 'var(--accent-secondary)', strokeWidth: 1.5 }, labelStyle: { fill: 'var(--text-muted)', fontSize: 9 } },
    { id: 'e-support-golden', source: 'src-support', target: 'golden-uuid', animated: true, label: 'Email Helpdesk Link', style: { stroke: 'var(--accent-secondary)', strokeWidth: 1.5 }, labelStyle: { fill: 'var(--text-muted)', fontSize: 9 } },
    { id: 'e-marketing-golden', source: 'src-marketing', target: 'golden-uuid', animated: true, label: 'Campaign Click Match', style: { stroke: 'var(--accent-secondary)', strokeWidth: 1.5 }, labelStyle: { fill: 'var(--text-muted)', fontSize: 9 } },

    // Golden Record identifiers mapping
    { id: 'e-golden-email', source: 'golden-uuid', target: 'id-email', label: 'Primary Email', style: { stroke: 'var(--accent-primary)', strokeWidth: 1.5 }, labelStyle: { fill: 'var(--text-muted)', fontSize: 9 } },
    { id: 'e-golden-phone', source: 'golden-uuid', target: 'id-phone', label: 'Primary Phone', style: { stroke: 'var(--accent-primary)', strokeWidth: 1.5 }, labelStyle: { fill: 'var(--text-muted)', fontSize: 9 } },
    { id: 'e-golden-pan', source: 'golden-uuid', target: 'id-pan', label: 'Verified PAN', style: { stroke: 'var(--accent-primary)', strokeWidth: 1.5 }, labelStyle: { fill: 'var(--text-muted)', fontSize: 9 } },
    { id: 'e-golden-aadhaar', source: 'golden-uuid', target: 'id-aadhaar', label: 'Verified Aadhaar', style: { stroke: 'var(--accent-primary)', strokeWidth: 1.5 }, labelStyle: { fill: 'var(--text-muted)', fontSize: 9 } }
  ];

  const handleNodeClick = (_: any, node: any) => {
    // Look up original label or details
    const match = initialNodes.find(n => n.id === node.id);
    if (match && match.data.details) {
      setSelectedNode({
        label: match.data.label,
        desc: match.data.desc,
        icon: match.data.icon || Sparkles,
        details: match.data.details
      });
    } else {
      setSelectedNode({
        label: 'Golden UUID Profile',
        desc: 'Permanent Golden Customer profile containing verified identifiers from multiple connected records.',
        icon: Sparkles,
        details: {
          'Golden UUID': profile.uuid,
          'Resolution Engine': 'Rule-based stitcher',
          'Confidence Rating': `${profile.confidence}%`,
          'Lineage Sources': 'CRM, Web, Stripe, Support, Campaigns'
        }
      });
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h4 style={{ margin: 0, fontSize: '15px', color: 'var(--text-loud)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Layers size={16} /> Upgraded Enterprise Identity Graph
          </h4>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Interactive xyflow canvas showing connected channels, matching rules, and verified identifier nodes resolved to the Golden UUID.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px', fontSize: '11px' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--accent-primary)' }}>
            ● Golden Profile
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--accent-secondary)' }}>
            ● Ingest Source
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-muted)' }}>
            ● Linked ID
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '16px' }}>
        {/* XYFlow Canvas */}
        <div className="c360-graph-container" style={{ flex: 1, minHeight: '480px', height: '480px', position: 'relative', border: '1px solid var(--grid-line-minor)', borderRadius: 'var(--radius-lg)' }}>
          <ReactFlow
            nodes={initialNodes}
            edges={initialEdges}
            onNodeClick={handleNodeClick}
            fitView
            style={{ width: '100%', height: '100%' }}
          >
            <Background color="var(--grid-line-minor)" variant={BackgroundVariant.Dots} />
            <Controls style={{ background: 'var(--bg-surface)', border: '1px solid var(--grid-line-major)', color: 'var(--text-default)' }} />
          </ReactFlow>
        </div>

        {/* Selected Node Details side panel */}
        <div style={{ width: '300px', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--grid-line-minor)', borderRadius: 'var(--radius-lg)', padding: '16px', display: 'flex', flexDirection: 'column' }}>
          {selectedNode ? (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--grid-line-minor)', paddingBottom: '10px', marginBottom: '12px' }}>
                <selectedNode.icon size={16} style={{ color: 'var(--accent-primary)' }} />
                <h5 style={{ margin: 0, fontSize: '13px', color: 'var(--text-loud)' }}>
                  {typeof selectedNode.label === 'string' ? selectedNode.label : 'Golden record'}
                </h5>
              </div>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '12px' }}>
                {selectedNode.desc}
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {Object.entries(selectedNode.details).map(([key, val]: any) => (
                  <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <span style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>{key}</span>
                    <span style={{ fontSize: '12px', color: 'var(--text-loud)', fontFamily: 'monospace', wordBreak: 'break-all' }}>{val}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)', textAlign: 'center', padding: '20px' }}>
              <Info size={24} style={{ marginBottom: '8px' }} />
              <p style={{ fontSize: '12px' }}>Click any node on the graph canvas (CRM, Stripe, Web, or Golden Record) to inspect metadata and matching rules.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
