'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { useAuth } from '@/lib/auth-context'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { SplashCursor } from '@/components/ui/splash-cursor'
import { Chrome as GoogleIcon } from 'lucide-react'

export default function SignInPage() {
  const { signIn, signUp, signInWithProvider } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [showSignUp, setShowSignUp] = useState(false)
  const router = useRouter()
  
  useEffect(() => {
    console.log("SignInPage mounted with SplashCursor component");
    // Make sure body background is white
    document.body.style.backgroundColor = "white";
    document.body.classList.add('overflow-hidden'); // Prevent scrolling
    
    return () => {
      // Clean up when component unmounts
      document.body.style.backgroundColor = "";
      document.body.classList.remove('overflow-hidden');
    };
  }, []);
  
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const formData = new FormData(e.currentTarget)
      const email = formData.get('email') as string
      const password = formData.get('password') as string
      await signIn(email, password)
      router.push('/')
    } catch (error) {
      console.error('Sign in error:', error)
      if (error instanceof Error) {
        if (error.message.includes('Invalid login credentials')) {
          toast.error('Invalid email or password')
        } else {
          toast.error(error.message || 'Failed to sign in')
        }
      } else {
        toast.error('Failed to sign in')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    const formData = new FormData(e.currentTarget)
    const name = formData.get('name') as string
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const confirmPassword = formData.get('confirmPassword') as string
    if (password !== confirmPassword) {
      toast.error('Passwords do not match')
      setIsLoading(false)
      return
    }
    try {
      await signUp(email, password, name)
      toast.success('Account created successfully')
      setShowSignUp(false)
    } catch (error: any) {
      toast.error(error.message || 'Failed to sign up')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    try {
      setGoogleLoading(true)
      await signInWithProvider('google')
      // No need to redirect as the OAuth flow will handle that
    } catch (error) {
      console.error('Google sign in error:', error)
      if (error instanceof Error) {
        toast.error(error.message || 'Failed to sign in with Google')
      } else {
        toast.error('Failed to sign in with Google')
      }
      setGoogleLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-white relative">
      <SplashCursor 
        colorOne="rgba(120, 85, 255, 0.8)" 
        colorTwo="rgba(64, 224, 208, 0.8)" 
      />
      <Dialog open={!showSignUp}>
        <DialogContent className="z-50 bg-white border shadow-lg">
          <div className="flex flex-col items-center gap-2">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-full border border-border mb-2" aria-hidden="true">
              <svg className="stroke-zinc-800 dark:stroke-zinc-100" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 32 32" aria-hidden="true">
                <circle cx="16" cy="16" r="12" fill="none" strokeWidth="8" />
              </svg>
            </div>
            <DialogHeader>
              <DialogTitle className="sm:text-center">Welcome back</DialogTitle>
              <DialogDescription className="sm:text-center">
                Enter your credentials to login to your account.
              </DialogDescription>
            </DialogHeader>
          </div>
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium">Email</label>
                <Input id="email" name="email" placeholder="hi@yourcompany.com" type="email" required />
              </div>
              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium">Password</label>
                <Input id="password" name="password" placeholder="Enter your password" type="password" required />
              </div>
            </div>
            <div className="flex justify-between gap-2">
              <div className="flex items-center gap-2">
                <Checkbox id="remember" checked={rememberMe} onCheckedChange={v => setRememberMe(v === true)} />
                <label htmlFor="remember" className="font-normal text-muted-foreground">Remember me</label>
              </div>
              <Link className="text-sm underline hover:no-underline" href="/forgot-password">
                Forgot password?
              </Link>
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Signing in...' : 'Sign in'}
            </Button>
            <div className="relative flex items-center justify-center">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-gray-500">Or continue with</span>
              </div>
            </div>
            <Button 
              type="button" 
              variant="outline" 
              className="w-full flex items-center justify-center gap-2"
              onClick={handleGoogleSignIn}
              disabled={googleLoading}
            >
              <GoogleIcon className="h-4 w-4" />
              {googleLoading ? 'Connecting...' : 'Sign in with Google'}
            </Button>
          </form>
          <div className="text-center mt-4">
            <span className="text-gray-600">Don&apos;t have an account? </span>
            <button type="button" className="text-blue-500 hover:underline" onClick={() => setShowSignUp(true)}>
              Sign Up
            </button>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={showSignUp} onOpenChange={setShowSignUp}>
        <DialogContent className="z-50 bg-white border shadow-lg">
          <div className="flex flex-col items-center gap-2">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-full border border-border mb-2" aria-hidden="true">
              <svg className="stroke-zinc-800 dark:stroke-zinc-100" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 32 32" aria-hidden="true">
                <circle cx="16" cy="16" r="12" fill="none" strokeWidth="8" />
              </svg>
            </div>
            <DialogHeader>
              <DialogTitle className="sm:text-center">Create an Account</DialogTitle>
              <DialogDescription className="sm:text-center">
                Enter your details to create your account.
              </DialogDescription>
            </DialogHeader>
          </div>
          <form className="space-y-5" onSubmit={handleSignUp}>
            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium">Full Name</label>
                <Input id="name" name="name" placeholder="John Doe" required />
              </div>
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium">Email</label>
                <Input id="email" name="email" placeholder="m@example.com" type="email" required />
              </div>
              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium">Password</label>
                <Input id="password" name="password" placeholder="Enter your password" type="password" required />
              </div>
              <div className="space-y-2">
                <label htmlFor="confirmPassword" className="text-sm font-medium">Confirm Password</label>
                <Input id="confirmPassword" name="confirmPassword" placeholder="Confirm your password" type="password" required />
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Signing up...' : 'Sign Up'}
            </Button>
            <div className="relative flex items-center justify-center">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-gray-500">Or sign up with</span>
              </div>
            </div>
            <Button 
              type="button" 
              variant="outline" 
              className="w-full flex items-center justify-center gap-2"
              onClick={handleGoogleSignIn}
              disabled={googleLoading}
            >
              <GoogleIcon className="h-4 w-4" />
              {googleLoading ? 'Connecting...' : 'Sign up with Google'}
            </Button>
          </form>
          <div className="text-center mt-4">
            <span className="text-gray-600">Already have an account? </span>
            <button type="button" className="text-blue-500 hover:underline" onClick={() => setShowSignUp(false)}>
              Sign In
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
} 