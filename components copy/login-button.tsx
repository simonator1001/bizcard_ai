'use client'

import { Button } from './ui/button'
import { useAuth } from '@/lib/auth-context'

export function LoginButton() {
  const { signIn, signOut, user } = useAuth()

  return (
    <Button 
      onClick={user ? signOut : signIn}
      variant="outline"
    >
      {user ? 'Sign Out' : 'Sign In'}
    </Button>
  )
} 