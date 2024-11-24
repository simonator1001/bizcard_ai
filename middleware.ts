import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  // Temporarily return next() to bypass auth checks
  return NextResponse.next()

  // Original auth logic commented out for now
  /*
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  try {
    const { data: { session } } = await supabase.auth.getSession()

    // Allow access to auth pages when not logged in
    if (!session && (req.nextUrl.pathname === '/signin' || req.nextUrl.pathname === '/signup')) {
      return res
    }

    // Redirect to signin if no session
    if (!session) {
      const redirectUrl = req.nextUrl.clone()
      redirectUrl.pathname = '/signin'
      return NextResponse.redirect(redirectUrl)
    }

    // Redirect to home if trying to access auth pages while logged in
    if (session && (req.nextUrl.pathname === '/signin' || req.nextUrl.pathname === '/signup')) {
      const redirectUrl = req.nextUrl.clone()
      redirectUrl.pathname = '/'
      return NextResponse.redirect(redirectUrl)
    }

    return res
  } catch (error) {
    console.error('Middleware error:', error)
    return NextResponse.redirect(new URL('/signin', req.url))
  }
  */
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
} 