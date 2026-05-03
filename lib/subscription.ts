import { SUBSCRIPTION_PLANS } from '@/lib/plans';
import { CustomBranding, Subscription as SubscriptionType, SubscriptionTier } from '@/types/subscription';

const APPWRITE_ENDPOINT = 'https://sgp.cloud.appwrite.io/v1';
const PROJECT_ID = '69efa226000db23fcd89';

function appwriteHeaders() {
  return {
    'X-Appwrite-Project': PROJECT_ID,
    'X-Appwrite-Key': process.env.APPWRITE_API_KEY || '',
    'Content-Type': 'application/json',
  };
}

export type { CustomBranding };
export type Subscription = SubscriptionType;

export interface SubscriptionUsage {
  scansCount: number;
  companiesTracked: number;
  totalCards: number;
  remainingScans: number;
}

export class SubscriptionService {
  // Read subscription from AppWrite user preferences
  static async getCurrentSubscription(userId: string): Promise<Subscription> {
    try {
      const res = await fetch(`${APPWRITE_ENDPOINT}/users/${userId}/prefs`, {
        headers: appwriteHeaders(),
      });
      if (!res.ok) return this.getDefaultSubscription(userId);

      const prefs = await res.json();
      const sub = prefs.subscription;

      if (sub && sub.tier && sub.status === 'active') {
        return {
          id: sub.subscriptionId || sub.stripeSubscriptionId || userId,
          userId,
          tier: sub.tier as SubscriptionTier,
          status: sub.status,
          currentPeriodStart: new Date(sub.currentPeriodStart || Date.now()),
          currentPeriodEnd: new Date(sub.currentPeriodEnd || Date.now() + 365 * 86400000),
          cancelAtPeriodEnd: false,
          paymentProvider: sub.provider,
          paymentProviderSubscriptionId: sub.stripeSubscriptionId || sub.subscriptionId,
          createdAt: new Date(sub.updatedAt || Date.now()),
          updatedAt: new Date(sub.updatedAt || Date.now()),
        };
      }

      return this.getDefaultSubscription(userId);
    } catch {
      return this.getDefaultSubscription(userId);
    }
  }

  static async getUserPlan(userId: string) {
    const subscription = await this.getCurrentSubscription(userId);
    return SUBSCRIPTION_PLANS[subscription.tier] || SUBSCRIPTION_PLANS.free;
  }

  static getDefaultUsage(plan: any): SubscriptionUsage {
    return {
      scansCount: 0,
      companiesTracked: 0,
      totalCards: 0,
      remainingScans: plan.limits.scansPerMonth,
    };
  }

  static async getCurrentUsage(userId: string): Promise<SubscriptionUsage> {
    const subscription = await this.getCurrentSubscription(userId);
    const plan = SUBSCRIPTION_PLANS[subscription.tier] || SUBSCRIPTION_PLANS.free;
    return {
      scansCount: 0,
      companiesTracked: 0,
      totalCards: 0,
      remainingScans: plan.limits.scansPerMonth,
    };
  }

  static getDefaultSubscription(userId: string): Subscription {
    const now = new Date();
    return {
      id: userId,
      userId,
      tier: 'free' as SubscriptionTier,
      status: 'active',
      currentPeriodStart: now,
      currentPeriodEnd: new Date(now.getTime() + 365 * 86400000),
      cancelAtPeriodEnd: false,
      createdAt: now,
      updatedAt: now,
    };
  }

  static async upgradeSubscription(
    userId: string,
    tier: 'free' | 'basic' | 'pro',
    paymentDetails: { provider: string; subscriptionId: string }
  ): Promise<boolean> {
    try {
      const now = new Date();
      const expiry = new Date(now);
      expiry.setFullYear(expiry.getFullYear() + 1);

      const res = await fetch(`${APPWRITE_ENDPOINT}/users/${userId}/prefs`, {
        method: 'PATCH',
        headers: appwriteHeaders(),
        body: JSON.stringify({
          prefs: {
            subscription: {
              tier,
              status: 'active',
              provider: paymentDetails.provider,
              subscriptionId: paymentDetails.subscriptionId,
              currentPeriodStart: now.toISOString(),
              currentPeriodEnd: expiry.toISOString(),
              updatedAt: now.toISOString(),
            },
          },
        }),
      });
      return res.ok;
    } catch (err) {
      console.error('[SubscriptionService] upgradeSubscription error:', err);
      return false;
    }
  }

  static async canPerformAction(_userId: string, _action: 'scan' | 'track_company'): Promise<boolean> {
    return true;
  }

  static async updateBranding(_userId: string, _branding: any): Promise<boolean> {
    return false;
  }

  static async updateUsageAfterCardDeletion(_userId: string): Promise<void> {}
  static async incrementUsage(_userId: string, _action: 'scan' | 'track_company'): Promise<void> {}
  static async initializeUsageStats(_userId: string): Promise<void> {}
  static async uploadBusinessCardImage(): Promise<string> {
    throw new Error('Use /api/scan for image upload');
  }
  static async insertBusinessCard(): Promise<{ data: any; error: any }> {
    return { data: null, error: new Error('Use useBusinessCards hook or /api/scan') };
  }
}
