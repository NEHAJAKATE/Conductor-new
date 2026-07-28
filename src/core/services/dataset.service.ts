import { ConnectorLifecycleService } from './connector-lifecycle.service';
import { InMemoryDatasetRepository } from '@/infrastructure/repositories/in-memory-repositories';
import { ConnectionConfig, DatasetDescriptor, IngestOptions, PreviewOptions, ValidationResult, PreviewResult } from '@/core/connectors/connector';
import { DatasetEntity } from './domain-models';

export interface DatasetServiceDependencies {
  lifecycleService: ConnectorLifecycleService;
  datasetRepository: InMemoryDatasetRepository;
}

export class DatasetService {
  constructor(private readonly deps: DatasetServiceDependencies) {}

  async registerDataset(connection: ConnectionConfig, dataset: DatasetDescriptor): Promise<DatasetEntity> {
    const schema = dataset.schema ?? (await this.deps.lifecycleService.inferSchema(connection, dataset.id));
    const registered = await this.deps.lifecycleService.registerDataset(connection, {
      ...dataset,
      schema,
    });
    const entity: DatasetEntity = {
      ...registered,
      schema,
      metadata: {
        ...registered.metadata,
        connectorType: connection.connectorType,
        source: connection.connectorType,
        owner: dataset.metadata?.owner ?? connection.organizationId,
        status: 'registered',
        registeredAt: new Date().toISOString(),
      },
      registeredAt: new Date(),
      updatedAt: new Date(),
    };
    return this.deps.datasetRepository.save(entity);
  }

  async previewDataset(connection: ConnectionConfig, datasetId: string, options: PreviewOptions): Promise<PreviewResult> {
    return this.deps.lifecycleService.previewDataset(connection, datasetId, options);
  }

  async validateDataset(connection: ConnectionConfig, datasetId: string): Promise<ValidationResult> {
    return this.deps.lifecycleService.validateDataset(connection, datasetId);
  }

  async ingestDataset(connection: ConnectionConfig, dataset: DatasetEntity, options: IngestOptions) {
    return this.deps.lifecycleService.ingestDataset(connection, dataset, options);
  }

  async extractMetadata(connection: ConnectionConfig, datasetId: string): Promise<Record<string, any>> {
    return this.deps.lifecycleService.extractMetadata(connection, datasetId);
  }
}
