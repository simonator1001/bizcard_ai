import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useSubscription } from '@/hooks/useSubscription'
import { SUBSCRIPTION_PLANS } from '@/lib/plans'
import { Progress } from '@/components/ui/progress'
import { useRouter } from 'next/navigation'
import { AlertCircle, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { LanguageSelector } from './LanguageSelector'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/lib/auth-context'
import { Skeleton } from "@/components/ui/skeleton"

export function SettingsTab() {
  const { subscription, usage, plan, loading, error, isPro } = useSubscription();
  const router = useRouter();
  const { t } = useTranslation();
  const { signOut } = useAuth();

  // Debug log subscription data
  console.debug('[SettingsTab] Subscription data:', {
    subscription,
    usage,
    plan,
    loading,
    error,
    isPro
  });

  const isExpiringSoon = subscription?.status === 'active' && 
    subscription.currentPeriodEnd && 
    new Date(subscription.currentPeriodEnd).getTime() - new Date().getTime() < 7 * 24 * 60 * 60 * 1000;

  // Use the actual usage data from the subscription service
  const usageData = usage || {
    scansCount: 0,
    companiesTracked: 0,
    totalCards: 0,
    remainingScans: plan?.limits.scansPerMonth || 5
  };

  // Debug log usage data
  console.debug('[SettingsTab] Usage data:', usageData);

  if (loading) {
    return (
      <div className="p-8">
        <Card className="max-w-2xl mx-auto">
          <div className="p-6 space-y-6">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-bold">{t('navigation.settings')}</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {t('settings.description')}
                </p>
              </div>
            </div>
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">{t('settings.subscription')}</h3>
              <div className="bg-muted/50 rounded-lg p-4">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <Skeleton className="h-6 w-24" />
                    <Skeleton className="h-4 w-32 mt-1" />
                  </div>
                  <Skeleton className="h-10 w-32" />
                </div>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <Skeleton className="h-4 w-48" />
                      <Skeleton className="h-4 w-16" />
                    </div>
                    <Skeleton className="h-2 w-full" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <Skeleton className="h-4 w-48" />
                      <Skeleton className="h-4 w-16" />
                    </div>
                    <Skeleton className="h-2 w-full" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  if (error) {
    console.error('[SettingsTab] Error:', error);
    return (
      <div className="p-8">
        <Card className="max-w-2xl mx-auto">
          <div className="p-6">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {error.message || 'An error occurred while loading subscription data'}
              </AlertDescription>
            </Alert>
          </div>
        </Card>
      </div>
    );
  }

  // Use actual subscription data
  const currentPlan = plan || SUBSCRIPTION_PLANS.free;
  const subscriptionTier = subscription?.tier?.toLowerCase() || 'free';
  const subscriptionStatus = subscription?.status || 'inactive';

  // Debug log resolved data
  console.debug('[SettingsTab] Resolved data:', {
    currentPlan,
    subscriptionTier,
    subscriptionStatus,
    isExpiringSoon,
    isPro
  });

  // Calculate display values based on actual subscription
  const scansDisplay = isPro ? '∞' : `${usageData.remainingScans} / ${currentPlan.limits.scansPerMonth}`;
  const companiesDisplay = isPro ? '∞' : `${usageData.companiesTracked} / ${currentPlan.limits.companiesTracked}`;
  const scansProgress = isPro ? 100 : ((currentPlan.limits.scansPerMonth - usageData.remainingScans) / currentPlan.limits.scansPerMonth) * 100;
  const companiesProgress = isPro ? 100 : (usageData.companiesTracked / currentPlan.limits.companiesTracked) * 100;

  return (
    <div className="p-8">
      <Card className="max-w-2xl mx-auto">
        <div className="p-6 space-y-6">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold">{t('navigation.settings')}</h2>
              <p className="text-sm text-muted-foreground mt-1">
                {t('settings.description')}
              </p>
            </div>
            {subscriptionStatus === 'active' && (
              <div className="flex items-center text-sm text-green-600">
                <CheckCircle2 className="h-4 w-4 mr-1" />
                {t('subscription.currentPlan')}
              </div>
            )}
          </div>

          {/* Subscription Status */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">{t('settings.subscription')}</h3>
            
            {isExpiringSoon && (
              <Alert variant="warning">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  {t('subscription.subscriptionEnding')} {subscription?.currentPeriodEnd && new Date(subscription.currentPeriodEnd).toLocaleDateString()}.
                  {subscription?.cancelAtPeriodEnd && t('subscription.renewSubscription')}
                </AlertDescription>
              </Alert>
            )}

            <div className="bg-muted/50 rounded-lg p-4">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h4 className="font-medium capitalize">
                    {subscriptionTier} Plan
                  </h4>
                  {subscriptionStatus === 'active' && subscription?.currentPeriodEnd && (
                    <p className="text-sm text-muted-foreground">
                      {t('subscription.renewsOn')} {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                    </p>
                  )}
                </div>
                <Button
                  variant={subscriptionStatus === 'active' ? 'outline' : 'default'}
                  onClick={() => {
                    // After viewing pricing, ensure we return to the settings tab
                    const returnUrl = encodeURIComponent('/?tab=settings');
                    router.push(`/pricing?return=${returnUrl}`);
                  }}
                >
                  {subscriptionStatus === 'active' ? t('subscription.manageSubscription') : t('subscription.upgradeNow')}
                </Button>
              </div>

              {/* Usage Stats */}
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>{t('subscription.businessCardScans')}</span>
                    <span>{scansDisplay}</span>
                  </div>
                  <Progress 
                    value={scansProgress}
                    className="h-2" 
                  />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>{t('subscription.companiesTracked')}</span>
                    <span>{companiesDisplay}</span>
                  </div>
                  <Progress 
                    value={companiesProgress}
                    className="h-2" 
                  />
                </div>
              </div>
            </div>
          </div>

          <Separator />
          
          {/* Preferences */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">{t('settings.preferences')}</h3>
            
            <LanguageSelector />

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="darkMode">{t('settings.darkMode')}</Label>
                <p className="text-sm text-muted-foreground">
                  {t('settings.darkModeDescription')}
                </p>
              </div>
              <Switch id="darkMode" />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="notifications">{t('settings.notifications')}</Label>
                <p className="text-sm text-muted-foreground">
                  {t('settings.notificationsDescription')}
                </p>
              </div>
              <Switch id="notifications" />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="autoScan">{t('settings.autoScan')}</Label>
                <p className="text-sm text-muted-foreground">
                  {t('settings.autoScanDescription')}
                </p>
              </div>
              <Switch id="autoScan" />
            </div>
          </div>

          <Separator />

          {/* Account Actions */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">{t('account.title')}</h3>
            <Button variant="outline" className="w-full" onClick={signOut}>
              {t('account.signOut')}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

export default SettingsTab 