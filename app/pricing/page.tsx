'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { PricingCreative } from '@/components/ui/pricing-creative';
import { ClientProviders } from '@/components/providers/client-providers';

export default function PricingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Handle back navigation
  useEffect(() => {
    const handleBackNavigation = (e: PopStateEvent) => {
      if (!searchParams) return;
      
      const returnUrl = searchParams.get('return');
      if (returnUrl) {
        router.push(decodeURIComponent(returnUrl));
      } else {
        router.push('/?tab=settings');
      }
    };

    window.addEventListener('popstate', handleBackNavigation);
    return () => window.removeEventListener('popstate', handleBackNavigation);
  }, [router, searchParams]);

  return (
    <ClientProviders>
      <div className="flex-1">
        <div className="py-12 sm:py-16">
          <PricingCreative />
        </div>
      </div>
    </ClientProviders>
  );
} 