"use client";

import { useTranslation } from 'react-i18next';
import { useSubscription } from '@/hooks/useSubscription';
import { SUBSCRIPTION_PLANS } from '@/types/subscription';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { AlertCircle, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export function SubscriptionStatus() {
  const { subscription, usage, loading, error } = useSubscription();
  const router = useRouter();

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error.message || 'Failed to load subscription data'}
          </AlertDescription>
        </Alert>
      </Card>
    );
  }

  const currentPlan = SUBSCRIPTION_PLANS.find(
    (plan) => plan.tier === (subscription?.tier || 'free')
  );

  if (!currentPlan) return null;

  const scansUsed = usage?.scansCount || 0;
  const scansLimit = currentPlan.limits.scansPerMonth;
  const scansPercentage = scansLimit === Infinity ? 0 : (scansUsed / scansLimit) * 100;

  const companiesTracked = usage?.companiesTracked || 0;
  const companiesLimit = currentPlan.limits.companiesTracked;
  const companiesPercentage = companiesLimit === Infinity ? 0 : (companiesTracked / companiesLimit) * 100;

  return (
    <Card className="p-6">
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-2">
            Current Plan: {currentPlan.name}
          </h3>
          {subscription?.status === 'active' && subscription.currentPeriodEnd && (
            <p className="text-sm text-muted-foreground">
              Your subscription will renew on{' '}
              {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
            </p>
          )}
        </div>

        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span>Business Card Scans</span>
              <span>
                {scansUsed} / {scansLimit === Infinity ? '∞' : scansLimit}
              </span>
            </div>
            <Progress value={scansPercentage} className="h-2" />
          </div>

          <div>
            <div className="flex justify-between text-sm mb-2">
              <span>Companies Tracked</span>
              <span>
                {companiesTracked} / {companiesLimit === Infinity ? '∞' : companiesLimit}
              </span>
            </div>
            <Progress value={companiesPercentage} className="h-2" />
          </div>
        </div>

        {subscription?.status === 'active' ? (
          subscription.cancelAtPeriodEnd ? (
            <div className="text-center space-y-4">
              <p className="text-sm text-muted-foreground">
                Your subscription will end on{' '}
                {subscription.currentPeriodEnd && new Date(subscription.currentPeriodEnd).toLocaleDateString()}
              </p>
              <Button
                variant="outline"
                onClick={() => router.push('/pricing')}
              >
                Renew Subscription
              </Button>
            </div>
          ) : (
            <div className="text-center">
              <Button
                variant="outline"
                onClick={() => router.push('/pricing')}
              >
                Manage Subscription
              </Button>
            </div>
          )
        ) : (
          <div className="text-center space-y-4">
            <p className="text-sm text-muted-foreground">
              Upgrade your plan to unlock more features
            </p>
            <Button
              onClick={() => router.push('/pricing')}
            >
              Upgrade Now
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
} 