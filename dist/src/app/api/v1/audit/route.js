"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = GET;
const server_1 = require("next/server");
const rbac_service_1 = require("@/core/security/rbac.service");
const audit_service_1 = require("@/core/audit/audit.service");
async function GET(request) {
    try {
        const auth = rbac_service_1.RbacService.authorize(request, 'VIEW_AUDIT_LOGS');
        if (!auth.allowed) {
            return server_1.NextResponse.json({ message: auth.error }, { status: 403 });
        }
        const searchParams = request.nextUrl.searchParams;
        const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit'), 10) : 50;
        const action = searchParams.get('action');
        const logs = await audit_service_1.AuditService.list({ limit, action });
        return server_1.NextResponse.json({ logs }, { status: 200 });
    }
    catch (error) {
        console.error('[Audit API] Error:', error);
        return server_1.NextResponse.json({ message: error.message }, { status: 500 });
    }
}
