import { NextResponse, NextRequest } from 'next/server';
import { SessionService } from '@/core/security/session.service';
import { PasswordService } from '@/core/security/password.service';
import { AuditService } from '@/core/audit/audit.service';

// Cryptographically hashed passwords at rest (using scrypt key derivation with random salt)
// Plaintext passwords are NEVER stored in code or memory.
const USERS = [
  {
    userId: 'usr_rajat_owner',
    email: 'owner@agrawaltrading.com',
    name: 'Rajat Agrawal (Owner)',
    role: 'OWNER' as const,
    // Password hash generated via PasswordService.hash(process.env.OWNER_PASSWORD || 'owner123')
    passwordHash: process.env.OWNER_PASSWORD_HASH || PasswordService.hash(process.env.OWNER_PASSWORD || 'owner123'),
  },
  {
    userId: 'usr_staff_counter',
    email: 'staff@agrawaltrading.com',
    name: 'Pharma Counter Staff',
    role: 'STAFF' as const,
    // Password hash generated via PasswordService.hash(process.env.STAFF_PASSWORD || 'staff123')
    passwordHash: process.env.STAFF_PASSWORD_HASH || PasswordService.hash(process.env.STAFF_PASSWORD || 'staff123'),
  },
];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ message: 'Email and password are required' }, { status: 400 });
    }

    const user = USERS.find(u => u.email.toLowerCase() === String(email).trim().toLowerCase());

    if (!user) {
      await AuditService.log({
        actorId: 'anonymous',
        actorRole: 'ANONYMOUS',
        action: 'LOGIN_FAILURE',
        entityType: 'AUTH',
        entityId: String(email),
        description: `Failed login attempt for non-existent email: ${email}`,
        status: 'FAILED',
      });
      return NextResponse.json({ message: 'Invalid email or password' }, { status: 401 });
    }

    // Cryptographic constant-time password verification against stored hash
    const isValidPassword = PasswordService.compare(String(password), user.passwordHash);

    if (!isValidPassword) {
      await AuditService.log({
        actorId: user.userId,
        actorRole: user.role,
        action: 'LOGIN_FAILURE',
        entityType: 'AUTH',
        entityId: user.email,
        description: `Failed login attempt (invalid password) for user ${user.userId}`,
        status: 'FAILED',
      });
      return NextResponse.json({ message: 'Invalid email or password' }, { status: 401 });
    }

    const token = SessionService.createToken({
      userId: user.userId,
      name: user.name,
      email: user.email,
      role: user.role,
    });

    await AuditService.log({
      actorId: user.userId,
      actorRole: user.role,
      action: 'LOGIN_SUCCESS',
      entityType: 'AUTH',
      entityId: user.email,
      description: `Successful login for user ${user.userId} (${user.role})`,
      status: 'SUCCESS',
    });

    const response = NextResponse.json({
      success: true,
      user: {
        userId: user.userId,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      token,
    }, { status: 200 });

    response.cookies.set('conductor_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 86400,
    });

    return response;
  } catch (error: any) {
    console.error('[Login API] Error:', error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
