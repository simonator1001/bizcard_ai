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
    if (!card.imageUrl) return;
    
    try {
      await navigator.clipboard.writeText(card.imageUrl);
      toast.success('Link copied to clipboard');
    } catch (error) {
      console.error('Error copying link:', error);
      toast.error('Failed to copy link');
    }
  };

  const handleEmailShare = () => {
    if (!card.imageUrl) return;
    
    const subject = encodeURIComponent(`Business Card - ${card.name || ''}`);
    const body = encodeURIComponent(`View this business card: ${card.imageUrl}`);
    window.open(`mailto:?subject=${subject}&body=${body}`);
  };

  const handleWhatsAppShare = () => {
    if (!card.imageUrl) return;
    
    const text = encodeURIComponent(`Business Card - ${card.name || ''}\n${card.imageUrl}`);
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
                  {card.imageUrl || 'No image available'}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={handleCopyLink}
                  disabled={!card.imageUrl}
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
              disabled={!card.imageUrl}
            >
              <Mail className="mr-2 h-4 w-4" />
              Share via Email
            </Button>
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={handleWhatsAppShare}
              disabled={!card.imageUrl}
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