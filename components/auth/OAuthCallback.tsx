'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase-client'
import { useRouter } from 'next/navigation'

export function OAuthCallback() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    // Check for error parameters in the URL
    const url = new URL(window.location.href)
    const errorParam = url.searchParams.get('error')
    const errorDescription = url.searchParams.get('error_description')
    const code = url.searchParams.get('code')
    
    if (errorParam) {
      console.error('OAuth error:', { error: errorParam, description: errorDescription })
      setError(errorDescription || errorParam)
      setStatus('error')
      return
    }
    
    const processAuth = async () => {
      try {
        console.log('[OAuthCallback] Processing auth callback with code:', !!code)
        
        if (code) {
          // Try to exchange the code for a session
          const { data: authData, error: authError } = await supabase.auth.exchangeCodeForSession(code)
          
          if (authError) {
            console.error('[OAuthCallback] Error exchanging code for session:', authError)
            setError(authError.message)
            setStatus('error')
            return
          }
          
          if (authData.session) {
            console.log('[OAuthCallback] Successfully exchanged code for session:', {
              userId: authData.session.user.id,
              email: authData.session.user.email,
              expiresAt: authData.session.expires_at
            })
            
            setStatus('success')
            
            // Redirect to home page
            setTimeout(() => {
              router.push('/')
            }, 500)
            return
          }
        }
        
        // If no code or session established, check if we already have a session
        const { data, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('[OAuthCallback] Error getting session:', error)
          setError(error.message)
          setStatus('error')
          return
        }
        
        if (data.session) {
          console.log('[OAuthCallback] Session exists, authentication successful')
          setStatus('success')
          
          // Redirect to home page
          setTimeout(() => {
            router.push('/')
          }, 500)
        } else {
          // No session yet, but no error either - normal state
          setStatus('loading')
          console.log('[OAuthCallback] No session yet, normal state')
          
          // Clear any URL parameters
          if (window.location.search) {
            window.history.replaceState({}, document.title, window.location.pathname)
          }
        }
      } catch (err) {
        console.error('[OAuthCallback] Error checking session:', err)
        setError(err instanceof Error ? err.message : 'Unknown error')
        setStatus('error')
      }
    }
    
    processAuth()
  }, [router])
  
  if (status === 'loading') {
    return (
      <div className="flex min-h-[200px] items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-sm text-muted-foreground">Processing authentication...</p>
        </div>
      </div>
    )
  }
  
  if (status === 'error') {
    return (
      <div className="flex min-h-[200px] items-center justify-center">
        <div className="flex flex-col items-center gap-2 text-center max-w-md">
          <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
            <span className="text-red-600 text-xl">!</span>
          </div>
          <h3 className="text-lg font-semibold">Authentication Error</h3>
          <p className="text-sm text-muted-foreground">{error || 'An unexpected error occurred'}</p>
          <button 
            className="mt-4 px-4 py-2 rounded-md bg-primary text-primary-foreground"
            onClick={() => router.push('/signin')}
          >
            Back to Sign In
          </button>
        </div>
      </div>
    )
  }
  
  if (status === 'success') {
    return (
      <div className="flex min-h-[200px] items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
            <span className="text-green-600">✓</span>
          </div>
          <p className="text-sm text-muted-foreground">Authentication successful! Redirecting...</p>
        </div>
      </div>
    )
  }
  
  return null
} 