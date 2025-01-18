import '@/styles/globals.css'
import { Inter } from 'next/font/google'
import { Toaster } from '@/components/ui/toaster'
import { ClientProviders } from '@/components/providers/client-providers'
import { Navigation } from "@/components/layout/Navigation";

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
        <Navigation />
        <ClientProviders>
          {children}
          <Toaster />
        </ClientProviders>
      </body>
    </html>
  )
}
