import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: any) {
            cookieStore.set({ name, value, ...options })
          },
          remove(name: string, options: any) {
            cookieStore.delete({ name, ...options })
          },
        },
      }
    )
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const next = searchParams.get('next') || '/'
    
    if (code) {
      const { error } = await supabase.auth.exchangeCodeForSession(code)
      if (error) {
        console.error('[Auth API] Code exchange error:', error)
        throw error
      }

      // Verify the user is authenticated
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        throw new Error('Failed to verify user after code exchange')
      }
    }

    // URL to redirect to after sign in process completes
    return NextResponse.redirect(new URL(next, request.url))
  } catch (error) {
    console.error('[Auth API] Callback error:', error)
    return NextResponse.redirect(new URL('/signin?error=callback_failed', request.url))
  }
}

export async function POST(request: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies })
  
  try {
    // Get the request body
    const { action } = await request.json()

    switch (action) {
      case 'SIGN_OUT':
        await supabase.auth.signOut()
        return NextResponse.json({ success: true })
      
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('[Auth API] POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 