import { ConnectionConfig, DatasetDescriptor, SchemaDefinition } from '../connectors/connector';

export interface ConnectionEntity extends ConnectionConfig {
  createdAt: Date;
  updatedAt: Date;
  lastTestedAt?: Date;
}

export interface DatasetEntity extends DatasetDescriptor {
  registeredAt: Date;
  updatedAt: Date;
  schema: SchemaDefinition;
  metadata: {
    connectorType: string;
    source: string;
    owner: string;
    status: 'registered' | 'validating' | 'validated' | 'ingesting' | 'ingested' | 'failed';
    registeredAt: string;
    fileSize?: number;
    rowCount?: number;
    delimiter?: string;
    encoding?: string;
    [key: string]: any;
  };
}

export interface JobPayload {
  connection: ConnectionEntity;
  dataset: DatasetEntity;
  options: Record<string, any>;
}

export interface JobEntity {
  id: string;
  connectionId: string;
  datasetId: string;
  jobType: 'ingestion' | 'validation' | 'schema_detection';
  status: 'pending' | 'queued' | 'running' | 'validating' | 'completed' | 'failed' | 'retrying';
  payload?: JobPayload;
  metrics?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  lastError?: string;
}
