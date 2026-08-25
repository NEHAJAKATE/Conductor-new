"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatasetService = void 0;
class DatasetService {
    deps;
    constructor(deps) {
        this.deps = deps;
    }
    async registerDataset(connection, dataset) {
        const schema = dataset.schema ?? (await this.deps.lifecycleService.inferSchema(connection, dataset.id));
        const registered = await this.deps.lifecycleService.registerDataset(connection, {
            ...dataset,
            schema,
        });
        const entity = {
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
    async previewDataset(connection, datasetId, options) {
        return this.deps.lifecycleService.previewDataset(connection, datasetId, options);
    }
    async validateDataset(connection, datasetId) {
        return this.deps.lifecycleService.validateDataset(connection, datasetId);
    }
    async ingestDataset(connection, dataset, options) {
        return this.deps.lifecycleService.ingestDataset(connection, dataset, options);
    }
    async extractMetadata(connection, datasetId) {
        return this.deps.lifecycleService.extractMetadata(connection, datasetId);
    }
}
exports.DatasetService = DatasetService;
