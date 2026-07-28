import { NextResponse, NextRequest } from 'next/server';
import { bootstrap } from '@/core/services/bootstrap';

export async function GET(request: NextRequest) {
  try {
    const context = bootstrap();
    const metrics = await context.statisticsService.listAllMetrics();
    return NextResponse.json(metrics, { status: 200 });
  } catch (error) {
    console.error('[Telemetry API] List failed:', error);
    return NextResponse.json({ message: (error as Error).message }, { status: 500 });
  }
}
