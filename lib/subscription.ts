import { createClient } from '@supabase/supabase-js';
import { SUBSCRIPTION_PLANS } from '@/lib/plans';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables');
}

console.log('Connecting to Supabase at:', supabaseUrl);

const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
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
      const { data: subscription, error } = await adminClient
        .from('subscriptions')
        .select('id, user_id, tier, status, current_period_start, current_period_end, cancel_at_period_end, created_at, updated_at')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching subscription:', error);
        return this.getDefaultSubscription(userId);
      }

      if (!subscription) {
        return this.getDefaultSubscription(userId);
      }

      return {
        id: subscription.id,
        userId: subscription.user_id,
        tier: subscription.tier || 'free',
        status: subscription.status || 'active',
        currentPeriodStart: new Date(subscription.current_period_start),
        currentPeriodEnd: subscription.current_period_end ? new Date(subscription.current_period_end) : null,
        cancelAtPeriodEnd: subscription.cancel_at_period_end || false,
        createdAt: new Date(subscription.created_at),
        updatedAt: new Date(subscription.updated_at)
      };
    } catch (error) {
      console.error('Error in getCurrentSubscription:', error);
      return this.getDefaultSubscription(userId);
    }
  }

  private static getDefaultSubscription(userId: string): Subscription {
    return {
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
  }

  static async getCurrentUsage(userId: string): Promise<SubscriptionUsage> {
    try {
      console.log('Getting usage for user:', userId);

      // Get subscription to determine scan limits
      const subscription = await this.getCurrentSubscription(userId);
      const plan = SUBSCRIPTION_PLANS[subscription.tier];

      // Get current stats from user_usage_stats table
      const { data: stats, error: statsError } = await adminClient
        .from('user_usage_stats')
        .select('scans_this_month, unique_companies, cards_count')
        .eq('user_id', userId)
        .single();

      if (statsError) {
        console.error('Error getting user stats:', statsError);
        return this.getDefaultUsage(plan);
      }

      // For testing - log the raw stats
      console.log('Raw stats from DB:', stats);

      const monthlyLimit = plan.limits.scansPerMonth;
      const scansCount = stats.scans_this_month || 0;
      const totalCards = stats.cards_count || 0;
      const uniqueCompanies = stats.unique_companies || 0;

      // Calculate remaining scans
      const remainingScans = Math.max(0, monthlyLimit - scansCount);

      // For testing - log the calculated values
      console.log('Calculated usage:', {
        scansCount,
        companiesTracked: uniqueCompanies,
        totalCards,
        remainingScans
      });

      return {
        scansCount,
        companiesTracked: uniqueCompanies,
        totalCards,
        remainingScans
      };
    } catch (error) {
      console.error('Error getting usage:', error);
      return this.getDefaultUsage(SUBSCRIPTION_PLANS.free);
    }
  }

  private static getDefaultUsage(plan: any): SubscriptionUsage {
    return {
      scansCount: 0,
      companiesTracked: 0,
      totalCards: 0,
      remainingScans: plan.limits.scansPerMonth
    };
  }

  static async updateUsageAfterCardDeletion(userId: string): Promise<void> {
    try {
      // Call the stored procedure to update usage stats
      const { error } = await adminClient
        .rpc('initialize_monthly_usage', { user_id_param: userId });

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Error updating usage after card deletion:', error);
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
        return false;
      }

      if (action === 'scan') {
        return usage.remainingScans > 0;
      } else if (action === 'track_company') {
        return usage.companiesTracked < plan.limits.companiesTracked;
      }

      return false;
    } catch (error) {
      console.error('Error checking action permission:', error);
      return false;
    }
  }

  static async uploadBusinessCardImage(userId: string, base64Image: string): Promise<string> {
    try {
      // Convert base64 to blob for upload
      const base64Response = await fetch(base64Image);
      const blob = await base64Response.blob();
      
      // Generate unique filename
      const fileName = `${userId}/${Date.now()}-card.jpg`;
      
      // Use the regular supabase client for storage operations
      const { supabase } = await import('@/lib/supabase-client');
      
      // Upload to Supabase storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('business-cards')
        .upload(fileName, blob, {
          contentType: 'image/jpeg',
          upsert: true
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('business-cards')
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading business card image:', error);
      throw error;
    }
  }

  static async insertBusinessCard(record: any): Promise<{ data: any; error: any }> {
    try {
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
      console.error('Error inserting business card:', error);
      return { data: null, error };
    }
  }
} 