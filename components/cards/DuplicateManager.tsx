import React, { useState, useCallback, useEffect } from 'react';
import type { BusinessCard } from '@/types/business-card';
import { findDuplicates, mergeCards, DuplicateGroup } from '@/lib/duplicate-manager';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Check, X, Users, Search } from 'lucide-react';
import { DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';

interface DuplicateManagerProps {
  cards: BusinessCard[];
  onMerge: (mergedCard: BusinessCard) => Promise<void>;
  onDelete: (cardId: string) => Promise<void>;
  onClose: () => void;
}

export function DuplicateManager({ cards, onMerge, onDelete, onClose }: DuplicateManagerProps) {
  const [duplicateGroups, setDuplicateGroups] = useState<DuplicateGroup[]>([]);
  const [processing, setProcessing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    // Debug: log all emails and their normalized forms
    if (cards && cards.length > 0) {
      console.log('[DuplicateManager] Card emails:');
      cards.forEach(card => {
        if (card.email) {
          console.log(`Raw: '${card.email}' | Normalized: '${card.email.toLowerCase().trim()}'`);
        } else {
          console.log('No email:', card);
        }
      });
      // Log all cards with the target email
      const targetEmail = 'macy.yy.ng@hkcs.com';
      const matchingCards = cards.filter(card => card.email && card.email.toLowerCase().trim() === targetEmail);
      if (matchingCards.length > 0) {
        console.log(`[DuplicateManager] All cards with email '${targetEmail}':`, matchingCards);
      }
      // Log all cards with any email containing 'macy' (case-insensitive)
      const macyCards = cards.filter(card => card.email && card.email.toLowerCase().includes('macy'));
      if (macyCards.length > 0) {
        console.log(`[DuplicateManager] All cards with email containing 'macy':`, macyCards);
      }
    }
    setDuplicateGroups(findDuplicates(cards));
  }, [cards]);

  const filteredGroups = duplicateGroups.filter(group => 
    group.cards.some(card => 
      String(card.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(card.company || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(card.title || '').toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const handleMerge = useCallback(async (group: DuplicateGroup) => {
    if (processing) return;
    
    try {
      setProcessing(true);
      const mergedCard = mergeCards(group.cards);
      await onMerge(mergedCard);
      
      // Remove merged cards except the primary one
      const deletePromises = group.cards
        .filter(card => card.id !== mergedCard.id)
        .map(card => onDelete(card.id));
      await Promise.all(deletePromises);
      
      // Update duplicate groups
      setDuplicateGroups(prevGroups => prevGroups.filter(g => g !== group));
    } catch (error) {
      console.error('Error merging cards:', error);
    } finally {
      setProcessing(false);
    }
  }, [onMerge, onDelete, processing]);

  const handleKeepPrimary = useCallback(async (group: DuplicateGroup) => {
    if (processing) return;
    
    try {
      setProcessing(true);
      // Delete all cards except the primary one
      const deletePromises = group.cards
        .filter(card => card.id !== group.primaryCard.id)
        .map(card => onDelete(card.id));
      await Promise.all(deletePromises);
      
      // Update duplicate groups
      setDuplicateGroups(prevGroups => prevGroups.filter(g => g !== group));
    } catch (error) {
      console.error('Error removing duplicates:', error);
    } finally {
      setProcessing(false);
    }
  }, [onDelete, processing]);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  }, []);

  // Add a handler to merge all groups
  const handleMergeAll = useCallback(async () => {
    if (processing || filteredGroups.length === 0) return;
    setProcessing(true);
    try {
      for (const group of filteredGroups) {
        const mergedCard = mergeCards(group.cards);
        await onMerge(mergedCard);
        const deletePromises = group.cards
          .filter(card => card.id !== mergedCard.id)
          .map(card => onDelete(card.id));
        await Promise.all(deletePromises);
        setDuplicateGroups(prevGroups => prevGroups.filter(g => g !== group));
      }
      // Optionally, show a toast or alert here
      // alert('All duplicate groups merged successfully!');
    } catch (error) {
      console.error('Error merging all groups:', error);
    } finally {
      setProcessing(false);
    }
  }, [filteredGroups, onMerge, onDelete, processing]);

  return (
    <div className="flex flex-col h-[calc(100vh-200px)]">
      <DialogHeader className="px-6 py-4 border-b shrink-0">
        <DialogTitle className="text-xl">Manage Duplicate Cards</DialogTitle>
        <DialogDescription>
          Review and manage duplicate business cards in your collection
        </DialogDescription>
        <div className="mt-4 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search duplicates..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="pl-9"
          />
        </div>
      </DialogHeader>
      
      <div className="flex-1 overflow-y-auto">
        <ScrollArea className="h-full">
          <div className="px-6 py-6">
            {filteredGroups.length > 1 && (
              <div className="mb-4 flex justify-end">
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleMergeAll}
                  disabled={processing}
                  type="button"
                >
                  <Check className="w-4 h-4 mr-2" />
                  Merge All Groups
                </Button>
              </div>
            )}
            {filteredGroups.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Users className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground text-sm">
                  {searchTerm ? 'No matching duplicate cards found' : 'No duplicate cards found'}
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {filteredGroups.map((group, index) => (
                  <div 
                    key={`group-${index}-${group.primaryCard.id}`}
                    className="rounded-lg border bg-card shadow-sm transition-all hover:shadow-md"
                  >
                    <div className="p-4 space-y-4">
                      <div className="flex items-center justify-between border-b pb-4">
                        <h3 className="font-medium">Duplicate Group {index + 1}</h3>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleKeepPrimary(group)}
                            disabled={processing}
                            type="button"
                          >
                            <Check className="w-4 h-4 mr-2" />
                            Keep Primary
                          </Button>
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => handleMerge(group)}
                            disabled={processing}
                            type="button"
                          >
                            <Check className="w-4 h-4 mr-2" />
                            Merge All
                          </Button>
                        </div>
                      </div>
                      <div className="grid gap-4">
                        {group.cards.map((card) => (
                          <div
                            key={card.id}
                            className={cn(
                              "p-4 rounded-lg border transition-all",
                              card.id === group.primaryCard.id
                                ? "bg-purple-50 border-purple-200 dark:bg-purple-900/20 dark:border-purple-800"
                                : "bg-background hover:bg-muted/50"
                            )}
                          >
                            <div className="flex items-start justify-between">
                              <div className="space-y-1">
                                <p className="font-medium">
                                  {card.name || card.name_zh}
                                  {card.name && card.name_zh && ` (${card.name_zh})`}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {card.title || card.title_zh}
                                  {card.title && card.title_zh && ` (${card.title_zh})`}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {card.company || card.company_zh}
                                  {card.company && card.company_zh && ` (${card.company_zh})`}
                                </p>
                                {card.email && (
                                  <p className="text-sm text-muted-foreground">{card.email}</p>
                                )}
                              </div>
                              {card.id === group.primaryCard.id && (
                                <span className="px-2 py-1 text-xs font-medium text-purple-700 bg-purple-100 rounded-full dark:text-purple-300 dark:bg-purple-900/40">
                                  Primary
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
      
      <DialogFooter className="px-6 py-4 border-t shrink-0 bg-white dark:bg-gray-900">
        <Button variant="ghost" onClick={onClose} type="button">
          <X className="w-4 h-4 mr-2" />
          Close
        </Button>
      </DialogFooter>
    </div>
  );
} 