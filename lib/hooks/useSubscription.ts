'use client';

import { useEffect, useState, useCallback } from 'react';
import { useUser } from '@/hooks/useUser';
import { SubscriptionService } from '@/lib/subscription';
import { SUBSCRIPTION_PLANS } from '@/lib/plans';

interface Subscription {
  id: string;
  userId: string;
  tier: string;
  status: string;
  currentPeriodStart: Date;
  currentPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
  createdAt: Date;
  updatedAt: Date;
  customBranding?: {
    logoUrl: string;
    primaryColor?: string;
    companyName?: string;
  };
}

interface Usage {
  scansCount: number;
  companiesTracked: number;
  totalCards: number;
  remainingScans: number;
}

export function useSubscription() {
  const { user } = useUser();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [usage, setUsage] = useState<Usage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    if (!user?.id) {
      setSubscription(null);
      setUsage(null);
      setLoading(false);
      setError(null);
      return;
    }

    try {
      setError(null);
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
      setError(error instanceof Error ? error : new Error('Failed to fetch subscription data'));
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
      setError(null);
      const usageData = await SubscriptionService.getCurrentUsage(user.id);
      setUsage(usageData);
    } catch (error) {
      console.error('Error refreshing usage:', error);
      setError(error instanceof Error ? error : new Error('Failed to refresh usage data'));
    }
  }, [user?.id]);

  return {
    subscription,
    usage,
    loading,
    error,
    refreshUsage,
    refetch: fetchData
  };
}