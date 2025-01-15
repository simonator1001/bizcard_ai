import React, { useState, useRef } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Check, ScanLine, LayoutList, Network, Newspaper, Star, Settings, Search, Camera, Upload, Trash2, Edit2, Bell, HelpCircle, LogOut, Mail, Users, LayoutGrid, X, Download } from 'lucide-react'
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { useBusinessCards } from '@/lib/hooks/useBusinessCards'
import { useAuth } from '@/lib/auth-context'
import { BusinessCard } from '@/types/business-card'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase-client'
import { ManageCardsView } from '@/components/cards/ManageCardsView'
import { SubscriptionService } from '@/lib/subscription-service'
import { toast } from 'sonner'

interface NewsArticle {
  id: string
  title: string
  source: string
  date: string
  snippet: string
  url: string
  imageUrl: string
  relatedCompanies: string[]
  relatedPeople: string[]
}

const mockNewsArticles: NewsArticle[] = [
  {
    id: '1',
    title: "Tech Innovations Inc. Launches Revolutionary AI Product",
    source: "Tech News Daily",
    date: "2023-06-01",
    snippet: "Tech Innovations Inc. has unveiled its latest AI-powered product, set to disrupt the industry...",
    url: "#",
    imageUrl: "/placeholder.svg?height=200&width=400",
    relatedCompanies: ["Tech Innovations Inc."],
    relatedPeople: ["John Doe"]
  },
  {
    id: '2',
    title: "Design Solutions Co. Wins Award for Best UX Design",
    source: "Design Weekly",
    date: "2023-05-28",
    snippet: "Design Solutions Co., under the leadership of Jane Smith, has been recognized for its outstanding UX design...",
    url: "#",
    imageUrl: "/placeholder.svg?height=200&width=400",
    relatedCompanies: ["Design Solutions Co."],
    relatedPeople: ["Jane Smith"]
  }
]

type ViewMode = 'list' | 'grid' | 'carousel' | 'stack';

const CardItem = ({ card, onEdit, onDelete, viewMode, onDragEnd }: { 
  card: BusinessCard; 
  onEdit: (card: BusinessCard) => void; 
  onDelete: (card: BusinessCard) => void; 
  viewMode: ViewMode; 
  onDragEnd?: (direction: 'left' | 'right') => void 
}) => {
  const x = useMotionValue(0)
  const background = useTransform(
    x,
    [-100, 0, 100],
    ['rgb(239, 68, 68)', 'rgb(255, 255, 255)', 'rgb(34, 197, 94)']
  )

  const handleDragEnd = (event: any, info: any) => {
    const offset = info.offset.x
    const velocity = info.velocity.x

    if (offset < -100 || (offset < -50 && velocity < -500)) {
      onDelete(card)
    } else if (offset > 100 || (offset > 50 && velocity > 500)) {
      onEdit(card)
    }

    if (onDragEnd) {
      if (offset < -100) onDragEnd('left')
      else if (offset > 100) onDragEnd('right')
    }
  }

  return (
    <motion.div
      style={{ x, background }}
      drag={viewMode === 'carousel' ? 'x' : false}
      dragConstraints={{ left: 0, right: 0 }}
      onDragEnd={handleDragEnd}
      whileHover={{ y: -5, boxShadow: '0 10px 20px rgba(0, 0, 0, 0.12)' }}
      className={`relative p-6 rounded-xl shadow-sm border border-gray-100 bg-gradient-to-b from-white to-gray-50/50 backdrop-blur-sm transition-all duration-300 ${
        viewMode === 'grid' ? 'w-full' : 'w-full max-w-md'
      }`}
      tabIndex={0}
      role="button"
      aria-label={`Business card for ${card.name || card.name_zh}`}
    >
      <div className="flex items-start gap-4">
        <Avatar className="h-12 w-12 ring-2 ring-purple-100">
          <AvatarFallback className="bg-gradient-to-br from-purple-600 to-pink-600 text-white">
            {card.name?.split(' ').map(n => n[0]).join('').toUpperCase() || '??'}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 space-y-2 min-w-0">
          <div className="flex items-start justify-between">
            <div className="min-w-0">
              <h3 className="font-semibold text-lg truncate">
                {card.name || card.name_zh}
                {card.name && card.name_zh && (
                  <span className="ml-2 text-sm text-gray-500">({card.name_zh})</span>
                )}
              </h3>
              <p className="text-sm text-gray-600">
                {card.title || card.title_zh}
                {card.title && card.title_zh && (
                  <span className="ml-2">({card.title_zh})</span>
                )}
              </p>
              <p className="text-sm font-medium text-gray-700">
                {card.company || card.company_zh}
                {card.company && card.company_zh && (
                  <span className="ml-2">({card.company_zh})</span>
                )}
              </p>
            </div>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-gray-500 hover:text-purple-600"
                onClick={() => onEdit(card)}
                title="Edit card"
              >
                <Edit2 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-gray-500 hover:text-red-600"
                onClick={() => onDelete(card)}
                title="Delete card"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="space-y-1">
            {card.email && (
              <p className="text-sm text-gray-600 flex items-center gap-2">
                <Mail className="h-4 w-4" />
                <a href={`mailto:${card.email}`} className="truncate hover:text-purple-600">
                  {card.email}
                </a>
              </p>
            )}
            {card.phone && (
              <p className="text-sm text-gray-600 flex items-center gap-2">
                <Bell className="h-4 w-4" />
                <a href={`tel:${card.phone}`} className="truncate hover:text-purple-600">
                  {card.phone}
                </a>
              </p>
            )}
            {(card.address || card.address_zh) && (
              <p className="text-sm text-gray-600 flex items-center gap-2">
                <HelpCircle className="h-4 w-4" />
                <span className="truncate">
                  {card.address || card.address_zh}
                  {card.address && card.address_zh && (
                    <span className="ml-2 text-xs text-gray-500">({card.address_zh})</span>
                  )}
                </span>
              </p>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export default function Component() {
  const [activeTab, setActiveTab] = useState('scan')
  const [isYearly, setIsYearly] = useState(false)
  const [newsFilter, setNewsFilter] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCompany, setSelectedCompany] = useState<string>('')
  const [isScanning, setIsScanning] = useState(false)
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [selectedArticle, setSelectedArticle] = useState<NewsArticle | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [orgChartViewMode, setOrgChartViewMode] = useState('tree')
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false)
  const { cards, loading, error, addCard, updateCard, deleteCard } = useBusinessCards()
  const { user, signOut } = useAuth()
  const [currentCardIndex, setCurrentCardIndex] = useState(0)
  const router = useRouter()

  // Filter cards based on search term
  const filteredCards = cards.filter(card => 
    card.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    card.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    card.title?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Group cards by company
  const companiesMap = new Map<string, BusinessCard[]>()
  cards.forEach(card => {
    const company = card.company || 'Unknown'
    if (!companiesMap.has(company)) {
      companiesMap.set(company, [])
    }
    companiesMap.get(company)?.push(card)
  })
  const companies = Array.from(companiesMap.entries()).map(([name, contacts]) => ({
    id: name,
    name,
    contacts
  }))

  const totalContacts = cards.length
  const selectedCompanyData = companies.find(c => c.id === selectedCompany)

  const handleEdit = (card: BusinessCard) => {
    // Implement edit functionality
    console.log('Edit card:', card)
  }

  const handleDelete = async (card: BusinessCard) => {
    try {
      await deleteCard(card.id)
    } catch (error) {
      console.error('Error deleting card:', error)
    }
  }

  const handleDragEnd = (direction: 'left' | 'right') => {
    if (direction === 'left') {
      setCurrentCardIndex((prevIndex) => (prevIndex + 1) % filteredCards.length)
    } else if (direction === 'right') {
      setCurrentCardIndex((prevIndex) => (prevIndex - 1 + filteredCards.length) % filteredCards.length)
    }
  }

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-purple-50 to-pink-50">
      <header className="bg-white shadow-sm py-6 px-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Simon.AI BizCard Digital Archive
          </h1>
          {user ? (
            <Button
              variant="ghost"
              className="text-gray-600 hover:text-gray-900"
              onClick={signOut}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          ) : (
            <Button
              variant="ghost"
              className="text-gray-600 hover:text-gray-900"
              onClick={() => router.push('/signin')}
            >
              Sign In
            </Button>
          )}
        </div>
      </header>

      <main className="flex-1 overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
          <TabsList className="w-full justify-start p-0 bg-transparent border-b">
            <TabsTrigger value="scan" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 py-2">
              <ScanLine className="w-4 h-4 mr-2" />
              Scan
            </TabsTrigger>
            <TabsTrigger value="manage" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 py-2">
              <LayoutList className="w-4 h-4 mr-2" />
              Manage
            </TabsTrigger>
            <TabsTrigger value="network" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 py-2">
              <Network className="w-4 h-4 mr-2" />
              Network
            </TabsTrigger>
            <TabsTrigger value="news" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 py-2">
              <Newspaper className="w-4 h-4 mr-2" />
              News
            </TabsTrigger>
            <TabsTrigger value="settings" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 py-2">
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="scan" className="h-full p-8 overflow-auto">
            <Card className="mb-8 overflow-hidden">
              <CardContent className="p-0">
                <div className="relative overflow-hidden rounded-lg">
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-400 via-pink-500 to-red-500 opacity-20"></div>
                  <div className="relative z-10 p-8 space-y-6">
                    <CardTitle className="text-3xl font-bold">Scan Business Cards</CardTitle>
                    <CardDescription className="text-lg">
                      Quickly capture and organize your business contacts
                    </CardDescription>
                    <div className="space-y-4">
                      <Button 
                        className="w-full py-6 text-lg font-semibold rounded-full transition-all duration-300 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                        onClick={() => {
                          const input = document.createElement('input')
                          input.type = 'file'
                          input.accept = 'image/*'
                          input.capture = 'environment'
                          input.onchange = (e) => {
                            const file = (e.target as HTMLInputElement).files?.[0]
                            if (file) {
                              const reader = new FileReader()
                              reader.onload = (e) => {
                                setUploadedImage(e.target?.result as string)
                              }
                              reader.readAsDataURL(file)
                            }
                          }
                          input.click()
                        }}
                      >
                        <Camera className="h-8 w-8 mr-3" />
                        Take a Photo
                      </Button>
                      <Button 
                        variant="outline"
                        className="w-full py-6 text-lg font-semibold rounded-full border-2 hover:bg-gray-50"
                        onClick={() => {
                          const input = document.createElement('input')
                          input.type = 'file'
                          input.accept = 'image/*'
                          input.multiple = true
                          input.onchange = async (e) => {
                            const files = (e.target as HTMLInputElement).files
                            if (!files || files.length === 0) return

                            setIsScanning(true)
                            let successCount = 0
                            let failedFiles: string[] = []
                            let hitScanLimit = false

                            try {
                              const { data: { session }, error: sessionError } = await supabase.auth.getSession()
                              if (sessionError || !session) {
                                throw new Error('Not authenticated')
                              }

                              // Check subscription status before processing
                              const canScan = await SubscriptionService.canPerformAction(user?.id || '', 'scan')
                              if (!canScan) {
                                setShowUpgradePrompt(true)
                                throw new Error('Monthly scan limit reached')
                              }

                              // Process all files
                              for (let i = 0; i < files.length; i++) {
                                if (hitScanLimit) break; // Stop processing if scan limit reached
                                
                                const file = files[i]
                                const reader = new FileReader()
                                
                                try {
                                  // Process each file
                                  await new Promise((resolve, reject) => {
                                    reader.onload = async (e) => {
                                      try {
                                        const base64Image = e.target?.result as string
                                        const response = await fetch('/api/scan', {
                                          method: 'POST',
                                          headers: {
                                            'Content-Type': 'application/json',
                                            'Authorization': `Bearer ${session.access_token}`
                                          },
                                          body: JSON.stringify({ image: base64Image }),
                                        })
                                        
                                        let responseData
                                        try {
                                          responseData = await response.json()
                                        } catch (parseError) {
                                          throw new Error('Invalid response from OCR service')
                                        }

                                        if (!response.ok) {
                                          // Check for scan limit error
                                          if (responseData.error?.toLowerCase().includes('monthly scan limit') || 
                                              responseData.error?.toLowerCase().includes('scan limit reached') || 
                                              responseData.message?.toLowerCase().includes('monthly scan limit') ||
                                              responseData.message?.toLowerCase().includes('scan limit reached')) {
                                            hitScanLimit = true
                                            setShowUpgradePrompt(true)
                                            throw new Error('Monthly scan limit reached')
                                          }
                                          throw new Error(responseData.message || responseData.error || 'Failed to scan card')
                                        }
                                        
                                        successCount++
                                        resolve(null)
                                      } catch (error: any) {
                                        console.error(`Error processing file ${file.name}:`, error)
                                        if (error.message.toLowerCase().includes('scan limit')) {
                                          hitScanLimit = true
                                          setShowUpgradePrompt(true)
                                          reject(error)
                                        } else {
                                          failedFiles.push(file.name)
                                          reject(error)
                                        }
                                      }
                                    }
                                    reader.onerror = (error) => {
                                      console.error(`Error reading file ${file.name}:`, error)
                                      failedFiles.push(file.name)
                                      reject(new Error(`Failed to read file ${file.name}`))
                                    }
                                    reader.readAsDataURL(file)
                                  }).catch((error) => {
                                    if (error.message.toLowerCase().includes('scan limit')) {
                                      throw error; // Propagate scan limit error
                                    }
                                    console.warn(`Continuing after error with file ${file.name}:`, error)
                                  })
                                } catch (fileError: any) {
                                  if (fileError.message.toLowerCase().includes('scan limit')) {
                                    throw fileError; // Propagate scan limit error
                                  }
                                  console.error(`Error processing file ${file.name}:`, fileError)
                                  failedFiles.push(file.name)
                                }
                              }
                              
                              // Show appropriate success/failure message
                              if (hitScanLimit) {
                                if (successCount > 0) {
                                  toast.success(`Successfully processed ${successCount} business cards`)
                                }
                                toast.error('Monthly scan limit reached. Please upgrade your plan to continue scanning.')
                              } else if (successCount === files.length) {
                                toast.success(`Successfully processed all ${files.length} business cards`)
                              } else if (successCount > 0) {
                                toast.success(`Successfully processed ${successCount} out of ${files.length} business cards`)
                                if (failedFiles.length > 0) {
                                  toast.error(`Failed to process: ${failedFiles.join(', ')}`)
                                }
                              } else {
                                throw new Error(`Failed to process any cards. Please try again.`)
                              }

                              if (successCount > 0) {
                                setActiveTab('manage')
                              }
                            } catch (error: any) {
                              console.error('Error scanning cards:', error)
                              const errorMessage = error.message.toLowerCase()
                              if (errorMessage.includes('scan limit') || errorMessage.includes('monthly limit')) {
                                setShowUpgradePrompt(true)
                                toast.error('Monthly scan limit reached. Please upgrade your plan to continue scanning.')
                              } else {
                                toast.error(error.message || 'Failed to scan cards. Please try again.')
                              }
                            } finally {
                              setIsScanning(false)
                            }
                          }
                          input.click()
                        }}
                      >
                        <Upload className="h-8 w-8 mr-3" />
                        {isScanning ? 'Processing...' : 'Upload Images'}
                      </Button>
                    </div>
                  </div>
                </div>
                {uploadedImage && (
                  <div className="p-8">
                    <img src={uploadedImage} alt="Uploaded business card" className="w-full h-auto rounded-lg shadow-lg" />
                    <Button 
                      onClick={async () => {
                        setIsScanning(true)
                        try {
                          const { data: { session }, error: sessionError } = await supabase.auth.getSession()
                          if (sessionError || !session) {
                            throw new Error('Not authenticated')
                          }

                          const response = await fetch('/api/scan', {
                            method: 'POST',
                            headers: {
                              'Content-Type': 'application/json',
                              'Authorization': `Bearer ${session.access_token}`
                            },
                            body: JSON.stringify({ image: uploadedImage }),
                          })
                          
                          if (!response.ok) {
                            const errorData = await response.json()
                            throw new Error(errorData.message || errorData.error || 'Failed to scan card')
                          }
                          
                          const data = await response.json()
                          setUploadedImage(null)
                          setActiveTab('manage')
                        } catch (error: any) {
                          console.error('Error scanning card:', error)
                          alert(error.message || 'Failed to scan card. Please try again.')
                        } finally {
                          setIsScanning(false)
                        }
                      }} 
                      className="mt-6 w-full py-6 text-lg font-semibold rounded-full transition-all duration-300 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                      disabled={isScanning}
                    >
                      <ScanLine className="mr-3 h-6 w-6" />
                      {isScanning ? 'Scanning...' : 'Scan Card'}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="manage" className="h-full p-8 overflow-auto">
            <ManageCardsView setActiveTab={setActiveTab} />
          </TabsContent>

          <TabsContent value="network" className="h-full p-8 overflow-auto">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold">Organization Chart</h2>
                <div className="flex items-center gap-4">
                  <Select value={selectedCompany} onValueChange={setSelectedCompany}>
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Select company" />
                    </SelectTrigger>
                    <SelectContent>
                      {companies.map((company) => (
                        <SelectItem key={company.id} value={company.id}>
                          {company.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Contacts</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{totalContacts}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Companies</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{companies.length}</div>
                  </CardContent>
                </Card>
              </div>

              {selectedCompanyData && (
                <Card>
                  <CardHeader>
                    <CardTitle>{selectedCompanyData.name}</CardTitle>
                    <CardDescription>{selectedCompanyData.contacts.length} contacts</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[400px]">
                      <div className="space-y-4">
                        {selectedCompanyData.contacts.map((contact) => (
                          <Card key={contact.id}>
                            <CardContent className="p-4">
                              <div className="flex items-center gap-4">
                                <Avatar>
                                  <AvatarFallback>
                                    {contact.name?.split(' ').map(n => n[0]).join('').toUpperCase() || '??'}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <h3 className="font-medium">
                                    {contact.name || contact.name_zh}
                                    {contact.name && contact.name_zh && ` (${contact.name_zh})`}
                                  </h3>
                                  <p className="text-sm text-gray-500">
                                    {contact.title || contact.title_zh}
                                    {contact.title && contact.title_zh && ` (${contact.title_zh})`}
                                  </p>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="news" className="h-full p-8 overflow-auto">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold">News</h2>
                <div className="flex items-center gap-4">
                  <Select value={newsFilter} onValueChange={setNewsFilter}>
                    <SelectTrigger className="w-[120px]">
                      <SelectValue placeholder="Filter" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="related">Related</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {loading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                </div>
              ) : error ? (
                <div className="text-center py-8 text-red-500">
                  Error loading news: {error.message}
                </div>
              ) : mockNewsArticles.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No news articles found.
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {mockNewsArticles.map((article) => (
                    <Card key={article.id} className="h-[300px]">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-4">
                          <Avatar className="h-12 w-12">
                            <AvatarFallback>
                              {article.title.split(' ').map(n => n[0]).join('').toUpperCase() || '??'}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="font-medium">
                              {article.title}
                            </h3>
                            <p className="text-sm text-gray-500">
                              {article.source}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="settings" className="h-full p-8 overflow-auto">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold">Settings</h2>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Yearly</CardTitle>
                    <Switch
                      checked={isYearly}
                      onCheckedChange={setIsYearly}
                    />
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-500">
                      {isYearly ? 'Enabled' : 'Disabled'}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">View Mode</CardTitle>
                    <Select value={viewMode} onValueChange={(value: ViewMode) => setViewMode(value)}>
                      <SelectTrigger className="w-[120px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="list">
                          <div className="flex items-center">
                            <LayoutList className="w-4 h-4 mr-2" />
                            List
                          </div>
                        </SelectItem>
                        <SelectItem value="grid">
                          <div className="flex items-center">
                            <LayoutGrid className="w-4 h-4 mr-2" />
                            Grid
                          </div>
                        </SelectItem>
                        <SelectItem value="carousel">
                          <div className="flex items-center">
                            <Star className="w-4 h-4 mr-2" />
                            Carousel
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-500">
                      {viewMode === 'list' ? 'List View' : viewMode === 'grid' ? 'Grid View' : viewMode === 'carousel' ? 'Carousel View' : 'Stack View'}
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </main>

      <Dialog open={showUpgradePrompt} onOpenChange={setShowUpgradePrompt}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upgrade Your Plan</DialogTitle>
            <DialogDescription>
              You've reached your monthly scan limit. Upgrade your plan to continue scanning business cards.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Button
              className="w-full"
              onClick={() => {
                router.push('/upgrade')
                setShowUpgradePrompt(false)
              }}
            >
              Upgrade Now
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setShowUpgradePrompt(false)}
            >
              Maybe Later
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}