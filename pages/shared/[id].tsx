import { useRouter } from 'next/router'
import { useBusinessCards } from '@/lib/hooks/useBusinessCards'
import { BusinessCardDetails } from '@/components/cards/BusinessCardDetails'

export default function SharedCardPage() {
  const router = useRouter()
  const { id } = router.query
  const { cards } = useBusinessCards()

  const card = cards.find(c => c.id === id)

  if (!card) {
    return <div>Card not found</div>
  }

  return (
    <div className="container mx-auto p-4">
      <BusinessCardDetails 
        card={card}
        onEdit={() => {}}
        onDelete={() => {}}
        onClose={() => router.push('/')}
      />
    </div>
  )
} 