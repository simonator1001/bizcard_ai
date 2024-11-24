import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { Upload, Camera, CloudLightning, Share2, CheckCircle, Cloud, Search, Filter, SortDesc, Tag, Loader2, Download, Trash2, Edit2, X, Scan, LayoutList, UserCircle, Settings, ScanLine, ArrowUpDown, ArrowDownUp, Check } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Dialog, DialogTrigger, DialogContent, DialogClose, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { recognizeBusinessCard, preprocessImageForOCR } from '@/lib/ocr-service';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetFooter } from "@/components/ui/sheet"
import { Checkbox } from "@/components/ui/checkbox"
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase-client'
import { sleep } from '@/lib/utils';

interface BusinessCard {
  id: string
  name: string
  nameZh?: string
  company: string
  companyZh?: string
  title: string
  titleZh?: string
  email: string
  phone: string
  address?: string
  addressZh?: string
  dateAdded: string
  image_url: string
  rawText?: string
  tags?: string[]
}

interface EditableField {
  fieldName: keyof BusinessCard;
  value: string;
  originalValue: string;
}

export default function ScannerPage() {
  const { user, signOut } = useAuth();
  const [cards, setCards] = useState<BusinessCard[]>([])
  const [uploadedImages, setUploadedImages] = useState<string[]>([])
  const [isScanning, setIsScanning] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [isSuggestingTags, setIsSuggestingTags] = useState(false)
  const [sortCriteria, setSortCriteria] = useState<{ field: keyof BusinessCard; order: 'asc' | 'desc' }>({
    field: 'dateAdded',
    order: 'desc'
  })
  const [currentImageIndex, setCurrentImageIndex] = useState<number>(0)
  const [editingCard, setEditingCard] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('scan')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [activeFilters, setActiveFilters] = useState<{
    name: string[];
    title: string[];
    company: string[];
    email: string[];
  }>({
    name: [],
    title: [],
    company: [],
    email: []
  })
  const [sortConfig, setSortConfig] = useState<{
    field: keyof BusinessCard,
    direction: 'asc' | 'desc'
  }>({ field: 'dateAdded', direction: 'desc' })
  const [sortField, setSortField] = useState<keyof BusinessCard>('dateAdded')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState({
    companies: [] as string[],
    titles: [] as string[],
    selectedCompanies: [] as string[],
    selectedTitles: [] as string[]
  })
  const [filterOptions, setFilterOptions] = useState<{
    companies: string[];
    titles: string[];
  }>({
    companies: [],
    titles: []
  })
  const [selectedFilters, setSelectedFilters] = useState<{
    companies: string[];
    titles: string[];
  }>({
    companies: [],
    titles: []
  })
  const [editingField, setEditingField] = useState<EditableField | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const [totalImages, setTotalImages] = useState<number>(0);

  const getUniqueCompanies = useCallback(() => {
    const companies = new Set<string>();
    cards.forEach(card => {
      if (card.company) companies.add(card.company);
      if (card.companyZh) companies.add(card.companyZh);
    });
    return Array.from(companies);
  }, [cards]);

  const getUniqueValues = useCallback(() => {
    const companies = new Set<string>();
    const titles = new Set<string>();

    cards.forEach(card => {
      if (card.company) companies.add(card.company);
      if (card.companyZh) companies.add(card.companyZh);
      if (card.title) titles.add(card.title);
      if (card.titleZh) titles.add(card.titleZh);
    });

    return {
      companies: Array.from(companies),
      titles: Array.from(titles)
    };
  }, [cards]);

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

  const updateFilterOptions = useCallback((newCard: BusinessCard) => {
    setFilterOptions(prev => {
      const newCompanies = new Set([...prev.companies]);
      const newTitles = new Set([...prev.titles]);

      if (newCard.company) newCompanies.add(newCard.company);
      if (newCard.companyZh) newCompanies.add(newCard.companyZh);
      if (newCard.title) newTitles.add(newCard.title);
      if (newCard.titleZh) newTitles.add(newCard.titleZh);

      return {
        companies: Array.from(newCompanies),
        titles: Array.from(newTitles)
      };
    });
  }, []);

  const handleScan = async () => {
    if (uploadedImages.length === 0) {
      toast.error("Please upload at least one image before scanning.");
      return;
    }

    setIsScanning(true);
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new Error('User not authenticated')
      }

      for (let i = 0; i < uploadedImages.length; i++) {
        setCurrentImageIndex(i);
        console.log(`Processing image ${i + 1} of ${uploadedImages.length}`);
        
        // Upload image to Supabase Storage
        const imageFile = await fetch(uploadedImages[i]).then(res => res.blob());
        const fileName = `${user.id}/${Date.now()}-${i}.jpg`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('business-cards')
          .upload(fileName, imageFile, {
            contentType: 'image/jpeg',
            upsert: true
          });

        if (uploadError) {
          console.error('Image upload error:', uploadError);
          throw uploadError;
        }

        // Get public URL for the uploaded image
        const { data: { publicUrl } } = supabase.storage
          .from('business-cards')
          .getPublicUrl(fileName);

        console.log('Public URL:', publicUrl);

        const result = await recognizeBusinessCard(uploadedImages[i]);
        console.log('OCR result:', result);

        if (result.raw_text) {
          try {
            // Parse the JSON from raw_text
            const jsonMatch = result.raw_text.match(/\{[\s\S]*\}/);
            const jsonText = jsonMatch ? jsonMatch[0] : '{}';
            const parsedData = JSON.parse(jsonText);
            console.log('Parsed OCR data:', parsedData);

            // Save to Supabase with both English and Chinese data
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

            // Update the card state
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
            console.error('Failed to process card:', error);
            toast.error(`Failed to process card ${i + 1}`);
          }
        }
      }
    } catch (error) {
      console.error('OCR Error:', error);
      toast.error('Error scanning cards. Please try again.');
    } finally {
      setIsScanning(false);
      setUploadedImages([]);
      setCurrentImageIndex(0);
    }
  };

  const handleSuggestTags = async () => {
    setIsSuggestingTags(true)
    try {
      // Implement AI tag suggestion logic here
      await new Promise(resolve => setTimeout(resolve, 2000))
      toast.success('Tags suggested successfully')
    } catch (error) {
      toast.error('Failed to suggest tags')
    } finally {
      setIsSuggestingTags(false)
    }
  }

  const handleSort = (field: keyof BusinessCard) => {
    if (field === sortField) {
      setSortDirection(current => current === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const handleSearch = (value: string) => {
    setSearchTerm(value.toLowerCase())
  }

  const handleFilter = (category: keyof typeof activeFilters, value: string) => {
    setActiveFilters(prev => ({
      ...prev,
      [category]: prev[category].includes(value)
        ? prev[category].filter(item => item !== value)
        : [...prev[category], value]
    }))
  }

  const handleFilterChange = (type: keyof typeof filters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [type]: prev[type].includes(value)
        ? prev[type].filter(item => item !== value)
        : [...prev[type], value]
    }))
  }

  const getFilteredCards = useCallback(() => {
    return cards.filter(card => {
      // Company filter
      if (selectedFilters.companies.length > 0) {
        const cardCompanies = [
          card.company,
          card.companyZh
        ].filter((company): company is string => typeof company === 'string');

        const matchesCompany = selectedFilters.companies.some(selectedCompany =>
          cardCompanies.some(cardCompany =>
            cardCompany.toLowerCase().includes(selectedCompany.toLowerCase())
          )
        );

        if (!matchesCompany) return false;
      }

      // Title filter
      if (selectedFilters.titles.length > 0) {
        const cardTitles = [
          card.title,
          card.titleZh
        ].filter((title): title is string => typeof title === 'string');

        const matchesTitle = selectedFilters.titles.some(selectedTitle =>
          cardTitles.some(cardTitle =>
            cardTitle.toLowerCase().includes(selectedTitle.toLowerCase())
          )
        );

        if (!matchesTitle) return false;
      }

      return true;
    });
  }, [cards, selectedFilters]);

  const filteredCards = useMemo(() => {
    return cards.filter(card => {
      if (filters.selectedCompanies.length > 0) {
        const cardCompanies = [card.company, card.companyZh]
          .filter((company): company is string => typeof company === 'string');
        if (!cardCompanies.some(company => filters.selectedCompanies.includes(company))) {
          return false;
        }
      }
      if (filters.selectedTitles.length > 0) {
        const cardTitles = [card.title, card.titleZh]
          .filter((title): title is string => typeof title === 'string');
        if (!cardTitles.some(title => filters.selectedTitles.includes(title))) {
          return false;
        }
      }
      return true;
    });
  }, [cards, filters.selectedCompanies, filters.selectedTitles]);

  const deleteCard = async (cardId: string) => {
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

        if (dbError) {
          throw dbError;
        }

        // Delete from local state
        setCards(prev => prev.filter(card => card.id !== cardId));
        toast.success('Card deleted successfully');
      } catch (error) {
        console.error('Error deleting card:', error);
        toast.error('Failed to delete card');
      }
    }
  };

  const getSortedCards = (cards: BusinessCard[]) => {
    return [...cards].sort((a, b) => {
      const aValue = a[sortField] || ''
      const bValue = b[sortField] || ''
      const modifier = sortDirection === 'asc' ? 1 : -1
      
      return aValue < bValue ? -1 * modifier : aValue > bValue ? 1 * modifier : 0
    })
  }

  const validateField = (fieldName: keyof BusinessCard, value: string): boolean => {
    switch (fieldName) {
      case 'email':
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
      case 'phone':
        return /^[\d\s\-\+\(\)]+$/.test(value);
      default:
        return value.trim().length > 0;
    }
  };

  const handleFieldUpdate = async (card: BusinessCard, field: EditableField) => {
    if (!validateField(field.fieldName, field.value)) {
      setEditError(`Invalid ${field.fieldName} format`);
      return;
    }

    try {
      // Map the field names to database column names
      const columnMapping: Record<string, string> = {
        nameZh: 'name_zh',
        name: 'name',
        titleZh: 'title_zh',
        title: 'title',
        companyZh: 'company_zh',
        company: 'company',
        email: 'email',
        phone: 'phone',
        addressZh: 'address_zh',
        address: 'address'
      };

      // Get the correct column name
      const columnName = columnMapping[field.fieldName];
      if (!columnName) {
        throw new Error(`Unknown field: ${field.fieldName}`);
      }

      // Update in Supabase using the correct column name
      const { error } = await supabase
        .from('business_cards')
        .update({
          [columnName]: field.value
        })
        .eq('id', card.id);

      if (error) throw error;

      // Update local state using the original field name
      setCards(prevCards =>
        prevCards.map(c =>
          c.id === card.id
            ? { ...c, [field.fieldName]: field.value }
            : c
        )
      );

      setEditingField(null);
      setEditError(null);
      toast.success('Updated successfully');
    } catch (error) {
      console.error('Update error:', error);
      toast.error('Failed to update field');
    }
  };

  useEffect(() => {
    async function loadCards() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: cards, error } = await supabase
          .from('business_cards')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;

        // Transform the database cards to match our interface
        const formattedCards: BusinessCard[] = cards.map(card => ({
          id: card.id,
          name: card.name,
          nameZh: card.name_zh || undefined,
          company: card.company,
          companyZh: card.company_zh || undefined,
          title: card.title,
          titleZh: card.title_zh || undefined,
          email: card.email,
          phone: card.phone,
          address: card.address || undefined,
          addressZh: card.address_zh || undefined,
          dateAdded: card.created_at,
          image_url: card.image_url,
          rawText: card.raw_text
        }));

        setCards(formattedCards);
      } catch (error) {
        console.error('Error loading cards:', error);
        toast.error('Failed to load business cards');
      }
    }

    loadCards();
  }, []);

  // Add this helper function to format phone numbers
  const formatPhoneNumber = (phone: string) => {
    return phone.split(',').map(p => p.trim()).join('\n');
  };

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-blue-50 to-indigo-100">
      <header className="border-b px-6 py-3 flex items-center justify-between">
        <h1 className="text-2xl font-bold">BizCard Scanner</h1>
        <Button variant="outline" onClick={signOut}>Sign Out</Button>
      </header>

      <main className="flex-1 p-6 overflow-hidden">
        {activeTab === 'scan' ? (
          // Scan tab content
          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div 
                  className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {isScanning ? (
                    <div className="text-center space-y-4">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto" />
                      <p className="text-sm text-gray-500">
                        Scanning image {currentImageIndex} of {totalImages}...
                      </p>
                    </div>
                  ) : uploadedImages.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      {uploadedImages.map((image, index) => (
                        <div key={index} className="relative">
                          <img 
                            src={image} 
                            alt={`Business card ${index + 1}`} 
                            className="w-full h-48 object-cover rounded-lg"
                          />
                          <Button
                            variant="outline"
                            size="icon"
                            className="absolute top-2 right-2"
                            onClick={(e) => {
                              e.stopPropagation();
                              setUploadedImages(prev => prev.filter((_, i) => i !== index));
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="w-48 h-48 bg-muted mx-auto rounded flex items-center justify-center">
                        <Upload className="h-12 w-12 text-muted-foreground" />
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Click to upload business card images or drag and drop
                      </p>
                    </div>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <Button 
                  onClick={handleScan} 
                  disabled={isScanning || uploadedImages.length === 0}
                  className="w-full"
                >
                  {isScanning ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Scanning...
                    </>
                  ) : (
                    <>
                      <Scan className="mr-2 h-4 w-4" />
                      Scan Business Cards
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : activeTab === 'manage' ? (
          // Manage tab content
          <Card className="h-full flex flex-col">
            <CardHeader>
              <div className="flex justify-between items-center mb-4">
                <CardTitle className="text-2xl font-bold">Smart Management</CardTitle>
                <Button className="rounded-full" variant="outline">
                  <Tag className="h-5 w-5 mr-2" />
                  Suggest Tags
                </Button>
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
                
                {/* Filter Button with Sheet */}
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="outline" className="rounded-full">
                      <Filter className="h-5 w-5 mr-2" />
                      Filter
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="right" className="w-[320px]">
                    <SheetHeader>
                      <SheetTitle>Filter Business Cards</SheetTitle>
                    </SheetHeader>
                    <div className="py-6 space-y-6">
                      {/* Companies Section */}
                      <div className="space-y-4">
                        <h4 className="font-medium text-sm">Companies</h4>
                        <div className="grid gap-2">
                          {Array.from(new Set(cards.flatMap(card => 
                            [card.company, card.companyZh].filter((company): company is string => 
                              typeof company === 'string'
                            )
                          ))).map((company) => (
                            <div key={company} className="flex items-center space-x-2">
                              <Checkbox 
                                id={`company-${company}`}
                                checked={selectedFilters.companies.includes(company)}
                                onCheckedChange={(checked: boolean) => {
                                  setSelectedFilters(prev => ({
                                    ...prev,
                                    companies: checked 
                                      ? [...prev.companies, company]
                                      : prev.companies.filter(c => c !== company)
                                  }));
                                }}
                              />
                              <label
                                htmlFor={`company-${company}`}
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                              >
                                {company}
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Titles Section */}
                      <div className="space-y-4">
                        <h4 className="font-medium text-sm">Titles</h4>
                        <div className="grid gap-2">
                          {Array.from(new Set(cards.flatMap(card => 
                            [card.title, card.titleZh].filter((title): title is string => 
                              typeof title === 'string'
                            )
                          ))).map((title) => (
                            <div key={title} className="flex items-center space-x-2">
                              <Checkbox 
                                id={`title-${title}`}
                                checked={selectedFilters.titles.includes(title)}
                                onCheckedChange={(checked: boolean) => {
                                  setSelectedFilters(prev => ({
                                    ...prev,
                                    titles: checked 
                                      ? [...prev.titles, title]
                                      : prev.titles.filter(t => t !== title)
                                  }));
                                }}
                              />
                              <label
                                htmlFor={`title-${title}`}
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                              >
                                {title}
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    <SheetFooter>
                      <Button 
                        variant="outline" 
                        onClick={() => setSelectedFilters({ companies: [], titles: [] })}
                      >
                        Clear Filters
                      </Button>
                    </SheetFooter>
                  </SheetContent>
                </Sheet>

                {/* Sort Button with Popover */}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="rounded-full">
                      <SortDesc className="h-5 w-5 mr-2" />
                      Sort
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-48">
                    <div className="space-y-2">
                      <Button
                        variant="ghost"
                        className="w-full justify-start"
                        onClick={() => handleSort('dateAdded')}
                      >
                        Date Added {sortField === 'dateAdded' && (sortDirection === 'asc' ? '↑' : '↓')}
                      </Button>
                      <Button
                        variant="ghost"
                        className="w-full justify-start"
                        onClick={() => handleSort('name')}
                      >
                        Name {sortField === 'name' && (sortDirection === 'asc' ? '↑' : '↓')}
                      </Button>
                      <Button
                        variant="ghost"
                        className="w-full justify-start"
                        onClick={() => handleSort('company')}
                      >
                        Company {sortField === 'company' && (sortDirection === 'asc' ? '↑' : '↓')}
                      </Button>
                    </div>
                  </PopoverContent>
                </Popover>

                {/* Sort Direction Button */}
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={() => setSortDirection(current => current === 'asc' ? 'desc' : 'asc')}
                  className="rounded-full"
                >
                  {sortDirection === 'asc' ? (
                    <ArrowUpDown className="h-5 w-5" />
                  ) : (
                    <ArrowDownUp className="h-5 w-5" />
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-hidden">
              <ScrollArea className="h-full pr-4">
                <AnimatePresence>
                  {getSortedCards(getFilteredCards()).map((card) => (
                    <motion.div
                      key={card.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Card className="mb-4">
                        <CardContent className="p-6">
                          <div className="flex items-start space-x-4">
                            <Dialog>
                              <DialogTrigger>
                                <div className="w-24 h-24 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                                  <img 
                                    src={card.image_url} 
                                    alt={`${card.name}'s business card`} 
                                    className="w-full h-full object-cover cursor-pointer hover:opacity-80 transition-opacity"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).src = '/placeholder-card.png'
                                    }}
                                  />
                                </div>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogTitle>Business Card Details</DialogTitle>
                                <DialogDescription>
                                  Detailed view of the business card image
                                </DialogDescription>
                                
                                <div className="relative mt-4">
                                  <img 
                                    src={card.image_url} 
                                    alt={`${card.name}'s business card`} 
                                    className="w-full h-auto rounded-lg"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).src = '/placeholder-card.png'
                                    }}
                                  />
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    className="absolute top-2 right-2"
                                    onClick={() => {
                                      const link = document.createElement('a');
                                      link.href = card.image_url;
                                      link.download = `${card.name}-business-card.jpg`;
                                      link.click();
                                    }}
                                  >
                                    <Download className="h-4 w-4 mr-2" />
                                    Download
                                  </Button>
                                </div>
                              </DialogContent>
                            </Dialog>

                            <div className="flex-1 min-w-0">
                              <div className="space-y-4">
                                {/* Name Section */}
                                <div className="border-b pb-2">
                                  {/* Chinese Name */}
                                  <div className="flex items-center space-x-2">
                                    {editingField?.fieldName === 'nameZh' ? (
                                      <div className="flex items-center space-x-2">
                                        <Input
                                          value={editingField.value}
                                          onChange={(e) => setEditingField({
                                            ...editingField,
                                            value: e.target.value
                                          })}
                                          className="text-2xl font-bold"
                                        />
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          onClick={() => handleFieldUpdate(card, editingField)}
                                        >
                                          <Check className="h-4 w-4 text-green-500" />
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          onClick={() => {
                                            setEditingField(null);
                                            setEditError(null);
                                          }}
                                        >
                                          <X className="h-4 w-4 text-red-500" />
                                        </Button>
                                      </div>
                                    ) : (
                                      <>
                                        <h2 className="text-2xl font-bold">{card.nameZh}</h2>
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          onClick={() => setEditingField({
                                            fieldName: 'nameZh',
                                            value: card.nameZh || '',
                                            originalValue: card.nameZh || ''
                                          })}
                                        >
                                          <Edit2 className="h-4 w-4 text-gray-400" />
                                        </Button>
                                      </>
                                    )}
                                  </div>

                                  {/* English Name */}
                                  <div className="flex items-center space-x-2">
                                    {editingField?.fieldName === 'name' ? (
                                      <div className="flex items-center space-x-2">
                                        <Input
                                          value={editingField.value}
                                          onChange={(e) => setEditingField({
                                            ...editingField,
                                            value: e.target.value
                                          })}
                                          className="text-xl font-semibold text-gray-700"
                                        />
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          onClick={() => handleFieldUpdate(card, editingField)}
                                        >
                                          <Check className="h-4 w-4 text-green-500" />
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          onClick={() => {
                                            setEditingField(null);
                                            setEditError(null);
                                          }}
                                        >
                                          <X className="h-4 w-4 text-red-500" />
                                        </Button>
                                      </div>
                                    ) : (
                                      <>
                                        <h2 className="text-xl font-semibold text-gray-700">{card.name}</h2>
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          onClick={() => setEditingField({
                                            fieldName: 'name',
                                            value: card.name || '',
                                            originalValue: card.name || ''
                                          })}
                                        >
                                          <Edit2 className="h-4 w-4 text-gray-400" />
                                        </Button>
                                      </>
                                    )}
                                  </div>
                                </div>

                                {/* Error message */}
                                {editError && (
                                  <p className="text-sm text-red-500">{editError}</p>
                                )}

                                {/* Title Section */}
                                <div className="border-b pb-2">
                                  {card.titleZh && (
                                    <h3 className="text-xl font-medium mb-1">{card.titleZh}</h3>
                                  )}
                                  {card.title && card.title !== card.titleZh && (
                                    <h3 className="text-lg font-medium text-gray-700">{card.title}</h3>
                                  )}
                                </div>

                                {/* Company Section */}
                                <div className="border-b pb-2">
                                  {card.companyZh && (
                                    <h3 className="text-xl font-semibold mb-1">{card.companyZh}</h3>
                                  )}
                                  {card.company && card.company !== card.companyZh && (
                                    <h3 className="text-lg font-semibold text-gray-700">{card.company}</h3>
                                  )}
                                </div>

                                {/* Contact Information */}
                                <div className="space-y-2 text-gray-600">
                                  {/* Phone Numbers */}
                                  {card.phone && (
                                    <div className="flex items-start space-x-2">
                                      <span className="font-medium min-w-[80px]">Tel:</span>
                                      <div className="flex-1">
                                        <pre className="font-mono">{formatPhoneNumber(card.phone)}</pre>
                                      </div>
                                    </div>
                                  )}

                                  {/* Email */}
                                  {card.email && (
                                    <div className="flex items-center space-x-2">
                                      <span className="font-medium min-w-[80px]">Email:</span>
                                      <span className="font-mono">{card.email}</span>
                                    </div>
                                  )}

                                  {/* Address */}
                                  {(card.addressZh || card.address) && (
                                    <div className="flex items-start space-x-2">
                                      <span className="font-medium min-w-[80px]">Address:</span>
                                      <div className="flex-1">
                                        {card.addressZh && (
                                          <p className="mb-1">{card.addressZh}</p>
                                        )}
                                        {card.address && card.address !== card.addressZh && (
                                          <p className="text-gray-600">{card.address}</p>
                                        )}
                                      </div>
                                    </div>
                                  )}
                                </div>

                                {/* Edit and Action Buttons */}
                                <div className="flex justify-end space-x-2 mt-4">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setEditingField({
                                      fieldName: 'name',
                                      value: card.name || '',
                                      originalValue: card.name || ''
                                    })}
                                  >
                                    <Edit2 className="h-4 w-4 mr-2" />
                                    Edit
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      const link = document.createElement('a');
                                      link.href = card.image_url;
                                      link.download = `${card.name}-business-card.jpg`;
                                      link.click();
                                    }}
                                  >
                                    <Download className="h-4 w-4 mr-2" />
                                    Download
                                  </Button>
                                </div>
                              </div>
                            </div>

                            <div className="flex space-x-2">
                              <Button variant="ghost" size="icon">
                                <Share2 className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => deleteCard(card.id)}
                                className="text-red-500 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </ScrollArea>
            </CardContent>
          </Card>
        ) : null}
      </main>

      {/* Updated footer navigation */}
      <footer className="bg-white border-t px-8 py-4">
        <div className="flex justify-around items-center max-w-screen-xl mx-auto">
          <Button 
            variant="ghost" 
            size="lg" 
            className={`flex flex-col items-center gap-1 ${activeTab === 'scan' ? 'text-primary' : ''}`}
            onClick={() => setActiveTab('scan')}
          >
            <ScanLine className="h-6 w-6" />
            <span className="text-sm">Scan</span>
          </Button>
          <Button 
            variant="ghost" 
            size="lg" 
            className={`flex flex-col items-center gap-1 ${activeTab === 'manage' ? 'text-primary' : ''}`}
            onClick={() => setActiveTab('manage')}
          >
            <LayoutList className="h-6 w-6" />
            <span className="text-sm">Manage</span>
          </Button>
          <Button 
            variant="ghost" 
            size="lg" 
            className="flex flex-col items-center gap-1"
          >
            <Share2 className="h-6 w-6" />
            <span className="text-sm">Share</span>
          </Button>
          <Button 
            variant="ghost" 
            size="lg" 
            className="flex flex-col items-center gap-1"
          >
            <UserCircle className="h-6 w-6" />
            <span className="text-sm">Profile</span>
          </Button>
          <Button 
            variant="ghost" 
            size="lg" 
            className="flex flex-col items-center gap-1"
          >
            <Settings className="h-6 w-6" />
            <span className="text-sm">Settings</span>
          </Button>
        </div>
      </footer>
    </div>
  );
}