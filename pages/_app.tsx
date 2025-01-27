import '@/styles/globals.css'
import '@/styles/manage.css'
import type { AppProps } from 'next/app'
import { AuthProvider } from '@/lib/auth-context'
import { I18nProvider } from '@/components/i18n-provider'
import { Toaster } from 'sonner'

export default function App({ Component, pageProps }: AppProps) {
  return (
    <AuthProvider>
      <I18nProvider>
        <Component {...pageProps} />
        <Toaster />
      </I18nProvider>
    </AuthProvider>
  )
} 