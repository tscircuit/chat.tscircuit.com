import { NextRequest, NextResponse } from 'next/server';
import * as jose from 'jose';
import { getOrCreateGithubUser, getUser } from '@/lib/db/queries';
import type { User } from '@/lib/db/schema';

// Secret for signing JWT tokens - should be environment variable in production
const JWT_SECRET = process.env.AUTH_SECRET

export async function GET(request: NextRequest) {
  // 1. Try to get session token from various sources
  const sessionToken = getSessionToken(request);
  
  if (!sessionToken) {
    return NextResponse.redirect(new URL('/login?error=missing_token', request.url));
  }
  
  // 2. Decode and validate token
  let decoded: jose.JWTPayload;
  try {
    decoded = jose.decodeJwt(sessionToken);
  } catch (error) {
    console.error('Failed to decode token:', error);
    return NextResponse.redirect(new URL('/login?error=invalid_token', request.url));
  }
  
  // 3. Extract user info from token
  const github_username = decoded.github_username as string;
  const email = decoded.email as string;
  const account_id = decoded.account_id as string;
  
  // Validate required fields
  if (!github_username) {
    return NextResponse.redirect(new URL('/login?error=missing_github_username', request.url));
  }
  
  if (!email) {
    return NextResponse.redirect(new URL('/login?error=missing_email', request.url));
  }
  
  // 4. Try to find existing user
  let user: User;
  try {
    // First check if user already exists
    const existingUsers = await getUser({ email });
    
    if (existingUsers && existingUsers.length > 0) {
      user = existingUsers[0];
    } else {
      // Create new user if not found
      user = await getOrCreateGithubUser(github_username, email);
    }
  } catch (error) {
    console.error('Error finding or creating user:', error);
    return NextResponse.redirect(new URL('/login?error=user_creation_failed', request.url));
  }
  
  // 5. Create session token
  let ourSessionToken: string;
  try {
    const secret = new TextEncoder().encode(JWT_SECRET);
    const session_id = crypto.randomUUID();
    
    ourSessionToken = await new jose.SignJWT({
      id: user.id,
      session_id,
      account_id,
      github_username,
      email,
      exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7, // 7 days
    }).setProtectedHeader({ alg: 'HS256' }).sign(secret);
  } catch (error) {
    console.error('Failed to create session token:', error);
    return NextResponse.redirect(new URL('/login?error=token_creation_failed', request.url));
  }
  
  // 6. Create and return response with cookie
  const redirectUrl = new URL('/', request.url);
  const response = NextResponse.redirect(redirectUrl);
  
  response.cookies.set({
    name: 'session_token',
    value: ourSessionToken,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
  
  return response;
}

// Helper function to get session token from various sources
function getSessionToken(request: NextRequest): string | null {
  // First try query params
  let sessionToken = request.nextUrl.searchParams.get('session_token');
  if (sessionToken) return sessionToken;
  
  // Then try cookies
  const cookieSessionToken = request.cookies.get('session_token')?.value;
  if (cookieSessionToken) return cookieSessionToken;
  
  // Finally try referrer
  const referrer = request.headers.get('referer');
  if (referrer) {
    try {
      const referrerUrl = new URL(referrer);
      sessionToken = referrerUrl.searchParams.get('session_token');
      if (sessionToken) return sessionToken;
    } catch (e) {
      console.error('Failed to parse referrer URL:', e);
    }
  }
  
  return null;
}