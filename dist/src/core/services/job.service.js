"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JobService = void 0;
const uuid_1 = require("uuid");
class JobService {
    jobRepository;
    jobRunner;
    constructor(jobRepository, jobRunner) {
        this.jobRepository = jobRepository;
        this.jobRunner = jobRunner;
    }
    async createJob(params) {
        const job = {
            id: (0, uuid_1.v4)(),
            ...params,
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        const saved = await this.jobRepository.save(job);
        this.jobRunner.enqueue(saved.id);
        return saved;
    }
    async findJobById(jobId) {
        return this.jobRepository.findById(jobId);
    }
    async retryJob(jobId) {
        const existing = await this.jobRepository.findById(jobId);
        if (!existing) {
            throw new Error(`Job ${jobId} not found.`);
        }
        if (existing.status === 'running') {
            throw new Error('Cannot retry a job that is currently running.');
        }
        const retried = {
            ...existing,
            id: (0, uuid_1.v4)(),
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
exports.JobService = JobService;
