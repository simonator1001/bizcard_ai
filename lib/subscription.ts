import { createClient } from '@supabase/supabase-js';
import { SUBSCRIPTION_PLANS } from '@/lib/plans';
import { supabase } from '@/lib/supabase-client';

// Check if we're on the client side
const isClient = typeof window !== 'undefined';

// Only require environment variables on the server side
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = isClient ? undefined : process.env.SUPABASE_SERVICE_ROLE_KEY;

// Log environment check
console.debug('[Subscription] Environment check:', {
  isClient,
  hasUrl: !!supabaseUrl,
  hasServiceKey: !!supabaseServiceKey,
  availableKeys: Object.keys(process.env).filter(key => key.includes('SUPABASE'))
});

// Use regular client on client side, admin client on server side
export const adminClient = isClient ? supabase : (supabaseUrl && supabaseServiceKey ? 
  createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false
    }
  }) : null);

// Log initialization status
console.debug('[Subscription] Initialization:', {
  isClient,
  hasAdminClient: !!adminClient,
  url: supabaseUrl
});

export interface Subscription {
  id: string;
  userId: string;
  tier: 'free' | 'basic' | 'pro';
  status: 'active' | 'inactive' | 'cancelled';
  currentPeriodStart: Date;
  currentPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface SubscriptionUsage {
  scansCount: number;
  companiesTracked: number;
  totalCards: number;
  remainingScans: number;
}

export class SubscriptionService {
  static async getCurrentSubscription(userId: string): Promise<Subscription> {
    try {
      if (!adminClient) {
        console.debug('[Subscription] No admin client available, returning default subscription');
        return this.getDefaultSubscription(userId);
      }

      console.debug('[Subscription] Fetching subscription for user:', userId);
      const { data: subscription, error } = await adminClient
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.error('[Subscription] Error fetching subscription:', error);
        return this.getDefaultSubscription(userId);
      }

      if (!subscription) {
        console.debug('[Subscription] No subscription found, returning default');
        return this.getDefaultSubscription(userId);
      }

      console.debug('[Subscription] Raw subscription data from DB:', subscription);

      // Ensure tier is one of the valid values and normalize to lowercase
      const rawTier = subscription.tier;
      const normalizedTier = rawTier?.toLowerCase();
      
      console.debug('[Subscription] Tier normalization:', {
        rawTier,
        normalizedTier,
        isValidTier: normalizedTier === 'free' || normalizedTier === 'basic' || normalizedTier === 'pro'
      });

      const validTier = normalizedTier === 'free' || normalizedTier === 'basic' || normalizedTier === 'pro' 
        ? normalizedTier 
        : 'free';

      const result = {
        id: subscription.id,
        userId: subscription.user_id,
        tier: validTier,
        status: subscription.status || 'active',
        currentPeriodStart: new Date(subscription.current_period_start || Date.now()),
        currentPeriodEnd: subscription.current_period_end ? new Date(subscription.current_period_end) : null,
        cancelAtPeriodEnd: subscription.cancel_at_period_end || false,
        createdAt: new Date(subscription.created_at || Date.now()),
        updatedAt: new Date(subscription.updated_at || Date.now())
      };

      console.debug('[Subscription] Processed subscription data:', {
        result,
        originalTier: subscription.tier,
        normalizedTier: validTier,
        status: result.status,
        currentPeriodEnd: result.currentPeriodEnd
      });

      return result;
    } catch (error) {
      console.error('[Subscription] Error in getCurrentSubscription:', error);
      return this.getDefaultSubscription(userId);
    }
  }

  static async updateBranding(userId: string, branding: { logoUrl?: string; primaryColor?: string; companyName?: string }) {
    try {
      if (!adminClient) {
        console.debug('[Subscription] No admin client available, skipping branding update');
        return false;
      }

      const { error } = await adminClient
        .from('subscriptions')
        .update({
          custom_branding: branding,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      if (error) {
        console.error('[Subscription] Error updating branding:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('[Subscription] Error in updateBranding:', error);
      return false;
    }
  }

  private static getDefaultSubscription(userId: string): Subscription {
    const result = {
      id: 'free',
      userId,
      tier: 'free',
      status: 'active',
      currentPeriodStart: new Date(),
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    console.debug('[Subscription] Using default subscription:', result);
    return result;
  }

  static async getCurrentUsage(userId: string): Promise<SubscriptionUsage> {
    try {
      console.debug('[Subscription] Getting usage for user:', userId);

      // Get subscription to determine scan limits
      const subscription = await this.getCurrentSubscription(userId);
      console.debug('[Subscription] Got subscription for usage:', {
        tier: subscription.tier,
        status: subscription.status
      });

      // Ensure lowercase tier for plan lookup
      const tier = subscription.tier.toLowerCase();
      const plan = SUBSCRIPTION_PLANS[tier];
      console.debug('[Subscription] Using plan for tier:', {
        tier,
        planName: plan?.name,
        planLimits: plan?.limits
      });

      if (!adminClient) {
        console.debug('[Subscription] No admin client available, returning default usage');
        return this.getDefaultUsage(plan);
      }

      // Get current stats from user_usage_stats table
      const { data: stats, error: statsError } = await adminClient
        .from('user_usage_stats')
        .select('scans_this_month, unique_companies, cards_count')
        .eq('user_id', userId)
        .single();

      if (statsError) {
        console.error('[Subscription] Error getting user stats:', statsError);
        return this.getDefaultUsage(plan);
      }

      console.debug('[Subscription] Raw stats from DB:', stats);

      const monthlyLimit = plan.limits.scansPerMonth;
      const scansCount = stats?.scans_this_month || 0;
      const totalCards = stats?.cards_count || 0;
      const uniqueCompanies = stats?.unique_companies || 0;

      // For Pro plan, remaining scans should be Infinity
      const remainingScans = monthlyLimit === Infinity ? Infinity : Math.max(0, monthlyLimit - scansCount);

      const result = {
        scansCount,
        companiesTracked: uniqueCompanies,
        totalCards,
        remainingScans
      };

      console.debug('[Subscription] Calculated usage:', {
        result,
        monthlyLimit,
        isPro: tier === 'pro',
        planName: plan.name
      });

      return result;
    } catch (error) {
      console.error('[Subscription] Error getting usage:', error);
      return this.getDefaultUsage(SUBSCRIPTION_PLANS.free);
    }
  }

  private static getDefaultUsage(plan: any): SubscriptionUsage {
    const result = {
      scansCount: 0,
      companiesTracked: 0,
      totalCards: 0,
      remainingScans: plan.limits.scansPerMonth
    };
    console.debug('[Subscription] Using default usage:', {
      result,
      planLimits: plan.limits
    });
    return result;
  }

  static async updateUsageAfterCardDeletion(userId: string): Promise<void> {
    try {
      if (!adminClient) {
        console.debug('[Subscription] No admin client available, skipping usage update');
        return;
      }

      // Call the stored procedure to update usage stats
      const { error } = await adminClient
        .rpc('initialize_monthly_usage', { user_id_param: userId });

      if (error) {
        console.error('[Subscription] Error updating usage:', error);
        throw error;
      }
    } catch (error) {
      console.error('[Subscription] Error updating usage after card deletion:', error);
      throw error;
    }
  }

  static async getUserPlan(userId: string) {
    const subscription = await this.getCurrentSubscription(userId);
    return SUBSCRIPTION_PLANS[subscription.tier];
  }

  static async canPerformAction(userId: string, action: 'scan' | 'track_company'): Promise<boolean> {
    try {
      const [plan, usage] = await Promise.all([
        this.getUserPlan(userId),
        this.getCurrentUsage(userId),
      ]);

      if (!plan || !usage) {
        console.debug('[Subscription] No plan or usage data available');
        return false;
      }

      if (action === 'scan') {
        return usage.remainingScans > 0;
      } else if (action === 'track_company') {
        return usage.companiesTracked < plan.limits.companiesTracked;
      }

      return false;
    } catch (error) {
      console.error('[Subscription] Error checking action permission:', error);
      return false;
    }
  }

  static async uploadBusinessCardImage(userId: string, base64Image: string): Promise<string> {
    try {
      if (!adminClient) {
        console.error('[Subscription] No admin client available for storage upload');
        throw new Error('Service configuration error');
      }

      // Convert base64 to blob for upload
      const base64Response = await fetch(base64Image);
      const blob = await base64Response.blob();
      
      // Generate unique filename
      const fileName = `${userId}/${Date.now()}-card.jpg`;
      
      // Upload to Supabase storage using admin client
      const { data: uploadData, error: uploadError } = await adminClient.storage
        .from('business-cards')
        .upload(fileName, blob, {
          contentType: 'image/jpeg',
          upsert: true
        });

      if (uploadError) {
        console.error('[Subscription] Error uploading image:', uploadError);
        throw uploadError;
      }

      // Get public URL using admin client
      const { data } = adminClient.storage
        .from('business-cards')
        .getPublicUrl(fileName);

      // Ensure the URL is using HTTPS
      const publicUrl = data.publicUrl.replace('http://', 'https://');
      
      // Log the URL for debugging
      console.debug('[Subscription] Generated public URL:', publicUrl);

      return publicUrl;
    } catch (error) {
      console.error('[Subscription] Error uploading business card image:', error);
      throw error;
    }
  }

  // Helper function for consistent date formatting
  private static formatMonthDate(date: Date = new Date()): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  }

  static async incrementUsage(userId: string, action: 'scan' | 'track_company'): Promise<void> {
    try {
      if (!adminClient) {
        console.debug('[Subscription] No admin client available, skipping usage increment');
        return;
      }

      // Get current month in YYYY-MM format
      const currentMonth = this.formatMonthDate();

      // Get current subscription and usage
      const [subscription, usage] = await Promise.all([
        this.getCurrentSubscription(userId),
        this.getCurrentUsage(userId)
      ]);

      // Check if user can perform action
      const canPerform = await this.canPerformAction(userId, action);
      if (!canPerform) {
        throw new Error(`User has reached their ${action} limit`);
      }

      // Prepare update data based on action type
      let updateData: any = {
        updated_at: new Date().toISOString()
      };

      if (action === 'scan') {
        updateData.scans_this_month = (usage.scansCount || 0) + 1;
      } else if (action === 'track_company') {
        updateData.unique_companies = (usage.companiesTracked || 0) + 1;
      }

      // Update usage stats
      const { error } = await adminClient
        .from('user_usage_stats')
        .upsert({
          user_id: userId,
          ...updateData
        }, {
          onConflict: 'user_id'
        });

      if (error) {
        console.error('[Subscription] Error incrementing usage:', error);
        throw error;
      }
    } catch (error) {
      console.error('[Subscription] Error in incrementUsage:', error);
      throw error;
    }
  }

  static async upgradeSubscription(userId: string, tier: 'free' | 'basic' | 'pro', paymentDetails: { provider: string; subscriptionId: string }): Promise<boolean> {
    try {
      // Validate the tier
      if (!['free', 'basic', 'pro'].includes(tier)) {
        throw new Error('Invalid subscription tier');
      }

      if (!adminClient) {
        console.debug('[Subscription] No admin client available, skipping subscription upgrade');
        return false;
      }

      // Get current subscription
      const currentSubscription = await this.getCurrentSubscription(userId);

      // Don't allow downgrading to free tier
      if (tier === 'free' && currentSubscription.tier !== 'free') {
        throw new Error('Cannot downgrade to free tier');
      }

      // Update subscription in database
      const { error } = await adminClient
        .from('subscriptions')
        .upsert({
          user_id: userId,
          tier,
          status: 'active',
          current_period_start: new Date().toISOString(),
          current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
          cancel_at_period_end: false,
          payment_provider: paymentDetails.provider,
          subscription_id: paymentDetails.subscriptionId,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });

      if (error) {
        console.error('[Subscription] Error upgrading subscription:', error);
        return false;
      }

      // Initialize usage stats for the new subscription
      await this.initializeUsageStats(userId);

      return true;
    } catch (error) {
      console.error('[Subscription] Error in upgradeSubscription:', error);
      throw error;
    }
  }

  private static async initializeUsageStats(userId: string): Promise<void> {
    try {
      if (!adminClient) {
        console.debug('[Subscription] No admin client available, skipping usage stats initialization');
        return;
      }

      const { error } = await adminClient
        .from('user_usage_stats')
        .upsert({
          user_id: userId,
          scans_this_month: 0,
          unique_companies: 0,
          cards_count: 0,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });

      if (error) {
        console.error('[Subscription] Error initializing usage stats:', error);
        throw error;
      }
    } catch (error) {
      console.error('[Subscription] Error in initializeUsageStats:', error);
      throw error;
    }
  }

  static async insertBusinessCard(record: any): Promise<{ data: any; error: any }> {
    try {
      if (!adminClient) {
        console.debug('[Subscription] No admin client available, cannot insert business card');
        return { data: null, error: new Error('Service configuration error') };
      }

      // First, do a simple insert
      const { error: insertError } = await adminClient
        .from('business_cards')
        .insert([record]);

      if (insertError) {
        return { data: null, error: insertError };
      }

      // Then get the ID in a separate query
      const { data, error: selectError } = await adminClient
        .from('business_cards')
        .select('id')
        .eq('user_id', record.user_id)
        .eq('image_url', record.image_url)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (selectError) {
        return { data: null, error: selectError };
      }

      return { data, error: null };
    } catch (error) {
      console.error('[Subscription] Error inserting business card:', error);
      return { data: null, error };
    }
  }
} 