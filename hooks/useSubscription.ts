import { useEffect, useState } from 'react';
import { useUser } from '@/hooks/useUser';
import { SubscriptionService, Subscription, SubscriptionUsage } from '@/lib/subscription';
import { SUBSCRIPTION_PLANS } from '@/lib/plans';

export function useSubscription() {
  const { user } = useUser();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [usage, setUsage] = useState<SubscriptionUsage | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSubscriptionData() {
      if (!user?.id) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        const [subscriptionData, usageData] = await Promise.all([
          SubscriptionService.getCurrentSubscription(user.id),
          SubscriptionService.getCurrentUsage(user.id)
        ]);

        setSubscription(subscriptionData);
        setUsage(usageData);
      } catch (err) {
        console.error('Error fetching subscription data:', err);
        setError('Failed to load subscription data');
      } finally {
        setIsLoading(false);
      }
    }

    fetchSubscriptionData();
  }, [user?.id]);

  const plan = subscription ? SUBSCRIPTION_PLANS[subscription.tier] : SUBSCRIPTION_PLANS.free;

  return {
    subscription,
    usage,
    plan,
    isLoading,
    error,
    // Computed properties for easy access
    isFree: subscription?.tier === 'free',
    isPro: subscription?.tier === 'pro',
    isBasic: subscription?.tier === 'basic',
    isActive: subscription?.status === 'active',
    // Helper functions
    canScan: !isLoading && usage ? usage.remainingScans > 0 : false,
    canTrackCompany: !isLoading && usage && plan ? usage.companiesTracked < plan.limits.companiesTracked : false,
  };
} 