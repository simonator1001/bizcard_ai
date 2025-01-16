'use client';

import { Logo } from './logo';
import { Button } from './button';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useUser } from '@/lib/hooks/useUser';
import { useTranslation } from 'react-i18next';
import { useSubscription } from '@/hooks/useSubscription';

const navigationItems = [
  {
    label: 'Dashboard',
    href: '/dashboard',
  },
  {
    label: 'Scan',
    href: '/scan',
  },
  {
    label: 'Manage',
    href: '/manage',
  },
  {
    label: 'News',
    href: '/news',
  },
  {
    label: 'Org Chart',
    href: '/org-chart',
  },
];

export function Navigation() {
  const pathname = usePathname();
  const { user } = useUser();
  const { subscription } = useSubscription();

  return (
    <nav className="border-b">
      <div className="flex h-16 items-center px-4">
        <Link href="/" className="mr-6">
          <Logo size="sm" />
        </Link>
        
        <div className="hidden md:flex items-center space-x-6 lg:space-x-8">
          {navigationItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'text-sm font-medium transition-colors hover:text-primary',
                pathname === item.href
                  ? 'text-foreground'
                  : 'text-muted-foreground'
              )}
            >
              {item.label}
            </Link>
          ))}
        </div>

        <div className="ml-auto flex items-center space-x-4">
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
    </nav>
  );
} 