'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/router'
import { supabase, debugAuth } from '@/lib/supabase-client'
import { toast } from 'sonner'

export default function AuthCallbackPage() {
  const router = useRouter()

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        if (!router.isReady) return

        // Debug initial state
        await debugAuth()
        
        // Log all URL parameters for debugging
        console.log('[Auth] URL parameters:', router.query)
        
        // Get the code from the URL
        const code = router.query.code as string
        const next = router.query.next as string
        const error = router.query.error as string
        const error_description = router.query.error_description as string
        
        // Check for OAuth errors
        if (error) {
          console.error('[Auth] OAuth error:', error, error_description)
          throw new Error(`OAuth error: ${error} - ${error_description}`)
        }

        if (!code) {
          console.error('[Auth] No code found in URL')
          throw new Error('No code found in URL')
        }

        console.log('[Auth] Exchanging code for session...')
        const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
        
        if (exchangeError) {
          console.error('[Auth] Error in code exchange:', exchangeError)
          throw exchangeError
        }

        if (!data.session) {
          console.error('[Auth] No session returned from code exchange')
          throw new Error('No session returned')
        }

        console.log('[Auth] Successfully exchanged code for session:', {
          user: data.session.user.email,
          expires: new Date(data.session.expires_at! * 1000).toISOString(),
          provider: data.session.user.app_metadata.provider
        })

        // Debug state after exchange
        await debugAuth()

        // Wait a moment for session to be stored
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        // Verify we have a session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError) {
          console.error('[Auth] Error verifying session:', sessionError)
          throw sessionError
        }

        if (!session) {
          console.error('[Auth] Failed to verify session - no session found')
          throw new Error('Failed to verify session')
        }

        // Final debug check
        await debugAuth()

        console.log('[Auth] Session verified, redirecting...')
        const returnUrl = next || window.localStorage.getItem('returnUrl') || '/'
        window.localStorage.removeItem('returnUrl')
        
        // Ensure we have the session cookie before redirecting
        const hasCookie = document.cookie.split(';')
          .some(c => c.trim().startsWith('sb-auth-token='))
        if (!hasCookie) {
          console.error('[Auth] Session cookie not found after verification')
          throw new Error('Session cookie not found')
        }

        // Ensure the session is valid
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        if (userError || !user) {
          console.error('[Auth] Failed to verify user:', userError)
          throw new Error('Failed to verify user')
        }

        router.push(returnUrl)
      } catch (error) {
        console.error('[Auth] Callback error:', error)
        
        // Final error state debug
        await debugAuth()
        
        toast.error('Authentication failed. Please try again.')
        router.push('/signin?error=auth-failed')
      }
    }

    handleAuthCallback()
  }, [router])

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
        <p className="text-lg text-gray-600">Completing sign in...</p>
      </div>
    </div>
  )
} 