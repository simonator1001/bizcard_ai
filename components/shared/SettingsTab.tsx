import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useSubscription } from '@/hooks/useSubscription'
import { SUBSCRIPTION_PLANS } from '@/lib/plans'
import { Progress } from '@/components/ui/progress'
import { useRouter } from 'next/navigation'
import { AlertCircle, CheckCircle2, AlertTriangle, Loader2, Copy, Calendar, LogIn, Phone, User as UserIcon, AtSign, KeyRound, ShieldCheck, ExternalLink } from 'lucide-react'
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { motion } from 'framer-motion';

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

  // Get name and email from AppWrite user or fallback
  const name = currentUser?.name || currentUser?.email?.split('@')[0] || "";
  const email = currentUser?.email || "";
  const initials = name
    ? name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)
    : email.slice(0, 2).toUpperCase();

  // Preferences state and persistence
  const [notifications, setNotifications] = useState(false);
  const [autoScan, setAutoScan] = useState(false);

  // Load preferences from localStorage on mount
  useEffect(() => {
    setNotifications(localStorage.getItem('notifications') === 'true');
    setAutoScan(localStorage.getItem('autoScan') === 'true');
  }, []);

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

  const userId = currentUser?.$id || '';
  const createdAt = currentUser?.$createdAt ? new Date(currentUser.$createdAt) : null;
  const lastSignIn: Date | null = null; // AppWrite doesn't expose last_sign_in directly
  const phone = currentUser?.phone || '';
  const providers = ['google']; // AppWrite OAuth provider

  // Profile completeness calculation
  const profileFields = [name, email, userId, createdAt, lastSignIn];
  const completeness = Math.round((profileFields.filter(Boolean).length / profileFields.length) * 100);

  // Copy handlers
  const handleCopy = (value: string) => {
    navigator.clipboard.writeText(value);
    toast({ title: t('Copied!'), description: value });
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
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="flex flex-col items-center gap-2 mb-8"
          >
            <Avatar className="h-20 w-20 shadow-lg border-4 border-white/30 bg-gradient-to-br from-blue-200 via-purple-200 to-pink-200 dark:from-neutral-800 dark:via-neutral-900 dark:to-neutral-800">
              <AvatarImage src={currentUser?.prefs?.avatar_url || undefined} alt={name} />
              <AvatarFallback className="text-3xl font-bold bg-primary/10 text-primary">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="text-center">
              <div className="text-xl font-bold text-foreground flex items-center justify-center gap-2">
                <UserIcon className="inline-block h-5 w-5 text-blue-500" />
                {name}
              </div>
              <div className="text-sm text-muted-foreground flex items-center justify-center gap-2">
                <AtSign className="inline-block h-4 w-4 text-purple-500" />
                {email}
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button onClick={() => handleCopy(email)} aria-label="Copy email"><Copy className="h-4 w-4 ml-1 hover:text-blue-600 transition" /></button>
                    </TooltipTrigger>
                    <TooltipContent>Copy Email</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
          </motion.div>

          {/* Account Details Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6, ease: 'easeOut' }}
            className="mb-8 w-full"
          >
            <div className="backdrop-blur-xl bg-white/60 dark:bg-neutral-900/60 rounded-2xl shadow-lg border border-white/20 p-6 flex flex-col gap-4">
              <div className="flex flex-wrap gap-4 items-center justify-between">
                <div className="flex items-center gap-2 text-sm">
                  <KeyRound className="h-4 w-4 text-pink-500" />
                  <span className="font-mono">{userId.slice(0, 8)}...{userId.slice(-4)}</span>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button onClick={() => handleCopy(userId)} aria-label="Copy user ID"><Copy className="h-4 w-4 ml-1 hover:text-blue-600 transition" /></button>
                      </TooltipTrigger>
                      <TooltipContent>Copy User ID</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                {phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-green-500" />
                    <span>{phone}</span>
                  </div>
                )}
                {createdAt && (
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-blue-400" />
                    <span>Joined {createdAt.toLocaleDateString()}</span>
                  </div>
                )}
                {lastSignIn && (
                  <div className="flex items-center gap-2 text-sm">
                    <LogIn className="h-4 w-4 text-purple-400" />
                    <span>Welcome!</span>
                  </div>
                )}
                {providers.length > 0 && (
                  <div className="flex items-center gap-2 text-sm">
                    <ShieldCheck className="h-4 w-4 text-yellow-500" />
                    <span>Provider: {providers.join(', ')}</span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-xs text-muted-foreground">Profile completeness</span>
                <Progress value={completeness} className="h-2 rounded-full w-40" />
                <span className="text-xs font-bold text-blue-600">{completeness}%</span>
              </div>
              <Button variant="outline" className="w-fit mt-2" onClick={() => toast({ title: 'Coming soon', description: 'Profile editing coming soon!' })}>
                <ExternalLink className="h-4 w-4 mr-1" /> Manage Profile
              </Button>
            </div>
          </motion.div>

          {/* Unified Info Panels */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6, ease: 'easeOut' }}
            className="mb-8 w-full"
          >
            <div className="backdrop-blur-xl bg-gradient-to-br from-white/70 via-blue-50/60 to-purple-100/60 dark:from-neutral-900/70 dark:via-neutral-950/60 dark:to-neutral-900/60 rounded-2xl shadow-lg border border-white/20 p-6 flex flex-col gap-8">
              {/* Subscription Section */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <h2 className="text-2xl font-extrabold tracking-tight text-blue-700 dark:text-blue-300">{t('settings.subscription')}</h2>
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
                <div className="bg-gradient-to-br from-blue-100/60 via-white/60 to-purple-100/60 dark:from-neutral-800/60 dark:via-neutral-900/60 dark:to-neutral-800/60 rounded-xl p-6 shadow-sm border border-white/10">
                  <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 gap-4">
                    <div>
                      <h4 className="font-semibold capitalize text-lg text-purple-700 dark:text-purple-300">{subscriptionTier} Plan</h4>
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

              {/* Account Actions Section */}
              <div>
                <h2 className="text-2xl font-extrabold tracking-tight mb-4 text-blue-700 dark:text-blue-300">{t('account.title')}</h2>
                <Button variant="destructive" className="w-full py-3 text-lg font-bold" onClick={signOut}>
                  {t('account.signOut')}
                </Button>
              </div>
            </div>
          </motion.div>
        </GradientBorderCard>
      </div>
    </div>
  );
}

export default SettingsTab 