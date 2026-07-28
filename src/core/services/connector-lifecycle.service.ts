import { ConnectorRegistry } from '@/core/connectors/connector-registry';
import { ConnectionConfig, DatasetDescriptor, IngestOptions, PreviewOptions } from '@/core/connectors/connector';

export interface ConnectorLifecycleServiceDependencies {
  connectorRegistry: ConnectorRegistry;
}

export class ConnectorLifecycleService {
  constructor(private readonly deps: ConnectorLifecycleServiceDependencies) {}

  private getConnector(type: string) {
    const connector = this.deps.connectorRegistry.get(type as any);
    if (!connector) {
      throw new Error(`Connector plugin for type '${type}' not registered.`);
    }
    return connector;
  }

  async testConnection(connection: ConnectionConfig): Promise<void> {
    const connector = this.getConnector(connection.connectorType);
    await connector.testConnection(connection);
  }

  async discoverDatasets(connection: ConnectionConfig): Promise<DatasetDescriptor[]> {
    const connector = this.getConnector(connection.connectorType);
    return connector.discoverDatasets(connection);
  }

  async previewDataset(connection: ConnectionConfig, datasetId: string, options: PreviewOptions) {
    const connector = this.getConnector(connection.connectorType);
    return connector.previewDataset(connection, datasetId, options);
  }

  async inferSchema(connection: ConnectionConfig, datasetId: string) {
    const connector = this.getConnector(connection.connectorType);
    return connector.inferSchema(connection, datasetId);
  }

  async validateDataset(connection: ConnectionConfig, datasetId: string) {
    const connector = this.getConnector(connection.connectorType);
    return connector.validateDataset(connection, datasetId);
  }

  async registerDataset(connection: ConnectionConfig, dataset: DatasetDescriptor) {
    const connector = this.getConnector(connection.connectorType);
    return connector.registerDataset(connection, dataset);
  }

  async ingestDataset(connection: ConnectionConfig, dataset: DatasetDescriptor, options: IngestOptions) {
    const connector = this.getConnector(connection.connectorType);
    return connector.ingestDataset(connection, dataset, options);
  }

  async extractMetadata(connection: ConnectionConfig, datasetId: string) {
    const connector = this.getConnector(connection.connectorType);
    return connector.extractMetadata(connection, datasetId);
  }
}
