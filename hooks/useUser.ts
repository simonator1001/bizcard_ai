'use client';

import { useEffect, useState } from 'react';
import { useAuth, AppWriteUser } from '@/lib/auth-context';

export function useUser() {
  const { user: authUser, loading } = useAuth();
  const [user, setUser] = useState<AppWriteUser | null>(authUser);

  useEffect(() => {
    setUser(authUser);
  }, [authUser]);

  return { user, loading };
}
