// DISABLED: Supabase removed
// import { createClient } from '@supabase/supabase-js';
// import { supabase } from '@/lib/supabase-client';
import { SUBSCRIPTION_PLANS } from '@/lib/plans';
import { CustomBranding, Subscription as SubscriptionType, SubscriptionTier } from '@/types/subscription';

// DISABLED: Supabase removed - no client available
export const adminClient = null;

export type { CustomBranding };
export type Subscription = SubscriptionType;

export interface SubscriptionUsage {
  scansCount: number;
  companiesTracked: number;
  totalCards: number;
  remainingScans: number;
}

export class SubscriptionService {
  static async getCurrentSubscription(userId: string): Promise<Subscription> {
    // DISABLED: Supabase removed
    return this.getDefaultSubscription(userId);
  }

  static async updateBranding(userId: string, branding: { logoUrl?: string; primaryColor?: string; companyName?: string }) {
    // DISABLED: Supabase removed
    return false;
  }

  static async getCurrentUsage(userId: string): Promise<SubscriptionUsage> {
    // DISABLED: Supabase removed
    const subscription = await this.getCurrentSubscription(userId);
    const tier = subscription.tier.toLowerCase();
    const plan = SUBSCRIPTION_PLANS[tier] || SUBSCRIPTION_PLANS.free;
    return this.getDefaultUsage(plan);
  }

  static getDefaultSubscription(userId: string): Subscription {
    const now = new Date();
    const result: Subscription = {
      id: 'free',
      userId,
      tier: 'free' as SubscriptionTier,
      status: 'active',
      currentPeriodStart: now,
      currentPeriodEnd: new Date(now.setFullYear(now.getFullYear() + 1)),
      cancelAtPeriodEnd: false,
      createdAt: now,
      updatedAt: now
    };

    return result;
  }

  static getDefaultUsage(plan: any): SubscriptionUsage {
    const result = {
      scansCount: 0,
      companiesTracked: 0,
      totalCards: 0,
      remainingScans: plan.limits.scansPerMonth
    };
    return result;
  }

  static async updateUsageAfterCardDeletion(userId: string): Promise<void> {
    // DISABLED: Supabase removed
  }

  static async getUserPlan(userId: string) {
    const subscription = await this.getCurrentSubscription(userId);
    return SUBSCRIPTION_PLANS[subscription.tier];
  }

  static async canPerformAction(userId: string, action: 'scan' | 'track_company'): Promise<boolean> {
    // DISABLED: Supabase removed - always return true for now
    return true;
  }

  static async uploadBusinessCardImage(userId: string, base64Image: string): Promise<string> {
    // DISABLED: Supabase removed
    throw new Error('Service configuration error');
  }

  static async incrementUsage(userId: string, action: 'scan' | 'track_company'): Promise<void> {
    // DISABLED: Supabase removed
  }

  static async upgradeSubscription(userId: string, tier: 'free' | 'basic' | 'pro', paymentDetails: { provider: string; subscriptionId: string }): Promise<boolean> {
    // DISABLED: Supabase removed
    return false;
  }

  static async initializeUsageStats(userId: string): Promise<void> {
    // DISABLED: Supabase removed
  }

  static async insertBusinessCard(record: any): Promise<{ data: any; error: any }> {
    // DISABLED: Supabase removed
    return { data: null, error: new Error('Service configuration error') };
  }
}
