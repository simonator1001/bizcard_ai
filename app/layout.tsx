import { Navigation } from '@/components/ui/navigation';
import { Providers } from '@/components/layout/providers';
import '@/styles/globals.css';

export const metadata = {
  title: 'Biz.ai - AI-Powered Business Card Management',
  description: 'Transform your business cards into digital contacts with AI-powered scanning and organization.',
  icons: {
    icon: [
      {
        url: '/favicon.ico',
        sizes: 'any',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: {
      url: '/apple-touch-icon.png',
      sizes: '180x180',
    },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>
          <Navigation />
          <main>{children}</main>
        </Providers>
      </body>
    </html>
  );
}
