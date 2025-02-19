import { createClient } from '@/lib/supabase-client';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get('code');
    const next = requestUrl.searchParams.get('next') || '/';
    const error = requestUrl.searchParams.get('error');
    const error_description = requestUrl.searchParams.get('error_description');
    const state = requestUrl.searchParams.get('state');

    console.debug('[Auth Callback] Received callback:', {
      code: code ? 'present' : 'missing',
      state: state ? 'present' : 'missing',
      next,
      error,
      error_description,
      url: requestUrl.toString(),
      headers: Object.fromEntries(request.headers),
      cookies: request.headers.get('cookie'),
    });

    if (error) {
      console.error('[Auth Callback] OAuth error:', {
        error,
        description: error_description,
      });
      return NextResponse.redirect(
        `${requestUrl.origin}/signin?error=${encodeURIComponent(error_description || error)}`
      );
    }

    if (!code) {
      console.error('[Auth Callback] No code received');
      return NextResponse.redirect(
        `${requestUrl.origin}/signin?error=No authorization code received`
      );
    }

    if (!state) {
      console.error('[Auth Callback] No state received');
      return NextResponse.redirect(
        `${requestUrl.origin}/signin?error=Invalid OAuth state`
      );
    }

    const supabase = createClient();

    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

    console.debug('[Auth Callback] Code exchange result:', {
      success: !!data.session,
      error: exchangeError,
      sessionExpiry: data.session?.expires_at ? new Date(data.session.expires_at * 1000).toISOString() : null,
      userId: data.session?.user?.id,
      userEmail: data.session?.user?.email,
    });

    if (exchangeError) {
      console.error('[Auth Callback] Session exchange error:', {
        error: exchangeError,
        code: exchangeError.status,
        message: exchangeError.message,
        details: exchangeError.stack
      });
      return NextResponse.redirect(
        `${requestUrl.origin}/signin?error=${encodeURIComponent(exchangeError.message)}`
      );
    }

    const response = NextResponse.redirect(`${requestUrl.origin}${next}`);
    
    console.debug('[Auth Callback] Successfully completed OAuth flow:', {
      redirectTo: `${requestUrl.origin}${next}`,
      sessionId: data.session?.access_token?.substring(0, 8) + '...',
      expiresIn: data.session?.expires_in
    });

    return response;
  } catch (err) {
    const url = new URL(request.url);
    console.error('[Auth Callback] Unexpected error:', err);
    return NextResponse.redirect(
      `${url.origin}/signin?error=${encodeURIComponent('An unexpected error occurred')}`
    );
  }
} 

