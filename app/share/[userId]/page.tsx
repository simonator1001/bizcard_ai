'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Mail, Phone, Globe, MapPin, Briefcase, User, Download, Share2 } from 'lucide-react'
import { toast } from 'sonner'

interface MyCardData {
  name: string
  title: string
  company: string
  email: string
  phone: string
  website: string
  address: string
  photo: string
  linkedin: string
  twitter: string
  wechat: string
}

export default function ShareCardPage() {
  const params = useParams()
  const [card, setCard] = useState<MyCardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadCard() {
      try {
        const userId = params?.userId as string
        if (!userId) throw new Error('No user ID')
        // Fetch user's card from AppWrite
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
          linkedin: userData.prefs?.linkedin || '',
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-violet-50 dark:from-gray-900 dark:to-gray-800">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
          <p className="text-gray-500 text-sm">Loading card...</p>
        </div>
      </div>
    )
  }

  if (error || !card) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-violet-50 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto rounded-full bg-red-100 flex items-center justify-center mb-4">
            <User className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-xl font-bold mb-2">Card Not Found</h2>
          <p className="text-gray-500">{error || 'This digital card is not available'}</p>
        </div>
      </div>
    )
  }

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ title: card.name, url: window.location.href })
    } else {
      navigator.clipboard.writeText(window.location.href)
      toast.success('Link copied!')
    }
  }

  const handleSaveContact = () => {
    // Create vCard
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
    toast.success('Contact saved!')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-violet-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-sm overflow-hidden shadow-2xl border-0">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-violet-600 p-8 text-center text-white">
          {card.photo ? (
            <Avatar className="h-24 w-24 mx-auto ring-4 ring-white/30 mb-4">
              <AvatarImage src={card.photo} />
              <AvatarFallback className="text-2xl bg-white/20">
                {card.name?.split(' ').map(n => n[0]).join('') || 'U'}
              </AvatarFallback>
            </Avatar>
          ) : (
            <div className="h-24 w-24 mx-auto rounded-full bg-white/20 flex items-center justify-center mb-4 ring-4 ring-white/30">
              <User className="w-12 h-12 text-white/70" />
            </div>
          )}
          <h1 className="text-2xl font-bold">{card.name}</h1>
          {card.title && <p className="text-white/80 mt-1">{card.title}</p>}
          {card.company && (
            <p className="text-white/60 text-sm mt-1 flex items-center justify-center gap-1">
              <Briefcase className="w-3.5 h-3.5" /> {card.company}
            </p>
          )}
        </div>

        {/* Details */}
        <CardContent className="p-6 space-y-4">
          {card.email && (
            <a href={`mailto:${card.email}`} className="flex items-center gap-3 p-3 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-colors">
              <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                <Mail className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Email</p>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{card.email}</p>
              </div>
            </a>
          )}
          
          {card.phone && (
            <a href={`tel:${card.phone}`} className="flex items-center gap-3 p-3 rounded-xl bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors">
              <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <Phone className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Phone</p>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{card.phone}</p>
              </div>
            </a>
          )}
          
          {card.website && (
            <a href={card.website.startsWith('http') ? card.website : `https://${card.website}`} target="_blank" className="flex items-center gap-3 p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors">
              <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <Globe className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Website</p>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{card.website}</p>
              </div>
            </a>
          )}
          
          {card.address && (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20">
              <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                <MapPin className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Address</p>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{card.address}</p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button onClick={handleSaveContact} className="flex-1 rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 text-white">
              <Download className="mr-1.5 h-4 w-4" /> Save Contact
            </Button>
            <Button variant="outline" onClick={handleShare} className="rounded-full">
              <Share2 className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
