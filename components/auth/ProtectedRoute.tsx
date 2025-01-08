import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const router = useRouter();

  // If we don't have a user, redirect to sign in
  if (!user) {
    router.push('/signin');
    return null;
  }

  // If we have a user, show the protected content
  return <>{children}</>;
} 