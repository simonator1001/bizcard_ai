'use client'

import { useState, useEffect } from 'react';
import { BusinessCard } from '@/types/business-card';
import { Button } from '@/components/ui/button';
import { Mail, Phone, MoreVertical, Pencil, Trash } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import { getImageUrl } from '@/lib/supabase-storage';
import Image from 'next/image';
import { ImageIcon } from 'lucide-react';

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

  useEffect(() => {
    async function loadImage() {
      if (card.image_url && !imageError) {
        try {
          // If the URL is already a full URL from our domain, use it directly
          if (card.image_url.startsWith(process.env.NEXT_PUBLIC_SUPABASE_URL || '')) {
            setImageUrl(card.image_url);
            setImageError(false);
            return;
          }

          // Otherwise, get the URL through our storage utility
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

  const renderAvatar = (size: 'sm' | 'md' | 'lg') => {
    const sizeClasses = {
      sm: 'h-12 w-12',
      md: 'h-20 w-20',
      lg: 'h-24 w-24'
    };

    return (
      <Avatar className={sizeClasses[size]}>
        {imageUrl && !imageError ? (
          <AvatarImage 
            src={imageUrl} 
            alt={card.name || ''} 
            onError={handleImageError}
          />
        ) : (
          <AvatarFallback>{initials}</AvatarFallback>
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

  // List view
  if (viewMode === 'list') {
    return (
      <div 
        className={cn(
          "relative p-4 rounded-lg border bg-card hover:bg-accent/5 transition-colors cursor-pointer",
          "hover:shadow-md transition-all",
          isSelected && "ring-2 ring-primary"
        )}
        onClick={onClick}
      >
        <div className="absolute right-2 top-2">
          <Checkbox
            checked={isSelected}
            onCheckedChange={() => onSelect()}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
        <div className="flex items-center gap-4">
          <div className="relative w-24 h-24 rounded-lg overflow-hidden bg-muted">
            {imageUrl && !imageError ? (
              <Image
                src={imageUrl}
                alt={card.name || 'Business Card'}
                fill
                className="object-cover"
                onError={handleImageError}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-muted">
                <ImageIcon className="h-8 w-8 text-muted-foreground" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-medium truncate">{card.name || card.name_zh}</p>
                <p className="text-sm text-muted-foreground truncate">{card.title || card.title_zh}</p>
                <p className="text-sm truncate">{card.company || card.company_zh}</p>
              </div>
              <div className="flex items-center gap-2">
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
                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDelete(); }} className="text-destructive">
                      <Trash className="mr-2 h-4 w-4" /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Grid view
  if (viewMode === 'grid') {
    return (
      <div 
        className={cn(
          "relative p-4 rounded-lg border bg-card hover:bg-accent/5 transition-colors cursor-pointer",
          "hover:shadow-md transition-all",
          isSelected && "ring-2 ring-primary"
        )}
        onClick={onClick}
      >
        <div className="absolute right-2 top-2 z-10">
          <Checkbox
            checked={isSelected}
            onCheckedChange={() => onSelect()}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
        <div className="relative w-full aspect-[3/2] rounded-lg overflow-hidden bg-muted mb-4">
          {imageUrl && !imageError ? (
            <Image
              src={imageUrl}
              alt={card.name || 'Business Card'}
              fill
              className="object-cover"
              onError={handleImageError}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-muted">
              <ImageIcon className="h-8 w-8 text-muted-foreground" />
            </div>
          )}
        </div>
        <div className="space-y-1">
          <p className="font-medium truncate">{card.name || card.name_zh}</p>
          <p className="text-sm text-muted-foreground truncate">{card.title || card.title_zh}</p>
          <p className="text-sm truncate">{card.company || card.company_zh}</p>
        </div>
        <div className="absolute bottom-4 right-4 flex items-center gap-2">
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
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDelete(); }} className="text-destructive">
                <Trash className="mr-2 h-4 w-4" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    );
  }

  // Carousel view
  return (
    <div 
      className={cn(
        "relative p-6 rounded-lg border bg-card hover:bg-accent/5 transition-colors cursor-pointer",
        "hover:shadow-md transition-all",
        isSelected && "ring-2 ring-primary"
      )}
      onClick={onClick}
    >
      <div className="absolute right-2 top-2 z-10">
        <Checkbox
          checked={isSelected}
          onCheckedChange={() => onSelect()}
          onClick={(e) => e.stopPropagation()}
        />
      </div>
      <div className="relative w-full aspect-[3/2] rounded-lg overflow-hidden bg-muted mb-4">
        {imageUrl && !imageError ? (
          <Image
            src={imageUrl}
            alt={card.name || 'Business Card'}
            fill
            className="object-cover"
            onError={handleImageError}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-muted">
            <ImageIcon className="h-8 w-8 text-muted-foreground" />
          </div>
        )}
      </div>
      <div className="space-y-2">
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
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDelete(); }} className="text-destructive">
              <Trash className="mr-2 h-4 w-4" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
} 