import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/lib/auth-context';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();

  // If we have a user, show the protected content
  if (user && isAuthenticated) {
    return <>{children}</>;
  }

  // If we're not loading and have no user, show nothing (middleware will redirect)
  return null;
} 