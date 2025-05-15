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

export default function SignInPage() {
  const { signIn, signUp } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [showSignUp, setShowSignUp] = useState(false)
  const router = useRouter()
  
  useEffect(() => {
    router.replace('/')
  }, [router])

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

  return null
} 