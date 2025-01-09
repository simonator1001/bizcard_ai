'use client'

import React from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Mail, Phone, MapPin, Trash2, Edit } from 'lucide-react'
import Image from 'next/image'
import { BusinessCard } from '@/types/business-card'

interface BusinessCardDetailsProps {
  card: BusinessCard
  onEdit: (card: BusinessCard) => void
  onDelete: (id: string) => void
  onClose: () => void
}

export function BusinessCardDetails({
  card,
  onEdit,
  onDelete,
  onClose,
}: BusinessCardDetailsProps) {
  const { t } = useTranslation()
  const [showDeleteAlert, setShowDeleteAlert] = React.useState(false)
  const initials = card.name
    ? card.name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
    : '?'

  const handleDelete = () => {
    setShowDeleteAlert(true)
  }

  const confirmDelete = () => {
    onDelete(card.id)
    setShowDeleteAlert(false)
    onClose()
  }

  return (
    <>
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="p-6">
          <div className="flex items-start gap-6">
            <Avatar className="h-24 w-24">
              {card.image_url ? (
                <div className="relative w-full h-full">
                  <Image
                    src={card.image_url}
                    alt={card.name || 'Business Card'}
                    fill
                    className="object-cover"
                  />
                </div>
              ) : (
                <AvatarFallback className="bg-primary/10 text-primary text-2xl">
                  {initials}
                </AvatarFallback>
              )}
            </Avatar>

            <div className="flex-1">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-semibold">
                    {card.name}
                    {card.name_zh && (
                      <span className="ml-2 text-gray-500">({card.name_zh})</span>
                    )}
                  </h2>
                  <p className="text-gray-600">
                    {card.title}
                    {card.title_zh && <span className="ml-2">({card.title_zh})</span>}
                  </p>
                  <p className="font-medium text-primary">
                    {card.company}
                    {card.company_zh && (
                      <span className="ml-2">({card.company_zh})</span>
                    )}
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEdit(card)}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    {t('actions.edit')}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDelete}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    {t('actions.delete')}
                  </Button>
                </div>
              </div>

              <div className="mt-6 space-y-4">
                {card.email && (
                  <div className="flex items-center">
                    <Mail className="h-5 w-5 text-gray-400 mr-3" />
                    <a
                      href={`mailto:${card.email}`}
                      className="text-primary hover:underline"
                    >
                      {card.email}
                    </a>
                  </div>
                )}

                {card.phone && (
                  <div className="flex items-center">
                    <Phone className="h-5 w-5 text-gray-400 mr-3" />
                    <a
                      href={`tel:${card.phone}`}
                      className="text-primary hover:underline"
                    >
                      {card.phone}
                    </a>
                  </div>
                )}

                {(card.address || card.address_zh) && (
                  <div className="flex items-center">
                    <MapPin className="h-5 w-5 text-gray-400 mr-3" />
                    <div>
                      {card.address && <div>{card.address}</div>}
                      {card.address_zh && (
                        <div className="text-gray-600">{card.address_zh}</div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {card.notes && (
                <div className="mt-6">
                  <h3 className="font-medium mb-2">{t('card.notes')}</h3>
                  <p className="text-gray-600">{card.notes}</p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('dialogs.deleteCard.title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('dialogs.deleteCard.description')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {t('dialogs.deleteCard.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              {t('dialogs.deleteCard.confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
} 