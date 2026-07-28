import { ConnectionConfig } from '@/core/connectors/connector';
import { ConnectionEntity, DatasetEntity, JobEntity } from '@/core/services/domain-models';

export type ConnectionEntityRecord = ConnectionEntity;
export type DatasetEntityRecord = DatasetEntity;
export type JobEntityRecord = JobEntity;

export class InMemoryConnectionRepository {
  private readonly storage = new Map<string, ConnectionEntityRecord>();

  async save(connection: ConnectionConfig): Promise<ConnectionEntityRecord> {
    const entity: ConnectionEntityRecord = {
      ...connection,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.storage.set(entity.id, entity);
    return entity;
  }

  async findById(id: string): Promise<ConnectionEntityRecord | undefined> {
    return this.storage.get(id);
  }

  async updateLastTestedAt(id: string, lastTestedAt: Date): Promise<void> {
    const existing = this.storage.get(id);
    if (!existing) return;
    existing.lastTestedAt = lastTestedAt;
    existing.updatedAt = new Date();
  }
}

export class InMemoryDatasetRepository {
  private readonly storage = new Map<string, DatasetEntityRecord>();

  async save(dataset: DatasetEntity): Promise<DatasetEntityRecord> {
    const entity: DatasetEntityRecord = {
      ...dataset,
      registeredAt: new Date(),
      updatedAt: new Date(),
    };
    this.storage.set(entity.id, entity);
    return entity;
  }

  async findById(id: string): Promise<DatasetEntityRecord | undefined> {
    return this.storage.get(id);
  }

  async list(): Promise<DatasetEntityRecord[]> {
    return Array.from(this.storage.values());
  }
}

export class InMemoryJobRepository {
  private readonly storage = new Map<string, JobEntityRecord>();

  async save(job: JobEntity): Promise<JobEntityRecord> {
    this.storage.set(job.id, job);
    return job;
  }

  async findById(id: string): Promise<JobEntityRecord | undefined> {
    return this.storage.get(id);
  }
}
