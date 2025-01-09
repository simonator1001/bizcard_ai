'use client'

import { BusinessCard } from '@/types/business-card';
import { PremiumButton } from '@/components/ui';
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

interface CardItemProps {
  card: BusinessCard;
  viewMode: 'list' | 'grid' | 'carousel';
  isSelected: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function CardItem({ card, viewMode, isSelected, onSelect, onEdit, onDelete }: CardItemProps) {
  const initials = card.name
    ? card.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
    : '?';

  const handleSelect = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('Selecting card:', card.id);
    onSelect();
  };

  const handleCheckboxChange = () => {
    console.log('Checkbox clicked for card:', card.id);
    onSelect();
  };

  if (viewMode === 'list') {
    return (
      <div 
        className={cn(
          "relative flex items-center space-x-4 rounded-lg border p-4",
          "hover:bg-accent/50 transition-colors cursor-pointer select-none",
          isSelected && "bg-accent"
        )}
        onClick={handleSelect}
      >
        <div 
          className="absolute left-4 top-1/2 transform -translate-y-1/2"
          onClick={(e) => {
            e.stopPropagation();
            handleCheckboxChange();
          }}
        >
          <Checkbox
            id={`card-${card.id}`}
            checked={isSelected}
            onCheckedChange={handleCheckboxChange}
            className="cursor-pointer"
          />
        </div>
        <div className="flex items-center space-x-4 pl-8">
          <Avatar className="h-12 w-12">
            {card.image_url ? (
              <AvatarImage src={card.image_url} alt={card.name || ''} />
            ) : (
              <AvatarFallback>{initials}</AvatarFallback>
            )}
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">{card.name}</p>
            <p className="text-sm text-muted-foreground">{card.title}</p>
            <p className="text-sm text-muted-foreground">{card.company}</p>
          </div>
          <div className="flex items-center space-x-2">
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
                <PremiumButton variant="ghost" size="icon">
                  <MoreVertical className="h-4 w-4" />
                </PremiumButton>
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
    );
  }

  if (viewMode === 'grid') {
    return (
      <div 
        className={cn(
          "relative group rounded-lg border",
          "hover:shadow-md transition-all",
          isSelected && "ring-2 ring-primary"
        )}
        onClick={handleSelect}
      >
        <div className="absolute right-2 top-2 z-10">
          <Checkbox
            checked={isSelected}
            onCheckedChange={() => onSelect()}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
        <div className="p-4">
          <div className="flex items-center space-x-4">
            <Avatar className="h-12 w-12">
              {card.image_url ? (
                <AvatarImage src={card.image_url} alt={card.name || ''} />
              ) : (
                <AvatarFallback>{initials}</AvatarFallback>
              )}
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">{card.name}</p>
              <p className="text-sm text-muted-foreground">{card.title}</p>
              <p className="text-sm text-muted-foreground">{card.company}</p>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between">
            <div className="flex space-x-2">
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
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <PremiumButton variant="ghost" size="icon">
                  <MoreVertical className="h-4 w-4" />
                </PremiumButton>
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
    );
  }

  // Carousel view
  return (
    <div 
      className={cn(
        "relative aspect-[3/4] rounded-lg border",
        "hover:shadow-md transition-all",
        isSelected && "ring-2 ring-primary"
      )}
      onClick={handleSelect}
    >
      <div className="absolute right-2 top-2 z-10">
        <Checkbox
          checked={isSelected}
          onCheckedChange={() => onSelect()}
          onClick={(e) => e.stopPropagation()}
        />
      </div>
      <div className="h-full p-6 flex flex-col items-center justify-center text-center">
        <Avatar className="h-24 w-24 mb-4">
          {card.image_url ? (
            <AvatarImage src={card.image_url} alt={card.name || ''} />
          ) : (
            <AvatarFallback className="text-xl">{initials}</AvatarFallback>
          )}
        </Avatar>
        <h3 className="font-medium">{card.name}</h3>
        <p className="text-sm text-muted-foreground">{card.title}</p>
        <p className="text-sm text-muted-foreground">{card.company}</p>
        <div className="mt-4 flex items-center space-x-4">
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
              <PremiumButton variant="ghost" size="icon">
                <MoreVertical className="h-4 w-4" />
              </PremiumButton>
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
  );
} 