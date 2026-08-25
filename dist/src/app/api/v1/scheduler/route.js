"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = GET;
exports.POST = POST;
const server_1 = require("next/server");
const scheduler_service_1 = require("@/core/scheduler/scheduler.service");
const atc_ingest_runner_1 = require("@/core/services/atc-ingest-runner");
async function GET() {
    try {
        const jobs = await scheduler_service_1.schedulerService.listJobs();
        return server_1.NextResponse.json({ jobs }, { status: 200 });
    }
    catch (error) {
        console.error('[Scheduler API] List failed:', error);
        return server_1.NextResponse.json({ message: error.message }, { status: 500 });
    }
}
async function POST(request) {
    try {
        const body = await request.json();
        const action = body.action;
        if (action === 'sync_now') {
            const summary = await atc_ingest_runner_1.AtcIngestRunner.runFullAtcIngestion(true);
            return server_1.NextResponse.json({ message: 'Sync completed', summary }, { status: 200 });
        }
        if (action === 'update_job' && body.job) {
            const updated = await scheduler_service_1.schedulerService.saveJob(body.job);
            return server_1.NextResponse.json({ job: updated }, { status: 200 });
        }
        return server_1.NextResponse.json({ message: 'Invalid action' }, { status: 400 });
    }
    catch (error) {
        console.error('[Scheduler API] Operation failed:', error);
        return server_1.NextResponse.json({ message: error.message }, { status: 500 });
    }
}
