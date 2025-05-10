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
  Users, 
  LayoutGrid, 
  Edit2,
  Trash2,
  Mail,
  Bell,
  HelpCircle,
  Upload,
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
import imageCompression from 'browser-image-compression';
import { OrgChartView } from '@/components/org-chart/OrgChartView';
import { SubscriptionPage } from '@/components/subscription/SubscriptionPage';
import { Header } from "@/components/ui/header";

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

  const allTabs = [...navigationItems, { title: 'Pricing', icon: Star }];
  const handleNavigationChange = (index: number | null) => {
    if (index === null) return;
    const item = allTabs[index];
    if (!item.type && item.title) {
      handleTabChange(item.title.toLowerCase());
    }
  };

  // Compute selectedIndex from activeTab
  const selectedIndex = allTabs.findIndex(
    (tab) =>
      tab.type !== "separator" &&
      tab.title.toLowerCase() === activeTab.toLowerCase()
  );

  const [isYearly, setIsYearly] = useState(false)
  const [newsFilter, setNewsFilter] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCompany, setSelectedCompany] = useState<string>('')
  const [selectedArticle, setSelectedArticle] = useState<NewsArticle | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [orgChartViewMode, setOrgChartViewMode] = useState('tree')
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false)
  const { cards, loading, error, addCard, updateCard, deleteCard } = useBusinessCards()
  const { user, signOut } = useAuth()
  const [currentCardIndex, setCurrentCardIndex] = useState(0)
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>('');
  const [currentFileIndex, setCurrentFileIndex] = useState(0);
  const [totalFiles, setTotalFiles] = useState(0);
  const [progressPercent, setProgressPercent] = useState(0);

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
    // console.log('Edit card:', card)
  }

  const handleDelete = async (card: BusinessCard) => {
    try {
      await deleteCard(card.id)
    } catch (error) {
      // console.error('Error deleting card:', error)
    }
  }

  const handleDragEnd = (direction: 'left' | 'right') => {
    if (direction === 'left') {
      setCurrentCardIndex((prevIndex) => (prevIndex + 1) % filteredCards.length)
    } else if (direction === 'right') {
      setCurrentCardIndex((prevIndex) => (prevIndex - 1 + filteredCards.length) % filteredCards.length)
    }
  }

  const compressImage = async (file: File) => {
    // console.log('[DEBUG] Original file:', {
    //   size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
    //   type: file.type
    // });

    const options = {
      maxSizeMB: 1,
      maxWidthOrHeight: 1920,
      useWebWorker: true,
      fileType: 'image/jpeg'
    };

    try {
      const compressedFile = await imageCompression(file, options);
      // console.log('[DEBUG] Compressed file:', {
      //   size: `${(compressedFile.size / 1024 / 1024).toFixed(2)} MB`,
      //   type: compressedFile.type
      // });
      return compressedFile;
    } catch (error) {
      // console.error('[DEBUG] Compression error:', error);
      throw error;
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header
        logo={<span className="text-xl font-bold">BizCard</span>}
        menuItems={[
          { text: "Scan", to: "/" },
          { text: "Manage", to: "/?tab=manage" },
          { text: "Network", to: "/?tab=network" },
          { text: "News", to: "/?tab=news" },
          { text: "Settings", to: "/?tab=settings" },
          { text: "Pricing", to: "/?tab=pricing" },
        ]}
      />
      <main className="flex-1 flex flex-col">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
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
                        className="w-full py-6 text-lg font-semibold rounded-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
                        disabled={isUploading}
                        onClick={() => {
                          const input = document.createElement('input');
                          input.type = 'file';
                          input.accept = 'image/*';
                          input.multiple = true;
                          input.onchange = async (e) => {
                            const files = (e.target as HTMLInputElement).files;
                            if (files && files.length > 0) {
                              setIsUploading(true);
                              setTotalFiles(files.length);
                              setCurrentFileIndex(0);
                              setProgressPercent(0);
                              
                              // Process each file
                              for (let i = 0; i < files.length; i++) {
                                setCurrentFileIndex(i);
                                setProgressPercent((i / files.length) * 100);
                                const file = files[i];
                                try {
                                  setUploadProgress('Compressing image...');
                                  const compressedFile = await compressImage(file);
                                  
                                  setUploadProgress('Converting to base64...');
                                  
                                  // Debug file info
                                  // console.log('[DEBUG] File details:', {
                                  //   name: compressedFile.name,
                                  //   type: compressedFile.type,
                                  //   size: `${(compressedFile.size / 1024).toFixed(2)} KB`
                                  // });
                                  
                                  // Convert to base64
                                  const reader = new FileReader();
                                  const base64Promise = new Promise<string>((resolve, reject) => {
                                    reader.onload = () => {
                                      const result = reader.result as string;
                                      // console.log('[DEBUG] Base64 conversion:', {
                                      //   length: result.length,
                                      //   preview: result.substring(0, 50) + '...',
                                      //   isDataUrl: result.startsWith('data:')
                                      // });
                                      resolve(result);
                                    };
                                    reader.onerror = (error) => {
                                      // console.error('[DEBUG] FileReader error:', error);
                                      reject(error);
                                    };
                                  });
                                  reader.readAsDataURL(compressedFile);
                                  const base64 = await base64Promise;

                                  setUploadProgress('Authenticating...');
                                  // Get fresh session token
                                  const { data: { session: refreshedSession }, error: refreshError } = 
                                    await supabase.auth.refreshSession();
                                  
                                  if (refreshError || !refreshedSession) {
                                    // console.error('[DEBUG] Auth error:', refreshError);
                                    throw new Error('Authentication failed');
                                  }

                                  const accessToken = refreshedSession.access_token;

                                  // console.log('[DEBUG] Session data:', {
                                  //   hasSession: !!refreshedSession,
                                  //   userId: refreshedSession.user.id,
                                  //   tokenLength: accessToken.length,
                                  //   expiresAt: new Date(refreshedSession.expires_at! * 1000).toISOString()
                                  // });

                                  setUploadProgress('Processing card...');
                                  // Call scan API with auth token
                                  const response = await fetch('/api/scan', {
                                    method: 'POST',
                                    headers: {
                                      'Content-Type': 'application/json',
                                      'Authorization': `Bearer ${accessToken}`
                                    },
                                    body: JSON.stringify({ 
                                      image: base64,
                                      userId: refreshedSession.user.id,
                                      debug: true,
                                      options: {
                                        extractAllText: true,
                                        detectLanguage: true,
                                        enhancedChineseExtraction: true,
                                        ocrPrompt: `Extract all business card information from this image. Pay special attention to:
                                          1. Name in both English (鄧潔瑩) and Chinese if present
                                          2. Title in both languages (副總監 | 市務及傳訊部)
                                          3. Company name in both languages (太興環球發展有限公司 / TAI HING)
                                          4. Complete contact details:
                                             - Email (christina.tang@taihing.com)
                                             - Phone numbers (D: 3710 9802, M: 9288 3752)
                                             - Website (www.taihing.com)
                                          5. Full address in both languages
                                          6. Any additional identifiers or department information
                                          7. Look for text in both vertical and horizontal orientations
                                          8. Check for text in both purple and black colors`,
                                        textDetectionParams: {
                                          allowedRotations: [0, 90, 270, 180],
                                          detectOrientation: true,
                                          multipleLanguages: true,
                                          enhancedLayout: true,
                                          minConfidence: 60
                                        }
                                      }
                                    })
                                  });

                                  if (!response.ok) {
                                    const errorText = await response.text();
                                    // console.error('[DEBUG] API Error:', {
                                    //   status: response.status,
                                    //   statusText: response.statusText,
                                    //   headers: Object.fromEntries(response.headers.entries()),
                                    //   error: errorText
                                    // });
                                    throw new Error(`Failed to process image: ${errorText}`);
                                  }

                                  const result = await response.json();
                                  // console.log('[DEBUG] API Success:', result);
                                  toast.success(`Card ${i + 1} processed successfully`);
                                } catch (error: any) {
                                  // console.error('[DEBUG] Error details:', {
                                  //   message: error.message,
                                  //   stack: error.stack,
                                  //   name: error.name
                                  // });
                                  toast.error(`Failed to process card ${i + 1}: ${error.message}`);
                                }
                              }
                              setProgressPercent(100);
                              setIsUploading(false);
                              setUploadProgress('');
                              setCurrentFileIndex(0);
                              setTotalFiles(0);
                            }
                          };
                          input.click();
                        }}
                      >
                        {isUploading ? (
                          <div className="w-full space-y-2">
                            <div className="flex items-center justify-between text-sm text-white">
                              <span>{uploadProgress}</span>
                              <span>{currentFileIndex + 1} of {totalFiles}</span>
                            </div>
                            <div className="w-full bg-white/20 rounded-full h-2">
                              <div 
                                className="bg-white h-2 rounded-full transition-all duration-300 ease-in-out"
                                style={{ width: `${progressPercent}%` }}
                              />
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center">
                            <Upload className="h-8 w-8 mr-3" />
                            Upload Images
                          </div>
                        )}
                      </Button>

                      <Button 
                        variant="outline"
                        className="w-full py-6 text-lg font-semibold rounded-full border-2 hover:bg-gray-50"
                        disabled={isUploading}
                        onClick={() => {
                          const input = document.createElement('input');
                          input.type = 'file';
                          input.accept = 'image/*';
                          input.capture = 'environment';
                          input.onchange = async (e) => {
                            const files = (e.target as HTMLInputElement).files;
                            if (files && files.length > 0) {
                              setIsUploading(true);
                              setTotalFiles(1);
                              setCurrentFileIndex(0);
                              setProgressPercent(0);
                              
                              const file = files[0];
                              try {
                                setUploadProgress('Compressing image...');
                                setProgressPercent(10);
                                const compressedFile = await compressImage(file);
                                
                                setUploadProgress('Converting to base64...');
                                setProgressPercent(20);
                                
                                // Convert to base64
                                const reader = new FileReader();
                                const base64Promise = new Promise<string>((resolve, reject) => {
                                  reader.onload = () => resolve(reader.result as string);
                                  reader.onerror = reject;
                                });
                                reader.readAsDataURL(compressedFile);
                                const base64 = await base64Promise;

                                setUploadProgress('Authenticating...');
                                // Get fresh session token
                                const { data: { session: refreshedSession }, error: refreshError } = 
                                  await supabase.auth.refreshSession();
                                
                                if (refreshError || !refreshedSession) {
                                  // console.error('[DEBUG] Auth error:', refreshError);
                                  throw new Error('Authentication failed');
                                }

                                const accessToken = refreshedSession.access_token;

                                // console.log('[DEBUG] Session data:', {
                                //   hasSession: !!refreshedSession,
                                //   userId: refreshedSession.user.id,
                                //   tokenLength: accessToken.length,
                                //   expiresAt: new Date(refreshedSession.expires_at! * 1000).toISOString()
                                // });

                                setUploadProgress('Processing card...');
                                // Call scan API with auth token
                                const response = await fetch('/api/scan', {
                                  method: 'POST',
                                  headers: {
                                    'Content-Type': 'application/json',
                                    'Authorization': `Bearer ${accessToken}`
                                  },
                                  body: JSON.stringify({ 
                                    image: base64,
                                    userId: refreshedSession.user.id,
                                    debug: true,
                                    options: {
                                      extractAllText: true,
                                      detectLanguage: true,
                                      enhancedChineseExtraction: true,
                                      ocrPrompt: `Extract all business card information from this image. Pay special attention to:
                                        1. Name in both English (鄧潔瑩) and Chinese if present
                                        2. Title in both languages (副總監 | 市務及傳訊部)
                                        3. Company name in both languages (太興環球發展有限公司 / TAI HING)
                                        4. Complete contact details:
                                           - Email (christina.tang@taihing.com)
                                           - Phone numbers (D: 3710 9802, M: 9288 3752)
                                           - Website (www.taihing.com)
                                        5. Full address in both languages
                                        6. Any additional identifiers or department information
                                        7. Look for text in both vertical and horizontal orientations
                                        8. Check for text in both purple and black colors`,
                                      textDetectionParams: {
                                        allowedRotations: [0, 90, 270, 180],
                                        detectOrientation: true,
                                        multipleLanguages: true,
                                        enhancedLayout: true,
                                        minConfidence: 60
                                      }
                                    }
                                  })
                                });

                                if (!response.ok) {
                                  throw new Error('Failed to process image');
                                }

                                setProgressPercent(100);
                                const result = await response.json();
                                toast.success('Card processed successfully');
                              } catch (error: any) {
                                // console.error('Error processing file:', error);
                                toast.error('Failed to process card');
                              } finally {
                                setIsUploading(false);
                                setUploadProgress('');
                                setCurrentFileIndex(0);
                                setTotalFiles(0);
                                setProgressPercent(0);
                              }
                            }
                          };
                          input.click();
                        }}
                      >
                        {isUploading ? (
                          <div className="w-full space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span>{uploadProgress}</span>
                              <span>1 of 1</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-primary h-2 rounded-full transition-all duration-300 ease-in-out"
                                style={{ width: `${progressPercent}%` }}
                              />
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center">
                            <Camera className="h-8 w-8 mr-3" />
                            Take a Photo
                          </div>
                        )}
                      </Button>
                    </div>
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
              <OrgChartView />
            </TabsContent>

            <TabsContent value="news" className="h-full p-8">
              <NewsView />
            </TabsContent>

            <TabsContent value="settings" className="h-full p-8">
              <SettingsTab />
            </TabsContent>

            <TabsContent value="pricing" className="h-full p-8">
              <SubscriptionPage />
            </TabsContent>
          </div>
        </Tabs>
      </main>
      <Footerdemo />
    </div>
  )
}