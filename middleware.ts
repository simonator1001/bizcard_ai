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
  const res = NextResponse.next({
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
          res.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          res.cookies.delete({
            name,
            ...options,
          })
        },
      },
    }
  )

  try {
    // Refresh session if expired
    await supabase.auth.getSession()

    // Check if the route is public
    const requestPath = new URL(request.url).pathname
    const isPublicRoute = PUBLIC_ROUTES.some(route => requestPath.startsWith(route))

    if (!isPublicRoute) {
      // Get user session
      const {
        data: { session },
      } = await supabase.auth.getSession()

      // If no session and not a public route, redirect to signin
      if (!session) {
        const redirectUrl = new URL('/signin', request.url)
        redirectUrl.searchParams.set('redirectedFrom', requestPath)
        return NextResponse.redirect(redirectUrl)
      }

      // Apply subscription middleware
      return subscriptionMiddleware(request)
    }

    return res
  } catch (error) {
    console.error('Middleware error:', error)
    return res
  }
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