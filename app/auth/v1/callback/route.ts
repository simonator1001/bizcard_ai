import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-client'
import { cookies } from 'next/headers'

// Mark this route as dynamic since it uses request.url
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    // Get URL parameters
    const requestUrl = new URL(request.url)
    const code = requestUrl.searchParams.get('code')
    const next = requestUrl.searchParams.get('next') || '/'
    
    console.log('[Auth Callback] Processing auth callback:', {
      url: request.url,
      code: !!code,
      next
    })

    if (code) {
      const cookieStore = cookies()
      
      // Log all cookies for debugging
      const allCookies = cookieStore.getAll()
      console.log('[Auth Callback] Cookies:', {
        all: allCookies.map(c => c.name),
        codeVerifierExists: allCookies.some(c => c.name.includes('code-verifier'))
      })
      
      // Create a server-side Supabase client
      const supabase = createClient()
      
      // Debug the headers to see what's being sent
      console.log('[Auth Callback] Request headers:', {
        cookie: request.headers.get('cookie'),
        referer: request.headers.get('referer'),
        userAgent: request.headers.get('user-agent')
      })
      
      // The PKCE code verifier should be in the cookie already
      const { data, error } = await supabase.auth.exchangeCodeForSession(code)
      
      if (error) {
        console.error('[Auth Callback] Error exchanging code for session:', error)
        return NextResponse.redirect(new URL(`/signin?error=${encodeURIComponent(error.message)}`, requestUrl.origin))
      }
      
      console.log('[Auth Callback] Successfully exchanged code for session:', {
        userId: data.session?.user?.id,
        email: data.session?.user?.email,
      })
      
      // Create a response that will redirect to the intended destination
      const response = NextResponse.redirect(new URL(next, requestUrl.origin))
      
      // Return the response with the session cookie
      return response
    } else {
      console.error('[Auth Callback] No code found in callback URL')
      return NextResponse.redirect(new URL('/signin?error=No+authorization+code+found', requestUrl.origin))
    }
  } catch (error) {
    console.error('[Auth Callback] Unexpected error in auth callback:', error)
    return NextResponse.redirect(new URL('/signin?error=Unexpected+error+during+authentication', request.url))
  }
} 