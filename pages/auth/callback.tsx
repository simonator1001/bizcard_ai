'use client'

import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { useToast } from '@/components/ui/use-toast'

export default function AuthCallbackPage() {
  const searchParams = useSearchParams()
  const { toast } = useToast()

  useEffect(() => {
    // Check for errors
    if (!searchParams) return

    const error = searchParams.get('error')
    const error_description = searchParams.get('error_description')

    if (error) {
      console.error('Auth error:', error, error_description)
      toast({
        title: 'Authentication Error',
        description: error_description || 'Failed to authenticate',
        variant: 'destructive',
      })
    }
  }, [searchParams, toast])

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-semibold mb-4">Authenticating...</h1>
        <p className="text-muted-foreground">Please wait while we complete the sign in process.</p>
      </div>
    </div>
  )
} 