'use client'

import { useState, useEffect, Fragment, useRef } from 'react';
import { BusinessCard } from '@/types/business-card';
import { Button } from '@/components/ui/button';
import { Mail, Phone, MoreVertical, Pencil, Trash, Share2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { getImageUrl } from '@/lib/image-storage';
import Image from 'next/image';

const THUMBNAIL_PLACEHOLDER = "flex items-center justify-center w-full h-full";

interface CardItemProps {
  card: BusinessCard;
  viewMode: 'list' | 'grid' | 'carousel';
  isSelected: boolean;
  onSelect: () => void;
  onClick: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function CardItem({
  card,
  viewMode,
  isSelected,
  onSelect,
  onClick,
  onEdit,
  onDelete,
}: CardItemProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const touchStartX = useRef(0);
  const touchCurrentX = useRef(0);

  // Swipe handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchCurrentX.current = e.touches[0].clientX;
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    touchCurrentX.current = e.touches[0].clientX;
    const diff = touchCurrentX.current - touchStartX.current;
    setSwipeOffset(Math.max(Math.min(diff, 0), -200));
  };
  const handleTouchEnd = () => {
    if (swipeOffset < -80) {
      setSwipeOffset(-160);
    } else {
      setSwipeOffset(0);
    }
  };
  const closeSwipe = () => setSwipeOffset(0);

  useEffect(() => {
    async function loadImage() {
      if (card.image_url && !imageError) {
        try {
          if (card.image_url.startsWith('https://') || card.image_url.startsWith('http://')) {
            setImageUrl(card.image_url);
            setImageError(false);
            return;
          }
          const url = await getImageUrl(card.image_url);
          if (url) {
            setImageUrl(url);
            setImageError(false);
          } else {
            setImageError(true);
          }
        } catch (error) {
          console.error('[CardItem] Error loading image:', error);
          setImageError(true);
        }
      }
    }
    loadImage();
  }, [card.image_url, imageError]);

  const handleImageError = () => {
    console.warn('[CardItem] Image failed to load:', card.image_url);
    setImageError(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick();
    }
    if (e.key === 'Delete' || (e.key === 'Backspace' && e.ctrlKey)) {
      e.preventDefault();
      setDeleteDialogOpen(true);
    }
  };

  const handleConfirmDelete = () => {
    setDeleteDialogOpen(false);
    onDelete();
  };

  const renderAvatar = (size: 'sm' | 'md' | 'lg') => {
    const sizeClasses = {
      sm: 'h-12 w-12',
      md: 'h-20 w-20',
      lg: 'h-24 w-24'
    };

    return (
      <Avatar className={sizeClasses[size]}>
        {(imageUrl && !imageError) ? (
          <AvatarImage 
            src={imageUrl} 
            alt={card.name || ''} 
            onError={handleImageError}
          />
        ) : (
          <AvatarFallback className="text-foreground font-medium">{initials}</AvatarFallback>
        )}
      </Avatar>
    );
  };

  const handleSelect = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect();
  };

  const initials = card.name
    ? card.name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
    : '?';

  const thumbGradient = "bg-gradient-to-br from-indigo-100 to-violet-100 dark:from-indigo-950/50 dark:to-violet-950/50";
  const thumbBorder = "border border-indigo-100/50 dark:border-indigo-900/30";

  const renderThumbnail = (size: 'sm' | 'lg') => {
    const dims = size === 'sm' 
      ? "w-24 h-16 rounded-md" 
      : "w-full aspect-[3/2] rounded-lg";
    const textSize = size === 'sm' ? "text-lg" : "text-3xl";
    
    // Prefer card image
    const displayUrl = imageUrl && !imageError ? imageUrl : null;
    
    if (displayUrl) {
      return (
        <Image
          src={displayUrl}
          alt={card.name || 'Business Card'}
          fill
          className="object-contain"
          onError={handleImageError}
        />
      );
    }
    return (
      <div className={`${THUMBNAIL_PLACEHOLDER}`}>
        <span className={`${textSize} font-bold text-indigo-400 dark:text-indigo-500`}>{initials}</span>
      </div>
    );
  };

  // ─── Swipe action buttons ───
  const swipeActionsRow = (
    <div className={cn(
      "flex items-center justify-end gap-2 px-4 py-2 transition-all duration-200",
      swipeOffset < -40 ? "opacity-100 max-h-12" : "opacity-0 max-h-0 py-0 overflow-hidden"
    )}>
      {card.email && (
        <a href={`mailto:${card.email}`} onClick={(e) => e.stopPropagation()}
          className="w-9 h-9 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 hover:bg-indigo-200 transition-colors">
          <Mail className="w-4 h-4" />
        </a>
      )}
      {card.phone && (
        <a href={`tel:${card.phone}`} onClick={(e) => e.stopPropagation()}
          className="w-9 h-9 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 hover:bg-emerald-200 transition-colors">
          <Phone className="w-4 h-4" />
        </a>
      )}
      <button onClick={(e) => { e.stopPropagation(); if (navigator.share && card.name) { navigator.share({ title: card.name, text: `${card.name} - ${card.title || ''} at ${card.company || ''}` }).catch(() => {}); } }}
        className="w-9 h-9 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center text-violet-600 dark:text-violet-400 hover:bg-violet-200 transition-colors">
        <Share2 className="w-4 h-4" />
      </button>
    </div>
  );

  const deleteDialog = (
    <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Business Card</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete the card for <strong>{card.name || card.name_zh}</strong>? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

  const dropdown = (
    <DropdownMenu>
      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
        <Button variant="ghost" size="sm">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(); }}>
          <Pencil className="mr-2 h-4 w-4" /> Edit
        </DropdownMenuItem>
        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setDeleteDialogOpen(true); }} className="text-destructive">
          <Trash className="mr-2 h-4 w-4" /> Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  // ─── List view ──────────────────────────────────────────
  if (viewMode === 'list') {
    return (
      <>
      <div className="relative overflow-hidden rounded-lg">
        <div 
          className={cn(
            "relative p-4 border bg-card hover:bg-accent/5 transition-all cursor-pointer",
            isSelected && "border-l-4 border-l-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20",
          )}
          style={{ 
            transform: `translateX(${swipeOffset}px)`,
            transition: swipeOffset === 0 ? 'transform 0.2s ease' : 'none',
          }}
          onClick={() => { if (swipeOffset < 0) closeSwipe(); else onClick(); }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onKeyDown={handleKeyDown}
          tabIndex={0}
          role="button"
          aria-label={`Business card for ${card.name || card.name_zh}`}
        >
        <div className="absolute right-3 top-3 z-10">
          <button
            onClick={(e) => { e.stopPropagation(); onSelect(); }}
            className={cn(
              "w-5 h-5 min-h-0 rounded-full border-2 flex items-center justify-center transition-all",
              isSelected 
                ? "border-indigo-500 bg-indigo-500" 
                : "border-gray-300 dark:border-gray-600 hover:border-indigo-400"
            )}
          >
            {isSelected && (
              <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none">
                <path d="M2.5 6L5 8.5L9.5 3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
          </button>
        </div>
        <div className="flex items-center gap-3">
          <div className={`relative w-16 h-12 rounded-lg overflow-hidden flex-shrink-0 ${thumbGradient} ${thumbBorder}`}>
            {renderThumbnail('sm')}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold truncate">{card.name || card.name_zh}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {[card.company, card.title].filter(Boolean).join(' · ') || card.company_zh || card.title_zh}
                </p>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                {card.email && (
                  <a href={`mailto:${card.email}`} className="text-muted-foreground hover:text-indigo-500 transition-colors" onClick={(e) => e.stopPropagation()}>
                    <Mail className="h-3.5 w-3.5" />
                  </a>
                )}
                {card.phone && (
                  <a href={`tel:${card.phone}`} className="text-muted-foreground hover:text-emerald-500 transition-colors" onClick={(e) => e.stopPropagation()}>
                    <Phone className="h-3.5 w-3.5" />
                  </a>
                )}
                {dropdown}
              </div>
            </div>
          </div>
        </div>
        </div>
      </div>
      {swipeActionsRow}
      {deleteDialog}
      </>
    );
  }

  // ─── Grid view ──────────────────────────────────────────
  if (viewMode === 'grid') {
    return (
      <>
      <div 
        className={cn(
          "relative p-4 rounded-lg border bg-card hover:bg-accent/5 transition-colors cursor-pointer hover:shadow-md",
          isSelected && "border-l-4 border-l-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20"
        )}
        onClick={onClick}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        role="button"
        aria-label={`Business card for ${card.name || card.name_zh}`}
      >
        <div className="absolute right-3 top-3 z-10">
          <button
            onClick={(e) => { e.stopPropagation(); onSelect(); }}
            className={cn(
              "w-5 h-5 min-h-0 rounded-full border-2 flex items-center justify-center transition-all bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm",
              isSelected 
                ? "border-indigo-500 bg-indigo-500" 
                : "border-gray-300 dark:border-gray-600 hover:border-indigo-400"
            )}
          >
            {isSelected && (
              <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none">
                <path d="M2.5 6L5 8.5L9.5 3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
          </button>
        </div>
        <div className={`relative w-full aspect-[3/2] rounded-lg overflow-hidden mb-4 ${thumbGradient} ${thumbBorder}`}>
          {renderThumbnail('lg')}
        </div>
        <div className="overflow-hidden space-y-1">
          <p className="font-medium truncate">{card.name || card.name_zh}</p>
          <p className="text-sm text-muted-foreground truncate">{card.title || card.title_zh}</p>
          <p className="text-sm truncate">{card.company || card.company_zh}</p>
        </div>
        <div className="absolute bottom-4 right-4 flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="sm" className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm hover:bg-white dark:hover:bg-gray-800 shadow-sm">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(); }}>
                <Pencil className="mr-2 h-4 w-4" /> Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setDeleteDialogOpen(true); }} className="text-destructive">
                <Trash className="mr-2 h-4 w-4" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      {deleteDialog}
      </>
    );
  }

  // ─── Carousel (default) ─────────────────────────────────
  return (
    <>
    <div 
      className={cn(
        "relative p-6 rounded-lg border bg-card hover:bg-accent/5 transition-colors cursor-pointer hover:shadow-md",
        isSelected && "border-l-4 border-l-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20"
      )}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-label={`Business card for ${card.name || card.name_zh}`}
    >
      <div className="absolute right-3 top-3 z-10">
          <button
            onClick={(e) => { e.stopPropagation(); onSelect(); }}
            className={cn(
              "w-5 h-5 min-h-0 rounded-full border-2 flex items-center justify-center transition-all bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm",
              isSelected 
                ? "border-indigo-500 bg-indigo-500" 
                : "border-gray-300 dark:border-gray-600 hover:border-indigo-400"
            )}
          >
            {isSelected && (
              <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none">
                <path d="M2.5 6L5 8.5L9.5 3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
          </button>
        </div>
      <div className={`relative w-full aspect-[3/2] rounded-lg overflow-hidden mb-4 ${thumbGradient} ${thumbBorder}`}>
        {renderThumbnail('lg')}
      </div>
      <div className="overflow-hidden space-y-2">
        <p className="text-xl font-medium truncate">{card.name || card.name_zh}</p>
        <p className="text-sm text-muted-foreground truncate">{card.title || card.title_zh}</p>
        <p className="text-sm font-medium truncate">{card.company || card.company_zh}</p>
      </div>
      <div className="flex justify-center space-x-2 mt-4">
        {card.email && (
          <a
            href={`mailto:${card.email}`}
            className="text-muted-foreground hover:text-primary"
            onClick={(e) => e.stopPropagation()}
          >
            <Mail className="h-4 w-4" />
          </a>
        )}
        {card.phone && (
          <a
            href={`tel:${card.phone}`}
            className="text-muted-foreground hover:text-primary"
            onClick={(e) => e.stopPropagation()}
          >
            <Phone className="h-4 w-4" />
          </a>
        )}
        {dropdown}
      </div>
    </div>
    {deleteDialog}
    </>
  );
}
