'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Facebook, Chrome as Google, MessageCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase-client'
import type { User, AuthError } from '@supabase/supabase-js'
import { toast } from 'sonner'
import Link from 'next/link'
import Image from 'next/image'

const Icons = {
  google: Google,
  facebook: Facebook,
  wechat: MessageCircle,
}

interface AuthContextType {
  user: User | null
  loading: boolean
  initialized: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, name: string) => Promise<void>
  signOut: () => Promise<void>
  signInWithProvider: (provider: 'google') => Promise<{ provider: string; url: string } | void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  initialized: false,
  signIn: async () => {},
  signUp: async () => {},
  signOut: async () => {},
  signInWithProvider: async () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [initialized, setInitialized] = useState(false)
  const [mounted, setMounted] = useState(false)
  const router = useRouter()

  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  useEffect(() => {
    if (!mounted) return

    let ignore = false
    console.debug('[AuthContext] Initializing auth state')
    
    async function initializeAuth() {
      try {
        // Get initial session
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('[AuthContext] Error getting initial session:', error)
          if (!ignore) {
            setLoading(false)
            setInitialized(true)
          }
          return
        }

        if (session) {
          console.debug('[AuthContext] Initial session:', {
            id: session.user.id,
            email: session.user.email,
            role: session.user.role,
            expiresAt: new Date(session.expires_at! * 1000).toISOString()
          })
          
          if (!ignore) {
            setUser(session.user)
          }
        } else {
          console.debug('[AuthContext] No initial session')
          if (!ignore) {
            setUser(null)
          }
        }

        if (!ignore) {
          setLoading(false)
          setInitialized(true)
        }
      } catch (err) {
        console.error('[AuthContext] Error initializing auth:', err)
        if (!ignore) {
          setLoading(false)
          setInitialized(true)
        }
      }
    }

    initializeAuth()

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.debug('[AuthContext] Auth state changed:', event, session ? {
        id: session.user.id,
        email: session.user.email,
        role: session.user.role,
        expiresAt: new Date(session.expires_at! * 1000).toISOString()
      } : 'No session')

      if (ignore) return

      if (session) {
        setUser(session.user)
        // Only redirect on sign in events
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          const returnUrl = window.localStorage.getItem('returnUrl') || '/'
          window.localStorage.removeItem('returnUrl')
          router.push(returnUrl)
        }
      } else {
        setUser(null)
        // Only redirect on sign out events
        if (event === 'SIGNED_OUT') {
          // Store the current URL before redirecting
          if (window.location.pathname !== '/signin') {
            window.localStorage.setItem('returnUrl', window.location.pathname)
          }
          router.push('/signin')
        }
      }
    })

    return () => {
      ignore = true
      subscription.unsubscribe()
    }
  }, [mounted, router])

  // Don't render children until we've initialized auth
  if (!initialized) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-sm text-gray-500">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        initialized,
        signIn: async (email, password) => {
          try {
            console.debug('[AuthContext] Signing in with email:', email)
            const { error } = await supabase.auth.signInWithPassword({
              email,
              password,
            })
            if (error) throw error
          } catch (error) {
            console.error('[AuthContext] Sign in error:', error)
            throw error
          }
        },
        signUp: async (email, password, name) => {
          try {
            console.debug('[AuthContext] Signing up with email:', email)
            const { error } = await supabase.auth.signUp({
              email,
              password,
              options: {
                data: { name },
                emailRedirectTo: `${window.location.origin}/auth/v1/callback`
              },
            })
            if (error) throw error
          } catch (error) {
            console.error('[AuthContext] Sign up error:', error)
            throw error
          }
        },
        signOut: async () => {
          try {
            console.debug('[AuthContext] Signing out')
            const { error } = await supabase.auth.signOut()
            if (error) throw error
          } catch (error) {
            console.error('[AuthContext] Sign out error:', error)
            throw error
          }
        },
        signInWithProvider: async (provider) => {
          try {
            const origin = typeof window !== 'undefined' ? window.location.origin.trim() : ''
            // Use the path that exactly matches configured callbacks in Supabase
            const redirectUrl = `${origin}/auth/callback`
            
            console.debug('[AuthContext] Signing in with provider:', {
              provider,
              redirectUrl,
              origin,
              hostname: typeof window !== 'undefined' ? window.location.hostname : 'unknown',
              protocol: typeof window !== 'undefined' ? window.location.protocol : 'unknown',
            })

            // Clear all potentially interfering cookies
            if (typeof document !== 'undefined') {
              document.cookie.split(';').forEach(cookie => {
                const [name] = cookie.trim().split('=');
                if (name && (name.includes('supabase') || name.includes('sb-'))) {
                  const cookieBase = name.trim();
                  document.cookie = `${cookieBase}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;
                }
              });
            }

            // Generate code verifier for PKCE flow
            const generateCodeVerifier = () => {
              const random = new Uint8Array(32);
              window.crypto.getRandomValues(random);
              
              // Convert Uint8Array to string without using spread
              let result = '';
              for (let i = 0; i < random.length; i++) {
                result += String.fromCharCode(random[i]);
              }
              
              return btoa(result)
                .replace(/\+/g, '-')
                .replace(/\//g, '_')
                .replace(/=+$/, '');
            };
            
            // Generate and store code verifier
            const codeVerifier = generateCodeVerifier();
            
            // Store in both localStorage and cookies to improve reliability
            if (typeof window !== 'undefined') {
              window.localStorage.setItem('sb-rzmqepriffysavamtxzg-auth-token-code-verifier', codeVerifier);
              window.localStorage.setItem('sb-code-verifier', codeVerifier);
              
              // Also set as a cookie
              document.cookie = `sb-rzmqepriffysavamtxzg-auth-token-code-verifier=${codeVerifier}; path=/; max-age=300; SameSite=Lax`;
              
              console.debug('[AuthContext] Generated and stored code verifier:', {
                codeVerifierLength: codeVerifier.length,
                codeVerifierPreview: codeVerifier.substring(0, 10) + '...'
              });
            }
            
            // Use PKCE flow explicitly
            const { data, error } = await supabase.auth.signInWithOAuth({
              provider,
              options: {
                redirectTo: redirectUrl,
                queryParams: {
                  access_type: 'offline',
                  prompt: 'consent',
                },
                skipBrowserRedirect: false
              }
            })
            
            if (error) {
              console.error('[AuthContext] Provider sign in error:', {
                error,
                provider,
                redirectUrl
              })
              throw error
            }
            
            return data
          } catch (error) {
            console.error('[AuthContext] Provider sign in error:', error)
            throw error
          }
        },
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}

export function AuthScreen({ mode }: { mode: 'signin' | 'signup' }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const { signIn, signUp, signInWithProvider } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (mode === 'signin') {
        await signIn(email, password)
        router.push('/')
      } else {
        await signUp(email, password, name)
        toast.success('Check your email to confirm your account')
      }
    } catch (error: any) {
      console.error('Auth error:', error)
      toast.error(error.message || error.error_description || 'Authentication failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl font-bold">
              {mode === 'signin' ? 'Sign In' : 'Create an Account'}
            </CardTitle>
            <Image
              src="/logo.png"
              alt="Logo"
              width={40}
              height={40}
              className="rounded-lg"
            />
          </div>
          <CardDescription>
            {mode === 'signin'
              ? 'Enter your email below to sign in to your account'
              : 'Enter your email below to create your account'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                placeholder="m@example.com"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              ) : mode === 'signin' ? (
                'Sign In'
              ) : (
                'Sign Up'
              )}
            </Button>
          </form>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or continue with
              </span>
            </div>
          </div>

          <div className="grid gap-2">
            <Button
              variant="outline"
              type="button"
              disabled={loading}
              onClick={() => signInWithProvider('google')}
            >
              {loading ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              ) : (
                <>
                  <Icons.google className="mr-2 h-4 w-4" />
                  Google
                </>
              )}
            </Button>
          </div>

          <div className="mt-4 text-center text-sm">
            {mode === 'signin' ? (
              <>
                Don't have an account?{' '}
                <Link href="/signup" className="text-primary hover:underline">
                  Sign up
                </Link>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <Link href="/signin" className="text-primary hover:underline">
                  Sign in
                </Link>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 