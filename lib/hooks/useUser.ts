'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { User } from '@supabase/supabase-js';

export function useUser() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    // Get initial user data securely
    const initializeUser = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error) {
          console.error('[useUser] Error getting user:', error);
          setUser(null);
        } else {
          setUser(user);
        }
      } catch (err) {
        console.error('[useUser] Error in getUser:', err);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initializeUser();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session) {
        // Verify user data on auth state change
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error) {
          console.error('[useUser] Error getting user on auth change:', error);
          setUser(null);
        } else {
          setUser(user);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase.auth]);

  return { user, loading };
} 