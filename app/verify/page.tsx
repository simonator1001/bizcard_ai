'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

export default function VerifyPage() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('Verifying your email...')
  const router = useRouter()

  useEffect(() => {
    const verify = async () => {
      const url = new URL(window.location.href)
      const userId = url.searchParams.get('userId')
      const token = url.searchParams.get('token')

      if (!userId || !token) {
        setStatus('error')
        setMessage('Invalid verification link. Please sign up again.')
        return
      }

      try {
        const res = await fetch('/api/auth/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, token }),
        })

        const data = await res.json()

        if (res.ok) {
          setStatus('success')
          setMessage('Email verified successfully! You can now sign in.')
        } else {
          setStatus('error')
          setMessage(data.error || 'Verification failed. Please try again.')
        }
      } catch (err: any) {
        console.error('[Verify] Error:', err)
        setStatus('error')
        setMessage('Something went wrong. Please try again.')
      }
    }
    verify()
  }, [])

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50 p-4">
      <div className="flex flex-col items-center gap-4 max-w-md w-full text-center">
        {status === 'loading' && (
          <>
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <p className="text-lg font-medium">{message}</p>
          </>
        )}
        {status === 'success' && (
          <>
            <div className="h-14 w-14 rounded-full bg-green-100 flex items-center justify-center">
              <svg className="w-7 h-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-bold">Email Verified! 🎉</h2>
            <p className="text-gray-500">{message}</p>
            <Button className="mt-2 rounded-full" onClick={() => router.push('/signin')}>
              Go to Sign In
            </Button>
          </>
        )}
        {status === 'error' && (
          <>
            <div className="h-14 w-14 rounded-full bg-red-100 flex items-center justify-center">
              <svg className="w-7 h-7 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-xl font-bold">Verification Failed</h2>
            <p className="text-gray-500">{message}</p>
            <Button className="mt-2 rounded-full" variant="outline" onClick={() => router.push('/signin')}>
              Back to Sign In
            </Button>
          </>
        )}
      </div>
    </div>
  )
}
