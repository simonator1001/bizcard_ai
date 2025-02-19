import { createClient } from '@/lib/supabase-client';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const code = url.searchParams.get('code');
    const next = url.searchParams.get('next') || '/';
    const error = url.searchParams.get('error');
    const error_description = url.searchParams.get('error_description');

    console.debug('[Auth Callback] Received callback:', {
      code: code ? 'present' : 'missing',
      next,
      error,
      error_description,
      url: url.toString(),
      headers: Object.fromEntries(request.headers),
      cookies: request.headers.get('cookie'),
    });

    if (error) {
      console.error('[Auth Callback] OAuth error:', {
        error,
        description: error_description,
      });
      return NextResponse.redirect(
        `${url.origin}/signin?error=${encodeURIComponent(error_description || error)}`
      );
    }

    if (!code) {
      console.error('[Auth Callback] No code received');
      return NextResponse.redirect(
        `${url.origin}/signin?error=No authorization code received`
      );
    }

    const supabase = createClient();
    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

    if (exchangeError) {
      console.error('[Auth Callback] Session exchange error:', exchangeError);
      return NextResponse.redirect(
        `${url.origin}/signin?error=${encodeURIComponent(exchangeError.message)}`
      );
    }

    console.debug('[Auth Callback] Code exchange successful:', {
      success: !!data.session,
      sessionExpiry: data.session?.expires_at ? new Date(data.session.expires_at * 1000).toISOString() : null,
      userId: data.session?.user?.id,
      userEmail: data.session?.user?.email,
    });

    return NextResponse.redirect(new URL(next, url.origin));
  } catch (error) {
    console.error('[Auth Callback] Unexpected error:', error);
    return NextResponse.redirect(
      new URL('/signin?error=Unexpected error during authentication', request.url)
    );
  }
} 

