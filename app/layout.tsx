import { Navigation } from '@/components/ui/navigation';
import { Toaster } from '@/components/ui/toaster';
import '@/styles/globals.css';

export const metadata = {
  title: 'BizCard - Digital Business Card Management',
  description: 'Scan, manage, and organize your business cards with AI-powered features',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Navigation />
        <main>{children}</main>
        <Toaster />
      </body>
    </html>
  );
}
