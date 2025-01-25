import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { SubscriptionService } from '@/lib/subscription';

export async function subscriptionMiddleware(request: NextRequest) {
  const res = NextResponse.next();

  // Create Supabase client specifically for middleware
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          res.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: any) {
          res.cookies.delete({
            name,
            ...options,
          });
        },
      },
    }
  );

  try {
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
  } catch (error) {
    console.error('Error in subscription middleware:', error);
    return res;
  }
}

export async function checkSubscriptionLimit(
  userId: string,
  action: 'scan' | 'track_company'
): Promise<{ allowed: boolean; reason?: string }> {
  try {
    const subscription = await SubscriptionService.getCurrentSubscription(userId);
    const usage = await SubscriptionService.getCurrentUsage(userId);

    if (subscription?.tier === 'pro') {
      return { allowed: true };
    }

    if (action === 'scan' && usage?.scansCount >= 5) {
      return { allowed: false, reason: 'Free tier scan limit reached' };
    }

    if (action === 'track_company' && usage?.companiesTracked >= 3) {
      return { allowed: false, reason: 'Free tier company tracking limit reached' };
    }

    return { allowed: true };
  } catch (error) {
    console.error('Error checking subscription limit:', error);
    return { allowed: false, reason: 'Error checking subscription limits' };
  }
}

export function isFeatureAvailable(
  tier: string,
  feature: 'export' | 'advanced_ocr' | 'org_chart' | 'advanced_news'
): boolean {
  if (tier === 'pro') {
    return true;
  }

  const freeFeatures = ['export'];
  return freeFeatures.includes(feature);
} 