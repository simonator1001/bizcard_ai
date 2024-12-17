import { useState, useEffect } from 'react'
import { OrgChartView } from '@/components/OrgChartView'
import { NavBar } from '@/components/nav-bar'
import { ThemeProvider } from '@/components/ui/theme-provider'
import { supabase } from '@/lib/supabase-client'
import { BusinessCard } from '@/types/business-card'
import { TrashIcon } from '@heroicons/react/solid'

export default function OrgChartPage() {
  const [cards, setCards] = useState<BusinessCard[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchCards() {
      try {
        const { data, error } = await supabase
          .from('business_cards')
          .select(`
            id,
            name,
            title,
            title_zh,
            company,
            company_zh,
            email,
            phone,
            image_url
          `)
          .order('company')

        if (error) throw error

        const processedCards = (data || []).map(card => ({
          id: card.id,
          name: card.name,
          position: card.title || card.title_zh || 'No Position',
          company: card.company || card.company_zh || '',
          email: card.email || '',
          phone: card.phone || '',
          imageUrl: card.image_url,
          title: card.title,
          title_zh: card.title_zh
        }))

        setCards(processedCards)
      } catch (err) {
        console.error('Error fetching cards:', err)
        setError('Failed to load business cards')
      } finally {
        setLoading(false)
      }
    }

    fetchCards()
  }, [])

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[600px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-red-500 text-center p-4">
        {error}
      </div>
    )
  }

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <div className="min-h-screen pb-16">
        <main className="container mx-auto p-4">
          <OrgChartView data={cards} />
        </main>
        <NavBar />
      </div>
    </ThemeProvider>
  )
} 

// Inside the business card detail component or modal
function BusinessCardDetail({ card, onClose }) {
  const handleDelete = async () => {
    // Show confirmation dialog
    const confirmed = window.confirm('Are you sure you want to delete this business card?');
    
    if (confirmed) {
      try {
        // Assuming you have an API endpoint to delete the card
        await fetch(`/api/business-cards/${card.id}`, {
          method: 'DELETE',
        });
        
        // Close the detail component after successful deletion
        onClose();
      } catch (error) {
        console.error('Error deleting business card:', error);
        // Optionally show error message to user
        alert('Failed to delete business card. Please try again.');
      }
    }
  };

  return (
    <div>
      {/* Existing business card detail UI... */}
      <div className="flex justify-end gap-2">
        <button
          onClick={handleDelete}
          className="text-red-600 hover:text-red-800"
        >
          <TrashIcon className="h-5 w-5" />
        </button>
        {/* Other buttons... */}
      </div>
    </div>
  );
}