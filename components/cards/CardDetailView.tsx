import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Edit, Share, Download, Trash2, X, Mail, Share2, Copy, Linkedin, Search, ImageIcon } from 'lucide-react'
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
  const [isImageEnlarged, setIsImageEnlarged] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const shareMenuRef = useRef<HTMLDivElement>(null);
  const shareButtonRef = useRef<HTMLButtonElement>(null);
  const [linkedinUrl, setLinkedinUrl] = useState(card.linkedin_url || '');
  const [showLinkedinInput, setShowLinkedinInput] = useState(false);
  const [isFetchingLinkedinPhoto, setIsFetchingLinkedinPhoto] = useState(false);
  const [autoSearchStatus, setAutoSearchStatus] = useState<'idle' | 'searching' | 'found' | 'not_found' | 'error'>('idle');
  const [matchedLinkedinUrl, setMatchedLinkedinUrl] = useState<string | null>(null);

  // Auto-search LinkedIn profile on card open
  useEffect(() => {
    // Only auto-search if no profile pic already and card has a name
    if (!card.profile_pic_url && card.name) {
      handleAutoLinkedinSearch()
    }
  }, [card.id]) // Only on mount when card changes

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        shareMenuRef.current && 
        !shareMenuRef.current.contains(event.target as Node) &&
        shareButtonRef.current &&
        !shareButtonRef.current.contains(event.target as Node)
      ) {
        setShowShareMenu(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

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

  const handleCopyLink = async () => {
    if (!editedCard.image_url) {
      toast.error('No image available to copy');
      return;
    }
    
    try {
      await navigator.clipboard.writeText(editedCard.image_url);
      toast.success('Link copied to clipboard');
      setShowShareMenu(false);
    } catch (error) {
      console.error('Error copying link:', error);
      toast.error('Failed to copy link');
    }
  };

  const handleDownload = async () => {
    if (!editedCard.image_url) {
      toast.error('No image available to download');
      return;
    }

    try {
      const response = await fetch(editedCard.image_url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${editedCard.name || 'card'}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('Image downloaded successfully');
      setShowShareMenu(false);
    } catch (error) {
      console.error('Error downloading image:', error);
      toast.error('Failed to download image');
    }
  };

  const handleEmailShare = () => {
    if (!editedCard.image_url) {
      toast.error('No image available to share');
      return;
    }
    
    const subject = encodeURIComponent(`Business Card - ${editedCard.name || ''}`);
    const body = encodeURIComponent(`View this business card: ${editedCard.image_url}`);
    window.open(`mailto:?subject=${subject}&body=${body}`);
    setShowShareMenu(false);
  };

  const handleWhatsAppShare = () => {
    if (!editedCard.image_url) {
      toast.error('No image available to share');
      return;
    }
    
    const text = encodeURIComponent(`Business Card - ${editedCard.name || ''}\n${editedCard.image_url}`);
    window.open(`https://wa.me/?text=${text}`);
    setShowShareMenu(false);
  };

  const handleDelete = () => {
    setShowDeleteAlert(true)
  }

  const handleAutoLinkedinSearch = async () => {
    setAutoSearchStatus('searching')
    try {
      const res = await fetch('/api/linkedin/search-and-fetch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: card.name, company: card.company || '', cardId: card.id }),
      })

      const data = await res.json()

      if (data.success) {
        // Auto-match found!
        setMatchedLinkedinUrl(data.linkedin_url)
        const updatedCard = { ...editedCard, profile_pic_url: data.profile_pic_url, linkedin_url: data.linkedin_url }
        setEditedCard(updatedCard)
        onEdit(updatedCard)
        setAutoSearchStatus('found')
      } else {
        setAutoSearchStatus('not_found')
        // If it needs manual input, pre-fill any URL we found
        if (data.linkedinUrl) {
          setLinkedinUrl(data.linkedinUrl)
          setMatchedLinkedinUrl(data.linkedinUrl)
        }
        // Show the input so user can provide correct URL
        setShowLinkedinInput(true)
      }
    } catch (error: any) {
      setAutoSearchStatus('error')
      setShowLinkedinInput(true)
    }
  }

  const handleFetchLinkedinPhoto = async () => {
    if (!linkedinUrl.trim()) {
      toast.error('Please enter a LinkedIn profile URL')
      return
    }

    setIsFetchingLinkedinPhoto(true)
    try {
      const res = await fetch('/api/linkedin/fetch-photo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ linkedinUrl: linkedinUrl.trim(), cardId: card.id }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch LinkedIn photo')
      }

      const updatedCard = { ...editedCard, profile_pic_url: data.profile_pic_url, linkedin_url: data.linkedin_url }
      setEditedCard(updatedCard)
      onEdit(updatedCard)
      setMatchedLinkedinUrl(data.linkedin_url)
      setAutoSearchStatus('found')

      toast.success('LinkedIn profile photo applied! 🎉')
      setShowLinkedinInput(false)
    } catch (error: any) {
      toast.error(error.message || 'Failed to fetch LinkedIn photo')
    } finally {
      setIsFetchingLinkedinPhoto(false)
    }
  }

  const confirmDelete = () => {
    onDelete(editedCard.id)
    setShowDeleteAlert(false)
    onClose()
  }

  return (
    <>
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="max-w-3xl h-[90vh] flex flex-col bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
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
                <div className="relative">
                  <Button
                    ref={shareButtonRef}
                    variant="outline"
                    size="icon"
                    onClick={() => setShowShareMenu(!showShareMenu)}
                  >
                    <Share2 className="h-4 w-4" />
                  </Button>
                  {showShareMenu && (
                    <div 
                      ref={shareMenuRef}
                      className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center dark:text-gray-200"
                        onClick={handleEmailShare}
                      >
                        <Mail className="mr-2 h-4 w-4" />
                        Share via Email
                      </button>
                      <button
                        className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center dark:text-gray-200"
                        onClick={handleWhatsAppShare}
                      >
                        <Share2 className="mr-2 h-4 w-4" />
                        Share via WhatsApp
                      </button>
                      <button
                        className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center dark:text-gray-200"
                        onClick={handleCopyLink}
                      >
                        <Copy className="mr-2 h-4 w-4" />
                        Copy Link
                      </button>
                      <button
                        className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center dark:text-gray-200"
                        onClick={handleDownload}
                      >
                        <Download className="mr-2 h-4 w-4" />
                        Download Image
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </DialogHeader>
          
          <ScrollArea className="flex-1 p-6">
            <div className="space-y-8">
              {/* Image Section */}
              {/* Show LinkedIn profile pic if available, otherwise show card image */}
              {/* Auto-searching state */}
              {autoSearchStatus === 'searching' ? (
                <div className="relative rounded-lg overflow-hidden bg-gray-50 dark:bg-gray-800 max-h-[40vh] flex items-center justify-center">
                  <div className="text-center p-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent mx-auto mb-3" />
                    <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">Searching LinkedIn...</p>
                    <p className="text-xs text-muted-foreground mt-1">"{card.name}"{card.company ? ` · ${card.company}` : ''}</p>
                  </div>
                </div>
              ) : (editedCard.profile_pic_url || card.image_url) ? (
                <div className="relative">
                  <div 
                    className="relative rounded-lg overflow-hidden cursor-pointer bg-gray-50 dark:bg-gray-800 max-h-[40vh]"
                    onClick={() => setIsImageEnlarged(true)}
                  >
                    <img
                      src={editedCard.profile_pic_url || card.image_url}
                      alt={`${card.name}'s ${editedCard.profile_pic_url ? 'profile photo' : 'business card'}`}
                      className={`w-full h-auto max-h-[40vh] object-contain rounded-lg shadow-sm ${editedCard.profile_pic_url ? 'object-cover aspect-square' : 'object-contain'}`}
                    />
                  </div>
                  {/* Badge showing source */}
                  {editedCard.profile_pic_url && (
                    <div className="absolute top-4 left-4 bg-blue-600/90 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                      <Linkedin className="h-3 w-3" />
                      LinkedIn
                    </div>
                  )}
                  <div className="absolute top-4 right-4 flex gap-2">
                    {/* Switch between profile pic and card image */}
                    {editedCard.profile_pic_url && card.image_url && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="bg-white/80 dark:bg-gray-900/80 hover:bg-white dark:hover:bg-gray-800 text-xs"
                        onClick={(e) => {
                          e.stopPropagation()
                          const updated = { ...editedCard, profile_pic_url: undefined as string | undefined }
                          setEditedCard(updated)
                          onEdit(updated)
                          toast.success('Switched to namecard image')
                        }}
                      >
                        <ImageIcon className="h-3 w-3 mr-1" /> Card
                      </Button>
                    )}
                    {/* LinkedIn Photo button */}
                    <Button
                      size="sm"
                      variant="outline"
                      className="bg-white/80 dark:bg-gray-900/80 hover:bg-white dark:hover:bg-gray-800 text-xs"
                      onClick={(e) => {
                        e.stopPropagation()
                        setShowLinkedinInput(!showLinkedinInput)
                      }}
                    >
                      <Linkedin className="h-3 w-3 mr-1" /> Photo
                    </Button>
                    <Button
                      size="icon"
                      variant="outline"
                      className="bg-white/80 dark:bg-gray-900/80 hover:bg-white dark:hover:bg-gray-800"
                      onClick={handleDownload}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="rounded-lg bg-gray-50 dark:bg-gray-800 p-8 text-center">
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t('card.noImage', defaultLabels.noImage)}</p>
                </div>
              )}

              {/* LinkedIn URL Input — shows when auto-search fails or user clicks Photo button */}
              {showLinkedinInput && (
                <div className="space-y-2">
                  {/* Auto-search status message */}
                  {autoSearchStatus === 'searching' && (
                    <div className="flex items-center gap-2 p-2 text-sm text-blue-600 dark:text-blue-400">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent" />
                      Searching LinkedIn for "{card.name}"{card.company ? ` at ${card.company}` : ''}...
                    </div>
                  )}
                  {autoSearchStatus === 'not_found' && (
                    <div className="p-2 text-sm bg-amber-50 dark:bg-amber-950/30 rounded-md border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400">
                      ⚠️ No LinkedIn profile found for "{card.name}". Please paste the correct LinkedIn URL:
                    </div>
                  )}
                  {autoSearchStatus === 'error' && (
                    <div className="p-2 text-sm bg-red-50 dark:bg-red-950/30 rounded-md border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400">
                      ❌ Error searching LinkedIn. Please paste the URL manually:
                    </div>
                  )}
                  {matchedLinkedinUrl && autoSearchStatus === 'found' && (
                    <div className="flex items-center justify-between p-2 text-sm bg-green-50 dark:bg-green-950/30 rounded-md border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400">
                      <span>✅ Matched: {matchedLinkedinUrl.replace('https://www.linkedin.com/in/', '')}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs h-6 px-2"
                        onClick={(e) => {
                          e.stopPropagation()
                          setShowLinkedinInput(true)
                          setLinkedinUrl('')
                          setAutoSearchStatus('idle')
                        }}
                      >
                        Not right? Fix →
                      </Button>
                    </div>
                  )}

                  {/* Manual URL input (or auto-show when search fails) */}
                  {(autoSearchStatus === 'not_found' || autoSearchStatus === 'error' || autoSearchStatus === 'idle' || linkedinUrl) && (
                    <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
                      <Linkedin className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" />
                      <Input
                        placeholder="Paste LinkedIn profile URL..."
                        value={linkedinUrl}
                        onChange={(e) => setLinkedinUrl(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleFetchLinkedinPhoto()}
                        className="flex-1 text-sm"
                        disabled={isFetchingLinkedinPhoto}
                      />
                      <Button
                        size="sm"
                        onClick={handleFetchLinkedinPhoto}
                        disabled={isFetchingLinkedinPhoto || !linkedinUrl.trim()}
                        className="bg-[#0A66C2] hover:bg-[#004182] text-white"
                      >
                        {isFetchingLinkedinPhoto ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                        ) : (
                          <>Fix Match</>
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {/* LinkedIn Photo button — only show when no match found yet */}
              {!showLinkedinInput && autoSearchStatus !== 'searching' && autoSearchStatus !== 'found' && (
                <div className="flex items-center gap-2 p-2 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs text-blue-600 dark:text-blue-400"
                    onClick={(e) => {
                      e.stopPropagation()
                      setShowLinkedinInput(true)
                      // Retry auto-search
                      if (autoSearchStatus === 'not_found' || autoSearchStatus === 'error') {
                        handleAutoLinkedinSearch()
                      }
                    }}
                  >
                    <Linkedin className="h-3 w-3 mr-1" /> Find LinkedIn Photo
                  </Button>
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
                      className={!isEditing ? 'bg-gray-50 dark:bg-gray-800 dark:text-gray-100' : ''}
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
                      className={!isEditing ? 'bg-gray-50 dark:bg-gray-800 dark:text-gray-100' : ''}
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
                      className={!isEditing ? 'bg-gray-50 dark:bg-gray-800 dark:text-gray-100' : ''}
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
                      className={!isEditing ? 'bg-gray-50 dark:bg-gray-800 dark:text-gray-100' : ''}
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
                      className={!isEditing ? 'bg-gray-50 dark:bg-gray-800 dark:text-gray-100' : ''}
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
                      className={!isEditing ? 'bg-gray-50 dark:bg-gray-800 dark:text-gray-100' : ''}
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
                      className={!isEditing ? 'bg-gray-50 dark:bg-gray-800 dark:text-gray-100' : ''}
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
                      className={!isEditing ? 'bg-gray-50 dark:bg-gray-800 dark:text-gray-100' : ''}
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
                      className={!isEditing ? 'bg-gray-50 dark:bg-gray-800 dark:text-gray-100' : ''}
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
                      className={!isEditing ? 'bg-gray-50 dark:bg-gray-800 dark:text-gray-100' : ''}
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
                    className={cn("min-h-[100px] resize-none", !isEditing && "bg-gray-50 dark:bg-gray-800 dark:text-gray-100")}
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
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800">
              {t('card.delete.confirm', 'Delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
} 