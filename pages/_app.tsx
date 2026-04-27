import '@/styles/globals.css'
import '@/styles/manage.css'
import type { AppProps } from 'next/app'
import { AuthProvider } from '@/lib/auth-context'
import { I18nProvider } from '@/components/i18n-provider'
import { Toaster } from 'sonner'
// DISABLED: Supabase removed
import React from 'react'
import Script from 'next/script'

export default function App({ Component, pageProps }: AppProps) {
  // DISABLED: Supabase removed - testConnection no longer available

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