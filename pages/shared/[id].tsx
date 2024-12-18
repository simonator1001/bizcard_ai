import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase-client'
import { BusinessCardDetails } from '@/components/cards/BusinessCardDetails'

export default function SharedCardPage() {
  const router = useRouter()
  const { id } = router.query
  const [card, setCard] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (id) {
      fetchCard()
    }
  }, [id])

  const fetchCard = async () => {
    try {
      const { data, error } = await supabase
        .from('business_cards')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error
      setCard(data)
    } catch (error) {
      console.error('Error fetching card:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div>Loading...</div>
  if (!card) return <div>Card not found</div>

  return (
    <div className="container mx-auto p-4">
      <BusinessCardDetails 
        card={card} 
        onClose={() => router.push('/')}
      />
    </div>
  )
} 