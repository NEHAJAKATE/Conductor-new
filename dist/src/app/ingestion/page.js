"use client";
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = IngestionPage;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const Sidebar_1 = __importDefault(require("@/components/Sidebar"));
const ThemeToggle_1 = __importDefault(require("@/components/ThemeToggle"));
const lucide_react_1 = require("lucide-react");
require("./ingestion.css");
const CONNECTORS = [
    { id: 'csv', name: 'CSV Files', status: 'Active', description: 'Ingest local or network comma-separated datasets.' },
    { id: 'excel', name: 'Excel Workbook', status: 'Active', description: 'Import spreadsheets (.xlsx, .xls) sheets.' },
    { id: 'json', name: 'JSON Records', status: 'Active', description: 'Stream raw semi-structured document lists.' },
    { id: 'parquet', name: 'Apache Parquet', status: 'Active', description: 'High performance compressed columnar formats.' },
    { id: 'folder', name: 'Directory Ingest', status: 'Active', description: 'Bulk ingest multi-file local/network folders.' },
    { id: 's3', name: 'Amazon S3', status: 'Active', description: 'Pull cohorts from AWS S3 storage buckets.' },
    { id: 'r2', name: 'Cloudflare R2', status: 'Active', description: 'Stream objects from Cloudflare global cache.' },
    { id: 'azure', name: 'Azure Blob', status: 'Active', description: 'Ingest files from Microsoft Azure containers.' },
    { id: 'gcs', name: 'Google Cloud Storage', status: 'Active', description: 'Import datasets from Google Cloud Storage.' },
    { id: 'sftp', name: 'SFTP Gateway', status: 'Active', description: 'Secure FTP file sync on cron schedules.' },
    { id: 'rest_api', name: 'REST API Pull', status: 'Active', description: 'Pull datasets via GET/POST HTTP endpoints.' },
    { id: 'webhook', name: 'Webhooks', status: 'Active', description: 'Real-time event streams listener.' },
    { id: 'postgres', name: 'PostgreSQL DB', status: 'Active', description: 'Sync tables using logical replication.' },
    { id: 'mysql', name: 'MySQL DB', status: 'Active', description: 'Read database tables dynamically.' },
    { id: 'mongodb', name: 'MongoDB', status: 'Active', description: 'Ingest documents from collection snapshots.' },
    { id: 'bigquery', name: 'Google BigQuery', status: 'Active', description: 'Query and pull from enterprise warehouses.' },
    { id: 'snowflake', name: 'Snowflake', status: 'Active', description: 'Sync customer tables from Snowflake Cortex.' },
    { id: 'salesforce', name: 'Salesforce CDP', status: 'Active', description: 'Import customer graphs from SF Data Cloud.' },
    { id: 'hubspot', name: 'HubSpot Contacts', status: 'Active', description: 'Pull marketing list CRM directory contacts.' },
    { id: 'shopify', name: 'Shopify Store', status: 'Active', description: 'Sync store orders, checkouts, and customer lists.' },
    { id: 'stripe', name: 'Stripe Billing', status: 'Active', description: 'Sync invoices, customer balances, and plans.' },
    { id: 'razorpay', name: 'Razorpay Gateway', status: 'Active', description: 'Sync payments, refunds, and subscriptions.' },
    { id: 'meta_ads', name: 'Meta Ads', status: 'Active', description: 'Import campaign analytics, CTR, and CPC metrics.' },
    { id: 'google_ads', name: 'Google Ads', status: 'Active', description: 'Target custom lists using Customer Match.' },
    { id: 'ga4', name: 'Google Analytics 4', status: 'Active', description: 'Pull pageviews, sessions, and website goals.' },
    { id: 'mixpanel', name: 'Mixpanel', status: 'Active', description: 'Import custom event cohorts and searches.' },
    { id: 'amplitude', name: 'Amplitude', status: 'Active', description: 'Sync behavioral logs and clickstream maps.' },
    { id: 'gmail', name: 'Gmail Connector', status: 'Active', description: 'Sync conversation logs via IMAP/OAuth.' },
    { id: 'outlook', name: 'Outlook Workspace', status: 'Active', description: 'Pull calendar meets and inbox events.' },
    { id: 'mcp_github', name: 'GitHub MCP Server', status: 'Active', description: 'Ingest direct issues/repo code files dynamically.' }
];
const HELP_CONCEPTS = [
    { term: 'Raw Imported Data', definition: 'Original uploaded data format (NDJSON) stored as an immutable audit history.' },
    { term: 'Clean & Standardized Data', definition: 'Duplicate records removed, formats standardized. Columns are normalized and duplicate rows resolved.' },
    { term: 'Business Ready Data', definition: 'Final datasets ready for AI, analytics, and reporting.' },
    { term: 'Deduplication', definition: 'The process of identifying duplicate records and merging them based on attributes, timestamp recency, and field density.' },
    { term: 'Customer Matching', definition: 'The linking of multiple records to build a Customer Profile, utilizing identifiers like emails and phone numbers.' },
    { term: 'Apache Parquet', definition: 'A high-performance columnar storage format. Compresses data efficiently and speeds up analytic query execution.' },
    { term: 'Delta Lake', definition: 'An open-source storage framework that brings ACID transactions and history versioning logs to object store pools.' },
    { term: 'Sensitive Data Detection', definition: 'Automatic detection of Sensitive Personal Information (emails, phones, addresses) to enforce access policies.' },
];
const getStageExplanation = (stage, fileName) => {
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
            return `Validates required fields, checks for duplicate rows, missing cells, and sensitive keys.`;
        case 'register_dataset':
            return `Registers logical schema definition targets.`;
        case 'metadata_catalog':
            return `Logs details (file size, delimiters, encoding) in the central metadata catalog.`;
        case 'run_ingestion':
            return `Enqueues ingestion job task inside background worker queues.`;
        case 'raw_storage':
        case 'bronze_storage':
            return `Streams source data row-by-row into NDJSON file formats in the Raw Imported Data layer.`;
        case 'transformation':
            return `Normalizes strings, normalizes phone/email formatting, and converts datatypes.`;
        case 'identity_resolution':
            return `Clusters records using contact keys to create unified profile graphs.`;
        case 'deduplication':
            return `Prunes redundant rows, keeping latest timestamps and dense non-null profiles.`;
        case 'normalized_storage':
        case 'silver_storage':
            return `Writes the cleaned, unified records to the Clean & Standardized Data directory.`;
        case 'parquet_export':
            return `Columnarizes records and compiles target Parquet, Delta Lake, or Iceberg blocks.`;
        case 'statistics':
            return `Aggregates pipeline execution latencies, compression ratios, and row counts.`;
        default:
            return `Awaiting connection initialization. Initiate file upload to run the state machine.`;
    }
};
function IngestionPage() {
    const [selectedConnector, setSelectedConnector] = (0, react_1.useState)('csv');
    const [storageType, setStorageType] = (0, react_1.useState)('r2');
    const [bucketName, setBucketName] = (0, react_1.useState)('conductor-raw-lake');
    const [endpoint, setEndpoint] = (0, react_1.useState)('');
    const [region, setRegion] = (0, react_1.useState)('us-east-1');
    const [accessKey, setAccessKey] = (0, react_1.useState)('');
    const [secretKey, setSecretKey] = (0, react_1.useState)('');
    const [pathPrefix, setPathPrefix] = (0, react_1.useState)('');
    const [outputFormat, setOutputFormat] = (0, react_1.useState)('parquet');
    const [mockRowCount, setMockRowCount] = (0, react_1.useState)(100);
    const [file, setFile] = (0, react_1.useState)(null);
    const [isDragOver, setIsDragOver] = (0, react_1.useState)(false);
    const [isUploading, setIsUploading] = (0, react_1.useState)(false);
    const [uploadedPath, setUploadedPath] = (0, react_1.useState)('');
    const [uploadProgress, setUploadProgress] = (0, react_1.useState)(0);
    const [folderFiles, setFolderFiles] = (0, react_1.useState)([]);
    const [activeFileIndex, setActiveFileIndex] = (0, react_1.useState)(0);
    const [gridSearch, setGridSearch] = (0, react_1.useState)('');
    const [gridSortColumn, setGridSortColumn] = (0, react_1.useState)('');
    const [gridSortDirection, setGridSortDirection] = (0, react_1.useState)('asc');
    const [hiddenColumns, setHiddenColumns] = (0, react_1.useState)([]);
    const [showHelpCenter, setShowHelpCenter] = (0, react_1.useState)(true);
    const [workflow, setWorkflow] = (0, react_1.useState)(null);
    const [workflowId, setWorkflowId] = (0, react_1.useState)('');
    const [isConfirming, setIsConfirming] = (0, react_1.useState)(false);
    const [logsFilter, setLogsFilter] = (0, react_1.useState)('all');
    const [rejectedData, setRejectedData] = (0, react_1.useState)({ total: 0, rows: [] });
    const [isRejectedModalOpen, setIsRejectedModalOpen] = (0, react_1.useState)(false);
    const terminalEndRef = (0, react_1.useRef)(null);
    const fileInputRef = (0, react_1.useRef)(null);
    const fetchRejectedData = async () => {
        try {
            const token = typeof window !== 'undefined' ? localStorage.getItem('conductor_session_token') : null;
            const res = await fetch('/api/v1/ingestion/rejected', {
                headers: token ? { 'Authorization': `Bearer ${token}` } : {},
            });
            if (res.ok) {
                const data = await res.json();
                setRejectedData(data);
            }
        }
        catch (err) {
            console.error('Failed to fetch rejected data:', err);
        }
    };
    (0, react_1.useEffect)(() => {
        fetchRejectedData();
    }, [workflow?.status]);
    (0, react_1.useEffect)(() => {
        terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [workflow?.logs]);
    (0, react_1.useEffect)(() => {
        if (!workflowId)
            return;
        let pollInterval;
        const pollWorkflowStatus = async () => {
            try {
                const response = await fetch(`/api/v1/workflows/${workflowId}`);
                if (!response.ok) {
                    console.warn(`[Ingestion] Workflow ${workflowId} not found or failed to fetch. Stopping polling.`);
                    clearInterval(pollInterval);
                    return;
                }
                const data = await response.json();
                setWorkflow(data);
                if (data.status === 'completed' ||
                    data.status === 'failed' ||
                    data.status === 'paused_waiting_confirmation') {
                    clearInterval(pollInterval);
                }
            }
            catch (error) {
                console.error('Polling error:', error);
            }
        };
        pollWorkflowStatus();
        pollInterval = setInterval(pollWorkflowStatus, 1000);
        return () => clearInterval(pollInterval);
    }, [workflowId, workflow?.status]);
    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragOver(true);
    };
    const handleDragLeave = () => {
        setIsDragOver(false);
    };
    const handleDrop = (e) => {
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
    const processSelectedFiles = (files) => {
        if (files.length === 0)
            return;
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
        }
        else {
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
            ? folderFiles.filter(f => f.checked && f.fileObject).map(f => f.fileObject)
            : [file].filter(Boolean);
        if (filesToUpload.length === 0)
            return null;
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
            return lastUploadedPath;
        }
        catch (error) {
            console.error(error);
            setIsUploading(false);
            alert('Upload failed: ' + error.message);
            return null;
        }
    };
    const startWorkflow = async () => {
        let targetPath = uploadedPath;
        if (!targetPath) {
            targetPath = (await uploadFile()) || '';
            if (!targetPath)
                return;
        }
        setIsUploading(true);
        try {
            const response = await fetch('/api/v1/workflows', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    filePath: targetPath,
                    fileName: file?.name || 'uploaded_data.csv',
                    connectionName: 'CSV Ingestion Platform',
                    connectorType: selectedConnector,
                    storageType,
                    outputFormat,
                    selectedFiles: folderFiles.filter(f => f.checked).map(f => f.name),
                }),
            });
            if (!response.ok) {
                const errJson = await response.json().catch(() => ({}));
                throw new Error(errJson.message || 'Start workflow failed');
            }
            const data = await response.json();
            setWorkflow(data);
            setWorkflowId(data.id);
        }
        catch (error) {
            console.error(error);
            alert('Failed to start ingestion workflow: ' + error.message);
        }
        finally {
            setIsUploading(false);
        }
    };
    const confirmSchema = async () => {
        if (!workflowId)
            return;
        setIsConfirming(true);
        try {
            const response = await fetch(`/api/v1/workflows/${workflowId}/confirm`, {
                method: 'POST',
            });
            if (!response.ok)
                throw new Error('Confirmation failed');
            const data = await response.json();
            setWorkflow(data);
            setWorkflowId('');
            setTimeout(() => setWorkflowId(data.id), 100);
        }
        catch (error) {
            console.error(error);
            alert('Confirmation failed: ' + error.message);
        }
        finally {
            setIsConfirming(false);
        }
    };
    const getStepStatus = (stepIndex) => {
        if (!workflow)
            return 'muted';
        if (stepIndex === 1) {
            if (workflow.status === 'failed' && (workflow.currentStage === 'choose_connector' || workflow.currentStage === 'configure_connection'))
                return 'failed';
            return uploadedPath ? 'completed' : 'active';
        }
        if (stepIndex === 2) {
            if (!uploadedPath)
                return 'muted';
            if (workflow.status === 'failed' && workflow.currentStage === 'test_connection')
                return 'failed';
            if (workflow.connectionId)
                return 'completed';
            return workflow.currentStage === 'test_connection' ? 'active' : 'muted';
        }
        if (stepIndex === 3) {
            if (!workflow.connectionId)
                return 'muted';
            if (workflow.status === 'failed' && ['discover_dataset', 'preview_dataset', 'schema_detection', 'validation', 'register_dataset', 'metadata_catalog'].includes(workflow.currentStage))
                return 'failed';
            if (workflow.status === 'paused_waiting_confirmation' || workflow.stages['metadata_catalog'].status === 'completed')
                return 'completed';
            return ['discover_dataset', 'preview_dataset', 'schema_detection', 'validation', 'register_dataset', 'metadata_catalog'].includes(workflow.currentStage) ? 'active' : 'muted';
        }
        if (stepIndex === 4) {
            if (workflow.status === 'paused_waiting_confirmation')
                return 'paused';
            if (workflow.status === 'completed')
                return 'completed';
            const ingestStages = ['run_ingestion', 'raw_storage', 'bronze_storage', 'transformation', 'identity_resolution', 'deduplication', 'normalized_storage', 'silver_storage', 'parquet_export', 'statistics'];
            if (workflow.status === 'failed' && ingestStages.includes(workflow.currentStage))
                return 'failed';
            return (workflow.status === 'running' || ingestStages.includes(workflow.currentStage)) ? 'active' : 'muted';
        }
        return 'muted';
    };
    const getLogCategoryColor = (category) => {
        switch (category) {
            case 'system': return '#38bdf8';
            case 'connector': return '#fbbf24';
            case 'connection': return '#f43f5e';
            case 'api': return '#a855f7';
            case 'workflow': return '#60a5fa';
            case 'validation': return '#ec4899';
            case 'metadata': return '#14b8a6';
            case 'bronze':
            case 'raw': return '#10b981';
            case 'worker': return '#f97316';
            case 'ingestion': return '#6366f1';
            default: return '#94a3b8';
        }
    };
    const filteredLogs = workflow?.logs.filter((log) => {
        if (logsFilter === 'all')
            return true;
        return log.level === logsFilter;
    }) || [];
    return ((0, jsx_runtime_1.jsxs)("div", { className: "app-layout", style: { display: 'flex', minHeight: '100vh' }, children: [(0, jsx_runtime_1.jsx)(Sidebar_1.default, {}), (0, jsx_runtime_1.jsxs)("main", { className: "main-content", style: { flex: 1, paddingLeft: '280px', overflowY: 'auto' }, children: [(0, jsx_runtime_1.jsxs)("header", { className: "top-header", children: [(0, jsx_runtime_1.jsxs)("div", { className: "header-breadcrumbs", children: [(0, jsx_runtime_1.jsx)("span", { className: "muted", children: "Platform" }), " / ", (0, jsx_runtime_1.jsx)("span", { className: "active-breadcrumb", children: "Data Ingestion" })] }), (0, jsx_runtime_1.jsxs)("div", { className: "header-actions", children: [(0, jsx_runtime_1.jsxs)("button", { className: "theme-toggle-btn", style: { display: 'flex', alignItems: 'center', gap: '6px' }, onClick: () => setShowHelpCenter(s => !s), children: [(0, jsx_runtime_1.jsx)(lucide_react_1.HelpCircle, { size: 14 }), " Help Center"] }), (0, jsx_runtime_1.jsx)(ThemeToggle_1.default, {}), (0, jsx_runtime_1.jsx)("div", { className: "avatar", children: "AD" })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "ingestion-wrapper", children: [(0, jsx_runtime_1.jsxs)("div", { className: "stepper-container", children: [(0, jsx_runtime_1.jsxs)("div", { className: `step-card ${getStepStatus(1)}`, children: [(0, jsx_runtime_1.jsx)("div", { className: "step-number", children: "1" }), (0, jsx_runtime_1.jsxs)("div", { className: "step-info", children: [(0, jsx_runtime_1.jsx)("h4", { children: "Connection" }), (0, jsx_runtime_1.jsx)("p", { children: uploadedPath ? 'Connected' : 'Select connection source' })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: `step-card ${getStepStatus(2)}`, children: [(0, jsx_runtime_1.jsx)("div", { className: "step-number", children: "2" }), (0, jsx_runtime_1.jsxs)("div", { className: "step-info", children: [(0, jsx_runtime_1.jsx)("h4", { children: "Discovery" }), (0, jsx_runtime_1.jsx)("p", { children: workflow?.connectionId ? 'Discovered' : 'Scan target storage' })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: `step-card ${getStepStatus(3)}`, children: [(0, jsx_runtime_1.jsx)("div", { className: "step-number", children: "3" }), (0, jsx_runtime_1.jsxs)("div", { className: "step-info", children: [(0, jsx_runtime_1.jsx)("h4", { children: "Validation" }), (0, jsx_runtime_1.jsx)("p", { children: workflow?.status === 'paused_waiting_confirmation' ? 'Ready to confirm' : 'Auditing schema' })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: `step-card ${getStepStatus(4)}`, children: [(0, jsx_runtime_1.jsx)("div", { className: "step-number", children: "4" }), (0, jsx_runtime_1.jsxs)("div", { className: "step-info", children: [(0, jsx_runtime_1.jsx)("h4", { children: "Ingestion" }), (0, jsx_runtime_1.jsx)("p", { children: workflow?.status === 'completed' ? 'Successfully ingested' : 'Loading to lakehouse' })] })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "ingestion-panel", children: [(0, jsx_runtime_1.jsxs)("div", { className: "panel-left", children: [workflow?.status !== 'completed' && ((0, jsx_runtime_1.jsxs)("section", { className: "card-panel", children: [(0, jsx_runtime_1.jsxs)("div", { className: "card-panel-header", children: [(0, jsx_runtime_1.jsx)("h3", { children: "Choose Connector" }), (0, jsx_runtime_1.jsx)("p", { children: "Select the enterprise connector configuration model." })] }), (0, jsx_runtime_1.jsx)("div", { className: "connectors-list", children: CONNECTORS.map((c) => ((0, jsx_runtime_1.jsxs)("div", { className: `connector-item ${selectedConnector === c.id ? 'active' : ''} ${c.status !== 'Active' ? 'disabled' : ''}`, onClick: () => c.status === 'Active' && setSelectedConnector(c.id), children: [(0, jsx_runtime_1.jsxs)("div", { className: "connector-title-row", children: [(0, jsx_runtime_1.jsx)("strong", { children: c.name }), (0, jsx_runtime_1.jsx)("span", { className: `badge-status ${c.status === 'Active' ? 'active' : 'soon'}`, children: c.status })] }), (0, jsx_runtime_1.jsx)("p", { children: c.description })] }, c.id))) })] })), workflow?.status !== 'completed' && ((0, jsx_runtime_1.jsxs)("section", { className: "card-panel", style: { marginTop: '24px', marginBottom: '24px' }, children: [(0, jsx_runtime_1.jsxs)("div", { className: "card-panel-header", children: [(0, jsx_runtime_1.jsx)("h3", { children: "Enterprise Dataset Simulator" }), (0, jsx_runtime_1.jsx)("p", { children: "Simulate, download, or directly ingest multi-source files (profiles, interactions, and transactions) to test customer matching and dynamic rules." })] }), (0, jsx_runtime_1.jsxs)("div", { style: { display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }, children: [(0, jsx_runtime_1.jsxs)("div", { style: { display: 'flex', alignItems: 'center', gap: '8px' }, children: [(0, jsx_runtime_1.jsx)("span", { style: { fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)' }, children: "DESIRED RECORD COUNT:" }), (0, jsx_runtime_1.jsx)("input", { type: "number", value: mockRowCount, onChange: e => setMockRowCount(Math.max(1, Number(e.target.value))), style: { width: '100px', padding: '6px', fontSize: '12px', backgroundColor: 'var(--bg-app)', border: '1px solid var(--grid-line-minor)', color: 'var(--text-loud)', borderRadius: '4px' } })] }), (0, jsx_runtime_1.jsxs)("div", { style: { display: 'flex', gap: '12px' }, children: [(0, jsx_runtime_1.jsx)("button", { type: "button", className: "btn-secondary", style: { flex: 1, padding: '10px 14px', fontSize: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center' }, onClick: async () => {
                                                                            const res = await fetch('/api/v1/uploads/mockaroo', {
                                                                                method: 'POST',
                                                                                headers: { 'Content-Type': 'application/json' },
                                                                                body: JSON.stringify({ datasetType: 'identity', rowCount: mockRowCount })
                                                                            });
                                                                            if (res.ok) {
                                                                                const data = await res.json();
                                                                                alert(`Customer Directory generated: ${data.filename}. Direct Ingestion to Raw storage successful!`);
                                                                            }
                                                                        }, children: "Ingest Customer Directory" }), (0, jsx_runtime_1.jsx)("button", { type: "button", className: "btn-secondary", style: { flex: 1, padding: '10px 14px', fontSize: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center' }, onClick: async () => {
                                                                            const res = await fetch('/api/v1/uploads/mockaroo', {
                                                                                method: 'POST',
                                                                                headers: { 'Content-Type': 'application/json' },
                                                                                body: JSON.stringify({ datasetType: 'behavior', rowCount: mockRowCount })
                                                                            });
                                                                            if (res.ok) {
                                                                                const data = await res.json();
                                                                                alert(`Interaction History generated: ${data.filename}. Direct Ingestion to Raw storage successful!`);
                                                                            }
                                                                        }, children: "Ingest Interaction History" }), (0, jsx_runtime_1.jsx)("button", { type: "button", className: "btn-secondary", style: { flex: 1, padding: '10px 14px', fontSize: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center' }, onClick: async () => {
                                                                            const res = await fetch('/api/v1/uploads/mockaroo', {
                                                                                method: 'POST',
                                                                                headers: { 'Content-Type': 'application/json' },
                                                                                body: JSON.stringify({ datasetType: 'financial', rowCount: mockRowCount })
                                                                            });
                                                                            if (res.ok) {
                                                                                const data = await res.json();
                                                                                alert(`Transaction Records generated: ${data.filename}. Direct Ingestion to Raw storage successful!`);
                                                                            }
                                                                        }, children: "Ingest Transaction Records" })] })] })] })), (0, jsx_runtime_1.jsxs)("div", { style: {
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'center',
                                                    background: (rejectedData.total > 0) ? 'rgba(239, 68, 68, 0.08)' : 'rgba(52, 211, 153, 0.08)',
                                                    border: `1px solid ${(rejectedData.total > 0) ? 'rgba(239, 68, 68, 0.3)' : 'rgba(52, 211, 153, 0.3)'}`,
                                                    borderRadius: '8px',
                                                    padding: '12px 18px',
                                                    marginBottom: '20px',
                                                }, children: [(0, jsx_runtime_1.jsxs)("div", { style: { display: 'flex', alignItems: 'center', gap: '10px' }, children: [(0, jsx_runtime_1.jsx)(lucide_react_1.AlertTriangle, { size: 18, color: rejectedData.total > 0 ? '#f87171' : '#34d399' }), (0, jsx_runtime_1.jsxs)("span", { style: { fontSize: '13px', color: 'var(--text-loud)' }, children: [(0, jsx_runtime_1.jsx)("strong", { children: "Ingestion Audit & Rejection Log:" }), " ", rejectedData.total, " quarantined records tracked with specific failure reasons"] })] }), (0, jsx_runtime_1.jsxs)("button", { className: "btn-outline", onClick: () => setIsRejectedModalOpen(true), style: { fontSize: '12px', padding: '4px 14px', height: '32px' }, children: ["View Rejected Details (", rejectedData.total, ")"] })] }), (0, jsx_runtime_1.jsxs)("section", { className: "card-panel", children: [(0, jsx_runtime_1.jsxs)("div", { className: "card-panel-header", children: [(0, jsx_runtime_1.jsx)("h3", { children: workflow?.status === 'completed' ? 'Telemetry Dashboard' : 'Upload Data' }), (0, jsx_runtime_1.jsx)("p", { children: "Stream records through modular storage adapters and target format compression exporters." })] }), workflow?.status === 'completed' ? ((0, jsx_runtime_1.jsxs)("div", { className: "success-content", children: [(0, jsx_runtime_1.jsxs)("div", { style: { display: 'flex', alignItems: 'center', gap: '16px', background: 'rgba(92, 177, 152, 0.08)', border: '1px solid rgba(92, 177, 152, 0.3)', padding: '20px', borderRadius: '12px', marginBottom: '24px' }, children: [(0, jsx_runtime_1.jsx)("div", { style: { width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'var(--accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }, children: (0, jsx_runtime_1.jsx)(lucide_react_1.Check, { size: 20, style: { color: 'var(--bg-app)' } }) }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("h4", { style: { color: 'var(--text-loud)', fontSize: '15px', fontWeight: '600', marginBottom: '2px' }, children: "Ingestion Completed Successfully" }), (0, jsx_runtime_1.jsx)("p", { style: { color: 'var(--text-muted)', fontSize: '13px' }, children: "Dataset successfully registered and loaded into Raw Lake." })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "storage-paths-display", style: { display: 'flex', flexDirection: 'column', gap: '8px', background: 'var(--bg-app)', padding: '16px', borderRadius: '8px', border: '1px solid var(--grid-line-major)', fontSize: '13px', fontFamily: 'monospace' }, children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("strong", { style: { color: 'var(--text-loud)' }, children: "Raw Path:" }), " ", workflow.stages['raw_storage']?.data?.rawPath || workflow.stages['bronze_storage']?.data?.bronzePath || 'N/A'] }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("strong", { style: { color: 'var(--text-loud)' }, children: "Normalized Path:" }), " ", workflow.stages['statistics']?.data?.normalizedPath || workflow.stages['statistics']?.data?.silverPath || 'N/A'] }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("strong", { style: { color: 'var(--text-loud)' }, children: "Target Export Path:" }), " ", workflow.stages['statistics']?.data?.parquetPath || 'N/A'] })] }), workflow.stages['statistics']?.data && ((0, jsx_runtime_1.jsxs)("div", { children: [workflow.stages['statistics'].data.childResults && ((0, jsx_runtime_1.jsxs)("div", { className: "folder-child-results", style: { marginTop: '24px', background: 'rgba(15, 22, 30, 0.5)', padding: '16px', borderRadius: '8px', border: '1px solid var(--grid-line-major)' }, children: [(0, jsx_runtime_1.jsx)("h5", { style: { margin: '0 0 12px', fontSize: '13px', color: 'var(--text-loud)', textTransform: 'uppercase' }, children: "Folder Files Processed" }), (0, jsx_runtime_1.jsx)("div", { style: { display: 'flex', flexDirection: 'column', gap: '8px' }, children: workflow.stages['statistics'].data.childResults.map((child, cIdx) => ((0, jsx_runtime_1.jsxs)("div", { style: { display: 'flex', justifyContent: 'space-between', fontSize: '12px', borderBottom: '1px solid var(--grid-line-minor)', paddingBottom: '6px' }, children: [(0, jsx_runtime_1.jsxs)("span", { children: ["\uD83D\uDCC4 ", (0, jsx_runtime_1.jsx)("strong", { children: child.name }), " (", child.format.toUpperCase(), ")"] }), (0, jsx_runtime_1.jsxs)("span", { style: { color: 'var(--accent-primary)' }, children: [child.validCount, " rows ingested \u2022 Pruned ", child.duplicatesPruned] })] }, cIdx))) })] })), (0, jsx_runtime_1.jsxs)("div", { className: "success-metrics-grid", children: [(0, jsx_runtime_1.jsxs)("div", { className: "metric-card", children: [(0, jsx_runtime_1.jsx)("span", { className: "metric-card-label", children: "Rows Processed" }), (0, jsx_runtime_1.jsx)("span", { className: "metric-card-value", children: workflow.stages['statistics'].data.rowsUploaded })] }), (0, jsx_runtime_1.jsxs)("div", { className: "metric-card", children: [(0, jsx_runtime_1.jsx)("span", { className: "metric-card-label", children: "Valid Rows" }), (0, jsx_runtime_1.jsx)("span", { className: "metric-card-value", style: { color: 'var(--accent-primary)' }, children: workflow.stages['statistics'].data.rowsValid })] }), (0, jsx_runtime_1.jsxs)("div", { className: "metric-card", children: [(0, jsx_runtime_1.jsx)("span", { className: "metric-card-label", children: "Pruned Duplicates" }), (0, jsx_runtime_1.jsx)("span", { className: "metric-card-value", style: { color: 'var(--accent-secondary)' }, children: workflow.stages['statistics'].data.duplicatesFound })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "success-metrics-grid", children: [(0, jsx_runtime_1.jsxs)("div", { className: "metric-card", children: [(0, jsx_runtime_1.jsx)("span", { className: "metric-card-label", children: "Profiles Stitching" }), (0, jsx_runtime_1.jsx)("span", { className: "metric-card-value", children: workflow.stages['statistics'].data.profilesCreated })] }), (0, jsx_runtime_1.jsxs)("div", { className: "metric-card", children: [(0, jsx_runtime_1.jsx)("span", { className: "metric-card-label", children: "Export Size" }), (0, jsx_runtime_1.jsxs)("span", { className: "metric-card-value", children: [(workflow.stages['statistics'].data.parquetSize / 1024).toFixed(2), " KB"] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "metric-card", children: [(0, jsx_runtime_1.jsx)("span", { className: "metric-card-label", children: "Compression Ratio" }), (0, jsx_runtime_1.jsxs)("span", { className: "metric-card-value", children: [workflow.stages['statistics'].data.compressionRatio, "x"] })] })] }), (0, jsx_runtime_1.jsx)("h5", { style: { margin: '24px 0 12px', fontSize: '13px', color: 'var(--text-muted)', textTransform: 'uppercase' }, children: "Ingestion Engine Latency" }), (0, jsx_runtime_1.jsxs)("div", { style: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', background: 'var(--bg-app)', padding: '16px', borderRadius: '8px', border: '1px solid var(--grid-line-major)', textAlign: 'center', fontSize: '13px' }, children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("div", { style: { color: 'var(--text-muted)' }, children: "Validation" }), (0, jsx_runtime_1.jsxs)("div", { style: { fontWeight: '600', marginTop: '4px', color: 'var(--text-loud)' }, children: [workflow.stages['statistics'].data.validationTimeMs, "ms"] })] }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("div", { style: { color: 'var(--text-muted)' }, children: "Transformation" }), (0, jsx_runtime_1.jsxs)("div", { style: { fontWeight: '600', marginTop: '4px', color: 'var(--text-loud)' }, children: [workflow.stages['statistics'].data.transformationTimeMs, "ms"] })] }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("div", { style: { color: 'var(--text-muted)' }, children: "Customer Matching" }), (0, jsx_runtime_1.jsxs)("div", { style: { fontWeight: '600', marginTop: '4px', color: 'var(--text-loud)' }, children: [workflow.stages['statistics'].data.identityResolutionTimeMs, "ms"] })] }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("div", { style: { color: 'var(--text-muted)' }, children: "Overall Ingestion" }), (0, jsx_runtime_1.jsxs)("div", { style: { fontWeight: '600', marginTop: '4px', color: 'var(--accent-primary)' }, children: [(workflow.stages['statistics'].data.overallPipelineTimeMs / 1000).toFixed(2), "s"] })] })] })] })), (0, jsx_runtime_1.jsx)("div", { style: { display: 'flex', justifyContent: 'flex-end', marginTop: '24px' }, children: (0, jsx_runtime_1.jsx)("button", { className: "btn-outline", onClick: resetFile, children: "Ingest Another File" }) })] })) : ((0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsxs)("div", { style: { marginBottom: '24px' }, children: [(0, jsx_runtime_1.jsx)("h4", { className: "form-section-title", children: "Storage Destination" }), (0, jsx_runtime_1.jsx)("div", { className: "storage-grid-selectors", children: ['r2', 'local', 's3', 'azure', 'gcs'].map(p => ((0, jsx_runtime_1.jsx)("button", { className: `storage-selector-btn ${storageType === p ? 'active' : ''}`, onClick: () => setStorageType(p), children: p }, p))) }), storageType !== 'local' && ((0, jsx_runtime_1.jsxs)("div", { className: "storage-config-fields", children: [(0, jsx_runtime_1.jsxs)("div", { className: "config-field-group", children: [(0, jsx_runtime_1.jsx)("label", { children: "Bucket / Container Name" }), (0, jsx_runtime_1.jsx)("input", { className: "config-input", value: bucketName, onChange: e => setBucketName(e.target.value) })] }), (0, jsx_runtime_1.jsxs)("div", { className: "config-field-group", children: [(0, jsx_runtime_1.jsx)("label", { children: "Region" }), (0, jsx_runtime_1.jsx)("input", { className: "config-input", value: region, onChange: e => setRegion(e.target.value) })] }), (0, jsx_runtime_1.jsxs)("div", { className: "config-field-group", children: [(0, jsx_runtime_1.jsx)("label", { children: "Endpoint URL (Custom)" }), (0, jsx_runtime_1.jsx)("input", { className: "config-input", placeholder: "https://endpoint-url.com", value: endpoint, onChange: e => setEndpoint(e.target.value) })] }), (0, jsx_runtime_1.jsxs)("div", { className: "config-field-group", children: [(0, jsx_runtime_1.jsx)("label", { children: "Target Folder Prefix" }), (0, jsx_runtime_1.jsx)("input", { className: "config-input", placeholder: "prefix/", value: pathPrefix, onChange: e => setPathPrefix(e.target.value) })] }), (0, jsx_runtime_1.jsxs)("div", { className: "config-field-group", children: [(0, jsx_runtime_1.jsx)("label", { children: "Access Key ID" }), (0, jsx_runtime_1.jsx)("input", { className: "config-input", type: "password", value: accessKey, onChange: e => setAccessKey(e.target.value) })] }), (0, jsx_runtime_1.jsxs)("div", { className: "config-field-group", children: [(0, jsx_runtime_1.jsx)("label", { children: "Secret Access Key" }), (0, jsx_runtime_1.jsx)("input", { className: "config-input", type: "password", value: secretKey, onChange: e => setSecretKey(e.target.value) })] })] }))] }), (0, jsx_runtime_1.jsxs)("div", { style: { marginBottom: '24px' }, children: [(0, jsx_runtime_1.jsx)("h4", { className: "form-section-title", children: "Target Export Format" }), (0, jsx_runtime_1.jsx)("div", { className: "storage-grid-selectors", children: ['parquet', 'delta', 'iceberg', 'csv', 'json'].map(f => ((0, jsx_runtime_1.jsx)("button", { className: `storage-selector-btn ${outputFormat === f ? 'active' : ''}`, onClick: () => setOutputFormat(f), children: f }, f))) })] }), selectedConnector === 'folder' && folderFiles.length > 0 ? ((0, jsx_runtime_1.jsxs)("div", { className: "folder-explorer", children: [(0, jsx_runtime_1.jsxs)("div", { className: "explorer-sidebar", children: [(0, jsx_runtime_1.jsx)("div", { className: "explorer-title", children: "\uD83D\uDCC1 Workspace Folder" }), (0, jsx_runtime_1.jsx)("ul", { className: "explorer-list", children: folderFiles.map((f, idx) => ((0, jsx_runtime_1.jsxs)("li", { className: `explorer-item ${activeFileIndex === idx ? 'active' : ''}`, onClick: () => setActiveFileIndex(idx), children: [(0, jsx_runtime_1.jsx)("input", { type: "checkbox", checked: f.checked, onChange: (e) => {
                                                                                                e.stopPropagation();
                                                                                                const copy = [...folderFiles];
                                                                                                copy[idx].checked = e.target.checked;
                                                                                                setFolderFiles(copy);
                                                                                            } }), (0, jsx_runtime_1.jsxs)("span", { children: ["\uD83D\uDCC4 ", f.name] })] }, idx))) })] }), (0, jsx_runtime_1.jsxs)("div", { className: "explorer-content", children: [(0, jsx_runtime_1.jsxs)("h4", { style: { color: 'var(--text-loud)', fontSize: '14px', marginBottom: '4px' }, children: ["File Details: ", folderFiles[activeFileIndex].name] }), (0, jsx_runtime_1.jsxs)("p", { style: { color: 'var(--text-muted)', fontSize: '12px', marginBottom: '16px' }, children: ["Type: ", folderFiles[activeFileIndex].type.toUpperCase(), " \u2022 Size: ", (folderFiles[activeFileIndex].size / 1024).toFixed(1), " KB \u2022 Target: Ingestion Silver"] }), (0, jsx_runtime_1.jsxs)("div", { style: { display: 'flex', gap: '8px' }, children: [(0, jsx_runtime_1.jsx)("button", { className: "btn-primary", onClick: uploadFile, disabled: !!uploadedPath, children: "Load Ingestion Data" }), (0, jsx_runtime_1.jsx)("button", { className: "btn-outline", onClick: resetFile, children: "Clear Folder" })] })] })] })) : ((0, jsx_runtime_1.jsxs)("div", { className: `file-dropzone ${isDragOver ? 'drag-over' : ''}`, onDragOver: handleDragOver, onDragLeave: handleDragLeave, onDrop: handleDrop, onClick: !file ? triggerBrowse : undefined, children: [(0, jsx_runtime_1.jsx)("input", { type: "file", ref: fileInputRef, style: { display: 'none' }, ...(selectedConnector === 'folder' ? {
                                                                            webkitdirectory: "true",
                                                                            directory: "true",
                                                                            multiple: true
                                                                        } : {
                                                                            multiple: true
                                                                        }), onChange: (e) => {
                                                                            if (e.target.files) {
                                                                                processSelectedFiles(e.target.files);
                                                                            }
                                                                        } }), (0, jsx_runtime_1.jsxs)("div", { className: "dropzone-inner", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.UploadCloud, { size: 40, className: "upload-icon" }), file ? ((0, jsx_runtime_1.jsxs)("div", { className: "file-details-card", style: { width: '100%', maxWidth: '400px' }, onClick: e => e.stopPropagation(), children: [(0, jsx_runtime_1.jsxs)("div", { className: "file-info", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.FileText, { size: 20, className: "upload-icon" }), (0, jsx_runtime_1.jsxs)("div", { className: "file-meta", style: { textAlign: 'left' }, children: [(0, jsx_runtime_1.jsx)("h5", { children: file.name }), (0, jsx_runtime_1.jsxs)("p", { children: [(file.size / 1024).toFixed(2), " KB \u2014 Ready"] })] })] }), (0, jsx_runtime_1.jsx)("button", { className: "btn-remove-file", onClick: resetFile, children: "Remove" })] })) : ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsxs)("p", { className: "dropzone-text", children: ["Drag any CSV, Excel, or JSON file here, or ", (0, jsx_runtime_1.jsx)("span", { children: "click to browse" })] }), (0, jsx_runtime_1.jsx)("p", { className: "dropzone-subtext", children: "Supported formats: .csv, .xlsx, .xls, .json, .parquet" })] }))] }), isUploading && ((0, jsx_runtime_1.jsxs)("div", { className: "upload-progress-layer", children: [(0, jsx_runtime_1.jsx)("div", { className: "progress-track", children: (0, jsx_runtime_1.jsx)("div", { className: "progress-fill", style: { width: `${uploadProgress}%` } }) }), (0, jsx_runtime_1.jsxs)("p", { style: { fontSize: '13px', color: 'var(--text-loud)' }, children: ["Uploading to storage adapter... ", uploadProgress, "%"] })] }))] })), (0, jsx_runtime_1.jsxs)("div", { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px' }, children: [(0, jsx_runtime_1.jsxs)("div", { style: { fontSize: '12px', color: 'var(--text-muted)' }, children: [file && (0, jsx_runtime_1.jsxs)("div", { children: ["File Selected: ", (0, jsx_runtime_1.jsx)("span", { style: { color: 'var(--accent-primary)', fontWeight: '600' }, children: file.name })] }), uploadedPath && (0, jsx_runtime_1.jsxs)("div", { children: ["Storage Status: ", (0, jsx_runtime_1.jsx)("span", { style: { color: 'var(--accent-primary)', fontWeight: '600' }, children: "Uploaded to Cloud Store" })] })] }), (0, jsx_runtime_1.jsxs)("div", { style: { display: 'flex', gap: '8px' }, children: [selectedConnector === 'folder' && folderFiles.length === 0 && ((0, jsx_runtime_1.jsx)("button", { className: "btn-outline", onClick: loadMockFolderWorkspace, children: "Load Ingestion Folder" })), selectedConnector !== 'folder' && ((0, jsx_runtime_1.jsx)("button", { className: "btn-primary", onClick: uploadFile, disabled: !file || !!uploadedPath || isUploading, children: "Upload File" })), (0, jsx_runtime_1.jsx)("button", { className: "btn-primary", onClick: startWorkflow, disabled: (!file && folderFiles.length === 0 && !uploadedPath) || isUploading || (!!workflow && workflow.status === 'running'), children: isUploading ? 'Connecting & Ingesting...' : 'Create Connection' })] })] })] }))] }), workflow?.status === 'paused_waiting_confirmation' && workflow.previewData && ((0, jsx_runtime_1.jsxs)("section", { className: "card-panel", children: [(0, jsx_runtime_1.jsxs)("div", { className: "card-panel-header", children: [(0, jsx_runtime_1.jsxs)("div", { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' }, children: [(0, jsx_runtime_1.jsx)("h3", { children: "Draft Catalog Registry Confirmation" }), (0, jsx_runtime_1.jsxs)("div", { style: { display: 'flex', alignItems: 'center', gap: '12px' }, children: [(0, jsx_runtime_1.jsx)("span", { className: "badge-status active", style: { animation: 'pulse 2s infinite' }, children: "Awaiting Confirmation" }), (0, jsx_runtime_1.jsxs)("button", { className: "btn-primary", onClick: confirmSchema, disabled: isConfirming, style: { padding: '6px 14px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }, children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Play, { size: 12 }), " Confirm & Ingest"] })] })] }), (0, jsx_runtime_1.jsx)("p", { children: "Verify inferred schema types, validation reports, and raw content preview before ingesting to Raw Lake." })] }), workflow.validationReport && ((0, jsx_runtime_1.jsxs)("div", { className: `validation-alert-box ${workflow.validationReport.valid ? 'valid' : 'invalid'}`, children: [(0, jsx_runtime_1.jsxs)("div", { style: { display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '700', fontSize: '13px' }, children: [workflow.validationReport.valid ? ((0, jsx_runtime_1.jsx)(lucide_react_1.CheckCircle, { size: 16, style: { color: 'var(--accent-primary)' } })) : ((0, jsx_runtime_1.jsx)(lucide_react_1.AlertTriangle, { size: 16, style: { color: 'var(--accent-secondary)' } })), (0, jsx_runtime_1.jsx)("span", { children: workflow.validationReport.valid
                                                                            ? '✓ Validation Passed. No critical structural anomalies detected.'
                                                                            : '⚠ Structure Warning. Non-blocking anomalies detected in source.' })] }), workflow.validationReport.issues.length > 0 && ((0, jsx_runtime_1.jsx)("ul", { className: "alert-issues-list", children: workflow.validationReport.issues.map((issue, idx) => ((0, jsx_runtime_1.jsxs)("li", { className: issue.severity, children: ["[", issue.severity.toUpperCase(), "] ", issue.message] }, idx))) }))] })), (0, jsx_runtime_1.jsxs)("div", { className: "success-metrics-grid", style: { marginBottom: '24px' }, children: [(0, jsx_runtime_1.jsxs)("div", { className: "metric-card", children: [(0, jsx_runtime_1.jsx)("span", { className: "metric-card-label", children: "Estimated Rows" }), (0, jsx_runtime_1.jsx)("span", { className: "metric-card-value", children: workflow.validationReport?.recordCount || workflow.previewData.metadata.rowCount })] }), (0, jsx_runtime_1.jsxs)("div", { className: "metric-card", children: [(0, jsx_runtime_1.jsx)("span", { className: "metric-card-label", children: "Delimiter" }), (0, jsx_runtime_1.jsxs)("span", { className: "metric-card-value", children: ["\"", workflow.previewData.metadata.delimiter, "\""] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "metric-card", children: [(0, jsx_runtime_1.jsx)("span", { className: "metric-card-label", children: "Encoding" }), (0, jsx_runtime_1.jsx)("span", { className: "metric-card-value", children: workflow.previewData.metadata.encoding })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "preview-table-section", children: [(0, jsx_runtime_1.jsxs)("div", { className: "preview-controls", children: [(0, jsx_runtime_1.jsxs)("div", { className: "search-input-box", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Search, { size: 14, style: { color: 'var(--text-muted)' } }), (0, jsx_runtime_1.jsx)("input", { placeholder: "Search preview grid records...", value: gridSearch, onChange: (e) => setGridSearch(e.target.value) })] }), (0, jsx_runtime_1.jsx)("div", { className: "column-toggles", children: workflow.previewData.schema.fields.map((field) => ((0, jsx_runtime_1.jsx)("button", { className: `col-toggle-btn ${hiddenColumns.includes(field.name) ? 'hidden' : ''}`, onClick: () => {
                                                                                setHiddenColumns(prev => prev.includes(field.name)
                                                                                    ? prev.filter(c => c !== field.name)
                                                                                    : [...prev, field.name]);
                                                                            }, children: field.name }, field.name))) })] }), (0, jsx_runtime_1.jsx)("div", { className: "table-wrapper", children: (0, jsx_runtime_1.jsxs)("table", { children: [(0, jsx_runtime_1.jsx)("thead", { children: (0, jsx_runtime_1.jsx)("tr", { children: workflow.previewData.schema.fields.filter(f => !hiddenColumns.includes(f.name)).map((field, idx) => ((0, jsx_runtime_1.jsxs)("th", { onClick: () => {
                                                                                        setGridSortColumn(field.name);
                                                                                        setGridSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
                                                                                    }, style: { cursor: 'pointer' }, children: [field.name, " ", gridSortColumn === field.name ? (gridSortDirection === 'asc' ? '▲' : '▼') : ''] }, idx))) }) }), (0, jsx_runtime_1.jsx)("tbody", { children: (() => {
                                                                                let displayRows = [...workflow.previewData.rows];
                                                                                if (gridSearch) {
                                                                                    displayRows = displayRows.filter(row => Object.values(row).some(val => String(val ?? '').toLowerCase().includes(gridSearch.toLowerCase())));
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
                                                                                return displayRows.slice(0, 50).map((row, rowIdx) => ((0, jsx_runtime_1.jsx)("tr", { children: workflow.previewData.schema.fields.filter(f => !hiddenColumns.includes(f.name)).map((field, colIdx) => {
                                                                                        const val = row[field.name];
                                                                                        const isSensitive = ['email', 'phone', 'ssn', 'credit_card', 'salary', 'password', 'mobile'].includes(field.name.toLowerCase());
                                                                                        const isNull = val === null || val === undefined || val === '';
                                                                                        return ((0, jsx_runtime_1.jsxs)("td", { children: [isNull ? (0, jsx_runtime_1.jsx)("span", { className: "null-placeholder", children: "NULL" }) : String(val), isSensitive && (0, jsx_runtime_1.jsx)("span", { className: "pii-badge", children: "Sensitive Data" })] }, colIdx));
                                                                                    }) }, rowIdx)));
                                                                            })() })] }) })] }), (0, jsx_runtime_1.jsx)("div", { className: "action-row-btn", children: (0, jsx_runtime_1.jsx)("button", { className: "btn-primary", onClick: confirmSchema, disabled: isConfirming, children: isConfirming ? 'Processing Ingestion...' : 'Confirm Schema & Ingest' }) })] }))] }), (0, jsx_runtime_1.jsxs)("div", { className: "panel-right", children: [(0, jsx_runtime_1.jsxs)("section", { className: "terminal-console", children: [(0, jsx_runtime_1.jsxs)("div", { className: "terminal-header", children: [(0, jsx_runtime_1.jsx)("h3", { children: "Ingestion Log Console" }), (0, jsx_runtime_1.jsxs)("select", { style: { background: 'var(--bg-app)', border: '1px solid var(--grid-line-major)', color: 'var(--text-loud)', fontSize: '10px', padding: '2px 8px', borderRadius: '4px' }, onChange: e => setLogsFilter(e.target.value), value: logsFilter, children: [(0, jsx_runtime_1.jsx)("option", { value: "all", children: "ALL LEVELS" }), (0, jsx_runtime_1.jsx)("option", { value: "info", children: "INFO" }), (0, jsx_runtime_1.jsx)("option", { value: "success", children: "SUCCESS" }), (0, jsx_runtime_1.jsx)("option", { value: "warning", children: "WARNING" }), (0, jsx_runtime_1.jsx)("option", { value: "error", children: "ERROR" })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "terminal-logs", children: [filteredLogs.length > 0 ? (filteredLogs.map((log, idx) => ((0, jsx_runtime_1.jsxs)("div", { className: "log-entry", children: [(0, jsx_runtime_1.jsxs)("span", { className: "log-timestamp", children: ["[", new Date(log.timestamp).toLocaleTimeString(), "]"] }), (0, jsx_runtime_1.jsx)("span", { className: "log-category", style: { color: getLogCategoryColor(log.category) }, children: log.category.toUpperCase() }), (0, jsx_runtime_1.jsx)("span", { className: "log-message", style: { color: log.level === 'error' ? '#ef4444' : log.level === 'success' ? 'var(--accent-primary)' : log.level === 'warning' ? 'var(--accent-secondary)' : '#e2e8f0' }, children: log.message })] }, idx)))) : ((0, jsx_runtime_1.jsx)("div", { style: { color: 'var(--text-muted)', fontSize: '12px' }, children: "Console ready. Start a data connection to stream active orchestrator logs." })), (0, jsx_runtime_1.jsx)("div", { ref: terminalEndRef })] })] }), (0, jsx_runtime_1.jsxs)("section", { className: "card-panel", style: { padding: '16px' }, children: [(0, jsx_runtime_1.jsxs)("div", { style: { display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }, children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Cpu, { size: 16, className: "upload-icon" }), (0, jsx_runtime_1.jsx)("h4", { style: { fontSize: '12px', textTransform: 'uppercase', color: 'var(--text-loud)' }, children: "Active Orchestrator Stage" })] }), (0, jsx_runtime_1.jsx)("strong", { style: { color: 'var(--accent-primary)', fontSize: '13px', display: 'block', marginBottom: '6px' }, children: workflow ? workflow.currentStage.replace(/_/g, ' ').toUpperCase() : 'AWAITING CONNECTION' }), (0, jsx_runtime_1.jsx)("p", { style: { fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.4' }, children: getStageExplanation(workflow?.currentStage, file?.name) })] })] })] })] })] }), (0, jsx_runtime_1.jsxs)("aside", { className: `help-center-sidebar ${showHelpCenter ? 'open' : ''}`, children: [(0, jsx_runtime_1.jsxs)("div", { className: "help-center-header", children: [(0, jsx_runtime_1.jsx)("h3", { style: { margin: 0, fontSize: '14px', color: 'var(--text-loud)' }, children: "Ingestion Knowledge Center" }), (0, jsx_runtime_1.jsx)("button", { className: "btn-close-drawer", onClick: () => setShowHelpCenter(false), children: (0, jsx_runtime_1.jsx)(lucide_react_1.X, { size: 16 }) })] }), (0, jsx_runtime_1.jsx)("p", { style: { fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px' }, children: "Interactive guide detailing standard lakehouse pipeline storage architectures." }), (0, jsx_runtime_1.jsx)("div", { style: { display: 'flex', flexDirection: 'column', gap: '12px' }, children: HELP_CONCEPTS.map((concept, idx) => ((0, jsx_runtime_1.jsxs)("div", { className: "help-concept-box", children: [(0, jsx_runtime_1.jsx)("div", { className: "help-concept-title", style: { fontSize: '13px', fontWeight: '600', color: 'var(--text-loud)' }, children: concept.term }), (0, jsx_runtime_1.jsx)("div", { className: "help-concept-desc", style: { fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px', lineHeight: '1.4' }, children: concept.definition })] }, idx))) })] }), !showHelpCenter && ((0, jsx_runtime_1.jsxs)("button", { className: "floating-help-tab", onClick: () => setShowHelpCenter(true), title: "Open Ingestion Knowledge Center", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.HelpCircle, { size: 14, style: { marginBottom: '4px' } }), (0, jsx_runtime_1.jsx)("span", { children: "HELP CENTER" })] })), isRejectedModalOpen && ((0, jsx_runtime_1.jsx)("div", { className: "modal-backdrop", onClick: () => setIsRejectedModalOpen(false), children: (0, jsx_runtime_1.jsxs)("div", { className: "modal-content", style: { maxWidth: '960px', maxHeight: '85vh', overflowY: 'auto' }, onClick: e => e.stopPropagation(), children: [(0, jsx_runtime_1.jsxs)("div", { className: "modal-header", children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsxs)("h3", { style: { margin: 0, fontSize: '1.2rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '0.5rem' }, children: [(0, jsx_runtime_1.jsx)(lucide_react_1.AlertTriangle, { size: 20, color: "#f87171" }), (0, jsx_runtime_1.jsx)("span", { children: "Quarantined & Rejected Ingestion Records" })] }), (0, jsx_runtime_1.jsx)("p", { style: { margin: 0, fontSize: '0.8rem', color: '#94a3b8' }, children: "Auditable log of records rejected during ingestion with row indices and specific failure reasons." })] }), (0, jsx_runtime_1.jsx)("button", { onClick: () => setIsRejectedModalOpen(false), style: { background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }, children: (0, jsx_runtime_1.jsx)(lucide_react_1.X, { size: 20 }) })] }), (0, jsx_runtime_1.jsx)("div", { style: { padding: '16px' }, children: rejectedData.rows.length === 0 ? ((0, jsx_runtime_1.jsx)("p", { style: { color: '#94a3b8', textAlign: 'center', padding: '2rem' }, children: "No rejected records currently logged." })) : ((0, jsx_runtime_1.jsx)("div", { className: "table-wrapper", style: { maxHeight: '55vh', overflowY: 'auto' }, children: (0, jsx_runtime_1.jsxs)("table", { children: [(0, jsx_runtime_1.jsx)("thead", { children: (0, jsx_runtime_1.jsxs)("tr", { children: [(0, jsx_runtime_1.jsx)("th", { children: "Row #" }), (0, jsx_runtime_1.jsx)("th", { children: "Source File" }), (0, jsx_runtime_1.jsx)("th", { children: "Failure Reason" }), (0, jsx_runtime_1.jsx)("th", { children: "Raw Content Payload" }), (0, jsx_runtime_1.jsx)("th", { children: "Timestamp" })] }) }), (0, jsx_runtime_1.jsx)("tbody", { children: rejectedData.rows.map((row, idx) => ((0, jsx_runtime_1.jsxs)("tr", { children: [(0, jsx_runtime_1.jsxs)("td", { style: { fontWeight: 'bold', color: '#f87171' }, children: ["#", row.rowNumber] }), (0, jsx_runtime_1.jsx)("td", { style: { fontSize: '12px', color: '#60a5fa' }, children: row.sourceFile }), (0, jsx_runtime_1.jsx)("td", { style: { fontSize: '12px', color: '#fbbf24', maxWidth: '260px' }, children: row.reason }), (0, jsx_runtime_1.jsx)("td", { style: { fontSize: '11px', fontFamily: 'monospace', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }, children: typeof row.rawContent === 'object' ? JSON.stringify(row.rawContent) : String(row.rawContent) }), (0, jsx_runtime_1.jsx)("td", { style: { fontSize: '11px', color: '#94a3b8' }, children: new Date(row.rejectedAt).toLocaleTimeString() })] }, idx))) })] }) })) })] }) }))] }));
}
