import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * This route handler is essential for handling the OAuth callback from providers like Google.
 * It processes the code parameter after successful authentication and redirects to the homepage.
 */
export async function GET(request: NextRequest) {
  console.log('[auth/callback/route.ts] Handler called with URL:', request.url);
  
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next') || '/';
  
  // If there's no code parameter, redirect to homepage
  if (!code) {
    console.log('[auth/callback/route.ts] No code parameter found, redirecting to homepage');
    return NextResponse.redirect(new URL('/', request.url));
  }
  
  console.log('[auth/callback/route.ts] Processing auth code');
  
  try {
    // Create a Supabase client for the route handler with cookies
    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            const cookie = cookieStore.get(name)?.value;
            console.log(`[auth/callback/route.ts] Getting cookie ${name}:`, cookie ? `${cookie.substring(0, 10)}...` : 'null');
            return cookie;
          },
          set(name: string, value: string, options: any) {
            console.log(`[auth/callback/route.ts] Setting cookie ${name}:`, value ? `${value.substring(0, 10)}...` : 'empty');
            
            // Enhanced cookie options to ensure they persist correctly across domains and contexts
            cookieStore.set(name, value, {
              ...options,
              path: '/',
              sameSite: 'lax',
              secure: process.env.NODE_ENV === 'production',
              httpOnly: false, // Allow client-side JavaScript to access these cookies
              maxAge: 60 * 60 * 24 * 7, // 1 week
              priority: 'high',
              // Set a domain in production for cross-subdomain support
              ...(process.env.NODE_ENV === 'production' && process.env.COOKIE_DOMAIN
                ? { domain: process.env.COOKIE_DOMAIN }
                : {})
            });
          },
          remove(name: string, options: any) {
            console.log(`[auth/callback/route.ts] Removing cookie ${name}`);
            cookieStore.set(name, '', { 
              ...options, 
              maxAge: 0,
              path: '/' 
            });
          },
        },
      }
    );
    
    // Exchange the code for a session
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (error) {
      console.error('[auth/callback/route.ts] Error exchanging code for session:', error);
      // Redirect to signin page with error message
      return NextResponse.redirect(
        new URL(`/signin?error=${encodeURIComponent(error.message)}`, request.url)
      );
    }

    // Access the session data - we'll need it to enhance our response
    const { session } = data;
    console.log('[auth/callback/route.ts] Successfully authenticated user:', {
      userId: session?.user?.id,
      email: session?.user?.email,
      expiresAt: session?.expires_at ? new Date(session.expires_at * 1000).toISOString() : 'unknown'
    });
    
    // Create a response that will redirect to the home page or specified next URL
    const response = NextResponse.redirect(new URL(next, request.url));
    
    // Add additional headers to help client-side code detect and recover the session
    if (session) {
      // Add session metadata to response headers to help client-side recovery
      response.headers.set('X-Auth-User-Id', session.user.id);
      response.headers.set('X-Auth-User-Email', session.user.email || '');
      response.headers.set('X-Auth-State', 'authenticated');
      
      // Add cookies with raw auth info to help browser-side supabase client
      // These will be used by client-side JavaScript
      const projectId = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('.supabase.co') 
        ? process.env.NEXT_PUBLIC_SUPABASE_URL.split('.')[0]
        : 'rzmqepriffysavamtxzg';
      
      // Set token cookies with appropriate parameters for browser access
      response.cookies.set(`sb-${projectId}-auth-token-raw`, session.access_token, {
        path: '/',
        maxAge: 60 * 60 * 24 * 7, // 1 week
        httpOnly: false, // Allow client-side access
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
      });
      
      // Add a marker cookie to indicate successful auth
      response.cookies.set('auth-success', 'true', {
        path: '/',
        maxAge: 60 * 60 * 24 * 7, // 1 week
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
      });
      
      // Add a session marker with user ID for middleware to detect
      response.cookies.set('x-user-session', session.user.id, {
        path: '/',
        maxAge: 60 * 60 * 24 * 7, // 1 week
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
      });
    }
    
    console.log('[auth/callback/route.ts] Successfully authenticated user, redirecting to:', next);
    return response;
  } catch (error) {
    console.error('[auth/callback/route.ts] Unexpected error processing auth code:', error);
    return NextResponse.redirect(
      new URL('/signin?error=Unexpected+authentication+error', request.url)
    );
  }
} 