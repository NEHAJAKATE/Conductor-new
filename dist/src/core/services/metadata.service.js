"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MetadataService = void 0;
class MetadataService {
    metadataStore = new Map();
    async registerMetadata(metadata) {
        console.log(`[MetadataService] Registering metadata object for dataset ${metadata.datasetName} (ID: ${metadata.datasetId})`);
        this.metadataStore.set(metadata.datasetId, metadata);
        return metadata;
    }
    async getMetadata(datasetId) {
        return this.metadataStore.get(datasetId);
    }
    async buildDatasetMetadata(dataset) {
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
exports.MetadataService = MetadataService;
