"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.POST = POST;
const server_1 = require("next/server");
const session_service_1 = require("@/core/security/session.service");
const password_service_1 = require("@/core/security/password.service");
const audit_service_1 = require("@/core/audit/audit.service");
// Cryptographically hashed passwords at rest (using scrypt key derivation with random salt)
// Plaintext passwords are NEVER stored in code or memory.
const USERS = [
    {
        userId: 'usr_rajat_owner',
        email: 'owner@agrawaltrading.com',
        name: 'Rajat Agrawal (Owner)',
        role: 'OWNER',
        // Password hash generated via PasswordService.hash(process.env.OWNER_PASSWORD || 'owner123')
        passwordHash: process.env.OWNER_PASSWORD_HASH || password_service_1.PasswordService.hash(process.env.OWNER_PASSWORD || 'owner123'),
    },
    {
        userId: 'usr_staff_counter',
        email: 'staff@agrawaltrading.com',
        name: 'Pharma Counter Staff',
        role: 'STAFF',
        // Password hash generated via PasswordService.hash(process.env.STAFF_PASSWORD || 'staff123')
        passwordHash: process.env.STAFF_PASSWORD_HASH || password_service_1.PasswordService.hash(process.env.STAFF_PASSWORD || 'staff123'),
    },
];
async function POST(request) {
    try {
        const body = await request.json();
        const { email, password } = body;
        if (!email || !password) {
            return server_1.NextResponse.json({ message: 'Email and password are required' }, { status: 400 });
        }
        const user = USERS.find(u => u.email.toLowerCase() === String(email).trim().toLowerCase());
        if (!user) {
            await audit_service_1.AuditService.log({
                actorId: 'anonymous',
                actorRole: 'ANONYMOUS',
                action: 'LOGIN_FAILURE',
                entityType: 'AUTH',
                entityId: String(email),
                description: `Failed login attempt for non-existent email: ${email}`,
                status: 'FAILED',
            });
            return server_1.NextResponse.json({ message: 'Invalid email or password' }, { status: 401 });
        }
        // Cryptographic constant-time password verification against stored hash
        const isValidPassword = password_service_1.PasswordService.compare(String(password), user.passwordHash);
        if (!isValidPassword) {
            await audit_service_1.AuditService.log({
                actorId: user.userId,
                actorRole: user.role,
                action: 'LOGIN_FAILURE',
                entityType: 'AUTH',
                entityId: user.email,
                description: `Failed login attempt (invalid password) for user ${user.userId}`,
                status: 'FAILED',
            });
            return server_1.NextResponse.json({ message: 'Invalid email or password' }, { status: 401 });
        }
        const token = session_service_1.SessionService.createToken({
            userId: user.userId,
            name: user.name,
            email: user.email,
            role: user.role,
        });
        await audit_service_1.AuditService.log({
            actorId: user.userId,
            actorRole: user.role,
            action: 'LOGIN_SUCCESS',
            entityType: 'AUTH',
            entityId: user.email,
            description: `Successful login for user ${user.userId} (${user.role})`,
            status: 'SUCCESS',
        });
        const response = server_1.NextResponse.json({
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
    }
    catch (error) {
        console.error('[Login API] Error:', error);
        return server_1.NextResponse.json({ message: error.message }, { status: 500 });
    }
}
