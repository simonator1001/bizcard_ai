'use client';

import { useSubscription } from '@/lib/hooks/useSubscription';
import { cn } from '@/lib/utils';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const sizes = {
  sm: { width: 32, height: 32 },
  md: { width: 48, height: 48 },
  lg: { width: 64, height: 64 },
};

export function Logo({ className, size = 'md' }: LogoProps) {
  const { subscription } = useSubscription();
  const dimensions = sizes[size];

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="relative" style={dimensions}>
        <svg
          width={dimensions.width}
          height={dimensions.height}
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="dark:invert"
        >
          {/* Card background */}
          <rect x="4" y="8" width="24" height="16" rx="2" fill="currentColor"/>
          
          {/* Card details lines */}
          <rect x="8" y="12" width="12" height="1.5" rx="0.75" fill="white"/>
          <rect x="8" y="15" width="16" height="1.5" rx="0.75" fill="white"/>
          <rect x="8" y="18" width="8" height="1.5" rx="0.75" fill="white"/>
          
          {/* Scan lines */}
          <path d="M2 10V6C2 3.79086 3.79086 2 6 2H10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          <path d="M22 2H26C28.2091 2 30 3.79086 30 6V10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          <path d="M30 22V26C30 28.2091 28.2091 30 26 30H22" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          <path d="M10 30H6C3.79086 30 2 28.2091 2 26V22" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      </div>
      <span className="font-bold text-xl hidden sm:inline-block">BizCard</span>
    </div>
  );
} 