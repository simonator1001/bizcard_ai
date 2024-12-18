import { createClient as createBrowserClient } from '@/lib/supabase/client';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { SubscriptionTier, Subscription, SubscriptionUsage, SUBSCRIPTION_PLANS, CustomBranding } from '@/types/subscription';

export class SubscriptionService {
  private static getClient() {
    try {
      // Check if we're on the server
      if (typeof window === 'undefined') {
        return createServerClient();
      }
      // We're in the browser
      return createBrowserClient();
    } catch (error) {
      console.error('Error creating Supabase client:', error);
      throw error;
    }
  }

  static async getCurrentSubscription(userId: string): Promise<Subscription | null> {
    const supabase = this.getClient();
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Error fetching subscription:', error);
      return null;
    }

    return data;
  }

  static async getCurrentUsage(userId: string): Promise<SubscriptionUsage | null> {
    const supabase = this.getClient();
    const currentMonth = new Date();
    currentMonth.setDate(1); // First day of current month

    const { data, error } = await supabase
      .from('subscription_usage')
      .select('*')
      .eq('user_id', userId)
      .eq('month', currentMonth.toISOString().split('T')[0])
      .single();

    if (error) {
      console.error('Error fetching usage:', error);
      return null;
    }

    return data;
  }

  static async canPerformAction(userId: string, action: 'scan' | 'track_company'): Promise<boolean> {
    const subscription = await this.getCurrentSubscription(userId);
    const usage = await this.getCurrentUsage(userId);
    const plan = SUBSCRIPTION_PLANS.find(p => p.tier === (subscription?.tier || 'free'));

    if (!plan) return false;

    switch (action) {
      case 'scan':
        return !usage || usage.scansCount < plan.limits.scansPerMonth;
      case 'track_company':
        return !usage || usage.companiesTracked < plan.limits.companiesTracked;
      default:
        return false;
    }
  }

  static async upgradeSubscription(
    userId: string,
    tier: SubscriptionTier,
    paymentDetails: any
  ): Promise<boolean> {
    const supabase = this.getClient();
    // TODO: Integrate with payment provider (Stripe/PayPal)
    const { error } = await supabase.from('subscriptions').upsert({
      user_id: userId,
      tier,
      status: 'active',
      current_period_start: new Date(),
      current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      payment_provider: paymentDetails.provider,
      payment_provider_subscription_id: paymentDetails.subscriptionId,
    });

    if (error) {
      console.error('Error upgrading subscription:', error);
      return false;
    }

    return true;
  }

  static async updateBranding(userId: string, branding: CustomBranding): Promise<boolean> {
    const supabase = this.getClient();
    const subscription = await this.getCurrentSubscription(userId);

    if (!subscription || subscription.tier !== 'enterprise') {
      console.error('Only enterprise users can update branding');
      return false;
    }

    const { error } = await supabase
      .from('subscriptions')
      .update({
        custom_branding: branding,
      })
      .eq('user_id', userId);

    if (error) {
      console.error('Error updating branding:', error);
      return false;
    }

    return true;
  }

  static async cancelSubscription(userId: string): Promise<boolean> {
    const supabase = this.getClient();
    const { error } = await supabase
      .from('subscriptions')
      .update({
        cancel_at_period_end: true,
        status: 'canceling',
      })
      .eq('user_id', userId);

    if (error) {
      console.error('Error canceling subscription:', error);
      return false;
    }

    return true;
  }
} 