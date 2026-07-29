"use client";
import React, { useState, useEffect, useRef } from 'react';
import Sidebar from '@/components/Sidebar';
import ThemeToggle from '@/components/ThemeToggle';
import { 
  UploadCloud, 
  Database, 
  Workflow, 
  CheckCircle, 
  AlertTriangle, 
  FileText, 
  Layers, 
  Trash2, 
  Search, 
  RefreshCw,
  Clock,
  Compass,
  Cpu,
  BarChart,
  Grid,
  Lock,
  ArrowRight,
  Play,
  Check,
  HelpCircle,
  X
} from 'lucide-react';
import './ingestion.css';

interface WorkflowStageStatus {
  status: 'pending' | 'running' | 'completed' | 'failed' | 'paused' | 'skipped';
  updatedAt: string;
  data?: any;
  error?: string;
}

interface WorkflowLogEntry {
  timestamp: string;
  level: 'info' | 'success' | 'warning' | 'error';
  category: 'system' | 'connector' | 'api' | 'workflow' | 'validation' | 'metadata' | 'bronze' | 'worker' | 'ingestion' | 'connection';
  message: string;
}

interface WorkflowEntity {
  id: string;
  status: 'pending' | 'running' | 'paused_waiting_confirmation' | 'completed' | 'failed';
  currentStage: string;
  filePath: string;
  fileName: string;
  connectionName: string;
  connectorType: string;
  connectionId?: string;
  datasetId?: string;
  jobId?: string;
  stages: Record<string, WorkflowStageStatus>;
  logs: WorkflowLogEntry[];
  previewData?: {
    rows: Array<Record<string, any>>;
    schema: {
      fields: Array<{ name: string; type: string; nullable: boolean }>;
    };
    metadata: Record<string, any>;
  };
  validationReport?: {
    valid: boolean;
    issues: Array<{ field: string; severity: 'error' | 'warning' | 'info'; message: string }>;
    recordCount?: number;
  };
  createdAt: string;
  updatedAt: string;
}

const CONNECTORS = [
  { id: 'csv', name: 'CSV File', status: 'Active', description: 'Ingest local or network CSV datasets.' },
  { id: 'excel', name: 'Excel Spreadsheets', status: 'Active', description: 'Import workbook sheets (.xlsx, .xls).' },
  { id: 'json', name: 'JSON Docs', status: 'Active', description: 'Stream semi-structured document lists.' },
  { id: 'parquet', name: 'Apache Parquet', status: 'Active', description: 'High performance columnar datasets.' },
  { id: 'folder', name: 'Folder Upload', status: 'Active', description: 'Bulk ingest multi-file directory folders.' },
  { id: 's3', name: 'Amazon S3 Bucket', status: 'Coming Soon', description: 'Pull datasets directly from AWS S3.' },
  { id: 'azure', name: 'Azure Blob', status: 'Coming Soon', description: 'Ingest from Microsoft Cloud storage.' },
  { id: 'gcs', name: 'Google Cloud Storage', status: 'Coming Soon', description: 'Ingest from Google Cloud Storage.' },
  { id: 'kafka', name: 'Apache Kafka', status: 'Coming Soon', description: 'Connect real-time event streams.' },
  { id: 'postgres', name: 'PostgreSQL', status: 'Coming Soon', description: 'Direct database ingestion.' },
  { id: 'salesforce', name: 'Salesforce CRM', status: 'Coming Soon', description: 'Sync sales and accounts data.' },
  { id: 'hubspot', name: 'HubSpot', status: 'Coming Soon', description: 'Sync lead and contacts directory.' },
];

const HELP_CONCEPTS = [
  { term: 'Bronze Layer', definition: 'The raw ingestion layer in the lakehouse. Data is stored in its original format (NDJSON) as an immutable audit history.' },
  { term: 'Silver Layer', definition: 'The cleaned, transformed, and deduplicated layer. Sourced from Bronze, columns are normalized and duplicate rows resolved.' },
  { term: 'Gold Layer', definition: 'The business aggregate layer. Aggregates and clean dimension tables optimized for BI queries and analytical reporting.' },
  { term: 'Deduplication', definition: 'The process of identifying duplicate records and merging them based on attributes, timestamp recency, and field density.' },
  { term: 'Identity Resolution', definition: 'The linking of multiple records to build a Customer 360 profile, utilizing identifiers like emails and phone numbers.' },
  { term: 'Apache Parquet', definition: 'A high-performance columnar storage format. Compresses data efficiently and speeds up analytic query execution.' },
  { term: 'Delta Lake', definition: 'An open-source storage framework that brings ACID transactions and history versioning logs to object store pools.' },
  { term: 'PII Identification', definition: 'Automatic detection of Personally Identifiable Information (emails, phones, addresses) to enforce access policies.' },
];

const getStageExplanation = (stage?: string, fileName?: string) => {
  const fName = fileName || 'dataset.csv';
  switch (stage) {
    case 'choose_connector':
      return `Loads the generic ConnectorPlugin interface to resolve connection parameters.`;
    case 'configure_connection':
      return `ConnectionManager instantiates connection record profile and registers keys.`;
    case 'test_connection':
      return `Performs a health check ping to ensure credentials are valid.`;
    case 'upload_cloud_r2':
      return `Streams bytes to the selected cloud storage adapter (R2, S3, or local workspace).`;
    case 'discover_dataset':
      return `Scans storage file systems and registers dataset catalogs.`;
    case 'preview_dataset':
      return `Pipes the first 100 lines for validation and preview grid rendering.`;
    case 'schema_detection':
      return `Infers data types (string, integer, number, boolean, timestamp) for headers.`;
    case 'validation':
      return `Validates required fields, checks for duplicate rows, missing cells, and PII keys.`;
    case 'register_dataset':
      return `Registers logical schema definition targets.`;
    case 'metadata_catalog':
      return `Logs details (file size, delimiters, encoding) in the central metadata catalog.`;
    case 'run_ingestion':
      return `Enqueues ingestion job task inside background worker queues.`;
    case 'bronze_storage':
      return `Streams source data row-by-row into NDJSON file formats in the Bronze layer.`;
    case 'transformation':
      return `Normalizes strings, normalizes phone/email formatting, and converts datatypes.`;
    case 'identity_resolution':
      return `Clusters records using contact keys to create unified profile graphs.`;
    case 'deduplication':
      return `Prunes redundant rows, keeping latest timestamps and dense non-null profiles.`;
    case 'silver_storage':
      return `Writes the cleaned, unified records to the Silver directory.`;
    case 'parquet_export':
      return `Columnarizes records and compiles target Parquet, Delta Lake, or Iceberg blocks.`;
    case 'statistics':
      return `Aggregates pipeline execution latencies, compression ratios, and row counts.`;
    default:
      return `Awaiting connection initialization. Initiate file upload to run the state machine.`;
  }
};

export default function IngestionPage() {
  const [selectedConnector, setSelectedConnector] = useState('csv');
  const [storageType, setStorageType] = useState('r2');
  const [bucketName, setBucketName] = useState('conductor-raw-lake');
  const [endpoint, setEndpoint] = useState('');
  const [region, setRegion] = useState('us-east-1');
  const [accessKey, setAccessKey] = useState('');
  const [secretKey, setSecretKey] = useState('');
  const [pathPrefix, setPathPrefix] = useState('');
  const [outputFormat, setOutputFormat] = useState('parquet');

  const [file, setFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedPath, setUploadedPath] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);

  const [folderFiles, setFolderFiles] = useState<Array<{ name: string; size: number; checked: boolean; type: string; fileObject?: File }>>([]);
  const [activeFileIndex, setActiveFileIndex] = useState<number>(0);

  const [gridSearch, setGridSearch] = useState('');
  const [gridSortColumn, setGridSortColumn] = useState('');
  const [gridSortDirection, setGridSortDirection] = useState<'asc' | 'desc'>('asc');
  const [hiddenColumns, setHiddenColumns] = useState<string[]>([]);
  const [showHelpCenter, setShowHelpCenter] = useState(true);

  const [workflow, setWorkflow] = useState<WorkflowEntity | null>(null);
  const [workflowId, setWorkflowId] = useState<string>('');
  const [isConfirming, setIsConfirming] = useState(false);
  const [logsFilter, setLogsFilter] = useState<string>('all');

  const terminalEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [workflow?.logs]);

  useEffect(() => {
    if (!workflowId) return;

    let pollInterval: NodeJS.Timeout;

    const pollWorkflowStatus = async () => {
      try {
        const response = await fetch(`/api/v1/workflows/${workflowId}`);
        if (!response.ok) {
          console.warn(`[Ingestion] Workflow ${workflowId} not found or failed to fetch. Stopping polling.`);
          clearInterval(pollInterval);
          return;
        }
        const data = await response.json() as WorkflowEntity;
        setWorkflow(data);

        if (
          data.status === 'completed' ||
          data.status === 'failed' ||
          data.status === 'paused_waiting_confirmation'
        ) {
          clearInterval(pollInterval);
        }
      } catch (error) {
        console.error('Polling error:', error);
      }
    };

    pollWorkflowStatus();
    pollInterval = setInterval(pollWorkflowStatus, 1000);

    return () => clearInterval(pollInterval);
  }, [workflowId, workflow?.status]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files) {
      processSelectedFiles(e.dataTransfer.files);
    }
  };

  const triggerBrowse = () => {
    fileInputRef.current?.click();
  };

  const resetFile = () => {
    setFile(null);
    setUploadedPath('');
    setWorkflow(null);
    setWorkflowId('');
    setUploadProgress(0);
    setFolderFiles([]);
  };

  const processSelectedFiles = (files: FileList) => {
    if (files.length === 0) return;

    if (selectedConnector === 'folder' || files.length > 1) {
      const fileList = Array.from(files).map(f => ({
        name: f.name,
        size: f.size,
        checked: true,
        type: f.name.split('.').pop() || 'csv',
        fileObject: f
      }));
      setFolderFiles(fileList);
      setFile(files[0]);
      if (files.length > 1 && selectedConnector !== 'folder') {
        setSelectedConnector('folder');
      }
    } else {
      setFile(files[0]);
    }
  };

  const loadMockFolderWorkspace = () => {
    setSelectedConnector('folder');
    setTimeout(() => {
      fileInputRef.current?.click();
    }, 150);
  };

  const uploadFile = async () => {
    const filesToUpload = selectedConnector === 'folder' && folderFiles.length > 0
      ? folderFiles.filter(f => f.checked && f.fileObject).map(f => f.fileObject!)
      : [file].filter(Boolean) as File[];

    if (filesToUpload.length === 0) return;

    setIsUploading(true);
    setUploadProgress(10);

    const configParam = {
      bucket: bucketName,
      endpoint,
      region,
      accessKeyId: accessKey,
      secretAccessKey: secretKey,
      pathPrefix,
    };

    try {
      let completedCount = 0;
      let lastUploadedPath = '';

      for (const currentFile of filesToUpload) {
        const formData = new FormData();
        formData.append('file', currentFile);

        const url = `/api/v1/uploads/${selectedConnector}?storageType=${storageType}&storageConfig=${encodeURIComponent(JSON.stringify(configParam))}`;
        const response = await fetch(url, {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error(`Upload failed for ${currentFile.name} with status ${response.status}`);
        }

        const result = await response.json();
        lastUploadedPath = result.path;
        
        completedCount++;
        setUploadProgress(Math.round((completedCount / filesToUpload.length) * 90) + 10);
      }

      setUploadProgress(100);
      setUploadedPath(lastUploadedPath);
      setIsUploading(false);
    } catch (error) {
      console.error(error);
      setIsUploading(false);
      alert('Upload failed: ' + (error as Error).message);
    }
  };

  const startWorkflow = async () => {
    if (!uploadedPath) return;

    try {
      const response = await fetch('/api/v1/workflows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filePath: uploadedPath,
          fileName: file?.name || 'uploaded_data.csv',
          connectionName: 'CSV Ingestion Platform',
          connectorType: selectedConnector,
          storageType,
          outputFormat,
          selectedFiles: folderFiles.filter(f => f.checked).map(f => f.name),
        }),
      });

      if (!response.ok) throw new Error('Start workflow failed');
      const data = await response.json() as WorkflowEntity;
      setWorkflow(data);
      setWorkflowId(data.id);
    } catch (error) {
      console.error(error);
      alert('Failed to start ingestion workflow: ' + (error as Error).message);
    }
  };

  const confirmSchema = async () => {
    if (!workflowId) return;

    setIsConfirming(true);
    try {
      const response = await fetch(`/api/v1/workflows/${workflowId}/confirm`, {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Confirmation failed');
      const data = await response.json() as WorkflowEntity;
      setWorkflow(data);
      setWorkflowId('');
      setTimeout(() => setWorkflowId(data.id), 100);
    } catch (error) {
      console.error(error);
      alert('Confirmation failed: ' + (error as Error).message);
    } finally {
      setIsConfirming(false);
    }
  };

  const getStepStatus = (stepIndex: number) => {
    if (!workflow) return 'muted';

    if (stepIndex === 1) {
      if (workflow.status === 'failed' && (workflow.currentStage === 'choose_connector' || workflow.currentStage === 'configure_connection')) return 'failed';
      return uploadedPath ? 'completed' : 'active';
    }

    if (stepIndex === 2) {
      if (!uploadedPath) return 'muted';
      if (workflow.status === 'failed' && workflow.currentStage === 'test_connection') return 'failed';
      if (workflow.connectionId) return 'completed';
      return workflow.currentStage === 'test_connection' ? 'active' : 'muted';
    }

    if (stepIndex === 3) {
      if (!workflow.connectionId) return 'muted';
      if (workflow.status === 'failed' && ['discover_dataset', 'preview_dataset', 'schema_detection', 'validation', 'register_dataset', 'metadata_catalog'].includes(workflow.currentStage)) return 'failed';
      if (workflow.status === 'paused_waiting_confirmation' || workflow.stages['metadata_catalog'].status === 'completed') return 'completed';
      return ['discover_dataset', 'preview_dataset', 'schema_detection', 'validation', 'register_dataset', 'metadata_catalog'].includes(workflow.currentStage) ? 'active' : 'muted';
    }

    if (stepIndex === 4) {
      if (workflow.status === 'paused_waiting_confirmation') return 'paused';
      if (workflow.status === 'completed') return 'completed';
      const ingestStages = ['run_ingestion', 'bronze_storage', 'transformation', 'identity_resolution', 'deduplication', 'silver_storage', 'parquet_export', 'statistics'];
      if (workflow.status === 'failed' && ingestStages.includes(workflow.currentStage)) return 'failed';
      return (workflow.status === 'running' || ingestStages.includes(workflow.currentStage)) ? 'active' : 'muted';
    }

    return 'muted';
  };

  const getLogCategoryColor = (category: string) => {
    switch (category) {
      case 'system': return '#38bdf8';
      case 'connector': return '#fbbf24';
      case 'connection': return '#f43f5e';
      case 'api': return '#a855f7';
      case 'workflow': return '#60a5fa';
      case 'validation': return '#ec4899';
      case 'metadata': return '#14b8a6';
      case 'bronze': return '#10b981';
      case 'worker': return '#f97316';
      case 'ingestion': return '#6366f1';
      default: return '#94a3b8';
    }
  };

  const filteredLogs = workflow?.logs.filter((log) => {
    if (logsFilter === 'all') return true;
    return log.level === logsFilter;
  }) || [];

  return (
    <div className="app-layout" style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      
      <main className="main-content" style={{ flex: 1, paddingLeft: '280px', overflowY: 'auto' }}>
        <header className="top-header">
          <div className="header-breadcrumbs">
            <span className="muted">Platform</span> / <span className="active-breadcrumb">Data Ingestion</span>
          </div>
          <div className="header-actions">
            <button className="theme-toggle-btn" style={{ display: 'flex', alignItems: 'center', gap: '6px' }} onClick={() => setShowHelpCenter(s => !s)}>
              <HelpCircle size={14} /> Help Center
            </button>
            <ThemeToggle />
            <div className="avatar">AD</div>
          </div>
        </header>

        <div className="ingestion-wrapper">
          {/* Stepper Wizard Row */}
          <div className="stepper-container">
            <div className={`step-card ${getStepStatus(1)}`}>
              <div className="step-number">1</div>
              <div className="step-info">
                <h4>Connection</h4>
                <p>{uploadedPath ? 'Connected' : 'Select connection source'}</p>
              </div>
            </div>
            <div className={`step-card ${getStepStatus(2)}`}>
              <div className="step-number">2</div>
              <div className="step-info">
                <h4>Discovery</h4>
                <p>{workflow?.connectionId ? 'Discovered' : 'Scan target storage'}</p>
              </div>
            </div>
            <div className={`step-card ${getStepStatus(3)}`}>
              <div className="step-number">3</div>
              <div className="step-info">
                <h4>Validation</h4>
                <p>{workflow?.status === 'paused_waiting_confirmation' ? 'Ready to confirm' : 'Auditing schema'}</p>
              </div>
            </div>
            <div className={`step-card ${getStepStatus(4)}`}>
              <div className="step-number">4</div>
              <div className="step-info">
                <h4>Ingestion</h4>
                <p>{workflow?.status === 'completed' ? 'Successfully ingested' : 'Loading to lakehouse'}</p>
              </div>
            </div>
          </div>

          <div className="ingestion-panel">
            {/* Left Main Section */}
            <div className="panel-left">
              
              {/* Connector Selector Card */}
              {workflow?.status !== 'completed' && (
                <section className="card-panel">
                  <div className="card-panel-header">
                    <h3>Choose Connector</h3>
                    <p>Select the enterprise connector configuration model.</p>
                  </div>
                  <div className="connectors-list">
                    {CONNECTORS.map((c) => (
                      <div 
                        key={c.id} 
                        className={`connector-item ${selectedConnector === c.id ? 'active' : ''} ${c.status !== 'Active' ? 'disabled' : ''}`}
                        onClick={() => c.status === 'Active' && setSelectedConnector(c.id)}
                      >
                        <div className="connector-title-row">
                          <strong>{c.name}</strong>
                          <span className={`badge-status ${c.status === 'Active' ? 'active' : 'soon'}`}>
                            {c.status}
                          </span>
                        </div>
                        <p>{c.description}</p>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Upload Panel / Success Panel */}
              <section className="card-panel">
                <div className="card-panel-header">
                  <h3>{workflow?.status === 'completed' ? 'Telemetry Dashboard' : 'Upload Data'}</h3>
                  <p>Stream records through modular storage adapters and target format compression exporters.</p>
                </div>

                {workflow?.status === 'completed' ? (
                  <div className="success-content">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', background: 'rgba(92, 177, 152, 0.08)', border: '1px solid rgba(92, 177, 152, 0.3)', padding: '20px', borderRadius: '12px', marginBottom: '24px' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'var(--accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Check size={20} style={{ color: 'var(--bg-app)' }} />
                      </div>
                      <div>
                        <h4 style={{ color: 'var(--text-loud)', fontSize: '15px', fontWeight: '600', marginBottom: '2px' }}>Ingestion Completed Successfully</h4>
                        <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Dataset successfully registered and loaded into Bronze Lake.</p>
                      </div>
                    </div>

                    <div className="storage-paths-display" style={{ display: 'flex', flexDirection: 'column', gap: '8px', background: 'var(--bg-app)', padding: '16px', borderRadius: '8px', border: '1px solid var(--grid-line-major)', fontSize: '13px', fontFamily: 'monospace' }}>
                      <div><strong style={{ color: 'var(--text-loud)' }}>Bronze Path:</strong> {workflow.stages['bronze_storage']?.data?.bronzePath || 'N/A'}</div>
                      <div><strong style={{ color: 'var(--text-loud)' }}>Silver Path:</strong> {workflow.stages['statistics']?.data?.silverPath || 'N/A'}</div>
                      <div><strong style={{ color: 'var(--text-loud)' }}>Target Export Path:</strong> {workflow.stages['statistics']?.data?.parquetPath || 'N/A'}</div>
                    </div>

                    {workflow.stages['statistics']?.data && (
                      <div>
                        {workflow.stages['statistics'].data.childResults && (
                          <div className="folder-child-results" style={{ marginTop: '24px', background: 'rgba(15, 22, 30, 0.5)', padding: '16px', borderRadius: '8px', border: '1px solid var(--grid-line-major)' }}>
                            <h5 style={{ margin: '0 0 12px', fontSize: '13px', color: 'var(--text-loud)', textTransform: 'uppercase' }}>Folder Files Processed</h5>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                              {workflow.stages['statistics'].data.childResults.map((child: any, cIdx: number) => (
                                <div key={cIdx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', borderBottom: '1px solid var(--grid-line-minor)', paddingBottom: '6px' }}>
                                  <span>📄 <strong>{child.name}</strong> ({child.format.toUpperCase()})</span>
                                  <span style={{ color: 'var(--accent-primary)' }}>{child.validCount} rows ingested • Pruned {child.duplicatesPruned}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="success-metrics-grid">
                          <div className="metric-card">
                            <span className="metric-card-label">Rows Processed</span>
                            <span className="metric-card-value">{workflow.stages['statistics'].data.rowsUploaded}</span>
                          </div>
                          <div className="metric-card">
                            <span className="metric-card-label">Valid Rows</span>
                            <span className="metric-card-value" style={{ color: 'var(--accent-primary)' }}>{workflow.stages['statistics'].data.rowsValid}</span>
                          </div>
                          <div className="metric-card">
                            <span className="metric-card-label">Pruned Duplicates</span>
                            <span className="metric-card-value" style={{ color: 'var(--accent-secondary)' }}>{workflow.stages['statistics'].data.duplicatesFound}</span>
                          </div>
                        </div>

                        <div className="success-metrics-grid">
                          <div className="metric-card">
                            <span className="metric-card-label">Profiles Stitching</span>
                            <span className="metric-card-value">{workflow.stages['statistics'].data.profilesCreated}</span>
                          </div>
                          <div className="metric-card">
                            <span className="metric-card-label">Export Size</span>
                            <span className="metric-card-value">{(workflow.stages['statistics'].data.parquetSize / 1024).toFixed(2)} KB</span>
                          </div>
                          <div className="metric-card">
                            <span className="metric-card-label">Compression Ratio</span>
                            <span className="metric-card-value">{workflow.stages['statistics'].data.compressionRatio}x</span>
                          </div>
                        </div>

                        <h5 style={{ margin: '24px 0 12px', fontSize: '13px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Ingestion Engine Latency</h5>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', background: 'var(--bg-app)', padding: '16px', borderRadius: '8px', border: '1px solid var(--grid-line-major)', textAlign: 'center', fontSize: '13px' }}>
                          <div>
                            <div style={{ color: 'var(--text-muted)' }}>Validation</div>
                            <div style={{ fontWeight: '600', marginTop: '4px', color: 'var(--text-loud)' }}>{workflow.stages['statistics'].data.validationTimeMs}ms</div>
                          </div>
                          <div>
                            <div style={{ color: 'var(--text-muted)' }}>Transformation</div>
                            <div style={{ fontWeight: '600', marginTop: '4px', color: 'var(--text-loud)' }}>{workflow.stages['statistics'].data.transformationTimeMs}ms</div>
                          </div>
                          <div>
                            <div style={{ color: 'var(--text-muted)' }}>Identity Matching</div>
                            <div style={{ fontWeight: '600', marginTop: '4px', color: 'var(--text-loud)' }}>{workflow.stages['statistics'].data.identityResolutionTimeMs}ms</div>
                          </div>
                          <div>
                            <div style={{ color: 'var(--text-muted)' }}>Overall Ingestion</div>
                            <div style={{ fontWeight: '600', marginTop: '4px', color: 'var(--accent-primary)' }}>{(workflow.stages['statistics'].data.overallPipelineTimeMs / 1000).toFixed(2)}s</div>
                          </div>
                        </div>
                      </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px' }}>
                      <button className="btn-outline" onClick={resetFile}>Ingest Another File</button>
                    </div>
                  </div>
                ) : (
                  <div>
                    {/* Storage Config Section */}
                    <div style={{ marginBottom: '24px' }}>
                      <h4 className="form-section-title">Storage Destination</h4>
                      <div className="storage-grid-selectors">
                        {['r2', 'local', 's3', 'azure', 'gcs'].map(p => (
                          <button 
                            key={p} 
                            className={`storage-selector-btn ${storageType === p ? 'active' : ''}`} 
                            onClick={() => setStorageType(p)}
                          >
                            {p}
                          </button>
                        ))}
                      </div>

                      {storageType !== 'local' && (
                        <div className="storage-config-fields">
                          <div className="config-field-group">
                            <label>Bucket / Container Name</label>
                            <input className="config-input" value={bucketName} onChange={e => setBucketName(e.target.value)} />
                          </div>
                          <div className="config-field-group">
                            <label>Region</label>
                            <input className="config-input" value={region} onChange={e => setRegion(e.target.value)} />
                          </div>
                          <div className="config-field-group">
                            <label>Endpoint URL (Custom)</label>
                            <input className="config-input" placeholder="https://endpoint-url.com" value={endpoint} onChange={e => setEndpoint(e.target.value)} />
                          </div>
                          <div className="config-field-group">
                            <label>Target Folder Prefix</label>
                            <input className="config-input" placeholder="prefix/" value={pathPrefix} onChange={e => setPathPrefix(e.target.value)} />
                          </div>
                          <div className="config-field-group">
                            <label>Access Key ID</label>
                            <input className="config-input" type="password" value={accessKey} onChange={e => setAccessKey(e.target.value)} />
                          </div>
                          <div className="config-field-group">
                            <label>Secret Access Key</label>
                            <input className="config-input" type="password" value={secretKey} onChange={e => setSecretKey(e.target.value)} />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Output Format Select */}
                    <div style={{ marginBottom: '24px' }}>
                      <h4 className="form-section-title">Target Export Format</h4>
                      <div className="storage-grid-selectors">
                        {['parquet', 'delta', 'iceberg', 'csv', 'json'].map(f => (
                          <button 
                            key={f} 
                            className={`storage-selector-btn ${outputFormat === f ? 'active' : ''}`} 
                            onClick={() => setOutputFormat(f)}
                          >
                            {f}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* File uploads section */}
                    {selectedConnector === 'folder' && folderFiles.length > 0 ? (
                      <div className="folder-explorer">
                        <div className="explorer-sidebar">
                          <div className="explorer-title">📁 Workspace Folder</div>
                          <ul className="explorer-list">
                            {folderFiles.map((f, idx) => (
                              <li 
                                key={idx} 
                                className={`explorer-item ${activeFileIndex === idx ? 'active' : ''}`}
                                onClick={() => setActiveFileIndex(idx)}
                              >
                                <input 
                                  type="checkbox" 
                                  checked={f.checked}
                                  onChange={(e) => {
                                    e.stopPropagation();
                                    const copy = [...folderFiles];
                                    copy[idx].checked = e.target.checked;
                                    setFolderFiles(copy);
                                  }}
                                />
                                <span>📄 {f.name}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div className="explorer-content">
                          <h4 style={{ color: 'var(--text-loud)', fontSize: '14px', marginBottom: '4px' }}>File Details: {folderFiles[activeFileIndex].name}</h4>
                          <p style={{ color: 'var(--text-muted)', fontSize: '12px', marginBottom: '16px' }}>
                            Type: {folderFiles[activeFileIndex].type.toUpperCase()} • Size: {(folderFiles[activeFileIndex].size / 1024).toFixed(1)} KB • Target: Ingestion Silver
                          </p>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button className="btn-primary" onClick={uploadFile} disabled={!!uploadedPath}>Load Ingestion Data</button>
                            <button className="btn-outline" onClick={resetFile}>Clear Folder</button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div 
                        className={`file-dropzone ${isDragOver ? 'drag-over' : ''}`}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onClick={!file ? triggerBrowse : undefined}
                      >
                        <input 
                          type="file" 
                          ref={fileInputRef} 
                          style={{ display: 'none' }} 
                          {...(selectedConnector === 'folder' ? {
                            webkitdirectory: "true",
                            directory: "true",
                            multiple: true
                          } as any : {
                            multiple: true
                          })}
                          onChange={(e) => {
                            if (e.target.files) {
                              processSelectedFiles(e.target.files);
                            }
                          }} 
                        />
                        
                        <div className="dropzone-inner">
                          <UploadCloud size={40} className="upload-icon" />
                          {file ? (
                            <div className="file-details-card" style={{ width: '100%', maxWidth: '400px' }} onClick={e => e.stopPropagation()}>
                              <div className="file-info">
                                <FileText size={20} className="upload-icon" />
                                <div className="file-meta" style={{ textAlign: 'left' }}>
                                  <h5>{file.name}</h5>
                                  <p>{(file.size / 1024).toFixed(2)} KB — Ready</p>
                                </div>
                              </div>
                              <button className="btn-remove-file" onClick={resetFile}>Remove</button>
                            </div>
                          ) : (
                            <>
                              <p className="dropzone-text">Drag any CSV, Excel, or JSON file here, or <span>click to browse</span></p>
                              <p className="dropzone-subtext">Supported formats: .csv, .xlsx, .xls, .json, .parquet</p>
                            </>
                          )}
                        </div>

                        {isUploading && (
                          <div className="upload-progress-layer">
                            <div className="progress-track">
                              <div className="progress-fill" style={{ width: `${uploadProgress}%` }}></div>
                            </div>
                            <p style={{ fontSize: '13px', color: 'var(--text-loud)' }}>Uploading to storage adapter... {uploadProgress}%</p>
                          </div>
                        )}
                      </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px' }}>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        {file && <div>File Selected: <span style={{ color: 'var(--accent-primary)', fontWeight: '600' }}>{file.name}</span></div>}
                        {uploadedPath && <div>Storage Status: <span style={{ color: 'var(--accent-primary)', fontWeight: '600' }}>Uploaded to Cloud Store</span></div>}
                      </div>

                      <div style={{ display: 'flex', gap: '8px' }}>
                        {selectedConnector === 'folder' && folderFiles.length === 0 && (
                          <button className="btn-outline" onClick={loadMockFolderWorkspace}>Load Ingestion Folder</button>
                        )}
                        {selectedConnector !== 'folder' && (
                          <button 
                            className="btn-primary" 
                            onClick={uploadFile} 
                            disabled={!file || !!uploadedPath || isUploading}
                          >
                            Upload File
                          </button>
                        )}
                        <button 
                          className="btn-primary" 
                          onClick={startWorkflow} 
                          disabled={!uploadedPath || !!workflow}
                        >
                          Create Connection
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </section>

              {/* Data Preview / Schema Inspector */}
              {workflow?.status === 'paused_waiting_confirmation' && workflow.previewData && (
                <section className="card-panel">
                  <div className="card-panel-header">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h3>Draft Catalog Registry Confirmation</h3>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span className="badge-status active" style={{ animation: 'pulse 2s infinite' }}>Awaiting Confirmation</span>
                        <button 
                          className="btn-primary" 
                          onClick={confirmSchema}
                          disabled={isConfirming}
                          style={{ padding: '6px 14px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}
                        >
                          <Play size={12} /> Confirm & Ingest
                        </button>
                      </div>
                    </div>
                    <p>Verify inferred schema types, validation reports, and raw content preview before ingesting to Bronze Lake.</p>
                  </div>

                  {workflow.validationReport && (
                    <div className={`validation-alert-box ${workflow.validationReport.valid ? 'valid' : 'invalid'}`}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '700', fontSize: '13px' }}>
                        {workflow.validationReport.valid ? (
                          <CheckCircle size={16} style={{ color: 'var(--accent-primary)' }} />
                        ) : (
                          <AlertTriangle size={16} style={{ color: 'var(--accent-secondary)' }} />
                        )}
                        <span>
                          {workflow.validationReport.valid 
                            ? '✓ Validation Passed. No critical structural anomalies detected.' 
                            : '⚠ Structure Warning. Non-blocking anomalies detected in source.'
                          }
                        </span>
                      </div>
                      {workflow.validationReport.issues.length > 0 && (
                        <ul className="alert-issues-list">
                          {workflow.validationReport.issues.map((issue, idx) => (
                            <li key={idx} className={issue.severity}>
                              [{issue.severity.toUpperCase()}] {issue.message}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}

                  <div className="success-metrics-grid" style={{ marginBottom: '24px' }}>
                    <div className="metric-card">
                      <span className="metric-card-label">Estimated Rows</span>
                      <span className="metric-card-value">{workflow.validationReport?.recordCount || workflow.previewData.metadata.rowCount}</span>
                    </div>
                    <div className="metric-card">
                      <span className="metric-card-label">Delimiter</span>
                      <span className="metric-card-value">"{workflow.previewData.metadata.delimiter}"</span>
                    </div>
                    <div className="metric-card">
                      <span className="metric-card-label">Encoding</span>
                      <span className="metric-card-value">{workflow.previewData.metadata.encoding}</span>
                    </div>
                  </div>

                  <div className="preview-table-section">
                    <div className="preview-controls">
                      <div className="search-input-box">
                        <Search size={14} style={{ color: 'var(--text-muted)' }} />
                        <input 
                          placeholder="Search preview grid records..." 
                          value={gridSearch}
                          onChange={(e) => setGridSearch(e.target.value)}
                        />
                      </div>
                      <div className="column-toggles">
                        {workflow.previewData.schema.fields.map((field) => (
                          <button 
                            key={field.name}
                            className={`col-toggle-btn ${hiddenColumns.includes(field.name) ? 'hidden' : ''}`}
                            onClick={() => {
                              setHiddenColumns(prev => 
                                prev.includes(field.name) 
                                  ? prev.filter(c => c !== field.name) 
                                  : [...prev, field.name]
                              );
                            }}
                          >
                            {field.name}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="table-wrapper">
                      <table>
                        <thead>
                          <tr>
                            {workflow.previewData.schema.fields.filter(f => !hiddenColumns.includes(f.name)).map((field, idx) => (
                              <th 
                                key={idx} 
                                onClick={() => {
                                  setGridSortColumn(field.name);
                                  setGridSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
                                }}
                                style={{ cursor: 'pointer' }}
                              >
                                {field.name} {gridSortColumn === field.name ? (gridSortDirection === 'asc' ? '▲' : '▼') : ''}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {(() => {
                            let displayRows = [...workflow.previewData.rows];
                            
                            if (gridSearch) {
                              displayRows = displayRows.filter(row => 
                                Object.values(row).some(val => 
                                  String(val ?? '').toLowerCase().includes(gridSearch.toLowerCase())
                                )
                              );
                            }

                            if (gridSortColumn) {
                              displayRows.sort((a, b) => {
                                const valA = String(a[gridSortColumn] ?? '');
                                const valB = String(b[gridSortColumn] ?? '');
                                return gridSortDirection === 'asc' 
                                  ? valA.localeCompare(valB) 
                                  : valB.localeCompare(valA);
                              });
                            }

                            return displayRows.slice(0, 50).map((row, rowIdx) => (
                              <tr key={rowIdx}>
                                {workflow.previewData!.schema.fields.filter(f => !hiddenColumns.includes(f.name)).map((field, colIdx) => {
                                  const val = row[field.name];
                                  const isPii = ['email', 'phone', 'ssn', 'credit_card', 'salary', 'password', 'mobile'].includes(field.name.toLowerCase());
                                  const isNull = val === null || val === undefined || val === '';
                                  return (
                                    <td key={colIdx}>
                                      {isNull ? <span className="null-placeholder">NULL</span> : String(val)}
                                      {isPii && <span className="pii-badge">PII</span>}
                                    </td>
                                  );
                                })}
                              </tr>
                            ));
                          })()}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="action-row-btn">
                    <button 
                      className="btn-primary" 
                      onClick={confirmSchema}
                      disabled={isConfirming}
                    >
                      {isConfirming ? 'Processing Ingestion...' : 'Confirm Schema & Ingest'}
                    </button>
                  </div>
                </section>
              )}
            </div>

            {/* Right Orchestrator Log console */}
            <div className="panel-right">
              <section className="terminal-console">
                <div className="terminal-header">
                  <h3>Ingestion Log Console</h3>
                  <select 
                    style={{ background: 'var(--bg-app)', border: '1px solid var(--grid-line-major)', color: 'var(--text-loud)', fontSize: '10px', padding: '2px 8px', borderRadius: '4px' }}
                    onChange={e => setLogsFilter(e.target.value)}
                    value={logsFilter}
                  >
                    <option value="all">ALL LEVELS</option>
                    <option value="info">INFO</option>
                    <option value="success">SUCCESS</option>
                    <option value="warning">WARNING</option>
                    <option value="error">ERROR</option>
                  </select>
                </div>
                
                <div className="terminal-logs">
                  {filteredLogs.length > 0 ? (
                    filteredLogs.map((log, idx) => (
                      <div key={idx} className="log-entry">
                        <span className="log-timestamp">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                        <span className="log-category" style={{ color: getLogCategoryColor(log.category) }}>
                          {log.category.toUpperCase()}
                        </span>
                        <span className="log-message" style={{ color: log.level === 'error' ? '#ef4444' : log.level === 'success' ? 'var(--accent-primary)' : log.level === 'warning' ? 'var(--accent-secondary)' : '#e2e8f0' }}>
                          {log.message}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
                      Console ready. Start a data connection to stream active orchestrator logs.
                    </div>
                  )}
                  <div ref={terminalEndRef}></div>
                </div>
              </section>

              {/* Explanations section */}
              <section className="card-panel" style={{ padding: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <Cpu size={16} className="upload-icon" />
                  <h4 style={{ fontSize: '12px', textTransform: 'uppercase', color: 'var(--text-loud)' }}>Active Orchestrator Stage</h4>
                </div>
                <strong style={{ color: 'var(--accent-primary)', fontSize: '13px', display: 'block', marginBottom: '6px' }}>
                  {workflow ? workflow.currentStage.replace(/_/g, ' ').toUpperCase() : 'AWAITING CONNECTION'}
                </strong>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                  {getStageExplanation(workflow?.currentStage, file?.name)}
                </p>
              </section>
            </div>
          </div>
        </div>
      </main>

      {/* Collapsible sidebar */}
      <aside className={`help-center-sidebar ${showHelpCenter ? 'open' : ''}`}>
        <div className="help-center-header">
          <h3 style={{ margin: 0, fontSize: '14px', color: 'var(--text-loud)' }}>Ingestion Knowledge Center</h3>
          <button className="btn-close-drawer" onClick={() => setShowHelpCenter(false)}><X size={16} /></button>
        </div>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px' }}>
          Interactive guide detailing standard lakehouse pipeline storage architectures.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {HELP_CONCEPTS.map((concept, idx) => (
            <div key={idx} className="help-concept-box">
              <div className="help-concept-title" style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-loud)' }}>{concept.term}</div>
              <div className="help-concept-desc" style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px', lineHeight: '1.4' }}>{concept.definition}</div>
            </div>
          ))}
        </div>
      </aside>

      {/* Floating Help Center Tab (Visible only when drawer is closed) */}
      {!showHelpCenter && (
        <button 
          className="floating-help-tab" 
          onClick={() => setShowHelpCenter(true)}
          title="Open Ingestion Knowledge Center"
        >
          <HelpCircle size={14} style={{ marginBottom: '4px' }} />
          <span>HELP CENTER</span>
        </button>
      )}
    </div>
  );
}
