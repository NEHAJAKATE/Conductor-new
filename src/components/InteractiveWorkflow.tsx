"use client";
import React, { useCallback } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  BackgroundVariant
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { HexNode, GroupNode } from './FlowNodes';

const nodeTypes = {
  hexNode: HexNode,
  groupNode: GroupNode,
};

const defaultEdge = { animated: true, type: 'smoothstep', style: { stroke: 'var(--grid-line-major)', strokeWidth: 2 } };
const primaryEdge = { animated: true, type: 'smoothstep', style: { stroke: 'var(--accent-primary)', strokeWidth: 2 } };
const secondaryEdge = { animated: true, type: 'smoothstep', style: { stroke: 'var(--accent-secondary)', strokeWidth: 2 } };
const warnEdge = { animated: true, type: 'smoothstep', style: { stroke: '#CDA849', strokeWidth: 2 } };

const initialNodes = [
  // L0: Sources
  { id: 'src-hubspot', type: 'hexNode', position: { x: 50, y: 50 }, data: { title: 'CRM / HubSpot', desc: 'Airbyte sync', icon: 'Database' } },
  { id: 'src-salesforce', type: 'hexNode', position: { x: 50, y: 160 }, data: { title: 'Salesforce', desc: 'Bulk API & CDC', icon: 'Database' } },
  { id: 'src-snow', type: 'hexNode', position: { x: 50, y: 270 }, data: { title: 'Snowflake', desc: 'Secure Share', icon: 'HardDrive' } },
  { id: 'src-sdk', type: 'hexNode', position: { x: 50, y: 380 }, data: { title: 'Web & Mobile SDKs', desc: 'Real-time telemetry', icon: 'Smartphone' } },
  { id: 'src-s3', type: 'hexNode', position: { x: 50, y: 490 }, data: { title: 'Cloud Storage (S3)', desc: 'SFTP / Batch', icon: 'Cloud' } },

  // Pre-Ingestion
  { id: 'pre-ingest', type: 'hexNode', position: { x: 380, y: 270 }, data: { title: 'Pre-Ingestion', desc: 'Sensitive Data Masking & Event Norm', icon: 'Filter', metric: '100% compliant', metricClass: 'success-metric' } },

  // Data Contexthouse (Group)
  { id: 'group-contexthouse', type: 'groupNode', position: { x: 720, y: 50 }, data: { label: 'Data Contexthouse', width: 660, height: 440 }, style: { zIndex: -1 } },
  { id: 'lake-raw', type: 'hexNode', parentNode: 'group-contexthouse', position: { x: 40, y: 60 }, data: { title: 'Raw Imported Data', desc: 'Original files exactly as uploaded', icon: 'HardDrive' } },
  { id: 'lake-normalized', type: 'hexNode', parentNode: 'group-contexthouse', position: { x: 40, y: 190 }, data: { title: 'Clean & Standardized Data', desc: 'Duplicate records removed, formats standardized', icon: 'Layers' } },
  { id: 'id-graph', type: 'hexNode', parentNode: 'group-contexthouse', position: { x: 40, y: 320 }, data: { title: 'Customer Matching Graph', desc: 'Deterministic stitching', icon: 'Workflow' } },
  
  { id: 'lake-ready', type: 'hexNode', parentNode: 'group-contexthouse', position: { x: 360, y: 60 }, data: { title: 'Business Ready Data', desc: 'Final datasets ready for AI, analytics and reporting', icon: 'Star' } },
  { id: 'known-profiles', type: 'hexNode', parentNode: 'group-contexthouse', position: { x: 360, y: 190 }, data: { title: 'Known Profiles', desc: 'Identity-stitched', icon: 'Users', metric: '45M Profiles' } },
  { id: 'anon-profiles', type: 'hexNode', parentNode: 'group-contexthouse', position: { x: 360, y: 320 }, data: { title: 'Anonymous Profiles', desc: 'TTL gated', icon: 'Ghost', metric: '112M Profiles' } },

  // Spiderbrain Engine (Group)
  { id: 'group-spiderbrain', type: 'groupNode', position: { x: 1450, y: 50 }, data: { label: 'Spiderbrain Engine', width: 660, height: 440 }, style: { zIndex: -1 } },
  { id: 'sb-tab-parser', type: 'hexNode', parentNode: 'group-spiderbrain', position: { x: 40, y: 60 }, data: { title: 'Tabular Parser', desc: 'dbt-metadata mining', icon: 'Table' } },
  { id: 'sb-ontology', type: 'hexNode', parentNode: 'group-spiderbrain', position: { x: 40, y: 190 }, data: { title: 'Relational Ontology', desc: 'Graph Mapping', icon: 'Network' } },
  { id: 'sb-engine', type: 'hexNode', parentNode: 'group-spiderbrain', position: { x: 40, y: 320 }, data: { title: 'Engine Scoring', desc: 'Centrality & Authority', icon: 'Zap' } },
  
  { id: 'sb-memtree', type: 'hexNode', parentNode: 'group-spiderbrain', position: { x: 360, y: 60 }, data: { title: 'Memtree', desc: 'Ratified Guidelines', icon: 'FileText' } },
  { id: 'sb-evals', type: 'hexNode', parentNode: 'group-spiderbrain', position: { x: 360, y: 190 }, data: { title: 'Continuous Evals', desc: 'Benchmarks (50-q)', icon: 'Target' } },
  { id: 'sb-kernel', type: 'hexNode', parentNode: 'group-spiderbrain', position: { x: 360, y: 320 }, data: { title: 'Grounding Kernel', desc: 'Certified SQL & Dictionaries', icon: 'BrainCircuit', tags: ['Versioned', 'Auditable'], className: 'spiderbrain' } },

  // Control Plane & Execution (Group)
  { id: 'group-execution', type: 'groupNode', position: { x: 2180, y: 50 }, data: { label: 'Execution Plane', width: 660, height: 320 }, style: { zIndex: -1 } },
  { id: 'cp-copilot', type: 'hexNode', parentNode: 'group-execution', position: { x: 40, y: 60 }, data: { title: 'Claude Control Plane', desc: 'Sonnet 5.0 Orchestration', icon: 'Bot', tags: ['Tool Select'] } },
  { id: 'cp-workflows', type: 'hexNode', parentNode: 'group-execution', position: { x: 40, y: 190 }, data: { title: 'Durable Workflows', desc: 'Inngest Engine', icon: 'Activity' } },
  { id: 'cp-audit', type: 'hexNode', parentNode: 'group-execution', position: { x: 360, y: 60 }, data: { title: 'Audit Log & Compliance', desc: 'Append-only ledger', icon: 'ShieldCheck' } },
  { id: 'cp-hitl', type: 'hexNode', parentNode: 'group-execution', position: { x: 360, y: 190 }, data: { title: 'Human In The Loop', desc: 'Slack Approvals', icon: 'CheckCircle2', metric: '3 Pending', metricClass: 'warning-metric' } },

  // Agent Catalog (Group)
  { id: 'group-agents', type: 'groupNode', position: { x: 2910, y: 50 }, data: { label: 'Agent Catalog (agency-agents)', width: 340, height: 600 }, style: { zIndex: -1 } },
  { id: 'agent-email', type: 'hexNode', parentNode: 'group-agents', position: { x: 40, y: 60 }, data: { title: 'Email Strategist', desc: 'Drafts & Segmentation', icon: 'Mail' } },
  { id: 'agent-sales', type: 'hexNode', parentNode: 'group-agents', position: { x: 40, y: 160 }, data: { title: 'Sales Agent', desc: 'Lead-to-payment', icon: 'Briefcase' } },
  { id: 'agent-privacy', type: 'hexNode', parentNode: 'group-agents', position: { x: 40, y: 260 }, data: { title: 'Privacy Engineer', desc: 'Compliance Check', icon: 'Shield' } },
  { id: 'agent-reports', type: 'hexNode', parentNode: 'group-agents', position: { x: 40, y: 360 }, data: { title: 'Analytics Reporter', desc: 'Data Consolidation', icon: 'BarChart' } },
  { id: 'agent-creative', type: 'hexNode', parentNode: 'group-agents', position: { x: 40, y: 460 }, data: { title: 'Visual Storyteller', desc: 'Asset Generation', icon: 'Image' } },

  // Destinations (Activation)
  { id: 'group-destinations', type: 'groupNode', position: { x: 3320, y: 50 }, data: { label: 'Destinations / Activation', width: 340, height: 480 }, style: { zIndex: -1 } },
  { id: 'dest-reverse-etl', type: 'hexNode', parentNode: 'group-destinations', position: { x: 40, y: 60 }, data: { title: 'Reverse ETL (Census)', desc: 'Audience Sync', icon: 'RefreshCw' } },
  { id: 'dest-salesforce', type: 'hexNode', parentNode: 'group-destinations', position: { x: 40, y: 170 }, data: { title: 'Salesforce Push', desc: 'Object Update', icon: 'Database' } },
  { id: 'dest-slack', type: 'hexNode', parentNode: 'group-destinations', position: { x: 40, y: 280 }, data: { title: 'Slack / Teams', desc: 'Alerts & Reports', icon: 'MessageSquare' } },
  { id: 'dest-webhook', type: 'hexNode', parentNode: 'group-destinations', position: { x: 40, y: 390 }, data: { title: 'Custom Webhook', desc: 'Endpoint payload', icon: 'Globe' } },
];

const initialEdges = [
  // L0 -> Pre-Ingest
  { id: 'e1', source: 'src-hubspot', target: 'pre-ingest', ...primaryEdge },
  { id: 'e2', source: 'src-salesforce', target: 'pre-ingest', ...primaryEdge },
  { id: 'e3', source: 'src-snow', target: 'pre-ingest', ...primaryEdge },
  { id: 'e4', source: 'src-sdk', target: 'pre-ingest', ...primaryEdge },
  { id: 'e5', source: 'src-s3', target: 'pre-ingest', ...primaryEdge },

  // Pre-Ingest -> Lake
  { id: 'e6', source: 'pre-ingest', target: 'lake-raw', ...primaryEdge },
  
  // Lake internal
  { id: 'e7', source: 'lake-raw', target: 'lake-normalized', ...primaryEdge },
  { id: 'e8', source: 'lake-normalized', target: 'id-graph', ...primaryEdge },
  { id: 'e9', source: 'lake-normalized', target: 'lake-ready', ...primaryEdge },
  { id: 'e10', source: 'id-graph', target: 'known-profiles', ...primaryEdge },
  { id: 'e11', source: 'id-graph', target: 'anon-profiles', ...primaryEdge },

  // Lake -> Spiderbrain
  { id: 'e12', source: 'lake-ready', target: 'sb-tab-parser', ...secondaryEdge },
  { id: 'e13', source: 'known-profiles', target: 'sb-tab-parser', ...secondaryEdge },

  // Spiderbrain internal
  { id: 'e14', source: 'sb-tab-parser', target: 'sb-ontology', ...secondaryEdge },
  { id: 'e15', source: 'sb-ontology', target: 'sb-engine', ...secondaryEdge },
  { id: 'e16', source: 'sb-engine', target: 'sb-kernel', ...secondaryEdge },
  { id: 'e17', source: 'sb-memtree', target: 'sb-kernel', ...secondaryEdge },
  { id: 'e18', source: 'sb-kernel', target: 'sb-evals', ...secondaryEdge },

  // Spiderbrain -> Execution
  { id: 'e19', source: 'sb-kernel', target: 'cp-copilot', ...defaultEdge },
  
  // Execution internal
  { id: 'e20', source: 'cp-copilot', target: 'cp-workflows', ...defaultEdge },
  { id: 'e21', source: 'cp-workflows', target: 'cp-audit', ...defaultEdge },
  { id: 'e22', source: 'cp-workflows', target: 'cp-hitl', ...warnEdge },

  // Execution -> Agents
  { id: 'e23', source: 'cp-hitl', target: 'agent-email', ...warnEdge },
  { id: 'e24', source: 'cp-hitl', target: 'agent-sales', ...warnEdge },
  { id: 'e25', source: 'cp-hitl', target: 'agent-privacy', ...warnEdge },
  { id: 'e26', source: 'cp-hitl', target: 'agent-reports', ...warnEdge },
  { id: 'e27', source: 'cp-hitl', target: 'agent-creative', ...warnEdge },

  // Agents -> Destinations
  { id: 'e28', source: 'agent-email', target: 'dest-reverse-etl', ...defaultEdge },
  { id: 'e29', source: 'agent-sales', target: 'dest-salesforce', ...defaultEdge },
  { id: 'e30', source: 'agent-reports', target: 'dest-slack', ...defaultEdge },
  { id: 'e31', source: 'agent-creative', target: 'dest-webhook', ...defaultEdge },
];

export default function InteractiveWorkflow() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback(
    (params: any) => setEdges((eds) => addEdge(params, eds)),
    [setEdges],
  );

  return (
    <div style={{ width: '100%', height: '100%', minHeight: 'calc(100vh - 120px)', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--grid-line-major)', position: 'relative' }}>
      <div className="studio-grid"></div>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
        minZoom={0.2}
        proOptions={{ hideAttribution: true }}
      >
        <Controls style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--grid-line-major)', fill: 'var(--text-loud)', zIndex: 10 }} />
      </ReactFlow>
    </div>
  );
}
