import '@/styles/globals.css'
import '@/styles/manage.css'
import type { AppProps } from 'next/app'
import { AuthProvider } from '@/lib/auth-context'
import { I18nProvider } from '@/components/i18n-provider'
import { Toaster } from 'sonner'
import { testConnection } from '@/lib/supabase-client'
import React from 'react'
import Script from 'next/script'

console.log('[DEBUG] NEXT_PUBLIC_SUPABASE_URL at runtime:', process.env.NEXT_PUBLIC_SUPABASE_URL);

export default function App({ Component, pageProps }: AppProps) {
  React.useEffect(() => {
    console.log('[Supabase] useEffect running');
    testConnection()
      .then((result) => {
        console.log('[Supabase] testConnection result:', result);
      })
      .catch((err) => {
        console.error('[Supabase] testConnection error:', err);
      });
  }, []);

  return (
    <AuthProvider>
      <Script src="/clear-cache.js" strategy="afterInteractive" />
      <I18nProvider>
        <Component {...pageProps} />
        <Toaster />
      </I18nProvider>
    </AuthProvider>
  )
} 