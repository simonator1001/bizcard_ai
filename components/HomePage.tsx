'use client'
import React, { useState, useRef, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { 
  ScanLine, 
  LayoutGrid, 
  Star, 
  Settings, 
  Camera, 
  Edit2,
  Trash2,
  Mail,
  Phone,
  HelpCircle,
  Upload,
  type LucideIcon
} from 'lucide-react'
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion'
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useBusinessCards } from '@/lib/hooks/useBusinessCards'
import { BusinessCard } from '@/types/business-card'
import { useRouter } from 'next/navigation'
import { ManageCardsView } from '@/components/cards/ManageCardsView'
import { SettingsTab } from '@/components/shared/SettingsTab'
import { toast } from 'sonner'
import { ExpandableTabs } from "@/components/ui/expandable-tabs"
import { Footerdemo } from "@/components/ui/footer-section"
import { useTranslation } from 'react-i18next'
import imageCompression from 'browser-image-compression';
import { SubscriptionPage } from '@/components/subscription/SubscriptionPage';
import { Header } from "@/components/ui/header";
import { OAuthCallback } from '@/components/auth/OAuthCallback';
import Image from 'next/image'

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
  { title: "Settings", icon: Settings },
  { title: "Pricing", icon: Star },
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
      className={`relative p-4 md:p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 bg-gradient-to-b from-white dark:from-gray-800 to-gray-50/50 dark:to-gray-900/50 backdrop-blur-sm transition-all duration-300 ${
        viewMode === 'grid' ? 'w-full' : 'w-full max-w-md'
      }`}
      tabIndex={0}
      role="button"
      aria-label={`Business card for ${card.name || card.name_zh}`}
    >
      <div className="flex flex-col sm:flex-row items-start gap-3 md:gap-4">
        <Avatar className="h-10 w-10 md:h-12 md:w-12 ring-2 ring-purple-100 flex-shrink-0">
          <AvatarFallback className="bg-gradient-to-br from-purple-600 to-pink-600 text-white">
            {card.name?.split(' ').map(n => n[0]).join('').toUpperCase() || '??'}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 space-y-2 min-w-0 w-full">
          <div className="flex items-start justify-between">
            <div className="min-w-0 pr-2">
              <h3 className="font-semibold text-base md:text-lg truncate">
                {card.name || card.name_zh}
                {card.name && card.name_zh && (
                  <span className="ml-2 text-xs md:text-sm text-gray-500 dark:text-gray-400">({card.name_zh})</span>
                )}
              </h3>
              <p className="text-xs md:text-sm text-gray-600 dark:text-gray-300 truncate">
                {card.title || card.title_zh}
                {card.title && card.title_zh && (
                  <span className="ml-2">({card.title_zh})</span>
                )}
              </p>
              <p className="text-xs md:text-sm font-medium text-gray-700 dark:text-gray-200 truncate">
                {card.company || card.company_zh}
                {card.company && card.company_zh && (
                  <span className="ml-2">({card.company_zh})</span>
                )}
              </p>
            </div>
            <div className="flex gap-1 flex-shrink-0">
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 md:h-8 md:w-8 text-gray-500 dark:text-gray-400 hover:text-purple-600"
                onClick={() => onEdit(card)}
                title="Edit card"
              >
                <Edit2 className="h-3 w-3 md:h-4 md:w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 md:h-8 md:w-8 text-gray-500 dark:text-gray-400 hover:text-red-600"
                onClick={() => onDelete(card)}
                title="Delete card"
              >
                <Trash2 className="h-3 w-3 md:h-4 md:w-4" />
              </Button>
            </div>
          </div>
          <div className="space-y-1">
            {card.email && (
              <p className="text-xs md:text-sm text-gray-600 dark:text-gray-300 flex items-center gap-1 md:gap-2">
                <Mail className="h-3 w-3 md:h-4 md:w-4 flex-shrink-0" />
                <a href={`mailto:${card.email}`} className="truncate hover:text-purple-600">
                  {card.email}
                </a>
              </p>
            )}
            {card.phone && (
              <p className="text-xs md:text-sm text-gray-600 dark:text-gray-300 flex items-center gap-1 md:gap-2">
                <Phone className="h-3 w-3 md:h-4 md:w-4 flex-shrink-0" />
                <a href={`tel:${card.phone}`} className="truncate hover:text-purple-600">
                  {card.phone}
                </a>
              </p>
            )}
            {(card.address || card.address_zh) && (
              <p className="text-xs md:text-sm text-gray-600 flex items-center gap-1 md:gap-2">
                <HelpCircle className="h-3 w-3 md:h-4 md:w-4 flex-shrink-0" />
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
    <></>
  )
}

export default function HomePage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('scan');
  const { t } = useTranslation();
  
  // Get the tab from URL parameters
  React.useEffect(() => {
    const tab = new URLSearchParams(window.location.search).get('tab');
    if (tab) {
      setActiveTab(tab);
    }
    
    // Handle auth error parameters if present
    const error = new URLSearchParams(window.location.search).get('error');
    const errorDescription = new URLSearchParams(window.location.search).get('error_description');
    if (error) {
      toast.error(errorDescription || error);
      // Remove the error parameters from the URL to avoid showing the error again on refresh
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  // Update URL when tab changes
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    router.push(`/?tab=${tab}`);
  };

  const selectedIndex = navigationItems.findIndex(
    (tab) =>
      tab.title && tab.title.toLowerCase() === activeTab.toLowerCase()
  );

  const [newsFilter, setNewsFilter] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false)
  const { cards, loading, error, addCard, updateCard, deleteCard, user } = useBusinessCards()
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

  const totalContacts = cards.length

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

  useEffect(() => {
    // Handle OAuth code if present in URL
    const handleOAuthCallback = async () => {
      try {
        const url = new URL(window.location.href);
        const code = url.searchParams.get('code');
        
        if (code) {
          console.log('[HomePage] Found OAuth code in URL, Supabase removed');
          // DISABLED: Supabase removed - exchangeCodeForSession not available
          // Clean up URL parameters
          window.history.replaceState({}, document.title, '/');
        }
      } catch (err) {
        console.error('[HomePage] Error handling OAuth callback:', err);
      }
    };
    
    handleOAuthCallback();
  }, []); // Run once on mount

  return (
    <div className="h-full bg-background">
      {(typeof window !== 'undefined' && (window.location.hash.includes('access_token=') || 
        window.location.search.includes('error='))) && (
        <OAuthCallback />
      )}
      
      <Header
        logo={<span className="text-xl font-bold">BizCard</span>}
        menuItems={[
          { text: "Scan", to: "/?tab=scan" },
          { text: "Manage", to: "/?tab=manage" },
          { text: "Settings", to: "/?tab=settings" },
          { text: "Pricing", to: "/?tab=pricing" },
        ]}
      />
      <main className="flex-1 flex flex-col">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <div className="flex-1 overflow-y-auto pb-16">
            <TabsContent value="scan" className="h-full p-4 md:p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 h-auto md:h-[calc(100vh-200px)]">
                <Card className="w-full">
                  <CardHeader>
                    <CardTitle className="text-2xl md:text-4xl font-bold text-center mb-2">
                      {t('scan.title')}
                    </CardTitle>
                    <CardDescription className="text-base md:text-lg text-center text-gray-600">
                      {t('scan.description')}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <Button 
                        className="w-full py-4 md:py-6 text-base md:text-lg font-semibold rounded-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
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
                                  // Use AppWrite user ID
                                  if (!user) {
                                    throw new Error('Please sign in to upload cards');
                                  }
                                  const userId = user.$id;

                                  // console.log('[DEBUG] Session data:', {
                                  //   hasSession: !!refreshedSession,
                                  //   userId: refreshedSession.user.id,
                                  //   tokenLength: accessToken.length,
                                  //   expiresAt: new Date(refreshedSession.expires_at! * 1000).toISOString()
                                  // });

                                  setUploadProgress('Processing card...');
                                  // Call scan API with AppWrite user ID
                                  const response = await fetch('/api/scan', {
                                    method: 'POST',
                                    headers: {
                                      'Content-Type': 'application/json',
                                    },
                                    body: JSON.stringify({ 
                                      image: base64,
                                      userId: userId,
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
                            <Upload className="h-5 w-5 md:h-8 md:w-8 mr-2 md:mr-3" />
                            Upload Images
                          </div>
                        )}
                      </Button>

                      <Button 
                        variant="outline"
                        className="w-full py-4 md:py-6 text-base md:text-lg font-semibold rounded-full border-2 hover:bg-gray-50"
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
                                if (!user) {
                                  throw new Error('Please sign in to upload cards');
                                }
                                const userId = user.$id;

                                // console.log('[DEBUG] Session data:', {
                                //   userId: userId,
                                //   tokenLength: accessToken.length,
                                //   expiresAt: new Date(refreshedSession.expires_at! * 1000).toISOString()
                                // });

                                setUploadProgress('Processing card...');
                                // Call scan API with AppWrite user ID
                                const response = await fetch('/api/scan', {
                                  method: 'POST',
                                  headers: {
                                    'Content-Type': 'application/json',
                                  },
                                  body: JSON.stringify({ 
                                    image: base64,
                                    userId: userId,
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
                            <Camera className="h-5 w-5 md:h-8 md:w-8 mr-2 md:mr-3" />
                            Take a Photo
                          </div>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card className="flex flex-col w-full">
                  <CardHeader>
                    <CardTitle className="text-2xl md:text-4xl font-bold text-center mb-2">
                      My Cards
                    </CardTitle>
                    <CardDescription className="text-base md:text-lg text-center text-gray-600">
                      {totalContacts} business cards scanned
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                      <p className="text-4xl font-bold text-purple-600">{totalContacts}</p>
                      <p className="text-gray-500 mt-2">Total Contacts</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="manage" className="h-full p-4 md:p-8">
              <ManageCardsView setActiveTab={setActiveTab} />
            </TabsContent>

            <TabsContent value="settings" className="h-full p-4 md:p-8">
              <SettingsTab />
            </TabsContent>

            <TabsContent value="pricing" className="h-full p-4 md:p-8">
              <SubscriptionPage />
            </TabsContent>
          </div>
        </Tabs>
      </main>
      <Footerdemo />
    </div>
  )
}
