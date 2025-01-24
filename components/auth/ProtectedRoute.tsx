import { useRouter } from 'next/router'
import { useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'

interface ProtectedRouteProps {
  children: React.ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const router = useRouter()
  const { user, loading, initialized } = useAuth()

  useEffect(() => {
    // Only redirect if we're not loading and auth is initialized
    if (!loading && initialized && !user) {
      console.debug('[ProtectedRoute] No user found, redirecting to signin')
      const returnUrl = router.asPath
      if (returnUrl !== '/signin') {
        router.replace(`/signin?returnUrl=${encodeURIComponent(returnUrl)}`)
      } else {
        router.replace('/signin')
      }
    }
  }, [user, loading, initialized, router])

  // Show loading spinner while auth is initializing or loading
  if (loading || !initialized) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  // If we have a user, render the protected content
  if (user) {
    return <>{children}</>
  }

  // Return null while redirecting
  return null
} 