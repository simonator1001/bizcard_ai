import { useSubscription } from '@/lib/hooks/useSubscription';
import { SUBSCRIPTION_PLANS } from '@/types/subscription';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export function FreeUsageCounter() {
  const { subscription, usage, loading } = useSubscription();
  const router = useRouter();

  if (loading || subscription?.tier !== 'free') return null;

  const freePlan = SUBSCRIPTION_PLANS.find(plan => plan.tier === 'free');
  if (!freePlan) return null;

  const scansUsed = usage?.scansCount || 0;
  const scansLimit = freePlan.limits.scansPerMonth;
  const scansPercentage = (scansUsed / scansLimit) * 100;
  const scansRemaining = scansLimit - scansUsed;

  const companiesTracked = usage?.companiesTracked || 0;
  const companiesLimit = freePlan.limits.companiesTracked;
  const companiesPercentage = (companiesTracked / companiesLimit) * 100;
  const companiesRemaining = companiesLimit - companiesTracked;

  const isNearLimit = scansPercentage >= 80 || companiesPercentage >= 80;

  return (
    <Card className="mb-6">
      <div className="p-4 space-y-4">
        {isNearLimit && (
          <Alert variant="warning" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              You're approaching your free plan limits. Upgrade to Pro for unlimited access!
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span>Free Scans Remaining</span>
              <span className="font-medium">
                {scansRemaining} of {scansLimit} left
              </span>
            </div>
            <Progress value={scansPercentage} className="h-2" />
          </div>

          <div>
            <div className="flex justify-between text-sm mb-2">
              <span>Companies You Can Track</span>
              <span className="font-medium">
                {companiesRemaining} of {companiesLimit} left
              </span>
            </div>
            <Progress value={companiesPercentage} className="h-2" />
          </div>
        </div>

        {(scansPercentage >= 60 || companiesPercentage >= 60) && (
          <div className="pt-3">
            <Button 
              onClick={() => router.push('/pricing')}
              className="w-full"
              variant={isNearLimit ? "default" : "outline"}
            >
              Upgrade to Pro
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
} 