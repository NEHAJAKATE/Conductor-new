import { DatasetEntity } from './domain-models';

export interface DatasetMetadataObject {
  datasetId: string;
  datasetName: string;
  bucket: string;
  objectKey: string;
  size: number;
  delimiter: string;
  encoding: string;
  uploadedBy: string;
  uploadedAt: string;
  status: string;
  connector: string;
  checksum: string;
}

export class MetadataService {
  private metadataStore = new Map<string, DatasetMetadataObject>();

  async registerMetadata(metadata: DatasetMetadataObject): Promise<DatasetMetadataObject> {
    console.log(`[MetadataService] Registering metadata object for dataset ${metadata.datasetName} (ID: ${metadata.datasetId})`);
    this.metadataStore.set(metadata.datasetId, metadata);
    return metadata;
  }

  async getMetadata(datasetId: string): Promise<DatasetMetadataObject | undefined> {
    return this.metadataStore.get(datasetId);
  }

  async buildDatasetMetadata(dataset: DatasetEntity): Promise<Record<string, any>> {
    const existing = this.metadataStore.get(dataset.id);
    return {
      datasetId: dataset.id,
      name: dataset.displayName,
      connectorType: dataset.metadata?.connectorType || 'csv',
      owner: dataset.metadata?.owner || 'unknown',
      uploadTime: dataset.updatedAt.toISOString(),
      rowCount: dataset.metadata?.rowCount ?? dataset.schema?.fields.length ?? 0,
      columnCount: dataset.schema?.fields.length ?? 0,
      schema: dataset.schema,
      fileSize: dataset.metadata?.fileSize,
      status: dataset.metadata?.status || 'registered',
      source: dataset.metadata?.source || 'csv',
      version: dataset.schema?.version ?? '1.0',
      bucket: existing?.bucket || 'simulated-r2-bucket',
      objectKey: existing?.objectKey || dataset.sourceName,
      checksum: existing?.checksum || 'md5-hash-placeholder',
    };
  }
}
