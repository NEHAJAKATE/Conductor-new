import { NextResponse, NextRequest } from 'next/server';
import { RbacService } from '@/core/security/rbac.service';
import { AuditService } from '@/core/audit/audit.service';
import { BankReconciliationService } from '@/core/reconciliation/bank-reconciliation.service';

export async function GET(request: NextRequest) {
  try {
    // 1. Server-Side RBAC Enforcement (Owner only, Staff gets 403)
    const auth = RbacService.authorize(request, 'VIEW_BANK_RECONCILIATION');
    if (!auth.allowed) {
      await AuditService.log({
        actorId: auth.userId,
        actorRole: auth.role,
        action: 'RBAC_ACCESS_DENIED',
        entityType: 'API_ROUTE',
        entityId: '/api/v1/reconciliation',
        description: `Unauthorized access attempt by ${auth.role} to Bank Reconciliation API`,
        status: 'DENIED',
      });
      return NextResponse.json({ message: auth.error }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const accountFilter = searchParams.get('account') || undefined;

    const summary = await BankReconciliationService.reconcile({ accountFilter });

    await AuditService.log({
      actorId: auth.userId,
      actorRole: auth.role,
      action: 'BANK_RECONCILIATION_MATCH',
      entityType: 'BANK_LEDGER',
      entityId: accountFilter || 'ALL_ACCOUNTS',
      description: `User ${auth.userId} (${auth.role}) ran Bank Reconciliation report. Matched: ${summary.matchedCount}, Unmatched: ${summary.unmatchedCount}, Mismatch: ${summary.mismatchCount}.`,
      metadata: {
        matchedCount: summary.matchedCount,
        unmatchedCount: summary.unmatchedCount,
        mismatchCount: summary.mismatchCount,
      },
    });

    return NextResponse.json(summary, { status: 200 });
  } catch (error) {
    console.error('[Reconciliation API] Error:', error);
    return NextResponse.json({ message: (error as Error).message }, { status: 500 });
  }
}
