"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = GET;
const server_1 = require("next/server");
const rbac_service_1 = require("@/core/security/rbac.service");
const audit_service_1 = require("@/core/audit/audit.service");
const bank_reconciliation_service_1 = require("@/core/reconciliation/bank-reconciliation.service");
async function GET(request) {
    try {
        // 1. Server-Side RBAC Enforcement (Owner only, Staff gets 403)
        const auth = rbac_service_1.RbacService.authorize(request, 'VIEW_BANK_RECONCILIATION');
        if (!auth.allowed) {
            await audit_service_1.AuditService.log({
                actorId: auth.userId,
                actorRole: auth.role,
                action: 'RBAC_ACCESS_DENIED',
                entityType: 'API_ROUTE',
                entityId: '/api/v1/reconciliation',
                description: `Unauthorized access attempt by ${auth.role} to Bank Reconciliation API`,
                status: 'DENIED',
            });
            return server_1.NextResponse.json({ message: auth.error }, { status: 403 });
        }
        const searchParams = request.nextUrl.searchParams;
        const accountFilter = searchParams.get('account') || undefined;
        const summary = await bank_reconciliation_service_1.BankReconciliationService.reconcile({ accountFilter });
        await audit_service_1.AuditService.log({
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
        return server_1.NextResponse.json(summary, { status: 200 });
    }
    catch (error) {
        console.error('[Reconciliation API] Error:', error);
        return server_1.NextResponse.json({ message: error.message }, { status: 500 });
    }
}
