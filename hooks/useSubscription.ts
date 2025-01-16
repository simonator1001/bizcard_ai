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
        console.debug('[useSubscription] No user ID, skipping fetch');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        console.debug('[useSubscription] Fetching data for user:', user.id);
        const [subscriptionData, usageData] = await Promise.all([
          SubscriptionService.getCurrentSubscription(user.id),
          SubscriptionService.getCurrentUsage(user.id)
        ]);

        console.debug('[useSubscription] Raw subscription data:', {
          id: subscriptionData?.id,
          userId: subscriptionData?.userId,
          tier: subscriptionData?.tier,
          status: subscriptionData?.status,
          currentPeriodEnd: subscriptionData?.currentPeriodEnd
        });

        console.debug('[useSubscription] Raw usage data:', {
          scansCount: usageData?.scansCount,
          companiesTracked: usageData?.companiesTracked,
          totalCards: usageData?.totalCards,
          remainingScans: usageData?.remainingScans
        });

        setSubscription(subscriptionData);
        setUsage(usageData);
      } catch (err) {
        console.error('[useSubscription] Error fetching subscription data:', err);
        setError('Failed to load subscription data');
      } finally {
        setIsLoading(false);
      }
    }

    fetchSubscriptionData();
  }, [user?.id]);

  // Debug log for subscription tier
  console.debug('[useSubscription] Current subscription state:', {
    tier: subscription?.tier,
    rawTier: subscription?.tier,
    status: subscription?.status,
    currentPeriodEnd: subscription?.currentPeriodEnd,
    userId: subscription?.userId
  });

  // Ensure case-insensitive tier lookup and handle invalid tiers
  const normalizedTier = subscription?.tier?.toLowerCase();
  console.debug('[useSubscription] Tier normalization:', {
    originalTier: subscription?.tier,
    normalizedTier,
    isValidTier: normalizedTier === 'free' || normalizedTier === 'basic' || normalizedTier === 'pro'
  });

  const plan = normalizedTier && SUBSCRIPTION_PLANS[normalizedTier] 
    ? SUBSCRIPTION_PLANS[normalizedTier] 
    : SUBSCRIPTION_PLANS.free;

  // Debug log for resolved plan
  console.debug('[useSubscription] Resolved plan:', {
    name: plan.name,
    tier: plan.tier,
    limits: plan.limits,
    planKey: normalizedTier,
    availablePlans: Object.keys(SUBSCRIPTION_PLANS)
  });

  // Compute isPro based on normalized tier
  const isPro = normalizedTier === 'pro';
  console.debug('[useSubscription] Plan status:', {
    normalizedTier,
    isPro,
    isFree: normalizedTier === 'free',
    isBasic: normalizedTier === 'basic',
    planName: plan.name
  });

  const subscriptionData = {
    subscription,
    usage,
    plan,
    isLoading,
    error,
    isFree: normalizedTier === 'free',
    isPro,
    isBasic: normalizedTier === 'basic',
    isActive: subscription?.status === 'active',
    canScan: !isLoading && usage ? usage.remainingScans > 0 : false,
    canTrackCompany: !isLoading && usage && plan ? usage.companiesTracked < plan.limits.companiesTracked : false,
  };

  // Debug log for final return value
  console.debug('[useSubscription] Final subscription data:', {
    tier: subscription?.tier,
    normalizedTier,
    planName: plan.name,
    isActive: subscriptionData.isActive,
    isPro: subscriptionData.isPro,
    isFree: subscriptionData.isFree,
    remainingScans: usage?.remainingScans,
    companiesTracked: usage?.companiesTracked,
    userId: user?.id
  });

  return subscriptionData;
} 