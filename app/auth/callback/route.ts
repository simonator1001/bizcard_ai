import { createClient } from '@/lib/supabase-client';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  try {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get('code');
    const next = requestUrl.searchParams.get('next') || '/';
    const error = requestUrl.searchParams.get('error');
    const error_description = requestUrl.searchParams.get('error_description');

    // Debug: Log request environment and cookies
    console.debug('[Auth Callback] Environment and cookies:', {
      NODE_ENV: process.env.NODE_ENV,
      SITE_URL: process.env.SITE_URL,
      cookies: request.headers.get('cookie')?.split(';')
        .map(c => c.trim())
        .filter(c => c.startsWith('sb-'))
        .map(c => ({ name: c.split('=')[0] })),
      code: code ? `${code.substring(0, 10)}...` : 'none',
      error,
      error_description
    });

    // Get the correct host and origin
    const host = request.headers.get('host') || 'bizcard.simon-gpt.com';
    const isContainerId = /^[a-f0-9]{12}(:\d+)?$/.test(host);
    const targetHost = isContainerId ? 'bizcard.simon-gpt.com' : host;
    const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https';
    const origin = `${protocol}://${targetHost}`;

    if (error) {
      console.error('[Auth Callback] OAuth error:', {
        error,
        description: error_description,
        host: targetHost,
        origin
      });
      return NextResponse.redirect(
        `${origin}/signin?error=${encodeURIComponent(error_description || error)}`
      );
    }

    if (!code) {
      console.error('[Auth Callback] No code received');
      return NextResponse.redirect(
        `${origin}/signin?error=No authorization code received`
      );
    }

    const supabase = createClient();

    // Debug: Log pre-exchange state
    console.debug('[Auth Callback] Pre-exchange state:', {
      code: `${code.substring(0, 10)}...`,
      host: targetHost,
      origin,
      cookies: request.headers.get('cookie')?.split(';')
        .map(c => c.trim())
        .filter(c => c.startsWith('sb-'))
        .map(c => ({ name: c.split('=')[0] }))
    });

    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

    if (exchangeError) {
      console.error('[Auth Callback] Session exchange error:', {
        error: exchangeError,
        code: `${code.substring(0, 10)}...`,
        host: targetHost,
        origin,
        cookies: request.headers.get('cookie')?.split(';')
          .map(c => c.trim())
          .filter(c => c.startsWith('sb-'))
          .map(c => ({ name: c.split('=')[0] }))
      });
      return NextResponse.redirect(
        `${origin}/signin?error=${encodeURIComponent(exchangeError.message)}`
      );
    }

    // Debug: Log successful exchange
    console.debug('[Auth Callback] Code exchange successful:', {
      success: !!data.session,
      sessionExpiry: data.session?.expires_at ? new Date(data.session.expires_at * 1000).toISOString() : null,
      userId: data.session?.user?.id,
      userEmail: data.session?.user?.email,
      host: targetHost,
      origin
    });

    return NextResponse.redirect(new URL(next, origin));
  } catch (error) {
    console.error('[Auth Callback] Unexpected error:', error);
    return NextResponse.redirect(
      new URL('/signin?error=Unexpected error during authentication', request.url)
    );
  }
} 

