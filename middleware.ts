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
  '/pricing'
]

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
  runtime: 'experimental-edge'
}

export async function middleware(request: NextRequest) {
  console.debug('[Middleware] Processing request:', {
    url: request.url,
    method: request.method,
    headers: Object.fromEntries(request.headers)
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

    // Create a Supabase client
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value
          },
          set(name: string, value: string, options: CookieOptions) {
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
    
    if (error) {
      console.error('[Middleware] Session error:', error)
      // Clear the auth cookie if there's an error
      response.cookies.set({
        name: 'sb-supabase-auth-token',
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
      return subscriptionResponse
    }

    return response
  } catch (e) {
    console.error('[Middleware] Unexpected error:', e)
    return NextResponse.redirect(new URL('/signin', request.url))
  }
} 