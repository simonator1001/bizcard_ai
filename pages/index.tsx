import React, { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
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
  Settings2,
  XMarkIcon
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
import { GridView } from '@/components/cards/GridView'
import { CardDetailView } from '@/components/cards/CardDetailView'
import { OrgChartView } from '@/components/org-chart/OrgChartView'
import { NewsView } from '@/components/news/NewsView'
import { EnhancedProView } from '@/components/subscription/EnhancedProView'
import { SettingsTab } from '@/components/shared/SettingsTab'
import { ScanPage } from '@/components/cards/ScanPage'
import { ListView } from '@/components/cards/ListView'
import { FreeUsageCounter } from '@/components/subscription/FreeUsageCounter'

// Import types and mock data
import { mockNewsData } from '@/lib/mock-data'

// Import the new PremiumButton component
import { PremiumButton } from "@/components/ui/premium-button"

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
  const { t } = useTranslation()
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

  const handleRemoveDuplicates = async () => {
    try {
      const emailMap = new Map<string, BusinessCard[]>();
      
      // Group cards by email
      cards.forEach(card => {
        if (!emailMap.has(card.email)) {
          emailMap.set(card.email, []);
        }
        emailMap.get(card.email)?.push(card);
      });

      // Keep only the latest card for each email
      const cardsToDelete: string[] = [];
      emailMap.forEach(cardGroup => {
        if (cardGroup.length > 1) {
          // Sort by created_at and keep the latest one
          const sortedCards = cardGroup.sort((a, b) => 
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
          // Add all but the first (latest) card to delete list
          cardsToDelete.push(...sortedCards.slice(1).map(card => card.id));
        }
      });

      if (cardsToDelete.length === 0) {
        toast.info('No duplicate cards found');
        return;
      }

      // Delete cards from database
      const { error } = await supabase
        .from('business_cards')
        .delete()
        .in('id', cardsToDelete);

      if (error) throw error;

      // Update UI
      setCards(prevCards => prevCards.filter(card => !cardsToDelete.includes(card.id)));
      toast.success(`Removed ${cardsToDelete.length} duplicate cards`);
      setShowRemoveConfirmDialog(false);

    } catch (error) {
      console.error('Error removing duplicates:', error);
      toast.error('Failed to remove duplicates');
    }
  };

  const handleMergeCards = async () => {
    try {
      const emailMap = new Map<string, BusinessCard[]>();
      
      // Group cards by email
      cards.forEach(card => {
        if (!emailMap.has(card.email)) {
          emailMap.set(card.email, []);
        }
        emailMap.get(card.email)?.push(card);
      });

      let mergedCount = 0;
      // Process each group of cards
      for (const [email, cardGroup] of emailMap) {
        if (cardGroup.length > 1) {
          mergedCount++;
          // Sort by created_at to keep the latest as base
          const sortedCards = cardGroup.sort((a, b) => 
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );

          // Merge card data
          const mergedCard = sortedCards.reduce((merged, current) => ({
            ...merged,
            name: merged.name || current.name,
            name_zh: merged.name_zh || current.name_zh,
            company: merged.company || current.company,
            company_zh: merged.company_zh || current.company_zh,
            title: merged.title || current.title,
            title_zh: merged.title_zh || current.title_zh,
            phone: merged.phone || current.phone,
            address: merged.address || current.address,
            address_zh: merged.address_zh || current.address_zh,
            notes: merged.notes || current.notes,
            // Properly handle images
            imageUrl: merged.imageUrl || current.imageUrl,
            images: Array.from(new Set([
              ...(merged.images || []),
              ...(current.images || []),
              merged.imageUrl,
              current.imageUrl
            ]).filter(Boolean))
          }));

          // Update the base card in database
          const { error: updateError } = await supabase
            .from('business_cards')
            .update({
              name: mergedCard.name,
              name_zh: mergedCard.name_zh,
              company: mergedCard.company,
              company_zh: mergedCard.company_zh,
              title: mergedCard.title,
              title_zh: mergedCard.title_zh,
              phone: mergedCard.phone,
              address: mergedCard.address,
              address_zh: mergedCard.address_zh,
              notes: mergedCard.notes,
              image_url: mergedCard.imageUrl,
              images: mergedCard.images,
              updated_at: new Date().toISOString()
            })
            .eq('id', sortedCards[0].id);

          if (updateError) throw updateError;

          // Delete other cards
          const { error: deleteError } = await supabase
            .from('business_cards')
            .delete()
            .in('id', sortedCards.slice(1).map(card => card.id));

          if (deleteError) throw deleteError;
        }
      }

      if (mergedCount === 0) {
        toast.info(t('dialogs.merge.noMergeableCards'));
        return;
      }

      // Refresh cards
      await fetchCards();
      toast.success(t('dialogs.merge.success'));
      setShowMergeConfirmDialog(false);

    } catch (error) {
      console.error('Error merging cards:', error);
      toast.error(t('dialogs.merge.error'));
    }
  };

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

  // Add this before the return statement
  const filteredAndSortedCards = cards
    .filter(card => {
      const matchesSearch = (
        (card.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (card.name_zh?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (card.company?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (card.company_zh?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (card.title?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (card.title_zh?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (card.email?.toLowerCase() || '').includes(searchTerm.toLowerCase())
      );
      
      const matchesCompany = filterCompany === 'all' || 
        card.company === filterCompany || 
        card.company_zh === filterCompany;
      
      const matchesPosition = filterPosition === 'all' || 
        card.title === filterPosition || 
        card.title_zh === filterPosition;
      
      return matchesSearch && matchesCompany && matchesPosition;
    })
    .sort((a, b) => {
      if (sortField === 'createdAt') {
        const dateA = new Date(a.created_at || 0).getTime();
        const dateB = new Date(b.created_at || 0).getTime();
        return sortDirection === 'asc' ? dateA - dateB : dateB - dateA;
      }

      // Handle different fields for sorting
      const getComparisonValue = (card: BusinessCard, field: string) => {
        switch (field) {
          case 'name':
            return card.name_zh || card.name || '';
          case 'company':
            return card.company_zh || card.company || '';
          case 'position':
            return card.title_zh || card.title || '';
          default:
            return (card[field as keyof BusinessCard] as string) || '';
        }
      };

      const aValue = getComparisonValue(a, sortField).toLowerCase();
      const bValue = getComparisonValue(b, sortField).toLowerCase();
      
      return sortDirection === 'asc' 
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    });

  // Wrap the return with ErrorBoundary
  return (
    <ErrorBoundary>
      <div className="flex flex-col min-h-screen bg-gray-50">
        <header className="bg-white border-b px-8 py-4">
          <h1 className="text-2xl font-bold text-primary">{t('appTitle')}</h1>
        </header>

        <main className="flex-1 overflow-auto p-8 pb-20 scroll-smooth">
          <div className="container mx-auto max-w-[calc(100vw-4rem)]">
            {activeView === 'manage' && (
              <Card className="backdrop-blur-sm bg-white/90 shadow-lg border-0">
                <CardHeader className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm border-b">
                  <CardTitle className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                    {t('manage.title')}
                  </CardTitle>
                  <CardDescription className="text-lg text-gray-600">
                    {t('manage.description')}
                  </CardDescription>

                  <FreeUsageCounter />

                  <div className="flex items-center justify-between mt-6 space-x-4">
                    <div className="relative flex-grow">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <Input
                        placeholder={t('manage.searchPlaceholder')}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 py-2 text-sm rounded-lg border-gray-200 focus:ring-2 focus:ring-primary/20 focus:border-primary/20 transition-all duration-300"
                      />
                    </div>
                    <div className="flex items-center gap-3">
                      <motion.div
                        className="flex items-center gap-3"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                      >
                        <PremiumButton
                          icon={Download}
                          variant="ghost"
                          size="sm"
                          title={t('manage.actions.download')}
                          onClick={handleDownloadCSV}
                        />
                        <PremiumButton
                          icon={Trash2}
                          variant="ghost"
                          size="sm"
                          title={t('manage.actions.removeDuplicates')}
                          onClick={handleRemoveDuplicatesClick}
                        />
                        <PremiumButton
                          icon={Merge}
                          variant="ghost"
                          size="sm"
                          title={t('manage.actions.merge')}
                          onClick={handleMergeCardsClick}
                        />
                        <PremiumButton
                          icon={Filter}
                          variant="ghost"
                          size="sm"
                          title={t('actions.filter')}
                          onClick={() => setShowFilterDialog(true)}
                        />
                        <PremiumButton
                          icon={SortAsc}
                          variant="ghost"
                          size="sm"
                          title={t('actions.sort')}
                          onClick={() => setShowSortDialog(true)}
                        />
                        <Select
                          value={viewMode}
                          onValueChange={setViewMode}
                        >
                          <SelectTrigger className="w-[130px] ml-2 bg-white/80 border-gray-200 hover:bg-gray-50/90 backdrop-blur-sm transition-all duration-300 hover:shadow-md">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="grid">{t('view.grid')}</SelectItem>
                            <SelectItem value="table">{t('view.table')}</SelectItem>
                          </SelectContent>
                        </Select>
                      </motion.div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  {cards.length === 0 ? (
                    <motion.div 
                      className="flex flex-col items-center justify-center h-64 text-gray-500"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5 }}
                    >
                      <Upload className="h-16 w-16 mb-4 text-gray-400" />
                      <p className="text-lg font-medium mb-2">{t('manage.empty.title')}</p>
                      <p className="text-sm text-gray-500 mb-4">{t('manage.empty.description')}</p>
                      <Button 
                        onClick={() => setActiveView('scan')}
                        className="bg-gradient-to-r from-primary to-primary/80 text-white hover:from-primary/90 hover:to-primary/70"
                      >
                        {t('actions.uploadCard')}
                      </Button>
                    </motion.div>
                  ) : (
                    <motion.div
                      initial="hidden"
                      animate="visible"
                      variants={{
                        hidden: { opacity: 0 },
                        visible: {
                          opacity: 1,
                          transition: {
                            staggerChildren: 0.1
                          }
                        }
                      }}
                    >
                      {viewMode === 'grid' ? (
                        <GridView 
                          data={filteredAndSortedCards}
                          onCardClick={handleCardClick}
                        />
                      ) : (
                        <ListView
                          data={filteredAndSortedCards}
                          onCardClick={handleCardClick}
                        />
                      )}
                    </motion.div>
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
              {t('tooltips.welcome')}
            </p>
            <Button size="sm" onClick={() => setShowTooltip(false)}>{t('actions.gotIt')}</Button>
          </div>
        )}

        {showFilterDialog && (
          <Dialog open={showFilterDialog} onOpenChange={setShowFilterDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t('dialogs.filter.title')}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>{t('card.company')}</Label>
                  <Select value={filterCompany} onValueChange={setFilterCompany}>
                    <SelectTrigger>
                      <SelectValue placeholder={t('dialogs.filter.selectCompany')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t('dialogs.filter.allCompanies')}</SelectItem>
                      {uniqueCompanies.map(company => (
                        <SelectItem key={company} value={company}>{company}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{t('card.position')}</Label>
                  <Select value={filterPosition} onValueChange={setFilterPosition}>
                    <SelectTrigger>
                      <SelectValue placeholder={t('dialogs.filter.selectPosition')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t('dialogs.filter.allPositions')}</SelectItem>
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
                  {t('actions.reset')}
                </Button>
                <Button onClick={() => setShowFilterDialog(false)}>{t('actions.apply')}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}

        {showSortDialog && (
          <Dialog open={showSortDialog} onOpenChange={setShowSortDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t('dialogs.sort.title')}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>{t('dialogs.sort.field')}</Label>
                  <Select value={sortField} onValueChange={(value: 'name' | 'company' | 'position' | 'createdAt') => setSortField(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="name">{t('card.name')}</SelectItem>
                      <SelectItem value="company">{t('card.company')}</SelectItem>
                      <SelectItem value="position">{t('card.position')}</SelectItem>
                      <SelectItem value="createdAt">{t('card.createdAt')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{t('dialogs.sort.direction')}</Label>
                  <Select value={sortDirection} onValueChange={(value: 'asc' | 'desc') => setSortDirection(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="asc">{t('dialogs.sort.ascending')}</SelectItem>
                      <SelectItem value="desc">{t('dialogs.sort.descending')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={() => setShowSortDialog(false)}>{t('actions.apply')}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}

        {showRemoveConfirmDialog && (
          <Dialog open={showRemoveConfirmDialog} onOpenChange={setShowRemoveConfirmDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t('dialogs.removeDuplicates.title')}</DialogTitle>
                <DialogDescription>
                  {t('dialogs.removeDuplicates.description', { count: duplicateCount })}
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowRemoveConfirmDialog(false)}>
                  {t('actions.cancel')}
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={() => {
                    handleRemoveDuplicates()
                    setShowRemoveConfirmDialog(false)
                  }}
                >
                  {t('actions.remove')}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}

        {showMergeConfirmDialog && (
          <Dialog open={showMergeConfirmDialog} onOpenChange={setShowMergeConfirmDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t('dialogs.merge.title')}</DialogTitle>
                <DialogDescription>
                  {t('dialogs.merge.description', { count: mergeableCount })}
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowMergeConfirmDialog(false)}>
                  {t('actions.cancel')}
                </Button>
                <Button 
                  onClick={() => {
                    handleMergeCards()
                    setShowMergeConfirmDialog(false)
                  }}
                >
                  {t('actions.merge')}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </ErrorBoundary>
  )
}