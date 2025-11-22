import './globals.css'
import { Inter } from 'next/font/google'
import { Providers } from '@/components/layout/providers'
import { Header } from '@/components/ui/header'
import { I18nProvider } from '@/components/i18n-provider'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Simon.AI BizCard Digital Archive',
  description: 'Digitize and manage your business cards with AI',
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
    userScalable: true,
    viewportFit: 'cover',
  },
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#000000' }
  ],
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'BizCard',
  },
  formatDetection: {
    telephone: true,
    date: false,
    address: true,
    email: true,
    url: true,
  },
}

const menuItems = [
  { text: 'Scan', to: '/' },
  { text: 'Manage', to: '/?tab=manage' },
  { text: 'Network', to: '/?tab=network' },
  { text: 'Companies', to: '/companies' },
  { text: 'News', to: '/?tab=news' },
  { text: 'Settings', to: '/?tab=settings' },
  { text: 'Pricing', to: '/?tab=pricing' },
];

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5, viewport-fit=cover" />
        <meta name="theme-color" content="#ffffff" media="(prefers-color-scheme: light)" />
        <meta name="theme-color" content="#000000" media="(prefers-color-scheme: dark)" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      </head>
      <body className={inter.className}>
        <I18nProvider>
          <Providers>
            <Header logo={<span className="text-xl font-bold">BizCard</span>} menuItems={menuItems} />
            <main className="flex-1 w-full px-2 sm:px-4 md:px-8 max-w-full">
              {children}
            </main>
          </Providers>
        </I18nProvider>
      </body>
    </html>
  )
}
