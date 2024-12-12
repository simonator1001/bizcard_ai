'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase-client'
import { CardItem } from './CardItem'
import { BusinessCard } from '@/types/business-card'
import { toast } from 'sonner'

export function CardDatabase() {
  const [cards, setCards] = useState<BusinessCard[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadCards()
  }, [])

  const loadCards = async () => {
    try {
      const { data, error } = await supabase
        .from('business_cards')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setCards(data || [])
    } catch (error) {
      console.error('Error loading cards:', error)
      toast.error('Failed to load business cards')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {cards.map(card => (
        <CardItem key={card.id} card={card} onUpdate={loadCards} />
      ))}
    </div>
  )
} 