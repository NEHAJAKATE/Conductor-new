import { ConnectionConfig } from '@/core/connectors/connector';
import { ConnectionEntity, DatasetEntity, JobEntity } from '@/core/services/domain-models';

export type ConnectionEntityRecord = ConnectionEntity;
export type DatasetEntityRecord = DatasetEntity;
export type JobEntityRecord = JobEntity;

declare global {
  var __connectionStorageMap__: Map<string, ConnectionEntityRecord> | undefined;
  var __datasetStorageMap__: Map<string, DatasetEntityRecord> | undefined;
  var __jobStorageMap__: Map<string, JobEntityRecord> | undefined;
}

export class InMemoryConnectionRepository {
  private get storage(): Map<string, ConnectionEntityRecord> {
    if (!globalThis.__connectionStorageMap__) {
      globalThis.__connectionStorageMap__ = new Map<string, ConnectionEntityRecord>();
    }
    return globalThis.__connectionStorageMap__;
  }

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
  private get storage(): Map<string, DatasetEntityRecord> {
    if (!globalThis.__datasetStorageMap__) {
      globalThis.__datasetStorageMap__ = new Map<string, DatasetEntityRecord>();
    }
    return globalThis.__datasetStorageMap__;
  }

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
  private get storage(): Map<string, JobEntityRecord> {
    if (!globalThis.__jobStorageMap__) {
      globalThis.__jobStorageMap__ = new Map<string, JobEntityRecord>();
    }
    return globalThis.__jobStorageMap__;
  }

  async save(job: JobEntity): Promise<JobEntityRecord> {
    this.storage.set(job.id, job);
    return job;
  }

  async findById(id: string): Promise<JobEntityRecord | undefined> {
    return this.storage.get(id);
  }
}
