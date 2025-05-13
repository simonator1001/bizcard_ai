import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { SubscriptionService } from '@/lib/subscription';

// Use hardcoded URL for consistency
const SUPABASE_URL = 'https://rzmqepriffysavamtxzg.supabase.co';

export async function subscriptionMiddleware(request: NextRequest) {
  const res = NextResponse.next();

  try {
    // Create Supabase client specifically for middleware
    const supabase = createServerClient(
      SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value;
          },
          set(name: string, value: string, options: CookieOptions) {
            res.cookies.set({
              name,
              value,
              ...options,
            });
          },
          remove(name: string, options: CookieOptions) {
            res.cookies.delete({
              name,
              ...options,
            });
          },
        },
      }
    );

    // Get authenticated user data
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      console.debug('[Subscription Middleware] No authenticated user found');
      return res;
    }

    // Get current subscription and usage
    const subscription = await SubscriptionService.getCurrentSubscription(user.id);
    const usage = await SubscriptionService.getCurrentUsage(user.id);

    // Add subscription info to request headers for use in API routes
    res.headers.set('x-subscription-tier', subscription?.tier || 'free');
    res.headers.set('x-subscription-status', subscription?.status || 'inactive');
    res.headers.set('x-scans-used', usage?.scansCount?.toString() || '0');
    res.headers.set('x-companies-tracked', usage?.companiesTracked?.toString() || '0');

    return res;
  } catch (error) {
    console.error('[Subscription Middleware] Error:', error);
    return res;
  }
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