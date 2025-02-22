import { createClient } from '@/lib/supabase-client';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const code = url.searchParams.get('code');
    const next = url.searchParams.get('next') || '/';
    const error = url.searchParams.get('error');
    const error_description = url.searchParams.get('error_description');
    const state = url.searchParams.get('state');

    // Debug: Log request environment
    console.debug('[Auth Callback] Environment:', {
      NODE_ENV: process.env.NODE_ENV,
      NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
      SITE_URL: process.env.SITE_URL,
      SUPABASE_AUTH_SITE_URL: process.env.SUPABASE_AUTH_SITE_URL
    });

    // Debug: Log all cookies and headers
    console.debug('[Auth Callback] Request details:', {
      cookies: request.headers.get('cookie')?.split(';')
        .map(c => c.trim())
        .filter(c => c.startsWith('sb-'))
        .map(c => ({ name: c.split('=')[0] })),
      headers: {
        host: request.headers.get('host'),
        origin: request.headers.get('origin'),
        referer: request.headers.get('referer'),
        'x-forwarded-host': request.headers.get('x-forwarded-host'),
        'x-forwarded-proto': request.headers.get('x-forwarded-proto'),
      },
      url: url.toString(),
      params: Object.fromEntries(url.searchParams)
    });

    // Get the correct host and origin
    const host = request.headers.get('host') || 'bizcard.simon-gpt.com';
    const isContainerId = /^[a-f0-9]{12}(:\d+)?$/.test(host); // Check if host is a container ID
    const targetHost = isContainerId ? 'bizcard.simon-gpt.com' : host;
    const protocol = targetHost.includes('localhost') ? 'http' : 'https';
    const origin = `${protocol}://${targetHost}`;

    // Debug: Log host resolution
    console.debug('[Auth Callback] Host resolution:', {
      originalHost: host,
      isContainerId,
      targetHost,
      protocol,
      origin,
      state
    });

    if (error) {
      console.error('[Auth Callback] OAuth error:', {
        error,
        description: error_description,
        state,
        host: targetHost,
        origin
      });
      return NextResponse.redirect(
        `${origin}/signin?error=${encodeURIComponent(error_description || error)}`
      );
    }

    if (!code) {
      console.error('[Auth Callback] No code received:', {
        params: Object.fromEntries(url.searchParams),
        state,
        host: targetHost,
        origin
      });
      return NextResponse.redirect(
        `${origin}/signin?error=No authorization code received`
      );
    }

    const supabase = createClient();

    // Debug: Log pre-exchange state
    console.debug('[Auth Callback] Pre-exchange state:', {
      code: code.substring(0, 10) + '...',
      state,
      host: targetHost,
      origin,
      cookies: request.headers.get('cookie')?.split(';')
        .filter(c => c.includes('sb-'))
        .map(c => {
          const [name] = c.trim().split('=');
          return name;
        })
    });

    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

    if (exchangeError) {
      console.error('[Auth Callback] Session exchange error:', {
        error: exchangeError,
        code: code.substring(0, 10) + '...',
        state,
        host: targetHost,
        origin,
        cookies: request.headers.get('cookie')?.split(';')
          .filter(c => c.includes('sb-'))
          .map(c => {
            const [name] = c.trim().split('=');
            return name;
          })
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
      state,
      host: targetHost,
      origin,
      cookies: request.headers.get('cookie')?.split(';')
        .filter(c => c.includes('sb-'))
        .map(c => {
          const [name] = c.trim().split('=');
          return name;
        })
    });

    return NextResponse.redirect(new URL(next, origin));
  } catch (error) {
    console.error('[Auth Callback] Unexpected error:', {
      error,
      stack: error instanceof Error ? error.stack : undefined,
      cookies: request.headers.get('cookie')?.split(';')
        .filter(c => c.includes('sb-'))
        .map(c => {
          const [name] = c.trim().split('=');
          return name;
        })
    });
    return NextResponse.redirect(
      new URL('/signin?error=Unexpected error during authentication', request.url)
    );
  }
} 

