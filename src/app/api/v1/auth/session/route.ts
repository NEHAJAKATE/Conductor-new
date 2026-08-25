import { NextResponse, NextRequest } from 'next/server';
import { RbacService } from '@/core/security/rbac.service';

/**
 * GET: Returns active authenticated session if valid token is provided.
 * Rejects unauthenticated requests with 401 (NO automatic default tokens).
 */
export async function GET(request: NextRequest) {
  const session = RbacService.extractUser(request);
  if (session) {
    return NextResponse.json({ authenticated: true, user: session }, { status: 200 });
  }

  return NextResponse.json({ authenticated: false, message: 'Not authenticated' }, { status: 401 });
}

/**
 * POST: Blocked. Arbitrary token minting is strictly prohibited.
 */
export async function POST() {
  return NextResponse.json({
    error: 'Method Not Allowed (405)',
    message: 'Arbitrary token minting is disabled. Session tokens can only be minted via POST /api/v1/auth/login after credential verification.',
  }, { status: 405 });
}
