import { NextResponse, NextRequest } from 'next/server';
import { RejectionLogService } from '@/core/ingestion/rejection-log.service';
import { RbacService } from '@/core/security/rbac.service';

export async function GET(request: NextRequest) {
  try {
    const auth = RbacService.authorize(request, 'VIEW_REPORTS_GENERAL');
    if (!auth.allowed) {
      return NextResponse.json({ message: auth.error }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const sourceFile = searchParams.get('sourceFile') || undefined;
    const batchId = searchParams.get('batchId') || undefined;
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!, 10) : 100;
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!, 10) : 0;

    const result = await RejectionLogService.listRejections({
      sourceFile,
      batchId,
      limit,
      offset,
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    console.error('[Rejected Ingestion API] Error:', error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const auth = RbacService.authorize(request, 'MANAGE_SETTINGS');
    if (!auth.allowed) {
      return NextResponse.json({ message: auth.error }, { status: 403 });
    }

    await RejectionLogService.clear();
    return NextResponse.json({ success: true, message: 'Rejection log cleared.' }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
