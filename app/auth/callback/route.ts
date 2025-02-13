import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://bizcard.simon-gpt.com'
  
  try {
    const code = requestUrl.searchParams.get('code')
    const next = requestUrl.searchParams.get('next') || '/'
    const error = requestUrl.searchParams.get('error')
    const error_description = requestUrl.searchParams.get('error_description')

    // If there's an error from OAuth provider
    if (error) {
      console.error('OAuth error:', error, error_description)
      return NextResponse.redirect(
        `${baseUrl}/signin?error=${encodeURIComponent(error_description || error)}`
      )
    }

    // No code present
    if (!code) {
      console.error('No code in callback')
      return NextResponse.redirect(`${baseUrl}/signin?error=no_code`)
    }

    // Exchange the code for a session
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ 
      cookies: () => cookieStore 
    })
    
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
    
    if (exchangeError) {
      console.error('Error exchanging code for session:', exchangeError)
      return NextResponse.redirect(
        `${baseUrl}/signin?error=${encodeURIComponent(exchangeError.message)}`
      )
    }

    // Verify the session was created
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError || !session) {
      console.error('Session verification failed:', sessionError)
      return NextResponse.redirect(
        `${baseUrl}/signin?error=session_verification_failed`
      )
    }

    // Log successful authentication
    console.log('Authentication successful, redirecting to:', `${baseUrl}${next}`)

    // Create response with redirect
    const response = NextResponse.redirect(`${baseUrl}${next}`)

    // Ensure cookies are properly set
    const cookieOptions = {
      name: 'sb-auth-token',
      value: session.access_token,
      path: '/',
      sameSite: 'lax' as const,
      secure: true,
      maxAge: 60 * 60 * 24 * 7 // 1 week
    }

    // Set the cookie
    response.cookies.set(cookieOptions)

    return response
  } catch (error) {
    console.error('Unexpected error in auth callback:', error)
    return NextResponse.redirect(
      `${baseUrl}/signin?error=unexpected_error`
    )
  }
} 