'use client';

import { useEffect, useState, useCallback } from 'react';
import { useUser } from './useUser';
import { SubscriptionService } from '../subscription';
import { Subscription, SubscriptionUsage } from '@/types/subscription';

export function useSubscription() {
  const { user } = useUser();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [usage, setUsage] = useState<SubscriptionUsage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshUsage = useCallback(async () => {
    if (!user) return;
    try {
      const usageData = await SubscriptionService.getCurrentUsage(user.id);
      setUsage(usageData);
    } catch (err) {
      console.error('Error refreshing usage data:', err);
    }
  }, [user]);

  useEffect(() => {
    async function fetchSubscriptionData() {
      if (!user) {
        setSubscription(null);
        setUsage(null);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const [subscriptionData, usageData] = await Promise.all([
          SubscriptionService.getCurrentSubscription(user.id),
          SubscriptionService.getCurrentUsage(user.id),
        ]);

        setSubscription(subscriptionData);
        setUsage(usageData);
        setError(null);
      } catch (err) {
        console.error('Error fetching subscription data:', err);
        setError('Failed to load subscription data');
      } finally {
        setLoading(false);
      }
    }

    fetchSubscriptionData();
  }, [user]);

  const canPerformAction = async (action: 'scan' | 'track_company'): Promise<boolean> => {
    if (!user) return false;
    return SubscriptionService.canPerformAction(user.id, action);
  };

  return {
    subscription,
    usage,
    loading,
    error,
    canPerformAction,
    refreshUsage,
  };
}