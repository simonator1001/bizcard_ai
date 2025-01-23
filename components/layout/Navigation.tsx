"use client";

import { Logo } from '@/components/ui/logo';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useUser } from '@/lib/hooks/useUser';
import { useTranslation } from 'react-i18next';
import { useSubscription } from '@/hooks/useSubscription';
import { ExpandableTabs } from '@/components/ui/expandable-tabs';
import { 
  ScanLine, 
  LayoutGrid, 
  Network, 
  Newspaper, 
  Settings,
  DollarSign,
  type LucideIcon 
} from 'lucide-react';

type NavigationItem = {
  title: string;
  icon: LucideIcon;
  type?: never;
} | {
  type: "separator";
  title?: never;
  icon?: never;
};

const navigationItems: NavigationItem[] = [
  { title: "Scan", icon: ScanLine },
  { title: "Manage", icon: LayoutGrid },
  { type: "separator" },
  { title: "Network", icon: Network },
  { title: "News", icon: Newspaper },
  { title: "Settings", icon: Settings },
];

export function Navigation() {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useUser();
  const { subscription } = useSubscription();
  const { t } = useTranslation();

  // Get the current tab from URL or pathname
  const getCurrentTab = () => {
    const searchParams = new URLSearchParams(window.location.search);
    const tabFromQuery = searchParams.get('tab');
    if (tabFromQuery) return tabFromQuery;
    
    // If no query parameter, try to get from pathname
    if (!pathname) return 'scan';
    const path = pathname.split('/')[1];
    return path || 'scan';
  };

  const handleNavigationChange = (index: number | null) => {
    if (index === null) return;
    const item = navigationItems[index];
    if (!item.type && item.title) {
      const tab = item.title.toLowerCase();
      router.push(`/?tab=${tab}`);
    }
  };

  const handleUpgradeClick = () => {
    const currentTab = getCurrentTab();
    const returnUrl = encodeURIComponent(`/?tab=${currentTab}`);
    router.push(`/pricing?return=${returnUrl}`);
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center px-4">
        <Link href="/" className="mr-6">
          <Logo size="sm" />
        </Link>
        
        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <ExpandableTabs
            tabs={navigationItems}
            activeColor="text-primary"
            onChange={handleNavigationChange}
            className="mr-4"
          />

          <div className="flex items-center space-x-4">
            {user ? (
              <>
                {subscription?.tier !== 'enterprise' && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex items-center gap-2"
                    onClick={handleUpgradeClick}
                  >
                    <DollarSign className="w-4 h-4" />
                    {t('subscription.upgradeNow')}
                  </Button>
                )}
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => router.push('/?tab=settings')}
                >
                  {t('navigation.settings')}
                </Button>
              </>
            ) : (
              <>
                <Link href="/signin">
                  <Button variant="ghost" size="sm">
                    {t('auth.signIn')}
                  </Button>
                </Link>
                <Link href="/signup">
                  <Button size="sm">{t('auth.signUp')}</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
} 