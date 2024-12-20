import { useSubscription } from '@/lib/hooks/useSubscription';
import { SUBSCRIPTION_PLANS } from '@/types/subscription';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { CheckCircle2, Star, Zap, Lock } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface UpgradePromptProps {
  type: 'scan_limit' | 'company_limit' | 'feature_locked';
  feature?: string;
  onClose?: () => void;
}

export function UpgradePrompt({ type, feature, onClose }: UpgradePromptProps) {
  const [open, setOpen] = useState(true);
  const [showFeatures, setShowFeatures] = useState(false);
  const { subscription } = useSubscription();
  const router = useRouter();

  const currentPlan = SUBSCRIPTION_PLANS.find(
    (plan) => plan.tier === (subscription?.tier || 'free')
  );

  const proPlan = SUBSCRIPTION_PLANS.find(
    (plan) => plan.tier === 'pro'
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
  let ctaText = 'Upgrade Now';

  switch (type) {
    case 'scan_limit':
      title = '🔄 Scan Limit Reached';
      description = `You've reached your monthly scan limit of ${currentPlan?.limits.scansPerMonth} cards. Upgrade to ${proPlan?.name} to scan ${proPlan?.limits.scansPerMonth === Infinity ? 'unlimited' : proPlan?.limits.scansPerMonth} cards per month.`;
      ctaText = 'Unlock Unlimited Scans';
      break;
    case 'company_limit':
      title = '🏢 Company Tracking Limit Reached';
      description = `You're tracking the maximum number of companies (${currentPlan?.limits.companiesTracked}) allowed in your plan. Upgrade to ${proPlan?.name} to track up to ${proPlan?.limits.companiesTracked === Infinity ? 'unlimited' : proPlan?.limits.companiesTracked} companies.`;
      ctaText = 'Track More Companies';
      break;
    case 'feature_locked':
      title = '⭐️ Premium Feature';
      description = `${feature} is available in the ${proPlan?.name} plan and above. Upgrade now to unlock this feature and many more!`;
      ctaText = `Unlock ${feature}`;
      break;
  }

  const proFeatures = [
    { icon: Zap, text: 'Unlimited Business Card Scans' },
    { icon: Star, text: 'Advanced OCR with Higher Accuracy' },
    { icon: CheckCircle2, text: 'Track Unlimited Companies' },
    { icon: Lock, text: 'Access to News Feed & Insights' },
  ];

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-2xl">{title}</DialogTitle>
          <DialogDescription className="pt-2 text-base">
            {description}
          </DialogDescription>
        </DialogHeader>

        {showFeatures ? (
          <div className="py-4 space-y-4">
            <h4 className="font-medium text-center mb-4">Pro Plan Features</h4>
            <div className="grid gap-4">
              {proFeatures.map((feature, index) => (
                <Card key={index} className="p-4 flex items-center space-x-4">
                  <feature.icon className="h-5 w-5 text-primary" />
                  <span className="text-sm">{feature.text}</span>
                </Card>
              ))}
            </div>
          </div>
        ) : (
          <div className="py-4">
            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">
                Join 1000+ professionals who upgraded to Pro
              </p>
              <p className="text-sm font-medium text-primary">
                Special Offer: Save 20% with Annual Billing
              </p>
            </div>
          </div>
        )}

        <DialogFooter className="flex flex-col space-y-3 sm:space-y-0">
          <div className="flex flex-col gap-3 w-full">
            <Button 
              onClick={handleUpgrade}
              className="w-full h-12 text-base font-medium px-8"
              variant="default"
            >
              {ctaText}
            </Button>
            <div className="flex justify-between w-full gap-3">
              <Button
                variant="outline"
                onClick={() => setShowFeatures(!showFeatures)}
                className="flex-1 h-11"
              >
                See All Features
              </Button>
              <Button 
                variant="outline" 
                onClick={handleClose}
                className="flex-1 h-11"
              >
                Maybe Later
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 