import { NextResponse, NextRequest } from 'next/server';
import { bootstrap } from '@/core/services/bootstrap';
import { v5 as uuidv5 } from 'uuid';
import { config } from '@/core/config';

export async function GET(request: NextRequest) {
  try {
    const context = bootstrap();
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('query') || '';
    const getStats = searchParams.get('stats') === 'true';

    if (getStats) {
      const stats = await context.customerRepository.getStats();
      return NextResponse.json(stats, { status: 200 });
    }

    const profiles = await context.customerRepository.search(query);
    
    const simplified = profiles.map(p => ({
      uuid: p.uuid,
      name: p.identity.name || 'Unnamed Customer',
      email: p.identity.email || 'Unknown Email',
      phone: p.identity.phone || 'Unknown Phone',
      pan: p.identity.pan || 'Not Linked',
      dob: p.identity.dob || '',
      segment: p.identity.segment || 'Regular',
      riskScore: p.identity.riskScore || 0,
      completionRate: p.identity.completionRate || 0,
      confidence: p.confidence,
      status: p.identity.status || 'Active',
      profileType: p.identity.profileType || 'Known Customer',
      cookieId: p.identity.cookieId || '',
      location: p.identity.location || p.identity.country || 'Unknown'
    }));

    return NextResponse.json({ profiles: simplified }, { status: 200 });
  } catch (error) {
    console.error('[Customer 360 API] Fetch list failed:', error);
    return NextResponse.json({ message: (error as Error).message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, anonymousId, name, email, phone, pan, aadhaar, dob, address, segment } = body;

    const context = bootstrap();

    if (action === 'merge') {
      if (!anonymousId || !email) {
        return NextResponse.json({ message: 'anonymousId and email are required for merge' }, { status: 400 });
      }
      const merged = await context.customerRepository.mergeAnonymousVisitor(anonymousId, email, name || 'Known Customer');
      if (!merged) {
        return NextResponse.json({ message: 'Anonymous visitor not found' }, { status: 404 });
      }
      return NextResponse.json({ message: 'Visitor merged successfully', profile: merged }, { status: 200 });
    }

    if (!name || !email) {
      return NextResponse.json({ message: 'Name and Email are required' }, { status: 400 });
    }

    // Generate deterministic Customer ID using email
    const canonicalString = `email:${email.toLowerCase().trim()}`;
    const unifiedUuid = uuidv5(canonicalString, config.identity.namespace);

    // Check if profile already exists
    const existing = await context.customerRepository.findByUuid(unifiedUuid);
    if (existing) {
      return NextResponse.json({ message: 'Customer with this email already exists', profile: existing }, { status: 409 });
    }

    // Build profile structure
    const newProfile: any = {
      uuid: unifiedUuid,
      identity: {
        name,
        email,
        phone: phone || '',
        pan: pan || '',
        aadhaar: aadhaar || '',
        dob: dob || '',
        address: address || '',
        customerId: `CUST-${Math.floor(1000 + Math.random() * 9000)}`,
        photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
        segment: segment || 'Regular',
        riskScore: 10,
        completionRate: 60,
        status: 'Active'
      },
      piiTags: [
        { fieldName: 'name', classification: 'NAME', masked: false },
        { fieldName: 'email', classification: 'EMAIL', masked: true },
        { fieldName: 'phone', classification: 'PHONE', masked: true },
        { fieldName: 'pan', classification: 'PAN', masked: true },
        { fieldName: 'aadhaar', classification: 'AADHAAR', masked: true },
        { fieldName: 'dob', classification: 'DOB', masked: true },
        { fieldName: 'address', classification: 'ADDRESS', masked: true }
      ],
      behavioralEvents: [
        { eventId: `evt-${Math.floor(100 + Math.random() * 900)}`, type: 'Visited Website', timestamp: new Date().toISOString(), source: 'UI Ingestion', details: 'Profile registered manually.' }
      ],
      financial: {
        accounts: [
          { accountId: `acc-${Math.floor(1000 + Math.random() * 9000)}`, accountType: 'Savings', institution: 'State Bank of India', balance: 25000.00, currency: 'INR' }
        ],
        cards: [],
        loans: [],
        invoices: [],
        payments: [],
        subscriptions: [],
        creditScore: 720
      },
      lineage: [
        { attributeName: 'name', sourceSystem: 'Platform UI', timestamp: new Date().toISOString(), originalValue: name },
        { attributeName: 'email', sourceSystem: 'Platform UI', timestamp: new Date().toISOString(), originalValue: email }
      ],
      confidence: 100,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await context.customerRepository.save(newProfile);

    return NextResponse.json(newProfile, { status: 201 });
  } catch (error) {
    console.error('[Customer 360 API] Create profile failed:', error);
    return NextResponse.json({ message: (error as Error).message }, { status: 500 });
  }
}

