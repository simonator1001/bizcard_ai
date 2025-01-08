'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { useAuth } from '@/lib/auth-context'
import { useState } from 'react'
import { toast } from 'sonner'

export default function SignInPage() {
  const { signIn, signInWithProvider } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const formData = new FormData(e.currentTarget)
      const email = formData.get('email') as string
      const password = formData.get('password') as string
      await signIn(email, password)
    } catch (error) {
      console.error('Sign in error:', error)
      if (error instanceof Error) {
        toast.error(error.message || 'Failed to sign in')
      } else {
        toast.error('Failed to sign in')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="flex gap-8 items-start">
        <Card className="w-full max-w-[400px] p-8 bg-white shadow-xl rounded-lg">
          <h1 className="text-2xl font-semibold text-center mb-2">Sign In</h1>
          <p className="text-gray-600 text-center mb-8">
            Enter your email to sign in to your account
          </p>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <Input 
                name="email" 
                type="email" 
                placeholder="m@example.com" 
                required 
                className="w-full h-12 px-4 bg-[#0A0A0F] text-white rounded-lg"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Password</label>
              <Input 
                name="password" 
                type="password" 
                required 
                className="w-full h-12 px-4 bg-[#0A0A0F] text-white rounded-lg"
              />
            </div>

            <Button 
              className="w-full h-12 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors" 
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          <Link href="/forgot-password" className="block text-center text-blue-500 hover:underline mt-4">
            Forgot password?
          </Link>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-4 text-gray-500">OR CONTINUE WITH</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <Button 
              variant="outline" 
              onClick={() => signInWithProvider('google')}
              className="w-full h-12 border border-gray-200 hover:bg-gray-50"
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path fill="currentColor" d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z"/>
              </svg>
              Google
            </Button>
            <Button 
              variant="outline" 
              className="w-full h-12 border border-gray-200 bg-gray-100 text-gray-500"
              disabled
            >
              Facebook
            </Button>
          </div>
          <Button 
            variant="outline" 
            className="w-full h-12 border border-gray-200 bg-gray-100 text-gray-500 mb-6"
            disabled
          >
            WeChat
          </Button>

          <div className="text-center">
            <span className="text-gray-600">Don&apos;t have an account? </span>
            <Link href="/signup" className="text-blue-500 hover:underline">
              Sign Up
            </Link>
          </div>
        </Card>

        <div className="hidden lg:flex flex-col items-center max-w-[400px]">
          <div className="relative w-[300px] h-[600px]">
            <Image
              src="/images/bizcard-preview.png"
              alt="BizCard App Preview"
              fill
              className="object-contain"
            />
          </div>
        </div>
      </div>
    </div>
  )
} 