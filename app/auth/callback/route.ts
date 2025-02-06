import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  if (code) {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    
    // Exchange the code for a session
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (error) {
      console.error('Error exchanging code for session:', error)
      return NextResponse.redirect(
        `${requestUrl.origin}/signin?error=${encodeURIComponent(error.message)}`
      )
    }

    // Successful authentication, redirect to home page
    return NextResponse.redirect(requestUrl.origin)
  }

  // No code present, redirect to signin page
  return NextResponse.redirect(`${requestUrl.origin}/signin?error=no_code`)
} 