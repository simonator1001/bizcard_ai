import './globals.css'
import { Inter } from 'next/font/google'
import { AuthProvider } from '@/lib/auth-context'
import { I18nProvider } from '@/components/i18n-provider'
import { Toaster } from 'sonner'
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
        <AuthProvider>
          <I18nProvider>
            <div className="min-h-screen flex flex-row bg-background">
              {/* Sidebar Navigation */}
              <aside className="hidden md:flex md:flex-col md:w-56 border-r bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-40">
                <Navigation />
              </aside>
              <div className="flex-1 flex flex-col min-w-0">
                {/* Topbar */}
                <header className="sticky top-0 z-30 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                  <div className="container flex h-16 items-center px-4">
                    <span className="font-bold text-xl">Simon.AI BizCard</span>
                  </div>
                </header>
                <main className="flex-1">
                  {children}
                  <Toaster />
                </main>
              </div>
            </div>
          </I18nProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
