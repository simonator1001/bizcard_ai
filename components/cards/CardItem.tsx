'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Mail, Trash2, Phone } from 'lucide-react'
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import type { BusinessCard } from '@/types/business-card'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import Image from 'next/image'

interface CardItemProps {
  card: BusinessCard
  onEdit: (card: BusinessCard) => void
  onDelete: (id: string) => void
  viewMode: 'list' | 'grid'
}

export function CardItem({ card, onEdit, onDelete, viewMode }: CardItemProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [showDeleteAlert, setShowDeleteAlert] = useState(false)
  const initials = card.name.split(' ').map(n => n[0]).join('').toUpperCase()

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    setShowDeleteAlert(true)
  }

  const confirmDelete = () => {
    onDelete(card.id)
    setShowDeleteAlert(false)
  }

  return (
    <>
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
                {card.imageUrl ? (
                  <div className="relative w-full h-full">
                    <Image 
                      src={card.imageUrl} 
                      alt={card.name} 
                      fill
                      className="object-cover"
                    />
                  </div>
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
                    onClick={handleDelete}
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
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Business Card</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this business card? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
} 