import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { useSubscription } from "@/hooks/useSubscription"
import { SUBSCRIPTION_PLANS } from "@/lib/plans"
import { useTranslation } from "react-i18next"
import { AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

export function FreeUsageCounter() {
  const { subscription, usage, loading } = useSubscription();
  const router = useRouter();
  const { t } = useTranslation();

  if (loading || subscription?.tier !== 'free') return null;

  const freePlan = SUBSCRIPTION_PLANS['free'];
  if (!freePlan) return null;

  const scansUsed = usage?.scansCount || 0;
  const scansLimit = freePlan.limits.scansPerMonth;
  const scansRemaining = Math.max(0, scansLimit - scansUsed);
  const scansPercentage = Math.min(100, (scansUsed / scansLimit) * 100);

  const companiesTracked = usage?.companiesTracked || 0;
  const companiesLimit = freePlan.limits.companiesTracked;
  const companiesRemaining = Math.max(0, companiesLimit - companiesTracked);
  const companiesPercentage = Math.min(100, (companiesTracked / companiesLimit) * 100);

  const isNearLimit = scansPercentage >= 80 || companiesPercentage >= 80;

  return (
    <Card className="mb-6">
      <div className="p-6">
        <div className="space-y-6">
          <div>
            <div className="flex justify-between mb-2">
              <h3 className="text-sm font-medium">{t('subscription.scansThisMonth')}</h3>
              <span className="text-sm text-muted-foreground">{scansUsed}/{scansLimit}</span>
            </div>
            <Progress value={scansPercentage} className="h-2" />
            <p className="mt-2 text-sm text-muted-foreground">
              {t('subscription.remainingScans', { count: scansRemaining })}
            </p>
          </div>

          <div>
            <div className="flex justify-between mb-2">
              <h3 className="text-sm font-medium">{t('subscription.companiesTracked')}</h3>
              <span className="text-sm text-muted-foreground">{companiesTracked}/{companiesLimit}</span>
            </div>
            <Progress value={companiesPercentage} className="h-2" />
            <p className="mt-2 text-sm text-muted-foreground">
              {t('subscription.remainingCompanies', { count: companiesRemaining })}
            </p>
          </div>

          {isNearLimit && (
            <Alert variant="warning" className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {t('subscription.nearLimit')}
              </AlertDescription>
            </Alert>
          )}

          <Button
            className="w-full"
            onClick={() => router.push('/pro')}
          >
            {t('subscription.upgradeToPro')}
          </Button>
        </div>
      </div>
    </Card>
  );
} 