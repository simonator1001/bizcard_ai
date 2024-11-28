'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Facebook, Chrome as Google, MessageCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase-client'
import type { User, AuthError } from '@supabase/supabase-js'
import { toast } from 'sonner'

const Icons = {
  google: Google,
  facebook: Facebook,
  wechat: MessageCircle,
}

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, name: string) => Promise<void>
  signOut: () => Promise<void>
  signInWithProvider: (provider: 'google' | 'facebook' | 'apple') => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user) {
          setUser(session.user)
          setIsAuthenticated(true)
        }
      } catch (error) {
        console.error('Auth initialization error:', error)
      } finally {
        setIsLoading(false)
      }
    }

    initAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      setIsAuthenticated(!!session?.user)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) throw error

      if (data.user) {
        setUser(data.user)
        setIsAuthenticated(true)
        toast.success('Signed in successfully')
        window.location.href = '/'
      }
    } catch (error) {
      console.error('Sign in error:', error)
      toast.error((error as AuthError).message || 'Failed to sign in')
      throw error
    }
  }

  const signUp = async (email: string, password: string, name: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name }
        }
      })

      if (error) throw error

      if (data.user) {
        toast.success('Please check your email to verify your account')
        router.push('/signin')
      }
    } catch (error) {
      console.error('Sign up error:', error)
      toast.error((error as AuthError).message || 'Failed to create account')
      throw error
    }
  }

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      setUser(null)
      setIsAuthenticated(false)
      window.location.href = '/signin'
    } catch (error) {
      console.error('Sign out error:', error)
      toast.error('Failed to sign out')
      throw error
    }
  }

  const signInWithProvider = async (provider: 'google' | 'facebook' | 'apple') => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        }
      })

      if (error) throw error
      
      console.log('OAuth initiated:', data)
    } catch (error) {
      console.error('Social sign in error:', error)
      toast.error(`Failed to sign in with ${provider}`)
      throw error
    }
  }

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">Loading...</div>
    </div>
  }

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated,
      signIn, 
      signUp, 
      signOut, 
      signInWithProvider 
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export function AuthScreen({ mode }: { mode: 'signin' | 'signup' }) {
  const router = useRouter()
  const { signIn, signUp, signInWithProvider } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const formData = new FormData(e.currentTarget)
      const email = formData.get('email') as string
      const password = formData.get('password') as string

      if (mode === 'signin') {
        await signIn(email, password)
      } else {
        const name = formData.get('name') as string
        if (password !== formData.get('confirmPassword')) {
          toast.error('Passwords do not match')
          return
        }
        await signUp(email, password, name)
      }
    } catch (error: any) {
      console.error('Auth error:', error)
      toast.error(error.message || (mode === 'signin' ? 'Failed to sign in' : 'Failed to create account'))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100">
      <div className="absolute inset-0 backdrop-blur-xl" />
      <div className="container mx-auto px-4 py-8 flex flex-col lg:flex-row items-center justify-center gap-8">
        <Card className="w-full max-w-[400px] bg-white/80 backdrop-blur-md shadow-xl">
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
                  <Label htmlFor="name" className="text-sm font-medium">Full Name</Label>
                  <Input 
                    id="name" 
                    name="name" 
                    placeholder="John Doe" 
                    required 
                    className="w-full px-3 py-2 border rounded-md border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                <Input 
                  id="email" 
                  name="email" 
                  type="email" 
                  placeholder="m@example.com" 
                  required 
                  className="w-full px-3 py-2 border rounded-md border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                <Input 
                  id="password" 
                  name="password" 
                  type="password" 
                  required 
                  className="w-full px-3 py-2 border rounded-md border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              {mode === 'signup' && (
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-sm font-medium">Confirm Password</Label>
                  <Input 
                    id="confirmPassword" 
                    name="confirmPassword" 
                    type="password" 
                    required 
                    className="w-full px-3 py-2 border rounded-md border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}
              <Button 
                className="w-full bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600 transition duration-300" 
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
              {Object.entries(Icons).map(([name, Icon]) => (
                <Button 
                  key={name}
                  variant="outline" 
                  onClick={() => signInWithProvider(name as 'google')}
                  disabled={name !== 'google'}
                  className="flex items-center justify-center py-2 px-4 border border-gray-300 rounded-md hover:bg-gray-50 transition duration-300"
                >
                  <Icon className="mr-2 h-4 w-4 animate-flip-y" />
                  {name.charAt(0).toUpperCase() + name.slice(1)}
                </Button>
              ))}
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
        <div className="w-full max-w-[400px] h-[600px] relative hidden lg:block">
          <Image
            src="/placeholder.svg"
            alt="App screenshot"
            fill
            className="rounded-lg shadow-xl object-cover"
          />
        </div>
      </div>
      <style jsx global>{`
        @keyframes iconFlip {
          0%, 100% { transform: rotateY(0deg); }
          50% { transform: rotateY(180deg); }
        }
        .animate-flip-y {
          animation: iconFlip 3s ease-in-out infinite;
          transform-style: preserve-3d;
          perspective: 1000px;
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
        .apple-icon {
          animation: pulse 2s infinite;
        }
      `}</style>
    </div>
  )
} 