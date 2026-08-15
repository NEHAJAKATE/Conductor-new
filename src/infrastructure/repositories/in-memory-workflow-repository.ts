import { WorkflowEntity } from '@/core/workflow/workflow-orchestrator';

declare global {
  var __workflowStorageMap__: Map<string, WorkflowEntity> | undefined;
}

export class InMemoryWorkflowRepository {
  private get storage(): Map<string, WorkflowEntity> {
    if (!globalThis.__workflowStorageMap__) {
      globalThis.__workflowStorageMap__ = new Map<string, WorkflowEntity>();
    }
    return globalThis.__workflowStorageMap__;
  }

  async save(workflow: WorkflowEntity): Promise<WorkflowEntity> {
    workflow.updatedAt = new Date();
    this.storage.set(workflow.id, workflow);
    return workflow;
  }

  async findById(id: string): Promise<WorkflowEntity | undefined> {
    return this.storage.get(id);
  }

  async list(): Promise<WorkflowEntity[]> {
    return Array.from(this.storage.values());
  }
}
