import { createClient } from '@/lib/supabase/client';
import { Subscription, SubscriptionUsage } from '@/types/subscription';

const supabase = createClient();

export const SubscriptionService = {
  async getCurrentSubscription(userId: string): Promise<Subscription | null> {
    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching subscription:', error);
        return null;
      }

      // If no subscription found, return a default free tier subscription
      if (!data) {
        return {
          id: 'free',
          user_id: userId,
          tier: 'free',
          status: 'active',
          current_period_end: null,
          cancel_at_period_end: false,
        };
      }

      return data;
    } catch (error) {
      console.error('Error fetching subscription:', error);
      return null;
    }
  },

  async getCurrentUsage(userId: string): Promise<SubscriptionUsage | null> {
    try {
      const currentDate = new Date();
      const currentMonth = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-01`;

      const { data, error } = await supabase
        .from('subscription_usage')
        .select('*')
        .eq('user_id', userId)
        .eq('month', currentMonth)
        .maybeSingle();

      if (error) {
        console.error('Error fetching usage:', error);
        return null;
      }

      // If no usage data found, return default values
      if (!data) {
        return {
          id: 'default',
          user_id: userId,
          month: currentMonth,
          scansCount: 0,
          companiesTracked: 0,
        };
      }

      return data;
    } catch (error) {
      console.error('Error fetching usage:', error);
      return null;
    }
  },

  async canPerformAction(userId: string, action: 'scan' | 'track_company'): Promise<boolean> {
    try {
      const [subscription, usage] = await Promise.all([
        this.getCurrentSubscription(userId),
        this.getCurrentUsage(userId),
      ]);

      if (!subscription || !usage) {
        return false;
      }

      // Get limits based on subscription tier
      const limits = {
        free: { scansPerMonth: 5, companiesTracked: 3 },
        basic: { scansPerMonth: 30, companiesTracked: 10 },
        pro: { scansPerMonth: Infinity, companiesTracked: Infinity },
      }[subscription.tier] || { scansPerMonth: 0, companiesTracked: 0 };

      if (action === 'scan') {
        return usage.scansCount < limits.scansPerMonth;
      } else if (action === 'track_company') {
        return usage.companiesTracked < limits.companiesTracked;
      }

      return false;
    } catch (error) {
      console.error('Error checking action permission:', error);
      return false;
    }
  },
}; 