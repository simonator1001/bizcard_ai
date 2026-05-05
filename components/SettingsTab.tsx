import { useSubscription } from '@/hooks/useSubscription';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Mail } from 'lucide-react';

const SUPPORT_EMAIL = 'support@bizcardai.agentmail.to';

export function SettingsTab() {
  const { subscription, usage, plan, loading, error } = useSubscription();

  if (error) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="text-red-500">Error loading subscription data</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardContent className="p-6">
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold mb-2">Subscription Details</h3>
            {loading ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-[200px]" />
                <Skeleton className="h-4 w-[150px]" />
              </div>
            ) : (
              <>
                <p className="text-sm text-gray-600">
                  Plan: <span className="font-medium">{plan.name}</span>
                </p>
                {subscription?.currentPeriodEnd && (
                  <p className="text-sm text-gray-600">
                    Expires: <span className="font-medium">
                      {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                    </span>
                  </p>
                )}
              </>
            )}
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">Usage Statistics</h3>
            {loading ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-[180px]" />
                <Skeleton className="h-4 w-[160px]" />
                <Skeleton className="h-4 w-[200px]" />
              </div>
            ) : usage && (
              <>
                <p className="text-sm text-gray-600">
                  Total Cards Scanned: <span className="font-medium">{usage.totalCards}</span>
                </p>
                <p className="text-sm text-gray-600">
                  Companies Tracked: <span className="font-medium">{usage.companiesTracked}</span>
                </p>
                <p className="text-sm text-gray-600">
                  Remaining Scans This Month: <span className="font-medium">{usage.remainingScans}</span>
                </p>
              </>
            )}
          </div>

          {/* Customer Support */}
          <div className="pt-4 mt-4 border-t border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold mb-2">Need Help?</h3>
            <a
              href={`mailto:${SUPPORT_EMAIL}`}
              className="inline-flex items-center gap-2 text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
            >
              <Mail className="w-4 h-4" />
              {SUPPORT_EMAIL}
            </a>
            <p className="text-xs text-muted-foreground mt-1">
              We typically respond within 24 hours.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 