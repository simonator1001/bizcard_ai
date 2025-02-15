import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { Database } from '@/types/supabase'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://bizcard.simon-gpt.com'
  
  console.debug('[Auth Callback] Full request details:', {
    url: requestUrl.toString(),
    searchParams: Object.fromEntries(requestUrl.searchParams),
    headers: Object.fromEntries(request.headers),
    baseUrl,
    env: {
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
    const access_token = requestUrl.searchParams.get('access_token')
    const refresh_token = requestUrl.searchParams.get('refresh_token')

    console.debug('[Auth Callback] Parsed parameters:', {
      code: code ? 'present' : 'missing',
      next,
      error,
      error_description,
      provider,
      hasAccessToken: !!access_token,
      hasRefreshToken: !!refresh_token,
      cookies: Object.fromEntries(
        Array.from(cookies().getAll())
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

    const cookieStore = cookies()
    const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore })

    // Handle implicit flow (access_token in URL)
    if (access_token) {
      console.debug('[Auth Callback] Using implicit flow with access token')
      const { data: { session }, error: setSessionError } = await supabase.auth.setSession({
        access_token,
        refresh_token: refresh_token || ''
      })

      if (setSessionError) {
        console.error('[Auth Callback] Error setting session:', setSessionError)
        return NextResponse.redirect(
          `${baseUrl}/signin?error=${encodeURIComponent(setSessionError.message)}`
        )
      }

      if (!session) {
        console.error('[Auth Callback] No session after setting tokens')
        return NextResponse.redirect(
          `${baseUrl}/signin?error=no_session_after_token_exchange`
        )
      }

      console.debug('[Auth Callback] Session set successfully:', {
        userId: session.user?.id,
        provider: provider || 'unknown',
        expiresAt: new Date(session.expires_at! * 1000).toISOString(),
        cookies: Object.fromEntries(
          Array.from(cookieStore.getAll())
            .map(cookie => [cookie.name, cookie.value.substring(0, 20) + '...'])
        )
      })

      return NextResponse.redirect(`${baseUrl}${next}`)
    }

    // Handle PKCE flow (code exchange)
    if (code) {
      console.debug('[Auth Callback] Exchanging code for session...', {
        code: code.substring(0, 20) + '...',
        provider,
        cookies: Object.fromEntries(
          Array.from(cookieStore.getAll())
            .map(cookie => [cookie.name, cookie.value.substring(0, 20) + '...'])
        )
      })

      try {
        const { data: { session }, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
        
        if (exchangeError) {
          console.error('[Auth Callback] Error exchanging code for session:', {
            error: exchangeError,
            code: exchangeError.status,
            message: exchangeError.message,
            provider,
            cookies: Object.fromEntries(
              Array.from(cookieStore.getAll())
                .map(cookie => [cookie.name, cookie.value.substring(0, 20) + '...'])
            )
          })
          return NextResponse.redirect(
            `${baseUrl}/signin?error=${encodeURIComponent(exchangeError.message)}`
          )
        }

        if (!session) {
          console.error('[Auth Callback] No session after code exchange', {
            provider,
            cookies: Object.fromEntries(
              Array.from(cookieStore.getAll())
                .map(cookie => [cookie.name, cookie.value.substring(0, 20) + '...'])
            )
          })
          return NextResponse.redirect(
            `${baseUrl}/signin?error=no_session_after_exchange`
          )
        }

        console.debug('[Auth Callback] Session exchange successful:', {
          userId: session.user?.id,
          provider: provider || 'unknown',
          expiresAt: new Date(session.expires_at! * 1000).toISOString(),
          cookies: Object.fromEntries(
            Array.from(cookieStore.getAll())
              .map(cookie => [cookie.name, cookie.value.substring(0, 20) + '...'])
          )
        })

        // Create response with redirect
        const response = NextResponse.redirect(`${baseUrl}${next}`)

        // Add debug headers
        response.headers.set('x-auth-flow', 'pkce')
        response.headers.set('x-auth-provider', provider || 'unknown')
        response.headers.set('x-session-user-id', session.user?.id || 'none')

        return response
      } catch (error) {
        console.error('[Auth Callback] Unexpected error during code exchange:', error)
        return NextResponse.redirect(
          `${baseUrl}/signin?error=code_exchange_failed`
        )
      }
    }

    // No code or access token
    console.error('[Auth Callback] No code or access token in callback')
    return NextResponse.redirect(
      `${baseUrl}/signin?error=no_auth_credentials`
    )

  } catch (error) {
    console.error('[Auth Callback] Unexpected error:', error)
    return NextResponse.redirect(
      `${baseUrl}/signin?error=unexpected_error`
    )
  }
} 

