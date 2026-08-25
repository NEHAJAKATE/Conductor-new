import { NextResponse, NextRequest } from 'next/server';
import { RbacService } from '@/core/security/rbac.service';
import { AuditService } from '@/core/audit/audit.service';

export async function GET(request: NextRequest) {
  try {
    const auth = RbacService.authorize(request, 'VIEW_AUDIT_LOGS');
    if (!auth.allowed) {
      return NextResponse.json({ message: auth.error }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!, 10) : 50;
    const action = searchParams.get('action') as any;

    const logs = await AuditService.list({ limit, action });
    return NextResponse.json({ logs }, { status: 200 });
  } catch (error) {
    console.error('[Audit API] Error:', error);
    return NextResponse.json({ message: (error as Error).message }, { status: 500 });
  }
}
