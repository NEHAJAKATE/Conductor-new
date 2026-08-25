"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InMemoryWorkflowRepository = void 0;
class InMemoryWorkflowRepository {
    get storage() {
        if (!globalThis.__workflowStorageMap__) {
            globalThis.__workflowStorageMap__ = new Map();
        }
        return globalThis.__workflowStorageMap__;
    }
    async save(workflow) {
        workflow.updatedAt = new Date();
        this.storage.set(workflow.id, workflow);
        return workflow;
    }
    async findById(id) {
        return this.storage.get(id);
    }
    async list() {
        return Array.from(this.storage.values());
    }
}
exports.InMemoryWorkflowRepository = InMemoryWorkflowRepository;
