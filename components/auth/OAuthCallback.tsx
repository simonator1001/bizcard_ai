'use client'

import { useEffect, useState } from 'react'
import { account } from '@/lib/appwrite'
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
    
    if (errorParam) {
      console.error('OAuth error:', { error: errorParam, description: errorDescription })
      setError(errorDescription || errorParam)
      setStatus('error')
      return
    }
    
    const processAuth = async () => {
      try {
        console.log('[OAuthCallback] Processing auth callback')
        
        // AppWrite's createOAuth2Session handles the code exchange automatically
        // during the redirect. We just need to verify the session was created.
        const currentUser = await account.get()
        
        if (currentUser) {
          console.log('[OAuthCallback] Successfully authenticated:', {
            userId: currentUser.$id,
            email: currentUser.email,
          })
          
          setStatus('success')
          
          // Redirect to home page
          setTimeout(() => {
            router.push('/')
          }, 500)
          return
        }
        
        // No session yet, but no error either - normal state
        setStatus('loading')
        console.log('[OAuthCallback] No session yet, normal state')
        
        // Clear any URL parameters
        if (window.location.search) {
          window.history.replaceState({}, document.title, window.location.pathname)
        }
      } catch (err: any) {
        console.error('[OAuthCallback] Error checking session:', err)
        
        // If 401, session wasn't established
        if (err?.code === 401 || err?.type === 'general_unauthorized_scope') {
          setError('Authentication failed. Please try signing in again.')
          setStatus('error')
        } else {
          setError(err instanceof Error ? err.message : 'Unknown error')
          setStatus('error')
        }
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
