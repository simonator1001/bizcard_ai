import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { subscriptionMiddleware } from './middleware/subscription'

export async function middleware(request: NextRequest) {
  // Create response and supabase client
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req: request, res })

  // Refresh session if expired
  await supabase.auth.getSession()

  // Apply subscription middleware for protected routes
  if (request.nextUrl.pathname.startsWith('/api/') || 
      request.nextUrl.pathname.startsWith('/dashboard') ||
      request.nextUrl.pathname.startsWith('/manage')) {
    return subscriptionMiddleware(request)
  }

  return res
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