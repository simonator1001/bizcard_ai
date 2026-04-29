'use client'

import { useEffect, useState } from 'react'
import { account } from '@/lib/appwrite'
import { useRouter } from 'next/navigation'

export function OAuthCallback() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const processAuth = async () => {
      const url = new URL(window.location.href)
      
      // Check for error parameters
      const errorParam = url.searchParams.get('error')
      if (errorParam) {
        setError(`OAuth Error: ${url.searchParams.get('error_description') || errorParam}`)
        setStatus('error')
        return
      }

      // Check for server-side OAuth session params (new flow)
      const secret = url.searchParams.get('secret')
      const userId = url.searchParams.get('userId')
      
      if (secret && userId) {
        // Server-side OAuth completed — create session client-side using AppWrite SDK
        console.log('[OAuthCallback] Creating session from server-provided token...')
        try {
          await account.createSession(userId, secret)
          console.log('[OAuthCallback] ✅ Session created client-side')
          
          // Verify the session works
          const user = await account.get()
          console.log('[OAuthCallback] ✅ Authenticated as:', user.email)
          
          setStatus('success')
          // Clean URL params and redirect
          setTimeout(() => router.replace('/'), 800)
          return
        } catch (err: any) {
          console.error('[OAuthCallback] Session creation failed:', err)
          setError(`Session failed: ${err?.message || 'Unknown error'}`)
          setStatus('error')
          return
        }
      }

      // Legacy flow: try account.get() with retries (for AppWrite SDK OAuth)
      console.log('[OAuthCallback] Trying account.get() (legacy flow)...')
      let lastError: any = null
      for (let attempt = 0; attempt < 5; attempt++) {
        try {
          const delay = attempt === 0 ? 500 : 1500 + (attempt * 1000)
          await new Promise(resolve => setTimeout(resolve, delay))
          
          const currentUser = await account.get()
          if (currentUser) {
            console.log('[OAuthCallback] ✅ Authenticated via legacy flow:', currentUser.email)
            setStatus('success')
            setTimeout(() => router.push('/'), 800)
            return
          }
        } catch (err: any) {
          lastError = err
          console.error(`[OAuthCallback] Attempt ${attempt + 1} failed:`, err?.message)
        }
      }
      
      console.error('[OAuthCallback] ❌ All attempts failed')
      const fullError = [
        lastError?.code && `Code: ${lastError.code}`,
        lastError?.type && `Type: ${lastError.type}`,
        lastError?.message && `Msg: ${lastError.message}`,
      ].filter(Boolean).join(' | ')
      
      setError(fullError || 'Authentication failed')
      setStatus('error')
    }
    
    processAuth()
  }, [router])
  
  if (status === 'loading') {
    return (
      <div className="flex min-h-[200px] items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-sm text-muted-foreground">Signing you in...</p>
        </div>
      </div>
    )
  }
  
  if (status === 'error') {
    return (
      <div className="flex min-h-[200px] items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3 text-center max-w-md w-full">
          <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
            <span className="text-red-600 text-xl">!</span>
          </div>
          <h3 className="text-lg font-semibold">Authentication Failed</h3>
          <div className="text-xs text-left text-muted-foreground bg-slate-100 dark:bg-slate-800 rounded-md p-3 w-full whitespace-pre-wrap font-mono">
            {error || 'Unknown error'}
          </div>
          <button 
            className="mt-2 px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm"
            onClick={() => router.push('/signin')}
          >
            Try Again
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
          <p className="text-sm text-muted-foreground">Signed in! Redirecting...</p>
        </div>
      </div>
    )
  }
  
  return null
}
