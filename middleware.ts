import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { subscriptionMiddleware } from './middleware/subscription'

export async function middleware(request: NextRequest) {
  try {
    // Create response and supabase client
    const res = NextResponse.next()
    const supabase = createMiddlewareClient(
      { req: request, res },
      {
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
        supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        cookieOptions: {
          name: 'sb-auth',
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          path: '/'
        }
      }
    )

    // Refresh session if expired
    await supabase.auth.getSession()

    // Apply subscription middleware for protected routes
    if (request.nextUrl.pathname.startsWith('/api/') || 
        request.nextUrl.pathname.startsWith('/dashboard') ||
        request.nextUrl.pathname.startsWith('/manage') ||
        request.nextUrl.pathname === '/pricing') {
      return subscriptionMiddleware(request)
    }

    return res
  } catch (error) {
    console.error('Middleware error:', error)
    return NextResponse.next()
  }
}

// Specify which routes should trigger this middleware
export const config = {
  matcher: [
    '/api/:path*',
    '/dashboard/:path*',
    '/manage/:path*',
    '/pricing',
  ],
} 