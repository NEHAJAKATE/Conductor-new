"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InMemoryJobRepository = exports.InMemoryDatasetRepository = exports.InMemoryConnectionRepository = void 0;
class InMemoryConnectionRepository {
    get storage() {
        if (!globalThis.__connectionStorageMap__) {
            globalThis.__connectionStorageMap__ = new Map();
        }
        return globalThis.__connectionStorageMap__;
    }
    async save(connection) {
        const entity = {
            ...connection,
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        this.storage.set(entity.id, entity);
        return entity;
    }
    async findById(id) {
        return this.storage.get(id);
    }
    async updateLastTestedAt(id, lastTestedAt) {
        const existing = this.storage.get(id);
        if (!existing)
            return;
        existing.lastTestedAt = lastTestedAt;
        existing.updatedAt = new Date();
    }
}
exports.InMemoryConnectionRepository = InMemoryConnectionRepository;
class InMemoryDatasetRepository {
    get storage() {
        if (!globalThis.__datasetStorageMap__) {
            globalThis.__datasetStorageMap__ = new Map();
        }
        return globalThis.__datasetStorageMap__;
    }
    async save(dataset) {
        const entity = {
            ...dataset,
            registeredAt: new Date(),
            updatedAt: new Date(),
        };
        this.storage.set(entity.id, entity);
        return entity;
    }
    async findById(id) {
        return this.storage.get(id);
    }
    async list() {
        return Array.from(this.storage.values());
    }
}
exports.InMemoryDatasetRepository = InMemoryDatasetRepository;
class InMemoryJobRepository {
    get storage() {
        if (!globalThis.__jobStorageMap__) {
            globalThis.__jobStorageMap__ = new Map();
        }
        return globalThis.__jobStorageMap__;
    }
    async save(job) {
        this.storage.set(job.id, job);
        return job;
    }
    async findById(id) {
        return this.storage.get(id);
    }
}
exports.InMemoryJobRepository = InMemoryJobRepository;
