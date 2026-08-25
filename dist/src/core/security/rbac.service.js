"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RbacService = void 0;
const session_service_1 = require("./session.service");
const ROLE_PERMISSIONS = {
    OWNER: [
        'VIEW_SALES',
        'VIEW_PURCHASES',
        'VIEW_STOCK',
        'VIEW_CUSTOMERS',
        'CREATE_ORDER_DRAFT',
        'VIEW_REPORTS_GENERAL',
        'VIEW_BANK_RECONCILIATION',
        'VIEW_FINANCIAL_LEDGERS',
        'APPROVE_PURCHASE_ORDER',
        'MANAGE_INTEGRATIONS',
        'MANAGE_SETTINGS',
        'VIEW_AUDIT_LOGS',
    ],
    ADMIN: [
        'VIEW_SALES',
        'VIEW_PURCHASES',
        'VIEW_STOCK',
        'VIEW_CUSTOMERS',
        'CREATE_ORDER_DRAFT',
        'VIEW_REPORTS_GENERAL',
        'VIEW_BANK_RECONCILIATION',
        'VIEW_FINANCIAL_LEDGERS',
        'APPROVE_PURCHASE_ORDER',
        'MANAGE_INTEGRATIONS',
        'MANAGE_SETTINGS',
        'VIEW_AUDIT_LOGS',
    ],
    STAFF: [
        'VIEW_SALES',
        'VIEW_STOCK',
        'VIEW_CUSTOMERS',
        'CREATE_ORDER_DRAFT',
        'VIEW_REPORTS_GENERAL',
        // Strictly Denied: VIEW_BANK_RECONCILIATION, VIEW_FINANCIAL_LEDGERS, APPROVE_PURCHASE_ORDER, VIEW_AUDIT_LOGS
    ],
};
class RbacService {
    /**
     * Resolves the user session strictly from cryptographically verified server-side session token
     * Client-supplied headers/body (like x-user-role) are COMPLETELY IGNORED.
     */
    static extractUser(request) {
        if (!request) {
            return null;
        }
        // 1. Check Authorization Bearer header
        const authHeader = request.headers.get('authorization') || '';
        if (authHeader.startsWith('Bearer ')) {
            const token = authHeader.substring(7);
            const session = session_service_1.SessionService.verifyToken(token);
            if (session)
                return session;
        }
        // 2. Check HTTP cookie
        const cookieHeader = request.headers.get('cookie') || '';
        const match = cookieHeader.match(/conductor_session=([^;]+)/);
        if (match && match[1]) {
            const session = session_service_1.SessionService.verifyToken(match[1]);
            if (session)
                return session;
        }
        return null;
    }
    /**
     * Enforces server-side authorization for a required permission
     */
    static authorize(request, permission) {
        const session = this.extractUser(request);
        if (!session) {
            return {
                userId: 'unauthenticated',
                role: 'STAFF',
                allowed: false,
                error: `Authentication Required (401 Unauthorized): Valid cryptographically signed session token required.`,
            };
        }
        const { userId, role } = session;
        const permissions = ROLE_PERMISSIONS[role] || [];
        const allowed = permissions.includes(permission);
        if (!allowed) {
            return {
                userId,
                role,
                allowed: false,
                error: `Access Denied (403 Forbidden): Verified role '${role}' lacks permission '${permission}'.`,
            };
        }
        return {
            userId,
            role,
            allowed: true,
        };
    }
}
exports.RbacService = RbacService;
