'use client';

import { PricingCreative } from '@/components/ui/pricing-creative'
import { AuthProvider } from '@/lib/auth-context'
import { I18nProvider } from '@/components/i18n-provider'

export default function PricingPage() {
  return (
    <AuthProvider>
      <I18nProvider>
        <div className="flex-1">
          <div className="py-12 sm:py-16">
            <PricingCreative />
          </div>
        </div>
      </I18nProvider>
    </AuthProvider>
  )
} 