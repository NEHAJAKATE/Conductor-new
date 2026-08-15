import { NextResponse, NextRequest } from 'next/server';
import { schedulerService } from '@/core/scheduler/scheduler.service';
import { AtcIngestRunner } from '@/core/services/atc-ingest-runner';

export async function GET() {
  try {
    const jobs = await schedulerService.listJobs();
    return NextResponse.json({ jobs }, { status: 200 });
  } catch (error) {
    console.error('[Scheduler API] List failed:', error);
    return NextResponse.json({ message: (error as Error).message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const action = body.action;

    if (action === 'sync_now') {
      const summary = await AtcIngestRunner.runFullAtcIngestion(true);
      return NextResponse.json({ message: 'Sync completed', summary }, { status: 200 });
    }

    if (action === 'update_job' && body.job) {
      const updated = await schedulerService.saveJob(body.job);
      return NextResponse.json({ job: updated }, { status: 200 });
    }

    return NextResponse.json({ message: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('[Scheduler API] Operation failed:', error);
    return NextResponse.json({ message: (error as Error).message }, { status: 500 });
  }
}
