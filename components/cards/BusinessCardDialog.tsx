import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Mail, Phone } from 'lucide-react'
import { BusinessCard } from '@/types/business-card'
import { useTranslation } from 'react-i18next'
import Image from 'next/image'

interface BusinessCardDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  card: BusinessCard
  mode?: 'view' | 'edit'
}

export function BusinessCardDialog({ 
  open, 
  onOpenChange, 
  card,
  mode = 'view'
}: BusinessCardDialogProps) {
  const { t } = useTranslation()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[800px] p-0 bg-white">
        <div className="flex">
          {/* Left side - Card Image */}
          <div className="w-1/2 p-6 border-r border-gray-200">
            <div className="aspect-[1.586/1] relative bg-gray-100 rounded-lg overflow-hidden">
              {card.imageUrl ? (
                <Image 
                  src={card.imageUrl} 
                  alt={t('card.imageAlt', { name: card.name })}
                  className="object-cover"
                  fill
                  sizes="(max-width: 800px) 50vw"
                  priority
                />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">
                  {t('card.noImage')}
                </div>
              )}
            </div>
          </div>

          {/* Right side - Card Details */}
          <div className="w-1/2 p-6">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold">{t('dialogs.cardDetails.title')}</DialogTitle>
            </DialogHeader>
            
            <div className="mt-6 space-y-6">
              {/* Basic Info */}
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16 border border-gray-200">
                    <AvatarImage src={card.imageUrl} alt={card.name} />
                    <AvatarFallback>{card.name?.substring(0, 2) || 'NA'}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-lg font-semibold">{card.name}</h3>
                    <p className="text-sm text-gray-500">{card.position}</p>
                    <p className="text-sm text-gray-500">{card.company}</p>
                  </div>
                </div>
              </div>

              {/* Contact Info */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-gray-500">{t('card.contactInfo')}</h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <span>{card.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <span>{card.phone}</span>
                  </div>
                </div>
              </div>

              {/* Additional Details */}
              {card.title && (
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-gray-500">{t('card.title')}</h4>
                  <p className="text-sm">{card.title}</p>
                </div>
              )}
              {card.titleZh && (
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-gray-500">{t('card.titleZh')}</h4>
                  <p className="text-sm">{card.titleZh}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 