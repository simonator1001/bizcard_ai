import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Edit, Share, Download, Trash2, X, Share2, ImageIcon, Sparkles, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import type { BusinessCard } from '@/types/business-card'
import { generateShareCardImage, dataUrlToBlob } from '@/lib/share-card-generator'
import { buildShareContent, linkedInShareUrl, facebookShareUrl, twitterShareUrl, lineShareUrl, kakaoTalkShareUrl, smsShareUrl } from '@/lib/social-share'
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
  const [isGeneratingShareCard, setIsGeneratingShareCard] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [albumIndex, setAlbumIndex] = useState(0);

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
    console.log('[CardDetailView] handleSave called, editedCard:', editedCard.name)
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
    const currentImage = albumImages[albumIndex]?.url || editedCard.image_url
    if (!currentImage) {
      toast.error('No image available to download');
      return;
    }

    try {
      const response = await fetch(currentImage);
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

  const handleBrandedShareDownload = async () => {
    setShowShareMenu(false);
    setIsGeneratingShareCard(true);
    try {
      const dataUrl = await generateShareCardImage({ 
        card: editedCard, 
        userId: (editedCard as any).user_id 
      });
      const blob = dataUrlToBlob(dataUrl);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${editedCard.name || 'card'}_bizcard.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('Branded card downloaded!');
    } catch (error) {
      console.error('Error generating share card:', error);
      toast.error('Failed to generate share card');
    } finally {
      setIsGeneratingShareCard(false);
    }
  };

  // Unified social share helper — builds content and opens URL
  const handleSocialShare = (platform: string) => {
    setShowShareMenu(false);
    const content = buildShareContent(
      editedCard,
      (editedCard as any).user_id,
      typeof window !== 'undefined' ? window.location.origin : undefined
    );
    let url = '';
    switch (platform) {
      case 'whatsapp': url = `https://wa.me/?text=${encodeURIComponent(content.brandedText)}`; break;
      case 'email': url = `mailto:?subject=${encodeURIComponent(content.name + "'s Digital Card")}&body=${encodeURIComponent(content.brandedText)}`; break;
      case 'linkedin': url = linkedInShareUrl(content.shareUrl); break;
      case 'facebook': url = facebookShareUrl(content.shareUrl); break;
      case 'twitter': url = twitterShareUrl(`${content.name}'s Digital Card`, content.shareUrl); break;
      case 'line': url = lineShareUrl(content.brandedText); break;
      case 'kakaotalk': url = kakaoTalkShareUrl(content.shareUrl, `${content.name}'s Digital Card`); break;
      case 'sms': url = smsShareUrl(editedCard.phone || '', content.brandedText); break;
      case 'wechat':
      case 'instagram':
      case 'copy':
        navigator.clipboard.writeText(content.shareUrl).then(
          () => toast.success(platform === 'wechat' ? 'Link copied! Share in WeChat 📱' : platform === 'instagram' ? 'Link copied! Share in Instagram 📷' : 'Link copied! 🔗'),
          () => toast.error('Failed to copy link')
        );
        return;
    }
    if (url) window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleDelete = () => {
    setShowDeleteAlert(true)
  }

  const confirmDelete = () => {
    onDelete(editedCard.id)
    setShowDeleteAlert(false)
    onClose()
  }

  // Album image list (card images only)
  const albumImages = [
    ...(editedCard.image_url ? [{ url: editedCard.image_url, label: 'cover' as const }] : []),
    ...(editedCard.images || []).filter((img: any) => {
      if (typeof img === 'string') return img !== editedCard.image_url
      return img.url !== editedCard.image_url
    }).map((img: any) => typeof img === 'string' ? { url: img, label: '' } : img),
  ]

  const handleSetCover = async (imageUrl: string) => {
    try {
      await fetch('/api/cards/images', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cardId: card.id, imageUrl }),
      })
      const updated = { ...editedCard, image_url: imageUrl }
      setEditedCard(updated)
      onEdit(updated)
      toast.success('Cover image updated')
    } catch { toast.error('Failed to update cover') }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setIsUploadingImage(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('cardId', card.id)
      fd.append('label', '')
      const res = await fetch('/api/cards/images', { method: 'POST', body: fd })
      const data = await res.json()
      if (data.success) {
        const updatedImages = [...(editedCard.images || []).map((img: any) => typeof img === 'string' ? { url: img, label: '' } : img), data.image]
        const updated = { ...editedCard, images: updatedImages, image_url: editedCard.image_url || data.cover_url }
        setEditedCard(updated)
        onEdit(updated)
        setAlbumIndex(albumImages.length)
        toast.success('Image added')
      }
    } catch { toast.error('Upload failed') }
    finally { setIsUploadingImage(false) }
  }

  const handleRemoveImage = async (imageUrl: string) => {
    try {
      await fetch(`/api/cards/images?cardId=${card.id}&imageUrl=${encodeURIComponent(imageUrl)}`, { method: 'DELETE' })
      const filtered = (editedCard.images || []).filter((img: any) => 
        (typeof img === 'string' ? img : img.url) !== imageUrl
      )
      const updated = { 
        ...editedCard, 
        images: filtered,
        image_url: editedCard.image_url === imageUrl ? (filtered[0] ? (typeof filtered[0] === 'string' ? filtered[0] : filtered[0].url) : undefined) : editedCard.image_url
      }
      setEditedCard(updated)
      onEdit(updated)
      setAlbumIndex(0)
      toast.success('Image removed')
    } catch { toast.error('Failed to remove image') }
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
                      className="absolute right-0 mt-2 w-72 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50 max-h-[70vh] overflow-y-auto"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="px-3 py-2 border-b border-gray-100 dark:border-gray-700">
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Share Card</p>
                      </div>

                      {/* Row 1: Messaging apps */}
                      <div className="px-2 py-1.5 border-b border-gray-50 dark:border-gray-750">
                        <p className="text-[10px] font-medium text-gray-400 uppercase px-2 mb-1">Messaging</p>
                        <div className="flex flex-wrap gap-1">
                          {[
                            { p: 'whatsapp', icon: '💬', label: 'WhatsApp' },
                            { p: 'line', icon: '💚', label: 'Line' },
                            { p: 'kakaotalk', icon: '💛', label: 'KakaoTalk' },
                            { p: 'wechat', icon: '🟢', label: 'WeChat' },
                            { p: 'sms', icon: '📱', label: 'SMS' },
                          ].map(({ p, icon, label }) => (
                            <button key={p}
                              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-xs dark:text-gray-200"
                              onClick={() => handleSocialShare(p)}
                            >
                              <span className="text-sm">{icon}</span> {label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Row 2: Social networks */}
                      <div className="px-2 py-1.5 border-b border-gray-50 dark:border-gray-750">
                        <p className="text-[10px] font-medium text-gray-400 uppercase px-2 mb-1">Social</p>
                        <div className="flex flex-wrap gap-1">
                          {[
                            { p: 'linkedin', icon: '💼', label: 'LinkedIn' },
                            { p: 'facebook', icon: '📘', label: 'Facebook' },
                            { p: 'twitter', icon: '𝕏', label: 'X/Twitter' },
                            { p: 'instagram', icon: '📷', label: 'Instagram' },
                          ].map(({ p, icon, label }) => (
                            <button key={p}
                              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-xs dark:text-gray-200"
                              onClick={() => handleSocialShare(p)}
                            >
                              <span className="text-sm">{icon}</span> {label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Row 3: Email + Copy + Download */}
                      <div className="px-2 py-1.5 border-b border-gray-50 dark:border-gray-750">
                        <p className="text-[10px] font-medium text-gray-400 uppercase px-2 mb-1">More</p>
                        <div className="flex flex-wrap gap-1">
                          {[
                            { p: 'email', icon: '📧', label: 'Email' },
                            { p: 'copy', icon: '🔗', label: 'Copy Link' },
                          ].map(({ p, icon, label }) => (
                            <button key={p}
                              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-xs dark:text-gray-200"
                              onClick={() => handleSocialShare(p)}
                            >
                              <span className="text-sm">{icon}</span> {label}
                            </button>
                          ))}
                          <button
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/20 text-xs text-indigo-600 dark:text-indigo-400 font-medium"
                            onClick={handleBrandedShareDownload}
                            disabled={isGeneratingShareCard}
                          >
                            {isGeneratingShareCard ? '⏳ Loading...' : '⬇️ Download Card'}
                          </button>
                        </div>
                      </div>

                      {/* Bottom: Add to Wallet / Home Screen */}
                      <div className="px-3 py-2">
                        <button
                          className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-xs dark:text-gray-300 flex items-center gap-2"
                          onClick={() => {
                            setShowShareMenu(false);
                            toast.info('📱 Add to Home Screen: use browser menu → Add to Home Screen');
                          }}
                        >
                          <span className="text-sm">📌</span> Add to Home Screen
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </DialogHeader>
          
          <ScrollArea className="flex-1 p-6">
            <div className="space-y-8">
              {/* ─── Image Album Section ─── */}
              {albumImages.length > 0 ? (
                <div className="space-y-3">
                  {/* Main image display */}
                  <div className="relative">
                    <div 
                      className="relative rounded-lg overflow-hidden cursor-pointer bg-gray-50 dark:bg-gray-800"
                      style={{ height: '40vh' }}
                      onClick={() => setIsImageEnlarged(true)}
                    >
                      <img
                        src={albumImages[albumIndex].url}
                        alt={`${card.name} - ${albumImages[albumIndex].label || 'card'}`}
                        className={`w-full h-full object-contain rounded-lg`}
                      />
                    </div>

                    {/* Label badge */}
                    <div className="absolute top-3 left-3 flex gap-1.5">
                      {albumImages[albumIndex].label === 'cover' && (
                        <span className="bg-gray-600/90 text-white text-[10px] px-2 py-0.5 rounded-full">Cover</span>
                      )}
                      {(!albumImages[albumIndex].label || albumImages[albumIndex].label === '') && (
                        <span className="bg-emerald-600/90 text-white text-[10px] px-2 py-0.5 rounded-full">Photo {albumIndex + 1}</span>
                      )}
                    </div>

                    {/* Top-right actions */}
                    <div className="absolute top-3 right-3 flex gap-1.5">
                      <Button size="sm" variant="outline" className="h-7 px-2 text-[11px] bg-white/80 dark:bg-gray-900/80"
                        onClick={(e) => { e.stopPropagation(); handleDownload() }}>
                        <Download className="h-3 w-3" />
                      </Button>
                      <label className="h-7 px-2 text-[11px] bg-white/80 dark:bg-gray-900/80 border rounded-md flex items-center gap-1 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
                        <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={isUploadingImage}
                          ref={fileInputRef} />
                        {isUploadingImage ? <div className="animate-spin h-3 w-3 border-2 border-gray-500 border-t-transparent rounded-full" /> : <><span className="text-[16px]">+</span> Add</>}
                      </label>
                    </div>
                  </div>

                  {/* Album thumbnail strip */}
                  {albumImages.length > 1 && (
                    <div className="flex gap-2 overflow-x-auto pb-1">
                      {albumImages.map((img: any, i: number) => (
                        <div key={i} className={`relative flex-shrink-0 cursor-pointer rounded-md overflow-hidden border-2 transition-all
                          ${i === albumIndex ? 'border-indigo-500 shadow-md' : 'border-transparent opacity-60 hover:opacity-100'}`}
                          onClick={() => setAlbumIndex(i)}>
                          <img src={img.url} alt={`${img.label || 'photo'} ${i+1}`} 
                            className="w-16 h-12 object-cover" />
                          {/* Set as cover button */}
                          {img.url !== editedCard.image_url && (
                            <button className="absolute bottom-0.5 right-0.5 bg-black/60 text-white text-[9px] px-1 rounded"
                              onClick={(e) => { e.stopPropagation(); handleSetCover(img.url) }}>
                              Cover
                            </button>
                          )}
                          {/* Remove button for extra images (not cover) */}
                          {img.label !== 'cover' && albumImages.length > 1 && (
                            <button className="absolute top-0.5 right-0.5 bg-red-500/80 text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center"
                              onClick={(e) => { e.stopPropagation(); handleRemoveImage(img.url) }}>
                              ×
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Album nav arrows */}
                  {albumImages.length > 1 && (
                    <div className="flex justify-between items-center text-xs text-muted-foreground px-1">
                      <span>{albumIndex + 1} / {albumImages.length}</span>
                      <span className="text-[10px]">← swipe or click thumbnails →</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="rounded-lg bg-gray-50 dark:bg-gray-800 p-8 text-center space-y-3">
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t('card.noImage', defaultLabels.noImage)}</p>
                  <label className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg cursor-pointer hover:bg-indigo-700 text-sm">
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={isUploadingImage} />
                    + Add Photo
                  </label>
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