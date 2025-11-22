'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Global error:', error);
  }, [error]);

  return (
    <html>
      <body>
        <div className="flex h-screen flex-col items-center justify-center gap-4">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-semibold">Something went wrong!</h2>
            <p className="text-muted-foreground">
              An error occurred while loading the application.
            </p>
          </div>
          <Button
            variant="default"
            onClick={() => reset()}
          >
            Try again
          </Button>
        </div>
      </body>
    </html>
  );
} 