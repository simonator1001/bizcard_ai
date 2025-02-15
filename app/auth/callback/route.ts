import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { Database } from '@/types/supabase'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const origin = requestUrl.origin
  const isLocalhost = origin.includes('localhost') || origin.includes('127.0.0.1')
  const baseUrl = isLocalhost ? origin : (process.env.NEXT_PUBLIC_APP_URL || 'https://bizcard.simon-gpt.com')
  
  console.debug('[Auth Callback] Full request details:', {
    url: requestUrl.toString(),
    origin,
    isLocalhost,
    baseUrl,
    searchParams: Object.fromEntries(requestUrl.searchParams),
    headers: Object.fromEntries(request.headers),
    env: {
      NODE_ENV: process.env.NODE_ENV,
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL
    }
  })
  
  try {
    const code = requestUrl.searchParams.get('code')
    const next = requestUrl.searchParams.get('next') || '/'
    const error = requestUrl.searchParams.get('error')
    const error_description = requestUrl.searchParams.get('error_description')
    const provider = requestUrl.searchParams.get('provider')

    console.debug('[Auth Callback] Parsed parameters:', {
      code: code ? 'present' : 'missing',
      next,
      error,
      error_description,
      provider,
      cookies: Object.fromEntries(
        (await cookies())
          .getAll()
          .map(cookie => [cookie.name, cookie.value.substring(0, 20) + '...'])
      ),
      headers: Object.fromEntries(request.headers)
    })

    // If there's an error from OAuth provider
    if (error) {
      console.error('[Auth Callback] OAuth error:', error, error_description)
      return NextResponse.redirect(
        `${baseUrl}/signin?error=${encodeURIComponent(error_description || error)}`
      )
    }

    // Require code for PKCE flow
    if (!code) {
      console.error('[Auth Callback] No code provided for PKCE flow')
      return NextResponse.redirect(
        `${baseUrl}/signin?error=no_code_provided`
      )
    }

    const cookieStore = cookies()
    const supabase = createRouteHandlerClient<Database>({ 
      cookies: () => cookieStore
    })

    console.debug('[Auth Callback] Exchanging code for session...', {
      code: code.substring(0, 20) + '...',
      provider,
      isLocalhost,
      cookies: Object.fromEntries(
        (await cookies())
          .getAll()
          .map(cookie => [cookie.name, cookie.value.substring(0, 20) + '...'])
      )
    })

    try {
      const { error } = await supabase.auth.exchangeCodeForSession(code)
      
      if (error) {
        console.error('[Auth Callback] Error exchanging code for session:', {
          error: error,
          code: error.status,
          message: error.message,
          provider,
          isLocalhost,
          cookies: Object.fromEntries(
            (await cookies())
              .getAll()
              .map(cookie => [cookie.name, cookie.value.substring(0, 20) + '...'])
          )
        })
        return NextResponse.redirect(
          `${baseUrl}/signin?error=${encodeURIComponent(error.message)}`
        )
      }

      // Verify the session was created
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      if (sessionError || !session) {
        console.error('[Auth Callback] Session verification failed:', sessionError)
        return NextResponse.redirect(
          `${baseUrl}/signin?error=session_verification_failed`
        )
      }

      console.debug('[Auth Callback] Session exchange successful:', {
        userId: session.user?.id,
        provider: provider || 'unknown',
        expiresAt: new Date(session.expires_at! * 1000).toISOString(),
        isLocalhost,
        cookies: Object.fromEntries(
          (await cookies())
            .getAll()
            .map(cookie => [cookie.name, cookie.value.substring(0, 20) + '...'])
        )
      })

      // Create response with redirect
      const response = NextResponse.redirect(`${baseUrl}${next}`)

      // Add debug headers
      response.headers.set('x-auth-flow', 'pkce')
      response.headers.set('x-auth-provider', provider || 'unknown')
      response.headers.set('x-session-user-id', session.user?.id || 'none')
      response.headers.set('x-is-localhost', String(isLocalhost))

      return response
    } catch (error) {
      console.error('[Auth Callback] Unexpected error during code exchange:', error)
      return NextResponse.redirect(
        `${baseUrl}/signin?error=code_exchange_failed`
      )
    }
  } catch (error) {
    console.error('[Auth Callback] Unexpected error:', error)
    return NextResponse.redirect(
      `${baseUrl}/signin?error=unexpected_error`
    )
  }
} 

