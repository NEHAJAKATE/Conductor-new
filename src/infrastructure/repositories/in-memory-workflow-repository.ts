import { WorkflowEntity } from '@/core/workflow/workflow-orchestrator';

export class InMemoryWorkflowRepository {
  private readonly storage = new Map<string, WorkflowEntity>();

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
