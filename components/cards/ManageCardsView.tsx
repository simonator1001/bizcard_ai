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
  ChevronDown,
  Layout,
  Search,
  FileDown,
  Copy
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
import { GridMotion } from '@/components/ui/grid-motion';
import { Dock, DockIcon, DockItem, DockLabel } from '@/components/ui/dock';

type ViewMode = 'list' | 'grid' | 'grid-motion';
type SortField = 'name' | 'company' | 'title' | 'created_at';
type SortDirection = 'asc' | 'desc';

interface ManageCardsViewProps {
  setActiveTab: (tab: string) => void;
}

export function ManageCardsView({ setActiveTab }: ManageCardsViewProps) {
  const [cards, setCards] = useState<BusinessCard[]>([]);
  const [loading, setLoading] = useState(true);
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
      console.log('No user found, skipping card fetch');
      setLoading(false);
      setCards([]);
      return;
    }

    try {
      console.log('Fetching cards for user:', {
        id: user.id,
        email: user.email,
        role: user.role
      });
      setLoading(true);
      
      // Add connection check
      const { error: connectionError } = await supabase.from('business_cards').select('count', { count: 'exact', head: true });
      if (connectionError) {
        console.error('Database connection error:', connectionError);
        toast.error('Unable to connect to database. Please try again later.');
        setLoading(false);
        return;
      }

      // First, try to get the total count of cards
      const { count, error: countError } = await supabase
        .from('business_cards')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      if (countError) {
        console.error('Error getting card count:', countError);
        toast.error('Error loading cards. Please try refreshing the page.');
        setLoading(false);
        return;
      }

      console.log('Total cards in database:', count, 'for user:', user.id);

      // Then fetch the actual cards
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
        .order(sortField, { ascending: sortDirection === 'asc' });

      if (error) {
        console.error('Error fetching cards:', error);
        toast.error('Error loading cards. Please try refreshing the page.');
        setLoading(false);
        return;
      }

      // Transform the data to include images array with image_url
      const cardsWithImages = data?.map(card => ({
        ...card,
        images: card.image_url ? [card.image_url] : []
      })) || [];

      console.log('Transformed cards:', cardsWithImages);
      setCards(cardsWithImages);
    } catch (err) {
      console.error('Error in fetchCards:', err);
      toast.error('Failed to load business cards. Please check your connection.');
    } finally {
      setLoading(false);
    }
  }, [user, sortField, sortDirection]);

  // Add connection status check
  useEffect(() => {
    const checkConnection = async () => {
      try {
        const { error } = await supabase.from('business_cards').select('count', { count: 'exact', head: true });
        if (error) {
          console.error('Database connection error:', error);
          toast.error('Unable to connect to database. Please check your connection.');
        }
      } catch (err) {
        console.error('Connection check error:', err);
        toast.error('Connection error. Please check your network.');
      }
    };
    
    checkConnection();
  }, []);

  useEffect(() => {
    fetchCards();
  }, [fetchCards]);

  const handleMergeCard = useCallback(async (mergedCard: BusinessCard) => {
    if (!user) {
      toast.error('You must be signed in to merge cards');
      return;
    }

    try {
      const { error } = await supabase
        .from('business_cards')
        .upsert([{
          ...mergedCard,
          user_id: user.id,
          lastModified: new Date().toISOString()
        }]);
      
      if (error) {
        console.error('Error merging card:', error);
        throw error;
      }
      
      await fetchCards();
      toast.success('Cards merged successfully');
    } catch (error) {
      console.error('Error merging card:', error);
      toast.error('Failed to merge cards');
    }
  }, [user, fetchCards]);

  const handleDeleteCard = useCallback(async (cardId: string) => {
    if (!user) {
      toast.error('You must be signed in to delete cards');
      return;
    }

    try {
      const { error } = await supabase
        .from('business_cards')
        .delete()
        .eq('id', cardId)
        .eq('user_id', user.id);
      
      if (error) {
        console.error('Error deleting card:', error);
        throw error;
      }
      
      setCards(prev => prev.filter(card => card.id !== cardId));
      toast.success('Card deleted successfully');
    } catch (error) {
      console.error('Error deleting card:', error);
      toast.error('Failed to delete card');
    }
  }, [user]);

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

  // Filter and sort cards
  const filteredCards = cards.filter(card => {
    const searchLower = searchTerm.toLowerCase();
    return (
      card.name?.toLowerCase().includes(searchLower) ||
      card.name_zh?.toLowerCase().includes(searchLower) ||
      card.company?.toLowerCase().includes(searchLower) ||
      card.company_zh?.toLowerCase().includes(searchLower) ||
      card.title?.toLowerCase().includes(searchLower) ||
      card.title_zh?.toLowerCase().includes(searchLower) ||
      card.email?.toLowerCase().includes(searchLower)
    );
  });

  // Group cards by company
  const companiesMap = filteredCards.reduce((acc, card) => {
    const company = card.company || 'Unknown';
    if (!acc[company]) {
      acc[company] = [];
    }
    acc[company].push(card);
    return acc;
  }, {} as Record<string, BusinessCard[]>);

  // Get total contacts
  const totalContacts = filteredCards.length;

  // Get selected company data
  const selectedCompanyData = selectedCard?.company ? companiesMap[selectedCard.company] : [];

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-8">
        <h2 className="text-2xl font-semibold mb-4">Sign in to manage your business cards</h2>
        <p className="text-gray-600 mb-8">You need to be signed in to view and manage your business cards.</p>
        <Button onClick={() => window.location.href = '/signin'}>
          Sign In
        </Button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-sm text-gray-500">Loading your business cards...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 min-h-screen pb-8">
      <div className="flex justify-center w-full sticky top-0 z-10 bg-background/80 backdrop-blur-sm py-4">
        <div className="flex items-center w-[80%] max-w-[1200px]">
          <div className="flex items-center gap-2 w-full bg-white/50 backdrop-blur-sm rounded-full px-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                type="text"
                placeholder="Search cards..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-9 pl-9 text-sm border border-gray-200/50 focus:ring-0 bg-transparent rounded-full"
              />
            </div>
            
            <Dock 
              className="bg-neutral-900/90 backdrop-blur-sm border-0 rounded-full py-1.5 px-2" 
              magnification={40}
              distance={40}
              panelHeight={40}
            >
              <DockItem className="group">
                <DockLabel className="bg-neutral-900 border-neutral-800 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                  Date Added
                </DockLabel>
                <DockIcon>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-[28px] h-[28px] text-white hover:text-white hover:bg-white/10"
                  >
                    <span className="text-xs">Date</span>
                  </Button>
                </DockIcon>
              </DockItem>

              <DockItem className="group">
                <DockLabel className="bg-neutral-900 border-neutral-800 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                  List View
                </DockLabel>
                <DockIcon>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                      "w-[28px] h-[28px] text-white hover:text-white",
                      viewMode === 'list' ? "bg-white/20" : "hover:bg-white/10"
                    )}
                    onClick={() => setViewMode('list')}
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </DockIcon>
              </DockItem>

              <DockItem className="group">
                <DockLabel className="bg-neutral-900 border-neutral-800 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                  Grid View
                </DockLabel>
                <DockIcon>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                      "w-[28px] h-[28px] text-white hover:text-white",
                      viewMode === 'grid' ? "bg-white/20" : "hover:bg-white/10"
                    )}
                    onClick={() => setViewMode('grid')}
                  >
                    <Grid className="h-4 w-4" />
                  </Button>
                </DockIcon>
              </DockItem>

              <DockItem className="group">
                <DockLabel className="bg-neutral-900 border-neutral-800 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                  Motion View
                </DockLabel>
                <DockIcon>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                      "w-[28px] h-[28px] text-white hover:text-white",
                      viewMode === 'grid-motion' ? "bg-white/20" : "hover:bg-white/10"
                    )}
                    onClick={() => setViewMode('grid-motion')}
                  >
                    <Layout className="h-4 w-4" />
                  </Button>
                </DockIcon>
              </DockItem>

              <DockItem className="group">
                <DockLabel className="bg-neutral-900 border-neutral-800 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                  Manage Duplicates
                </DockLabel>
                <DockIcon>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-[28px] h-[28px] text-white hover:text-white hover:bg-white/10"
                    onClick={handleDuplicateManagerOpen}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </DockIcon>
              </DockItem>

              <DockItem className="group">
                <DockLabel className="bg-neutral-900 border-neutral-800 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                  Export CSV
                </DockLabel>
                <DockIcon>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-[28px] h-[28px] text-white hover:text-white hover:bg-white/10"
                    onClick={handleExportCSV}
                  >
                    <FileDown className="h-4 w-4" />
                  </Button>
                </DockIcon>
              </DockItem>
            </Dock>
          </div>
        </div>
      </div>

      {filteredCards.length === 0 ? (
        <div className="text-center py-12">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 mb-4">
            <ImageIcon className="h-6 w-6 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No business cards found</h3>
          <p className="text-gray-500 mb-4">
            {searchTerm ? 'Try adjusting your search terms' : 'Start by scanning some business cards'}
          </p>
          <Button onClick={() => setActiveTab('scan')}>
            Scan Business Card
          </Button>
        </div>
      ) : (
        <>
          {viewMode === 'grid-motion' ? (
            <div className="h-[calc(100vh-120px)] overflow-auto">
              <GridMotion
                items={filteredCards.map(card => (
                  <div key={card.id} className="p-4 space-y-2 cursor-pointer" onClick={() => setSelectedCard(card)}>
                    <div className="relative w-full aspect-[3/2] rounded-lg overflow-hidden bg-muted">
                      {card.image_url ? (
                        <Image
                          src={card.image_url}
                          alt={card.name || 'Business Card'}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-muted">
                          <ImageIcon className="h-8 w-8 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <p className="font-medium truncate">{card.name || card.name_zh}</p>
                    <p className="text-sm text-muted-foreground truncate">{card.title || card.title_zh}</p>
                    <p className="text-sm truncate">{card.company || card.company_zh}</p>
                  </div>
                ))}
                gradientColor="hsl(var(--background))"
                className="backdrop-blur-sm"
              />
            </div>
          ) : (
            <div className={cn(
              "grid gap-4 px-4",
              viewMode === 'grid' ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"
            )}>
              {filteredCards.map((card) => (
                <CardItem
                  key={card.id}
                  card={card}
                  viewMode={viewMode}
                  isSelected={selectedCards.has(card.id)}
                  onSelect={() => {
                    const newSelected = new Set(selectedCards);
                    if (newSelected.has(card.id)) {
                      newSelected.delete(card.id);
                    } else {
                      newSelected.add(card.id);
                    }
                    setSelectedCards(newSelected);
                  }}
                  onDelete={() => handleDeleteCard(card.id)}
                  onClick={() => setSelectedCard(card)}
                  onEdit={() => setSelectedCard(card)}
                />
              ))}
            </div>
          )}
        </>
      )}

      <Dialog open={!!selectedCard} onOpenChange={(open) => !open && setSelectedCard(null)}>
        <DialogContent className="max-w-3xl">
          {selectedCard && (
            <CardDetailView
              card={selectedCard}
              onClose={() => setSelectedCard(null)}
              onDelete={handleDeleteCard}
              onEdit={(updatedCard) => {
                // Update the card in the cards list
                setCards(prevCards => prevCards.map(c => c.id === updatedCard.id ? updatedCard : c));
                setSelectedCard(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showDuplicateManager} onOpenChange={handleDuplicateManagerChange}>
        <DialogContent className="max-w-4xl max-h-[80vh] bg-white/95 backdrop-blur-md border border-gray-200 overflow-hidden flex flex-col">
          <DuplicateManager
            cards={cards}
            onClose={handleDuplicateManagerClose}
            onMerge={handleMergeCard}
            onDelete={handleDeleteCard}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
} 