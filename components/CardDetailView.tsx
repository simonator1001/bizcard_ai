import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Edit, Share, Download, Trash2, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface BusinessCard {
  id: string
  name: string
  company: string
  position: string
  email: string
  phone: string
  description: string
  imageUrl: string
}

interface CardDetailViewProps {
  card: BusinessCard
  onClose: () => void
  onEdit: (updatedCard: BusinessCard) => void
  onDelete: (id: string) => void
}

export function CardDetailView({ card, onClose, onEdit, onDelete }: CardDetailViewProps) {
  const [editedCard, setEditedCard] = useState(card)
  const [isEditing, setIsEditing] = useState(false)
  const [isImageEnlarged, setIsImageEnlarged] = useState(false)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
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

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Business Card Details</DialogTitle>
          <DialogDescription>View and edit business card information</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="relative">
            <img
              src={editedCard.imageUrl}
              alt={`${editedCard.name}'s business card`}
              className={`w-full h-auto cursor-pointer transition-all ${isImageEnlarged ? 'scale-150' : ''}`}
              onClick={() => setIsImageEnlarged(!isImageEnlarged)}
            />
            <Button
              size="icon"
              variant="secondary"
              className="absolute top-2 right-2"
              onClick={handleDownload}
            >
              <Download className="h-4 w-4" />
            </Button>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Name
            </Label>
            <Input
              id="name"
              name="name"
              value={editedCard.name}
              onChange={handleInputChange}
              className="col-span-3"
              readOnly={!isEditing}
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="company" className="text-right">
              Company
            </Label>
            <Input
              id="company"
              name="company"
              value={editedCard.company}
              onChange={handleInputChange}
              className="col-span-3"
              readOnly={!isEditing}
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="position" className="text-right">
              Position
            </Label>
            <Input
              id="position"
              name="position"
              value={editedCard.position}
              onChange={handleInputChange}
              className="col-span-3"
              readOnly={!isEditing}
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="email" className="text-right">
              Email
            </Label>
            <Input
              id="email"
              name="email"
              value={editedCard.email}
              onChange={handleInputChange}
              className="col-span-3"
              readOnly={!isEditing}
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="phone" className="text-right">
              Phone
            </Label>
            <Input
              id="phone"
              name="phone"
              value={editedCard.phone}
              onChange={handleInputChange}
              className="col-span-3"
              readOnly={!isEditing}
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="description" className="text-right">
              Description
            </Label>
            <Textarea
              id="description"
              name="description"
              value={editedCard.description}
              onChange={handleInputChange}
              className="col-span-3"
              readOnly={!isEditing}
            />
          </div>
        </div>
        <DialogFooter className="flex justify-between">
          <div>
            <Button variant="outline" size="icon" onClick={() => setIsEditing(!isEditing)} className="mr-2">
              <Edit className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={() => onDelete(editedCard.id)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
          {isEditing && <Button onClick={handleSave}>Save changes</Button>}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 