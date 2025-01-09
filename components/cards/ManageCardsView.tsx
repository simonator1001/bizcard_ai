import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase-client';
import { Mail, Phone, MapPin, Users, Trash2, Download, X } from 'lucide-react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CardItem } from './CardItem';
import { DuplicateManager } from './DuplicateManager';
import type { BusinessCard } from '@/types/business-card';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { downloadCSV } from '@/lib/csv-utils';
import { cn } from '@/lib/utils';

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
  const { user } = useAuth();

  const fetchCards = useCallback(async () => {
    if (!user) {
      console.log('No user found');
      return;
    }

    console.log('Fetching cards for user:', user.id);
    
    const { data, error } = await supabase
      .from('business_cards')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching cards:', error);
      return;
    }

    console.log('Fetched cards:', data);
    setCards(data || []);
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
                <Select 
                  value={sortField} 
                  onValueChange={(value: SortField) => setSortField(value)}
                >
                  <SelectTrigger className="w-[120px]">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="created_at">Date Added</SelectItem>
                    <SelectItem value="name">Name</SelectItem>
                    <SelectItem value="company">Company</SelectItem>
                    <SelectItem value="title">Title</SelectItem>
                  </SelectContent>
                </Select>
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
                <Select value={viewMode} onValueChange={(value: ViewMode) => setViewMode(value)}>
                  <SelectTrigger className="w-[120px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="list">List</SelectItem>
                    <SelectItem value="grid">Grid</SelectItem>
                    <SelectItem value="carousel">Carousel</SelectItem>
                  </SelectContent>
                </Select>
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
              onEdit={() => {}}
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