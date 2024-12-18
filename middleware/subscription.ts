import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { SubscriptionService } from '@/lib/subscription';

export async function subscriptionMiddleware(request: NextRequest) {
  const res = NextResponse.next();
  const supabase = createClient(request, res);

  // Check if user is authenticated
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return res;
  }

  // Get current subscription and usage
  const subscription = await SubscriptionService.getCurrentSubscription(session.user.id);
  const usage = await SubscriptionService.getCurrentUsage(session.user.id);

  // Add subscription info to request headers for use in API routes
  res.headers.set('x-subscription-tier', subscription?.tier || 'free');
  res.headers.set('x-subscription-status', subscription?.status || 'inactive');
  res.headers.set('x-scans-used', usage?.scansCount?.toString() || '0');
  res.headers.set('x-companies-tracked', usage?.companiesTracked?.toString() || '0');

  return res;
}

// Helper function to check if a user can perform an action based on their subscription
export async function checkSubscriptionLimit(
  userId: string,
  action: 'scan' | 'track_company'
): Promise<{ allowed: boolean; reason?: string }> {
  const canPerform = await SubscriptionService.canPerformAction(userId, action);

  if (!canPerform) {
    const subscription = await SubscriptionService.getCurrentSubscription(userId);
    return {
      allowed: false,
      reason: action === 'scan' ? 'scan_limit' : 'company_limit',
    };
  }

  return { allowed: true };
}

// Helper function to check if a feature is available in the user's subscription tier
export function isFeatureAvailable(
  tier: string,
  feature: 'export' | 'advanced_ocr' | 'org_chart' | 'advanced_news'
): boolean {
  switch (feature) {
    case 'export':
    case 'advanced_ocr':
    case 'org_chart':
    case 'advanced_news':
      return tier === 'pro' || tier === 'enterprise';
    default:
      return false;
  }
} 