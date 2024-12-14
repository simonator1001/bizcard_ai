import React, { useState, useRef, useEffect, useCallback } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Search, Filter, SortAsc, Layers, Download, Merge, Share, Trash2, Edit, Loader2, Star, ScanLine, LayoutList, Network, Newspaper, Settings, Upload, X } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import EnhancedProView from './enhanced-pro-view'
import SettingsTab from './settings-tab'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

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

interface NewsArticle {
  id: string
  title: string
  url: string
  publishedAt: string
  source: string
  summary: string
  companies: string[]
  industry: string
  thumbnailUrl: string
}

const mockData: BusinessCard[] = [
  { id: '1', name: 'John Doe', company: 'Tech Co', position: 'CEO', email: 'john@techco.com', phone: '123-456-7890', description: 'Innovative leader in the tech industry', imageUrl: '/placeholder.svg?height=200&width=400' },
  { id: '2', name: 'Jane Smith', company: 'Tech Co', position: 'CTO', email: 'jane@techco.com', phone: '098-765-4321', description: 'Visionary technologist', imageUrl: '/placeholder.svg?height=200&width=400', reportsTo: '1' },
  { id: '3', name: 'Bob Johnson', company: 'Tech Co', position: 'CMO', email: 'bob@techco.com', phone: '555-123-4567', description: 'Strategic marketer', imageUrl: '/placeholder.svg?height=200&width=400', reportsTo: '1' },
  { id: '4', name: 'Alice Brown', company: 'Finance Ltd', position: 'CEO', email: 'alice@financeltd.com', phone: '777-888-9999', description: 'Financial expert', imageUrl: '/placeholder.svg?height=200&width=400' },
  { id: '5', name: 'Charlie Green', company: 'Finance Ltd', position: 'CFO', email: 'charlie@financeltd.com', phone: '111-222-3333', description: 'Numbers wizard', imageUrl: '/placeholder.svg?height=200&width=400', reportsTo: '4' },
  { id: '6', name: 'Diana White', company: 'Health Corp', position: 'CEO', email: 'diana@healthcorp.com', phone: '444-555-6666', description: 'Healthcare innovator', imageUrl: '/placeholder.svg?height=200&width=400' },
]

const mockNewsData: NewsArticle[] = [
  {
    id: '1',
    title: 'Tech Co Announces Revolutionary AI Product',
    url: 'https://example.com/tech-co-ai-product',
    publishedAt: '2023-06-15T10:00:00Z',
    source: 'Tech News Daily',
    summary: 'Tech Co has unveiled a groundbreaking AI product that promises to revolutionize the industry...',
    companies: ['Tech Co'],
    industry: 'Technology',
    thumbnailUrl: '/placeholder.svg?height=100&width=100'
  },
  {
    id: '2',
    title: 'Finance Ltd Reports Record Q2 Earnings',
    url: 'https://example.com/finance-ltd-q2-earnings',
    publishedAt: '2023-06-14T14:30:00Z',
    source: 'Financial Times',
    summary: 'Finance Ltd has reported record-breaking earnings for the second quarter, exceeding analyst expectations...',
    companies: ['Finance Ltd'],
    industry: 'Finance',
    thumbnailUrl: '/placeholder.svg?height=100&width=100'
  },
  {
    id: '3',
    title: 'Health Corp Partners with Leading Research Institute',
    url: 'https://example.com/health-corp-partnership',
    publishedAt: '2023-06-13T09:15:00Z',
    source: 'Health News Network',
    summary: 'Health Corp has announced a strategic partnership with a leading research institute to advance medical breakthroughs...',
    companies: ['Health Corp'],
    industry: 'Healthcare',
    thumbnailUrl: '/placeholder.svg?height=100&width=100'
  }
]

const CardDetailView = ({ card, onClose, onEdit, onDelete }: { card: BusinessCard; onClose: () => void; onEdit: (updatedCard: BusinessCard) => void; onDelete: (id: string) => void }) => {
  const [editedCard, setEditedCard] = useState(card)
  const [isEditing, setIsEditing] = useState(false)
  const [isImageEnlarged, setIsImageEnlarged] = useState(false)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setEditedCard(prev => ({ ...prev, [name]: value }))
  }

  const handleSave = () => {
    onEdit(editedCard)
    setIsEditing(false)
  }

  const handleShare = () => {
    console.log('Sharing card:', editedCard)
  }

  const handleDownload = () => {
    console.log('Downloading image:', editedCard.imageUrl)
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Business Card Details</DialogTitle>
          <DialogDescription>View and edit business card information</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="relative">
            <img
              src={editedCard.imageUrl}
              alt={`${editedCard.name}'s business card`}
              className={`w-full h-auto cursor-pointer transition-all ${isImageEnlarged ? 'scale-150' : ''}`}
              onClick={() => setIsImageEnlarged(!isImageEnlarged)}
            />
            <Button
              size="icon"
              variant="secondary"
              className="absolute top-2 right-2"
              onClick={handleDownload}
            >
              <Download className="h-4 w-4" />
            </Button>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Name
            </Label>
            <Input
              id="name"
              name="name"
              value={editedCard.name}
              onChange={handleInputChange}
              className="col-span-3"
              readOnly={!isEditing}
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="company" className="text-right">
              Company
            </Label>
            <Input
              id="company"
              name="company"
              value={editedCard.company}
              onChange={handleInputChange}
              className="col-span-3"
              readOnly={!isEditing}
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="position" className="text-right">
              Position
            </Label>
            <Input
              id="position"
              name="position"
              value={editedCard.position}
              onChange={handleInputChange}
              className="col-span-3"
              readOnly={!isEditing}
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="email" className="text-right">
              Email
            </Label>
            <Input
              id="email"
              name="email"
              value={editedCard.email}
              onChange={handleInputChange}
              className="col-span-3"
              readOnly={!isEditing}
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="phone" className="text-right">
              Phone
            </Label>
            <Input
              id="phone"
              name="phone"
              value={editedCard.phone}
              onChange={handleInputChange}
              className="col-span-3"
              readOnly={!isEditing}
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="description" className="text-right">
              Description
            </Label>
            <Textarea
              id="description"
              name="description"
              value={editedCard.description}
              onChange={handleInputChange}
              className="col-span-3"
              readOnly={!isEditing}
            />
          </div>
        </div>
        <DialogFooter className="flex justify-between">
          <div>
            <Button variant="outline" size="icon" onClick={() => setIsEditing(!isEditing)} className="mr-2">
              <Edit className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={handleShare} className="mr-2">
              <Share className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={() => onDelete(editedCard.id)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
          {isEditing && <Button type="submit" onClick={handleSave}>Save changes</Button>}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

const GridView = ({ data, onCardClick }: { data: BusinessCard[]; onCardClick: (card: BusinessCard) => void }) => {
  return (
    <ScrollArea className="h-[calc(100vh-280px)]">
      <motion.div 
        className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 p-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {data.map((card) => (
          <motion.div
            key={card.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card key={card.id} className="bg-white shadow-md transition-all duration-300 transform hover:scale-105 hover:shadow-xl cursor-pointer hover:bg-gray-50" onClick={() => onCardClick(card)}>
              <CardContent className="p-6 flex flex-col space-y-2">
                <h2 className="text-2xl font-bold text-gray-800 leading-tight">{card.name}</h2>
                <div className="space-y-1">
                  <p className="text-lg text-gray-600">{card.position}</p>
                  <p className="text-base text-gray-500">{card.company}</p>
                </div>
                <div className="pt-2 space-y-1">
                  <p className="text-sm text-gray-600">{card.email}</p>
                  <p className="text-sm text-gray-600">{card.phone}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>
    </ScrollArea>
  )
}

const getSubordinates = (managerId: string, cards: BusinessCard[]): BusinessCard[] => {
  return cards.filter(card => card.reportsTo === managerId)
}

const OrgChartNode = ({ contact, subordinates, onNodeClick, allCards }: { contact: BusinessCard; subordinates: BusinessCard[]; onNodeClick: (contact: BusinessCard) => void; allCards: BusinessCard[] }) => {
  return (
    <motion.div 
      className="flex flex-col items-center"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div
        whileHover={{ scale: 1.02, backgroundColor: 'rgba(255, 255, 255, 0.8)' }}
        className="w-64 bg-white rounded-xl shadow-sm cursor-pointer transition-all duration-300"
        style={{ 
          background: 'linear-gradient(145deg, #f5f7fa 0%, #e4e7eb 100%)',
        }}
        onClick={() => onNodeClick(contact)}
      >
        <div className="p-4 flex flex-col items-center">
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="relative mb-3"
          >
            <Avatar className="h-20 w-20">
              <AvatarImage src={contact.imageUrl} alt={contact.name} />
              <AvatarFallback className="bg-gray-100 text-gray-600 text-xl font-semibold">
                {contact.name.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <motion.div
              className="absolute inset-0 rounded-full border-2 border-primary"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3 }}
            />
          </motion.div>
          <h3 className="text-lg font-semibold text-gray-800 text-center">{contact.name}</h3>
          <p className="text-sm text-gray-600 text-center">{contact.position}</p>
          <p className="text-xs text-gray-500 text-center mt-1">{contact.email}</p>
        </div>
      </motion.div>
      {subordinates.length > 0 && (
        <motion.div 
          className="mt-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <div className="w-px h-8 bg-gray-200" />
          <div className="relative flex">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-px bg-gray-200" />
            <div className="flex gap-8">
              {subordinates.map((subordinate) => (
                <OrgChartNode
                  key={subordinate.id}
                  contact={subordinate}
                  subordinates={getSubordinates(subordinate.id, allCards)}
                  onNodeClick={onNodeClick}
                  allCards={allCards}
                />
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  )
}

const OrgChartView = ({ cards }: { cards: BusinessCard[] }) => {
  const [selectedCompany, setSelectedCompany] = useState<string | null>(null)

  const companies = Array.from(new Set(cards.map(card => card.company)))

  const getRootNode = (company: string, cards: BusinessCard[]): BusinessCard | undefined => {
    return cards.find(card => card.company === company && !card.reportsTo)
  }

  const handleNodeClick = (contact: BusinessCard) => {
    console.log("Clicked:", contact)
  }

  return (
    <ScrollArea className="h-[calc(100vh-280px)]">
      <motion.div 
        className="p-8 relative"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="max-w-4xl mx-auto">
          <motion.div 
            className="mb-8"
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <Label htmlFor="company-select" className="text-lg font-semibold mb-2 block">Select a Company</Label>
            <Select onValueChange={(value) => setSelectedCompany(value)}>
              <SelectTrigger id="company-select" className="w-full md:w-[280px]">
                <SelectValue placeholder="Choose a company" />
              </SelectTrigger>
              <SelectContent>
                {companies.map((company) => (
                  <SelectItem key={company} value={company}>
                    {company}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </motion.div>
          <AnimatePresence>
            {selectedCompany ? (
              <motion.div 
                key="org-chart"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
                className="flex justify-center"
              >
                <OrgChartNode
                  contact={getRootNode(selectedCompany, cards)!}
                  subordinates={getSubordinates(getRootNode(selectedCompany, cards)!.id, cards)}
                  onNodeClick={handleNodeClick}
                  allCards={cards}
                />
              </motion.div>
            ) : (
              <motion.div
                key="placeholder"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
                className="text-center text-gray-500 mt-12"
              >
                <ChevronDown className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p className="text-lg">Select a company to view its organization chart</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </ScrollArea>
  )
}

const NewsView = ({ cards, onUpgradeToPro }: { cards: BusinessCard[]; onUpgradeToPro: () => void }) => {
  const [newsArticles, setNewsArticles] = useState<NewsArticle[]>(mockNewsData)
  const [loading, setLoading] = useState(false)
  const [selectedCompany, setSelectedCompany] = useState<string | null>(null)
  const [selectedIndustry, setSelectedIndustry] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [cachedArticles, setCachedArticles] = useState<NewsArticle[]>([])

  const companies = Array.from(new Set(cards.map(card => card.company)))
  const industries = Array.from(new Set(mockNewsData.map(article => article.industry)))

  const filteredArticles = newsArticles.filter(article => 
    (selectedCompany === 'all' || !selectedCompany || article.companies.includes(selectedCompany)) &&
    (selectedIndustry === 'all' || !selectedIndustry || article.industry === selectedIndustry) &&
    (searchTerm === '' || article.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
     article.summary.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const fetchMoreArticles = useCallback(() => {
    setLoading(true)
    // Simulate API call with setTimeout
    setTimeout(() => {
      const newArticles = [...mockNewsData]
      setNewsArticles(prevArticles => [...prevArticles, ...newArticles])
      setCachedArticles(prevCached => [...prevCached, ...newArticles])
      setLoading(false)
    }, 1000)
  }, [])

  useEffect(() => {
    if (cachedArticles.length === 0) {
      fetchMoreArticles()
    } else {
      setNewsArticles(cachedArticles)
    }
  }, [fetchMoreArticles, cachedArticles])

  useEffect(() => {
    const handleScroll = () => {
      if (window.innerHeight + document.documentElement.scrollTop !== document.documentElement.offsetHeight) return
      fetchMoreArticles()
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [fetchMoreArticles])

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-3xl font-bold">Latest News</CardTitle>
        <CardDescription className="text-lg">Stay updated with the latest news about companies in your network</CardDescription>
        <div className="flex flex-wrap gap-4 mt-4">
          <Select value={selectedCompany || undefined} onValueChange={setSelectedCompany}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filter by company" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Companies</SelectItem>
              {companies.map(company => (
                <SelectItem key={company} value={company}>{company}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedIndustry || undefined} onValueChange={setSelectedIndustry}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filter by industry" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Industries</SelectItem>
              {industries.map(industry => (
                <SelectItem key={industry} value={industry}>{industry}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <Input
              type="search"
              placeholder="Search articles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 py-2 text-sm rounded-md w-full"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[calc(100vh-320px)]">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredArticles.map(article => (
              <Card key={article.id} className="flex flex-col">
                <CardHeader className="pb-4">
                  <div className="flex items-start space-x-4">
                    <img src={article.thumbnailUrl} alt={article.title} className="w-20 h-20 object-cover rounded-md" />
                    <div>
                      <CardTitle className="text-xl font-semibold">{article.title}</CardTitle>
                      <CardDescription>{new Date(article.publishedAt).toLocaleDateString()} - {article.source}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex-grow">
                  <p className="text-sm text-gray-600">{article.summary}</p>
                </CardContent>
                <CardFooter className="flex justify-between items-center">
                  <div className="flex space-x-2">
                    {article.companies.map(company => (
                      <span key={company} className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full">{company}</span>
                    ))}
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <a href={article.url} target="_blank" rel="noopener noreferrer">Read More</a>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
          {loading && (
            <div className="flex justify-center items-center mt-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}
        </ScrollArea>
      </CardContent>
      <CardFooter className="flex justify-center mt-4">
        <Button onClick={onUpgradeToPro} className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white">
          <Star className="mr-2 h-4 w-4" /> Upgrade to Pro for More Features
        </Button>
      </CardFooter>
    </Card>
  )
}

const ScanPage = ({ onAddCard }: { onAddCard: (card: BusinessCard) => void }) => {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [extractedInfo, setExtractedInfo] = useState<Partial<BusinessCard> | null>(null)
  const [showTooltip, setShowTooltip] = useState(true)
  const [processingStatus, setProcessingStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreview(reader.result as string)
      }
      reader.readAsDataURL(selectedFile)
    }
  }

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    const droppedFile = event.dataTransfer.files[0]
    if (droppedFile) {
      setFile(droppedFile)
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreview(reader.result as string)
      }
      reader.readAsDataURL(droppedFile)
    }
  }

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
  }

  const processImage = () => {
    setIsProcessing(true)
    // Simulate OCR processing
    setTimeout(() => {
      setExtractedInfo({
        id: Date.now().toString(),
        name: 'John Doe',
        company: 'Tech Solutions Inc.',
        position: 'Software Engineer',
        email: 'john.doe@techsolutions.com',
        phone: '(123) 456-7890',
        description: 'Experienced software engineer specializing in AI and machine learning.',
        imageUrl: preview || '/placeholder.svg?height=200&width=400'
      })
      setIsProcessing(false)
      setProcessingStatus('success')
      setTimeout(() => setProcessingStatus('idle'), 3000)
    }, 2000)
  }

  const handleSave = () => {
    if (extractedInfo) {
      onAddCard(extractedInfo as BusinessCard)
      setFile(null)
      setPreview(null)
      setExtractedInfo(null)
    }
  }

  const handleClear = () => {
    setFile(null)
    setPreview(null)
    setExtractedInfo(null)
    setProcessingStatus('idle')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  useEffect(() => {
    const hasSeenTooltip = localStorage.getItem('hasSeenScanTooltip')
    if (!hasSeenTooltip) {
      setShowTooltip(true)
      localStorage.setItem('hasSeenScanTooltip', 'true')
    } else {
      setShowTooltip(false)
    }
  }, [])

  return (
    <ScrollArea className="h-[calc(100vh-280px)]">
      <div className="p-8 flex items-center justify-center min-h-[calc(100vh-280px)]">
        <Card className="w-full max-w-xl">
          <CardHeader>
            <CardTitle className="text-4xl font-bold text-center mb-2">Scan Business Card</CardTitle>
            <CardDescription className="text-lg text-center text-gray-600">
              Upload an image of a business card to extract information
            </CardDescription>
          </CardHeader>
          <CardContent>
            <motion.div
              className="relative"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div
                className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center cursor-pointer hover:border-primary transition-all duration-300 bg-gray-50"
                onClick={() => fileInputRef.current?.click()}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                style={{ 
                  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                  transition: 'all 0.3s ease'
                }}
              >
                {preview ? (
                  <div className="relative">
                    <img src={preview} alt="Business Card Preview" className="max-w-full h-auto mx-auto rounded-md" />
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleClear()
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Upload className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                    <p className="text-lg font-semibold text-gray-700">Click or drag and drop to upload a business card image</p>
                  </motion.div>
                )}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  className="hidden"
                />
              </div>
              {showTooltip && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-black text-white p-2 rounded text-sm"
                >
                  Tip: You can drag and drop an image file here, or click the zone to select a file.
                  <button 
                    className="ml-2 text-xs underline"
                    onClick={() => setShowTooltip(false)}
                  >
                    Dismiss
                  </button>
                </motion.div>
              )}
            </motion.div>
            {file && !extractedInfo && (
              <Button 
                className="mt-6 w-full" 
                onClick={processImage} 
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </motion.div>
                ) : (
                  'Extract Information'
                )}
              </Button>
            )}
            <AnimatePresence>
              {processingStatus === 'success' && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mt-4 p-2 bg-green-100 text-green-800 rounded-md text-center"
                >
                  Card successfully added!
                </motion.div>
              )}
              {processingStatus === 'error' && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mt-4 p-2 bg-red-100 text-red-800 rounded-md text-center"
                >
                  Unable to process card. Please try again.
                </motion.div>
              )}
            </AnimatePresence>
            {extractedInfo && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="mt-8"
              >
                <h3 className="text-xl font-semibold mb-4">Extracted Information</h3>
                <div className="space-y-4">
                  {Object.entries(extractedInfo).map(([key, value]) => {
                    if (key !== 'id' && key !== 'imageUrl') {
                      return (
                        <div key={key} className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor={key} className="text-right capitalize">
                            {key}
                          </Label>
                          <Input
                            id={key}
                            value={value as string}
                            onChange={(e) => setExtractedInfo({ ...extractedInfo, [key]: e.target.value })}
                            className="col-span-3"
                          />
                        </div>
                      )
                    }
                    return null
                  })}
                </div>
                <Button className="mt-6 w-full" onClick={handleSave}>
                  Save Business Card
                </Button>
              </motion.div>
            )}
          </CardContent>
        </Card>
      </div>
    </ScrollArea>
  )
}

const Component = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [viewMode, setViewMode] = useState('grid')
  const [selectedCard, setSelectedCard] = useState<BusinessCard | null>(null)
  const [cards, setCards] = useState(mockData)
  const [activeView, setActiveView] = useState('manage')
  const [showTooltip, setShowTooltip] = useState(true)

  const filteredCards = cards.filter(card =>
    card.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    card.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
    card.position.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleCardClick = (card: BusinessCard) => {
    setSelectedCard(card)
  }

  const handleCardEdit = (updatedCard: BusinessCard) => {
    setCards(cards.map(card => card.id === updatedCard.id ? updatedCard : card))
  }

  const handleCardDelete = (id: string) => {
    setCards(cards.filter(card => card.id !== id))
  }

  const handleAddCard = (newCard: BusinessCard) => {
    setCards([...cards, newCard])
    setActiveView('manage')
  }

  const handleUpgradeToPro = () => {
    setActiveView('pro')
  }

  const renderView = () => {
    switch (viewMode) {
      case 'grid':
      default:
        return <GridView data={filteredCards} onCardClick={handleCardClick} />
    }
  }

  const renderActiveView = () => {
    switch (activeView) {
      case 'manage':
        return (
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
                    <SelectValue placeholder="Select view" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="grid">Grid</SelectItem>
                  </SelectContent>
                </Select>
                <div className="flex space-x-2">
                  <TooltipProvider delayDuration={300}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="outline" size="icon" className="icon-button">
                          <Filter className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Filter cards</p>
                      </TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="outline" size="icon" className="icon-button">
                          <SortAsc className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Sort cards</p>
                      </TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="outline" size="icon" className="icon-button">
                          <Merge className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Merge cards</p>
                      </TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="outline" size="icon" className="icon-button">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Remove duplicates</p>
                      </TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="outline" size="icon" className="icon-button">
                          <Download className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Download cards</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                {renderView()}
              </motion.div>
              {filteredCards.length === 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="bg-gray-100 rounded-lg p-8 text-center"
                >
                  <p className="text-gray-600 mb-4">No cards match your current search or filters.</p>
                  <Button onClick={() => {
                    setSearchTerm('');
                    // Reset other filters here
                  }}>
                    Clear Filters
                  </Button>
                </motion.div>
              )}
            </CardHeader>
          </Card>
        )
      case 'orgchart':
        return <OrgChartView cards={cards} />
      case 'news':
        return <NewsView cards={cards} onUpgradeToPro={handleUpgradeToPro} />
      case 'pro':
        return <EnhancedProView />
      case 'scan':
        return <ScanPage onAddCard={handleAddCard} />
      case 'settings':
        return <SettingsTab />
      default:
        return <div>View not implemented</div>
    }
  }

  useEffect(() => {
    const hasSeenTooltip = localStorage.getItem('hasSeenTooltip')
    if (!hasSeenTooltip) {
      setShowTooltip(true)
      localStorage.setItem('hasSeenTooltip', 'true')
    }
  }, [])

  useEffect(() => {
    document.body.classList.add('font-sans')
    const style = document.createElement('style')
    style.textContent = `
      .icon-button {
        transition: transform 0.2s ease-in-out;
      }
      .icon-button:hover {
        transform: scale(1.05);
      }
    `
    document.head.appendChild(style)
    return () => {
      document.head.removeChild(style)
    }
  }, [])

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <header className="bg-white border-b px-8 py-4">
        <h1 className="text-2xl font-bold text-primary">Digital Archive.ai</h1>
      </header>
      <main className="flex-1 overflow-auto p-8 pb-20 scroll-smooth">
        <div className="container mx-auto max-w-[calc(100vw-4rem)]">
          {renderActiveView()}
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
            {[
              { icon: <ScanLine className="h-6 w-6" />, label: "Scan", value: "scan" },
              { icon: <LayoutList className="h-6 w-6" />, label: "Manage", value: "manage" },
              { icon: <Network className="h-6 w-6" />, label: "Org Chart", value: "orgchart" },
              { icon: <Newspaper className="h-6 w-6" />, label: "News", value: "news" },
              { icon: <Star className="h-6 w-6" />, label: "Pro", value: "pro" },
              { icon: <Settings className="h-6 w-6" />, label: "Settings", value: "settings" },
            ].map((item) => (
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
          <p className="text-sm text-gray-600 mb-2">Welcome! Use the filters and sorting options to organize your business cards. Click on a card to view details.</p>
          <Button size="sm" onClick={() => setShowTooltip(false)}>Got it</Button>
        </div>
      )}
    </div>
  )
}
export default Component
