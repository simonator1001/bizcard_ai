import './globals.css'
import { Inter } from 'next/font/google'
import { AuthProvider } from '@/lib/auth-context'
import { I18nProvider } from '@/components/i18n-provider'
import { Toaster } from 'sonner'
import AppLayoutClient from './AppLayoutClient'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Simon.AI BizCard Digital Archive',
  description: 'Digitize and manage your business cards with AI',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <AuthProvider>
          <I18nProvider>
            <AppLayoutClient>{children}</AppLayoutClient>
          </I18nProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
