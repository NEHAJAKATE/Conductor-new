import crypto from 'crypto';

export interface UserSession {
  userId: string;
  name: string;
  email: string;
  role: 'OWNER' | 'STAFF';
  expiresAt: number;
}

export class SessionService {
  /**
   * Retrieves server session secret from environment variable.
   * Throws fatal error if not configured.
   */
  private static getSecret(): string {
    const secret = process.env.SESSION_SECRET;
    if (!secret || secret.trim() === '') {
      throw new Error('FATAL SECURITY ERROR: SESSION_SECRET environment variable is not set. Refusing to start with insecure default secret.');
    }
    return secret;
  }

  /**
   * Create cryptographically signed HMAC-SHA256 session token
   */
  static createToken(user: { userId: string; name: string; email: string; role: 'OWNER' | 'STAFF' }, maxAgeSec = 86400): string {
    const secret = this.getSecret();
    const payload: UserSession = {
      ...user,
      expiresAt: Date.now() + maxAgeSec * 1000,
    };

    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
    const data = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const sig = crypto.createHmac('sha256', secret).update(`${header}.${data}`).digest('base64url');

    return `${header}.${data}.${sig}`;
  }

  /**
   * Cryptographically verify token and extract trusted session
   */
  static verifyToken(tokenStr: string): UserSession | null {
    try {
      if (!tokenStr || typeof tokenStr !== 'string') return null;
      const parts = tokenStr.trim().replace(/^Bearer\s+/i, '').split('.');
      if (parts.length !== 3) return null;

      const secret = this.getSecret();
      const [header, data, signature] = parts;
      const expectedSig = crypto.createHmac('sha256', secret).update(`${header}.${data}`).digest('base64url');

      if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig))) {
        return null;
      }

      const payload: UserSession = JSON.parse(Buffer.from(data, 'base64url').toString('utf8'));
      if (payload.expiresAt < Date.now()) {
        return null; // Expired
      }

      return payload;
    } catch {
      return null;
    }
  }
}
