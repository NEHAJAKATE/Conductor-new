import { v4 as uuidv4 } from 'uuid';
import { InMemoryJobRepository } from '@/infrastructure/repositories/in-memory-repositories';
import { JobRunner } from './job-runner';
import { JobEntity } from './domain-models';

export class JobService {
  constructor(private readonly jobRepository: InMemoryJobRepository, private readonly jobRunner: JobRunner) {}

  async createJob(params: Omit<JobEntity, 'id' | 'createdAt' | 'updatedAt'>): Promise<JobEntity> {
    const job: JobEntity = {
      id: uuidv4(),
      ...params,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const saved = await this.jobRepository.save(job);
    this.jobRunner.enqueue(saved.id);
    return saved;
  }

  async findJobById(jobId: string): Promise<JobEntity | undefined> {
    return this.jobRepository.findById(jobId);
  }

  async retryJob(jobId: string): Promise<JobEntity> {
    const existing = await this.jobRepository.findById(jobId);
    if (!existing) {
      throw new Error(`Job ${jobId} not found.`);
    }

    if (existing.status === 'running') {
      throw new Error('Cannot retry a job that is currently running.');
    }

    const retried: JobEntity = {
      ...existing,
      id: uuidv4(),
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
      lastError: undefined,
    };
    const saved = await this.jobRepository.save(retried);
    this.jobRunner.enqueue(saved.id);
    return saved;
  }
}
