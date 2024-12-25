'use client';

import { useEffect, useState, useCallback } from 'react';
import { useUser } from '@/hooks/useUser';
import { SubscriptionService } from '@/lib/subscription';
import { SUBSCRIPTION_PLANS } from '@/lib/plans';

export function useSubscription() {
  const { user } = useUser();
  const [subscription, setSubscription] = useState<any>(null);
  const [usage, setUsage] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!user?.id) {
      setSubscription(null);
      setUsage(null);
      setLoading(false);
      return;
    }

    try {
      // Set initial free tier data immediately
      const freeTier = {
        id: 'free',
        userId: user.id,
        tier: 'free',
        status: 'active',
        currentPeriodStart: new Date(),
        currentPeriodEnd: null,
        cancelAtPeriodEnd: false,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const initialUsage = {
        scansCount: 0,
        companiesTracked: 0,
        totalCards: 0,
        remainingScans: SUBSCRIPTION_PLANS.free.limits.scansPerMonth
      };

      setSubscription(freeTier);
      setUsage(initialUsage);

      // Fetch actual data in the background
      const [subscriptionData, usageData] = await Promise.all([
        SubscriptionService.getCurrentSubscription(user.id),
        SubscriptionService.getCurrentUsage(user.id)
      ]);

      setSubscription(subscriptionData);
      setUsage(usageData);
    } catch (error) {
      console.error('Error fetching subscription data:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refreshUsage = useCallback(async () => {
    if (!user?.id) return;
    try {
      const usageData = await SubscriptionService.getCurrentUsage(user.id);
      setUsage(usageData);
    } catch (error) {
      console.error('Error refreshing usage:', error);
    }
  }, [user?.id]);

  return {
    subscription,
    usage,
    loading,
    refreshUsage,
    refetch: fetchData
  };
}