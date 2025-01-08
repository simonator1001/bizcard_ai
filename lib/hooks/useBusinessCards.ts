'use client'

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase-client';
import type { BusinessCard } from '@/types/business-card';

export function useBusinessCards() {
  const [cards, setCards] = useState<BusinessCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      console.log('[useBusinessCards] No user found, clearing cards');
      setCards([]);
      setLoading(false);
      return;
    }

    const fetchCards = async () => {
      try {
        console.log('[useBusinessCards] Fetching cards for user:', user.id);
        setLoading(true);
        setError(null);

        const { data: session } = await supabase.auth.getSession();
        if (!session.session) {
          throw new Error('No active session');
        }

        const { data, error: fetchError } = await supabase
          .from('business_cards')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (fetchError) {
          console.error('[useBusinessCards] Error fetching cards:', fetchError);
          throw fetchError;
        }

        console.log('[useBusinessCards] Fetched cards:', data?.length || 0);
        setCards(data || []);
      } catch (err) {
        console.error('[useBusinessCards] Error:', err);
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    fetchCards();

    // Subscribe to changes
    console.log('[useBusinessCards] Setting up real-time subscription for user:', user.id);
    const subscription = supabase
      .channel('business_cards_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'business_cards',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('[useBusinessCards] Received real-time update:', payload.eventType);
          if (payload.eventType === 'INSERT') {
            setCards((prev) => [payload.new as BusinessCard, ...prev]);
          } else if (payload.eventType === 'DELETE') {
            setCards((prev) => prev.filter((card) => card.id !== payload.old.id));
          } else if (payload.eventType === 'UPDATE') {
            setCards((prev) =>
              prev.map((card) =>
                card.id === payload.new.id ? (payload.new as BusinessCard) : card
              )
            );
          }
        }
      )
      .subscribe();

    return () => {
      console.log('[useBusinessCards] Cleaning up subscription');
      subscription.unsubscribe();
    };
  }, [user]);

  const addCard = async (card: Omit<BusinessCard, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      if (!user) {
        throw new Error('No user found');
      }

      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        throw new Error('No active session');
      }

      // Ensure user_id matches the authenticated user
      const cardData = {
        ...card,
        user_id: user.id // Always use the current user's ID
      };

      console.log('[useBusinessCards] Adding card:', {
        ...cardData,
        rawText: cardData.rawText?.substring(0, 100) + '...' // Truncate for logging
      });

      // Use our API endpoint
      const response = await fetch('/api/cards/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify(cardData)
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('[useBusinessCards] API error:', error);
        throw new Error(error.message || 'Failed to add business card');
      }

      const data = await response.json();
      console.log('[useBusinessCards] Card added successfully:', data.id);
      return data;
    } catch (err) {
      console.error('[useBusinessCards] Error adding business card:', err);
      throw err;
    }
  };

  const updateCard = async (id: string, updates: Partial<BusinessCard>) => {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) {
        throw new Error('No active session');
      }

      const { data, error } = await supabase
        .from('business_cards')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user?.id)
        .select()
        .single();

      if (error) throw error;

      return data;
    } catch (err) {
      console.error('Error updating business card:', err);
      throw err;
    }
  };

  const deleteCard = async (id: string) => {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) {
        throw new Error('No active session');
      }

      const { error } = await supabase
        .from('business_cards')
        .delete()
        .eq('id', id)
        .eq('user_id', user?.id);

      if (error) throw error;
    } catch (err) {
      console.error('Error deleting business card:', err);
      throw err;
    }
  };

  return {
    cards,
    loading,
    error,
    addCard,
    updateCard,
    deleteCard,
  };
} 