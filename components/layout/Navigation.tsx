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
    <header className="w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 z-50">
      <nav className="container mx-auto flex items-center justify-between py-3 px-4">
        {/* Left: Logo */}
        <div className="flex items-center gap-2">
          {/* Replace with your logo/icon */}
          <span className="inline-flex items-center gap-2 font-bold text-lg">
            <span className="bg-gradient-to-tr from-primary to-secondary rounded-full w-7 h-7 flex items-center justify-center text-white font-bold">S</span>
            Simon.AI
          </span>
        </div>
        {/* Center: Navigation Links */}
        <div className="hidden md:flex items-center gap-6 text-base font-medium text-foreground">
          <div className="relative group">
            <button className="flex items-center gap-1 hover:text-primary transition-colors">Launch Pad <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg></button>
            {/* Dropdown can go here if needed */}
          </div>
          <div className="relative group">
            <button className="flex items-center gap-1 hover:text-primary transition-colors">Community <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg></button>
            {/* Dropdown can go here if needed */}
          </div>
        </div>
        {/* Right: Auth Actions */}
        <div className="flex items-center gap-3">
          <button className="text-base font-medium text-foreground hover:text-primary transition-colors">Log In</button>
          <button className="px-5 py-2 rounded-full bg-foreground text-white font-semibold shadow hover:bg-primary transition-colors">Sign In</button>
        </div>
      </nav>
    </header>
  );
} 