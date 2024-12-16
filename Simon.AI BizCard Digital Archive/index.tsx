import React, { useState, useRef } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Check, ScanLine, LayoutList, Network, Newspaper, Star, Settings, Search, Camera, Upload, Trash2, Edit2, Bell, HelpCircle, LogOut, Mail, Users, Bookmark, X, LayoutGrid, ChevronDown, ChevronRight } from 'lucide-react'
import { motion, AnimatePresence, useMotionValue, useTransform, useAnimation } from 'framer-motion'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from "@/components/ui/select"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"

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

interface Contact {
  id: string
  name: string
  title: string
  company: string
  email: string
  reportsTo?: string
}

interface Company {
  id: string
  name: string
  contacts: Contact[]
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

const mockCompanies: Company[] = [
  {
    id: '1',
    name: 'Tech Innovations Inc.',
    contacts: [
      {
        id: '1',
        name: 'John Doe',
        title: 'CEO',
        company: 'Tech Innovations Inc.',
        email: 'john@tech.com'
      },
      {
        id: '2',
        name: 'Sarah Johnson',
        title: 'CTO',
        company: 'Tech Innovations Inc.',
        email: 'sarah@tech.com',
        reportsTo: '1'
      },
      {
        id: '3',
        name: 'Mike Wilson',
        title: 'Engineering Manager',
        company: 'Tech Innovations Inc.',
        email: 'mike@tech.com',
        reportsTo: '2'
      }
    ]
  },
  {
    id: '2',
    name: 'Design Solutions Co.',
    contacts: [
      {
        id: '4',
        name: 'Jane Smith',
        title: 'Creative Director',
        company: 'Design Solutions Co.',
        email: 'jane@design.com'
      },
      {
        id: '5',
        name: 'Tom Brown',
        title: 'Senior Designer',
        company: 'Design Solutions Co.',
        email: 'tom@design.com',
        reportsTo: '4'
      }
    ]
  }
]

const NewsItem = ({ article, onClick }: { article: NewsArticle; onClick: () => void }) => (
  <Card className="mb-6 cursor-pointer hover:shadow-md transition-shadow" onClick={onClick}>
    <CardContent className="p-6">
      <div className="grid md:grid-cols-[2fr,3fr] gap-6">
        <img 
          src={article.imageUrl} 
          alt="" 
          className="w-full h-48 object-cover rounded-lg"
        />
        <div className="space-y-3">
          <a href={article.url} className="text-xl font-semibold hover:underline block">{article.title}</a>
          <div className="text-sm text-muted-foreground">{article.source} • {article.date}</div>
          <p className="text-sm text-muted-foreground">{article.snippet}</p>
          <div className="flex flex-wrap gap-2">
            {article.relatedCompanies.map((company) => (
              <Badge key={company} variant="secondary" className="bg-blue-100 text-blue-800">
                {company}
              </Badge>
            ))}
            {article.relatedPeople.map((person) => (
              <Badge key={person} variant="outline" className="bg-green-100 text-green-800">
                {person}
              </Badge>
            ))}
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
)

const ArticleDetailView = ({ article, onClose }: { article: NewsArticle; onClose: () => void }) => (
  <Card className="fixed inset-0 z-50 overflow-auto bg-background/80 backdrop-blur-sm">
    <CardContent className="flex flex-col h-full p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">{article.title}</h2>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>
      <div className="flex-1 overflow-auto">
        <img src={article.imageUrl} alt="" className="w-full h-64 object-cover rounded-lg mb-4" />
        <div className="text-sm text-muted-foreground mb-2">{article.source} • {article.date}</div>
        <p className="text-lg mb-4">{article.snippet}</p>
        <div className="flex flex-wrap gap-2 mb-4">
          {article.relatedCompanies.map((company) => (
            <Badge key={company} variant="secondary" className="bg-blue-100 text-blue-800">
              {company}
            </Badge>
          ))}
          {article.relatedPeople.map((person) => (
            <Badge key={person} variant="outline" className="bg-green-100 text-green-800">
              {person}
            </Badge>
          ))}
        </div>
        <div className="flex gap-2">
          <Button asChild>
            <a href={article.url} target="_blank" rel="noopener noreferrer">Read Full Article</a>
          </Button>
          <Button variant="outline">Save Article</Button>
        </div>
      </div>
    </CardContent>
  </Card>
)

const OrgChartNode = ({ contact, subordinates, viewMode, onNodeClick }: { contact: Contact; subordinates: Contact[]; viewMode: string; onNodeClick: (contact: Contact) => void }) => {
  const [isExpanded, setIsExpanded] = useState(false)

  const getNodeSize = (title: string) => {
    if (title.toLowerCase().includes('ceo') || title.toLowerCase().includes('director')) return 'w-40 h-40'
    if (title.toLowerCase().includes('manager')) return 'w-32 h-32'
    return 'w-24 h-24'
  }

  const renderContent = () => (
    <div 
      className={`flex flex-col items-center justify-center text-center space-y-2 rounded-full bg-white border-2 border-primary cursor-pointer transition-all duration-300 hover:shadow-lg ${getNodeSize(contact.title)}`}
      onClick={() => onNodeClick(contact)}
    >
      <Avatar className="h-12 w-12">
        <AvatarFallback className="bg-primary/10">
          {contact.name.split(' ').map(n => n[0]).join('')}
        </AvatarFallback>
      </Avatar>
      <div className="space-y-1">
        <h3 className="font-semibold text-sm">{contact.name}</h3>
        <p className="text-xs text-muted-foreground">{contact.title}</p>
      </div>
    </div>
  )

  switch (viewMode) {
    case 'tree':
      return (
        <div className="flex flex-col items-center">
          {renderContent()}
          {subordinates.length > 0 && (
            <>
              <div className="w-px h-8 bg-border" />
              <div className="relative flex">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-px bg-border" />
                <div className="flex gap-4">
                  {subordinates.map((subordinate) => (
                    <div key={subordinate.id} className="flex flex-col items-center">
                      <div className="w-px h-8 bg-border" />
                      <OrgChartNode
                        contact={subordinate}
                        subordinates={getSubordinates(mockCompanies.find(c => c.name === contact.company)?.contacts || [], subordinate.id)}
                        viewMode={viewMode}
                        onNodeClick={onNodeClick}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      )
    case 'list':
      return (
        <div className="mb-4">
          <div className="flex items-center space-x-2 cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
            {subordinates.length > 0 && (isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />)}
            <span className="cursor-pointer hover:text-primary" onClick={(e) => { e.stopPropagation(); onNodeClick(contact); }}>{contact.name} - {contact.title}</span>
          </div>
          {isExpanded && subordinates.length > 0 && (
            <div className="ml-6 mt-2">
              {subordinates.map((subordinate) => (
                <OrgChartNode
                  key={subordinate.id}
                  contact={subordinate}
                  subordinates={getSubordinates(mockCompanies.find(c => c.name === contact.company)?.contacts || [], subordinate.id)}
                  viewMode={viewMode}
                  onNodeClick={onNodeClick}
                />
              ))}
            </div>
          )}
        </div>
      )
    case 'grid':
      return (
        <Card className="w-64 bg-white m-2">
          <CardContent className="p-4">
            {renderContent()}
          </CardContent>
        </Card>
      )
    case 'circle':
      return (
        <div className="relative">
          <div className="w-32 h-32 rounded-full bg-white border-2 border-primary flex items-center justify-center">
            <div className="text-center">
              <p className="font-semibold">{contact.name}</p>
              <p className="text-xs text-muted-foreground">{contact.title}</p>
            </div>
          </div>
          {subordinates.length > 0 && (
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-4">
              <div className="flex gap-4">
                {subordinates.map((subordinate) => (
                  <OrgChartNode
                    key={subordinate.id}
                    contact={subordinate}
                    subordinates={getSubordinates(mockCompanies.find(c => c.name === contact.company)?.contacts || [], subordinate.id)}
                    viewMode={viewMode}
                    onNodeClick={onNodeClick}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )
    case 'horizontal':
      return (
        <div className="flex items-center">
          <Card className="w-64 bg-white">
            <CardContent className="p-4">
              {renderContent()}
            </CardContent>
          </Card>
          {subordinates.length > 0 && (
            <div className="ml-4 flex flex-col gap-4">
              {subordinates.map((subordinate) => (
                <OrgChartNode
                  key={subordinate.id}
                  contact={subordinate}
                  subordinates={getSubordinates(mockCompanies.find(c => c.name === contact.company)?.contacts || [], subordinate.id)}
                  viewMode={viewMode}
                  onNodeClick={onNodeClick}
                />
              ))}
            </div>
          )}
        </div>
      )
    default:
      return null
  }
}

const ScanButton = ({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) => (
  <Button
    variant="outline"
    className="w-full justify-start rounded-full py-6 px-6 bg-white/80 backdrop-blur-sm hover:bg-white/90 transition-all duration-300 shadow-lg hover:shadow-xl"
    onClick={onClick}
  >
    {icon}
    <span className="ml-4 text-lg font-medium">{label}</span>
  </Button>
)


const CardItem = ({ card, onEdit, onDelete, viewMode, onDragEnd }: { card: Contact; onEdit: (card: Contact) => void; onDelete: (card: Contact) => void; viewMode: string; onDragEnd?: (direction: 'left' | 'right') => void }) => {
  const [emailContent, setEmailContent] = useState("")
  const [emailPurpose, setEmailPurpose] = useState("introduction")

  const generateEmail = () => {
    // In a real-world scenario, this would call an AI service
    const purposes = {
      introduction: `Dear ${card.name},\n\nI hope this email finds you well. I recently came across your profile and I'm impressed by your work at ${card.company}. I would love to connect and learn more about your experiences in the industry.\n\nBest regards,\n[Your Name]`,
      followUp: `Dear ${card.name},\n\nI wanted to follow up on our recent conversation about [topic]. I've given it some thought and I have a few ideas I'd like to discuss further.\n\nLooking forward to your response.\n\nBest regards,\n[Your Name]`,
      meeting: `Dear ${card.name},\n\nI hope this email finds you well. I would like to schedule a meeting to discuss [topic]. Would you be available for a 30-minute call next week?\n\nBest regards,\n[Your Name]`,
    }
    setEmailContent(purposes[emailPurpose as keyof typeof purposes])
  }

  const cardRef = useRef(null)
  const x = useMotionValue(0)
  const rotate = useTransform(x, [-200, 200], [-30, 30])
  const opacity = useTransform(x, [-200, -150, 0, 150, 200], [0, 1, 1, 1, 0])

  const handleDragEnd = (event: any, info: any) => {
    if (info.offset.x < -100) {
      onDragEnd && onDragEnd('left')
    } else if (info.offset.x > 100) {
      onDragEnd && onDragEnd('right')
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      <Card 
        className={`overflow-hidden transition-all duration-300 hover:shadow-lg ${viewMode === 'list' ? 'mb-4' : ''}`}
        {...(viewMode === 'stack' ? {
          ref: cardRef,
          style: { x, rotate, opacity },
          drag: 'x',
          dragConstraints: { left: 0, right: 0 },
          onDragEnd: handleDragEnd
        } : {})}
      >
        <CardContent className={`p-6 ${viewMode === 'grid' || viewMode === 'carousel' ? 'flex flex-col items-center text-center' : ''}`}>
          <div className={`flex ${viewMode === 'grid' || viewMode === 'carousel' ? 'flex-col' : 'items-start'} space-y-4 ${viewMode === 'list' ? 'space-x-4' : ''}`}>
            <Avatar className={`${viewMode === 'list' ? 'w-16 h-16' : 'w-20 h-20'}`}>
              <AvatarFallback className="text-2xl font-bold">{card.name[0]}</AvatarFallback>
            </Avatar>
            <div className={`flex-1 space-y-2 ${viewMode === 'grid' || viewMode === 'carousel' ? 'text-center' : ''}`}>
              <h3 className="text-xl font-semibold">{card.name}</h3>
              <p className="text-sm text-muted-foreground">{card.title}</p>
              <p className="text-sm font-medium">{card.company}</p>
              <div className="flex space-x-4 text-sm">
                <span>{card.email}</span>
              </div>
            </div>
            <div className={`flex ${viewMode === 'grid' || viewMode === 'carousel' ? 'justify-center mt-4' : 'space-x-2'}`}>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="icon">
                    <Mail className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Generate Email</DialogTitle>
                    <DialogDescription>
                      Use AI to generate an email for {card.name}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="purpose" className="text-right">
                        Purpose
                      </Label>
                      <Select value={emailPurpose} onValueChange={setEmailPurpose}>
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="Select purpose" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="introduction">Introduction</SelectItem>
                          <SelectItem value="followUp">Follow Up</SelectItem>
                          <SelectItem value="meeting">Schedule Meeting</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="email" className="text-right">
                        Email
                      </Label>
                      <Textarea
                        id="email"
                        value={emailContent}
                        onChange={(e) => setEmailContent(e.target.value)}
                        className="col-span-3 h-[200px]"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button onClick={generateEmail}>Generate Email</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              <Button variant="ghost" size="icon" onClick={() => onEdit(card)}>
                <Edit2 className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => onDelete(card)}>
                <Trash2 className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

const getSubordinates = (contacts: Contact[], managerId: string) => {
  return contacts.filter(contact => contact.reportsTo === managerId)
}

const BusinessCardDetail = ({ contact, onClose }: { contact: Contact; onClose: () => void }) => (
  <Dialog open={true} onOpenChange={onClose}>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{contact.name}</DialogTitle>
        <DialogDescription>{contact.title} at {contact.company}</DialogDescription>
      </DialogHeader>
      <div className="grid gap-4 py-4">
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="email" className="text-right">
            Email
          </Label>
          <Input id="email" value={contact.email} className="col-span-3" readOnly />
        </div>
        {/* Add more fields as needed */}
      </div>
      <DialogFooter>
        <Button onClick={onClose}>Close</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
)

export default function Component() {
  const [activeTab, setActiveTab] = useState('scan')
  const [isYearly, setIsYearly] = useState(false)
  const [newsFilter, setNewsFilter] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCompany, setSelectedCompany] = useState<string>('')
  const [isScanning, setIsScanning] = useState(false)
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [selectedArticle, setSelectedArticle] = useState<NewsArticle | null>(null)
  const [viewMode, setViewMode] = useState('list');
  const [orgChartViewMode, setOrgChartViewMode] = useState('tree');
  const totalContacts = mockCompanies.reduce((acc, company) => acc + company.contacts.length, 0)
  const selectedCompanyData = mockCompanies.find(c => c.id === selectedCompany)
  const [cards, setCards] = useState<Contact[]>(mockCompanies.flatMap(company => company.contacts))
  const [currentCardIndex, setCurrentCardIndex] = useState(0)
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null)

  const filteredCards = cards.filter(card => 
    card.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    card.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
    card.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setUploadedImage(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleScan = () => {
    setIsScanning(true)
    // Simulating OCR process
    setTimeout(() => {
      const newCard: Contact = {
        id: String(cards.length + 1),
        name: "New Contact",
        company: "New Company",
        title: "New Title",
        email: "new.contact@example.com",
      }
      setCards(prev => [newCard, ...prev])
      setIsScanning(false)
      setUploadedImage(null)
    }, 2000)
  }

  const handleEdit = (card: Contact) => {
    // Implement edit functionality
    console.log("Editing card:", card)
  }

  const handleDelete = (card: Contact) => {
    setCards(cards.filter(c => c.id !== card.id))
  }

  const getRootContact = (contacts: Contact[]) => {
    return contacts.find(contact => !contact.reportsTo)
  }


  const filteredNews = mockNewsArticles.filter(article => {
    if (searchTerm === '' && newsFilter === 'all') return true
    
    const searchLower = searchTerm.toLowerCase()
    const matchesSearch = article.title.toLowerCase().includes(searchLower) ||
      article.relatedCompanies.some(company => company.toLowerCase().includes(searchLower)) ||
      article.relatedPeople.some(person => person.toLowerCase().includes(searchLower))

    if (newsFilter.startsWith('company:')) {
      return article.relatedCompanies.includes(newsFilter.split(':')[1]) && matchesSearch
    } else if (newsFilter.startsWith('person:')) {
      return article.relatedPeople.includes(newsFilter.split(':')[1]) && matchesSearch
    }

    return matchesSearch
  })

  const handleDragEnd = (direction: 'left' | 'right') => {
    if (direction === 'left') {
      setCurrentCardIndex((prevIndex) => (prevIndex + 1) % filteredCards.length)
    } else if (direction === 'right') {
      setCurrentCardIndex((prevIndex) => (prevIndex - 1 + filteredCards.length) % filteredCards.length)
    }
  }

  const handleNodeClick = (contact: Contact) => {
    setSelectedContact(contact)
  }

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-purple-50 to-pink-50">
      <header className="bg-white shadow-sm py-6 px-8">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
          Simon.AI BizCard Digital Archive
        </h1>
      </header>

      <main className="flex-1 overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
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
                      <ScanButton
                        icon={<Camera className="h-8 w-8" />}
                        label="Take a Photo"
                        onClick={handleScan}
                      />
                      <ScanButton
                        icon={<Upload className="h-8 w-8" />}
                        label="Upload Image"
                        onClick={() => document.getElementById('file-upload')?.click()}
                      />
                    </div>
                  </div>
                </div>
                <input
                  id="file-upload"
                  type="file"
                  onChange={handleFileUpload}
                  accept="image/*"
                  className="hidden"
                />
                {uploadedImage && (
                  <div className="p-8">
                    <img src={uploadedImage} alt="Uploaded business card" className="w-full h-auto rounded-lg shadow-lg" />
                    <Button onClick={handleScan} className="mt-6 w-full py-6 text-lg font-semibold rounded-full transition-all duration-300 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                      <ScanLine className="mr-3 h-6 w-6" />
                      {isScanning ? 'Scanning...' : 'Scan Card'}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="manage" className="h-full p-8 overflow-auto">
            <Card>
              <CardHeader>
                <CardTitle className="text-3xl font-bold">Manage Business Cards</CardTitle>
                <CardDescription className="text-lg">View, edit, and organize your scanned business cards</CardDescription>
                <div className="flex items-center justify-between mt-4">
                  <div className="flex items-center space-x-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <Input
                        type="search"
                        placeholder="Search cards..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 py-2 text-sm rounded-md w-64"
                      />
                    </div>
                    <Select>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Filter" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Cards</SelectItem>
                        <SelectItem value="recent">Recently Added</SelectItem>
                        <SelectItem value="company">By Company</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={viewMode} onValueChange={setViewMode}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Select view" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="list">List</SelectItem>
                        <SelectItem value="grid">Grid</SelectItem>
                        <SelectItem value="carousel">Carousel</SelectItem>
                        <SelectItem value="stack">Stack</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => {
                        const modes = ['list', 'grid', 'carousel', 'stack'];
                        const currentIndex = modes.indexOf(viewMode);
                        const nextIndex = (currentIndex + 1) % modes.length;
                        setViewMode(modes[nextIndex]);
                      }}
                    >
                      {viewMode === 'list' && <LayoutList className="h-4 w-4" />}
                      {viewMode === 'grid' && <LayoutGrid className="h-4 w-4" />}
                      {viewMode === 'carousel' && <ScanLine className="h-4 w-4" />}
                      {viewMode === 'stack' && <Users className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[600px] pr-4">
                  <AnimatePresence>
                    {viewMode === 'grid' ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredCards.map((card) => (
                          <CardItem key={card.id} card={card} onEdit={handleEdit} onDelete={handleDelete} viewMode={viewMode} />
                        ))}
                      </div>
                    ) : viewMode === 'carousel' ? (
                      <div className="flex overflow-x-auto snap-x snap-mandatory py-4">
                        {filteredCards.map((card) => (
                          <div key={card.id} className="snap-center shrink-0 w-full sm:w-1/2 lg:w-1/3 px-2">
                            <CardItem card={card} onEdit={handleEdit} onDelete={handleDelete} viewMode={viewMode} />
                          </div>
                        ))}
                      </div>
                    ) : viewMode === 'stack' ? (
                      <div className="relative w-full max-w-md mx-auto h-[500px]">
                        {filteredCards.map((card, index) => (
                          <div
                            key={card.id}
                            className="absolute top-0 left-0 w-full transition-all duration-300 ease-in-out"
                            style={{
                              zIndex: filteredCards.length - Math.abs(index - currentCardIndex),
                              opacity: index === currentCardIndex ? 1 : 0.5,
                              pointerEvents: index === currentCardIndex ? 'auto' : 'none',
                            }}
                          >
                            <CardItem 
                              card={card} 
                              onEdit={handleEdit} 
                              onDelete={handleDelete} 
                              viewMode={viewMode}
                              onDragEnd={handleDragEnd}
                            />
                          </div>
                        ))}
                      </div>
                    ) : (
                      filteredCards.map((card) => (
                        <CardItem key={card.id} card={card} onEdit={handleEdit} onDelete={handleDelete} viewMode={viewMode} />
                      ))
                    )}
                  </AnimatePresence>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="news" className="h-full p-8 overflow-auto">
            <Card>
              <CardHeader>
                <CardTitle className="text-3xl font-bold">Related News</CardTitle>
                <CardDescription className="text-lg">
                  Stay updated with news about companies and people in your network
                </CardDescription>
                <div className="flex flex-col sm:flex-row gap-4 mt-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <Input
                      type="search"
                      placeholder="Search news..."
                      className="pl-10"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <Select value={newsFilter} onValueChange={setNewsFilter}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Filter by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All News</SelectItem>
                      <SelectGroup>
                        <SelectLabel>Companies</SelectLabel>
                        {Array.from(new Set(mockNewsArticles.flatMap(article => article.relatedCompanies))).map(company => (
                          <SelectItem key={company} value={`company:${company}`}>{company}</SelectItem>
                        ))}
                      </SelectGroup>
                      <SelectGroup>
                        <SelectLabel>People</SelectLabel>
                        {Array.from(new Set(mockNewsArticles.flatMap(article => article.relatedPeople))).map(person => (
                          <SelectItem key={person} value={`person:${person}`}>{person}</SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[600px] pr-4">
                  <AnimatePresence>
                    {filteredNews.map((article) => (
                      <motion.div
                        key={article.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                      >
                        <NewsItem article={article} onClick={() => setSelectedArticle(article)} />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </ScrollArea>
              </CardContent>
            </Card>
            {selectedArticle && (
              <ArticleDetailView
                article={selectedArticle}
                onClose={() => setSelectedArticle(null)}
              />
            )}
          </TabsContent>

          <TabsContent value="pro" className="h-full p-8 overflow-auto">
            <div className="max-w-5xl mx-auto">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold mb-4">Choose Your Plan</h2>
                <div className="flex items-center justify-center gap-4">
                  <span className={!isYearly ? "font-medium" : "text-muted-foreground"}>Monthly</span>
                  <Switch
                    checked={isYearly}
                    onCheckedChange={setIsYearly}
                  />
                  <span className={isYearly ? "font-medium" : "text-muted-foreground"}>
                    Yearly <span className="text-blue-600">(20% off)</span>
                  </span>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-2xl text-blue-600">Free Tier</CardTitle>
                    <div className="text-4xl font-bold">$0.00</div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      {[
                        "50/month business cards",
                        "Basic fields (name, company)",
                        "Basic categories",
                        "Basic, 2 filters max",
                        "1 device",
                        "CSV (10 contacts/export)",
                        "Email (48-hour response)",
                        "Name and company only search"
                      ].map((feature) => (
                        <div key={feature} className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-blue-600" />
                          <span className="text-sm">{feature}</span>
                        </div>
                      ))}
                    </div>
                    <Button className="w-full" variant="outline">
                      Current Plan
                    </Button>
                  </CardContent>
                </Card>

                <Card className="relative">
                  <div className="absolute -top-4 right-4">
                    <Badge className="bg-blue-600">Popular</Badge>
                  </div>
                  <CardHeader>
                    <CardTitle className="text-2xl text-blue-600">Pro</CardTitle>
                    <div className="text-4xl font-bold">
                      ${isYearly ? '95.88' : '9.99'}
                      <span className="text-base font-normal text-muted-foreground">
                        /{isYearly ? 'year' : 'month'}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      {[
                        "Unlimited business cards",
                        "Full extraction (address, title, notes)",
                        "Sub-industries, custom categories",
                        "Unlimited, advanced filtering",
                        "Multiple devices, unlimited storage",
                        "CSV, Excel, PDF, CRM integration",
                        "Priority, live chat (12-hour response)",
                        "Full-text search",
                        "Auto-generated charts",
                        "Up to 10 cards at once",
                        "Team Collaboration",
                        "Reminders & Alerts",
                        "AI-driven updates"
                      ].map((feature) => (
                        <div key={feature} className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-blue-600" />
                          <span className="text-sm">{feature}</span>
                        </div>
                      ))}
                    </div>
                    <Button className="w-full bg-blue-600 hover:bg-blue-700">
                      Upgrade Now
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
          <TabsContent value="orgchart" className="h-full p-8 overflow-auto">
            <div className="flex flex-col h-full space-y-8">
              <div>
                <h2 className="text-3xl font-bold">Org Chart AI</h2>
                <p className="text-muted-foreground">
                  Compact and expandable organization structure
                </p>
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
                    <div className="text-2xl font-bold">{mockCompanies.length}</div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Select a company</CardTitle>
                  <CardDescription>
                    Choose a company to view its organizational structure
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center mb-4">
                    <Select value={selectedCompany} onValueChange={setSelectedCompany}>
                      <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="Select a company" />
                      </SelectTrigger>
                      <SelectContent>
                        {mockCompanies.map((company) => (
                          <SelectItem key={company.id} value={company.id}>
                            {company.name} ({company.contacts.length} contacts)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={orgChartViewMode} onValueChange={setOrgChartViewMode}>
                      <SelectTrigger className="w-[150px]">
                        <SelectValue placeholder="View mode" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="tree">Tree</SelectItem>
                        <SelectItem value="list">List</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {selectedCompanyData && (
                <Card className="flex-1">
                  <CardHeader>
                    <CardTitle>{selectedCompanyData.name}</CardTitle>
                    <CardDescription>{selectedCompanyData.contacts.length} members</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[600px] w-full rounded-md border p-4">
                      <div className={`flex justify-center min-w-max p-8`}>
                        {getRootContact(selectedCompanyData.contacts) && (
                          <OrgChartNode
                            contact={getRootContact(selectedCompanyData.contacts)!}
                            subordinates={getSubordinates(selectedCompanyData.contacts, getRootContact(selectedCompanyData.contacts)!.id)}
                            viewMode={orgChartViewMode}
                            onNodeClick={handleNodeClick}
                          />
                        )}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="settings" className="h-full p-8 overflow-auto">
            <Card>
              <CardHeader>
                <CardTitle className="text-3xl font-bold">Settings</CardTitle>
                <CardDescription className="text-lg">Manage your account and application preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">Account</h3>
                  <div className="flex items-center space-x-4">
                    <Avatar className="h-16 w-16">
                      <AvatarFallback>JD</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">John Doe</p>
                      <p className="text-sm text-muted-foreground">john.doe@example.com</p>
                    </div>
                  </div>
                  <Button variant="outline">Edit Profile</Button>
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">Notifications</h3>
                  <div className="flex items-center space-x-2">
                    <Switch id="notifications" />
                    <Label htmlFor="notifications">Enable email notifications</Label>
                  </div>
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">Privacy</h3>
                  <div className="flex items-center space-x-2">
                    <Switch id="data-sharing" />
                    <Label htmlFor="data-sharing">Allow data sharing for improved AI suggestions</Label>
                  </div>
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">Help & Support</h3>
                  <Button variant="outline" className="w-full justify-start">
                    <HelpCircle className="mr-2 h-4 w-4" />
                    FAQs & Documentation
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Bell className="mr-2 h-4 w-4" />
                    Contact Support
                  </Button>
                </div>
                <div className="pt-6">
                  <Button variant="destructive" className="w-full">
                    <LogOut className="mr-2 h-4 w-4" />
                    Log Out
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      <footer className="bg-white border-t px-8 py-6">
        <div className="flex justify-around items-center">
          {[
            { icon: <ScanLine className="h-8 w-8 mb-2" />, label: "Scan", value: "scan" },
            { icon: <LayoutList className="h-8 w-8 mb-2" />, label: "Manage", value: "manage" },
            { icon: <Network className="h-8 w-8 mb-2" />, label: "Org Chart", value: "orgchart" },
            { icon: <Newspaper className="h-8 w-8 mb-2" />, label: "News", value: "news" },
            { icon: <Bookmark className="h-8 w-8 mb-2" />, label: "Saved", value: "saved-news" },
            { icon: <Star className="h-8 w-8 mb-2" />, label: "Pro", value: "pro" },
            { icon: <Settings className="h-8 w-8 mb-2" />, label: "Settings", value: "settings" },
          ].map((item) => (
            <Button
              key={item.value}
              variant="ghost"
              size="lg"
              className={`flex flex-col items-center ${activeTab === item.value ? 'text-primary' : ''}`}
              onClick={() => setActiveTab(item.value)}
            >
              {item.icon}
              <span className="text-sm font-medium">{item.label}</span>
            </Button>
          ))}
        </div>
      </footer>
      {selectedContact && (
        <BusinessCardDetail contact={selectedContact} onClose={() => setSelectedContact(null)} />
      )}
    </div>
  )
}
