import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'How to Export Contacts from CamCard — Free Guide (2026) | BizCard AI',
  description:
    'Step-by-step guide to export your business cards from CamCard. Works for Free and Pro plans. Includes CSV export, vCard export, and how to import into BizCard AI for free.',
  keywords: [
    'export contacts from CamCard',
    'CamCard export',
    'how to export CamCard',
    'CamCard CSV export',
    'CamCard vCard export',
    'switch from CamCard',
    'CamCard alternative',
    '名片全能王 導出',
    'CamCard 導出聯絡人',
    'export CamCard contacts free',
    'CamCard data export',
  ],
  openGraph: {
    title: 'How to Export Contacts from CamCard — Free Guide (2026)',
    description:
      'Step-by-step guide to get YOUR contacts out of CamCard. Works even on Free plan. Import into BizCard AI for free.',
    type: 'article',
    publishedTime: '2026-05-06',
    modifiedTime: '2026-05-06',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'How to Export Contacts from CamCard (Even If They Try to Stop You)',
    description:
      '6 simple steps to export your business cards from CamCard. Free. No credit card needed.',
  },
  alternates: {
    canonical: 'https://bizcardai.vercel.app/blog/export-from-camcard',
  },
}

export default function BlogExportLayout({ children }: { children: React.ReactNode }) {
  return children
}
