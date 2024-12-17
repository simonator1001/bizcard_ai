import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Edit, Share, Download, Trash2, X, ChevronLeft, ChevronRight, Mail } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { ScrollArea } from "@/components/ui/scroll-area"

interface BusinessCard {
  id: string
  name: string
  name_zh: string
  company: string
  company_zh: string
  title: string
  title_zh: string
  email: string
  phone: string
  address: string
  address_zh: string
  imageUrl: string
  notes: string
  created_at: string
  updated_at: string
  images?: string[]
}

interface CardDetailViewProps {
  card: BusinessCard
  onClose: () => void
  onEdit: (updatedCard: BusinessCard) => void
  onDelete: (id: string) => void
}

const ShareDialog = ({ card, onClose }: { card: BusinessCard; onClose: () => void }) => (
  <Dialog open onOpenChange={onClose}>
    <DialogContent className="max-w-md">
      <DialogHeader>
        <DialogTitle>Share Business Card</DialogTitle>
        <DialogDescription>
          Share this business card via link or other platforms
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-4 p-4">
        <div className="flex flex-col space-y-2">
          <Label>Card Link</Label>
          <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
            <div className="flex-1 overflow-hidden">
              <p className="text-sm text-gray-600 truncate">
                {card.imageUrl}
              </p>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                navigator.clipboard.writeText(card.imageUrl);
                toast.success('Link copied to clipboard');
              }}
              className="shrink-0"
            >
              Copy Link
            </Button>
          </div>
        </div>

        <div className="flex justify-center gap-4 pt-2">
          <Button
            variant="outline"
            className="flex items-center gap-2"
            onClick={() => {
              window.open(`mailto:?subject=Business Card - ${card.name}&body=View this business card: ${card.imageUrl}`);
            }}
          >
            <Mail className="h-4 w-4" />
            Email
          </Button>
          <Button
            variant="outline"
            className="flex items-center gap-2"
            onClick={() => {
              window.open(`https://wa.me/?text=Business Card - ${card.name}%0A${card.imageUrl}`);
            }}
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            WhatsApp
          </Button>
        </div>
      </div>
    </DialogContent>
  </Dialog>
);

export function CardDetailView({ card, onClose, onEdit, onDelete }: CardDetailViewProps) {
  const [editedCard, setEditedCard] = useState(card)
  const [isEditing, setIsEditing] = useState(false)
  const [isImageEnlarged, setIsImageEnlarged] = useState(false)
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const images = card.images || [card.imageUrl];

  const containsChinese = (text: string) => /[\u4e00-\u9fa5]/.test(text)
  const containsEnglish = (text: string) => /[a-zA-Z]/.test(text)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    
    if (name.endsWith('_zh') && containsEnglish(value)) {
      toast.error('Please enter Chinese text only in this field')
      return
    }
    if (!name.endsWith('_zh') && name !== 'email' && name !== 'phone' && name !== 'notes' && containsChinese(value)) {
      toast.error('Please enter English text only in this field')
      return
    }

    setEditedCard(prev => ({ ...prev, [name]: value }))
  }

  const handleSave = () => {
    onEdit(editedCard)
    setIsEditing(false)
  }

  const handleDownload = async () => {
    try {
      const response = await fetch(editedCard.imageUrl)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `business-card-${editedCard.name.toLowerCase().replace(/\s+/g, '-')}.jpg`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error downloading image:', error)
    }
  }

  const handleDelete = () => {
    const confirmed = window.confirm('Are you sure you want to delete this business card?');
    if (confirmed) {
      onDelete(editedCard.id);
      onClose(); // Close the modal after deletion
      toast.success('Business card deleted successfully');
    }
  };

  const ImageEnlargedDialog = () => (
    <Dialog open={isImageEnlarged} onOpenChange={setIsImageEnlarged}>
      <DialogContent className="max-w-4xl p-0 overflow-hidden">
        <div className="relative">
          <img
            src={images[currentImageIndex]}
            alt={`${card.name}'s business card`}
            className="w-full h-auto"
          />
          {images.length > 1 && (
            <>
              <button
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/20 hover:bg-black/40 text-white rounded-full p-2 backdrop-blur-sm transition-all"
                onClick={() => setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length)}
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/20 hover:bg-black/40 text-white rounded-full p-2 backdrop-blur-sm transition-all"
                onClick={() => setCurrentImageIndex((prev) => (prev + 1) % images.length)}
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </>
          )}
          <Button
            size="icon"
            variant="secondary"
            className="absolute top-4 right-4"
            onClick={handleDownload}
          >
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );

  return (
    <>
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl h-[85vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>Business Card Details</DialogTitle>
            <DialogDescription>View and edit business card information</DialogDescription>
          </DialogHeader>
          
          <ScrollArea className="flex-1 pr-4 -mr-4">
            <div className="grid gap-4 py-4">
              {/* Image Section */}
              <div className="relative mb-4">
                <div 
                  className="relative rounded-lg overflow-hidden cursor-pointer"
                  onClick={() => setIsImageEnlarged(true)}
                >
                  <img
                    src={images[currentImageIndex]}
                    alt={`${card.name}'s business card`}
                    className="w-full h-auto rounded-lg shadow-md"
                  />
                  {images.length > 1 && (
                    <>
                      <button
                        className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/20 hover:bg-black/40 text-white rounded-full p-1 backdrop-blur-sm transition-all"
                        onClick={(e) => {
                          e.stopPropagation();
                          setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
                        }}
                      >
                        <ChevronLeft className="h-5 w-5" />
                      </button>
                      <button
                        className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/20 hover:bg-black/40 text-white rounded-full p-1 backdrop-blur-sm transition-all"
                        onClick={(e) => {
                          e.stopPropagation();
                          setCurrentImageIndex((prev) => (prev + 1) % images.length);
                        }}
                      >
                        <ChevronRight className="h-5 w-5" />
                      </button>
                      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                        {images.map((_, index) => (
                          <button
                            key={index}
                            className={`w-2 h-2 rounded-full transition-all ${
                              index === currentImageIndex ? 'bg-white' : 'bg-white/50'
                            }`}
                            onClick={(e) => {
                              e.stopPropagation();
                              setCurrentImageIndex(index);
                            }}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </div>
                <Button
                  size="icon"
                  variant="secondary"
                  className="absolute top-2 right-2"
                  onClick={handleDownload}
                >
                  <Download className="h-4 w-4" />
                </Button>
              </div>

              {/* Name Fields */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name (English)</Label>
                  <Input
                    id="name"
                    name="name"
                    value={editedCard.name}
                    onChange={handleInputChange}
                    readOnly={!isEditing}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name_zh">Name (Chinese)</Label>
                  <Input
                    id="name_zh"
                    name="name_zh"
                    value={editedCard.name_zh}
                    onChange={handleInputChange}
                    readOnly={!isEditing}
                  />
                </div>
              </div>

              {/* Company Fields */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="company">Company (English)</Label>
                  <Input
                    id="company"
                    name="company"
                    value={editedCard.company}
                    onChange={handleInputChange}
                    readOnly={!isEditing}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company_zh">Company (Chinese)</Label>
                  <Input
                    id="company_zh"
                    name="company_zh"
                    value={editedCard.company_zh}
                    onChange={handleInputChange}
                    readOnly={!isEditing}
                  />
                </div>
              </div>

              {/* Title Fields */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title (English)</Label>
                  <Input
                    id="title"
                    name="title"
                    value={editedCard.title}
                    onChange={handleInputChange}
                    readOnly={!isEditing}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="title_zh">Title (Chinese)</Label>
                  <Input
                    id="title_zh"
                    name="title_zh"
                    value={editedCard.title_zh}
                    onChange={handleInputChange}
                    readOnly={!isEditing}
                  />
                </div>
              </div>

              {/* Contact Information */}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  value={editedCard.email}
                  onChange={handleInputChange}
                  readOnly={!isEditing}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  name="phone"
                  value={editedCard.phone}
                  onChange={handleInputChange}
                  readOnly={!isEditing}
                />
              </div>

              {/* Address Fields */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="address">Address (English)</Label>
                  <Input
                    id="address"
                    name="address"
                    value={editedCard.address}
                    onChange={handleInputChange}
                    readOnly={!isEditing}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address_zh">Address (Chinese)</Label>
                  <Input
                    id="address_zh"
                    name="address_zh"
                    value={editedCard.address_zh}
                    onChange={handleInputChange}
                    readOnly={!isEditing}
                  />
                </div>
              </div>

              {/* Notes Field */}
              <div className="space-y-2">
                <Label htmlFor="notes">Remarks</Label>
                <Textarea
                  id="notes"
                  name="notes"
                  value={editedCard.notes}
                  onChange={handleInputChange}
                  className="min-h-[100px]"
                  readOnly={!isEditing}
                />
              </div>
            </div>
          </ScrollArea>

          <DialogFooter className="flex-shrink-0 border-t p-4 mt-4">
            <div className="flex gap-2">
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
                className="text-red-500 hover:text-red-600 hover:bg-red-50"
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
            {isEditing && (
              <Button onClick={handleSave}>Save changes</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {showShareDialog && (
        <ShareDialog card={card} onClose={() => setShowShareDialog(false)} />
      )}

      {isImageEnlarged && <ImageEnlargedDialog />}
    </>
  );
} 