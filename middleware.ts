import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { subscriptionMiddleware } from './middleware/subscription'

const PUBLIC_ROUTES = [
  '/signin',
  '/signup',
  '/auth/callback',
  '/reset-password',
  '/verify',
  '/api/auth'
]

export async function middleware(request: NextRequest) {
  try {
    // Create response
    const res = NextResponse.next()

    // Create Supabase client with proper cookie handling
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value
          },
          set(name: string, value: string, options: CookieOptions) {
            res.cookies.set({
              name,
              value,
              domain: request.nextUrl.hostname,
              path: '/',
              sameSite: 'lax',
              secure: process.env.NODE_ENV === 'production',
              ...options,
            })
          },
          remove(name: string, options: CookieOptions) {
            res.cookies.set({
              name,
              value: '',
              domain: request.nextUrl.hostname,
              path: '/',
              sameSite: 'lax',
              secure: process.env.NODE_ENV === 'production',
              expires: new Date(0),
              ...options,
            })
          },
        },
        auth: {
          flowType: 'pkce'
        }
      }
    )

    // Debug request info
    console.debug('[Middleware] Request:', {
      url: request.url,
      pathname: request.nextUrl.pathname,
      cookies: request.cookies.getAll()
        .filter(cookie => cookie.name.startsWith('sb-'))
        .map(cookie => ({ name: cookie.name, value: cookie.value.substring(0, 20) + '...' })),
      isPublicRoute: PUBLIC_ROUTES.some(route => request.nextUrl.pathname.startsWith(route))
    })

    // Check session
    const { data: { session }, error } = await supabase.auth.getSession()

    // Debug session info
    console.debug('[Middleware] Session:', {
      exists: !!session,
      error: error?.message,
      userId: session?.user?.id,
      expiresAt: session?.expires_at ? new Date(session.expires_at * 1000).toISOString() : null
    })

    // Handle public routes
    const isPublicRoute = PUBLIC_ROUTES.some(route => request.nextUrl.pathname.startsWith(route))
    if (isPublicRoute) {
      // If user is already logged in and trying to access auth pages, redirect to home
      if (session && ['/signin', '/signup'].some(route => request.nextUrl.pathname.startsWith(route))) {
        return NextResponse.redirect(new URL('/', request.url))
      }
      return res
    }

    // Require authentication for all other routes
    if (!session) {
      // Store the current URL before redirecting
      const returnUrl = request.nextUrl.pathname
      const redirectUrl = new URL('/signin', request.url)
      redirectUrl.searchParams.set('returnUrl', returnUrl)
      return NextResponse.redirect(redirectUrl)
    }

    // Apply subscription middleware for authenticated routes
    return subscriptionMiddleware(request)
  } catch (error) {
    console.error('[Middleware] Error:', error)
    return NextResponse.next()
  }
}

// Specify which routes should trigger this middleware
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
} 