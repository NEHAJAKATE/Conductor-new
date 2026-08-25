"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConnectorLifecycleService = void 0;
class ConnectorLifecycleService {
    deps;
    constructor(deps) {
        this.deps = deps;
    }
    getConnector(type) {
        const connector = this.deps.connectorRegistry.get(type);
        if (!connector) {
            throw new Error(`Connector plugin for type '${type}' not registered.`);
        }
        return connector;
    }
    async testConnection(connection) {
        const connector = this.getConnector(connection.connectorType);
        await connector.testConnection(connection);
    }
    async discoverDatasets(connection) {
        const connector = this.getConnector(connection.connectorType);
        return connector.discoverDatasets(connection);
    }
    async previewDataset(connection, datasetId, options) {
        const connector = this.getConnector(connection.connectorType);
        return connector.previewDataset(connection, datasetId, options);
    }
    async inferSchema(connection, datasetId) {
        const connector = this.getConnector(connection.connectorType);
        return connector.inferSchema(connection, datasetId);
    }
    async validateDataset(connection, datasetId) {
        const connector = this.getConnector(connection.connectorType);
        return connector.validateDataset(connection, datasetId);
    }
    async registerDataset(connection, dataset) {
        const connector = this.getConnector(connection.connectorType);
        return connector.registerDataset(connection, dataset);
    }
    async ingestDataset(connection, dataset, options) {
        const connector = this.getConnector(connection.connectorType);
        return connector.ingestDataset(connection, dataset, options);
    }
    async extractMetadata(connection, datasetId) {
        const connector = this.getConnector(connection.connectorType);
        return connector.extractMetadata(connection, datasetId);
    }
}
exports.ConnectorLifecycleService = ConnectorLifecycleService;
