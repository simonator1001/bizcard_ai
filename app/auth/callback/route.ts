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

    // If there's an error from OAuth provider
    if (error) {
      console.error('[Auth Callback] OAuth error:', error, error_description)
      return NextResponse.redirect(
        `${baseUrl}/signin?error=${encodeURIComponent(error_description || error)}`
      )
    }

    // No code present
    if (!code) {
      console.error('[Auth Callback] No code in callback')
      return NextResponse.redirect(`${baseUrl}/signin?error=no_code`)
    }

    // Exchange the code for a session
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore })
    
    console.debug('[Auth Callback] Exchanging code for session...')
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
    
    if (exchangeError) {
      console.error('[Auth Callback] Error exchanging code for session:', exchangeError)
      return NextResponse.redirect(
        `${baseUrl}/signin?error=${encodeURIComponent(exchangeError.message)}`
      )
    }

    // Verify the session was created
    console.debug('[Auth Callback] Verifying session...')
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError || !session) {
      console.error('[Auth Callback] Session verification failed:', sessionError)
      return NextResponse.redirect(
        `${baseUrl}/signin?error=session_verification_failed`
      )
    }

    // Log successful authentication
    console.debug('[Auth Callback] Authentication successful:', {
      userId: session.user.id,
      email: session.user.email,
      provider: provider || 'unknown',
      redirectingTo: `${baseUrl}${next}`
    })

    // Create response with redirect
    const response = NextResponse.redirect(`${baseUrl}${next}`)

    // Set auth cookie with proper domain
    const cookieOptions = {
      name: 'sb-auth-token',
      value: session.access_token,
      path: '/',
      domain: '.simon-gpt.com',
      maxAge: 60 * 60 * 24 * 7, // 1 week
      sameSite: 'lax' as const,
      secure: true,
      httpOnly: true
    }

    // Set cookies
    response.cookies.set(cookieOptions)

    // Also set refresh token
    if (session.refresh_token) {
      response.cookies.set({
        ...cookieOptions,
        name: 'sb-refresh-token',
        value: session.refresh_token
      })
    }

    // Set provider token if available
    if (session.provider_token) {
      response.cookies.set({
        ...cookieOptions,
        name: 'sb-provider-token',
        value: session.provider_token
      })
    }

    // Set provider refresh token if available
    if (session.provider_refresh_token) {
      response.cookies.set({
        ...cookieOptions,
        name: 'sb-provider-refresh-token',
        value: session.provider_refresh_token
      })
    }

    // Store the session in localStorage
    response.headers.set('Set-Cookie', `supabase-auth-token=${session.access_token}; Path=/; Domain=.simon-gpt.com; Max-Age=604800; SameSite=Lax; Secure; HttpOnly`)

    return response
  } catch (error) {
    console.error('[Auth Callback] Unexpected error:', error)
    return NextResponse.redirect(
      `${baseUrl}/signin?error=unexpected_error`
    )
  }
} 

