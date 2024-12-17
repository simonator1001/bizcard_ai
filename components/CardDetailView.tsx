import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Edit, Share, Download, Trash2, X, ChevronLeft, ChevronRight } from 'lucide-react'
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
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Share Business Card</DialogTitle>
      </DialogHeader>
      <div className="space-y-4 p-4">
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <span className="text-sm text-gray-600 truncate">{card.imageUrl}</span>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              navigator.clipboard.writeText(card.imageUrl);
              toast.success('Link copied to clipboard');
            }}
          >
            Copy Link
          </Button>
        </div>
        <div className="flex justify-center gap-4">
          <Button
            variant="outline"
            onClick={() => {
              window.open(`mailto:?subject=Business Card - ${card.name}&body=View this business card: ${card.imageUrl}`);
            }}
          >
            Email
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              window.open(`https://wa.me/?text=Business Card - ${card.name}%0A${card.imageUrl}`);
            }}
          >
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
                onClick={() => onDelete(editedCard.id)}
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