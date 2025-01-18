'use client';

import { Logo } from './logo';
import { Button } from './button';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useUser } from '@/lib/hooks/useUser';
import { useTranslation } from 'react-i18next';
import { useSubscription } from '@/hooks/useSubscription';
import { ExpandableTabs } from './expandable-tabs';
import { 
  ScanLine, 
  LayoutGrid, 
  Network, 
  Newspaper, 
  Settings, 
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

  const handleNavigationChange = (index: number | null) => {
    if (index === null) return;
    const item = navigationItems[index];
    if (!item.type && item.title) {
      router.push(`/${item.title.toLowerCase()}`);
    }
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
                  <Link href="/pricing">
                    <Button variant="outline" size="sm">
                      Upgrade
                    </Button>
                  </Link>
                )}
                <Link href="/settings">
                  <Button variant="ghost" size="sm">
                    Settings
                  </Button>
                </Link>
              </>
            ) : (
              <>
                <Link href="/signin">
                  <Button variant="ghost" size="sm">
                    Sign In
                  </Button>
                </Link>
                <Link href="/signup">
                  <Button size="sm">Sign Up</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
} 