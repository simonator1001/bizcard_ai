'use client'

import { useEffect, useState } from 'react'
import { account } from '@/lib/appwrite'
import { useRouter } from 'next/navigation'

export function OAuthCallback() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [error, setError] = useState<string | null>(null)
  const [debugInfo, setDebugInfo] = useState<string>('')
  const router = useRouter()

  useEffect(() => {
    const processAuth = async () => {
      const url = new URL(window.location.href)
      const allParams: Record<string, string> = {}
      url.searchParams.forEach((value, key) => {
        allParams[key] = value
      })
      
      console.log('[OAuthCallback] Full URL:', window.location.href)
      console.log('[OAuthCallback] All search params:', allParams)
      console.log('[OAuthCallback] Hash:', window.location.hash)
      
      // Check for error parameters
      const errorParam = url.searchParams.get('error')
      const errorDescription = url.searchParams.get('error_description')
      
      if (errorParam) {
        console.error('[OAuthCallback] OAuth error from provider:', { error: errorParam, description: errorDescription })
        setError(`OAuth Error: ${errorDescription || errorParam}`)
        setStatus('error')
        return
      }

      // Check localStorage for existing session
      const localStorageKeys = Object.keys(localStorage).filter(k => k.includes('appwrite') || k.includes('session') || k.includes('cookie'))
      console.log('[OAuthCallback] localStorage appwrite keys:', localStorageKeys)
      
      // Check cookies
      const cookieStr = document.cookie
      const hasAppwriteCookie = cookieStr.includes('appwrite') || cookieStr.includes('a_session')
      console.log('[OAuthCallback] Has AppWrite cookie:', hasAppwriteCookie)
      console.log('[OAuthCallback] All cookies:', cookieStr.substring(0, 500))
      
      // Build debug info
      const debugLines = [
        `URL params: ${Object.keys(allParams).length ? JSON.stringify(allParams) : '(none)'}`,
        `Hash: ${window.location.hash || '(none)'}`,
        `AppWrite cookie: ${hasAppwriteCookie ? 'YES' : 'NO'}`,
        `localStorage keys: ${localStorageKeys.join(', ') || '(none)'}`,
        `Hostname: ${window.location.hostname}`,
        `User-Agent: ${navigator.userAgent.substring(0, 80)}`,
      ]
      setDebugInfo(debugLines.join('\n'))
      
      // Try to get session with retries — token-based OAuth may need time to propagate
      let lastError: any = null
      for (let attempt = 0; attempt < 5; attempt++) {
        try {
          const delay = attempt === 0 ? 500 : 1500 + (attempt * 1000)
          if (attempt > 0) {
            console.log(`[OAuthCallback] Retry attempt ${attempt + 1} (delay=${delay}ms)...`)
            await new Promise(resolve => setTimeout(resolve, delay))
          } else {
            console.log(`[OAuthCallback] Attempt ${attempt + 1}: waiting ${delay}ms then calling account.get()`)
            await new Promise(resolve => setTimeout(resolve, delay))
          }
          
          const currentUser = await account.get()
          
          if (currentUser) {
            console.log('[OAuthCallback] ✅ Successfully authenticated:', {
              userId: currentUser.$id,
              email: currentUser.email,
              name: (currentUser as any).name,
            })
            
            setStatus('success')
            setTimeout(() => router.push('/'), 800)
            return
          }
        } catch (err: any) {
          lastError = err
          console.error(`[OAuthCallback] Attempt ${attempt + 1} failed:`, {
            code: err?.code,
            type: err?.type,
            message: err?.message,
          })
        }
      }
      
      // All attempts failed
      console.error('[OAuthCallback] ❌ All attempts failed')
      const fullError = [
        lastError?.code && `Code: ${lastError.code}`,
        lastError?.type && `Type: ${lastError.type}`,
        lastError?.message && `Msg: ${lastError.message}`,
      ].filter(Boolean).join(' | ')
      
      setError(`${fullError}\n\n--- Debug ---\n${debugLines}`)
      setStatus('error')
    }
    
    processAuth()
  }, [router])
  
  if (status === 'loading') {
    return (
      <div className="flex min-h-[200px] items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-sm text-muted-foreground">Connecting to Google...</p>
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
