"use client";

import { useState } from 'react';
import { useUser } from '@/lib/hooks/useUser';
import { useSubscription } from '@/hooks/useSubscription';
import { SubscriptionService } from '@/lib/subscription';
import { SUBSCRIPTION_PLANS, SubscriptionTier } from '@/types/subscription';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Check, X } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';

export function PricingPlans() {
  const { user } = useUser();
  const { subscription, error: subscriptionError, refetch } = useSubscription();
  const [isYearly, setIsYearly] = useState(false);
  const [loading, setLoading] = useState<SubscriptionTier | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const handleUpgrade = async (tier: SubscriptionTier) => {
    if (!user) {
      toast({
        title: 'Please sign in',
        description: 'You need to be signed in to upgrade your subscription.',
        variant: 'destructive',
      });
      return;
    }

    // Handle enterprise tier separately
    if (tier === 'enterprise') {
      window.location.href = 'mailto:sales@bizcard.com';
      return;
    }

    setLoading(tier);
    setError(null);
    try {
      // TODO: Integrate with payment provider
      const success = await SubscriptionService.upgradeSubscription(user.id, tier, {
        provider: 'stripe',
        subscriptionId: 'dummy-id',
      });

      if (success) {
        toast({
          title: 'Subscription upgraded!',
          description: `You've successfully upgraded to the ${tier} plan.`,
        });
        // Refresh subscription data
        await refetch();
      } else {
        throw new Error('Failed to upgrade subscription');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to upgrade subscription';
      setError(new Error(errorMessage));
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(null);
    }
  };

  if (subscriptionError) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {subscriptionError.message || 'Failed to load subscription data'}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-16">
      {error && (
        <Alert variant="destructive" className="mb-8">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error.message}
          </AlertDescription>
        </Alert>
      )}

      {/* Billing Toggle */}
      <div className="flex justify-center items-center gap-4 mb-8">
        <span className={!isYearly ? 'font-bold' : ''}>Monthly</span>
        <button
          onClick={() => setIsYearly(!isYearly)}
          className="relative inline-flex h-6 w-11 items-center rounded-full bg-primary transition-colors focus:outline-none"
        >
          <span
            className={`${
              isYearly ? 'translate-x-6' : 'translate-x-1'
            } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
          />
        </button>
        <span className={isYearly ? 'font-bold' : ''}>
          Yearly <Badge variant="secondary">Save up to 20%</Badge>
        </span>
      </div>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {SUBSCRIPTION_PLANS.map((plan) => (
          <Card key={plan.tier} className="p-6 relative">
            {plan.tier === 'pro' && (
              <Badge className="absolute -top-2 right-4" variant="secondary">
                Most Popular
              </Badge>
            )}
            
            <h3 className="text-2xl font-bold">{plan.name}</h3>
            <div className="mt-4 mb-8">
              {plan.price.monthly === -1 ? (
                <div className="text-2xl font-bold">Custom Pricing</div>
              ) : (
                <>
                  <div className="text-3xl font-bold">
                    ${isYearly ? plan.price.yearly / 12 : plan.price.monthly}
                    <span className="text-sm font-normal">/month</span>
                  </div>
                  {isYearly && (
                    <div className="text-sm text-muted-foreground">
                      Billed ${plan.price.yearly}/year
                    </div>
                  )}
                </>
              )}
            </div>

            <ul className="space-y-3 mb-8">
              {plan.features.map((feature, index) => (
                <li key={index} className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-green-500" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            <Button
              className="w-full"
              variant={plan.tier === 'enterprise' ? 'outline' : 'default'}
              onClick={() => handleUpgrade(plan.tier)}
              disabled={loading === plan.tier || subscription?.tier === plan.tier}
            >
              {loading === plan.tier ? 'Processing...' : 
               subscription?.tier === plan.tier ? 'Current Plan' : 
               plan.tier === 'enterprise' ? 'Contact Sales' : 'Upgrade'}
            </Button>
          </Card>
        ))}
      </div>

      {/* FAQ Section */}
      <div className="mt-16">
        <h2 className="text-2xl font-bold mb-8 text-center">
          Frequently Asked Questions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <div>
            <h3 className="font-bold mb-2">Can I change plans later?</h3>
            <p className="text-muted-foreground">
              Yes, you can upgrade or downgrade your plan at any time. Changes will be reflected in your next billing cycle.
            </p>
          </div>
          <div>
            <h3 className="font-bold mb-2">What payment methods do you accept?</h3>
            <p className="text-muted-foreground">
              We accept all major credit cards and PayPal for payment.
            </p>
          </div>
          <div>
            <h3 className="font-bold mb-2">Is there a free trial?</h3>
            <p className="text-muted-foreground">
              Yes, you can try our Pro features for 7 days with no credit card required.
            </p>
          </div>
          <div>
            <h3 className="font-bold mb-2">What happens if I exceed my plan limits?</h3>
            <p className="text-muted-foreground">
              You'll be notified when you're approaching your plan limits. You can upgrade at any time to continue using the service.
            </p>
          </div>
        </div>
      </div>

      <p className="text-sm text-gray-500">
        Don&apos;t see what you&apos;re looking for?
      </p>
    </div>
  );
} 