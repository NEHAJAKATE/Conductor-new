"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = GET;
exports.DELETE = DELETE;
const server_1 = require("next/server");
const rejection_log_service_1 = require("@/core/ingestion/rejection-log.service");
const rbac_service_1 = require("@/core/security/rbac.service");
async function GET(request) {
    try {
        const auth = rbac_service_1.RbacService.authorize(request, 'VIEW_REPORTS_GENERAL');
        if (!auth.allowed) {
            return server_1.NextResponse.json({ message: auth.error }, { status: 403 });
        }
        const searchParams = request.nextUrl.searchParams;
        const sourceFile = searchParams.get('sourceFile') || undefined;
        const batchId = searchParams.get('batchId') || undefined;
        const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit'), 10) : 100;
        const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset'), 10) : 0;
        const result = await rejection_log_service_1.RejectionLogService.listRejections({
            sourceFile,
            batchId,
            limit,
            offset,
        });
        return server_1.NextResponse.json(result, { status: 200 });
    }
    catch (error) {
        console.error('[Rejected Ingestion API] Error:', error);
        return server_1.NextResponse.json({ message: error.message }, { status: 500 });
    }
}
async function DELETE(request) {
    try {
        const auth = rbac_service_1.RbacService.authorize(request, 'MANAGE_SETTINGS');
        if (!auth.allowed) {
            return server_1.NextResponse.json({ message: auth.error }, { status: 403 });
        }
        await rejection_log_service_1.RejectionLogService.clear();
        return server_1.NextResponse.json({ success: true, message: 'Rejection log cleared.' }, { status: 200 });
    }
    catch (error) {
        return server_1.NextResponse.json({ message: error.message }, { status: 500 });
    }
}
