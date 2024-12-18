import { useState } from 'react';
import { useUser } from '@/lib/hooks/useUser';
import { SubscriptionService } from '@/lib/subscription';
import { SUBSCRIPTION_PLANS, SubscriptionTier } from '@/types/subscription';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

const STRIPE_LINKS = {
  pro: {
    monthly: 'https://buy.stripe.com/test_bIY3eN9mh9hv95SbIJ',
    yearly: 'https://buy.stripe.com/test_dR6aHf41X51fbe07su',
  },
};

export function PricingPlans() {
  const { user } = useUser();
  const [isYearly, setIsYearly] = useState(false);
  const [loading, setLoading] = useState<SubscriptionTier | null>(null);

  const handleUpgrade = async (tier: SubscriptionTier) => {
    if (!user) {
      toast({
        title: 'Please sign in',
        description: 'You need to be signed in to upgrade your subscription.',
        variant: 'destructive',
      });
      return;
    }

    // For Pro tier, redirect to Stripe payment link
    if (tier === 'pro') {
      const paymentLink = isYearly ? STRIPE_LINKS.pro.yearly : STRIPE_LINKS.pro.monthly;
      window.location.href = paymentLink;
      return;
    }

    setLoading(tier);
    try {
      const success = await SubscriptionService.upgradeSubscription(user.id, tier, {
        provider: 'stripe',
        subscriptionId: 'dummy-id',
      });

      if (success) {
        toast({
          title: 'Subscription upgraded!',
          description: `You've successfully upgraded to the ${tier} plan.`,
        });
      } else {
        throw new Error('Failed to upgrade subscription');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to upgrade subscription. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="container mx-auto px-4 py-16">
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

            {plan.tier === 'enterprise' ? (
              <Button
                className="w-full"
                variant="outline"
                onClick={() => window.location.href = 'mailto:sales@bizcard.com'}
              >
                Contact Sales
              </Button>
            ) : (
              <Button
                className="w-full"
                onClick={() => handleUpgrade(plan.tier)}
                disabled={loading === plan.tier}
              >
                {loading === plan.tier ? 'Processing...' : 'Upgrade'}
              </Button>
            )}
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
    </div>
  );
} 