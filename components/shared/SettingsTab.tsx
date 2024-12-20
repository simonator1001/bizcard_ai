import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useSubscription } from '@/lib/hooks/useSubscription'
import { SUBSCRIPTION_PLANS } from '@/types/subscription'
import { Progress } from '@/components/ui/progress'
import { useRouter } from 'next/navigation'
import { AlertCircle, CheckCircle2, AlertTriangle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'

export function SettingsTab() {
  const { subscription, usage, loading } = useSubscription();
  const router = useRouter();

  const currentPlan = SUBSCRIPTION_PLANS.find(
    (plan) => plan.tier === (subscription?.tier || 'free')
  );

  const isExpiringSoon = subscription?.status === 'active' && 
    subscription.current_period_end && 
    new Date(subscription.current_period_end).getTime() - new Date().getTime() < 7 * 24 * 60 * 60 * 1000;

  return (
    <div className="p-8">
      <Card className="max-w-2xl mx-auto">
        <div className="p-6 space-y-6">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold">Settings</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Manage your account preferences and subscription
              </p>
            </div>
            {subscription?.status === 'active' && (
              <div className="flex items-center text-sm text-green-600">
                <CheckCircle2 className="h-4 w-4 mr-1" />
                Active
              </div>
            )}
          </div>

          {/* Subscription Status */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Subscription</h3>
            
            {isExpiringSoon && (
              <Alert variant="warning">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Your subscription will expire in {Math.ceil((new Date(subscription.current_period_end).getTime() - new Date().getTime()) / (24 * 60 * 60 * 1000))} days.
                  {subscription.cancel_at_period_end ? ' Renew now to keep your benefits.' : ''}
                </AlertDescription>
              </Alert>
            )}

            <div className="bg-muted/50 rounded-lg p-4">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h4 className="font-medium">{currentPlan?.name || 'Free'} Plan</h4>
                  {subscription?.status === 'active' && (
                    <p className="text-sm text-muted-foreground">
                      Renews on {new Date(subscription.current_period_end).toLocaleDateString()}
                    </p>
                  )}
                </div>
                <Button
                  variant={subscription?.status === 'active' ? 'outline' : 'default'}
                  onClick={() => router.push('/pricing')}
                >
                  {subscription?.status === 'active' ? 'Manage Plan' : 'Upgrade Now'}
                </Button>
              </div>

              {/* Usage Stats */}
              {currentPlan && (
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Business Card Scans</span>
                      <span>
                        {usage?.scansCount || 0} / {currentPlan.limits.scansPerMonth === Infinity ? '∞' : currentPlan.limits.scansPerMonth}
                      </span>
                    </div>
                    <Progress 
                      value={currentPlan.limits.scansPerMonth === Infinity ? 0 : ((usage?.scansCount || 0) / currentPlan.limits.scansPerMonth) * 100} 
                      className="h-2" 
                    />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Companies Tracked</span>
                      <span>
                        {usage?.companiesTracked || 0} / {currentPlan.limits.companiesTracked === Infinity ? '∞' : currentPlan.limits.companiesTracked}
                      </span>
                    </div>
                    <Progress 
                      value={currentPlan.limits.companiesTracked === Infinity ? 0 : ((usage?.companiesTracked || 0) / currentPlan.limits.companiesTracked) * 100} 
                      className="h-2" 
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          <Separator />
          
          {/* Preferences */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Preferences</h3>
            
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="darkMode">Dark Mode</Label>
                <p className="text-sm text-muted-foreground">
                  Enable dark mode for better viewing at night
                </p>
              </div>
              <Switch id="darkMode" />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="notifications">Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Receive updates about your contacts
                </p>
              </div>
              <Switch id="notifications" />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="autoScan">Auto Scan</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically process cards after upload
                </p>
              </div>
              <Switch id="autoScan" />
            </div>
          </div>

          <Separator />

          {/* Account Actions */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Account</h3>
            <Button variant="outline" className="w-full">
              Sign Out
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}

export default SettingsTab 