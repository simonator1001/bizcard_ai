'use client';

// Supabase removed — using AppWrite via auth-context
import { useAuth } from '@/lib/auth-context';
import { useEffect, useState } from 'react';

// Re-export useAuth as useUser for backward compatibility
export function useUser() {
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading) {
      setLoading(false);
    }
  }, [authLoading]);

  // Adapt AppWrite user to match Supabase User shape where needed
  // AppWrite user.$id maps to Supabase user.id
  return { 
    user: user ? { ...user, id: user.$id } : null, 
    loading 
  };
}
