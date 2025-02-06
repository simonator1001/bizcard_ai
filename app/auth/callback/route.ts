import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  try {
    const code = requestUrl.searchParams.get('code')
    const next = requestUrl.searchParams.get('next') || '/'
    const error = requestUrl.searchParams.get('error')
    const error_description = requestUrl.searchParams.get('error_description')

    // If there's an error from OAuth provider
    if (error) {
      console.error('OAuth error:', error, error_description)
      return NextResponse.redirect(
        `${requestUrl.origin}/signin?error=${encodeURIComponent(error_description || error)}`
      )
    }

    // No code present
    if (!code) {
      console.error('No code in callback')
      return NextResponse.redirect(`${requestUrl.origin}/signin?error=no_code`)
    }

    // Exchange the code for a session
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
    
    if (exchangeError) {
      console.error('Error exchanging code for session:', exchangeError)
      return NextResponse.redirect(
        `${requestUrl.origin}/signin?error=${encodeURIComponent(exchangeError.message)}`
      )
    }

    // Verify the session was created
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError || !session) {
      console.error('Session verification failed:', sessionError)
      return NextResponse.redirect(
        `${requestUrl.origin}/signin?error=session_verification_failed`
      )
    }

    // Successful authentication, redirect to the next page or home
    return NextResponse.redirect(`${requestUrl.origin}${next}`)
  } catch (error) {
    console.error('Unexpected error in auth callback:', error)
    return NextResponse.redirect(
      `${requestUrl.origin}/signin?error=unexpected_error`
    )
  }
} 