import { useEffect, useState } from 'react';
import { useUser } from '@/hooks/useUser';
import { SubscriptionService, Subscription, SubscriptionUsage } from '@/lib/subscription';
import { SUBSCRIPTION_PLANS } from '@/lib/plans';

export function useSubscription() {
  const { user, loading: userLoading } = useUser();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [usage, setUsage] = useState<SubscriptionUsage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function fetchSubscriptionData() {
      try {
        // Skip if user is not loaded yet
        if (userLoading) {
          console.debug('[useSubscription] User still loading, skipping fetch');
          return;
        }

        // If no user, set default subscription
        if (!user?.id) {
          console.debug('[useSubscription] No user ID, setting default subscription');
          const defaultSubscription = SubscriptionService.getDefaultSubscription('anonymous');
          const defaultUsage = SubscriptionService.getDefaultUsage(SUBSCRIPTION_PLANS.free);
          
          if (isMounted) {
            setSubscription(defaultSubscription);
            setUsage(defaultUsage);
            setLoading(false);
            setInitialized(true);
          }
          return;
        }

        console.debug('[useSubscription] Fetching subscription data for user:', user.id);
        setLoading(true);
        setError(null);

        // Fetch both subscription and usage data in parallel
        const [newSubscription, newUsage] = await Promise.all([
          SubscriptionService.getCurrentSubscription(user.id),
          SubscriptionService.getCurrentUsage(user.id)
        ]);

        if (isMounted) {
          console.debug('[useSubscription] Setting subscription data:', {
            subscription: newSubscription,
            usage: newUsage
          });
          
          setSubscription(newSubscription);
          setUsage(newUsage);
          setInitialized(true);
          setLoading(false);
        }
      } catch (err) {
        console.error('[useSubscription] Error fetching subscription data:', err);
        if (isMounted) {
          setError(err instanceof Error ? err : new Error('Failed to fetch subscription data'));
          // Set default values on error
          const defaultSubscription = SubscriptionService.getDefaultSubscription(user?.id || 'anonymous');
          const defaultUsage = SubscriptionService.getDefaultUsage(SUBSCRIPTION_PLANS.free);
          setSubscription(defaultSubscription);
          setUsage(defaultUsage);
          setLoading(false);
          setInitialized(true);
        }
      }
    }

    fetchSubscriptionData();

    return () => {
      isMounted = false;
    };
  }, [user?.id, userLoading]);

  // Helper function to check if user can perform an action
  const canPerformAction = async (action: 'scan' | 'track_company'): Promise<boolean> => {
    if (!user?.id) {
      console.debug('[useSubscription] No user ID, cannot perform action');
      return false;
    }

    try {
      return await SubscriptionService.canPerformAction(user.id, action);
    } catch (err) {
      console.error('[useSubscription] Error checking action permission:', err);
      return false;
    }
  };

  // Helper function to increment usage
  const incrementUsage = async (action: 'scan' | 'track_company'): Promise<void> => {
    if (!user?.id) {
      console.debug('[useSubscription] No user ID, cannot increment usage');
      return;
    }

    try {
      await SubscriptionService.incrementUsage(user.id, action);
      // Refresh usage data after incrementing
      const newUsage = await SubscriptionService.getCurrentUsage(user.id);
      setUsage(newUsage);
    } catch (err) {
      console.error('[useSubscription] Error incrementing usage:', err);
      throw err;
    }
  };

  // Add refreshUsage function
  const refreshUsage = async () => {
    if (!user?.id) {
      console.debug('[useSubscription] No user ID, cannot refresh usage');
      return;
    }

    try {
      const newUsage = await SubscriptionService.getCurrentUsage(user.id);
      setUsage(newUsage);
    } catch (err) {
      console.error('[useSubscription] Error refreshing usage:', err);
      throw err;
    }
  };

  // Debug log for subscription tier
  console.debug('[useSubscription] Current subscription state:', {
    tier: subscription?.tier,
    rawTier: subscription?.tier,
    status: subscription?.status,
    currentPeriodEnd: subscription?.currentPeriodEnd,
    userId: subscription?.userId,
    userLoading,
    loading,
    initialized
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

  const isFree = normalizedTier === 'free';
  const isBasic = normalizedTier === 'basic';
  const isActive = subscription?.status === 'active';

  const subscriptionData = {
    subscription,
    usage,
    plan,
    loading: loading || userLoading,
    error,
    isFree,
    isPro,
    isBasic,
    isActive,
    canScan: !loading && usage ? usage.remainingScans > 0 : false,
    canTrackCompany: !loading && usage && plan ? usage.companiesTracked < plan.limits.companiesTracked : false,
    canPerformAction,
    incrementUsage,
    refreshUsage,
    initialized
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
    userId: user?.id,
    userLoading,
    loading: subscriptionData.loading,
    initialized
  });

  return subscriptionData;
} 