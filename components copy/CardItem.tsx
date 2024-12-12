'use client'

import * as React from 'react'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Mail, Edit2, Trash2, Phone, Smartphone, Download, X } from 'lucide-react'
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import type { BusinessCard } from '@/types/business-card'
import { toast } from 'sonner'

interface CardItemProps {
  card: BusinessCard
  onEdit: (id: string) => void
  onDelete: (id: string) => void
  viewMode: 'list' | 'grid'
}

export const CardItem: React.FC<CardItemProps> = ({ card, onEdit, onDelete, viewMode }) => {
  const [emailContent, setEmailContent] = useState("")
  const [emailPurpose, setEmailPurpose] = useState("introduction")
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editedCard, setEditedCard] = useState(card)
  const [isImageModalOpen, setIsImageModalOpen] = useState(false)

  const generateEmail = () => {
    const purposes = {
      introduction: `Dear ${card.name},\n\nI hope this email finds you well. I recently came across your profile and I'm impressed by your work at ${card.company}. I would love to connect and learn more about your experiences in the industry.\n\nBest regards,\n[Your Name]`,
      followUp: `Dear ${card.name},\n\nI wanted to follow up on our recent conversation about [topic]. I've given it some thought and I have a few ideas I'd like to discuss further.\n\nLooking forward to your response.\n\nBest regards,\n[Your Name]`,
      meeting: `Dear ${card.name},\n\nI hope this email finds you well. I would like to schedule a meeting to discuss [topic]. Would you be available for a 30-minute call next week?\n\nBest regards,\n[Your Name]`
    }
    setEmailContent(purposes[emailPurpose as keyof typeof purposes])
  }

  const handleImageDownload = async () => {
    try {
      const response = await fetch(card.image_url)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `business-card-${card.name}-${card.company}.jpg`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      toast.success('Image downloaded successfully')
    } catch (error) {
      console.error('Download error:', error)
      toast.error('Failed to download image')
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      <Card className={`overflow-hidden transition-all duration-300 hover:shadow-lg ${viewMode === 'list' ? 'mb-4' : ''}`}>
        <CardContent className={`p-6 ${viewMode === 'grid' || viewMode === 'carousel' ? 'flex flex-col items-center text-center' : ''}`}>
          <div className={`flex ${viewMode === 'grid' || viewMode === 'carousel' ? 'flex-col' : 'items-start'} space-y-4 ${viewMode === 'list' ? 'space-x-4' : ''}`}>
            <Avatar className={`${viewMode === 'list' ? 'w-16 h-16' : 'w-20 h-20'}`}>
              <AvatarFallback className="text-2xl font-bold">{card.name[0]}</AvatarFallback>
            </Avatar>
            <div className={`flex-1 space-y-2 ${viewMode === 'grid' || viewMode === 'carousel' ? 'text-center' : ''}`}>
              <div>
                <h3 className="text-xl font-semibold">{card.name}</h3>
                {card.nameZh && (
                  <p className="text-base text-gray-600">{card.nameZh}</p>
                )}
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground">{card.title}</p>
                {card.titleZh && (
                  <p className="text-sm text-gray-500">{card.titleZh}</p>
                )}
              </div>
              
              <div>
                <p className="text-sm font-medium">{card.company}</p>
                {card.companyZh && (
                  <p className="text-sm text-gray-600">{card.companyZh}</p>
                )}
              </div>

              <div className="space-y-1">
                {card.email && (
                  <div className="flex items-center space-x-2 text-sm">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <span>{card.email}</span>
                  </div>
                )}
                {card.phone && (
                  <div className="flex items-center space-x-2 text-sm">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <span>{card.phone}</span>
                  </div>
                )}
                {card.mobile && (
                  <div className="flex items-center space-x-2 text-sm">
                    <Smartphone className="h-4 w-4 text-gray-400" />
                    <span>{card.mobile}</span>
                  </div>
                )}
              </div>

              {(card.address || card.addressZh) && (
                <div className="text-sm">
                  <p className="text-gray-600">{card.address}</p>
                  {card.addressZh && (
                    <p className="text-gray-500">{card.addressZh}</p>
                  )}
                </div>
              )}
            </div>
            <div className={`flex ${viewMode === 'grid' || viewMode === 'carousel' ? 'justify-center mt-4' : 'space-x-2'}`}>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="icon">
                    <Mail className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Generate Email</DialogTitle>
                    <DialogDescription>
                      Generate an email for {card.name}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="purpose" className="text-right">Purpose</Label>
                      <Select value={emailPurpose} onValueChange={setEmailPurpose}>
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="Select purpose" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="introduction">Introduction</SelectItem>
                          <SelectItem value="followUp">Follow Up</SelectItem>
                          <SelectItem value="meeting">Schedule Meeting</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="email" className="text-right">Email</Label>
                      <Textarea
                        id="email"
                        value={emailContent}
                        onChange={(e) => setEmailContent(e.target.value)}
                        className="col-span-3 h-[200px]"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button onClick={generateEmail}>Generate Email</Button>
                    <Button variant="outline" onClick={() => {
                      window.location.href = `mailto:${card.email}?body=${encodeURIComponent(emailContent)}`;
                    }}>
                      Send Email
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={() => setIsEditDialogOpen(true)}>
                    <Edit2 className="h-5 w-5" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Edit Business Card</DialogTitle>
                    <DialogDescription>
                      Make changes to the business card information
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-6 py-4">
                    {card.image_url && (
                      <div className="w-full">
                        <div className="flex justify-between items-center mb-2">
                          <Label>Business Card Image</Label>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleImageDownload}
                            className="flex items-center gap-2"
                          >
                            <Download className="h-4 w-4" />
                            Download
                          </Button>
                        </div>
                        <div 
                          className="relative cursor-pointer group"
                          onClick={() => setIsImageModalOpen(true)}
                        >
                          <img 
                            src={card.image_url} 
                            alt="Business Card" 
                            className="w-full max-h-[200px] object-contain rounded-lg border transition-all duration-200 group-hover:brightness-90"
                          />
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                              Click to enlarge
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="name">Name (English)</Label>
                        <Input
                          id="name"
                          value={editedCard.name}
                          onChange={(e) => setEditedCard({ ...editedCard, name: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="nameZh">Name (Chinese)</Label>
                        <Input
                          id="nameZh"
                          value={editedCard.nameZh || ''}
                          onChange={(e) => setEditedCard({ ...editedCard, nameZh: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="title">Title (English)</Label>
                        <Input
                          id="title"
                          value={editedCard.title}
                          onChange={(e) => setEditedCard({ ...editedCard, title: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="titleZh">Title (Chinese)</Label>
                        <Input
                          id="titleZh"
                          value={editedCard.titleZh || ''}
                          onChange={(e) => setEditedCard({ ...editedCard, titleZh: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="company">Company (English)</Label>
                        <Input
                          id="company"
                          value={editedCard.company}
                          onChange={(e) => setEditedCard({ ...editedCard, company: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="companyZh">Company (Chinese)</Label>
                        <Input
                          id="companyZh"
                          value={editedCard.companyZh || ''}
                          onChange={(e) => setEditedCard({ ...editedCard, companyZh: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          value={editedCard.email}
                          onChange={(e) => setEditedCard({ ...editedCard, email: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="phone">Phone</Label>
                        <Input
                          id="phone"
                          value={editedCard.phone}
                          onChange={(e) => setEditedCard({ ...editedCard, phone: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="mobile">Mobile</Label>
                        <Input
                          id="mobile"
                          value={editedCard.mobile || ''}
                          onChange={(e) => setEditedCard({ ...editedCard, mobile: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="address">Address (English)</Label>
                        <Input
                          id="address"
                          value={editedCard.address || ''}
                          onChange={(e) => setEditedCard({ ...editedCard, address: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="addressZh">Address (Chinese)</Label>
                        <Input
                          id="addressZh"
                          value={editedCard.addressZh || ''}
                          onChange={(e) => setEditedCard({ ...editedCard, addressZh: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="wechat">WeChat</Label>
                        <Input
                          id="wechat"
                          value={editedCard.wechat || ''}
                          onChange={(e) => setEditedCard({ ...editedCard, wechat: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="linkedin">LinkedIn</Label>
                        <Input
                          id="linkedin"
                          value={editedCard.linkedin || ''}
                          onChange={(e) => setEditedCard({ ...editedCard, linkedin: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={() => {
                      onEdit(editedCard.id);
                      setIsEditDialogOpen(false);
                    }}>
                      Save Changes
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Dialog open={isImageModalOpen} onOpenChange={setIsImageModalOpen}>
                <DialogContent className="max-w-[90vw] max-h-[90vh] p-0">
                  <div className="relative">
                    <img 
                      src={card.image_url} 
                      alt="Business Card" 
                      className="w-full h-full object-contain"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      className="absolute top-2 right-2"
                      onClick={() => setIsImageModalOpen(false)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="absolute top-2 right-12"
                      onClick={handleImageDownload}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              <Button variant="ghost" size="icon" onClick={() => onDelete(card.id)}>
                <Trash2 className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
} 