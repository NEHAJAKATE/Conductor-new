import { SessionService, UserSession } from './session.service';

export type UserRole = 'OWNER' | 'STAFF' | 'ADMIN';

export type Permission = 
  | 'VIEW_SALES'
  | 'VIEW_PURCHASES'
  | 'VIEW_STOCK'
  | 'VIEW_CUSTOMERS'
  | 'CREATE_ORDER_DRAFT'
  | 'VIEW_REPORTS_GENERAL'
  | 'VIEW_BANK_RECONCILIATION'
  | 'VIEW_FINANCIAL_LEDGERS'
  | 'APPROVE_PURCHASE_ORDER'
  | 'MANAGE_INTEGRATIONS'
  | 'MANAGE_SETTINGS'
  | 'VIEW_AUDIT_LOGS';

const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
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

export interface AuthContext {
  userId: string;
  role: UserRole;
  allowed: boolean;
  error?: string;
}

export class RbacService {
  /**
   * Resolves the user session strictly from cryptographically verified server-side session token
   * Client-supplied headers/body (like x-user-role) are COMPLETELY IGNORED.
   */
  public static extractUser(request?: Request): UserSession | null {
    if (!request) {
      return null;
    }

    // 1. Check Authorization Bearer header
    const authHeader = request.headers.get('authorization') || '';
    if (authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const session = SessionService.verifyToken(token);
      if (session) return session;
    }

    // 2. Check HTTP cookie
    const cookieHeader = request.headers.get('cookie') || '';
    const match = cookieHeader.match(/conductor_session=([^;]+)/);
    if (match && match[1]) {
      const session = SessionService.verifyToken(match[1]);
      if (session) return session;
    }

    return null;
  }

  /**
   * Enforces server-side authorization for a required permission
   */
  public static authorize(request: Request | undefined, permission: Permission): AuthContext {
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
