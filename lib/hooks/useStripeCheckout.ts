'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/auth-context'

// ─── Stripe Checkout Hook ───────────────────────────────────
// Usage: const { checkout, loading } = useStripeCheckout()
//        <button onClick={() => checkout('pro_monthly')}>

export function useStripeCheckout() {
  const [loading, setLoading] = useState(false)
  const { user } = useAuth()

  const checkout = async (plan: string = 'pro_monthly') => {
    if (!user) {
      window.location.href = '/signin'
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.$id,
          email: user.email,
          plan,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session')
      }

      if (data.url) {
        window.location.href = data.url
      } else {
        throw new Error('No checkout URL returned')
      }
    } catch (error: any) {
      console.error('[Stripe Checkout] Error:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  return { checkout, loading }
}
