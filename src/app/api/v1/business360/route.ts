import { NextResponse, NextRequest } from 'next/server';
import { bootstrap } from '@/core/services/bootstrap';

export async function GET(request: NextRequest) {
  try {
    const context = bootstrap();
    
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('query') || '';
    const getStats = searchParams.get('stats') === 'true';
    const classification = searchParams.get('classification') as any;
    const city = searchParams.get('city') || undefined;
    const minOutstanding = searchParams.get('minOutstanding') ? parseFloat(searchParams.get('minOutstanding')!) : undefined;

    if (getStats) {
      const stats = await context.businessRepository.getStats();
      return NextResponse.json(stats, { status: 200 });
    }

    const businesses = await context.businessRepository.list({
      query,
      classification,
      city,
      minOutstanding,
    });

    return NextResponse.json({ businesses }, { status: 200 });
  } catch (error) {
    console.error('[Business 360 API] Fetch failed:', error);
    return NextResponse.json({ message: (error as Error).message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const context = bootstrap();

    const entity = await context.businessRepository.save(body);
    return NextResponse.json(entity, { status: 201 });
  } catch (error) {
    console.error('[Business 360 API] Create failed:', error);
    return NextResponse.json({ message: (error as Error).message }, { status: 500 });
  }
}
