import { createClient } from '@/lib/supabase-client';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { ResponseCookie } from 'next/dist/compiled/@edge-runtime/cookies';

export const runtime = 'edge';

export async function GET(request: Request) {
  try {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get('code');
    const next = requestUrl.searchParams.get('next') || '/';
    const error = requestUrl.searchParams.get('error');
    const error_description = requestUrl.searchParams.get('error_description');
    const state = requestUrl.searchParams.get('state');
    const scope = requestUrl.searchParams.get('scope');

    // Create Supabase client with cookie handling
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          async get(name: string) {
            return cookieStore.get(name)?.value;
          },
          async set(name: string, value: string, options: any) {
            try {
              cookieStore.set({ name, value, ...options });
            } catch (error) {
              console.error(`Error setting cookie ${name}:`, error);
            }
          },
          async remove(name: string, options: any) {
            try {
              cookieStore.delete({ name, ...options });
            } catch (error) {
              console.error(`Error removing cookie ${name}:`, error);
            }
          }
        }
      }
    );

    // Debug: Log full request details with cookie info
    console.debug('[Auth Callback] Full request details:', {
      url: request.url,
      method: request.method,
      headers: {
        cookie: request.headers.get('cookie'),
        host: request.headers.get('host'),
        origin: request.headers.get('origin'),
        'user-agent': request.headers.get('user-agent'),
      },
      params: {
        code: code ? `${code.substring(0, 10)}...` : null,
        state: state ? `${state.substring(0, 20)}...` : null,
        scope,
        error,
        error_description
      },
      cookies: {
        allCookies: (await cookieStore.getAll())
          .filter((c: ResponseCookie) => c.name.startsWith('sb-'))
          .map((c: ResponseCookie) => ({
            name: c.name,
            value: `${c.value.substring(0, 10)}...`
          }))
      },
      env: {
        NODE_ENV: process.env.NODE_ENV,
        SITE_URL: process.env.SITE_URL,
        SUPABASE_AUTH_FLOW_TYPE: process.env.SUPABASE_AUTH_FLOW_TYPE
      }
    });

    // Get the correct host and origin
    const host = request.headers.get('host') || 'bizcard.simon-gpt.com';
    const protocol = 'https';
    const origin = `${protocol}://${host}`;

    if (error || !code) {
      console.error('[Auth Callback] Error or missing parameters:', {
        error,
        error_description,
        hasCode: !!code,
        hasState: !!state,
        host,
        origin
      });
      
      const errorMsg = error_description || error || (!code ? 'No authorization code received' : 'Missing PKCE verifier');
      return NextResponse.redirect(
        `${origin}/signin?error=${encodeURIComponent(errorMsg)}`
      );
    }

    // Debug: Log pre-exchange state
    console.debug('[Auth Callback] Pre-exchange state:', {
      code: `${code.substring(0, 10)}...`,
      state: state ? `${state.substring(0, 20)}...` : null,
      host,
      origin
    });

    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

    if (exchangeError) {
      console.error('[Auth Callback] Session exchange error:', {
        error: exchangeError,
        code: `${code.substring(0, 10)}...`,
        state: state ? `${state.substring(0, 20)}...` : null
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
      userEmail: data.session?.user?.email
    });

    return NextResponse.redirect(new URL(next, origin));
  } catch (error) {
    console.error('[Auth Callback] Unexpected error:', error);
    return NextResponse.redirect(
      new URL('/signin?error=Unexpected error during authentication', request.url)
    );
  }
} 

