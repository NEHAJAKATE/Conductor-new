import { NextResponse } from 'next/server';
import { transactionRepository, outstandingRepository } from '@/infrastructure/repositories/canonical-repositories';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const partyName = searchParams.get('partyName');
    const businessId = searchParams.get('businessId');

    if (!partyName && !businessId) {
      return NextResponse.json({ error: 'partyName or businessId parameter is required' }, { status: 400 });
    }

    // Fetch transactions
    const allTxs = await transactionRepository.getAll();
    let partyTxs: typeof allTxs = [];

    // Simple matching by partyName or partyId
    if (businessId) {
      partyTxs = allTxs.filter(t => t.partyId === businessId);
      // Fallback to name match if IDs don't match (since IDs are generated at ingestion)
      if (partyTxs.length === 0 && partyName) {
        partyTxs = allTxs.filter(t => t.partyName.toLowerCase() === partyName.toLowerCase());
      }
    } else if (partyName) {
      partyTxs = allTxs.filter(t => t.partyName.toLowerCase() === partyName.toLowerCase());
    }

    // Sort descending by date
    partyTxs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Fetch outstanding details
    const allOutstandings = await outstandingRepository.list();
    let outstanding = null;
    if (businessId) {
      outstanding = allOutstandings.find(o => o.businessId === businessId);
      if (!outstanding && partyName) {
        outstanding = allOutstandings.find(o => o.businessName.toLowerCase() === partyName.toLowerCase());
      }
    } else if (partyName) {
      outstanding = allOutstandings.find(o => o.businessName.toLowerCase() === partyName.toLowerCase());
    }

    return NextResponse.json({
      transactions: partyTxs,
      outstanding: outstanding || null
    });
  } catch (error) {
    console.error('API Error in /customer-transactions:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
