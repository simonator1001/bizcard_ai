'use client'

import * as React from 'react'
import { useRouter } from 'next/router'
import { useBusinessCards } from '@/lib/hooks/useBusinessCards'
import { BusinessCardDetails } from '@/components/cards/BusinessCardDetails'

export default function CardPage() {
  const router = useRouter()
  const { id } = router.query
  const { cards, updateCard, deleteCard } = useBusinessCards()

  const card = cards.find(c => c.id === id)

  if (!card) {
    return <div>Card not found</div>
  }

  const handleEdit = async (updates: any) => {
    await updateCard(card.id, updates)
  }

  const handleDelete = async () => {
    await deleteCard(card.id)
    router.push('/manage')
  }

  return (
    <BusinessCardDetails
      card={card}
      onEdit={handleEdit}
      onDelete={handleDelete}
      onClose={() => router.push('/manage')}
    />
  )
} 