'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Mail, Edit2, Trash2, Phone, Smartphone, Globe } from 'lucide-react'
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import type { BusinessCard } from '@/types/business-card'

interface CardItemProps {
  card: BusinessCard
  onEdit: (card: BusinessCard) => void
  onDelete: (id: string) => void
  viewMode: 'list' | 'grid'
}

export function CardItem({ card, onEdit, onDelete, viewMode }: CardItemProps) {
  const [isHovered, setIsHovered] = useState(false)
  const initials = card.name.split(' ').map(n => n[0]).join('').toUpperCase()

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.2 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      onClick={() => onEdit(card)}
      className="cursor-pointer"
    >
      <Card className={`relative overflow-hidden transition-shadow duration-200 ${isHovered ? 'shadow-lg' : 'shadow'}`}>
        <CardContent className={`p-6 ${viewMode === 'list' ? 'flex gap-6' : ''}`}>
          <div className={viewMode === 'list' ? 'flex-shrink-0' : 'mb-4'}>
            <Avatar className={viewMode === 'list' ? 'h-16 w-16' : 'h-20 w-20 mx-auto'}>
              {card.image_url ? (
                <img src={card.image_url} alt={card.name} className="object-cover" />
              ) : (
                <AvatarFallback className="bg-primary/10 text-primary text-xl">
                  {initials}
                </AvatarFallback>
              )}
            </Avatar>
          </div>

          <div className="flex-1">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold text-lg">{card.name}</h3>
                <p className="text-sm text-muted-foreground">{card.title}</p>
                <p className="text-sm font-medium text-primary">{card.company}</p>
              </div>
              
              <div className="flex gap-1">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(card.id);
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="mt-4 space-y-2">
              {card.email && (
                <a 
                  href={`mailto:${card.email}`}
                  className="flex items-center text-sm text-muted-foreground hover:text-primary"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Mail className="h-4 w-4 mr-2" />
                  {card.email}
                </a>
              )}
              {card.phone && (
                <a 
                  href={`tel:${card.phone}`}
                  className="flex items-center text-sm text-muted-foreground hover:text-primary"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Phone className="h-4 w-4 mr-2" />
                  {card.phone}
                </a>
              )}
              {card.mobile && (
                <a 
                  href={`tel:${card.mobile}`}
                  className="flex items-center text-sm text-muted-foreground hover:text-primary"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Smartphone className="h-4 w-4 mr-2" />
                  {card.mobile}
                </a>
              )}
              {card.website && (
                <a 
                  href={card.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center text-sm text-muted-foreground hover:text-primary"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Globe className="h-4 w-4 mr-2" />
                  {card.website}
                </a>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
} 