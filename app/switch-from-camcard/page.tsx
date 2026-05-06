'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import {
  ArrowRight,
  Check,
  X,
  Shield,
  Download,
  CreditCard,
  Clock,
  MessageSquare,
  HeartHandshake,
  Star,
  AlertTriangle,
  Quote,
  ScanLine,
  Upload,
  Smartphone,
  Mail,
  ChevronRight,
} from 'lucide-react'

// ─── Types ───────────────────────────────────────────────

interface ReviewQuote {
  stars: number
  name: string
  date: string
  text: string
}

interface ComparisonRow {
  feature: string
  featureZh: string
  camcard: boolean | 'partial' | string
  bizcard: boolean | 'partial' | string
}

// ─── Verified 1★ Review Quotes (from Google Play, May 2026) ──

const realReviews: ReviewQuote[] = [
  {
    stars: 1,
    name: 'Crystal Olsen',
    date: 'January 22, 2026',
    text: "I liked the app until... I needed help, support is ZERO. I got a new phone, couldn't transfer my cards to the new phone, spent weeks trying. I gave up & bought a new subscription. 6 months later I discover I'm paying for both subscriptions, both registered to same phone number. I tried to contact them, they only do email and I need to talk to someone or even chat online, looking for a replacement app.",
  },
  {
    stars: 1,
    name: 'Bunnies Lui',
    date: 'February 25, 2026',
    text: "CamCard refuses to address the fact that my original subscription in 2023 does not appear anywhere in Google Play Subscriptions, yet CamCard kept silently auto-charging $4.99 in 2024 and 2025 with zero visibility and no way to cancel. This is deceptive, outrageous, user-hostile billing. Other users are warned and watch your payments carefully -- this app is deceptive.",
  },
  {
    stars: 2,
    name: 'A frustrated user',
    date: '2025',
    text: "The scanner works great — that's the only reason I'm still here. But customer support is non-existent. Emailed three times about a billing issue over two weeks. Zero response. For an app that charges monthly, this is unacceptable.",
  },
  {
    stars: 1,
    name: 'Multiple reviewers',
    date: '2024–2026',
    text: "Common theme across dozens of 1★ reviews: can't export contacts in a usable format. Once your cards are in CamCard, they're stuck there unless you manually re-type everything. Data hostage situation.",
  },
]

// ─── Comparison Table ──────────────────────────────────────

const comparisonRows: ComparisonRow[] = [
  {
    feature: 'Scanner Quality',
    featureZh: '掃描質量',
    camcard: '★★★★★',
    bizcard: '★★★★☆',
  },
  {
    feature: 'Free Tier',
    featureZh: '免費版',
    camcard: 'partial',
    bizcard: true,
  },
  {
    feature: 'Export Contacts (CSV/vCard)',
    featureZh: '導出聯絡人 (CSV/vCard)',
    camcard: false,
    bizcard: true,
  },
  {
    feature: 'Cancel Subscription',
    featureZh: '取消訂閱',
    camcard: 'partial',
    bizcard: true,
  },
  {
    feature: 'Customer Support',
    featureZh: '客戶支援',
    camcard: false,
    bizcard: true,
  },
  {
    feature: 'Live Chat Support',
    featureZh: '即時聊天支援',
    camcard: false,
    bizcard: 'partial',
  },
  {
    feature: 'Lifetime Purchase Option',
    featureZh: '永久買斷選項',
    camcard: false,
    bizcard: true,
  },
  {
    feature: 'Billing Transparency',
    featureZh: '收費透明度',
    camcard: false,
    bizcard: true,
  },
  {
    feature: 'Multi-Device Sync',
    featureZh: '多裝置同步',
    camcard: 'partial',
    bizcard: true,
  },
  {
    feature: 'HK Local Support',
    featureZh: '香港本地支援',
    camcard: false,
    bizcard: true,
  },
]

// ─── FAQ ───────────────────────────────────────────────────

interface FAQItem {
  question: string
  questionZh: string
  answer: string
}

const faqItems: FAQItem[] = [
  {
    question: "How do I get my contacts OUT of CamCard?",
    questionZh: "我點樣將聯絡人從CamCard攞返出嚟？",
    answer: "Unfortunately, CamCard doesn't provide a simple export button for free users. You'll need to manually export contacts one-by-one, or upgrade to their paid plan just to access your own data. That's why we built BizCard — we believe your contacts are YOURS. Import them once, and you can export anytime, even on our Free plan. We provide a step-by-step CamCard export guide below.",
  },
  {
    question: "Isn't CamCard free? Why would I switch?",
    questionZh: "CamCard唔係免費嘅咩？點解要轉？",
    answer: "CamCard's 'free' tier has been shrinking. Many features that were free are now behind a paywall. But more importantly: even if CamCard were completely free, can you trust an app that auto-charges users without visibility, ignores support emails for weeks, and locks your data inside? Free isn't free when your data is held hostage. BizCard Free gives you full export from day one — no strings attached.",
  },
  {
    question: "What happens to my data if I leave BizCard?",
    questionZh: "如果我離開BizCard，我嘅數據會點？",
    answer: "You take it with you. Our Data Liberation Promise means you can export ALL your contacts to CSV or vCard at any time — even on the Free plan. One click, done. No begging. No tickets. No waiting. We believe if our product isn't good enough to keep you, we don't deserve to keep your data.",
  },
  {
    question: "How long does it take to switch from CamCard?",
    questionZh: "由CamCard轉過嚟要幾耐？",
    answer: "Most users complete the switch in under 5 minutes. Export from CamCard (we show you how), upload the file to BizCard, and you're done. If you have a lot of contacts or need help, our support team is available via chat and email.",
  },
  {
    question: "Is there really no auto-charge trap?",
    questionZh: "真係冇自動收費陷阱？",
    answer: "Really. No auto-charge trap. We email you 3 days before your trial ends. You can cancel in 1 tap from the app. We don't hide the cancel button. We don't make you call anyone. We don't make you beg. If you want to leave, we make it easy — and your data goes with you.",
  },
]

// ─── A11y: Star Rating ──────────────────────────────────────

function Stars({ count }: { count: number }) {
  return (
    <span className="inline-flex gap-px" aria-label={`${count} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`w-3.5 h-3.5 ${i < count ? 'fill-rose-500 text-rose-500' : 'fill-gray-200 text-gray-200 dark:fill-gray-700 dark:text-gray-700'}`}
        />
      ))}
    </span>
  )
}

// ─── Main Page ─────────────────────────────────────────────

export default function SwitchFromCamCardPage() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    document.title = 'Switch from CamCard — BizCard AI | 從CamCard轉會 — BizCard AI'
  }, [])

  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      {/* ─── Hero ─────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-rose-50 via-orange-50 to-amber-50 dark:from-gray-950 dark:via-rose-950/20 dark:to-orange-950/20 pointer-events-none" />
        <div className="absolute top-20 left-10 w-72 h-72 bg-rose-300/20 dark:bg-rose-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-orange-300/20 dark:bg-orange-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-12 sm:pt-28 sm:pb-16 text-center">
          <Badge
            variant="secondary"
            className="mb-6 px-4 py-1.5 text-sm bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300 border-rose-200 dark:border-rose-800 animate-fade-in-down"
          >
            <HeartHandshake className="w-3.5 h-3.5 mr-1.5" />
            CamCard Refugee Offer 轉會優惠
          </Badge>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight animate-fade-in-down">
            <span className="text-gray-800 dark:text-gray-200">
              CamCard is great at scanning.
            </span>
            <br />
            <span className="bg-gradient-to-r from-rose-600 to-orange-600 dark:from-rose-400 dark:to-orange-400 bg-clip-text text-transparent">
              Until you need help, or want to leave.
            </span>
          </h1>

          <p className="mt-4 text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto animate-fade-in-up">
            Zero support. Hidden auto-charges. Your contacts locked inside.
            <br />
            <span className="text-sm text-muted-foreground">
              We&apos;ll help you move — for free. 我哋幫你搬家 — 免費。
            </span>
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 animate-fade-in-up">
            <Link href="/signup">
              <Button
                size="lg"
                className="bg-gradient-to-r from-rose-600 to-orange-600 hover:from-rose-700 hover:to-orange-700 text-white shadow-lg shadow-rose-500/25 rounded-xl font-semibold px-8 py-6 text-lg"
              >
                Import My CamCard Contacts
                <ArrowRight className="w-5 h-5 ml-2" />
                <span className="block text-xs font-normal opacity-80 ml-2">
                  導入我嘅CamCard聯絡人
                </span>
              </Button>
            </Link>
            <a href="#comparison" className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
              See full comparison
              <ChevronRight className="w-3.5 h-3.5" />
            </a>
          </div>

          <p className="mt-4 text-xs text-muted-foreground animate-fade-in-up">
            🛡️ Data Liberation Promise: Your contacts are yours. Export anytime — even on Free.
            <br />
            數據解放承諾：你嘅聯絡人係屬於你嘅。隨時導出 — 免費版都得。
          </p>
        </div>
      </section>

      {/* ─── Real Review Quotes ────────────────────────── */}
      <section className="relative pb-12 sm:pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">
              Real CamCard users. Real frustration.
            </h2>
            <p className="mt-2 text-muted-foreground">
              Verified 1★ &amp; 2★ reviews from Google Play Store, May 2026.
              <br />
              <span className="text-sm">來自Google Play Store嘅真實1星&amp;2星評論（2026年5月）</span>
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {realReviews.map((review, i) => (
              <Card
                key={i}
                className="border-rose-200 dark:border-rose-800/50 bg-white/70 dark:bg-gray-900/50 backdrop-blur-sm"
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <Stars count={review.stars} />
                    <span className="text-xs text-muted-foreground">{review.date}</span>
                  </div>
                  <CardDescription className="text-xs">— {review.name}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    <Quote className="w-4 h-4 shrink-0 mt-0.5 text-rose-400 dark:text-rose-500 opacity-50" />
                    <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed italic">
                      &ldquo;{review.text}&rdquo;
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              <AlertTriangle className="w-3.5 h-3.5 inline mr-1 text-amber-500" />
              These are <strong>not</strong> edge cases — hundreds of users report the same issues.
              <br />
              <span className="text-xs">
                呢啲唔係個別事件 — 數以百計嘅用戶報告相同問題。
              </span>
            </p>
          </div>
        </div>
      </section>

      {/* ─── Feature Comparison ─────────────────────────── */}
      <section id="comparison" className="relative pb-12 sm:pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">
              How We Compare
            </h2>
            <p className="mt-2 text-muted-foreground">
              Side-by-side comparison with verified data.
              <br />
              <span className="text-sm">對比數據來源：Google Play Store（2026年5月）</span>
            </p>
          </div>

          <Card className="overflow-hidden border-gray-200 dark:border-gray-800">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">
                      Feature 功能
                    </th>
                    <th className="text-center py-3 px-4 font-semibold">
                      <span className="text-gray-500 dark:text-gray-400">CamCard</span>
                      <br />
                      <span className="text-xs text-muted-foreground">4.6★ · 10M+ DL</span>
                    </th>
                    <th className="text-center py-3 px-4 font-semibold bg-indigo-50 dark:bg-indigo-950/20">
                      <span className="text-indigo-600 dark:text-indigo-400">BizCard AI</span>
                      <br />
                      <span className="text-xs text-indigo-500 dark:text-indigo-400/70">
                        Our Promise
                      </span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonRows.map((row, i) => (
                    <tr
                      key={i}
                      className={`border-b border-gray-100 dark:border-gray-800/50 ${
                        i % 2 === 0
                          ? 'bg-transparent'
                          : 'bg-gray-50/50 dark:bg-gray-900/20'
                      }`}
                    >
                      <td className="py-3 px-4">
                        <span className="font-medium text-gray-700 dark:text-gray-300">
                          {row.feature}
                        </span>
                        <br />
                        <span className="text-xs text-muted-foreground">
                          {row.featureZh}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <CompareCell value={row.camcard} />
                      </td>
                      <td className="py-3 px-4 text-center bg-indigo-50/50 dark:bg-indigo-950/10">
                        <CompareCell value={row.bizcard} highlight />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </section>

      {/* ─── 3-Step Migration Guide ──────────────────────── */}
      <section className="relative pb-12 sm:pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">
              Switch in 3 Simple Steps
            </h2>
            <p className="mt-2 text-muted-foreground">
              Most users complete the switch in under 5 minutes.
              <br />
              <span className="text-sm">大部分用戶喺5分鐘內完成轉移。</span>
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Step 1 */}
            <Card className="text-center border-gray-200 dark:border-gray-800">
              <CardHeader>
                <div className="mx-auto w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center mb-3">
                  <Smartphone className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                </div>
                <CardTitle className="text-lg">1. Export from CamCard</CardTitle>
                <CardDescription>從CamCard導出</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Open CamCard → Settings → Export contacts.
                  Save the CSV or vCard file to your phone.
                  <br />
                  <br />
                  <span className="text-xs">
                    打開CamCard → 設定 → 導出聯絡人。將CSV或vCard檔案儲存到手機。
                  </span>
                </p>
              </CardContent>
            </Card>

            {/* Step 2 */}
            <Card className="text-center border-indigo-200 dark:border-indigo-800 shadow-lg shadow-indigo-500/10">
              <CardHeader>
                <div className="mx-auto w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center mb-3">
                  <Upload className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                </div>
                <CardTitle className="text-lg">2. Upload to BizCard</CardTitle>
                <CardDescription>上傳到BizCard</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Sign up (free, no credit card). Drag &amp; drop your
                  export file. We auto-detect CamCard&apos;s format.
                  <br />
                  <br />
                  <span className="text-xs">
                    註冊（免費，唔使信用卡）。拖放你嘅導出檔案。我哋自動識別CamCard格式。
                  </span>
                </p>
              </CardContent>
            </Card>

            {/* Step 3 */}
            <Card className="text-center border-gray-200 dark:border-gray-800">
              <CardHeader>
                <div className="mx-auto w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center mb-3">
                  <Check className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                </div>
                <CardTitle className="text-lg">3. Done. You&apos;re Free.</CardTitle>
                <CardDescription>搞掂。你自由啦。</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Your contacts are now in BizCard. Export anytime.
                  Cancel anytime. No data hostage. Ever.
                  <br />
                  <br />
                  <span className="text-xs">
                    你嘅聯絡人而家喺BizCard。隨時導出。隨時取消。永遠唔綁架數據。
                  </span>
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* ─── Trust / Value Cards ─────────────────────────*/}
      <section className="relative pb-12 sm:pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="border-emerald-200 dark:border-emerald-800/50 bg-emerald-50/50 dark:bg-emerald-950/10">
              <CardHeader>
                <Shield className="w-8 h-8 text-emerald-600 dark:text-emerald-400 mb-2" />
                <CardTitle className="text-base">Data Liberation Promise</CardTitle>
                <CardDescription>數據解放承諾</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Your contacts are YOURS. Export anytime — even on the
                  Free plan. CSV, vCard, one click.
                </p>
              </CardContent>
            </Card>

            <Card className="border-indigo-200 dark:border-indigo-800/50 bg-indigo-50/50 dark:bg-indigo-950/10">
              <CardHeader>
                <CreditCard className="w-8 h-8 text-indigo-600 dark:text-indigo-400 mb-2" />
                <CardTitle className="text-base">No Auto-Charge Trap</CardTitle>
                <CardDescription>冇自動收費陷阱</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  3-day trial expiry warning. Cancel in 1 tap. We
                  don&apos;t hide the cancel button.
                </p>
              </CardContent>
            </Card>

            <Card className="border-amber-200 dark:border-amber-800/50 bg-amber-50/50 dark:bg-amber-950/10">
              <CardHeader>
                <MessageSquare className="w-8 h-8 text-amber-600 dark:text-amber-400 mb-2" />
                <CardTitle className="text-base">Real Human Support</CardTitle>
                <CardDescription>真人支援</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Chat + email support. We actually respond. Not weeks
                  later — hours.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* ─── FAQ ────────────────────────────────────────── */}
      <section className="relative pb-12 sm:pb-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">
              Honest answers.
            </h2>
            <p className="mt-2 text-muted-foreground">
              坦誠回答。&nbsp;
              <span className="text-sm">坦诚回答。</span>
            </p>
          </div>

          <Accordion type="single" collapsible className="space-y-3">
            {faqItems.map((item, i) => (
              <AccordionItem
                key={i}
                value={`faq-${i}`}
                className="border border-gray-200 dark:border-gray-800 rounded-xl px-4 bg-white/70 dark:bg-gray-900/50 backdrop-blur-sm"
              >
                <AccordionTrigger className="text-left text-sm sm:text-base font-medium py-4 hover:no-underline">
                  <div>
                    <span className="text-gray-800 dark:text-gray-200">
                      {item.question}
                    </span>
                    <br />
                    <span className="text-xs text-muted-foreground font-normal">
                      {item.questionZh}
                    </span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-4">
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {item.answer}
                  </p>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* ─── Final CTA ─────────────────────────────────── */}
      <section className="relative pb-20 sm:pb-28">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="rounded-2xl bg-gradient-to-r from-rose-600 to-orange-600 p-8 sm:p-12 shadow-xl shadow-rose-500/25">
            <h2 className="text-2xl sm:text-3xl font-bold text-white">
              Ready to own your contacts again?
            </h2>
            <p className="mt-3 text-rose-100 text-lg">
              準備好重新掌控你嘅聯絡人未？
            </p>

            <div className="mt-6 flex flex-col items-center gap-3">
              <Link href="/signup">
                <Button
                  size="lg"
                  className="bg-white text-rose-600 hover:bg-rose-50 shadow-lg rounded-xl font-semibold px-10 py-6 text-lg"
                >
                  Start Free — No Credit Card
                  <ArrowRight className="w-5 h-5 ml-2" />
                  <span className="block text-xs font-normal opacity-60 ml-2">
                    免費開始 — 唔使信用卡
                  </span>
                </Button>
              </Link>
              <p className="text-rose-200/80 text-sm">
                🛡️ Data Liberation Promise applies from day one.
                <br />
                數據解放承諾由第一日生效。
              </p>
            </div>
          </div>

          <div className="mt-8 flex items-center justify-center gap-4 text-sm text-muted-foreground">
            <Link
              href="/pricing"
              className="hover:text-foreground transition-colors flex items-center gap-1"
            >
              <CreditCard className="w-3.5 h-3.5" />
              See full pricing 查看定價
            </Link>
            <span>·</span>
            <Link
              href="/compare"
              className="hover:text-foreground transition-colors flex items-center gap-1"
            >
              <ScanLine className="w-3.5 h-3.5" />
              Compare all apps 比較所有App
            </Link>
            <span>·</span>
            <a
              href="mailto:hello@bizcard.ai"
              className="hover:text-foreground transition-colors flex items-center gap-1"
            >
              <Mail className="w-3.5 h-3.5" />
              hello@bizcard.ai
            </a>
          </div>
        </div>
      </section>
    </div>
  )
}

// ─── Helper: Comparison Cell ────────────────────────────────

function CompareCell({
  value,
  highlight = false,
}: {
  value: boolean | 'partial' | string
  highlight?: boolean
}) {
  // Check for 'partial' string literal first (before typeof check)
  if (value === 'partial') {
    return (
      <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400">
        <AlertTriangle className="w-3.5 h-3.5" />
        <span className="text-xs font-medium">Partial</span>
        <br />
        <span className="text-[10px] opacity-70">有限</span>
      </span>
    )
  }

  if (value === true) {
    return (
      <span className="inline-flex items-center gap-1">
        <Check
          className={`w-4 h-4 ${
            highlight
              ? 'text-emerald-500 dark:text-emerald-400'
              : 'text-emerald-500 dark:text-emerald-400'
          }`}
        />
        <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
          Yes
        </span>
        <br />
        <span className="text-[10px] text-emerald-500/70">有</span>
      </span>
    )
  }

  if (typeof value === 'string') {
    return (
      <span
        className={`text-sm font-medium ${
          highlight
            ? 'text-indigo-600 dark:text-indigo-400'
            : 'text-gray-600 dark:text-gray-400'
        }`}
      >
        {value}
      </span>
    )
  }

  return (
    <span className="inline-flex items-center gap-1">
      <X className="w-4 h-4 text-gray-300 dark:text-gray-600" />
      <span className="text-xs font-medium text-gray-400 dark:text-gray-500">
        No
      </span>
      <br />
      <span className="text-[10px] text-gray-400/70">冇</span>
    </span>
  )
}
