import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
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
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  // Bypass SSL verification for development
  if (process.env.NODE_ENV === 'development') {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  }

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
    return response
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
}

// Specify which routes should trigger this middleware
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
} 