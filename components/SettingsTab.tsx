import { useSubscription } from '@/hooks/useSubscription';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

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
        </div>
      </CardContent>
    </Card>
  );
} 