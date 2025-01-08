'use client'

import * as React from 'react'

interface AuthLayoutProps {
  children: React.ReactNode
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100">
      <div className="absolute inset-0 backdrop-blur-xl" />
      <main className="relative">{children}</main>
    </div>
  )
} 