import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * This route handler is essential for handling the OAuth callback from providers like Google.
 * It processes the code parameter after successful authentication and redirects to the homepage.
 */
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next') || '/';
  
  // If there's no code parameter, redirect to homepage
  if (!code) {
    console.log('[auth/callback] No code parameter found, redirecting to homepage');
    return NextResponse.redirect(new URL('/', request.url));
  }
  
  console.log('[auth/callback] Processing auth code');
  
  try {
    // Create a Supabase client for the route handler with cookies
    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: any) {
            cookieStore.set(name, value, options);
          },
          remove(name: string, options: any) {
            cookieStore.set(name, '', { ...options, maxAge: 0 });
          },
        },
      }
    );
    
    // Exchange the code for a session
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (error) {
      console.error('[auth/callback] Error exchanging code for session:', error);
      // Redirect to signin page with error message
      return NextResponse.redirect(
        new URL(`/signin?error=${encodeURIComponent(error.message)}`, request.url)
      );
    }
    
    console.log('[auth/callback] Successfully authenticated user, redirecting to homepage');
    
    // Redirect to the homepage or specified next URL
    return NextResponse.redirect(new URL(next, request.url));
  } catch (error) {
    console.error('[auth/callback] Unexpected error processing auth code:', error);
    return NextResponse.redirect(
      new URL('/signin?error=Unexpected+authentication+error', request.url)
    );
  }
} 