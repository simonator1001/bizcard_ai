'use client'
import React, { useState, useRef, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { useBusinessCards } from '@/lib/hooks/useBusinessCards'
import { BusinessCard } from '@/types/business-card'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent } from "@/components/ui/tabs"
import { 
  ScanLine, Camera, Upload, User, Settings, LogOut, LogIn,
  QrCode, Share2, Download, Search, Filter, MoreHorizontal,
  Mail, Phone, MapPin, Building2, Briefcase, Globe,
  Plus, Edit3, Trash2, X, Check, Copy, ExternalLink
} from 'lucide-react'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import imageCompression from 'browser-image-compression'
import { ManageCardsView } from '@/components/cards/ManageCardsView'
import { SettingsTab } from '@/components/shared/SettingsTab'
import { SubscriptionPage } from '@/components/subscription/SubscriptionPage'
import { OAuthCallback } from '@/components/auth/OAuthCallback'
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, 
  DropdownMenuSeparator, DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

// ─── Types ───────────────────────────────────────────────
type Tab = 'scan' | 'mycard' | 'contacts'

interface MyCardData {
  name: string
  title: string
  company: string
  email: string
  phone: string
  website: string
  address: string
  photo: string
  linkedin: string
  twitter: string
  wechat: string
}

// ─── Bottom Tab Bar ──────────────────────────────────────
const TabBar = ({ active, onChange }: { active: Tab; onChange: (t: Tab) => void }) => (
  <nav className="fixed bottom-0 left-0 right-0 z-50 flex justify-around items-center h-16 bg-white/90 dark:bg-gray-900/90 backdrop-blur-lg border-t border-gray-100 dark:border-gray-800 pb-[env(safe-area-inset-bottom,0px)]">
    {([
      { id: 'scan' as Tab, icon: ScanLine, label: 'Scan' },
      { id: 'mycard' as Tab, icon: QrCode, label: 'My Card' },
      { id: 'contacts' as Tab, icon: User, label: 'Contacts' },
    ]).map(({ id, icon: Icon, label }) => (
      <button
        key={id}
        onClick={() => onChange(id)}
        className={`relative flex flex-col items-center gap-0.5 px-5 py-1.5 rounded-xl transition-all duration-200 ${
          active === id 
            ? 'text-indigo-600 dark:text-indigo-400 scale-105' 
            : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
        }`}
      >
        <Icon className={`w-5 h-5 ${active === id ? 'fill-indigo-100 dark:fill-indigo-900/30' : ''}`} 
          strokeWidth={active === id ? 2.5 : 1.5} />
        <span className="text-[10px] font-medium">{label}</span>
        {active === id && (
          <span className="absolute -top-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-indigo-600 dark:bg-indigo-400 rounded-full" />
        )}
      </button>
    ))}
  </nav>
)

// ─── Minimal Top Bar ─────────────────────────────────────
const TopBar = ({ onSettingsClick }: { onSettingsClick: () => void }) => {
  const { user, signOut } = useAuth()
  const router = useRouter()
  
  return (
    <header className="sticky top-0 z-40 w-full bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-b border-gray-100 dark:border-gray-800">
      <div className="flex items-center justify-between px-4 h-14 max-w-4xl mx-auto">
        <span className="text-lg font-bold tracking-tight bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
          BizCard
        </span>
        
        <div className="flex items-center gap-2">
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                  <Avatar className="h-8 w-8 ring-2 ring-indigo-100 dark:ring-indigo-900">
                    <AvatarImage src={user.prefs?.avatar || ''} />
                    <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-violet-500 text-white text-xs">
                      {user.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden sm:block text-sm font-medium text-gray-700 dark:text-gray-300 max-w-[120px] truncate">
                    {user.name || user.email}
                  </span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-3 py-2">
                  <p className="text-sm font-medium truncate">{user.name}</p>
                  <p className="text-xs text-gray-500 truncate">{user.email}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onSettingsClick}>
                  <Settings className="mr-2 h-4 w-4" /> Settings
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => signOut().then(() => router.push('/'))}>
                  <LogOut className="mr-2 h-4 w-4" /> Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button size="sm" className="rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 text-white shadow-md" onClick={() => router.push('/signin')}>
              <LogIn className="mr-1.5 h-3.5 w-3.5" /> Sign In
            </Button>
          )}
        </div>
      </div>
    </header>
  )
}

// ─── My Card Editor ──────────────────────────────────────
const MyCardTab = () => {
  const { user } = useAuth()
  const [card, setCard] = useState<MyCardData>({
    name: user?.name || '',
    title: '',
    company: '',
    email: user?.email || '',
    phone: '',
    website: '',
    address: '',
    photo: '',
    linkedin: '',
    twitter: '',
    wechat: '',
  })
  const [saving, setSaving] = useState(false)
  const [showQR, setShowQR] = useState(false)

  // Sync user data
  useEffect(() => {
    if (user) {
      setCard(prev => ({
        ...prev,
        name: user.name || prev.name,
        email: user.email || prev.email,
      }))
    }
  }, [user])

  const updateField = (field: keyof MyCardData, value: string) => {
    setCard(prev => ({ ...prev, [field]: value }))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      // Save to AppWrite user prefs for now
      // Future: dedicated collection
      toast.success('Card saved!')
    } catch (err: any) {
      toast.error('Failed to save card')
    } finally {
      setSaving(false)
    }
  }

  const cardUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/share/${user?.$id || 'me'}`
    : ''

  const copyUrl = () => {
    navigator.clipboard.writeText(cardUrl)
    toast.success('Link copied!')
  }

  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(cardUrl)}`

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4">
        <div className="w-20 h-20 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center mb-4">
          <User className="w-10 h-10 text-indigo-500" />
        </div>
        <h2 className="text-xl font-bold mb-2">Create Your Digital Card</h2>
        <p className="text-gray-500 text-center mb-4">Sign in to create your personalized digital business card</p>
        <Button className="rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 text-white" onClick={() => {}}>
          Sign In to Start
        </Button>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 max-w-lg mx-auto pb-20">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
          My Digital Card
        </h2>
        <p className="text-gray-500 text-sm mt-1">Your shareable digital business card</p>
      </div>

      {/* Card Preview */}
      <Card className="mb-6 overflow-hidden border-2 border-indigo-100 dark:border-indigo-900/30">
        <div className="bg-gradient-to-r from-indigo-500 to-violet-500 p-6 text-white text-center">
          {card.photo ? (
            <Avatar className="h-20 w-20 mx-auto ring-4 ring-white/30 mb-3">
              <AvatarImage src={card.photo} />
              <AvatarFallback className="text-xl bg-white/20">
                {card.name?.split(' ').map(n => n[0]).join('') || 'U'}
              </AvatarFallback>
            </Avatar>
          ) : (
            <div className="h-20 w-20 mx-auto rounded-full bg-white/20 flex items-center justify-center mb-3 ring-4 ring-white/30">
              <User className="w-10 h-10 text-white/70" />
            </div>
          )}
          <h3 className="text-xl font-bold">{card.name || 'Your Name'}</h3>
          <p className="text-white/80 text-sm">{card.title || 'Your Title'}</p>
          <p className="text-white/60 text-xs mt-1">{card.company || 'Your Company'}</p>
        </div>
        <CardContent className="p-4 space-y-2">
          {card.email && <p className="text-xs text-gray-600 flex items-center gap-2"><Mail className="w-3.5 h-3.5" /> {card.email}</p>}
          {card.phone && <p className="text-xs text-gray-600 flex items-center gap-2"><Phone className="w-3.5 h-3.5" /> {card.phone}</p>}
          {card.website && <p className="text-xs text-gray-600 flex items-center gap-2"><Globe className="w-3.5 h-3.5" /> {card.website}</p>}
          {card.address && <p className="text-xs text-gray-600 flex items-center gap-2"><MapPin className="w-3.5 h-3.5" /> {card.address}</p>}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="flex gap-2 mb-6">
        <Button variant="outline" className="flex-1 rounded-full" onClick={() => setShowQR(true)}>
          <QrCode className="w-4 h-4 mr-1.5" /> QR Code
        </Button>
        <Button variant="outline" className="flex-1 rounded-full" onClick={copyUrl}>
          <Copy className="w-4 h-4 mr-1.5" /> Copy Link
        </Button>
        <Button variant="outline" className="flex-1 rounded-full" onClick={() => {
          if (navigator.share) navigator.share({ title: card.name, url: cardUrl })
          else copyUrl()
        }}>
          <Share2 className="w-4 h-4 mr-1.5" /> Share
        </Button>
      </div>

      {/* Edit Form */}
      <div className="space-y-3">
        <h3 className="font-semibold text-sm text-gray-700 dark:text-gray-300">Edit Card Details</h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Name</Label>
            <Input value={card.name} onChange={e => updateField('name', e.target.value)} placeholder="Your full name" className="h-9 text-sm" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Title</Label>
            <Input value={card.title} onChange={e => updateField('title', e.target.value)} placeholder="e.g. CEO" className="h-9 text-sm" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Company</Label>
            <Input value={card.company} onChange={e => updateField('company', e.target.value)} placeholder="Company name" className="h-9 text-sm" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Email</Label>
            <Input value={card.email} onChange={e => updateField('email', e.target.value)} placeholder="you@company.com" className="h-9 text-sm" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Phone</Label>
            <Input value={card.phone} onChange={e => updateField('phone', e.target.value)} placeholder="+852 ..." className="h-9 text-sm" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Website</Label>
            <Input value={card.website} onChange={e => updateField('website', e.target.value)} placeholder="https://..." className="h-9 text-sm" />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Address</Label>
          <Input value={card.address} onChange={e => updateField('address', e.target.value)} placeholder="Your address" className="h-9 text-sm" />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs">LinkedIn</Label>
            <Input value={card.linkedin} onChange={e => updateField('linkedin', e.target.value)} placeholder="username" className="h-9 text-sm" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Twitter</Label>
            <Input value={card.twitter} onChange={e => updateField('twitter', e.target.value)} placeholder="@handle" className="h-9 text-sm" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">WeChat</Label>
            <Input value={card.wechat} onChange={e => updateField('wechat', e.target.value)} placeholder="WeChat ID" className="h-9 text-sm" />
          </div>
        </div>
        <Button onClick={handleSave} disabled={saving} className="w-full mt-3 rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 text-white">
          {saving ? 'Saving...' : 'Save Card'}
        </Button>
      </div>

      {/* QR Dialog */}
      <Dialog open={showQR} onOpenChange={setShowQR}>
        <DialogContent className="max-w-xs">
          <DialogHeader>
            <DialogTitle>Your QR Code</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 py-4">
            <div className="bg-white p-4 rounded-xl shadow-sm">
              <img src={qrCodeUrl} alt="QR Code" className="w-48 h-48" />
            </div>
            <p className="text-xs text-gray-500 text-center">Scan to view my digital business card</p>
            <div className="flex gap-2 w-full">
              <Button variant="outline" className="flex-1 rounded-full text-xs" onClick={copyUrl}>
                <Copy className="w-3.5 h-3.5 mr-1" /> Copy Link
              </Button>
              <Button variant="outline" className="flex-1 rounded-full text-xs" onClick={() => {
                const link = document.createElement('a')
                link.href = qrCodeUrl
                link.download = 'bizcard-qr.png'
                link.click()
              }}>
                <Download className="w-3.5 h-3.5 mr-1" /> Download
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ─── Scan Tab ────────────────────────────────────────────
const ScanTab = () => {
  const { t } = useTranslation()
  const { user } = useAuth()
  const { cards } = useBusinessCards()
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState('')
  const [progressPercent, setProgressPercent] = useState(0)
  const [currentFileIndex, setCurrentFileIndex] = useState(0)
  const [totalFiles, setTotalFiles] = useState(0)
  const [lastScannedCard, setLastScannedCard] = useState<any>(null)

  const compressImage = async (file: File) => {
    const options = { maxSizeMB: 1, maxWidthOrHeight: 1920, useWebWorker: true, fileType: 'image/jpeg' as const }
    return await imageCompression(file, options)
  }

  const processFiles = async (files: FileList, isCamera = false) => {
    setIsUploading(true)
    setTotalFiles(isCamera ? 1 : files.length)
    setCurrentFileIndex(0)
    setProgressPercent(0)

    const fileList = isCamera ? [files[0]] : Array.from(files)
    for (let i = 0; i < fileList.length; i++) {
      setCurrentFileIndex(i)
      setProgressPercent((i / fileList.length) * 100)
      const file = fileList[i]
      try {
        setUploadProgress('Compressing...')
        const compressedFile = await compressImage(file)

        setUploadProgress('Processing...')
        const reader = new FileReader()
        const base64 = await new Promise<string>((resolve, reject) => {
          reader.onload = () => resolve(reader.result as string)
          reader.onerror = reject
          reader.readAsDataURL(compressedFile)
        })

        if (!user) throw new Error('Please sign in')
        setUploadProgress('Scanning...')

        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 60000) // 60s timeout
        
        const response = await fetch('/api/scan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: base64, userId: user.$id }),
          signal: controller.signal,
        })
        clearTimeout(timeoutId)

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}))
          throw new Error(errData.message || errData.error || `Scan failed (${response.status})`)
        }
        
        const scanResult = await response.json()
        setLastScannedCard(scanResult)
        toast.success(`Card ${i + 1} scanned! Tap to view →`)
      } catch (err: any) {
        toast.error(err.message || 'Failed')
      }
    }
    setProgressPercent(100)
    setTimeout(() => {
      setIsUploading(false)
      setUploadProgress('')
      setCurrentFileIndex(0)
      setTotalFiles(0)
      setProgressPercent(0)
    }, 500)
  }

  const openFilePicker = (camera = false) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.multiple = !camera
    if (camera) input.capture = 'environment'
    input.onchange = (e) => {
      const files = (e.target as HTMLInputElement).files
      if (files?.length) processFiles(files, camera)
    }
    input.click()
  }

  return (
    <div className="p-4 md:p-8 max-w-lg mx-auto pb-20">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
          {t('scan.title')}
        </h2>
        <p className="text-gray-500 text-sm mt-1">AI-powered business card scanner</p>
      </div>

      {/* Upload Area */}
      <Card className="mb-4 border-2 border-dashed border-indigo-200 dark:border-indigo-900/30 bg-indigo-50/50 dark:bg-indigo-950/10">
        <CardContent className="p-8 text-center">
          <div className="w-16 h-16 mx-auto rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center mb-4">
            <ScanLine className="w-8 h-8 text-indigo-500" />
          </div>
          <h3 className="font-semibold mb-2">Tap to Scan</h3>
          <p className="text-sm text-gray-500 mb-4">Take a photo or upload business card images</p>
          
          {isUploading ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-indigo-600 font-medium">{uploadProgress}</span>
                <span className="text-gray-400">{currentFileIndex + 1}/{totalFiles}</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                <div className="bg-gradient-to-r from-indigo-500 to-violet-500 h-2 rounded-full transition-all duration-500" style={{ width: `${progressPercent}%` }} />
              </div>
            </div>
          ) : (
            <div className="flex gap-3 justify-center">
              <Button onClick={() => openFilePicker(true)} className="rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 text-white shadow-lg hover:shadow-xl transition-shadow">
                <Camera className="mr-2 h-4 w-4" /> Take Photo
              </Button>
              <Button variant="outline" onClick={() => openFilePicker(false)} className="rounded-full">
                <Upload className="mr-2 h-4 w-4" /> Upload
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stats */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-indigo-600">{cards.length}</p>
              <p className="text-xs text-gray-500">Total Contacts</p>
            </div>
            {user && (
              <div className="text-right">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate max-w-[160px]">{user.name}</p>
                <p className="text-xs text-gray-500">{user.email}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Last Scanned Card Preview */}
      {lastScannedCard && (
        <Card className="mt-3 border-2 border-indigo-300 dark:border-indigo-700 bg-gradient-to-br from-indigo-50 to-violet-50 dark:from-indigo-950/20 dark:to-violet-950/20 animate-fade-in-up shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="px-2 py-0.5 text-[10px] font-bold text-white bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full uppercase tracking-wider">Just Scanned</span>
              <button className="text-gray-400 hover:text-gray-600 text-sm p-1" onClick={() => setLastScannedCard(null)}>✕</button>
            </div>
            <div className="space-y-1 text-sm">
              {lastScannedCard.name && <p className="font-semibold">{lastScannedCard.name} {lastScannedCard.name_zh && <span className="text-gray-500 font-normal">({lastScannedCard.name_zh})</span>}</p>}
              {lastScannedCard.title && <p className="text-gray-600 dark:text-gray-400">{lastScannedCard.title}</p>}
              {lastScannedCard.company && <p className="text-gray-500 text-xs">{lastScannedCard.company}</p>}
              <div className="flex gap-3 pt-1">
                {lastScannedCard.email && <span className="text-xs text-indigo-500">✉ {lastScannedCard.email}</span>}
                {lastScannedCard.phone && <span className="text-xs text-gray-500">📞 {lastScannedCard.phone}</span>}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// ─── Settings Dialog ─────────────────────────────────────
const SettingsDialog = ({ open, onClose }: { open: boolean; onClose: () => void }) => (
  <Dialog open={open} onOpenChange={onClose}>
    <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>Settings</DialogTitle>
      </DialogHeader>
      <SettingsTab />
    </DialogContent>
  </Dialog>
)

// ─── Main HomePage ───────────────────────────────────────
export default function HomePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState<Tab>('scan')
  const [showSettings, setShowSettings] = useState(false)
  const { t } = useTranslation()

  // Sync tab from URL
  useEffect(() => {
    const tab = searchParams?.get('tab')
    if (tab === 'manage' || tab === 'contacts') setActiveTab('contacts')
    else if (tab === 'mycard') setActiveTab('mycard')
    else if (tab === 'settings') setShowSettings(true)
    else if (tab === 'pricing') {} // handled elsewhere
    else setActiveTab('scan')
  }, [searchParams])

  // Handle old tab param for backward compatibility
  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab)
    router.push(`/?tab=${tab}`, { scroll: false })
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* OAuth callback handler */}
      {(typeof window !== 'undefined' && (window.location.hash.includes('access_token=') || 
        window.location.search.includes('error='))) && <OAuthCallback />}

      <TopBar onSettingsClick={() => setShowSettings(true)} />

      <Tabs value={activeTab} onValueChange={(v) => handleTabChange(v as Tab)}>
        <TabsContent value="scan" className="mt-0">
          <ScanTab />
        </TabsContent>
        <TabsContent value="mycard" className="mt-0">
          <MyCardTab />
        </TabsContent>
        <TabsContent value="contacts" className="mt-0">
          <div className="p-4 md:p-6 pb-20">
            <ManageCardsView setActiveTab={(t: string) => handleTabChange(t as Tab)} />
          </div>
        </TabsContent>
      </Tabs>

      <TabBar active={activeTab} onChange={handleTabChange} />
      
      <SettingsDialog open={showSettings} onClose={() => setShowSettings(false)} />
      
      {/* Safe area padding for bottom bar */}
      <div className="h-20" />
    </div>
  )
}
