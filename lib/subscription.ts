import { createClient } from '@/lib/supabase/client';
import { Subscription, SubscriptionUsage } from '@/types/subscription';

let supabaseInstance: ReturnType<typeof createClient>;

const getSupabase = () => {
  if (!supabaseInstance) {
    supabaseInstance = createClient();
  }
  return supabaseInstance;
};

export const SubscriptionService = {
  async getCurrentSubscription(userId: string): Promise<Subscription | null> {
    try {
      console.log('Getting subscription for user:', userId);
      const supabase = getSupabase();
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
        console.log('No subscription found, returning free tier');
        return {
          id: 'free',
          userId: userId,
          tier: 'free',
          status: 'active',
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(),
          cancelAtPeriodEnd: false,
          createdAt: new Date(),
          updatedAt: new Date()
        };
      }

      console.log('Found subscription:', data);
      return {
        id: data.id,
        userId: data.user_id,
        tier: data.tier,
        status: data.status,
        currentPeriodStart: new Date(data.current_period_start),
        currentPeriodEnd: new Date(data.current_period_end),
        cancelAtPeriodEnd: data.cancel_at_period_end,
        paymentProvider: data.payment_provider,
        paymentProviderSubscriptionId: data.payment_provider_subscription_id,
        customBranding: data.custom_branding,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at)
      };
    } catch (error) {
      console.error('Error fetching subscription:', error);
      return null;
    }
  },

  async getCurrentUsage(userId: string): Promise<SubscriptionUsage | null> {
    try {
      const currentDate = new Date();
      const currentMonth = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-01`;
      console.log('Getting usage for user:', userId, 'month:', currentMonth);

      const supabase = getSupabase();

      // Get the total number of cards
      const { count: totalCards, error: countError } = await supabase
        .from('business_cards')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      console.log('Total cards:', totalCards);

      if (countError) {
        console.error('Error fetching total cards:', countError);
        return null;
      }

      // Get the current month's usage
      const { data: usageData, error: usageError } = await supabase
        .from('subscription_usage')
        .select('*')
        .eq('user_id', userId)
        .eq('month', currentMonth)
        .maybeSingle();

      console.log('Usage data from DB:', usageData);

      if (usageError) {
        console.error('Error fetching usage:', usageError);
        return null;
      }

      // Return usage data with actual scan count
      const usage: SubscriptionUsage = {
        id: usageData?.id || 'current',
        user_id: userId,
        month: currentMonth,
        scansCount: totalCards || 0,
        companiesTracked: usageData?.companies_tracked || 0,
        totalCards: totalCards || 0,
        created_at: usageData?.created_at || new Date().toISOString(),
        updated_at: usageData?.updated_at || new Date().toISOString()
      };

      console.log('Returning usage data:', usage);
      return usage;
    } catch (error) {
      console.error('Error fetching usage:', error);
      return null;
    }
  },

  async canPerformAction(userId: string, action: 'scan' | 'track_company'): Promise<boolean> {
    try {
      const [subscription, usage] = await Promise.all([
        this.getCurrentSubscription(userId),
        this.getCurrentUsage(userId)
      ]);

      if (!subscription || !usage) {
        return false;
      }

      const currentPlan = SUBSCRIPTION_PLANS.find(plan => plan.tier === subscription.tier);
      if (!currentPlan) {
        return false;
      }

      if (action === 'scan') {
        return usage.scansCount < currentPlan.limits.scansPerMonth;
      } else {
        return usage.companiesTracked < currentPlan.limits.companiesTracked;
      }
    } catch (error) {
      console.error('Error checking action permission:', error);
      return false;
    }
  }
}; 