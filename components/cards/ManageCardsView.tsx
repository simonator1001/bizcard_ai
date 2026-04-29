import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useBusinessCards } from '@/lib/hooks/useBusinessCards';
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
  Copy,
  Filter,
  SlidersHorizontal,
  LayoutGrid,
  LayoutList
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
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Separator } from "@/components/ui/separator"
import { motion } from "framer-motion"
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
import Toolbar from "@/components/ui/Toolbar";

type ViewMode = 'list' | 'grid' | 'grid-motion';
type SortField = 'name' | 'company' | 'title' | 'created_at';
type SortDirection = 'asc' | 'desc';

interface ManageCardsViewProps {
  setActiveTab: (tab: string) => void;
}

export function ManageCardsView({ setActiveTab }: ManageCardsViewProps) {
  const { cards, loading, addCard, updateCard, deleteCard, refresh } = useBusinessCards();
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCards, setSelectedCards] = useState<Set<string>>(new Set());
  const [showDuplicateManager, setShowDuplicateManager] = useState(false);
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [selectedCard, setSelectedCard] = useState<BusinessCard | null>(null);
  const { user } = useAuth();
  const [filterType, setFilterType] = useState<'company' | 'name' | 'title' | null>(null);
  const [filterValue, setFilterValue] = useState<string | null>(null);

  // Use the AppWrite hook — cards fetched automatically

  const handleMergeCard = useCallback(async (mergedCard: BusinessCard) => {
    if (!user) {
      toast.error('You must be signed in to merge cards');
      return;
    }
    try {
      await updateCard(mergedCard.id, mergedCard);
      toast.success('Cards merged successfully');
    } catch (err) {
      console.error('Error in merge operation:', err);
      toast.error('Failed to merge cards');
    }
  }, [user, updateCard]);

  const handleDeleteCard = useCallback(async (cardId: string) => {
    if (!user) {
      toast.error('You must be signed in to delete cards');
      return;
    }
    try {
      await deleteCard(cardId);
      toast.success('Card deleted successfully');
    } catch (error) {
      console.error('Error deleting card:', error);
      toast.error('Failed to delete card');
    }
  }, [user, deleteCard]);

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
    const matchesSearch =
      card.name?.toLowerCase().includes(searchLower) ||
      card.name_zh?.toLowerCase().includes(searchLower) ||
      card.company?.toLowerCase().includes(searchLower) ||
      card.company_zh?.toLowerCase().includes(searchLower) ||
      card.title?.toLowerCase().includes(searchLower) ||
      card.title_zh?.toLowerCase().includes(searchLower) ||
      card.email?.toLowerCase().includes(searchLower);
    let matchesFilter = true;
    if (filterType && filterValue) {
      if (filterType === 'company') {
        matchesFilter = card.company === filterValue || card.company_zh === filterValue;
      } else if (filterType === 'name') {
        matchesFilter = card.name === filterValue || card.name_zh === filterValue;
      } else if (filterType === 'title') {
        matchesFilter = card.title === filterValue || card.title_zh === filterValue;
      }
    }
    return matchesSearch && matchesFilter;
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
    <div className="w-full max-w-7xl mx-auto px-4 py-6 space-y-6 overflow-x-hidden">
      {/* Enhanced Search and Toolbar */}
      <Toolbar
        onSearch={setSearchTerm}
        sortField={sortField}
        sortDirection={sortDirection}
        onSortChange={(field, direction) => {
          setSortField(field as SortField);
          setSortDirection(direction as SortDirection);
        }}
        viewMode={viewMode}
        onViewModeChange={(mode) => setViewMode(mode as ViewMode)}
        onExport={handleExportCSV}
        onManageDuplicates={handleDuplicateManagerOpen}
        className="mb-4"
        cards={cards}
        filterType={filterType}
        filterValue={filterValue}
        onFilterChange={(type, value) => {
          setFilterType(type);
          setFilterValue(value);
        }}
                    />

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
                // Card updated by AppWrite hook — just close detail view
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