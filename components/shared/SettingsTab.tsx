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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { GradientBorderCard } from "@/components/ui/gradient-border-card";
import { useUser } from "@/hooks/useUser";
import React, { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { toast } from '@/components/ui/use-toast';

export function SettingsTab() {
  const { subscription, usage, plan, loading, error, isPro } = useSubscription();
  const router = useRouter();
  const { t } = useTranslation();
  const { signOut } = useAuth();
  const { user: currentUser } = useUser();
  const { theme, setTheme, resolvedTheme } = useTheme();

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

  // Get name and email from user_metadata or fallback
  const name = currentUser?.user_metadata?.name || currentUser?.user_metadata?.full_name || currentUser?.email || "";
  const email = currentUser?.email || "";
  const initials = name
    ? name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)
    : email.slice(0, 2).toUpperCase();

  // Preferences state and persistence
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(false);
  const [autoScan, setAutoScan] = useState(false);

  // Load preferences from localStorage and theme context on mount
  useEffect(() => {
    setDarkMode((resolvedTheme === 'dark') || localStorage.getItem('darkMode') === 'true');
    setNotifications(localStorage.getItem('notifications') === 'true');
    setAutoScan(localStorage.getItem('autoScan') === 'true');
  }, [resolvedTheme]);

  // Persist dark mode and update theme
  useEffect(() => {
    localStorage.setItem('darkMode', darkMode.toString());
    setTheme(darkMode ? 'dark' : 'light');
  }, [darkMode, setTheme]);

  // Persist notifications and autoScan
  useEffect(() => {
    localStorage.setItem('notifications', notifications.toString());
  }, [notifications]);
  useEffect(() => {
    localStorage.setItem('autoScan', autoScan.toString());
  }, [autoScan]);

  // Handlers for toggles with toast feedback
  const handleNotificationsChange = (checked: boolean) => {
    setNotifications(checked);
    toast({
      title: checked ? t('settings.notifications') + ' ON' : t('settings.notifications') + ' OFF',
      description: checked ? t('settings.notificationsDescription') : t('settings.notificationsDescription'),
    });
  };
  const handleAutoScanChange = (checked: boolean) => {
    setAutoScan(checked);
    toast({
      title: checked ? t('settings.autoScan') + ' ON' : t('settings.autoScan') + ' OFF',
      description: checked ? t('settings.autoScanDescription') : t('settings.autoScanDescription'),
    });
  };

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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-100 dark:from-neutral-900 dark:via-neutral-950 dark:to-neutral-900 py-12">
      <div className="max-w-2xl mx-auto">
        <GradientBorderCard className="shadow-2xl">
          {/* User Avatar Section */}
          <div className="flex flex-col items-center gap-2 mb-8">
            <Avatar className="h-20 w-20 shadow-lg">
              <AvatarImage src={currentUser?.user_metadata?.avatar_url || undefined} alt={name} />
              <AvatarFallback className="text-3xl font-bold bg-primary/10 text-primary">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="text-center">
              <div className="text-xl font-bold text-foreground">{name}</div>
              <div className="text-sm text-muted-foreground">{email}</div>
            </div>
          </div>

          {/* Subscription Section */}
          <div className="space-y-6 mb-10">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-2xl font-extrabold tracking-tight">{t('settings.subscription')}</h2>
              {subscriptionStatus === 'active' && (
                <div className="flex items-center text-base text-green-600 font-semibold">
                  <CheckCircle2 className="h-5 w-5 mr-1" />
                  {t('subscription.currentPlan')}
                </div>
              )}
            </div>
            {isExpiringSoon && (
              <Alert variant="warning" className="mb-4">
                <AlertTriangle className="h-5 w-5" />
                <AlertDescription>
                  {t('subscription.subscriptionEnding')} {subscription?.currentPeriodEnd && new Date(subscription.currentPeriodEnd).toLocaleDateString()}.
                  {subscription?.cancelAtPeriodEnd && t('subscription.renewSubscription')}
                </AlertDescription>
              </Alert>
            )}
            <div className="bg-muted/40 rounded-xl p-6 shadow-sm">
              <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 gap-4">
                <div>
                  <h4 className="font-semibold capitalize text-lg">{subscriptionTier} Plan</h4>
                  {subscriptionStatus === 'active' && subscription?.currentPeriodEnd && (
                    <p className="text-sm text-muted-foreground">
                      {t('subscription.renewsOn')} {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                    </p>
                  )}
                </div>
                <Button
                  variant={subscriptionStatus === 'active' ? 'outline' : 'default'}
                  onClick={() => router.push('/pricing')}
                  className="font-semibold px-6 py-2"
                >
                  {subscriptionStatus === 'active' ? t('subscription.manageSubscription') : t('subscription.upgradeNow')}
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="flex justify-between text-base mb-2 font-medium">
                    <span>{t('subscription.businessCardScans')}</span>
                    <span>{scansDisplay}</span>
                  </div>
                  <Progress value={scansProgress} className="h-3 rounded-full" />
                </div>
                <div>
                  <div className="flex justify-between text-base mb-2 font-medium">
                    <span>{t('subscription.companiesTracked')}</span>
                    <span>{companiesDisplay}</span>
                  </div>
                  <Progress value={companiesProgress} className="h-3 rounded-full" />
                </div>
              </div>
            </div>
          </div>

          <Separator className="my-8" />

          {/* Preferences Section */}
          <div className="space-y-8 mb-10">
            <h2 className="text-2xl font-extrabold tracking-tight mb-4">{t('settings.preferences')}</h2>
            <div className="space-y-6">
              <LanguageSelector />
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="darkMode" className="text-base font-semibold">{t('settings.darkMode')}</Label>
                  <p className="text-sm text-muted-foreground">
                    {t('settings.darkModeDescription')}
                  </p>
                </div>
                <Switch id="darkMode" checked={darkMode} onCheckedChange={setDarkMode} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="notifications" className="text-base font-semibold">{t('settings.notifications')}</Label>
                  <p className="text-sm text-muted-foreground">
                    {t('settings.notificationsDescription')}
                  </p>
                </div>
                <Switch id="notifications" checked={notifications} onCheckedChange={handleNotificationsChange} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="autoScan" className="text-base font-semibold">{t('settings.autoScan')}</Label>
                  <p className="text-sm text-muted-foreground">
                    {t('settings.autoScanDescription')}
                  </p>
                </div>
                <Switch id="autoScan" checked={autoScan} onCheckedChange={handleAutoScanChange} />
              </div>
            </div>
          </div>

          <Separator className="my-8" />

          {/* Account Actions Section */}
          <div className="space-y-6">
            <h2 className="text-2xl font-extrabold tracking-tight mb-4">{t('account.title')}</h2>
            <Button variant="destructive" className="w-full py-3 text-lg font-bold" onClick={signOut}>
              {t('account.signOut')}
            </Button>
          </div>
        </GradientBorderCard>
      </div>
    </div>
  );
}

export default SettingsTab 