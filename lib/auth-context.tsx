'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Facebook, Chrome as Google, MessageCircle } from 'lucide-react'
import { account, ID } from '@/lib/appwrite'
import { OAuthProvider } from 'appwrite'
import { toast } from 'sonner'
import Link from 'next/link'
import Image from 'next/image'

const Icons = {
  google: Google,
  facebook: Facebook,
  wechat: MessageCircle,
}

export interface AppWriteUser {
  $id: string;
  $createdAt: string;
  $updatedAt: string;
  name: string;
  email: string;
  phone: string;
  emailVerification: boolean;
  phoneVerification: boolean;
  status: boolean;
  passwordUpdate: string;
  registration: string;
  prefs: Record<string, any>;
}

interface AuthContextType {
  user: AppWriteUser | null
  loading: boolean
  initialized: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, name: string) => Promise<any>
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
  const [user, setUser] = useState<AppWriteUser | null>(null)
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
        // Get current user from AppWrite
        const currentUser = await account.get()
        
        if (currentUser) {
          console.debug('[AuthContext] Initial session:', {
            id: currentUser.$id,
            email: currentUser.email,
          })
          
          if (!ignore) {
            setUser(currentUser as AppWriteUser)
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
      } catch (err: any) {
        // If no session, account.get() throws — that's normal
        if (err?.type === 'general_unauthorized_scope' || err?.code === 401) {
          console.debug('[AuthContext] No authenticated session')
        } else {
          console.error('[AuthContext] Error initializing auth:', err)
        }
        if (!ignore) {
          setUser(null)
          setLoading(false)
          setInitialized(true)
        }
      }
    }

    initializeAuth()

    // AppWrite doesn't have real-time auth state listener like Supabase.
    // We poll periodically to detect changes from other tabs/windows.
    const pollInterval = setInterval(async () => {
      try {
        const currentUser = await account.get()
        if (!ignore && currentUser) {
          // Only update if user actually changed (compare by $id)
          setUser(prev => {
            if (!prev || prev.$id !== (currentUser as AppWriteUser).$id) {
              return currentUser as AppWriteUser
            }
            return prev // Same user — no update needed, avoids re-render cascade
          })
        }
      } catch {
        if (!ignore) {
          setUser(prev => prev ? null : prev) // Only set null if not already null
        }
      }
    }, 30000) // 30s instead of 5s — less aggressive polling

    return () => {
      ignore = true
      clearInterval(pollInterval)
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
            await account.createEmailPasswordSession(email, password)
          } catch (error) {
            console.error('[AuthContext] Sign in error:', error)
            throw error
          }
        },
        signUp: async (email, password, name) => {
          try {
            console.debug('[AuthContext] Signing up with email:', email)
            const user = await account.create(ID.unique(), email, password, name)
            
            // Send email verification
            const verifyUrl = `${window.location.origin}/verify`
            await account.createVerification(verifyUrl)
            console.debug('[AuthContext] Verification email sent to:', email)
            
            return user
          } catch (error) {
            console.error('[AuthContext] Sign up error:', error)
            throw error
          }
        },
        signOut: async () => {
          try {
            console.debug('[AuthContext] Signing out')
            await account.deleteSession('current')
            // Clear our domain session cookie too
            document.cookie = 'aw_session=; path=/; max-age=0'
          } catch (error) {
            console.error('[AuthContext] Sign out error:', error)
            throw error
          }
        },
        signInWithProvider: async (provider) => {
          try {
            console.debug('[AuthContext] Signing in with provider:', provider)

            const successUrl = `${window.location.origin}/auth/callback`
            const failureUrl = `${window.location.origin}/signin`
            
            // Use AppWrite's standard OAuth session flow
            // Redirects: AppWrite → Google → AppWrite callback → our /auth/callback
            account.createOAuth2Session(
              OAuthProvider.Google,
              successUrl,
              failureUrl
            )
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
  const [providerLoading, setProviderLoading] = useState(false)
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

  const handleProviderSignIn = async (provider: 'google') => {
    try {
      setProviderLoading(true)
      await signInWithProvider(provider)
      // No need to redirect as the OAuth flow will handle it
    } catch (error: any) {
      console.error('Provider auth error:', error)
      toast.error(error.message || error.error_description || 'Authentication with provider failed')
      setProviderLoading(false)
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
              disabled={providerLoading}
              onClick={() => handleProviderSignIn('google')}
              className="flex items-center justify-center gap-2"
            >
              {providerLoading ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              ) : (
                <>
                  <Icons.google className="h-4 w-4" />
                  <span>Sign in with Google</span>
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
