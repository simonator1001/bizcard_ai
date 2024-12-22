'use client'

import * as React from 'react'
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Mail, Edit2, Trash2, PenTool } from 'lucide-react'
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
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
import { useTranslation } from 'react-i18next'

interface BusinessCard {
  id: string
  name: string
  nameZh?: string
  title: string
  titleZh?: string
  company: string
  companyZh?: string
  email: string
  phone: string
  mobile?: string
  fax?: string
  wechat?: string
  instagram?: string
  linkedin?: string
  website?: string
  address?: string
  addressZh?: string
  department?: string
  departmentZh?: string
  whatsapp?: string
  line?: string
  telegram?: string
  facebook?: string
  twitter?: string
  image_url: string
  rawText?: string
  notes: string
  dateAdded?: string
}

interface BusinessCardDetailsProps {
  card: BusinessCard
  layout?: 'list' | 'grid' | 'scroll'
  onDelete?: (id: string) => void
  onEdit?: (id: string) => void
}

export const BusinessCardDetails: React.FC<BusinessCardDetailsProps> = ({
  card,
  layout = 'list',
  onDelete,
  onEdit
}) => {
  const { t } = useTranslation()
  const [showDeleteAlert, setShowDeleteAlert] = React.useState(false)
  const initials = card.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()

  const handleDelete = () => {
    setShowDeleteAlert(true)
  }

  const confirmDelete = () => {
    onDelete?.(card.id)
    setShowDeleteAlert(false)
  }

  return (
    <>
      <Card className="relative hover:shadow-md transition-shadow">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="text-2xl font-semibold bg-gradient-to-br from-purple-100 to-pink-100 text-purple-700">
                {initials}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <h3 className="text-xl font-semibold">
                    {card.name}
                    {card.nameZh && (
                      <span className="ml-2 text-gray-500">{card.nameZh}</span>
                    )}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {card.title}
                    {card.titleZh && (
                      <span className="ml-2">{card.titleZh}</span>
                    )}
                  </p>
                  <p className="text-base font-medium">
                    {card.company}
                    {card.companyZh && (
                      <span className="ml-2 text-gray-500">{card.companyZh}</span>
                    )}
                  </p>
                </div>

                <div className="flex gap-1">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => onEdit?.(card.id)}
                    title={t('actions.edit')}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={handleDelete}
                    title={t('actions.delete')}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    title={t('actions.email')}
                  >
                    <Mail className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    title={t('actions.notes')}
                  >
                    <PenTool className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-1">{t('card.contact')}</h4>
                  <div className="space-y-1">
                    {card.email && (
                      <p className="text-sm truncate">{card.email}</p>
                    )}
                    {card.phone && (
                      <p className="text-sm">{card.phone}</p>
                    )}
                    {card.mobile && (
                      <p className="text-sm">{card.mobile}</p>
                    )}
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-1">{t('card.address')}</h4>
                  <div className="space-y-1">
                    {card.address && (
                      <p className="text-sm">{card.address}</p>
                    )}
                    {card.addressZh && (
                      <p className="text-sm text-gray-500">{card.addressZh}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {card.image_url && layout !== 'list' && (
              <img 
                src={card.image_url} 
                alt={t('card.businessCardImage')}
                className="w-32 h-20 object-cover rounded-lg"
              />
            )}
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('dialogs.delete.title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('dialogs.delete.description')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('actions.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>
              {t('actions.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
} 