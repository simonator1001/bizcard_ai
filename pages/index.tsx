import React, { useState, useRef, useEffect } from 'react'
import { 
  Scan, 
  Users, 
  Network, 
  Newspaper, 
  Star, 
  Settings,
  Search,
  Filter,
  SortAsc,
  Layers,
  Download,
  Merge,
  Share,
  Trash2,
  Edit,
  Edit2,
  X,
  Check,
  Camera,
  Upload,
  Loader2,
  ScanLine,
  LayoutList
} from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase-client'
import { recognizeBusinessCard, preprocessImageForOCR } from '@/lib/ocr-service'

// Import components
import { GridView } from '@/components/GridView'
import { CardDetailView } from '@/components/CardDetailView'
import { OrgChartView } from '@/components/OrgChartView'
import { NewsView } from '@/components/NewsView'
import { EnhancedProView } from '@/components/EnhancedProView'
import { SettingsTab } from '@/components/SettingsTab'
import { ScanPage } from '@/components/ScanPage'

// Import types and mock data
import { mockNewsData } from '@/lib/mock-data'

interface BusinessCard {
  id: string
  name: string
  company: string
  position: string
  email: string
  phone: string
  description: string
  imageUrl: string
  reportsTo?: string
}

// Add error boundary component
class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Something went wrong</h2>
            <Button onClick={() => window.location.reload()}>
              Try again
            </Button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default function Component() {
  const [searchTerm, setSearchTerm] = useState('')
  const [viewMode, setViewMode] = useState('grid')
  const [selectedCard, setSelectedCard] = useState<BusinessCard | null>(null)
  const [cards, setCards] = useState<BusinessCard[]>([])
  const [activeView, setActiveView] = useState('manage')
  const [showTooltip, setShowTooltip] = useState(true)

  // Add loading state for initial data fetch
  const [isLoading, setIsLoading] = useState(true)

  // Fetch cards on component mount
  useEffect(() => {
    fetchCards()
  }, []) // Add empty dependency array

  // Set up real-time subscription after initial fetch
  useEffect(() => {
    const channel = supabase
      .channel('business-cards')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'business_cards'
        },
        async (payload) => {
          const { data: { user } } = await supabase.auth.getUser()
          if (!user) return

          // Handle different real-time events
          switch (payload.eventType) {
            case 'INSERT':
              if (payload.new.user_id === user.id) {
                setCards(prevCards => [...prevCards, {
                  id: payload.new.id,
                  name: payload.new.name,
                  company: payload.new.company,
                  position: payload.new.position,
                  email: payload.new.email,
                  phone: payload.new.phone,
                  description: payload.new.description,
                  imageUrl: payload.new.image_url,
                  reportsTo: payload.new.reports_to
                }])
              }
              break

            case 'UPDATE':
              if (payload.new.user_id === user.id) {
                setCards(prevCards => prevCards.map(card => 
                  card.id === payload.new.id ? {
                    ...card,
                    name: payload.new.name,
                    company: payload.new.company,
                    position: payload.new.position,
                    email: payload.new.email,
                    phone: payload.new.phone,
                    description: payload.new.description,
                    imageUrl: payload.new.image_url,
                    reportsTo: payload.new.reports_to
                  } : card
                ))
              }
              break

            case 'DELETE':
              setCards(prevCards => prevCards.filter(card => card.id !== payload.old.id))
              break
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  // Update fetchCards to handle loading state
  const fetchCards = async () => {
    try {
      setIsLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: cards, error } = await supabase
        .from('business_cards')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      if (cards) {
        setCards(cards.map(card => ({
          id: card.id,
          name: card.name,
          company: card.company,
          position: card.position,
          email: card.email,
          phone: card.phone,
          description: card.description,
          imageUrl: card.image_url,
          reportsTo: card.reports_to
        })))
      }
    } catch (error) {
      console.error('Error fetching cards:', error)
      toast.error('Failed to load business cards')
    } finally {
      setIsLoading(false)
    }
  }

  // Show loading state in the UI
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-lg text-gray-600">Loading your business cards...</p>
        </div>
      </div>
    )
  }

  const handleCardClick = (card: BusinessCard) => {
    setSelectedCard(card)
  }

  // Update handlers with optimistic updates
  const handleCardEdit = async (updatedCard: BusinessCard) => {
    // Optimistically update the UI
    const previousCards = [...cards]
    setCards(cards.map(card => 
      card.id === updatedCard.id ? updatedCard : card
    ))

    try {
      const { error } = await supabase
        .from('business_cards')
        .update({
          name: updatedCard.name,
          company: updatedCard.company,
          position: updatedCard.position,
          email: updatedCard.email,
          phone: updatedCard.phone,
          description: updatedCard.description,
          reports_to: updatedCard.reportsTo
        })
        .eq('id', updatedCard.id)

      if (error) throw error
      toast.success('Card updated successfully')
    } catch (error) {
      // Revert on error
      setCards(previousCards)
      console.error('Error updating card:', error)
      toast.error('Failed to update card')
    }
  }

  const handleCardDelete = async (id: string) => {
    // Optimistically update the UI
    const previousCards = [...cards]
    setCards(cards.filter(card => card.id !== id))

    try {
      const { error } = await supabase
        .from('business_cards')
        .delete()
        .eq('id', id)

      if (error) throw error
      toast.success('Card deleted successfully')
    } catch (error) {
      // Revert on error
      setCards(previousCards)
      console.error('Error deleting card:', error)
      toast.error('Failed to delete card')
    }
  }

  const handleAddCard = async (newCard: BusinessCard) => {
    // Optimistically update the UI
    const optimisticCard = { ...newCard, id: Date.now().toString() }
    setCards(prevCards => [...prevCards, optimisticCard])

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data: savedCard, error } = await supabase
        .from('business_cards')
        .insert({
          user_id: user.id,
          name: newCard.name,
          company: newCard.company,
          position: newCard.position,
          email: newCard.email,
          phone: newCard.phone,
          description: newCard.description,
          image_url: newCard.imageUrl,
          created_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error

      // Update with actual saved card
      setCards(prevCards => prevCards.map(card => 
        card.id === optimisticCard.id ? savedCard : card
      ))
      setActiveView('manage')
      toast.success('Card added successfully')
    } catch (error) {
      // Remove optimistic card on error
      setCards(prevCards => prevCards.filter(card => card.id !== optimisticCard.id))
      console.error('Error adding card:', error)
      toast.error('Failed to add card')
    }
  }

  const handleUpgradeToPro = () => {
    setActiveView('pro')
  }

  // Update the navigation icons
  const navItems = [
    { icon: <ScanLine className="h-6 w-6" />, label: "Scan", value: "scan" },
    { icon: <LayoutList className="h-6 w-6" />, label: "Manage", value: "manage" },
    { icon: <Network className="h-6 w-6" />, label: "Org Chart", value: "orgchart" },
    { icon: <Newspaper className="h-6 w-6" />, label: "News", value: "news" },
    { icon: <Star className="h-6 w-6" />, label: "Pro", value: "pro" },
    { icon: <Settings className="h-6 w-6" />, label: "Settings", value: "settings" },
  ]

  // Wrap the return with ErrorBoundary
  return (
    <ErrorBoundary>
      <div className="flex flex-col min-h-screen bg-gray-50">
        <header className="bg-white border-b px-8 py-4">
          <h1 className="text-2xl font-bold text-primary">Digital Archive.ai</h1>
        </header>

        <main className="flex-1 overflow-auto p-8 pb-20 scroll-smooth">
          <div className="container mx-auto max-w-[calc(100vw-4rem)]">
            {activeView === 'manage' && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-3xl font-bold">Manage Business Cards</CardTitle>
                  <CardDescription className="text-lg">View, edit, and organize your scanned business cards</CardDescription>
                  <div className="flex items-center justify-between mt-4 space-x-4">
                    <div className="relative flex-grow">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <Input
                        placeholder="Search cards..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 py-2 text-sm rounded-md w-full"
                      />
                    </div>
                    <Select value={viewMode} onValueChange={setViewMode}>
                      <SelectTrigger className="w-[120px]">
                        <SelectValue>
                          {viewMode === 'grid' ? 'Grid View' : 'List View'}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="grid">Grid View</SelectItem>
                        <SelectItem value="list">List View</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardHeader>
                <CardContent>
                  <GridView 
                    data={cards.filter(card =>
                      card.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      card.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      card.position.toLowerCase().includes(searchTerm.toLowerCase())
                    )} 
                    onCardClick={handleCardClick}
                  />
                </CardContent>
              </Card>
            )}

            {activeView === 'scan' && <ScanPage onAddCard={handleAddCard} />}
            {activeView === 'orgchart' && <OrgChartView data={cards} />}
            {activeView === 'news' && <NewsView cards={cards} onUpgradeToPro={handleUpgradeToPro} />}
            {activeView === 'pro' && <EnhancedProView />}
            {activeView === 'settings' && <SettingsTab />}
          </div>
        </main>

        {selectedCard && (
          <CardDetailView
            card={selectedCard}
            onClose={() => setSelectedCard(null)}
            onEdit={handleCardEdit}
            onDelete={handleCardDelete}
          />
        )}

        <footer className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-sm z-10">
          <div className="container mx-auto max-w-screen-xl px-4 py-2">
            <nav className="flex justify-between items-center">
              {navItems.map((item) => (
                <Button
                  key={item.value}
                  variant="ghost"
                  size="sm"
                  className={`flex flex-col items-center justify-center p-2 ${
                    activeView === item.value ? 'text-primary' : 'text-muted-foreground'
                  }`}
                  onClick={() => setActiveView(item.value)}
                >
                  {item.icon}
                  <span className="text-xs font-medium mt-1">{item.label}</span>
                </Button>
              ))}
            </nav>
          </div>
        </footer>

        {showTooltip && (
          <div className="fixed bottom-20 right-4 bg-white p-4 rounded-lg shadow-lg max-w-xs">
            <p className="text-sm text-gray-600 mb-2">
              Welcome! Use the filters and sorting options to organize your business cards. 
              Click on a card to view details.
            </p>
            <Button size="sm" onClick={() => setShowTooltip(false)}>Got it</Button>
          </div>
        )}
      </div>
    </ErrorBoundary>
  )
}