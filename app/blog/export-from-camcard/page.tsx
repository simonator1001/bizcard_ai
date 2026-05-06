'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  ArrowRight,
  Check,
  AlertTriangle,
  Download,
  Upload,
  Smartphone,
  Shield,
  ChevronRight,
  ExternalLink,
  Copy,
  FileText,
  Sparkles,
} from 'lucide-react'

// ─── Types ───────────────────────────────────────────────

interface ExportStep {
  step: number
  title: string
  titleZh: string
  description: string
  descriptionZh: string
  icon: any // lucide-react icon component
  tip?: string
  tipZh?: string
}

// ─── Data ────────────────────────────────────────────────

const exportSteps: ExportStep[] = [
  {
    step: 1,
    title: 'Open CamCard App',
    titleZh: '打開 CamCard App',
    description:
      'Launch the CamCard app on your phone. Make sure you\'re logged in with the account that has your business cards.',
    descriptionZh:
      '喺手機打開 CamCard App。確保你登入咗有你名片嘅帳戶。',
    icon: Smartphone,
  },
  {
    step: 2,
    title: 'Go to Settings',
    titleZh: '進入設定',
    description:
      'Tap the profile icon or menu button (usually top-left or bottom-right). Look for "Settings" (設定) in the menu.',
    descriptionZh:
      '點擊個人資料圖示或選單按鈕（通常喺左上角或右下角）。喺選單搵「設定」。',
    icon: Smartphone,
    tip: 'If you can\'t find Settings, try tapping your profile picture',
    tipZh: '如果搵唔到設定，試下點擊你嘅頭像',
  },
  {
    step: 3,
    title: 'Find Export Option',
    titleZh: '搵導出選項',
    description:
      'Look for "Export Contacts", "Export Cards", "Data Export", or "Backup". This may be under "Data Management" or "Account".',
    descriptionZh:
      '搵「導出聯絡人」、「導出名片」、「數據導出」或「備份」。可能喺「數據管理」或「帳戶」下面。',
    icon: FileText,
    tip: '⚠️ If you don\'t see an export option on the Free plan, CamCard may require a paid subscription to export your own data.',
    tipZh: '⚠️ 如果你喺免費版見唔到導出選項，CamCard 可能需要你升級付費計劃先可以導出自己嘅數據。',
  },
  {
    step: 4,
    title: 'Choose Export Format',
    titleZh: '選擇導出格式',
    description:
      'Select "CSV" or "vCard (.vcf)" as the export format. CSV is recommended — it works with Excel, Google Contacts, and BizCard AI.',
    descriptionZh:
      '選擇「CSV」或「vCard (.vcf)」作為導出格式。推薦 CSV — 可以喺 Excel、Google 通訊錄同 BizCard AI 使用。',
    icon: Download,
    tip: 'CSV preserves all fields (name, company, phone, email). vCard is better if you have profile photos.',
    tipZh: 'CSV 保留所有欄位（姓名、公司、電話、電郵）。如果有頭像，vCard 更適合。',
  },
  {
    step: 5,
    title: 'Save the File',
    titleZh: '儲存檔案',
    description:
      'Save the exported file to your phone\'s Downloads folder, or email it to yourself. Make sure you can find it later!',
    descriptionZh:
      '將導出嘅檔案儲存到手機嘅「下載」文件夾，或者電郵俾自己。確保之後可以搵到！',
    icon: Download,
  },
  {
    step: 6,
    title: 'Upload to BizCard AI',
    titleZh: '上傳到 BizCard AI',
    description:
      'Go to bizcardai.vercel.app on your phone or computer. Sign up (free, no credit card). Drag and drop your export file — BizCard auto-detects CamCard\'s format and imports all your contacts in seconds.',
    descriptionZh:
      '用手機或電腦去 bizcardai.vercel.app。註冊（免費，唔使信用卡）。拖放你嘅導出檔案 — BizCard 自動識別 CamCard 格式，幾秒內導入所有聯絡人。',
    icon: Upload,
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
    question: "What if CamCard won't let me export on the Free plan?",
    questionZh: '如果 CamCard 免費版唔俾我導出點算？',
    answer:
      "Unfortunately, this is a known issue. CamCard locks export functionality behind their paid subscription — essentially holding your own contacts hostage. If you can't export, you have two options: (1) Manually re-type your most important contacts into BizCard AI (our free tier gives you 10 cards), or (2) Pay for one month of CamCard Premium just to export your data, then cancel immediately. We know this is frustrating — it's exactly why we built BizCard AI with a Data Liberation Promise: export anytime, even on our Free plan.",
  },
  {
    question: 'Will my CamCard data import correctly into BizCard AI?',
    questionZh: '我嘅 CamCard 數據可以正確導入 BizCard AI 嗎？',
    answer:
      "Yes. BizCard AI's import tool auto-detects CamCard's CSV format, including Chinese column headers (姓名, 公司, 职位, 手机, 邮箱, 地址, 备注). We map all fields correctly — names, job titles, companies, phone numbers, emails, addresses, and notes. If any fields don't map perfectly, we show you a preview before finalizing the import so you can correct anything.",
  },
  {
    question: 'What happens to my contacts after I import them?',
    questionZh: '導入之後我嘅聯絡人會點？',
    answer:
      "They're YOURS. You can view them, search them, add notes, tag them, and export them again anytime — in CSV or vCard format — even on our Free plan. This is our Data Liberation Promise: no data hostage situation. If you ever want to leave BizCard AI, we make it easy. Your data goes with you.",
  },
  {
    question: 'Is BizCard AI really free?',
    questionZh: 'BizCard AI 真係免費？',
    answer:
      'Yes. Our Free plan gives you up to 10 business cards, 10 scans per month, standard AI OCR, and CSV/vCard export — forever. No credit card required. The Pro plan (HK$68/month or HK$388 lifetime) unlocks unlimited cards, GPT-4o enhanced OCR, batch scanning, tags, and priority support. No auto-charge traps — we email you 3 days before trial ends. Cancel in 1 tap.',
  },
]

// ─── Main Page ─────────────────────────────────────────────

export default function ExportFromCamCardPage() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    document.title = 'How to Export Contacts from CamCard — Free Guide (2026) | BizCard AI'
  }, [])

  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      {/* ─── Hero ─────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-500/20 via-transparent to-transparent pointer-events-none" />

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-12 sm:pt-24 sm:pb-16">
          <div className="flex items-center gap-2 text-indigo-300 text-sm mb-4">
            <Link href="/blog" className="hover:text-white transition-colors">
              Blog
            </Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-gray-400">Export Guide</span>
          </div>

          <Badge className="mb-4 bg-amber-500/20 text-amber-300 border-amber-500/30">
            <AlertTriangle className="w-3 h-3 mr-1" />
            Updated May 2026
          </Badge>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight">
            How to Export Contacts from CamCard
            <br />
            <span className="text-indigo-300 text-xl sm:text-2xl lg:text-3xl font-semibold">
              (Even If They Try to Stop You)
            </span>
          </h1>

          <p className="mt-4 text-lg text-gray-300 max-w-2xl">
            A step-by-step guide to getting YOUR contacts out of CamCard — and into an app that
            actually respects your data.
          </p>

          <div className="mt-6 flex flex-wrap gap-4 text-sm text-gray-400">
            <span className="flex items-center gap-1">
              <Shield className="w-3.5 h-3.5 text-emerald-400" />
              Free export on all plans
            </span>
            <span>·</span>
            <span>6 simple steps</span>
            <span>·</span>
            <span>~5 minutes</span>
          </div>
        </div>
      </section>

      {/* ─── The Problem ───────────────────────────────── */}
      <section className="relative py-10 sm:py-14">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="border-amber-200 dark:border-amber-800/50 bg-amber-50/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-amber-800">
                <AlertTriangle className="w-5 h-5" />
                Why This Is Harder Than It Should Be
              </CardTitle>
              <CardDescription className="text-amber-700">
                點解呢件事比想像中難
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-amber-800 leading-relaxed">
                CamCard doesn&apos;t make it easy to leave. On the Free plan, the export
                option is often hidden or completely unavailable — even though these are
                YOUR contacts. Many users report having to upgrade to a paid plan just to
                access their own data. This is what we call a &quot;data hostage&quot;
                situation, and it&apos;s one of the top complaints in CamCard&apos;s 1★
                reviews on Google Play.
              </p>
              <p className="mt-2 text-xs text-amber-700/70">
                CamCard 唔會令你輕易離開。免費版嘅導出功能經常被隱藏或完全冇咗 —
                即使呢啲係你自己嘅聯絡人。好多用戶報告要升級付費計劃先可以攞返自己嘅數據。
                呢個就係我哋所講嘅「數據綁架」。
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* ─── Step-by-Step Guide ────────────────────────── */}
      <section className="relative pb-12 sm:pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-8">
            Step-by-Step Export Guide
            <span className="block text-lg font-normal text-muted-foreground mt-1">
              逐步導出指南
            </span>
          </h2>

          <div className="space-y-6">
            {exportSteps.map((step) => (
              <Card
                key={step.step}
                className="border-gray-200 overflow-hidden"
              >
                <div className="flex flex-col sm:flex-row">
                  {/* Step number */}
                  <div className="sm:w-16 flex sm:flex-col items-center justify-center bg-indigo-50 py-4 sm:py-0">
                    <span className="text-2xl font-bold text-indigo-600">
                      {step.step}
                    </span>
                  </div>

                  <div className="flex-1 p-5">
                    <div className="flex items-start gap-3">
                      <step.icon className="w-5 h-5 mt-0.5 text-indigo-500 shrink-0" />
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {step.title}
                        </h3>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {step.titleZh}
                        </p>
                        <p className="mt-2 text-sm text-gray-600 leading-relaxed">
                          {step.description}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {step.descriptionZh}
                        </p>

                        {step.tip && (
                          <div className="mt-3 p-3 rounded-lg bg-indigo-50 border border-indigo-100">
                            <p className="text-xs text-indigo-700 font-medium">
                              💡 {step.tip}
                            </p>
                            {step.tipZh && (
                              <p className="text-xs text-indigo-600/70 mt-0.5">
                                {step.tipZh}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ─── After Export CTA ────────────────────────────── */}
      <section className="relative pb-12 sm:pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white border-0 shadow-xl shadow-indigo-500/25 overflow-hidden">
            <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full bg-white/10 pointer-events-none" />
            <CardContent className="relative p-8 sm:p-10 text-center">
              <Sparkles className="w-8 h-8 mx-auto mb-3 text-indigo-200" />
              <h2 className="text-2xl sm:text-3xl font-bold">
                Now import them into BizCard AI — Free
              </h2>
              <p className="mt-3 text-indigo-200 text-lg">
                而家將佢哋導入 BizCard AI — 免費
              </p>

              <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link href="/signup">
                  <Button
                    size="lg"
                    className="bg-white text-indigo-600 hover:bg-indigo-50 shadow-lg rounded-xl font-semibold px-8 py-6 text-lg"
                  >
                    Import My Contacts
                    <ArrowRight className="w-5 h-5 ml-2" />
                    <span className="block text-xs font-normal opacity-60 ml-2">
                      導入我嘅聯絡人
                    </span>
                  </Button>
                </Link>
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-center gap-4 text-sm text-indigo-200">
                <span className="flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" />
                  No credit card
                </span>
                <span className="flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" />
                  Export anytime
                </span>
                <span className="flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" />
                  Cancel in 1 tap
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* ─── FAQ ────────────────────────────────────────── */}
      <section className="relative pb-12 sm:pb-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 text-center mb-8">
            Common Questions
            <span className="block text-lg font-normal text-muted-foreground mt-1">
              常見問題
            </span>
          </h2>

          <div className="space-y-4">
            {faqItems.map((item, i) => (
              <Card key={i} className="border-gray-200">
                <CardHeader>
                  <CardTitle className="text-base text-gray-900">
                    {item.question}
                  </CardTitle>
                  <CardDescription>{item.questionZh}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {item.answer}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Bottom CTA ─────────────────────────────────── */}
      <section className="relative pb-20 sm:pb-28">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Your contacts belong to you.
          </h2>
          <p className="mt-2 text-muted-foreground">
            你嘅聯絡人係屬於你嘅。
          </p>

          <div className="mt-6 flex flex-col items-center gap-3">
            <Link href="/signup">
              <Button
                size="lg"
                className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg rounded-xl font-semibold px-10 py-6 text-lg"
              >
                Start Free — No Credit Card
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <p className="text-sm text-muted-foreground">
              🛡️ Data Liberation Promise — Export anytime, even on Free.
            </p>
          </div>

          <div className="mt-8 flex items-center justify-center gap-4 text-sm text-muted-foreground">
            <Link href="/pricing" className="hover:text-foreground transition-colors">
              Pricing
            </Link>
            <span>·</span>
            <Link href="/switch-from-camcard" className="hover:text-foreground transition-colors">
              Switch from CamCard
            </Link>
            <span>·</span>
            <a href="mailto:hello@bizcard.ai" className="hover:text-foreground transition-colors">
              hello@bizcard.ai
            </a>
          </div>
        </div>
      </section>
    </div>
  )
}
