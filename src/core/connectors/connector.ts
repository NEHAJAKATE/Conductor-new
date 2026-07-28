export type ConnectorType = 'csv' | 'excel' | 'json' | 'parquet' | 's3' | 'azure_blob' | 'gcs' | 'ftp' | 'sftp' | 'kafka' | 'rest_api' | 'postgres' | 'mysql' | 'salesforce' | 'hubspot' | 'adobe_aep' | 'folder' | 'iceberg';

export interface ConnectionConfig {
  id: string;
  organizationId: string;
  name: string;
  connectorType: ConnectorType;
  config: Record<string, any>;
  secretReference?: string;
  metadata?: Record<string, any>;
}

export interface ConnectorConfigProperty {
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  title?: string;
  description?: string;
  default?: any;
  required?: boolean;
}

export interface ConnectorConfigSchema {
  type: 'object';
  properties: Record<string, ConnectorConfigProperty>;
  required?: string[];
}

export interface DatasetDescriptor {
  id: string;
  connectionId: string;
  sourceName: string;
  displayName: string;
  logicalName?: string;
  schema?: SchemaDefinition;
  metadata?: Record<string, any>;
}

export interface SchemaField {
  name: string;
  type: string;
  nullable: boolean;
  metadata?: Record<string, any>;
}

export interface SchemaDefinition {
  fields: SchemaField[];
  primaryKeys?: string[];
  version?: string;
  raw?: Record<string, any>;
}

export interface PreviewOptions {
  limit: number;
  sampleStrategy?: 'head' | 'random' | 'stratified';
}

export interface PreviewResult {
  rows: Array<Record<string, any>>;
  schema: SchemaDefinition;
  metadata: Record<string, any>;
}

export interface DatasetMetadata {
  datasetId: string;
  name: string;
  connectorType: ConnectorType;
  owner: string;
  uploadTime: string;
  rowCount?: number;
  columnCount?: number;
  schema?: SchemaDefinition;
  fileSize?: number;
  status: string;
  source: string;
  version?: string;
}

export interface ValidationIssue {
  field: string;
  severity: 'error' | 'warning' | 'info';
  code: string;
  message: string;
  rowSample?: Record<string, any>;
}

export interface ValidationResult {
  valid: boolean;
  issues: ValidationIssue[];
  recordCount?: number;
  fieldStatistics?: Record<string, any>;
}

export interface IngestOptions {
  mode: 'full' | 'incremental';
  checkpoint?: Record<string, any>;
  destination?: Record<string, any>;
}

export interface IngestResult {
  jobId: string;
  status: 'pending' | 'queued' | 'running' | 'completed' | 'failed' | 'retrying';
  metadata?: Record<string, any>;
}

export interface ConnectorPlugin {
  readonly type: ConnectorType;
  readonly displayName: string;
  readonly description: string;

  describeConnectionSchema(): ConnectorConfigSchema;
  testConnection(connection: ConnectionConfig): Promise<void>;
  discoverDatasets(connection: ConnectionConfig): Promise<DatasetDescriptor[]>;
  previewDataset(connection: ConnectionConfig, datasetId: string, options: PreviewOptions): Promise<PreviewResult>;
  inferSchema(connection: ConnectionConfig, datasetId: string): Promise<SchemaDefinition>;
  validateDataset(connection: ConnectionConfig, datasetId: string): Promise<ValidationResult>;
  registerDataset(connection: ConnectionConfig, dataset: DatasetDescriptor): Promise<DatasetDescriptor>;
  ingestDataset(connection: ConnectionConfig, dataset: DatasetDescriptor, options: IngestOptions): Promise<IngestResult>;
  extractMetadata(connection: ConnectionConfig, datasetId: string): Promise<Record<string, any>>;
}
