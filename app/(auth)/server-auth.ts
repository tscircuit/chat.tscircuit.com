import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import * as jose from 'jose';
import type { SessionData } from './auth-store';

export interface AuthUser {
  id: string;
  username: string;
}

export interface Session {
  user: AuthUser | null;
}

// Function to get the current session from cookies (for server components)
export async function getSession(): Promise<Session> {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('session_token')?.value;
  
  if (!sessionToken) {
    return { user: null };
  }
  
  try {
    const decoded = jose.decodeJwt<SessionData>(sessionToken);
    
    // Check if token is expired
    if (decoded.exp * 1000 < Date.now()) {
      return { user: null };
    }
    
    return { 
      user: {
        id: decoded.account_id,
        username: decoded.github_username
      } 
    };
  } catch (error) {
    console.error('Invalid session token:', error);
    return { user: null };
  }
}

// Middleware-like function to protect routes
export async function requireAuth() {
  const session = await getSession();
  
  if (!session.user) {
    redirect('/login');
  }
  
  return session;
}