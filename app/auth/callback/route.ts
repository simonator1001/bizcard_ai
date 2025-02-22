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
    const state = requestUrl.searchParams.get('state');
    const scope = requestUrl.searchParams.get('scope');

    // Get cookie store
    const cookieStore = await cookies();
    const pkceVerifier = cookieStore.get('sb-pkce-verifier')?.value;
    const oauthState = cookieStore.get('sb-oauth-state')?.value;
    const authCookie = cookieStore.get('sb-auth-token')?.value;

    // Debug: Log full request details with cookie info
    console.debug('[Auth Callback] Full request details:', {
      NODE_ENV: process.env.NODE_ENV,
      SITE_URL: process.env.SITE_URL,
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
      SUPABASE_AUTH_FLOW_TYPE: process.env.SUPABASE_AUTH_FLOW_TYPE,
      cookies: {
        pkceVerifier: pkceVerifier ? 'present' : 'missing',
        oauthState: oauthState ? 'present' : 'missing',
        authCookie: authCookie ? 'present' : 'missing',
        allCookies: request.headers.get('cookie')?.split(';')
          .map(c => c.trim())
          .filter(c => c.startsWith('sb-'))
          .map(c => ({ name: c.split('=')[0] }))
      },
      code: code ? `${code.substring(0, 10)}...` : 'none',
      state: state ? `${state.substring(0, 20)}...` : 'none',
      scope,
      error,
      error_description,
      headers: {
        host: request.headers.get('host'),
        origin: request.headers.get('origin'),
        referer: request.headers.get('referer'),
        'user-agent': request.headers.get('user-agent'),
        'x-forwarded-proto': request.headers.get('x-forwarded-proto'),
        'x-forwarded-host': request.headers.get('x-forwarded-host'),
      },
      url: request.url,
      searchParams: Object.fromEntries(requestUrl.searchParams)
    });

    // Get the correct host and origin
    const host = request.headers.get('host') || 'bizcard.simon-gpt.com';
    const isLocalhost = host.includes('localhost') || host.includes('127.0.0.1');
    const protocol = isLocalhost ? 'http' : 'https';
    const origin = `${protocol}://${host}`;

    if (error) {
      console.error('[Auth Callback] OAuth error:', {
        error,
        description: error_description,
        host,
        origin,
        state,
        cookies: {
          pkceVerifier: pkceVerifier ? 'present' : 'missing',
          oauthState: oauthState ? 'present' : 'missing'
        }
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

    // Debug: Log pre-exchange state with PKCE details
    console.debug('[Auth Callback] Pre-exchange state:', {
      code: `${code.substring(0, 10)}...`,
      host,
      origin,
      state: state ? `${state.substring(0, 20)}...` : 'none',
      cookies: {
        pkceVerifier: pkceVerifier ? 'present' : 'missing',
        oauthState: oauthState ? 'present' : 'missing',
        authCookie: authCookie ? 'present' : 'missing'
      },
      flowType: process.env.SUPABASE_AUTH_FLOW_TYPE
    });

    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

    if (exchangeError) {
      console.error('[Auth Callback] Session exchange error:', {
        error: exchangeError,
        code: `${code.substring(0, 10)}...`,
        host,
        origin,
        state: state ? `${state.substring(0, 20)}...` : 'none',
        cookies: {
          pkceVerifier: pkceVerifier ? 'present' : 'missing',
          oauthState: oauthState ? 'present' : 'missing',
          authCookie: authCookie ? 'present' : 'missing'
        }
      });

      // Check if the error is related to PKCE
      if (exchangeError.message.includes('code verifier')) {
        console.error('[Auth Callback] PKCE verification failed:', {
          error: exchangeError.message,
          hasPKCECookie: !!pkceVerifier,
          hasStateToken: !!oauthState,
          state
        });
      }

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
      host,
      origin,
      state: state ? `${state.substring(0, 20)}...` : 'none'
    });

    // Create response with redirect
    const response = NextResponse.redirect(new URL(next, origin));

    // Let the Supabase client handle cookie management
    return response;
  } catch (error) {
    console.error('[Auth Callback] Unexpected error:', error);
    return NextResponse.redirect(
      new URL('/signin?error=Unexpected error during authentication', request.url)
    );
  }
} 

