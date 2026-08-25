"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JobRunner = void 0;
class JobRunner {
    jobRepository;
    lifecycleService;
    pendingQueue = [];
    isRunning = false;
    constructor(jobRepository, lifecycleService) {
        this.jobRepository = jobRepository;
        this.lifecycleService = lifecycleService;
    }
    enqueue(jobId) {
        this.pendingQueue.push(jobId);
        this.startLoop();
    }
    async startLoop() {
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
    async executeJob(job) {
        const runningJob = {
            ...job,
            status: 'running',
            updatedAt: new Date(),
            lastError: undefined,
        };
        await this.jobRepository.save(runningJob);
        try {
            if (runningJob.jobType === 'ingestion' && runningJob.payload) {
                const result = await this.lifecycleService.ingestDataset(runningJob.payload.connection, runningJob.payload.dataset, runningJob.payload.options);
                const completedJob = {
                    ...runningJob,
                    status: 'completed',
                    updatedAt: new Date(),
                    metrics: result.metadata ?? {},
                };
                await this.jobRepository.save(completedJob);
            }
            else {
                const completedJob = {
                    ...runningJob,
                    status: 'completed',
                    updatedAt: new Date(),
                };
                await this.jobRepository.save(completedJob);
            }
        }
        catch (error) {
            const failedJob = {
                ...runningJob,
                status: 'failed',
                updatedAt: new Date(),
                lastError: error.message,
            };
            await this.jobRepository.save(failedJob);
        }
    }
}
exports.JobRunner = JobRunner;
