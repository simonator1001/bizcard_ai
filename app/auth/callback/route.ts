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
        values: allCookies.map(c => ({ name: c.name, value: c.value.substring(0, 10) + '...' })),
        codeVerifierExists: allCookies.some(c => c.name.includes('code-verifier'))
      })
      
      // Look for any code verifier cookie
      const codeVerifierCookie = allCookies.find(c => c.name.includes('code-verifier'))
      console.log('[Auth Callback] Code verifier cookie:', codeVerifierCookie 
        ? { name: codeVerifierCookie.name, valuePreview: codeVerifierCookie.value.substring(0, 10) + '...', length: codeVerifierCookie.value.length }
        : 'Not found')

      // Create a server-side Supabase client
      const supabase = createClient()
      
      // Debug the headers to see what's being sent
      console.log('[Auth Callback] Request headers:', {
        cookie: request.headers.get('cookie'),
        referer: request.headers.get('referer'),
        userAgent: request.headers.get('user-agent')
      })
      
      try {
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
      } catch (error) {
        console.error('[Auth Callback] Error during code exchange:', error)
        console.log('[Auth Callback] Trying to recover verifier from query parameters')
        
        // Attempt to recover using code_verifier from query if available
        const codeVerifier = requestUrl.searchParams.get('code_verifier')
        
        if (codeVerifier) {
          console.log('[Auth Callback] Found code_verifier in query parameters, trying with it')
          
          try {
            // Try setting the cookie manually first 
            cookieStore.set('sb-rzmqepriffysavamtxzg-auth-token-code-verifier', codeVerifier, { 
              path: '/', 
              maxAge: 300, 
              sameSite: 'lax' 
            });

            // Then try with the code verifier
            const { data, error } = await supabase.auth.exchangeCodeForSession(code)
            
            if (error) {
              console.error('[Auth Callback] Error exchanging code for session with query verifier:', error)
              return NextResponse.redirect(new URL(`/signin?error=${encodeURIComponent(error.message)}`, requestUrl.origin))
            }
            
            console.log('[Auth Callback] Successfully exchanged code for session with query verifier:', {
              userId: data.session?.user?.id,
              email: data.session?.user?.email,
            })
            
            // Create a response that will redirect to the intended destination
            const response = NextResponse.redirect(new URL(next, requestUrl.origin))
            
            // Return the response with the session cookie
            return response
          } catch (error) {
            console.error('[Auth Callback] Error during code exchange with query verifier:', error)
            return NextResponse.redirect(new URL(`/signin?error=${encodeURIComponent('Failed to process authentication')}`, requestUrl.origin))
          }
        } else {
          console.error('[Auth Callback] No code_verifier found in query parameters')
          return NextResponse.redirect(new URL(`/signin?error=${encodeURIComponent('Code verifier not found')}`, requestUrl.origin))
        }
      }
    } else {
      console.error('[Auth Callback] No code found in callback URL')
      return NextResponse.redirect(new URL('/signin?error=No+authorization+code+found', requestUrl.origin))
    }
  } catch (error) {
    console.error('[Auth Callback] Unexpected error in auth callback:', error)
    return NextResponse.redirect(new URL('/signin?error=Unexpected+error+during+authentication', request.url))
  }
} 