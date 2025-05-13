import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { subscriptionMiddleware } from './middleware/subscription'

const PUBLIC_ROUTES = [
  '/signin',
  '/signup',
  '/auth/callback',
  '/auth/v1/callback',
  '/reset-password',
  '/verify',
  '/api/auth',
  '/api/scan',
  '/api/ocr',
  '/api/extract-info',
  '/images',
  '/assets',
  '/pricing',
  '/manage' // Temporarily add /manage to public routes for testing
]

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
  runtime: 'experimental-edge'
}

export async function middleware(request: NextRequest) {
  console.debug('[Middleware] Processing request:', {
    url: request.url,
    method: request.method,
    pathname: new URL(request.url).pathname,
    cookies: Object.fromEntries(request.cookies.getAll().map(c => [c.name, c.value.substring(0, 10) + '...']))
  })

  // Skip middleware for public routes and static files
  const path = new URL(request.url).pathname
  if (PUBLIC_ROUTES.some(route => path.startsWith(route)) || 
      path.match(/\.(ico|png|jpg|jpeg|svg|css|js|woff|woff2)$/)) {
    console.debug('[Middleware] Skipping auth check for public route:', path)
    return NextResponse.next()
  }

  try {
    // Create a response object that we can return
    let response = NextResponse.next()

    // Create a Supabase client with the correct URL
    const supabase = createServerClient(
      // Use the hardcoded URL to ensure we're connecting to the correct instance
      'https://rzmqepriffysavamtxzg.supabase.co',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            const cookie = request.cookies.get(name)?.value;
            console.debug(`[Middleware] Getting cookie ${name}:`, cookie ? `${cookie.substring(0, 10)}...` : 'null');
            return cookie;
          },
          set(name: string, value: string, options: CookieOptions) {
            console.debug(`[Middleware] Setting cookie ${name}:`, value ? `${value.substring(0, 10)}...` : 'empty');
            // If the cookie is updated, update the response
            response.cookies.set({
              name,
              value,
              ...options,
              sameSite: 'lax',
              secure: process.env.NODE_ENV === 'production'
            })
          },
          remove(name: string, options: CookieOptions) {
            console.debug(`[Middleware] Removing cookie ${name}`);
            // If the cookie is removed, update the response
            response.cookies.set({
              name,
              value: '',
              ...options,
              maxAge: 0
            })
          }
        }
      }
    )

    // Refresh the session if it exists
    const { data: { session }, error } = await supabase.auth.getSession()
    
    console.debug('[Middleware] Session check result:', {
      hasSession: !!session,
      userId: session?.user?.id,
      userEmail: session?.user?.email,
      error: error ? { message: error.message, code: error.code } : null
    });
    
    if (error) {
      console.error('[Middleware] Session error:', error)
      // Clear the auth cookie if there's an error
      response.cookies.set({
        name: 'sb-rzmqepriffysavamtxzg-auth-token',
        value: '',
        maxAge: 0
      })
      return NextResponse.redirect(new URL('/signin', request.url))
    }

    if (!session) {
      console.debug('[Middleware] No session found, redirecting to signin')
      const searchParams = new URLSearchParams()
      searchParams.set('returnUrl', request.url)
      return NextResponse.redirect(new URL(`/signin?${searchParams.toString()}`, request.url))
    }

    // Call subscription middleware
    const subscriptionResponse = await subscriptionMiddleware(request)
    if (subscriptionResponse) {
      console.debug('[Middleware] Subscription middleware returned a response, using it');
      return subscriptionResponse
    }

    console.debug('[Middleware] Authentication successful, proceeding with request');
    return response
  } catch (e) {
    console.error('[Middleware] Unexpected error:', e)
    return NextResponse.redirect(new URL('/signin', request.url))
  }
} 