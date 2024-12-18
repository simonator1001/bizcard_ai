import { Navigation } from '@/components/ui/navigation';
import { Providers } from '@/components/layout/providers';
import '@/styles/globals.css';

export const metadata = {
  title: 'BizCard - Digital Business Card Management',
  description: 'Scan, manage, and organize your business cards with AI-powered features.',
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
