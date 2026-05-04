import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Switch from CamCard to BizCard — Free Business Card Scanner Alternative (2026)',
  description:
    'CamCard holding your contacts hostage? Switch to BizCard — the free business card scanner with unlimited exports, AI-powered OCR, and full HK/Chinese support. No credit card needed.',
  keywords: [
    'switch from CamCard',
    'CamCard alternative',
    'free business card scanner',
    'CamCard export contacts',
    'business card OCR',
    '名片掃描',
    'CamCard 替代',
    '免費名片掃描',
    'CamCard 導出',
    'BizCard',
    'HK business card app',
    '香港名片App',
  ],
  openGraph: {
    title: 'Switch from CamCard to BizCard — Free Business Card Scanner Alternative (2026)',
    description:
      'CamCard locked your contacts behind a paywall? Get them back for free with BizCard. AI-powered OCR, unlimited exports, and HK/Chinese support.',
    type: 'website',
    locale: 'en_HK',
    siteName: 'BizCard',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Switch from CamCard to BizCard — Free Alternative (2026)',
    description:
      'CamCard holding your contacts hostage? Switch to BizCard — free, unlimited exports, AI-powered OCR.',
  },
  alternates: {
    languages: {
      'en-HK': '/switch-from-camcard',
      'zh-HK': '/switch-from-camcard',
    },
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function SwitchFromCamCardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
