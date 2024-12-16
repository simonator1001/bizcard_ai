import React, { useState, useRef, useEffect } from 'react'
import { 
  ScanIcon,
  LayoutGridIcon,
  NetworkIcon,
  NewspaperIcon,
  StarIcon,
  SettingsIcon,
  Search,
  Loader2,
  Users,
  Network,
  Newspaper,
  Star,
  Settings,
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
  ScanLine,
  LayoutList,
  ScannerIcon,
  Network2,
  Settings2
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
import { saveAs } from 'file-saver'
import Papa from 'papaparse'

// Import components
import { GridView } from '@/components/GridView'
import { CardDetailView } from '@/components/CardDetailView'
import { OrgChartView } from '@/components/OrgChartView'
import { NewsView } from '@/components/NewsView'
import { EnhancedProView } from '@/components/EnhancedProView'
import { SettingsTab } from '@/components/SettingsTab'
import { ScanPage } from '@/components/ScanPage'
import { ListView } from '@/components/ListView'

// Import types and mock data
import { mockNewsData } from '@/lib/mock-data'

interface BusinessCard {
  id: string
  name: string
  name_zh: string
  company: string
  company_zh: string
  title: string
  title_zh: string
  email: string
  phone: string
  address: string
  address_zh: string
  description: string
  imageUrl: string
  created_at: string
  updated_at: string
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

  // Add these state variables
  const [showFilterDialog, setShowFilterDialog] = useState(false)
  const [showSortDialog, setShowSortDialog] = useState(false)
  const [sortField, setSortField] = useState<'name' | 'company' | 'position' | 'createdAt'>('name')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [filterCompany, setFilterCompany] = useState('all')
  const [filterPosition, setFilterPosition] = useState('all')

  // Add new state variables
  const [showRemoveConfirmDialog, setShowRemoveConfirmDialog] = useState(false)
  const [showMergeConfirmDialog, setShowMergeConfirmDialog] = useState(false)
  const [duplicateCount, setDuplicateCount] = useState(0)
  const [mergeableCount, setMergeableCount] = useState(0)

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
                  name_zh: payload.new.name_zh,
                  company: payload.new.company,
                  company_zh: payload.new.company_zh,
                  title: payload.new.title,
                  title_zh: payload.new.title_zh,
                  email: payload.new.email,
                  phone: payload.new.phone,
                  address: payload.new.address,
                  address_zh: payload.new.address_zh,
                  description: payload.new.notes,
                  imageUrl: payload.new.image_url,
                  created_at: payload.new.created_at,
                  updated_at: payload.new.updated_at
                }])
              }
              break

            case 'UPDATE':
              if (payload.new.user_id === user.id) {
                setCards(prevCards => prevCards.map(card => 
                  card.id === payload.new.id ? {
                    ...card,
                    name: payload.new.name,
                    name_zh: payload.new.name_zh,
                    company: payload.new.company,
                    company_zh: payload.new.company_zh,
                    title: payload.new.title,
                    title_zh: payload.new.title_zh,
                    email: payload.new.email,
                    phone: payload.new.phone,
                    address: payload.new.address,
                    address_zh: payload.new.address_zh,
                    description: payload.new.notes,
                    imageUrl: payload.new.image_url,
                    created_at: payload.new.created_at,
                    updated_at: payload.new.updated_at
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
          name: card.name || '',
          name_zh: card.name_zh || '',
          company: card.company || '',
          company_zh: card.company_zh || '',
          title: card.title || '',
          title_zh: card.title_zh || '',
          email: card.email || '',
          phone: card.phone || '',
          address: card.address || '',
          address_zh: card.address_zh || '',
          description: card.notes || '',
          imageUrl: card.image_url || '',
          created_at: card.created_at,
          updated_at: card.updated_at
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
          name_zh: updatedCard.name_zh,
          company: updatedCard.company,
          company_zh: updatedCard.company_zh,
          title: updatedCard.title,
          title_zh: updatedCard.title_zh,
          email: updatedCard.email,
          phone: updatedCard.phone,
          address: updatedCard.address,
          address_zh: updatedCard.address_zh,
          description: updatedCard.description,
          updated_at: new Date().toISOString()
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
    // Ensure all required fields have at least empty strings
    const sanitizedCard = {
      ...newCard,
      name: newCard.name || '',
      name_zh: newCard.name_zh || '',
      company: newCard.company || '',
      company_zh: newCard.company_zh || '',
      title: newCard.title || '',
      title_zh: newCard.title_zh || '',
      email: newCard.email || '',
      phone: newCard.phone || '',
      address: newCard.address || '',
      address_zh: newCard.address_zh || '',
      description: newCard.description || '',
      imageUrl: newCard.imageUrl || ''
    }

    // Optimistically update the UI
    const optimisticCard = { ...sanitizedCard, id: Date.now().toString() }
    setCards(prevCards => [...prevCards, optimisticCard])

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data: savedCard, error } = await supabase
        .from('business_cards')
        .insert({
          user_id: user.id,
          name: sanitizedCard.name,
          name_zh: sanitizedCard.name_zh,
          company: sanitizedCard.company,
          company_zh: sanitizedCard.company_zh,
          title: sanitizedCard.title,
          title_zh: sanitizedCard.title_zh,
          email: sanitizedCard.email,
          phone: sanitizedCard.phone,
          address: sanitizedCard.address,
          address_zh: sanitizedCard.address_zh,
          description: sanitizedCard.description,
          image_url: sanitizedCard.imageUrl,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error

      // Update with actual saved card
      setCards(prevCards => prevCards.map(card => 
        card.id === optimisticCard.id ? {
          ...savedCard,
          imageUrl: savedCard.image_url
        } : card
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

  // Define the navigation items with their icons
  const navItems = [
    { icon: <ScanIcon className="h-6 w-6" />, label: "Scan", value: "scan" },
    { icon: <LayoutGridIcon className="h-6 w-6" />, label: "Manage", value: "manage" },
    { icon: <NetworkIcon className="h-6 w-6" />, label: "Org Chart", value: "orgchart" },
    { icon: <NewspaperIcon className="h-6 w-6" />, label: "News", value: "news" },
    { icon: <StarIcon className="h-6 w-6" />, label: "Pro", value: "pro" },
    { icon: <SettingsIcon className="h-6 w-6" />, label: "Settings", value: "settings" },
  ]

  // Add these handler functions
  const handleDownloadCSV = () => {
    try {
      const csvData = cards.map(card => ({
        Name: card.name,
        Name_EN: card.name_zh,
        Company: card.company,
        Company_EN: card.company_zh,
        Position: card.title,
        Position_EN: card.title_zh,
        Email: card.email,
        Phone: card.phone,
      }))

      const csv = Papa.unparse(csvData)
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
      saveAs(blob, 'business_cards.csv')
      toast.success('CSV downloaded successfully')
    } catch (error) {
      console.error('Error downloading CSV:', error)
      toast.error('Failed to download CSV')
    }
  }

  const handleRemoveDuplicatesClick = () => {
    const uniqueEmails = new Set()
    const duplicates = cards.filter(card => {
      if (uniqueEmails.has(card.email)) {
        return true
      }
      uniqueEmails.add(card.email)
      return false
    })
    setDuplicateCount(duplicates.length)
    setShowRemoveConfirmDialog(true)
  }

  const handleRemoveDuplicates = () => {
    try {
      const uniqueEmails = new Set()
      const uniqueCards = cards.filter(card => {
        if (uniqueEmails.has(card.email)) {
          return false
        }
        uniqueEmails.add(card.email)
        return true
      })

      setCards(uniqueCards)
      toast.success(`Removed ${cards.length - uniqueCards.length} duplicate cards`)
    } catch (error) {
      console.error('Error removing duplicates:', error)
      toast.error('Failed to remove duplicates')
    }
  }

  const handleMergeCards = () => {
    try {
      const emailMap = new Map()
      
      // Group cards by email
      cards.forEach(card => {
        if (!emailMap.has(card.email)) {
          emailMap.set(card.email, [])
        }
        emailMap.get(card.email).push(card)
      })

      // Merge cards with the same email
      const mergedCards = Array.from(emailMap.values()).map(cardGroup => {
        if (cardGroup.length === 1) return cardGroup[0]

        // Merge multiple cards into one
        return cardGroup.reduce((merged, current) => ({
          ...merged,
          name: merged.name || current.name,
          name_zh: merged.name_zh || current.name_zh,
          company: merged.company || current.company,
          company_zh: merged.company_zh || current.company_zh,
          title: merged.title || current.title,
          title_zh: merged.title_zh || current.title_zh,
          phone: merged.phone || current.phone,
          description: merged.description || current.description,
        }))
      })

      setCards(mergedCards)
      toast.success('Cards merged successfully')
    } catch (error) {
      console.error('Error merging cards:', error)
      toast.error('Failed to merge cards')
    }
  }

  const handleMergeCardsClick = () => {
    const emailCounts = cards.reduce((acc, card) => {
      acc[card.email] = (acc[card.email] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    const mergeableCards = Object.values(emailCounts).filter(count => count > 1).length
    setMergeableCount(mergeableCards)
    setShowMergeConfirmDialog(true)
  }

  // Add these helper functions
  const uniqueCompanies = Array.from(new Set(cards.map(card => card.company))).filter(Boolean)
  const uniquePositions = Array.from(new Set(cards.map(card => card.title))).filter(Boolean)

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
                    <div className="flex items-center gap-2">
                      <div className="flex items-center space-x-1 border-r pr-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          className="flex items-center gap-2 px-3"
                          onClick={handleDownloadCSV}
                          title="Download CSV"
                        >
                          <Download className="h-4 w-4" />
                          CSV
                        </Button>
                      </div>

                      <div className="flex items-center space-x-1 border-r pr-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          className="flex items-center gap-2 px-3"
                          onClick={handleRemoveDuplicatesClick}
                          title="Remove Duplicates"
                        >
                          <Trash2 className="h-4 w-4" />
                          Remove
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          className="flex items-center gap-2 px-3"
                          onClick={handleMergeCardsClick}
                          title="Merge Similar Cards"
                        >
                          <Merge className="h-4 w-4" />
                          Merge
                        </Button>
                      </div>

                      <div className="flex items-center space-x-1 border-r pr-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          className="flex items-center gap-2 px-3"
                          onClick={() => setShowFilterDialog(true)}
                          title="Filter Cards"
                        >
                          <Filter className="h-4 w-4" />
                          Filter
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          className="flex items-center gap-2 px-3"
                          onClick={() => setShowSortDialog(true)}
                          title="Sort Cards"
                        >
                          <SortAsc className="h-4 w-4" />
                          Sort
                        </Button>
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
                  </div>
                </CardHeader>
                <CardContent>
                  {viewMode === 'grid' ? (
                    <GridView 
                      data={cards
                        .filter(card => {
                          const matchesSearch = (
                            (card.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                            (card.company?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                            (card.title?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                            (card.email?.toLowerCase() || '').includes(searchTerm.toLowerCase())
                          )
                          
                          const matchesCompany = filterCompany === 'all' || card.company === filterCompany
                          const matchesPosition = filterPosition === 'all' || card.title === filterPosition
                          
                          return matchesSearch && matchesCompany && matchesPosition
                        })
                        .sort((a, b) => {
                          if (sortField === 'createdAt') {
                            const dateA = new Date(a.created_at || 0).getTime();
                            const dateB = new Date(b.created_at || 0).getTime();
                            return sortDirection === 'asc' ? dateA - dateB : dateB - dateA;
                          }
                          const aValue = (a[sortField] || '').toLowerCase();
                          const bValue = (b[sortField] || '').toLowerCase();
                          return sortDirection === 'asc' 
                            ? aValue.localeCompare(bValue)
                            : bValue.localeCompare(aValue);
                        })
                      }
                      onCardClick={handleCardClick}
                    />
                  ) : (
                    <ListView
                      data={cards
                        .filter(card => {
                          const matchesSearch = (
                            (card.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                            (card.company?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                            (card.title?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                            (card.email?.toLowerCase() || '').includes(searchTerm.toLowerCase())
                          )
                          
                          const matchesCompany = filterCompany === 'all' || card.company === filterCompany
                          const matchesPosition = filterPosition === 'all' || card.title === filterPosition
                          
                          return matchesSearch && matchesCompany && matchesPosition
                        })
                        .sort((a, b) => {
                          if (sortField === 'createdAt') {
                            const dateA = new Date(a.created_at || 0).getTime();
                            const dateB = new Date(b.created_at || 0).getTime();
                            return sortDirection === 'asc' ? dateA - dateB : dateB - dateA;
                          }
                          const aValue = (a[sortField] || '').toLowerCase();
                          const bValue = (b[sortField] || '').toLowerCase();
                          return sortDirection === 'asc' 
                            ? aValue.localeCompare(bValue)
                            : bValue.localeCompare(aValue);
                        })
                      }
                      onCardClick={handleCardClick}
                    />
                  )}
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
              {navItems.map((item, index) => {
                return (
                  <Button
                    key={item.value}
                    variant="ghost"
                    size="sm"
                    className={`
                      flex flex-col items-center justify-center p-2
                      min-w-[4rem]
                      ${activeView === item.value 
                        ? 'text-primary font-medium' 
                        : 'text-gray-600 hover:text-gray-900'
                      }
                      hover:bg-gray-100
                      transition-colors
                    `}
                    onClick={() => setActiveView(item.value)}
                  >
                    <div className="w-6 h-6 mb-1 flex items-center justify-center text-current">
                      {item.icon}
                    </div>
                    <span className="text-xs font-medium">{item.label}</span>
                  </Button>
                );
              })}
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

        {showFilterDialog && (
          <Dialog open={showFilterDialog} onOpenChange={setShowFilterDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Filter Cards</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Company</Label>
                  <Select value={filterCompany} onValueChange={setFilterCompany}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select company" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Companies</SelectItem>
                      {uniqueCompanies.map(company => (
                        <SelectItem key={company} value={company}>{company}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Position</Label>
                  <Select value={filterPosition} onValueChange={setFilterPosition}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select position" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Positions</SelectItem>
                      {uniquePositions.map(position => (
                        <SelectItem key={position} value={position}>{position}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => {
                  setFilterCompany('all')
                  setFilterPosition('all')
                }}>
                  Reset
                </Button>
                <Button onClick={() => setShowFilterDialog(false)}>Apply</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}

        {showSortDialog && (
          <Dialog open={showSortDialog} onOpenChange={setShowSortDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Sort Cards</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Sort By</Label>
                  <Select value={sortField} onValueChange={(value: 'name' | 'company' | 'position' | 'createdAt') => setSortField(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="name">Name</SelectItem>
                      <SelectItem value="company">Company</SelectItem>
                      <SelectItem value="position">Position</SelectItem>
                      <SelectItem value="createdAt">Date Added</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Direction</Label>
                  <Select value={sortDirection} onValueChange={(value: 'asc' | 'desc') => setSortDirection(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="asc">Ascending</SelectItem>
                      <SelectItem value="desc">Descending</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={() => setShowSortDialog(false)}>Apply</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}

        {showRemoveConfirmDialog && (
          <Dialog open={showRemoveConfirmDialog} onOpenChange={setShowRemoveConfirmDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Remove Duplicate Cards</DialogTitle>
                <DialogDescription>
                  Found {duplicateCount} duplicate business cards. Are you sure you want to remove them?
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowRemoveConfirmDialog(false)}>
                  Cancel
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={() => {
                    handleRemoveDuplicates()
                    setShowRemoveConfirmDialog(false)
                  }}
                >
                  Remove {duplicateCount} Cards
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}

        {showMergeConfirmDialog && (
          <Dialog open={showMergeConfirmDialog} onOpenChange={setShowMergeConfirmDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Merge Similar Cards</DialogTitle>
                <DialogDescription>
                  Found {mergeableCount} groups of cards that can be merged. Merging will combine information from cards with the same email address.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowMergeConfirmDialog(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={() => {
                    handleMergeCards()
                    setShowMergeConfirmDialog(false)
                  }}
                >
                  Merge Cards
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </ErrorBoundary>
  )
}