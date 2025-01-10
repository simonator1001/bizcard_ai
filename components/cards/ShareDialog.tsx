'use client'

import { BusinessCard } from '@/types/business-card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Mail, Share2, Copy } from 'lucide-react';
import { toast } from 'sonner';

interface ShareDialogProps {
  card: BusinessCard;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ShareDialog({ card, open, onOpenChange }: ShareDialogProps) {
  const handleCopyLink = async () => {
    if (!card.image_url) return;
    
    try {
      await navigator.clipboard.writeText(card.image_url);
      toast.success('Link copied to clipboard');
    } catch (error) {
      console.error('Error copying link:', error);
      toast.error('Failed to copy link');
    }
  };

  const handleDownload = async () => {
    if (!card.image_url) return;

    try {
      const response = await fetch(card.image_url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${card.name || 'card'}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('Image downloaded successfully');
    } catch (error) {
      console.error('Error downloading image:', error);
      toast.error('Failed to download image');
    }
  };

  const handleEmailShare = () => {
    if (!card.image_url) return;
    
    const subject = encodeURIComponent(`Business Card - ${card.name || ''}`);
    const body = encodeURIComponent(`View this business card: ${card.image_url}`);
    window.open(`mailto:?subject=${subject}&body=${body}`);
  };

  const handleWhatsAppShare = () => {
    if (!card.image_url) return;
    
    const text = encodeURIComponent(`Business Card - ${card.name || ''}\n${card.image_url}`);
    window.open(`https://wa.me/?text=${text}`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share Business Card</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <div className="grid flex-1 gap-2">
              <div className="flex items-center justify-between gap-2 rounded-md border p-2">
                <span className="text-sm text-gray-600 truncate">
                  {card.image_url || 'No image available'}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={handleCopyLink}
                  disabled={!card.image_url}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={handleEmailShare}
              disabled={!card.image_url}
            >
              <Mail className="mr-2 h-4 w-4" />
              Share via Email
            </Button>
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={handleWhatsAppShare}
              disabled={!card.image_url}
            >
              <Share2 className="mr-2 h-4 w-4" />
              Share via WhatsApp
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 