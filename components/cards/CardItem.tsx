'use client'

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
  const initials = card.name
    ? card.name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
    : '?';

  const handleSelect = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect();
  };

  if (viewMode === 'list') {
    return (
      <div 
        className={cn(
          "relative p-4 rounded-lg border bg-card hover:bg-accent/5 transition-colors cursor-pointer",
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
                <Button variant="ghost" size="icon-sm">
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
    );
  }

  if (viewMode === 'grid') {
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
        <div className="flex flex-col items-center text-center space-y-4">
          <Avatar className="h-20 w-20">
            {card.image_url ? (
              <AvatarImage src={card.image_url} alt={card.name || ''} />
            ) : (
              <AvatarFallback>{initials}</AvatarFallback>
            )}
          </Avatar>
          <div className="space-y-2">
            <p className="text-lg font-medium">{card.name}</p>
            <p className="text-sm text-muted-foreground">{card.title}</p>
            <p className="text-sm font-medium text-muted-foreground">{card.company}</p>
          </div>
          <div className="flex justify-center space-x-2">
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
                <Button variant="ghost" size="icon-sm">
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
      <div className="flex flex-col items-center text-center space-y-4">
        <Avatar className="h-24 w-24">
          {card.image_url ? (
            <AvatarImage src={card.image_url} alt={card.name || ''} />
          ) : (
            <AvatarFallback>{initials}</AvatarFallback>
          )}
        </Avatar>
        <div className="space-y-2">
          <p className="text-xl font-medium">{card.name}</p>
          <p className="text-sm text-muted-foreground">{card.title}</p>
          <p className="text-sm font-medium text-muted-foreground">{card.company}</p>
        </div>
        <div className="flex justify-center space-x-2">
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
              <Button variant="ghost" size="icon-sm">
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
  );
} 