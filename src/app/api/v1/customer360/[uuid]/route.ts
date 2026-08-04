import { NextResponse, NextRequest } from 'next/server';
import { bootstrap } from '@/core/services/bootstrap';
import { privacyPolicyService } from '@/core/customer360/services/privacy-policy.service';
import { PiiClassification } from '@/core/customer360/domain/pii.types';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ uuid: string }> }
) {
  const { uuid } = await params;
  try {
    const context = bootstrap();
    const searchParams = request.nextUrl.searchParams;
    const role = (searchParams.get('role') || 'Analyst') as 'Admin' | 'Owner' | 'Compliance Officer' | 'Marketing' | 'Analyst' | 'Developer' | 'AI Agent';

    const profile = await context.customerRepository.findByUuid(uuid);
    if (!profile) {
      return NextResponse.json({ message: `Customer profile ${uuid} not found` }, { status: 404 });
    }

    // Clone the profile to apply role-based masking without mutating the memory cache
    const cloned: typeof profile = JSON.parse(JSON.stringify(profile));

    // Mask identity fields
    cloned.piiTags.forEach(tag => {
      const field = tag.fieldName as keyof typeof cloned.identity;
      const originalValue = cloned.identity[field];
      if (originalValue !== undefined) {
        cloned.identity[field] = privacyPolicyService.maskValue(
          originalValue,
          tag.classification,
          role
        ) as any;
      }
    });

    const isPrivileged = role === 'Admin' || role === 'Owner' || role === 'Compliance Officer' || role === 'Developer';

    // Audit Log masking event
    if (!isPrivileged) {
      console.log(`[Privacy Center] Audit: Role '${role}' accessed masked profile for Customer ID ${uuid}`);
    } else {
      console.log(`[Privacy Center] Audit WARNING: ${role} role accessed RAW unmasked profile for Customer ID ${uuid}`);
    }

    return NextResponse.json(cloned, { status: 200 });
  } catch (error) {
    console.error('[Customer 360 API] Fetch single profile failed:', error);
    return NextResponse.json({ message: (error as Error).message }, { status: 500 });
  }
}
