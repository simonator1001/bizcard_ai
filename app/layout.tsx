import './globals.css'
import ClientRootLayout from '@/components/layout/ClientRootLayout'

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
      <ClientRootLayout>{children}</ClientRootLayout>
    </html>
  )
}
