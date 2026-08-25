"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = GET;
exports.POST = POST;
const server_1 = require("next/server");
const rbac_service_1 = require("@/core/security/rbac.service");
/**
 * GET: Returns active authenticated session if valid token is provided.
 * Rejects unauthenticated requests with 401 (NO automatic default tokens).
 */
async function GET(request) {
    const session = rbac_service_1.RbacService.extractUser(request);
    if (session) {
        return server_1.NextResponse.json({ authenticated: true, user: session }, { status: 200 });
    }
    return server_1.NextResponse.json({ authenticated: false, message: 'Not authenticated' }, { status: 401 });
}
/**
 * POST: Blocked. Arbitrary token minting is strictly prohibited.
 */
async function POST() {
    return server_1.NextResponse.json({
        error: 'Method Not Allowed (405)',
        message: 'Arbitrary token minting is disabled. Session tokens can only be minted via POST /api/v1/auth/login after credential verification.',
    }, { status: 405 });
}
