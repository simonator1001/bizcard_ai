import React, { useState, useRef } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { 
  Check, 
  ScanLine, 
  LayoutList, 
  Network, 
  Newspaper, 
  Star, 
  Settings, 
  Search, 
  Camera, 
  Upload, 
  Trash2, 
  Edit2, 
  Bell, 
  HelpCircle, 
  LogOut, 
  Mail, 
  Users, 
  LayoutGrid, 
  X, 
  Download,
  type LucideIcon
} from 'lucide-react'
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
import { SubscriptionService } from '@/lib/subscription'
import { SettingsTab } from '@/components/shared/SettingsTab'
import { toast } from 'sonner'
import { NewsView } from '@/components/news/NewsView'
import { ExpandableTabs } from "@/components/ui/expandable-tabs"
import { Footerdemo } from "@/components/ui/footer-section"
import { NewsArticle } from '@/types/news'
import { ChatInterface } from '@/components/chat/ChatInterface'
import { useTranslation } from 'react-i18next'

type ViewMode = 'list' | 'grid' | 'carousel' | 'stack';

type NavigationItem = {
  title: string;
  icon: LucideIcon;
  type?: never;
} | {
  type: "separator";
  title?: never;
  icon?: never;
};

const navigationItems: NavigationItem[] = [
  { title: "Scan", icon: ScanLine },
  { title: "Manage", icon: LayoutGrid },
  { type: "separator" },
  { title: "Network", icon: Network },
  { title: "News", icon: Newspaper },
  { title: "Settings", icon: Settings },
];

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

function UpgradePrompt({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const router = useRouter()
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upgrade Your Plan</DialogTitle>
          <DialogDescription>
            You've reached your monthly scan limit. Upgrade to our Pro plan to get unlimited scans and more features.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <h3 className="font-medium">Pro Plan Features:</h3>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>Unlimited card scans</li>
              <li>Advanced OCR with multi-language support</li>
              <li>Export to CSV/Excel</li>
              <li>Full news feed access</li>
              <li>Organization chart view</li>
              <li>Priority support</li>
            </ul>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Maybe Later</Button>
          <Button onClick={() => router.push('/pricing')}>View Plans</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default function Component() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('scan');
  const { t } = useTranslation();
  
  // Get the tab from URL parameters
  React.useEffect(() => {
    const tab = new URLSearchParams(window.location.search).get('tab');
    if (tab) {
      setActiveTab(tab);
    }
  }, []);

  // Update URL when tab changes
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    router.push(`/?tab=${tab}`);
  };

  const handleNavigationChange = (index: number | null) => {
    if (index === null) return;
    const item = navigationItems[index];
    if (!item.type && item.title) {
      handleTabChange(item.title.toLowerCase());
    }
  };

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
    <div className="min-h-screen bg-background flex flex-col">
      <main className="flex-1 flex flex-col">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <div className="border-b sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-16 items-center">
              <ExpandableTabs
                tabs={navigationItems}
                activeColor="text-primary"
                onChange={handleNavigationChange}
                className="mr-4"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto pb-16">
            <TabsContent value="scan" className="h-full p-8">
              <div className="grid grid-cols-2 gap-8 h-[calc(100vh-200px)]">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-4xl font-bold text-center mb-2">
                      {t('scan.title')}
                    </CardTitle>
                    <CardDescription className="text-lg text-center text-gray-600">
                      {t('scan.description')}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
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
                                try {
                                  setUploadedImage(e.target?.result as string)
                                } catch (error: any) {
                                  console.error('Error loading image:', error)
                                  toast.error('Failed to load image. Please try again.')
                                }
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
                            // ... existing file upload logic ...
                          }
                          input.click()
                        }}
                      >
                        <Upload className="h-8 w-8 mr-3" />
                        {isScanning ? 'Processing...' : 'Upload Images'}
                      </Button>
                    </div>

                    {uploadedImage && (
                      <div className="mt-6">
                        <img src={uploadedImage} alt="Uploaded business card" className="w-full h-auto rounded-lg shadow-lg" />
                        <Button 
                          onClick={async () => {
                            // ... existing scan logic ...
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

                <Card className="flex flex-col">
                  <CardHeader>
                    <CardTitle className="text-4xl font-bold text-center mb-2">
                      AI Assistant
                    </CardTitle>
                    <CardDescription className="text-lg text-center text-gray-600">
                      Ask questions about your business cards and get instant answers
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1 p-0">
                    <ChatInterface />
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="manage" className="h-full p-8">
              <ManageCardsView setActiveTab={setActiveTab} />
            </TabsContent>

            <TabsContent value="network" className="h-full p-8">
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

            <TabsContent value="news" className="h-full p-8">
              <NewsView />
            </TabsContent>

            <TabsContent value="settings" className="h-full p-8">
              <SettingsTab />
            </TabsContent>
          </div>
        </Tabs>
      </main>
      <Footerdemo />
    </div>
  )
}