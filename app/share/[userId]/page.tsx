'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  Mail, Phone, Globe, MapPin, Briefcase, User, Download, Share2, 
  Sparkles, QrCode, ExternalLink, MessageCircle, Copy, ChevronRight,
  Twitter
} from 'lucide-react'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'

interface MyCardData {
  name: string
  title: string
  company: string
  email: string
  phone: string
  website: string
  address: string
  photo: string
  twitter: string
  wechat: string
}

export default function ShareCardPage() {
  const params = useParams()
  const { t } = useTranslation()
  const [card, setCard] = useState<MyCardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadCard() {
      try {
        const userId = params?.userId as string
        if (!userId) throw new Error('No user ID')
        
        const APPWRITE_ENDPOINT = 'https://sgp.cloud.appwrite.io/v1'
        const APPWRITE_PROJECT = '69efa226000db23fcd89'
        
        const res = await fetch(`${APPWRITE_ENDPOINT}/users/${userId}`, {
          headers: {
            'X-Appwrite-Project': APPWRITE_PROJECT,
          }
        })
        
        if (!res.ok) throw new Error('User not found')
        const userData = await res.json()
        
        setCard({
          name: userData.name || '',
          title: userData.prefs?.title || '',
          company: userData.prefs?.company || '',
          email: userData.email || '',
          phone: userData.prefs?.phone || '',
          website: userData.prefs?.website || '',
          address: userData.prefs?.address || '',
          photo: userData.prefs?.photo || '',
          twitter: userData.prefs?.twitter || '',
          wechat: userData.prefs?.wechat || '',
        })
      } catch (err: any) {
        setError(err.message || 'Failed to load card')
      } finally {
        setLoading(false)
      }
    }
    
    if (params?.userId) loadCard()
  }, [params?.userId])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="h-16 w-16 animate-spin rounded-full border-4 border-white/30 border-t-white" />
            <Sparkles className="absolute inset-0 m-auto w-8 h-8 text-white/60 animate-pulse" />
          </div>
          <p className="text-white/80 text-sm animate-pulse">{t('shareCard.loading', 'Loading card...')}</p>
        </div>
      </div>
    )
  }

  if (error || !card) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 p-4">
        <div className="text-center">
          <div className="w-20 h-20 mx-auto rounded-full bg-white/10 backdrop-blur flex items-center justify-center mb-4">
            <User className="w-10 h-10 text-white/60" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">{t('shareCard.notFound', 'Card Not Found')}</h2>
          <p className="text-white/60 mb-6">{error || t('shareCard.notAvailable', 'This digital card is not available')}</p>
          <a href="/signin">
            <Button className="rounded-full bg-white text-indigo-600 hover:bg-white/90 font-semibold">
              {t('shareCard.createFree', 'Create Free Card')} <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </a>
        </div>
      </div>
    )
  }

  const handleShare = async () => {
    const shareData = {
      title: `${card.name} - Digital Business Card`,
      text: `Check out ${card.name}'s digital business card!`,
      url: window.location.href,
    }
    
    if (navigator.share && navigator.canShare?.(shareData)) {
      await navigator.share(shareData)
    } else {
      await navigator.clipboard.writeText(window.location.href)
      toast.success(t('shareCard.linkCopied', 'Link copied!'))
    }
  }

  const handleSaveContact = () => {
    const vCard = [
      'BEGIN:VCARD', 'VERSION:3.0',
      `FN:${card.name}`,
      card.title && `TITLE:${card.title}`,
      card.company && `ORG:${card.company}`,
      card.email && `EMAIL:${card.email}`,
      card.phone && `TEL:${card.phone}`,
      card.website && `URL:${card.website}`,
      card.address && `ADR:;;${card.address};;;`,
      'END:VCARD'
    ].filter(Boolean).join('\n')
    
    const blob = new Blob([vCard], { type: 'text/vcard' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${card.name.replace(/\s+/g, '_')}.vcf`
    a.click()
    URL.revokeObjectURL(url)
    toast.success(t('shareCard.contactSaved', 'Contact saved!'))
  }

  const handleWhatsAppShare = () => {
    const text = encodeURIComponent(`${card.name}'s Digital Business Card\n${window.location.href}`)
    window.open(`https://wa.me/?text=${text}`)
  }

  const cardUrl = typeof window !== 'undefined' ? window.location.href : ''
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(cardUrl)}&bgcolor=ffffff&color=4f46e5`

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700">
      {/* Animated background pattern */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-white/5 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-pink-500/10 blur-3xl" />
      </div>

      <div className="relative max-w-md mx-auto px-4 py-8 pb-32">
        {/* Header */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="inline-flex items-center gap-1.5 bg-white/10 backdrop-blur rounded-full px-4 py-1.5 mb-4">
            <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
            <span className="text-white/70 text-xs font-medium">Digital Business Card</span>
          </div>
          
          {/* Avatar */}
          <div className="mb-4">
            {card.photo ? (
              <Avatar className="h-28 w-28 mx-auto ring-4 ring-white/20 shadow-2xl">
                <AvatarImage src={card.photo} />
                <AvatarFallback className="text-3xl bg-white/10 text-white">
                  {card.name?.split(' ').map(n => n[0]).join('') || 'U'}
                </AvatarFallback>
              </Avatar>
            ) : (
              <div className="h-28 w-28 mx-auto rounded-full bg-white/10 backdrop-blur flex items-center justify-center ring-4 ring-white/20">
                <User className="w-14 h-14 text-white/50" />
              </div>
            )}
          </div>
          
          <h1 className="text-3xl font-bold text-white mb-1">{card.name}</h1>
          {card.title && <p className="text-white/80 text-lg">{card.title}</p>}
          {card.company && (
            <p className="text-white/50 text-sm mt-1 flex items-center justify-center gap-1">
              <Briefcase className="w-3.5 h-3.5" /> {card.company}
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 mb-8 animate-fade-in-up">
          <Button 
            onClick={handleSaveContact}
            className="flex-1 rounded-2xl bg-white text-indigo-600 hover:bg-white/90 font-semibold shadow-lg shadow-black/10 h-12"
          >
            <Download className="w-4 h-4 mr-2" /> {t('shareCard.saveContact', 'Save Contact')}
          </Button>
          <Button 
            onClick={handleShare}
            variant="outline"
            className="flex-1 rounded-2xl border-white/20 bg-white/10 backdrop-blur text-white hover:bg-white/20 h-12"
          >
            <Share2 className="w-4 h-4 mr-2" /> {t('shareCard.share', 'Share')}
          </Button>
        </div>

        {/* Contact Details */}
        <Card className="bg-white/10 backdrop-blur-md border-white/10 shadow-2xl animate-fade-in-up delay-100">
          <CardContent className="p-4 space-y-1">
            {card.email && (
              <a href={`mailto:${card.email}`} 
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/10 transition-colors group">
                <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Mail className="w-5 h-5 text-indigo-300" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-white/40">{t('shareCard.email', 'Email')}</p>
                  <p className="text-sm font-medium text-white truncate">{card.email}</p>
                </div>
                <ExternalLink className="w-4 h-4 text-white/20 group-hover:text-white/60 transition-colors" />
              </a>
            )}
            
            {card.phone && (
              <a href={`tel:${card.phone}`}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/10 transition-colors group">
                <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Phone className="w-5 h-5 text-green-300" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-white/40">{t('shareCard.phone', 'Phone')}</p>
                  <p className="text-sm font-medium text-white truncate">{card.phone}</p>
                </div>
              </a>
            )}
            
            {card.website && (
              <a href={card.website.startsWith('http') ? card.website : `https://${card.website}`} target="_blank"
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/10 transition-colors group">
                <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Globe className="w-5 h-5 text-blue-300" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-white/40">{t('shareCard.website', 'Website')}</p>
                  <p className="text-sm font-medium text-white truncate">{card.website}</p>
                </div>
                <ExternalLink className="w-4 h-4 text-white/20 group-hover:text-white/60 transition-colors" />
              </a>
            )}
            
            {card.address && (
              <div className="flex items-center gap-3 p-3 rounded-xl">
                <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-amber-300" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-white/40">{t('shareCard.address', 'Address')}</p>
                  <p className="text-sm font-medium text-white truncate">{card.address}</p>
                </div>
              </div>
            )}

            {/* Social links */}
            {(card.twitter || card.wechat) && (
              <div className="flex gap-2 pt-2 px-3">
                {card.twitter && (
                  <a href={`https://twitter.com/${card.twitter.replace('@', '')}`} target="_blank"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white text-xs transition-colors">
                    <Twitter className="w-3.5 h-3.5" /> Twitter
                  </a>
                )}
                {card.wechat && (
                  <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 text-white/70 text-xs">
                    💬 WeChat: {card.wechat}
                  </span>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Share — Social Platforms */}
        <div className="mt-4 animate-fade-in-up delay-200">
          <p className="text-white/30 text-[10px] text-center mb-2 uppercase tracking-wider">Share via</p>
          <div className="flex flex-wrap justify-center gap-2">
            {[
              { app: 'WhatsApp', icon: '💬', url: `https://wa.me/?text=${encodeURIComponent(`${card.name}'s Digital Business Card\n\n🔗 ${cardUrl}\n\n✨ Get your own: simon-gpt.com`)}`, color: 'bg-green-500/20 text-green-200 hover:bg-green-500/30 border-green-500/20' },
              { app: 'Line', icon: '💚', url: `https://line.me/R/msg/text/?${encodeURIComponent(`${card.name}'s Digital Business Card\n${cardUrl}\n\n✨ simon-gpt.com`)}`, color: 'bg-green-600/20 text-green-200 hover:bg-green-600/30 border-green-500/20' },
              { app: 'LinkedIn', icon: '💼', url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(cardUrl)}`, color: 'bg-blue-500/20 text-blue-200 hover:bg-blue-500/30 border-blue-500/20' },
              { app: 'Facebook', icon: '📘', url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(cardUrl)}`, color: 'bg-blue-600/20 text-blue-200 hover:bg-blue-600/30 border-blue-500/20' },
              { app: 'X', icon: '𝕏', url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(`${card.name}'s Digital Business Card`)}&url=${encodeURIComponent(cardUrl)}`, color: 'bg-gray-500/20 text-gray-200 hover:bg-gray-500/30 border-gray-500/20' },
            ].map(({ app, icon, url, color }) => (
              <a key={app} href={url} target="_blank" rel="noopener noreferrer"
                className={`flex items-center gap-1.5 px-3 py-2 rounded-full border text-xs font-medium transition-colors ${color}`}>
                <span className="text-base">{icon}</span> {app}
              </a>
            ))}
          </div>
        </div>

        {/* Viral CTA — Get Your Own Card */}
        <div className="mt-8 text-center animate-fade-in-up delay-300">
          <div className="bg-white/5 backdrop-blur rounded-2xl p-6 border border-white/10">
            <div className="w-12 h-12 mx-auto rounded-full bg-gradient-to-r from-yellow-400 to-orange-400 flex items-center justify-center mb-3 shadow-lg shadow-orange-500/20">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-lg font-bold text-white mb-1">
              {t('shareCard.getYourOwn', 'Get Your Own Card 🚀')}
            </h3>
            <p className="text-white/50 text-sm mb-4">
              {t('shareCard.getYourOwnDesc', 'Create your free digital business card in seconds')}
            </p>
            <a href="/signin">
              <Button className="w-full rounded-xl bg-white text-indigo-600 hover:bg-white/90 font-semibold shadow-lg shadow-black/10 h-11">
                {t('shareCard.createFree', 'Create Free Card')} <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </a>
            <p className="text-white/20 text-xs mt-3">{t('shareCard.poweredBy', 'Powered by BizCard')}</p>
          </div>
        </div>

        {/* QR Code Section */}
        <div className="mt-6 text-center animate-fade-in-up delay-300">
          <div className="inline-block bg-white p-3 rounded-2xl shadow-xl">
            <img src={qrCodeUrl} alt="QR Code" className="w-32 h-32" />
          </div>
          <p className="text-white/40 text-xs mt-2">Scan to save contact</p>
        </div>
      </div>

      {/* Inline animation styles */}
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fadeIn 0.6s ease-out forwards;
        }
        .animate-fade-in-up {
          opacity: 0;
          animation: fadeIn 0.6s ease-out forwards;
          animation-delay: 0.15s;
        }
        .delay-100 { animation-delay: 0.25s; }
        .delay-200 { animation-delay: 0.35s; }
        .delay-300 { animation-delay: 0.5s; }
      `}</style>
    </div>
  )
}
