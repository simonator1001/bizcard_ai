import { useSubscription } from '@/lib/hooks/useSubscription';
import { SUBSCRIPTION_PLANS } from '@/types/subscription';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface UpgradePromptProps {
  type: 'scan_limit' | 'company_limit' | 'feature_locked';
  feature?: string;
  onClose?: () => void;
}

export function UpgradePrompt({ type, feature, onClose }: UpgradePromptProps) {
  const [open, setOpen] = useState(true);
  const { subscription } = useSubscription();
  const router = useRouter();

  const currentPlan = SUBSCRIPTION_PLANS.find(
    (plan) => plan.tier === (subscription?.tier || 'free')
  );

  const nextPlan = SUBSCRIPTION_PLANS.find(
    (plan) => plan.tier !== 'enterprise' && plan.tier !== currentPlan?.tier
  );

  const handleClose = () => {
    setOpen(false);
    onClose?.();
  };

  const handleUpgrade = () => {
    router.push('/pricing');
    handleClose();
  };

  let title = '';
  let description = '';

  switch (type) {
    case 'scan_limit':
      title = 'Scan Limit Reached';
      description = `You've reached your monthly scan limit of ${currentPlan?.limits.scansPerMonth} cards. Upgrade to ${nextPlan?.name} to scan ${nextPlan?.limits.scansPerMonth === Infinity ? 'unlimited' : nextPlan?.limits.scansPerMonth} cards per month.`;
      break;
    case 'company_limit':
      title = 'Company Tracking Limit Reached';
      description = `You're tracking the maximum number of companies (${currentPlan?.limits.companiesTracked}) allowed in your plan. Upgrade to ${nextPlan?.name} to track up to ${nextPlan?.limits.companiesTracked === Infinity ? 'unlimited' : nextPlan?.limits.companiesTracked} companies.`;
      break;
    case 'feature_locked':
      title = 'Premium Feature';
      description = `${feature} is available in the ${nextPlan?.name} plan and above. Upgrade now to unlock this feature and many more!`;
      break;
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription className="pt-2">
            {description}
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-end space-x-4 mt-6">
          <Button variant="outline" onClick={handleClose}>
            Maybe Later
          </Button>
          <Button onClick={handleUpgrade}>
            Upgrade Now
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
} 