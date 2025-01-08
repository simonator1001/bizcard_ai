'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Facebook, Chrome as Google, MessageCircle } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { toast } from 'sonner'

const Icons = {
  google: Google,
  facebook: Facebook,
  wechat: MessageCircle,
}

export function AuthScreen({ mode }: { mode: 'signin' | 'signup' }) {
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
    } catch (error) {
      console.error('Auth error:', error instanceof Error ? error.message : 'Unknown error')
      toast.error(error instanceof Error ? error.message : (mode === 'signin' ? 'Failed to sign in' : 'Failed to create account'))
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
          <div className="relative h-full flex flex-col items-center justify-start p-8">
            <div className="w-full flex justify-between items-center mb-12">
              <div className="text-xl font-semibold">CardGenie</div>
              <Button variant="outline" className="rounded-full px-6">
                Gee Rcld
              </Button>
            </div>

            <div className="text-4xl font-bold text-center mb-8 leading-tight">
              Cenere prominecting
              <br />
              business card in soviness
            </div>

            <div className="relative w-full aspect-square">
              <div className="absolute inset-0 bg-gradient-to-b from-pink-100 to-pink-200 rounded-3xl" />
              
              <div className="relative w-full h-full flex flex-col items-center justify-center">
                <Button 
                  variant="default" 
                  className="bg-black text-white rounded-full px-8 py-2 mb-8"
                >
                  Business card
                </Button>

                <div className="relative w-4/5 aspect-[16/10] bg-gradient-to-br from-yellow-50 to-pink-100 rounded-3xl p-1">
                  <div className="absolute inset-2 bg-white rounded-2xl shadow-lg transform rotate-6">
                    <div className="p-4">
                      <div className="text-lg font-semibold">Emily Chen</div>
                      <div className="text-sm text-gray-600">Marketing Manager</div>
                      <div className="mt-2">
                        <div className="font-medium">Novatech</div>
                        <div className="text-xs text-gray-500">novatech.com</div>
                      </div>
                      <div className="absolute top-4 right-4 flex">
                        <div className="w-4 h-4 bg-yellow-500 rounded-full -mr-2" />
                        <div className="w-4 h-4 bg-red-500 rounded-full" />
                      </div>
                    </div>
                  </div>
                </div>

                <Button 
                  variant="default" 
                  className="bg-black text-white rounded-full px-8 py-2 mt-8"
                >
                  Generert card
                </Button>
              </div>
            </div>
          </div>
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
      `}</style>
    </div>
  )
} 