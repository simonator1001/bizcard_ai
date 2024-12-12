import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Search, Filter, SortAsc, Layers, Download, Merge, Share, Trash2, Edit, Edit2, X, Check, ScanLine, LayoutList, Grid, Network, Newspaper, Bookmark, Star, Settings, Camera, Upload, Loader2 } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { recognizeBusinessCard, preprocessImageForOCR } from '@/lib/ocr-service'
import { supabase, getAuthUser } from '@/lib/supabase-client'
import { BusinessCardDetails } from '@/components/BusinessCardDetails'
import { useAuth } from '@/lib/auth-context'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetFooter } from "@/components/ui/sheet"
import { Checkbox } from "@/components/ui/checkbox"

interface BusinessCard {
  id: string
  name: string
  nameZh?: string
  company?: string
  companyZh?: string
  title?: string
  titleZh?: string
  email?: string
  phone?: string
  address?: string
  addressZh?: string
  dateAdded?: string
  image_url?: string
  rawText?: string
  tags?: string[]
  reportsTo?: string
  department?: string
  mobile?: string
  wechat?: string
  linkedin?: string
  notes?: string
}

export default function Component() {
  const { user, signOut } = useAuth();
  const [cards, setCards] = useState<BusinessCard[]>([])
  const [uploadedImages, setUploadedImages] = useState<string[]>([])
  const [isScanning, setIsScanning] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [isSuggestingTags, setIsSuggestingTags] = useState(false)
  const [currentImageIndex, setCurrentImageIndex] = useState<number>(0)
  const [editingCard, setEditingCard] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('scan')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [viewMode, setViewMode] = useState('list')
  const [selectedCard, setSelectedCard] = useState<BusinessCard | null>(null)
  const [totalImages, setTotalImages] = useState<number>(0)
  const [sortField, setSortField] = useState<keyof BusinessCard>('dateAdded')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  const [showFilters, setShowFilters] = useState(false)

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    setTotalImages(files.length);
    setIsScanning(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setCurrentImageIndex(i + 1);

        try {
          // Load and optimize image
          const base64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target?.result as string);
            reader.onerror = () => reject(new Error(`Failed to read file ${file.name}`));
            reader.readAsDataURL(file);
          });

          // Upload to Supabase Storage
          const imageFile = await fetch(base64).then(res => res.blob());
          const fileName = `${user.id}/${Date.now()}-${file.name}`;
          
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('business-cards')
            .upload(fileName, imageFile, {
              contentType: 'image/jpeg',
              upsert: true
            });

          if (uploadError) throw uploadError;

          // Get public URL
          const { data: { publicUrl } } = supabase.storage
            .from('business-cards')
            .getPublicUrl(fileName);

          // Process with OCR
          const optimizedImage = await preprocessImageForOCR(base64);
          const result = await recognizeBusinessCard(optimizedImage);
          console.log('OCR Result:', result);

          // Save to database
          const { data: savedCard, error: dbError } = await supabase
            .from('business_cards')
            .insert({
              user_id: user.id,
              name: result.words_result.NAME_EN?.words || '',
              name_zh: result.words_result.NAME?.words || '',
              company: result.words_result.COMPANY_EN?.words || '',
              company_zh: result.words_result.COMPANY?.words || '',
              title: result.words_result.TITLE_EN?.words || '',
              title_zh: result.words_result.TITLE?.words || '',
              email: result.words_result.EMAIL?.words || '',
              phone: result.words_result.MOBILE?.words || '',
              address: result.words_result.ADDR_EN?.words || '',
              address_zh: result.words_result.ADDR?.words || '',
              image_url: publicUrl,
              raw_text: result.raw_text,
              created_at: new Date().toISOString()
            })
            .select()
            .single();

          if (dbError) throw dbError;

          // Update local state with the new card
          const newCard: BusinessCard = {
            id: savedCard.id,
            name: savedCard.name || '',
            nameZh: savedCard.name_zh || '',
            company: savedCard.company || '',
            companyZh: savedCard.company_zh || '',
            title: savedCard.title || '',
            titleZh: savedCard.title_zh || '',
            email: savedCard.email || '',
            phone: savedCard.phone || '',
            address: savedCard.address || '',
            addressZh: savedCard.address_zh || '',
            dateAdded: savedCard.created_at,
            image_url: savedCard.image_url,
            rawText: savedCard.raw_text
          };

          setCards(prevCards => [newCard, ...prevCards]);
          toast.success(`Processed card ${i + 1} successfully`);

        } catch (error) {
          console.error(`Error processing card ${i + 1}:`, error);
          toast.error(`Failed to process card ${i + 1}`);
        }
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Error processing images. Please try again.');
    } finally {
      setIsScanning(false);
      setUploadedImages([]);
      setCurrentImageIndex(0);
      setTotalImages(0);
    }
  };

  const handleCardClick = (card: BusinessCard) => {
    setSelectedCard(card);
  };

  const handleCardEdit = (updatedCard: BusinessCard) => {
    setCards(cards.map(card => card.id === updatedCard.id ? updatedCard : card));
  };

  const handleCardDelete = async (cardId: string) => {
    if (window.confirm('Are you sure you want to delete this card?')) {
      try {
        // Find the card to get its image URL
        const cardToDelete = cards.find(card => card.id === cardId);
        if (!cardToDelete) {
          throw new Error('Card not found');
        }

        // Extract the storage path from the image URL
        const imageUrl = cardToDelete.image_url;
        const storagePathMatch = imageUrl.match(/business-cards\/(.+)/);
        if (storagePathMatch) {
          const storagePath = storagePathMatch[1];
          
          // Delete the image from storage
          const { error: storageError } = await supabase.storage
            .from('business-cards')
            .remove([storagePath]);

          if (storageError) {
            console.error('Error deleting image:', storageError);
          }
        }

        // Delete from database
        const { error: dbError } = await supabase
          .from('business_cards')
          .delete()
          .eq('id', cardId);

        if (dbError) throw dbError;

        // Delete from local state
        setCards(prev => prev.filter(card => card.id !== cardId));
        toast.success('Card deleted successfully');
      } catch (error) {
        console.error('Error deleting card:', error);
        toast.error('Failed to delete card');
      }
    }
  };

  const loadCards = async () => {
    try {
      const user = await getAuthUser();
      if (!user) {
        console.error('No authenticated user found');
        return;
      }

      const { data: cards, error } = await supabase
        .from('business_cards')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (cards) {
        const formattedCards: BusinessCard[] = cards.map(card => ({
          id: card.id,
          name: card.name || '',
          nameZh: card.name_zh || undefined,
          company: card.company || '',
          companyZh: card.company_zh || undefined,
          title: card.title || '',
          titleZh: card.title_zh || undefined,
          email: card.email || '',
          phone: card.phone || '',
          address: card.address || undefined,
          addressZh: card.address_zh || undefined,
          dateAdded: card.created_at,
          image_url: card.image_url,
          rawText: card.raw_text
        }));

        setCards(formattedCards);
      }
    } catch (error) {
      console.error('Error loading cards:', error);
      toast.error('Failed to load business cards');
    }
  };

  useEffect(() => {
    loadCards();
  }, []);

  const filteredCards = useMemo(() => {
    return cards.filter(card => {
      if (!searchTerm) return true;
      
      const searchLower = searchTerm.toLowerCase();
      return (
        card.name?.toLowerCase().includes(searchLower) ||
        card.nameZh?.toLowerCase().includes(searchLower) ||
        card.company?.toLowerCase().includes(searchLower) ||
        card.companyZh?.toLowerCase().includes(searchLower) ||
        card.title?.toLowerCase().includes(searchLower) ||
        card.titleZh?.toLowerCase().includes(searchLower) ||
        card.email?.toLowerCase().includes(searchLower) ||
        card.phone?.toLowerCase().includes(searchLower)
      );
    });
  }, [cards, searchTerm]);

  const handleSort = () => {
    setSortDirection(current => current === 'asc' ? 'desc' : 'asc')
  }

  const handleDeduplicate = async () => {
    try {
      // Group cards by email
      const emailGroups = cards.reduce((groups: { [key: string]: BusinessCard[] }, card) => {
        if (card.email) {
          if (!groups[card.email]) {
            groups[card.email] = [];
          }
          groups[card.email].push(card);
        }
        return groups;
      }, {});

      // Find duplicates (emails with more than one card)
      const duplicates = Object.entries(emailGroups)
        .filter(([email, cards]) => cards.length > 1);

      if (duplicates.length === 0) {
        toast.success('No duplicate cards found');
        return;
      }

      // Keep the most recent card for each email
      for (const [email, dupeCards] of duplicates) {
        const sortedCards = dupeCards.sort((a, b) => 
          new Date(b.dateAdded || 0).getTime() - new Date(a.dateAdded || 0).getTime()
        );
        const [keep, ...remove] = sortedCards;

        // Delete duplicate cards from database
        for (const card of remove) {
          await handleCardDelete(card.id);
        }
      }

      toast.success(`Removed ${duplicates.length} duplicate cards`);
    } catch (error) {
      console.error('Error deduplicating cards:', error);
      toast.error('Failed to remove duplicates');
    }
  }

  const handleMerge = async () => {
    try {
      // Group cards by email domain
      const domainGroups = cards.reduce((groups: { [key: string]: BusinessCard[] }, card) => {
        if (card.email) {
          const domain = card.email.split('@')[1];
          if (!groups[domain]) {
            groups[domain] = [];
          }
          groups[domain].push(card);
        }
        return groups;
      }, {});

      // Find potential matches (same domain, similar names)
      let mergeCount = 0;
      for (const [domain, domainCards] of Object.entries(domainGroups)) {
        if (domainCards.length > 1) {
          // Group by similar names
          const nameGroups = domainCards.reduce((groups: { [key: string]: BusinessCard[] }, card) => {
            const normalizedName = card.name.toLowerCase().replace(/[^a-z]/g, '');
            if (!groups[normalizedName]) {
              groups[normalizedName] = [];
            }
            groups[normalizedName].push(card);
            return groups;
          }, {});

          // Merge cards with similar names
          for (const similarCards of Object.values(nameGroups)) {
            if (similarCards.length > 1) {
              const [primary, ...others] = similarCards;
              // Merge information
              const merged = { ...primary };
              for (const other of others) {
                merged.title = merged.title || other.title;
                merged.titleZh = merged.titleZh || other.titleZh;
                merged.company = merged.company || other.company;
                merged.companyZh = merged.companyZh || other.companyZh;
                merged.phone = merged.phone || other.phone;
                // Delete other cards
                await handleCardDelete(other.id);
              }
              // Update primary card with merged info
              await handleCardEdit(merged);
              mergeCount++;
            }
          }
        }
      }

      toast.success(`Merged ${mergeCount} similar cards`);
    } catch (error) {
      console.error('Error merging cards:', error);
      toast.error('Failed to merge similar cards');
    }
  }

  const handleExportCSV = () => {
    try {
      // Convert cards to CSV format
      const headers = ['Name', 'Name (Chinese)', 'Title', 'Title (Chinese)', 
        'Company', 'Company (Chinese)', 'Email', 'Phone', 'Address', 'Address (Chinese)'];
      
      const csvContent = [
        headers.join(','),
        ...cards.map(card => [
          card.name,
          card.nameZh || '',
          card.title || '',
          card.titleZh || '',
          card.company || '',
          card.companyZh || '',
          card.email || '',
          card.phone || '',
          card.address || '',
          card.addressZh || ''
        ].map(field => `"${field.replace(/"/g, '""')}"`).join(','))
      ].join('\n');

      // Create and trigger download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'business_cards.csv';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success('Downloaded CSV successfully');
    } catch (error) {
      console.error('Error exporting CSV:', error);
      toast.error('Failed to export CSV');
    }
  }

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-purple-50 to-pink-50">
      <main className="flex-1 overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-3">
            <TabsTrigger value="scan">Scan</TabsTrigger>
            <TabsTrigger value="manage">Manage</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
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
                        variant="outline"
                        className="w-full justify-start rounded-full py-6 px-6 bg-white/80 backdrop-blur-sm hover:bg-white/90 transition-all duration-300 shadow-lg hover:shadow-xl"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <Camera className="h-8 w-8" />
                        <span className="ml-4 text-lg font-medium">Take a Photo</span>
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full justify-start rounded-full py-6 px-6 bg-white/80 backdrop-blur-sm hover:bg-white/90 transition-all duration-300 shadow-lg hover:shadow-xl"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <Upload className="h-8 w-8" />
                        <span className="ml-4 text-lg font-medium">Upload Image</span>
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="manage" className="h-full p-8 overflow-auto">
            <Card className="h-full flex flex-col">
              <CardHeader>
                <div className="flex justify-between items-center mb-4">
                  <CardTitle className="text-2xl font-bold">Smart Management</CardTitle>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" onClick={() => setViewMode(viewMode === 'list' ? 'grid' : 'list')}>
                      {viewMode === 'list' ? <Grid className="h-4 w-4" /> : <LayoutList className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <Input
                      type="search"
                      placeholder="Search cards..."
                      className="pl-10"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex-1 overflow-hidden">
                <div className="flex items-center gap-2 mb-4">
                  <Button variant="outline" size="icon" onClick={handleSort}>
                    <SortAsc className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon" onClick={() => setShowFilters(!showFilters)}>
                    <Filter className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon" onClick={handleDeduplicate}>
                    <Layers className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon" onClick={handleMerge}>
                    <Merge className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon" onClick={handleExportCSV}>
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
                {showFilters && (
                  <div className="mb-4 p-4 bg-white rounded-lg shadow">
                    <div className="space-y-4">
                      <div>
                        <Label>Sort by</Label>
                        <Select
                          value={sortField}
                          onValueChange={(value) => setSortField(value as keyof BusinessCard)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select field" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="name">Name</SelectItem>
                            <SelectItem value="company">Company</SelectItem>
                            <SelectItem value="dateAdded">Date Added</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Label>Direction</Label>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSortDirection(d => d === 'asc' ? 'desc' : 'asc')}
                        >
                          {sortDirection === 'asc' ? 'Ascending' : 'Descending'}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
                <ScrollArea className="h-[600px] pr-4">
                  <AnimatePresence>
                    <div className={`grid grid-cols-1 ${viewMode === 'grid' ? 'sm:grid-cols-2 lg:grid-cols-3' : ''} gap-4`}>
                      {filteredCards.map((card) => (
                        <motion.div
                          key={card.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          transition={{ duration: 0.3 }}
                        >
                          <Card 
                            className="overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-lg"
                            onClick={() => handleCardClick(card)}
                          >
                            <CardContent className="p-6">
                              <div className="flex items-start space-x-4">
                                <Avatar className="w-16 h-16">
                                  <AvatarFallback>{card.name[0]}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                  <div className="space-y-1">
                                    {card.nameZh && <h3 className="text-lg font-semibold">{card.nameZh}</h3>}
                                    {card.name && card.name !== card.nameZh && (
                                      <h3 className="text-lg font-semibold text-gray-700">{card.name}</h3>
                                    )}
                                    {card.titleZh && <p className="text-sm text-gray-600">{card.titleZh}</p>}
                                    {card.title && card.title !== card.titleZh && (
                                      <p className="text-sm text-gray-600">{card.title}</p>
                                    )}
                                    {card.companyZh && <p className="text-sm text-gray-500">{card.companyZh}</p>}
                                    {card.company && card.company !== card.companyZh && (
                                      <p className="text-sm text-gray-500">{card.company}</p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      ))}
                    </div>
                  </AnimatePresence>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="h-full p-8 overflow-auto">
            <Card>
              <CardHeader>
                <CardTitle>Settings</CardTitle>
                <CardDescription>Manage your preferences and account settings</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="darkMode">Dark Mode</Label>
                    <Switch id="darkMode" />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="notifications">Notifications</Label>
                    <Switch id="notifications" />
                  </div>
                  <Button variant="outline" onClick={signOut}>Sign Out</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*"
        onChange={handleFileUpload}
        className="hidden"
      />

      {isScanning && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-lg shadow-xl text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p>Processing image {currentImageIndex} of {totalImages}...</p>
          </div>
        </div>
      )}

      {selectedCard && (
        <Dialog open={true} onOpenChange={() => setSelectedCard(null)}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Business Card Details</DialogTitle>
              <DialogDescription>View and edit business card information</DialogDescription>
            </DialogHeader>
            <BusinessCardDetails
              card={selectedCard}
              onEdit={handleCardEdit}
              onDelete={handleCardDelete}
            />
          </DialogContent>
        </Dialog>
      )}

      <footer className="bg-white border-t px-8 py-4 fixed bottom-0 left-0 right-0">
        <div className="flex justify-around items-center">
          {[
            { icon: <ScanLine className="h-6 w-6 mb-1" />, label: "Scan", value: "scan" },
            { icon: <LayoutList className="h-6 w-6 mb-1" />, label: "Manage", value: "manage" },
            { icon: <Network className="h-6 w-6 mb-1" />, label: "Org Chart", value: "orgchart" },
            { icon: <Newspaper className="h-6 w-6 mb-1" />, label: "News", value: "news" },
            { icon: <Bookmark className="h-6 w-6 mb-1" />, label: "Saved", value: "saved-news" },
            { icon: <Star className="h-6 w-6 mb-1" />, label: "Pro", value: "pro" },
            { icon: <Settings className="h-6 w-6 mb-1" />, label: "Settings", value: "settings" },
          ].map((item) => (
            <Button
              key={item.value}
              variant="ghost"
              size="sm"
              className={`flex flex-col items-center ${activeTab === item.value ? 'text-primary' : ''}`}
              onClick={() => setActiveTab(item.value)}
            >
              {item.icon}
              <span className="text-xs font-medium">{item.label}</span>
            </Button>
          ))}
        </div>
      </footer>
    </div>
  );
}