import { NextResponse, NextRequest } from 'next/server';
import { bootstrap } from '@/core/services/bootstrap';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const context = bootstrap();

    const business = await context.businessRepository.findById(id);
    if (!business) {
      return NextResponse.json({ message: `Business account ${id} not found` }, { status: 404 });
    }

    const outstanding = await context.outstandingRepository.findByBusinessId(id);
    const txs = await context.transactionRepository.list({
      partyId: business.name,
      limit: 15,
    });

    return NextResponse.json({
      business,
      outstanding,
      recentTransactions: txs.items,
    }, { status: 200 });
  } catch (error) {
    console.error('[Business 360 API] Detail fetch failed:', error);
    return NextResponse.json({ message: (error as Error).message }, { status: 500 });
  }
}
