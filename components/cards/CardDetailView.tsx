import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Edit, Share, Download, Trash2, X } from 'lucide-react'
import { toast } from 'sonner'
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
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

interface CardDetailViewProps {
  card: BusinessCard
  onClose: () => void
  onEdit: (updatedCard: BusinessCard) => void
  onDelete: (id: string) => void
}

const defaultLabels = {
  title: 'Business Card Details',
  description: 'View and edit business card information',
  nameEnglish: 'Name (English)',
  nameChinese: 'Name (Chinese)',
  companyEnglish: 'Company (English)',
  companyChinese: 'Company (Chinese)',
  titleEnglish: 'Title (English)',
  titleChinese: 'Title (Chinese)',
  email: 'Email',
  phone: 'Phone',
  addressEnglish: 'Address (English)',
  addressChinese: 'Address (Chinese)',
  remarks: 'Remarks',
  noImage: 'No image available'
};

export function CardDetailView({ card, onClose, onEdit, onDelete }: CardDetailViewProps) {
  const { t } = useTranslation();
  const [editedCard, setEditedCard] = useState<BusinessCard>(card);
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [isImageEnlarged, setIsImageEnlarged] = useState(false);

  const containsChinese = (text: string) => /[\u4e00-\u9fa5]/.test(text);
  const containsEnglish = (text: string) => /[a-zA-Z]/.test(text);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name.endsWith('_zh') && containsEnglish(value)) {
      toast.error(t('errors.chineseOnly', 'This field only accepts Chinese characters'));
      return;
    }
    if (!name.endsWith('_zh') && name !== 'email' && name !== 'phone' && name !== 'notes' && containsChinese(value)) {
      toast.error(t('errors.englishOnly', 'This field only accepts English characters'));
      return;
    }

    setEditedCard(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    onEdit(editedCard);
    setIsEditing(false);
  };

  const handleDownload = async () => {
    try {
      if (!editedCard.image_url) {
        toast.error(t('card.download.noImage', 'No image available to download'));
        return;
      }

      const response = await fetch(editedCard.image_url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const sanitizedName = editedCard.name?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'card';
      const sanitizedCompany = editedCard.company?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'company';
      link.download = `${sanitizedName}_${sanitizedCompany}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success(t('card.download.success', 'Business card image downloaded successfully'));
    } catch (error) {
      console.error('Error downloading image:', error);
      toast.error(t('card.download.error', 'Failed to download business card image'));
    }
  };

  const handleDelete = () => {
    setShowDeleteAlert(true)
  }

  const confirmDelete = () => {
    onDelete(editedCard.id)
    setShowDeleteAlert(false)
    onClose()
  }

  return (
    <>
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="max-w-3xl h-[90vh] flex flex-col bg-white">
          <DialogHeader className="flex-shrink-0 border-b p-4">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-xl font-semibold">
                  {t('card.details.title', defaultLabels.title)}
                </DialogTitle>
                <DialogDescription className="text-sm text-muted-foreground">
                  {t('card.details.description', defaultLabels.description)}
                </DialogDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={() => setIsEditing(!isEditing)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={handleDelete}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setShowShareDialog(true)}
                >
                  <Share className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </DialogHeader>
          
          <ScrollArea className="flex-1 p-6">
            <div className="space-y-8">
              {/* Image Section */}
              {card.image_url ? (
                <div className="relative">
                  <div 
                    className="relative rounded-lg overflow-hidden cursor-pointer bg-gray-50"
                    onClick={() => setIsImageEnlarged(true)}
                  >
                    <img
                      src={card.image_url}
                      alt={`${card.name}'s business card`}
                      className="w-full h-auto rounded-lg shadow-sm"
                    />
                  </div>
                  <Button
                    size="icon"
                    variant="outline"
                    className="absolute top-4 right-4 bg-white/80 hover:bg-white"
                    onClick={handleDownload}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="rounded-lg bg-gray-50 p-8 text-center">
                  <p className="text-sm text-gray-500">{t('card.noImage', defaultLabels.noImage)}</p>
                </div>
              )}

              {/* Contact Information */}
              <div className="space-y-6">
                {/* Name Fields */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-sm font-medium">
                      {t('card.details.nameEnglish', defaultLabels.nameEnglish)}
                    </Label>
                    <Input
                      id="name"
                      name="name"
                      value={editedCard.name || ''}
                      onChange={handleInputChange}
                      readOnly={!isEditing}
                      className={!isEditing ? 'bg-gray-50' : ''}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="name_zh" className="text-sm font-medium">
                      {t('card.details.nameChinese', defaultLabels.nameChinese)}
                    </Label>
                    <Input
                      id="name_zh"
                      name="name_zh"
                      value={editedCard.name_zh || ''}
                      onChange={handleInputChange}
                      readOnly={!isEditing}
                      className={!isEditing ? 'bg-gray-50' : ''}
                    />
                  </div>
                </div>

                {/* Company Fields */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="company" className="text-sm font-medium">
                      {t('card.details.companyEnglish', defaultLabels.companyEnglish)}
                    </Label>
                    <Input
                      id="company"
                      name="company"
                      value={editedCard.company || ''}
                      onChange={handleInputChange}
                      readOnly={!isEditing}
                      className={!isEditing ? 'bg-gray-50' : ''}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="company_zh" className="text-sm font-medium">
                      {t('card.details.companyChinese', defaultLabels.companyChinese)}
                    </Label>
                    <Input
                      id="company_zh"
                      name="company_zh"
                      value={editedCard.company_zh || ''}
                      onChange={handleInputChange}
                      readOnly={!isEditing}
                      className={!isEditing ? 'bg-gray-50' : ''}
                    />
                  </div>
                </div>

                {/* Title Fields */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title" className="text-sm font-medium">
                      {t('card.details.titleEnglish', defaultLabels.titleEnglish)}
                    </Label>
                    <Input
                      id="title"
                      name="title"
                      value={editedCard.title || ''}
                      onChange={handleInputChange}
                      readOnly={!isEditing}
                      className={!isEditing ? 'bg-gray-50' : ''}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="title_zh" className="text-sm font-medium">
                      {t('card.details.titleChinese', defaultLabels.titleChinese)}
                    </Label>
                    <Input
                      id="title_zh"
                      name="title_zh"
                      value={editedCard.title_zh || ''}
                      onChange={handleInputChange}
                      readOnly={!isEditing}
                      className={!isEditing ? 'bg-gray-50' : ''}
                    />
                  </div>
                </div>

                {/* Contact Fields */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium">
                      {t('card.details.email', defaultLabels.email)}
                    </Label>
                    <Input
                      id="email"
                      name="email"
                      value={editedCard.email || ''}
                      onChange={handleInputChange}
                      readOnly={!isEditing}
                      className={!isEditing ? 'bg-gray-50' : ''}
                      type="email"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-sm font-medium">
                      {t('card.details.phone', defaultLabels.phone)}
                    </Label>
                    <Input
                      id="phone"
                      name="phone"
                      value={editedCard.phone || ''}
                      onChange={handleInputChange}
                      readOnly={!isEditing}
                      className={!isEditing ? 'bg-gray-50' : ''}
                      type="tel"
                    />
                  </div>
                </div>

                {/* Address Fields */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="address" className="text-sm font-medium">
                      {t('card.details.addressEnglish', defaultLabels.addressEnglish)}
                    </Label>
                    <Input
                      id="address"
                      name="address"
                      value={editedCard.address || ''}
                      onChange={handleInputChange}
                      readOnly={!isEditing}
                      className={!isEditing ? 'bg-gray-50' : ''}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address_zh" className="text-sm font-medium">
                      {t('card.details.addressChinese', defaultLabels.addressChinese)}
                    </Label>
                    <Input
                      id="address_zh"
                      name="address_zh"
                      value={editedCard.address_zh || ''}
                      onChange={handleInputChange}
                      readOnly={!isEditing}
                      className={!isEditing ? 'bg-gray-50' : ''}
                    />
                  </div>
                </div>

                {/* Notes Field */}
                <div className="space-y-2">
                  <Label htmlFor="notes" className="text-sm font-medium">
                    {t('card.details.remarks', defaultLabels.remarks)}
                  </Label>
                  <Textarea
                    id="notes"
                    name="notes"
                    value={editedCard.notes || ''}
                    onChange={handleInputChange}
                    className={cn("min-h-[100px] resize-none", !isEditing && "bg-gray-50")}
                    readOnly={!isEditing}
                  />
                </div>
              </div>
            </div>
          </ScrollArea>

          {isEditing && (
            <div className="flex-shrink-0 border-t p-4">
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsEditing(false)}>
                  {t('actions.cancel', 'Cancel')}
                </Button>
                <Button onClick={handleSave}>
                  {t('actions.save', 'Save')}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('card.delete.title', 'Delete Business Card')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('card.delete.description', 'Are you sure you want to delete this business card? This action cannot be undone.')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('card.delete.cancel', 'Cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              {t('card.delete.confirm', 'Delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
} 