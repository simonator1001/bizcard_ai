import '@/styles/globals.css'
import '@/styles/signin.css'
import type { AppProps } from 'next/app'
import { AuthProvider } from '@/lib/auth-context'
import { NewsProvider } from '@/lib/news-context'
import { ErrorBoundary } from '@/components/error-boundary'
import { SubscriptionProvider } from '@/lib/subscription-context'

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <SubscriptionProvider>
          <NewsProvider>
            <Component {...pageProps} />
          </NewsProvider>
        </SubscriptionProvider>
      </AuthProvider>
    </ErrorBoundary>
  )
} 