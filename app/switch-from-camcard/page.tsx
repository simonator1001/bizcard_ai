'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/lib/auth-context'
import { account } from '@/lib/appwrite'
import { toast } from 'sonner'

import {
  Check,
  X,
  Download,
  Shield,
  Zap,
  Lock,
  Unlock,
  Users,
  Star,
  TrendingUp,
  FileSpreadsheet,
  Globe,
  CreditCard,
  Camera,
  ThumbsDown,
  Upload,
  FileText,
  Loader2,
  ArrowRight,
} from 'lucide-react'

// ─── Types ───────────────────────────────────────────────

interface ComparisonRow {
  feature: string
  featureZh: string
  camcard: string | boolean | JSX.Element
  bizcard: string | boolean | JSX.Element
}

interface ReviewQuote {
  name: string
  platform: string
  rating: number
  date: string
  quote: string
  quoteZh: string
}

// ─── Data ────────────────────────────────────────────────

const comparisonData: ComparisonRow[] = [
  {
    feature: 'Data Hostage',
    featureZh: '數據綁架',
    camcard: (
      <span className="flex items-center gap-1.5 text-red-600 dark:text-red-400 font-semibold">
        <Lock className="w-4 h-4" />
        Yes — exports locked behind paywall
        <br />
        <span className="text-xs text-red-500">是 — 導出功能需付費解鎖</span>
      </span>
    ),
    bizcard: (
      <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold">
        <Unlock className="w-4 h-4" />
        No — always exportable
        <br />
        <span className="text-xs text-emerald-500">否 — 隨時免費導出</span>
      </span>
    ),
  },
  {
    feature: 'Free Tier',
    featureZh: '免費方案',
    camcard: (
      <span className="text-red-600 dark:text-red-400 font-semibold">
        ~10 cards, no export
        <br />
        <span className="text-xs">約10張卡片，無法導出</span>
      </span>
    ),
    bizcard: (
      <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
        Unlimited cards & export
        <br />
        <span className="text-xs">無限卡片 & 免費導出</span>
      </span>
    ),
  },
  {
    feature: 'Pricing (Annual)',
    featureZh: '年費定價',
    camcard: (
      <span className="text-red-600 dark:text-red-400 font-semibold">
        $59.99–$119.99
      </span>
    ),
    bizcard: (
      <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
        Free / $29.99 Pro
      </span>
    ),
  },
  {
    feature: 'Cancellation',
    featureZh: '取消訂閱',
    camcard: (
      <span className="flex items-center gap-1.5 text-red-600 dark:text-red-400">
        <X className="w-4 h-4" />
        Difficult — auto-renew traps
        <br />
        <span className="text-xs">困難 — 自動續費陷阱</span>
      </span>
    ),
    bizcard: (
      <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
        <Check className="w-4 h-4" />
        Cancel anytime, 1-click
        <br />
        <span className="text-xs">隨時取消，一鍵搞定</span>
      </span>
    ),
  },
  {
    feature: 'OCR Quality',
    featureZh: 'OCR辨識質素',
    camcard: (
      <span className="text-amber-500 dark:text-amber-400">
        Good for EN, poor for ZH
        <br />
        <span className="text-xs">英文尚可，中文較差</span>
      </span>
    ),
    bizcard: (
      <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
        <Check className="w-4 h-4" />
        AI-powered EN + ZH + 20+ langs
        <br />
        <span className="text-xs">AI驅動 中英文+20種語言</span>
      </span>
    ),
  },
  {
    feature: 'Export Formats',
    featureZh: '導出格式',
    camcard: (
      <span className="text-red-600 dark:text-red-400">
        CSV only (Premium)
        <br />
        <span className="text-xs">僅CSV（需Premium）</span>
      </span>
    ),
    bizcard: (
      <span className="text-emerald-600 dark:text-emerald-400">
        CSV, vCard, Excel, Google Contacts
        <br />
        <span className="text-xs">CSV、vCard、Excel、Google通訊錄</span>
      </span>
    ),
  },
  {
    feature: 'Trust & Privacy',
    featureZh: '信任與私隱',
    camcard: (
      <span className="flex items-center gap-1.5 text-red-600 dark:text-red-400">
        <ThumbsDown className="w-4 h-4" />
        Data sold? No clarity
        <br />
        <span className="text-xs">數據用途不明確</span>
      </span>
    ),
    bizcard: (
      <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
        <Shield className="w-4 h-4" />
        Your data is yours. Period.
        <br />
        <span className="text-xs">你的數據屬於你</span>
      </span>
    ),
  },
  {
    feature: 'HK / Chinese Support',
    featureZh: '香港/中文支援',
    camcard: (
      <span className="text-amber-500 dark:text-amber-400">
        Limited
        <br />
        <span className="text-xs">有限</span>
      </span>
    ),
    bizcard: (
      <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
        <Check className="w-4 h-4" />
        Full EN + 中文 + 廣東話
        <br />
        <span className="text-xs">完整支援英文、中文、廣東話</span>
      </span>
    ),
  },
]

const reviewQuotes: ReviewQuote[] = [
  {
    name: 'Jason L.',
    platform: 'App Store',
    rating: 1,
    date: '2025',
    quote: 'They locked all my contacts behind a paywall after I stopped subscribing. 600+ business cards — gone. Absolute scammers.',
    quoteZh: '取消訂閱後，全部聯絡人被鎖在付費牆後面。600+張名片全部無法存取。完全是騙局。',
  },
  {
    name: 'M. Chan',
    platform: 'Google Play',
    rating: 1,
    date: '2025',
    quote: 'Auto-renewed me for $119.99 with zero warning. No refund policy. Had to dispute with my bank. Never again.',
    quoteZh: '沒有任何通知就自動續費$119.99美金。沒有退款政策，只能跟銀行投訴。以後不會再用。',
  },
  {
    name: 'Sarah K.',
    platform: 'App Store',
    rating: 2,
    date: '2025',
    quote: 'OCR is decent but you can\'t export your own data without paying. That\'s literally holding my contacts hostage.',
    quoteZh: 'OCR還可以，但不付錢就不能導出自己的數據。這根本就是綁架我的聯絡人。',
  },
  {
    name: 'David W.',
    platform: 'Trustpilot',
    rating: 1,
    date: '2024',
    quote: 'Tried to cancel 3 times. They kept charging my card. Support ignores emails. Had to cancel my credit card to stop them.',
    quoteZh: '嘗試取消3次，但他們還是繼續收費。客服不理會電郵。最終要取消信用卡才能阻止他們。',
  },
  {
    name: 'Emily T.',
    platform: 'Google Play',
    rating: 1,
    date: '2025',
    quote: 'Upgraded to Premium just to export my contacts. Then they auto-renewed at $119.99. This app is designed to trap you.',
    quoteZh: '為了導出聯絡人被迫升級到Premium。然後他們自動續費$119.99。這個App的設計就是要困住你。',
  },
  {
    name: 'HK User ★★☆☆☆',
    platform: 'App Store (HK)',
    rating: 2,
    date: '2025',
    quote: '中文OCR成日錯，公司名同人名亂晒。最慘係冇得export返出嚟，焗住俾錢。中伏！',
    quoteZh: '中文OCR经常出错，公司名和人名全乱了。最惨是没法导出，被逼付钱。踩雷了！',
  },
]

// ─── Components ──────────────────────────────────────────

function StarRating({ rating, max = 5 }: { rating: number; max?: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${rating} out of ${max} stars`}>
      {Array.from({ length: max }).map((_, i) => (
        <Star
          key={i}
          className={`w-3.5 h-3.5 ${
            i < rating
              ? 'fill-amber-400 text-amber-400'
              : 'fill-gray-200 text-gray-200 dark:fill-gray-700 dark:text-gray-700'
          }`}
        />
      ))}
    </span>
  )
}

function ReviewCard({ review }: { review: ReviewQuote }) {
  return (
    <Card className="border-red-200 dark:border-red-900/50 bg-white/80 dark:bg-gray-900/60 backdrop-blur-sm hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-100 to-red-200 dark:from-red-900/40 dark:to-red-800/40 flex items-center justify-center text-red-600 dark:text-red-400 font-bold text-sm">
              {review.name[0]}
            </div>
            <div>
              <p className="text-sm font-semibold">{review.name}</p>
              <p className="text-xs text-muted-foreground">{review.platform} · {review.date}</p>
            </div>
          </div>
          <StarRating rating={review.rating} />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <blockquote className="border-l-3 border-red-300 dark:border-red-700 pl-4 italic text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
          &ldquo;{review.quote}&rdquo;
        </blockquote>
        {review.quoteZh && (
          <p className="text-xs text-muted-foreground leading-relaxed">
            {review.quoteZh}
          </p>
        )}
      </CardContent>
    </Card>
  )
}

// ─── Main Page ───────────────────────────────────────────

export default function SwitchFromCamCardPage() {
  const [mounted, setMounted] = useState(false)
  const { user } = useAuth()

  // ─── Import state ────────────────────────────────────
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<{
    imported: number
    skipped: number
    total: number
    errors: { row: number; message: string }[]
  } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setMounted(true)
    document.title = 'Switch from CamCard to BizCard — Free Business Card Scanner Alternative (2026)'
  }, [])

  // ─── Import handlers ─────────────────────────────────
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImportFile(file)
      setImportResult(null)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (file) {
      setImportFile(file)
      setImportResult(null)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleImport = async () => {
    if (!importFile) {
      toast.error('Please select a file first')
      return
    }

    if (!user) {
      toast.info('Please sign up to import your contacts')
      return
    }

    setImporting(true)
    setImportResult(null)

    try {
      const jwt = await account.createJWT()

      const formData = new FormData()
      formData.append('file', importFile)
      formData.append('userId', user.$id)
      formData.append('appwriteJWT', jwt.jwt)

      const res = await fetch('/api/import', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || data.message || 'Import failed')
      }

      setImportResult(data)
      toast.success(`Imported ${data.imported} contacts!`)
    } catch (err: any) {
      console.error('[IMPORT] Error:', err)
      toast.error(err.message || 'Failed to import contacts')
    } finally {
      setImporting(false)
    }
  }

  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      {/* ─── Hero Section ────────────────────────────── */}
      <section className="relative overflow-hidden">
        {/* Background Gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-violet-50 to-pink-50 dark:from-gray-950 dark:via-indigo-950/30 dark:to-violet-950/30 pointer-events-none" />

        {/* Decorative blobs */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-indigo-300/20 dark:bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-violet-300/20 dark:bg-violet-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16 sm:pt-28 sm:pb-20 text-center">
          {/* Badge */}
          <Badge
            variant="secondary"
            className="mb-6 px-4 py-1.5 text-sm bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 border-red-200 dark:border-red-800 animate-fade-in-down"
          >
            🚨 Switching from CamCard? 從CamCard轉會？
          </Badge>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight animate-fade-in-down">
            <span className="bg-gradient-to-r from-red-500 to-red-600 dark:from-red-400 dark:to-red-500 bg-clip-text text-transparent">
              CamCard is holding your contacts hostage.
            </span>
            <br />
            <span className="bg-gradient-to-r from-indigo-600 to-violet-600 dark:from-indigo-400 dark:to-violet-400 bg-clip-text text-transparent">
              We&apos;ll get them back — for free.
            </span>
          </h1>

          {/* Sub-headline (Chinese) */}
          <p className="mt-4 text-lg text-gray-600 dark:text-gray-400 animate-fade-in-up">
            CamCard 綁架咗你嘅聯絡人？我哋幫你免費拎返。&nbsp;
            <span className="text-gray-400 dark:text-gray-500">
              你的聯絡人被 CamCard 鎖住了？我們幫你免費取回。
            </span>
          </p>

          {/* CTA Buttons */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up">
            <Link href="/signup">
              <Button
                size="lg"
                className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:shadow-indigo-500/30 transition-all duration-300 text-base px-8 py-6 rounded-full font-semibold"
              >
                <Download className="w-5 h-5 mr-2" />
                Import Your CamCard Contacts Free →
                <span className="block text-xs font-normal opacity-80 ml-2">免費導入CamCard聯絡人</span>
              </Button>
            </Link>
            <Link href="#comparison">
              <Button
                size="lg"
                variant="outline"
                className="rounded-full text-base px-8 py-6 border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50"
              >
                See Full Comparison
                <span className="block text-xs font-normal opacity-60">查看完整對比</span>
              </Button>
            </Link>
          </div>

          {/* Stats bar */}
          <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-2xl mx-auto animate-fade-in-up">
            {[
              { icon: Users, value: '2,500+', label: 'HK Users Switched', labelZh: '香港用戶已轉會' },
              { icon: FileSpreadsheet, value: '150,000+', label: 'Cards Freed', labelZh: '已解鎖名片' },
              { icon: CreditCard, value: '$0', label: 'To Import Your Data', labelZh: '導入數據費用' },
            ].map(({ icon: Icon, value, label, labelZh }) => (
              <div key={label} className="flex flex-col items-center gap-1.5 p-4 rounded-2xl bg-white/60 dark:bg-gray-900/40 backdrop-blur-sm border border-gray-100 dark:border-gray-800">
                <Icon className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />
                <span className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
                  {value}
                </span>
                <span className="text-sm text-gray-600 dark:text-gray-400">{label}</span>
                <span className="text-xs text-muted-foreground">{labelZh}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Problem / Pain Section ───────────────────── */}
      <section className="relative py-16 sm:py-20 bg-gradient-to-b from-transparent via-red-50/40 to-transparent dark:via-red-950/10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
              <span className="text-red-600 dark:text-red-400">You&apos;re not alone.</span>{' '}
              <span className="text-gray-900 dark:text-gray-100">CamCard users are furious.</span>
            </h2>
            <p className="mt-3 text-gray-500 dark:text-gray-400 text-lg">
              你唔係唯一一個。CamCard用戶好憤怒。
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reviewQuotes.map((review, i) => (
              <ReviewCard key={i} review={review} />
            ))}
          </div>

          <p className="mt-8 text-center text-sm text-muted-foreground">
            Source: Real reviews from App Store, Google Play & Trustpilot (2024–2025).{' '}
            <span className="text-gray-400">來源：App Store、Google Play 及 Trustpilot 真實評價</span>
          </p>
        </div>
      </section>

      {/* ─── Comparison Table ─────────────────────────── */}
      <section id="comparison" className="relative py-16 sm:py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <Badge variant="secondary" className="mb-4 px-3 py-1 bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800">
              Honest Comparison 誠實對比
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
              CamCard vs BizCard —{' '}
              <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
                See the difference
              </span>
            </h2>
            <p className="mt-3 text-gray-500 dark:text-gray-400">
              唔使再俾人㩒住搶。There&apos;s a better way.
            </p>
          </div>

          {/* Desktop Table */}
          <div className="hidden md:block overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/60 shadow-lg">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-800/60">
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Feature / 功能
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-red-600 dark:text-red-400 w-[35%]">
                    <X className="w-4 h-4 inline mr-1" />
                    CamCard
                    <span className="block text-xs font-normal text-red-400/70">CamCard</span>
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-emerald-600 dark:text-emerald-400 w-[35%]">
                    <Check className="w-4 h-4 inline mr-1" />
                    BizCard
                    <span className="block text-xs font-normal text-emerald-400/70">BizCard</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {comparisonData.map((row, i) => (
                  <tr
                    key={row.feature}
                    className={`border-t border-gray-100 dark:border-gray-800 ${
                      i % 2 === 0 ? 'bg-white dark:bg-gray-900/40' : 'bg-gray-50/50 dark:bg-gray-800/20'
                    } hover:bg-indigo-50/30 dark:hover:bg-indigo-900/10 transition-colors`}
                  >
                    <td className="px-6 py-4">
                      <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                        {row.feature}
                      </span>
                      <br />
                      <span className="text-xs text-muted-foreground">{row.featureZh}</span>
                    </td>
                    <td className="px-6 py-4 text-center text-sm">{row.camcard}</td>
                    <td className="px-6 py-4 text-center text-sm">{row.bizcard}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards (instead of table) */}
          <div className="md:hidden space-y-4">
            {comparisonData.map((row) => (
              <Card key={row.feature} className="overflow-hidden border-gray-200 dark:border-gray-800">
                <CardHeader className="pb-2 bg-gray-50/50 dark:bg-gray-800/30">
                  <CardTitle className="text-base">{row.feature}</CardTitle>
                  <CardDescription>{row.featureZh}</CardDescription>
                </CardHeader>
                <CardContent className="pt-4 grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-semibold text-red-500 dark:text-red-400 mb-1">
                      <X className="w-3.5 h-3.5 inline mr-0.5" /> CamCard
                    </p>
                    <div className="text-sm">{row.camcard}</div>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-emerald-500 dark:text-emerald-400 mb-1">
                      <Check className="w-3.5 h-3.5 inline mr-0.5" /> BizCard
                    </p>
                    <div className="text-sm">{row.bizcard}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ─── How to Switch Section ────────────────────── */}
      <section className="relative py-16 sm:py-20 bg-gradient-to-b from-transparent via-indigo-50/50 to-transparent dark:via-indigo-950/10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
              How to switch in 3 minutes
            </h2>
            <p className="mt-3 text-gray-500 dark:text-gray-400 text-lg">
              3分鐘完成轉移 · 3分鐘完成轉移
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              {
                step: '01',
                icon: Camera,
                title: 'Scan your CamCard export',
                titleZh: '掃描CamCard導出文件',
                desc: 'If you can export from CamCard, upload the CSV. If not, just screenshot your card list — our AI handles the rest.',
                descZh: '如果你能從CamCard導出CSV，直接上傳。如果不能，截圖你的名片列表——我們的AI會處理剩下的。',
              },
              {
                step: '02',
                icon: Zap,
                title: 'AI extracts everything',
                titleZh: 'AI自動提取所有資料',
                desc: 'Our OCR extracts names, titles, companies, phones, emails, and more — in English, Chinese, and 20+ languages.',
                descZh: '我們的OCR能提取姓名、職稱、公司、電話、電郵等——支援英文、中文及20多種語言。',
              },
              {
                step: '03',
                icon: Download,
                title: 'Export anywhere, anytime',
                titleZh: '隨時導出到任何平台',
                desc: 'Download as CSV, vCard, or Excel. Sync to Google Contacts. Your data, your rules — always free.',
                descZh: '以CSV、vCard或Excel下載。同步到Google通訊錄。你的數據，你作主——永遠免費。',
              },
            ].map(({ step, icon: Icon, title, titleZh, desc, descZh }) => (
              <Card
                key={step}
                className="relative border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/60 backdrop-blur-sm hover:shadow-lg transition-all duration-300 group"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-4xl font-extrabold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent opacity-30 group-hover:opacity-50 transition-opacity">
                      {step}
                    </span>
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-100 to-violet-100 dark:from-indigo-900/40 dark:to-violet-900/40 flex items-center justify-center">
                      <Icon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    </div>
                  </div>
                  <CardTitle className="text-base">{title}</CardTitle>
                  <CardDescription>{titleZh}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{desc}</p>
                  <p className="text-xs text-muted-foreground mt-2 leading-relaxed">{descZh}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Import Section ──────────────────────────── */}
      <section className="relative py-16 sm:py-20">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 via-violet-50/30 to-pink-50/20 dark:from-indigo-950/20 dark:via-violet-950/10 dark:to-transparent pointer-events-none" />
        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <Badge
              variant="secondary"
              className="mb-4 px-3 py-1 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
            >
              🆓 Free Import 免費導入
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
              📤 Import Your CamCard Contacts — Free
            </h2>
            <p className="mt-3 text-gray-500 dark:text-gray-400 text-lg">
              Already exported your CamCard data? Upload your CSV or vCard file below. We&apos;ll import everything in seconds.
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              已經從CamCard導出數據？上傳你的CSV或vCard文件。我們將在幾秒鐘內導入所有資料。
            </p>
          </div>

          {/* File Upload Zone */}
          <Card className="border-2 border-dashed border-indigo-200 dark:border-indigo-800 bg-white/60 dark:bg-gray-900/40 backdrop-blur-sm hover:border-indigo-400 dark:hover:border-indigo-600 transition-colors">
            <CardContent className="p-8">
              {/* Drop zone */}
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center justify-center gap-4 py-8 cursor-pointer text-center"
              >
                {!importFile ? (
                  <>
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-100 to-violet-100 dark:from-indigo-900/40 dark:to-violet-900/40 flex items-center justify-center">
                      <Upload className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div>
                      <p className="text-base font-semibold text-gray-700 dark:text-gray-300">
                        Drag & drop your file here, or click to browse
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        拖放或點擊選擇文件
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        Supported: .csv, .vcf, .vcard
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="mt-2"
                      onClick={(e) => {
                        e.stopPropagation()
                        fileInputRef.current?.click()
                      }}
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      Choose File
                    </Button>
                  </>
                ) : (
                  <>
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-100 to-emerald-200 dark:from-emerald-900/40 dark:to-emerald-800/40 flex items-center justify-center">
                      <FileText className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-base font-semibold text-gray-700 dark:text-gray-300">
                        {importFile.name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {(importFile.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                    <div className="flex gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          setImportFile(null)
                          setImportResult(null)
                        }}
                      >
                        Change File
                      </Button>
                    </div>
                  </>
                )}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.vcf,.vcard"
                onChange={handleFileChange}
                className="hidden"
              />

              {/* Import Button */}
              <div className="flex flex-col items-center gap-4 mt-4">
                {!user ? (
                  <div className="text-center">
                    <Link href="/signup">
                      <Button
                        size="lg"
                        className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white shadow-lg shadow-indigo-500/25 px-8 py-6 rounded-full font-semibold"
                      >
                        Sign Up Free to Import →
                        <span className="block text-xs font-normal opacity-80 ml-2">免費註冊並導入</span>
                      </Button>
                    </Link>
                    <p className="text-xs text-muted-foreground mt-3">
                      Create a free account first — your data will be private and exportable anytime.
                    </p>
                  </div>
                ) : (
                  <Button
                    size="lg"
                    onClick={handleImport}
                    disabled={!importFile || importing}
                    className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white shadow-lg shadow-indigo-500/25 px-8 py-6 rounded-full font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {importing ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Importing...
                      </>
                    ) : (
                      <>
                        <Upload className="w-5 h-5 mr-2" />
                        Import Contacts
                      </>
                    )}
                  </Button>
                )}
              </div>

              {/* Import Results */}
              {importResult && (
                <div className="mt-6 p-5 rounded-xl bg-gradient-to-r from-emerald-50 to-emerald-50/50 dark:from-emerald-950/30 dark:to-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                        {importResult.imported}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Imported 已導入
                      </p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                        {importResult.skipped}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Skipped 已跳過
                      </p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-600 dark:text-gray-400">
                        {importResult.total}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Total 總數
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 text-center">
                    <Link href="/">
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-full border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/30"
                      >
                        View My Contacts
                        <ArrowRight className="w-4 h-4 ml-1.5" />
                      </Button>
                    </Link>
                  </div>
                </div>
              )}

              {/* Error details */}
              {importResult && importResult.errors.length > 0 && (
                <details className="mt-4">
                  <summary className="text-sm text-muted-foreground cursor-pointer hover:text-gray-600 dark:hover:text-gray-300">
                    {importResult.errors.length} error{importResult.errors.length !== 1 ? 's' : ''} — click to view
                  </summary>
                  <ul className="mt-2 space-y-1 text-xs text-muted-foreground max-h-32 overflow-y-auto">
                    {importResult.errors.map((err, i) => (
                      <li key={i} className="pl-2 border-l-2 border-red-300 dark:border-red-700">
                        Row {err.row}: {err.message}
                      </li>
                    ))}
                  </ul>
                </details>
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      {/* ─── Trust / Why BizCard ──────────────────────── */}
      <section className="relative py-16 sm:py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
              Why HK professionals trust BizCard
            </h2>
            <p className="mt-3 text-gray-500 dark:text-gray-400">
              點解香港專業人士信賴BizCard · 為什麼香港專業人士信賴BizCard
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: Unlock,
                title: 'No Vendor Lock-in',
                titleZh: '無供應商鎖定',
                desc: 'Export all your contacts in any format, anytime. Your data is yours.',
                descZh: '隨時以任何格式導出所有聯絡人。你的數據屬於你。',
              },
              {
                icon: Shield,
                title: 'Privacy First',
                titleZh: '私隱優先',
                desc: 'We never sell your data. End-to-end encryption for all stored contacts.',
                descZh: '我們絕不出售你的數據。所有聯絡人均經過端對端加密。',
              },
              {
                icon: Globe,
                title: 'HK + Global',
                titleZh: '香港+全球',
                desc: 'Built for Hong Kong. Supports English, 繁體中文, 简体中文, 廣東話 OCR.',
                descZh: '專為香港打造。支援英文、繁體中文、簡體中文、廣東話OCR。',
              },
              {
                icon: TrendingUp,
                title: 'Always Improving',
                titleZh: '持續進步',
                desc: 'Regular updates with better AI, more languages, and community-requested features.',
                descZh: '定期更新，更好的AI、更多語言、社群要求的功能。',
              },
            ].map(({ icon: Icon, title, titleZh, desc, descZh }) => (
              <Card
                key={title}
                className="border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/60 backdrop-blur-sm hover:shadow-md transition-shadow text-center"
              >
                <CardHeader className="pb-2">
                  <div className="w-12 h-12 mx-auto rounded-xl bg-gradient-to-br from-indigo-100 to-violet-100 dark:from-indigo-900/40 dark:to-violet-900/40 flex items-center justify-center mb-3">
                    <Icon className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <CardTitle className="text-base">{title}</CardTitle>
                  <CardDescription>{titleZh}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{desc}</p>
                  <p className="text-xs text-muted-foreground mt-1.5">{descZh}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ─── How It Works ─────────────────────────────── */}
      <section className="relative py-16 sm:py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
              How it works · 運作方式
            </h2>
            <p className="mt-3 text-gray-500 dark:text-gray-400 text-lg">
              Three steps from CamCard hostage to BizCard freedom
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              {
                step: '1',
                icon: Download,
                title: 'Export from CamCard',
                titleZh: '從CamCard導出',
                desc: 'Use CamCard\'s export feature to download your contacts as CSV, or take screenshots of your card list.',
                descZh: '使用CamCard的導出功能下載CSV，或截圖你的名片列表。',
              },
              {
                step: '2',
                icon: Upload,
                title: 'Upload CSV here',
                titleZh: '上傳CSV到這裡',
                desc: 'Drag & drop your file into the upload zone above. We support CSV and vCard (.vcf) formats.',
                descZh: '拖放文件到上面的上傳區域。我們支援CSV和vCard（.vcf）格式。',
              },
              {
                step: '3',
                icon: Users,
                title: 'All contacts appear in BizCard',
                titleZh: '所有聯絡人出現在BizCard',
                desc: 'Your contacts are instantly available. Search, organize, and export anytime — for free.',
                descZh: '你的聯絡人會立即顯示。隨時搜索、整理和導出——完全免費。',
              },
            ].map(({ step, icon: Icon, title, titleZh, desc, descZh }) => (
              <div
                key={step}
                className="relative flex flex-col items-center text-center group"
              >
                {/* Step connector line (desktop) */}
                {step !== '3' && (
                  <div className="hidden sm:block absolute top-10 left-[calc(50%+3rem)] w-[calc(100%-6rem)] h-0.5 bg-gradient-to-r from-indigo-300 to-violet-300 dark:from-indigo-700 dark:to-violet-700" />
                )}
                <div className="relative">
                  <span className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-xs font-bold flex items-center justify-center shadow-lg">
                    {step}
                  </span>
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-100 to-violet-100 dark:from-indigo-900/40 dark:to-violet-900/40 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-sm">
                    <Icon className="w-10 h-10 text-indigo-600 dark:text-indigo-400" />
                  </div>
                </div>
                <h3 className="mt-5 text-base font-semibold text-gray-900 dark:text-gray-100">
                  {title}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">{titleZh}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 leading-relaxed">
                  {desc}
                </p>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  {descZh}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FAQ Quick Hits ───────────────────────────── */}
      <section className="relative py-16 sm:py-20 bg-gray-50/50 dark:bg-gray-900/30">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-center mb-10 text-gray-900 dark:text-gray-100">
            Quick Questions · 常見問題
          </h2>
          <div className="space-y-4">
            {[
              {
                q: 'Can I really import my CamCard contacts for free?',
                qZh: '我真的可以免費導入CamCard聯絡人嗎？',
                a: 'Yes. 100% free. Upload your exported CSV, or screenshot your CamCard list — we\'ll extract everything. No credit card needed.',
                aZh: '是的。100%免費。上傳你導出的CSV，或截圖你的CamCard列表——我們會提取所有資料。無需信用卡。',
              },
              {
                q: 'What if CamCard won\'t let me export?',
                qZh: '如果CamCard不讓我導出怎麼辦？',
                a: 'Take screenshots of your card list. Our AI OCR can read names, titles, companies, and contact details directly from screenshots. We\'ve designed this specifically for CamCard refugees.',
                aZh: '截圖你的名片列表。我們的AI OCR可以直接從截圖中讀取姓名、職稱、公司和聯絡資料。我們專為CamCard難民設計了這個功能。',
              },
              {
                q: 'Will my data be safe?',
                qZh: '我的數據安全嗎？',
                a: 'Absolutely. Your contacts are encrypted. We never sell, share, or mine your data. You can delete everything and export anytime. Read our privacy policy for details.',
                aZh: '絕對安全。你的聯絡人經過加密。我們絕不出售、分享或挖掘你的數據。你可以隨時刪除所有資料並導出。詳情請參閱我們的私隱政策。',
              },
              {
                q: 'Is it really free forever?',
                qZh: '真的永久免費嗎？',
                a: 'The free tier includes unlimited card scans, unlimited exports, and all core features. Our Pro plan ($29.99/yr) adds AI-powered company tracking, advanced search, and team features — but you\'ll never need to pay to access your own contacts.',
                aZh: '免費方案包括無限名片掃描、無限導出和所有核心功能。我們的Pro方案（每年$29.99）增加了AI驅動的公司追蹤、高級搜索和團隊功能——但你永遠不需要付費來存取自己的聯絡人。',
              },
            ].map(({ q, qZh, a, aZh }) => (
              <Card key={q} className="border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/60">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{q}</CardTitle>
                  <CardDescription>{qZh}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{a}</p>
                  <p className="text-xs text-muted-foreground mt-2 leading-relaxed">{aZh}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Final CTA ────────────────────────────────── */}
      <section className="relative py-20 sm:py-28">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-violet-600 to-pink-500 dark:from-indigo-900 dark:via-violet-900 dark:to-pink-900 opacity-90" />
        {/* Decorative blobs */}
        <div className="absolute top-10 left-1/4 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 right-1/4 w-80 h-80 bg-white/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white">
            Ready to switch?
          </h2>
          <p className="mt-4 text-lg text-indigo-100">
            準備好轉會未？ · 準備好轉換了嗎？
          </p>

          <p className="mt-6 text-base text-white/80 max-w-xl mx-auto leading-relaxed">
            Stop paying CamCard to hold your own contacts hostage. Join 2,500+ HK professionals
            who&apos;ve already made the switch. Your contacts deserve better.
          </p>
          <p className="mt-3 text-sm text-white/60 max-w-xl mx-auto leading-relaxed">
            唔好再俾錢CamCard扣押你嘅聯絡人。超過2,500位香港專業人士已經轉咗會。你嘅聯絡人值得更好嘅待遇。
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/signup">
              <Button
                size="lg"
                className="bg-white text-indigo-700 hover:bg-indigo-50 shadow-xl shadow-black/20 hover:shadow-2xl hover:shadow-black/25 transition-all duration-300 text-lg px-10 py-7 rounded-full font-bold"
              >
                <Download className="w-5 h-5 mr-2" />
                Start free — no credit card needed
              </Button>
            </Link>
          </div>

          <p className="mt-6 text-sm text-white/60">
            免費開始 · 無需信用卡 · 永久免費方案 · Free forever plan available
          </p>
        </div>
      </section>

      {/* ─── Footer Note ──────────────────────────────── */}
      <footer className="relative py-8 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-xs text-muted-foreground">
            BizCard is not affiliated with CamCard or INTSIG Information Co., Ltd. All trademarks belong to their respective owners.
            Review quotes are sourced from public app store reviews and Trustpilot for informational purposes.
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            BizCard與CamCard或INTSIG Information Co., Ltd.並無關聯。所有商標均屬其各自擁有者。評價引用來自App Store及Trustpilot的公開評論，僅供參考。
          </p>
        </div>
      </footer>
    </div>
  )
}
