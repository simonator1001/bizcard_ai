'use client'

import * as React from 'react'
import { useRouter } from 'next/router'
import { BusinessCardDetails } from '@/components/cards/BusinessCardDetails'
import { supabase } from '@/lib/supabase-client'
import { toast } from 'sonner'
import { BusinessCard } from '@/types/business-card'

export default function CardDetailsPage() {
  const router = useRouter()
  const { id } = router.query
  const [card, setCard] = React.useState<BusinessCard | null>(null)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    async function loadCard() {
      if (!id) return

      try {
        const { data, error } = await supabase
          .from('business_cards')
          .select('*')
          .eq('id', id)
          .single()

        if (error) throw error
        if (data) setCard(data as BusinessCard)
      } catch (error) {
        console.error('Error loading card:', error instanceof Error ? error.message : 'Unknown error')
        toast.error('Failed to load business card')
        router.push('/')
      } finally {
        setLoading(false)
      }
    }

    loadCard()
  }, [id, router])

  if (loading) {
    return <div>Loading...</div>
  }

  if (!card) {
    return <div>Card not found</div>
  }

  return <BusinessCardDetails card={card} />
} 