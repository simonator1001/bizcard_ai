'use client'

import { BusinessCard } from '@/types/business-card';
import { Button } from '@/components/ui/button';
import { Mail, Share2, Copy, Download, X } from 'lucide-react';
import { toast } from 'sonner';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

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
      onOpenChange(false);
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
      onOpenChange(false);
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
    onOpenChange(false);
  };

  const handleWhatsAppShare = () => {
    if (!card.image_url) return;
    
    const text = encodeURIComponent(`Business Card - ${card.name || ''}\n${card.image_url}`);
    window.open(`https://wa.me/?text=${text}`);
    onOpenChange(false);
  };

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="icon">
          <Share2 className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="space-y-4">
          <h3 className="font-medium">Share Business Card</h3>
          <div className="flex flex-col gap-2">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={handleEmailShare}
              disabled={!card.image_url}
            >
              <Mail className="mr-2 h-4 w-4" />
              Share via Email
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={handleWhatsAppShare}
              disabled={!card.image_url}
            >
              <Share2 className="mr-2 h-4 w-4" />
              Share via WhatsApp
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={handleCopyLink}
              disabled={!card.image_url}
            >
              <Copy className="mr-2 h-4 w-4" />
              Copy Link
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={handleDownload}
              disabled={!card.image_url}
            >
              <Download className="mr-2 h-4 w-4" />
              Download Image
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
} 