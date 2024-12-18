import { useSubscription } from '@/lib/hooks/useSubscription';
import Image from 'next/image';
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

  // For enterprise users with custom branding
  if (subscription?.tier === 'enterprise') {
    // You would typically store the custom logo URL in the subscription details
    // or in a separate branding table
    const customLogo = subscription?.customBranding?.logoUrl;
    if (customLogo) {
      return (
        <Image
          src={customLogo}
          alt="Company Logo"
          width={dimensions.width}
          height={dimensions.height}
          className={cn('object-contain', className)}
        />
      );
    }
  }

  // Default BizCard logo
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="relative" style={dimensions}>
        <Image
          src="/logo.png" // Make sure to add your logo file to the public directory
          alt="BizCard Logo"
          width={dimensions.width}
          height={dimensions.height}
          className="object-contain"
          priority
        />
      </div>
      <span className="font-bold text-xl hidden sm:inline-block">BizCard</span>
    </div>
  );
} 