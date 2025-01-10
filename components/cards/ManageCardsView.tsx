import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase-client';
import { 
  Mail, 
  Phone, 
  MapPin, 
  Users, 
  Trash2, 
  Download, 
  X, 
  Check,
  List,
  Grid,
  Image as ImageIcon,
  ChevronDown
} from 'lucide-react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu"
import { CardItem } from './CardItem';
import { CardDetailView } from './CardDetailView';
import { DuplicateManager } from './DuplicateManager';
import type { BusinessCard } from '@/types/business-card';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { downloadCSV } from '@/lib/csv-utils';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

type ViewMode = 'list' | 'grid' | 'carousel';
type SortField = 'name' | 'company' | 'title' | 'created_at';
type SortDirection = 'asc' | 'desc';

export function ManageCardsView() {
  const [cards, setCards] = useState<BusinessCard[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCards, setSelectedCards] = useState<Set<string>>(new Set());
  const [showDuplicateManager, setShowDuplicateManager] = useState(false);
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [selectedCard, setSelectedCard] = useState<BusinessCard | null>(null);
  const { user } = useAuth();

  const fetchCards = useCallback(async () => {
    if (!user) {
      console.log('No user found');
      return;
    }

    console.log('Fetching cards for user:', user.id);
    
    const { data, error } = await supabase
      .from('business_cards')
      .select(`
        id,
        name,
        name_zh,
        company,
        company_zh,
        title,
        title_zh,
        email,
        phone,
        address,
        address_zh,
        notes,
        image_url,
        created_at,
        updated_at,
        user_id
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching cards:', error);
      toast.error('Failed to load business cards');
      return;
    }

    // Transform the data to include images array with image_url
    const cardsWithImages = data?.map(card => ({
      ...card,
      images: card.image_url ? [card.image_url] : []
    })) || [];

    console.log('Fetched cards:', cardsWithImages);
    setCards(cardsWithImages);
  }, [user]);

  useEffect(() => {
    fetchCards();
  }, [fetchCards]);

  const filteredCards = cards.filter(card => 
    (card.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (card.company || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (card.title || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedAndFilteredCards = React.useMemo(() => {
    return filteredCards.sort((a, b) => {
      if (sortField === 'created_at') {
        const dateA = new Date(a.created_at || 0).getTime();
        const dateB = new Date(b.created_at || 0).getTime();
        return sortDirection === 'asc' ? dateA - dateB : dateB - dateA;
      }
      
      const aValue = String(a[sortField] || '').toLowerCase();
      const bValue = String(b[sortField] || '').toLowerCase();
      return sortDirection === 'asc' 
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    });
  }, [filteredCards, sortField, sortDirection]);

  useEffect(() => {
    console.log('Selected cards:', Array.from(selectedCards));
  }, [selectedCards]);

  const handleCardSelect = useCallback((cardId: string) => {
    console.log('Selecting card:', cardId);
    setSelectedCards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(cardId)) {
        newSet.delete(cardId);
      } else {
        newSet.add(cardId);
      }
      console.log('Selected cards:', Array.from(newSet));
      return newSet;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    setSelectedCards(prev => {
      if (prev.size === sortedAndFilteredCards.length) {
        console.log('Deselecting all cards');
        return new Set();
      }
      const newSet = new Set(sortedAndFilteredCards.map(card => card.id));
      console.log('Selecting all cards:', Array.from(newSet));
      return newSet;
    });
  }, [sortedAndFilteredCards]);

  const handleDeleteSelected = useCallback(async () => {
    const selectedCardIds = Array.from(selectedCards);
    if (selectedCardIds.length === 0) return;

    try {
      // Delete cards one by one
      for (const cardId of selectedCardIds) {
        const { error } = await supabase
          .from('business_cards')
          .delete()
          .eq('id', cardId);
        
        if (error) {
          console.error(`Error deleting card ${cardId}:`, error);
          throw error;
        }
      }

      // Update local state
      setCards(prev => prev.filter(card => !selectedCards.has(card.id)));
      setSelectedCards(new Set());
    } catch (error) {
      console.error('Error deleting cards:', error);
      await fetchCards();
    }
  }, [selectedCards, fetchCards, supabase]);

  const handleMergeCard = useCallback(async (mergedCard: BusinessCard) => {
    try {
      const { error } = await supabase
        .from('business_cards')
        .upsert([mergedCard]);
      
      if (error) throw error;
      
      await fetchCards();
    } catch (error) {
      console.error('Error merging card:', error);
    }
  }, [fetchCards]);

  const handleDeleteCard = useCallback(async (cardId: string) => {
    try {
      const { error } = await supabase
        .from('business_cards')
        .delete()
        .eq('id', cardId);
      
      if (error) throw error;
      
      setCards(prev => prev.filter(card => card.id !== cardId));
    } catch (error) {
      console.error('Error deleting card:', error);
    }
  }, []);

  const handleExportCSV = useCallback(() => {
    downloadCSV(cards);
  }, [cards]);

  const handleDuplicateManagerOpen = useCallback(() => {
    setShowDuplicateManager(true);
  }, []);

  const handleDuplicateManagerClose = useCallback(() => {
    setShowDuplicateManager(false);
  }, []);

  const handleDuplicateManagerChange = useCallback((open: boolean) => {
    setShowDuplicateManager(open);
  }, []);

  // Add a useEffect to monitor selectedCards changes
  useEffect(() => {
    console.log('Selected cards count:', selectedCards.size);
  }, [selectedCards]);

  // Add a useEffect to monitor cards changes
  useEffect(() => {
    console.log('Total cards count:', cards.length);
  }, [cards]);

  const handleCardClick = useCallback((card: BusinessCard) => {
    setSelectedCard(card);
  }, []);

  const handleCardEdit = useCallback(async (updatedCard: BusinessCard) => {
    try {
      // Remove the images field before sending to Supabase
      const { images, ...cardDataToUpdate } = updatedCard;
      
      const { error } = await supabase
        .from('business_cards')
        .update(cardDataToUpdate)
        .eq('id', updatedCard.id);
      
      if (error) throw error;
      
      setCards(prev => prev.map(card => 
        card.id === updatedCard.id ? {
          ...updatedCard,
          images: updatedCard.image_url ? [updatedCard.image_url] : []
        } : card
      ));
      toast.success('Card updated successfully');
    } catch (error) {
      console.error('Error updating card:', error);
      toast.error('Failed to update card');
    }
  }, []);

  const viewModeIcons = {
    list: <List className="h-4 w-4" />,
    grid: <Grid className="h-4 w-4" />,
    carousel: <ImageIcon className="h-4 w-4" />
  };

  const viewModeLabels = {
    list: 'List View',
    grid: 'Grid View',
    carousel: 'Carousel View'
  };

  return (
    <div className="space-y-6">
      <div className="border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="flex h-16 items-center px-8">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-4">
              <h2 className="text-lg font-semibold">
                Business Cards
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSelectAll}
                className="text-sm"
              >
                {selectedCards.size === sortedAndFilteredCards.length ? 'Deselect All' : 'Select All'}
                {selectedCards.size > 0 && ` (${selectedCards.size} selected)`}
              </Button>
            </div>
            <div className="flex items-center gap-4">
              <Input
                type="search"
                placeholder="Search cards..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-[250px]"
              />
              <div className="flex items-center gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="w-[150px] justify-between">
                      {sortField === 'created_at' ? 'Date Added' :
                       sortField === 'name' ? 'Name' :
                       sortField === 'company' ? 'Company' : 'Title'}
                      <span className="ml-2">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-[150px]">
                    <DropdownMenuRadioGroup value={sortField} onValueChange={(value: SortField) => setSortField(value)}>
                      <DropdownMenuRadioItem value="created_at">Date Added</DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="name">Name</DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="company">Company</DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="title">Title</DropdownMenuRadioItem>
                    </DropdownMenuRadioGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')}
                  title={`Sort ${sortDirection === 'asc' ? 'Ascending' : 'Descending'}`}
                  type="button"
                >
                  {sortDirection === 'asc' ? '↑' : '↓'}
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleExportCSV}
                  title="Export as CSV"
                  type="button"
                >
                  <Download className="h-5 w-5" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleDeleteSelected}
                  title={`Remove Selected (${selectedCards.size})`}
                  type="button"
                  className={cn(
                    "relative transition-colors",
                    selectedCards.size > 0 
                      ? "bg-destructive text-destructive-foreground hover:bg-destructive/90 cursor-pointer"
                      : "opacity-50 cursor-not-allowed pointer-events-none"
                  )}
                >
                  <Trash2 className="h-5 w-5" />
                  {selectedCards.size > 0 && (
                    <span className="absolute -top-2 -right-2 bg-white text-destructive rounded-full w-5 h-5 text-xs flex items-center justify-center border-2 border-current font-medium">
                      {selectedCards.size}
                    </span>
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleDuplicateManagerOpen}
                  title="Manage Duplicates"
                  className="hover:bg-gray-100"
                  type="button"
                >
                  <Users className="h-5 w-5" />
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="w-[140px] justify-between">
                      <div className="flex items-center gap-2">
                        {viewModeIcons[viewMode]}
                        <span>{viewModeLabels[viewMode]}</span>
                      </div>
                      <ChevronDown className="h-4 w-4 opacity-50" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent 
                    align="end" 
                    className="w-[140px] bg-white shadow-lg border rounded-md"
                    sideOffset={5}
                  >
                    <DropdownMenuRadioGroup value={viewMode} onValueChange={(value: ViewMode) => setViewMode(value)}>
                      <DropdownMenuRadioItem 
                        value="list" 
                        className="flex items-center gap-2 cursor-pointer px-2 py-1.5 outline-none hover:bg-gray-100 focus:bg-gray-100"
                      >
                        <List className="h-4 w-4" />
                        <span className="flex-1">List View</span>
                        {viewMode === 'list' && <Check className="h-4 w-4" />}
                      </DropdownMenuRadioItem>
                      <DropdownMenuRadioItem 
                        value="grid" 
                        className="flex items-center gap-2 cursor-pointer px-2 py-1.5 outline-none hover:bg-gray-100 focus:bg-gray-100"
                      >
                        <Grid className="h-4 w-4" />
                        <span className="flex-1">Grid View</span>
                        {viewMode === 'grid' && <Check className="h-4 w-4" />}
                      </DropdownMenuRadioItem>
                      <DropdownMenuRadioItem 
                        value="carousel" 
                        className="flex items-center gap-2 cursor-pointer px-2 py-1.5 outline-none hover:bg-gray-100 focus:bg-gray-100"
                      >
                        <ImageIcon className="h-4 w-4" />
                        <span className="flex-1">Carousel View</span>
                        {viewMode === 'carousel' && <Check className="h-4 w-4" />}
                      </DropdownMenuRadioItem>
                    </DropdownMenuRadioGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-8">
        <div className={`grid gap-4 ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' : ''}`}>
          {sortedAndFilteredCards.map(card => (
            <CardItem
              key={card.id}
              card={card}
              viewMode={viewMode}
              isSelected={selectedCards.has(card.id)}
              onSelect={() => handleCardSelect(card.id)}
              onClick={() => handleCardClick(card)}
              onEdit={() => handleCardClick(card)}
              onDelete={() => handleDeleteCard(card.id)}
            />
          ))}
        </div>

        {sortedAndFilteredCards.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No business cards found. Start by scanning some cards!
          </div>
        )}
      </div>

      {selectedCard && (
        <CardDetailView
          card={selectedCard}
          onClose={() => setSelectedCard(null)}
          onEdit={handleCardEdit}
          onDelete={handleDeleteCard}
        />
      )}

      <Dialog 
        open={showDuplicateManager} 
        onOpenChange={handleDuplicateManagerChange}
        modal={true}
      >
        <DialogContent 
          className="max-w-4xl h-[85vh] p-0 bg-white rounded-lg overflow-hidden"
          onInteractOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
          onPointerDownOutside={(e) => e.preventDefault()}
        >
          <DuplicateManager
            cards={cards}
            onMerge={handleMergeCard}
            onDelete={handleDeleteCard}
            onClose={handleDuplicateManagerClose}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
} 