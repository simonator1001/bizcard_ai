import '@/styles/globals.css'
import '@/styles/signin.css'
import type { AppProps } from 'next/app'
import { AuthProvider } from '@/lib/auth-context'
import { ErrorBoundary } from '@/components/layout/ErrorBoundary'
import { Toaster } from "@/components/ui/toaster"

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Component {...pageProps} />
        <Toaster />
      </AuthProvider>
    </ErrorBoundary>
  )
} 