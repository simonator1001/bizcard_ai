'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import {
  Check,
  X,
  Shield,
  Zap,
  Download,
  Mail,
  CreditCard,
  Clock,
  Star,
  Trophy,
  HeartHandshake,
  ArrowRight,
  Sparkles,
  FileSpreadsheet,
  Tags,
  ScanLine,
  Users,
  Linkedin,
  Infinity,
} from 'lucide-react'

// ─── Types ───────────────────────────────────────────────

interface PricingTier {
  id: string
  name: string
  nameZh: string
  price: string
  priceLabel: string
  priceLabelZh: string
  description: string
  descriptionZh: string
  popular: boolean
  cta: string
  ctaZh: string
  features: PricingFeature[]
}

interface PricingFeature {
  name: string
  nameZh: string
  included: boolean
  highlight?: boolean
}

interface FAQItem {
  question: string
  questionZh: string
  answer: string
  answerZh: string
}

// ─── Data ────────────────────────────────────────────────

const pricingTiers: PricingTier[] = [
  {
    id: 'free',
    name: 'Free',
    nameZh: '免費',
    price: 'HK$0',
    priceLabel: 'forever free',
    priceLabelZh: '永久免費',
    description: 'Perfect for trying out BizCard with your first batch of business cards.',
    descriptionZh: '適合初次嘗試數碼化管理名片。',
    popular: false,
    cta: 'Get Started Free',
    ctaZh: '免費開始',
    features: [
      { name: 'Up to 10 cards', nameZh: '最多10張名片', included: true },
      { name: '10 scans / month', nameZh: '每月10次掃描', included: true },
      { name: 'Standard AI OCR', nameZh: '標準AI辨識', included: true },
      { name: 'CSV & vCard export', nameZh: 'CSV 及 vCard 導出', included: true },
      { name: 'LinkedIn enrichment', nameZh: 'LinkedIn 資料補充', included: false },
      { name: 'Batch scan', nameZh: '批量掃描', included: false },
      { name: 'Tags & folders', nameZh: '標籤與文件夾', included: false },
      { name: 'Community support', nameZh: '社群支援', included: true },
    ],
  },
  {
    id: 'pro-monthly',
    name: 'Pro',
    nameZh: '專業版',
    price: 'HK$68',
    priceLabel: '/ month',
    priceLabelZh: '/ 月',
    description: 'Unlock the full power of AI-driven contact management. Cancel anytime.',
    descriptionZh: '解鎖AI驅動的完整聯絡人管理功能。隨時取消。',
    popular: true,
    cta: 'Start 7-Day Free Trial',
    ctaZh: '開始7天免費試用',
    features: [
      { name: 'Unlimited cards', nameZh: '無限名片', included: true, highlight: true },
      { name: '100 scans / month', nameZh: '每月100次掃描', included: true },
      { name: 'GPT-4o Enhanced OCR', nameZh: 'GPT-4o 增強辨識', included: true, highlight: true },
      { name: 'All export formats', nameZh: '全部導出格式', included: true },
      { name: 'LinkedIn enrichment', nameZh: 'LinkedIn 資料補充', included: true },
      { name: 'Batch scan', nameZh: '批量掃描', included: true },
      { name: 'Tags & folders', nameZh: '標籤與文件夾', included: true },
      { name: 'Priority email support', nameZh: '優先電郵支援', included: true },
    ],
  },
  {
    id: 'pro-lifetime',
    name: 'Pro Lifetime',
    nameZh: '專業版永久',
    price: 'HK$388',
    priceLabel: 'one-time',
    priceLabelZh: '一次性',
    description: 'Pay once, own forever. Best value for serious networkers who hate subscriptions.',
    descriptionZh: '一次付款，永久使用。適合討厭月費的重度用戶。',
    popular: false,
    cta: 'Get Lifetime Access',
    ctaZh: '獲取永久使用權',
    features: [
      { name: 'Unlimited cards', nameZh: '無限名片', included: true, highlight: true },
      { name: '100 scans / month', nameZh: '每月100次掃描', included: true },
      { name: 'GPT-4o Enhanced OCR', nameZh: 'GPT-4o 增強辨識', included: true, highlight: true },
      { name: 'All export formats', nameZh: '全部導出格式', included: true },
      { name: 'LinkedIn enrichment', nameZh: 'LinkedIn 資料補充', included: true },
      { name: 'Batch scan', nameZh: '批量掃描', included: true },
      { name: 'Tags & folders', nameZh: '標籤與文件夾', included: true },
      { name: 'Priority email support', nameZh: '優先電郵支援', included: true },
    ],
  },
]

const faqItems: FAQItem[] = [
  {
    question: 'Why pay when CamCard was free?',
    questionZh: 'CamCard都係免費㗎，點解要俾錢？',
    answer:
      "CamCard's 'free' tier holds your data hostage — you can't export your own contacts without upgrading to a paid plan. And if you stop paying, your contacts become inaccessible. BizCard Free gives you full export (CSV + vCard) from day one, forever. No data hostage situation. No bait-and-switch. We make money from happy Pro users who want premium AI features — not by locking up your contacts.",
    answerZh:
      "CamCard嘅「免費」方案其實係綁架你嘅數據 — 唔升級就冇得導出自己嘅聯絡人。一旦停止俾錢，你嘅聯絡人就會被鎖住。BizCard免費版由第一日起就俾你完整導出（CSV + vCard），永久有效。我哋唔會綁架數據，亦唔會用免費做餌再逼你課金。我哋嘅收入來自滿意嘅Pro用戶享用高階AI功能 — 而唔係靠鎖住你嘅聯絡人。",
  },
  {
    question: 'Can I export my data?',
    questionZh: '我可以導出我嘅數據嗎？',
    answer:
      'Absolutely. This is our Data Liberation Promise: your contacts are YOURS. Export anytime — even on the Free plan. We support CSV, vCard, Excel, and direct sync to Google Contacts. No paywalls, no tricks. If you ever want to leave BizCard, we make it easy — your data goes with you.',
    answerZh:
      '當然可以。呢個係我哋嘅「數據解放承諾」：你嘅聯絡人係屬於你嘅。隨時導出都得 — 免費版都一樣可以。我哋支援CSV、vCard、Excel，同埋直接同步去Google通訊錄。冇付費牆，冇陰招。如果你想離開BizCard，我哋會令過程好簡單 — 你嘅數據跟你走。',
  },
  {
    question: "What's the catch?",
    questionZh: '有冇伏？',
    answer:
      'No catch. Seriously. No auto-renew traps — we email you 3 days before your trial ends. Cancel in 1 tap from the app — no tickets, no calls to customer service, no begging. The Free tier is genuinely useful (10 cards + scans forever). Pro is for people who scan dozens of cards monthly and want GPT-4o accuracy. Lifetime is for people who hate subscriptions. That\'s it.',
    answerZh:
      '冇伏。真係冇。冇自動續費陷阱 — 我哋會喺試用期結束前3日email提醒你。喺App入面一鍵取消 — 唔使開ticket，唔使打電話俾客服，唔使哀求。免費版真係有用（永久10張名片+掃描次數）。Pro版係俾每月掃描幾十張名片、想要GPT-4o精準度嘅人。永久版係俾討厭月費嘅人。就係咁簡單。',
  },
]

const trustBadges = [
  {
    icon: CreditCard,
    title: 'No Auto-Charge Trap',
    titleZh: '冇自動收費陷阱',
    description: 'We email you 3 days before trial ends. You\'re always in control.',
    descriptionZh: '試用期結束前3日電郵通知。你永遠掌握主導權。',
  },
  {
    icon: Shield,
    title: 'Data Liberation Promise',
    titleZh: '數據解放承諾',
    description: 'Your contacts are YOURS. Export anytime — even on the Free plan.',
    descriptionZh: '你嘅聯絡人屬於你。隨時導出 — 免費版都可以。',
  },
  {
    icon: Clock,
    title: 'Cancel in 1 Tap',
    titleZh: '一鍵取消',
    description: 'No tickets. No calls. No begging. Just tap, done.',
    descriptionZh: '唔使開ticket。唔使打電話。唔使哀求。㩒一下，搞掂。',
  },
]

// ─── Sub-Components ──────────────────────────────────────

function FeatureRow({ name, nameZh, included }: PricingFeature) {
  return (
    <li className="flex items-start gap-3 py-2">
      {included ? (
        <Check className="w-5 h-5 mt-0.5 shrink-0 text-emerald-500 dark:text-emerald-400" />
      ) : (
        <X className="w-5 h-5 mt-0.5 shrink-0 text-gray-300 dark:text-gray-600" />
      )}
      <div className="flex flex-col">
        <span
          className={`text-sm font-medium ${
            included
              ? 'text-gray-800 dark:text-gray-200'
              : 'text-gray-400 dark:text-gray-500'
          }`}
        >
          {name}
        </span>
        <span className="text-xs text-muted-foreground">{nameZh}</span>
      </div>
    </li>
  )
}

function PricingCard({ tier }: { tier: PricingTier }) {
  const isPro = tier.id === 'pro-monthly'
  const isLifetime = tier.id === 'pro-lifetime'

  return (
    <Card
      className={`relative flex flex-col h-full transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${
        tier.popular
          ? 'border-2 border-indigo-500 dark:border-indigo-400 shadow-lg shadow-indigo-500/15 dark:shadow-indigo-500/10 scale-[1.02] md:scale-105'
          : 'border-gray-200 dark:border-gray-800 shadow-md'
      }`}
    >
      {/* Popular badge */}
      {tier.popular && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-10">
          <Badge className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white border-0 px-4 py-1 text-sm font-semibold shadow-lg shadow-indigo-500/30">
            <Star className="w-3.5 h-3.5 mr-1 fill-white" />
            Most Popular
            <span className="ml-1 text-xs opacity-80">最受歡迎</span>
          </Badge>
        </div>
      )}

      <CardHeader className="pb-4 pt-6">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl font-bold text-gray-900 dark:text-gray-100">
              {tier.name}
            </CardTitle>
            <CardDescription className="mt-0.5">{tier.nameZh}</CardDescription>
          </div>
          {isLifetime && (
            <Badge
              variant="outline"
              className="border-amber-500 text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30"
            >
              <Trophy className="w-3 h-3 mr-1" />
              Best Value
            </Badge>
          )}
        </div>

        {/* Price */}
        <div className="mt-4 flex items-baseline gap-1.5">
          <span className="text-4xl font-extrabold bg-gradient-to-r from-indigo-600 to-violet-600 dark:from-indigo-400 dark:to-violet-400 bg-clip-text text-transparent">
            {tier.price}
          </span>
          <span className="text-sm text-muted-foreground">
            {tier.priceLabel}
            <br />
            <span className="text-xs">{tier.priceLabelZh}</span>
          </span>
        </div>

        {/* Description */}
        <p className="mt-3 text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
          {tier.description}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">{tier.descriptionZh}</p>
      </CardHeader>

      <CardContent className="flex-1 pb-2">
        <ul className="space-y-1">
          {tier.features.map((feature) => (
            <FeatureRow key={feature.name} {...feature} />
          ))}
        </ul>
      </CardContent>

      <CardFooter className="pt-4 pb-6">
        <Link href="/signup" className="w-full">
          <Button
            className={`w-full text-base font-semibold py-6 rounded-xl transition-all duration-300 ${
              isPro
                ? 'bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:shadow-indigo-500/30'
                : isLifetime
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-lg shadow-amber-500/25'
                  : 'bg-white dark:bg-gray-800 border-2 border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/30'
            }`}
          >
            {tier.cta}
            <span className="block text-xs font-normal opacity-80 ml-2">
              {tier.ctaZh}
            </span>
          </Button>
        </Link>
      </CardFooter>
    </Card>
  )
}

// ─── Main Page ───────────────────────────────────────────

export default function PricingPage() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    document.title = 'Pricing — BizCard AI | 定價 — BizCard AI'
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
            className="mb-6 px-4 py-1.5 text-sm bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800 animate-fade-in-down"
          >
            <Sparkles className="w-3.5 h-3.5 mr-1.5" />
            Transparent HKD Pricing 透明港幣定價
          </Badge>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight animate-fade-in-down">
            <span className="bg-gradient-to-r from-indigo-600 to-violet-600 dark:from-indigo-400 dark:to-violet-400 bg-clip-text text-transparent">
              Simple, honest pricing.
            </span>
            <br />
            <span className="text-gray-800 dark:text-gray-200">
              No data hostage. No auto-charge traps.
            </span>
          </h1>

          {/* Sub-headline */}
          <p className="mt-4 text-lg text-gray-600 dark:text-gray-400 animate-fade-in-up">
            簡單、透明嘅定價。冇數據綁架，冇自動收費陷阱。&nbsp;
            <span className="text-gray-400 dark:text-gray-500">
              簡單、透明的定價。沒有數據綁架，沒有自動收費陷阱。
            </span>
          </p>

          {/* Trust badges row */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4 animate-fade-in-up">
            {trustBadges.map((badge) => (
              <div
                key={badge.title}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/70 dark:bg-gray-900/50 backdrop-blur-sm border border-gray-200 dark:border-gray-800 text-sm"
              >
                <badge.icon className="w-4 h-4 text-indigo-500 dark:text-indigo-400 shrink-0" />
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  {badge.title}
                </span>
                <span className="text-xs text-muted-foreground hidden sm:inline">
                  {badge.titleZh}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Data Liberation Promise Banner ───────────── */}
      <section className="relative">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
          <div className="rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 border border-emerald-200 dark:border-emerald-800/50 p-6 sm:p-8 flex flex-col sm:flex-row items-center gap-4">
            <div className="shrink-0 w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center">
              <Download className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="flex-1 text-center sm:text-left">
              <h3 className="text-lg font-bold text-emerald-800 dark:text-emerald-300">
                <Shield className="w-4 h-4 inline mr-1" />
                Data Liberation Promise 數據解放承諾
              </h3>
              <p className="mt-1 text-sm text-emerald-700 dark:text-emerald-400 leading-relaxed">
                Your contacts are YOURS. Export anytime, even on the Free plan.
                Cancel in 1 tap — no tickets, no calls.
              </p>
              <p className="mt-0.5 text-xs text-emerald-600/70 dark:text-emerald-500/70">
                你嘅聯絡人係屬於你嘅。隨時導出，免費版都得。一鍵取消 — 唔使開ticket，唔使打電話。
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Pricing Tiers ─────────────────────────────── */}
      <section className="relative pb-16 sm:pb-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 items-stretch">
            {pricingTiers.map((tier) => (
              <div key={tier.id} className={tier.popular ? 'md:-mt-4 md:mb-4 z-10' : ''}>
                <PricingCard tier={tier} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Refugee Offer Banner ──────────────────────── */}
      <section className="relative pb-16 sm:pb-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl bg-gradient-to-r from-rose-50 to-orange-50 dark:from-rose-950/30 dark:to-orange-950/30 border border-rose-200 dark:border-rose-800/50 p-6 sm:p-8 relative overflow-hidden">
            {/* Decorative background icon */}
            <div className="absolute -right-6 -bottom-6 opacity-10 dark:opacity-5">
              <HeartHandshake className="w-48 h-48 text-rose-500" />
            </div>

            <div className="relative flex flex-col sm:flex-row items-center gap-4">
              <div className="shrink-0 w-12 h-12 rounded-xl bg-rose-100 dark:bg-rose-900/40 flex items-center justify-center">
                <HeartHandshake className="w-6 h-6 text-rose-600 dark:text-rose-400" />
              </div>
              <div className="flex-1 text-center sm:text-left">
                <h3 className="text-lg font-bold text-rose-800 dark:text-rose-300">
                  🚨 Switching from CamCard? 從CamCard轉會？
                </h3>
                <p className="mt-1 text-sm text-rose-700 dark:text-rose-400 leading-relaxed">
                  Get <strong>30 days of Pro free</strong> — no credit card required.
                  We&apos;ll help you import your CamCard contacts safely.
                </p>
                <p className="mt-0.5 text-xs text-rose-600/70 dark:text-rose-500/70">
                  獲取<strong>30日免費Pro版</strong> — 唔使信用卡。我哋幫你安全導入CamCard聯絡人。
                </p>
              </div>
              <Link href="/switch-from-camcard" className="shrink-0">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-rose-600 to-orange-600 hover:from-rose-700 hover:to-orange-700 text-white shadow-lg shadow-rose-500/25 rounded-xl font-semibold"
                >
                  Claim Offer
                  <ArrowRight className="w-4 h-4 ml-2" />
                  <span className="block text-xs font-normal opacity-80 ml-2">
                    領取優惠
                  </span>
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Trust Badges Section ──────────────────────── */}
      <section className="relative pb-16 sm:pb-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">
              You&apos;re in control. Always.
            </h2>
            <p className="mt-2 text-muted-foreground">
              你永遠掌握主導權。&nbsp;
              <span className="text-sm">你永远掌握主导权。</span>
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {trustBadges.map((badge) => (
              <Card
                key={badge.title}
                className="border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-gray-900/50 backdrop-blur-sm hover:shadow-md transition-shadow"
              >
                <CardHeader className="pb-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center mb-2">
                    <badge.icon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <CardTitle className="text-base font-bold text-gray-900 dark:text-gray-100">
                    {badge.title}
                  </CardTitle>
                  <CardDescription className="text-xs">{badge.titleZh}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                    {badge.description}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {badge.descriptionZh}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FAQ Section ────────────────────────────────── */}
      <section className="relative pb-20 sm:pb-28">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <Badge
              variant="secondary"
              className="mb-4 px-3 py-1 bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800"
            >
              FAQ 常見問題
            </Badge>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">
              Honest answers to honest questions.
            </h2>
            <p className="mt-2 text-muted-foreground">
              坦誠回答坦誠嘅問題。&nbsp;
              <span className="text-sm">坦诚回答坦诚的问题。</span>
            </p>
          </div>

          <Card className="border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-gray-900/50 backdrop-blur-sm">
            <CardContent className="pt-6">
              <Accordion type="single" collapsible className="w-full">
                {faqItems.map((item, index) => (
                  <AccordionItem
                    key={index}
                    value={`item-${index}`}
                    className="border-gray-200 dark:border-gray-800"
                  >
                    <AccordionTrigger className="text-left hover:no-underline">
                      <div>
                        <span className="text-base font-semibold text-gray-900 dark:text-gray-100">
                          {item.question}
                        </span>
                        <p className="text-sm font-normal text-muted-foreground mt-0.5">
                          {item.questionZh}
                        </p>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-3 pb-2">
                        <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                          {item.answer}
                        </p>
                        <p className="text-xs text-muted-foreground leading-relaxed pt-2 border-t border-gray-100 dark:border-gray-800">
                          {item.answerZh}
                        </p>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* ─── Final CTA ──────────────────────────────────── */}
      <section className="relative pb-20 sm:pb-28">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 p-8 sm:p-12 shadow-xl shadow-indigo-500/25">
            <h2 className="text-2xl sm:text-3xl font-bold text-white">
              Ready to own your contacts?
            </h2>
            <p className="mt-3 text-indigo-100 text-lg">
              準備好掌握你嘅聯絡人嗎？
            </p>
            <p className="text-indigo-200/70 text-sm mt-1">
              准备好掌握你的联系人了吗？
            </p>

            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/signup">
                <Button
                  size="lg"
                  className="bg-white text-indigo-700 hover:bg-indigo-50 font-bold text-lg px-8 py-6 rounded-xl shadow-lg transition-all duration-300 hover:shadow-xl"
                >
                  <Zap className="w-5 h-5 mr-2" />
                  Start Free — No Credit Card
                  <span className="block text-xs font-normal opacity-70 ml-2">
                    免費開始 — 唔使信用卡
                  </span>
                </Button>
              </Link>
            </div>

            <p className="mt-6 text-indigo-200/60 text-xs">
              <Mail className="w-3 h-3 inline mr-1" />
              Questions? Reach us at{' '}
              <a
                href="mailto:hello@bizcard.ai"
                className="text-white underline underline-offset-2 hover:text-indigo-100"
              >
                hello@bizcard.ai
              </a>
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
