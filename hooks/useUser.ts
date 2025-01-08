'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { User } from '@supabase/supabase-js';

export function useUser() {
  const { user: authUser, loading } = useAuth();
  const [user, setUser] = useState(authUser);

  useEffect(() => {
    setUser(authUser);
  }, [authUser]);

  return { user, loading };
} 