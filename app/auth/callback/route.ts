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

    // Debug: Log all cookies
    console.debug('[Auth Callback] Cookies:', {
      raw: request.headers.get('cookie'),
      parsed: request.headers.get('cookie')?.split(';').map(c => {
        const [name, value] = c.trim().split('=');
        return { name, valuePreview: value?.substring(0, 20) + '...' };
      })
    });

    // Get the correct origin from the host header
    const host = request.headers.get('host') || 'bizcard.simon-gpt.com';
    const protocol = host.includes('localhost') ? 'http' : 'https';
    const origin = `${protocol}://${host}`;

    // Debug: Log all request details
    console.debug('[Auth Callback] Request details:', {
      url: url.toString(),
      params: Object.fromEntries(url.searchParams),
      headers: Object.fromEntries(request.headers),
      state,
      hasCode: !!code,
      method: request.method,
      origin,
      host,
      protocol
    });

    if (error) {
      console.error('[Auth Callback] OAuth error:', {
        error,
        description: error_description,
        state,
        cookies: request.headers.get('cookie'),
      });
      return NextResponse.redirect(
        `${origin}/signin?error=${encodeURIComponent(error_description || error)}`
      );
    }

    if (!code) {
      console.error('[Auth Callback] No code received:', {
        params: Object.fromEntries(url.searchParams),
        state,
        cookies: request.headers.get('cookie'),
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

