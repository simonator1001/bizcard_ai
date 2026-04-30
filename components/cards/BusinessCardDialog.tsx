import { useTranslation } from 'react-i18next'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Edit2, Trash2, Share2 } from 'lucide-react'
import Image from 'next/image'
import { BusinessCard } from '@/types/business-card'
import { BusinessCardDetails } from './BusinessCardDetails'
import { ShareDialog } from './ShareDialog'
import { useState } from 'react'

interface BusinessCardDialogProps {
  card: BusinessCard
  isOpen: boolean
  onClose: () => void
  onEdit: (card: BusinessCard) => void
  onDelete: (id: string) => void
}

export function BusinessCardDialog({
  card,
  isOpen,
  onClose,
  onEdit,
  onDelete,
}: BusinessCardDialogProps) {
  const { t } = useTranslation()
  const [showShareDialog, setShowShareDialog] = useState(false)

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl p-0 bg-white text-gray-900">
          <div className="flex">
            <div className="w-1/2 p-6 border-r border-gray-200">
              <div className="aspect-[1.586/1] relative bg-gray-100 rounded-lg overflow-hidden">
                {card.image_url ? (
                  <Image 
                    src={card.image_url} 
                    alt={t('card.imageAlt', { name: card.name })}
                    fill
                    className="object-contain"
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-400">
                    {t('card.noImage')}
                  </div>
                )}
              </div>
              <div className="mt-4 flex justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowShareDialog(true)}
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  {t('actions.share')}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEdit(card)}
                >
                  <Edit2 className="h-4 w-4 mr-2" />
                  {t('actions.edit')}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onDelete(card.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  {t('actions.delete')}
                </Button>
              </div>
            </div>
            <div className="w-1/2 p-6">
              <BusinessCardDetails
                card={card}
                onEdit={onEdit}
                onDelete={onDelete}
                onClose={onClose}
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ShareDialog
        card={card}
        open={showShareDialog}
        onOpenChange={setShowShareDialog}
      />
    </>
  )
} 