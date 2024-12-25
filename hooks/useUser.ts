'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';

export function useUser() {
  const { user: authUser, isLoading } = useAuth();
  const [user, setUser] = useState(authUser);

  useEffect(() => {
    setUser(authUser);
  }, [authUser]);

  return {
    user,
    isLoading,
  };
} 