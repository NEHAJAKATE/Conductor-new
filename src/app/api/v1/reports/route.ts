import { NextResponse, NextRequest } from 'next/server';
import { bootstrap } from '@/core/services/bootstrap';
import { ReportService, ReportQueryParams } from '@/core/reports/report.service';

export async function GET(request: NextRequest) {
  try {
    const context = bootstrap();
    
    // No auto-ingest backdoor: reports must only reflect ingested data

    const searchParams = request.nextUrl.searchParams;
    const dataset = (searchParams.get('dataset') || 'sales') as any;
    const startDate = searchParams.get('startDate') || undefined;
    const endDate = searchParams.get('endDate') || undefined;
    const groupBy = searchParams.get('groupBy') as any;
    const filterParty = searchParams.get('filterParty') || undefined;
    const filterCompany = searchParams.get('filterCompany') || undefined;
    const filterRisk = searchParams.get('filterRisk') || undefined;
    const search = searchParams.get('search') || undefined;
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!, 10) : 50;
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!, 10) : 0;
    const sortBy = searchParams.get('sortBy') || undefined;
    const sortOrder = (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc';

    const queryParams: ReportQueryParams = {
      dataset,
      startDate,
      endDate,
      groupBy,
      filterParty,
      filterCompany,
      filterRisk,
      search,
      limit,
      offset,
      sortBy,
      sortOrder,
    };

    const report = await ReportService.generateReport(queryParams);
    return NextResponse.json(report, { status: 200 });
  } catch (error) {
    console.error('[Reports API] Generate report failed:', error);
    return NextResponse.json({ message: (error as Error).message }, { status: 500 });
  }
}
