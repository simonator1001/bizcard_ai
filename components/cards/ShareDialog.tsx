'use client'

import { useState } from 'react'
import { BusinessCard } from '@/types/business-card';
import { Button } from '@/components/ui/button';
import { Mail, Share2, Copy, Download, X, Sparkles, Loader2, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';
import { generateShareCardImage, dataUrlToBlob } from '@/lib/share-card-generator';
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
  const [isGenerating, setIsGenerating] = useState(false);

  // ── Original: Share raw image ──
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

  // ── Branded: Share BizCard AI template ──
  const handleBrandedDownload = async () => {
    setIsGenerating(true);
    try {
      const dataUrl = await generateShareCardImage({ 
        card, 
        userId: (card as any).user_id 
      });
      const blob = dataUrlToBlob(dataUrl);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${card.name || 'card'}_bizcard.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('Branded card downloaded!');
      onOpenChange(false);
    } catch (error) {
      console.error('Error generating share card:', error);
      toast.error('Failed to generate share card');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleBrandedEmail = () => {
    const shareUrl = `https://simon-gpt.com/share/${(card as any).user_id || ''}`;
    const subject = encodeURIComponent(`${card.name || ''}'s Digital Business Card — BizCard AI`);
    const body = encodeURIComponent(
      `Hi! 👋\n\nHere's ${card.name || ''}'s digital business card, created with BizCard AI:\n\n` +
      `📇 View card: ${shareUrl}\n\n` +
      `✨ Get your own free digital card at simon-gpt.com`
    );
    window.open(`mailto:?subject=${subject}&body=${body}`);
    onOpenChange(false);
  };

  const handleBrandedWhatsApp = () => {
    const shareUrl = `https://simon-gpt.com/share/${(card as any).user_id || ''}`;
    const text = encodeURIComponent(
      `📇 ${card.name || ''}'s Digital Business Card\n` +
      `${card.title ? `💼 ${card.title}${card.company ? ` at ${card.company}` : ''}\n` : ''}` +
      `\n🔗 ${shareUrl}\n\n` +
      `✨ Get your own free digital card at simon-gpt.com`
    );
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
          
          {/* Raw Image Share */}
          <div className="space-y-1">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">Share Raw Image</p>
            <div className="flex flex-col gap-1">
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

          {/* Branded Share */}
          <div className="space-y-1 pt-2 border-t">
            <p className="text-xs font-semibold text-indigo-500 uppercase tracking-wider px-1 flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> Branded Share
            </p>
            <div className="flex flex-col gap-1">
              <Button
                variant="outline"
                className="w-full justify-start text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-900/20"
                onClick={handleBrandedEmail}
              >
                <Mail className="mr-2 h-4 w-4" />
                Share via Email
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-900/20"
                onClick={handleBrandedWhatsApp}
              >
                <MessageCircle className="mr-2 h-4 w-4" />
                Share via WhatsApp
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-900/20"
                onClick={handleBrandedDownload}
                disabled={isGenerating}
              >
                {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                Download Branded Card
              </Button>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}