'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Apple, Facebook, Chrome as Google, MessageCircle } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/lib/auth-context'

const Icons = {
  google: Google,
  facebook: Facebook,
  apple: Apple,
  wechat: MessageCircle,
}

export function AuthScreen({ mode }: { mode: 'signin' | 'signup' }) {
  const router = useRouter()
  const { signUp, signIn, signInWithProvider } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const formData = new FormData(e.currentTarget)
      const email = formData.get('email') as string
      const password = formData.get('password') as string

      if (mode === 'signin') {
        console.log('Signing in with:', email)
        await signIn(email, password)
      } else {
        const name = formData.get('name') as string
        if (password !== formData.get('confirmPassword')) {
          toast.error('Passwords do not match')
          return
        }
        
        console.log('Signing up with:', { email, name })
        await signUp(email, password, name)
      }

    } catch (error: any) {
      console.error('Auth error:', error)
      toast.error(error.message || (mode === 'signin' ? 'Failed to sign in' : 'Failed to create account'))
    } finally {
      setIsLoading(false)
    }
  }

  const handleSocialLogin = async (provider: 'google' | 'facebook' | 'apple') => {
    try {
      setIsLoading(true)
      if (provider === 'google') {
        await signInWithProvider('google')
      } else {
        toast.info(`${provider} authentication coming soon`)
      }
    } catch (error: any) {
      console.error('Social login error:', error)
      toast.error(`Failed to sign in with ${provider}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100">
      <div className="absolute inset-0 backdrop-blur-xl" />
      <Card className="w-[350px] bg-white/80 backdrop-blur-md shadow-xl">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-semibold text-center">
            {mode === 'signin' ? 'Sign In' : 'Create an Account'}
          </CardTitle>
          <CardDescription className="text-center">
            {mode === 'signin' 
              ? 'Enter your email to sign in to your account'
              : 'Enter your details to create your account'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input 
                  id="name" 
                  name="name" 
                  placeholder="John Doe" 
                  required 
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                name="email" 
                type="email" 
                placeholder="m@example.com" 
                required 
                autoComplete="username"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input 
                id="password" 
                name="password" 
                type="password" 
                required 
                autoComplete="current-password"
              />
            </div>
            {mode === 'signup' && (
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input 
                  id="confirmPassword" 
                  name="confirmPassword" 
                  type="password" 
                  required 
                  autoComplete="new-password"
                />
              </div>
            )}
            <Button 
              className="w-full" 
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? (
                mode === 'signin' ? 'Signing in...' : 'Creating account...'
              ) : (
                mode === 'signin' ? 'Sign In' : 'Sign Up'
              )}
            </Button>
          </form>

          {mode === 'signin' && (
            <div className="mt-4 text-center text-sm">
              <Link href="/forgot-password" className="text-blue-500 hover:underline">
                Forgot password?
              </Link>
            </div>
          )}

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-gray-500">Or continue with</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Button 
              variant="outline" 
              onClick={() => handleSocialLogin('google')}
              disabled={isLoading}
              className="flex items-center justify-center"
            >
              <Google className="mr-2 h-4 w-4" />
              Google
            </Button>
            {Object.entries(Icons).map(([name, Icon]) => {
              if (name === 'google') return null; // Skip Google as it's handled separately
              return (
                <Button 
                  key={name}
                  variant="outline" 
                  onClick={() => toast.info(`${name} authentication coming soon`)}
                  disabled={isLoading}
                  className="flex items-center justify-center"
                >
                  <Icon className="mr-2 h-4 w-4" />
                  {name.charAt(0).toUpperCase() + name.slice(1)}
                </Button>
              );
            })}
          </div>

          <div className="mt-6 text-center text-sm">
            <span className="text-gray-600">
              {mode === 'signin' ? "Don't have an account?" : "Already have an account?"}
            </span>{' '}
            <Link href={mode === 'signin' ? "/signup" : "/signin"} className="text-blue-500 hover:underline">
              {mode === 'signin' ? "Sign Up" : "Sign In"}
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 