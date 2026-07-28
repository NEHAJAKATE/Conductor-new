import { InMemoryJobRepository } from '@/infrastructure/repositories/in-memory-repositories';
import { JobEntity } from './domain-models';
import { ConnectorLifecycleService } from './connector-lifecycle.service';

export class JobRunner {
  private pendingQueue: string[] = [];
  private isRunning = false;

  constructor(private readonly jobRepository: InMemoryJobRepository, private readonly lifecycleService: ConnectorLifecycleService) {}

  enqueue(jobId: string): void {
    this.pendingQueue.push(jobId);
    this.startLoop();
  }

  private async startLoop(): Promise<void> {
    if (this.isRunning) {
      return;
    }
    this.isRunning = true;

    while (this.pendingQueue.length > 0) {
      const jobId = this.pendingQueue.shift();
      if (!jobId) {
        continue;
      }

      const job = await this.jobRepository.findById(jobId);
      if (!job) {
        continue;
      }

      await this.executeJob(job);
    }

    this.isRunning = false;
  }

  private async executeJob(job: JobEntity): Promise<void> {
    const runningJob: JobEntity = {
      ...job,
      status: 'running',
      updatedAt: new Date(),
      lastError: undefined,
    };
    await this.jobRepository.save(runningJob);

    try {
      if (runningJob.jobType === 'ingestion' && runningJob.payload) {
        const result = await this.lifecycleService.ingestDataset(
          runningJob.payload.connection as any,
          runningJob.payload.dataset as any,
          runningJob.payload.options as any,
        );

        const completedJob: JobEntity = {
          ...runningJob,
          status: 'completed',
          updatedAt: new Date(),
          metrics: result.metadata ?? {},
        };
        await this.jobRepository.save(completedJob);
      } else {
        const completedJob: JobEntity = {
          ...runningJob,
          status: 'completed',
          updatedAt: new Date(),
        };
        await this.jobRepository.save(completedJob);
      }
    } catch (error) {
      const failedJob: JobEntity = {
        ...runningJob,
        status: 'failed',
        updatedAt: new Date(),
        lastError: (error as Error).message,
      };
      await this.jobRepository.save(failedJob);
    }
  }
}
