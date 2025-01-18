'use client'

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase-client';
import { BusinessCard } from '@/types/business-card';
import { toast } from 'sonner';

export function useBusinessCards() {
  const [cards, setCards] = useState<BusinessCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { user } = useAuth();

  const fetchCards = useCallback(async () => {
    if (!user) {
      setLoading(false);
      setCards([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // First, try to get the total count of cards
      const { count, error: countError } = await supabase
        .from('business_cards')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      if (countError) {
        console.error('Error getting card count:', countError);
        throw countError;
      }

      console.log('Total cards in database for user:', count);

      // Then fetch the actual cards
      const { data, error: fetchError } = await supabase
        .from('business_cards')
        .select('*')
        .eq('user_id', user.id)
        .not('company', 'is', null)
        .not('company', 'eq', '')
        .order('created_at', { ascending: false });

      if (fetchError) {
        console.error('Error fetching cards:', fetchError);
        throw fetchError;
      }

      // Log the raw response
      console.log('Raw Supabase response:', data);

      setCards(data || []);
    } catch (err) {
      setError(err as Error);
      console.error('Error fetching cards:', err);
      toast.error('Failed to load business cards');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchCards();
  }, [fetchCards]);

  const addCard = async (card: Omit<BusinessCard, 'id' | 'created_at' | 'user_id'>) => {
    if (!user) {
      throw new Error('User must be authenticated to add cards');
    }

    try {
      if ('id' in card) {
        setCards(prevCards => [(card as BusinessCard), ...prevCards]);
        return card;
      }

      const { data, error: insertError } = await supabase
        .from('business_cards')
        .insert([{
          ...card,
          user_id: user.id,
          lastModified: new Date().toISOString()
        }])
        .select()
        .single();

      if (insertError) {
        console.error('Error adding card:', insertError);
        throw insertError;
      }

      setCards(prevCards => [data, ...prevCards]);
      return data;
    } catch (err) {
      console.error('Error adding card:', err);
      toast.error('Failed to add business card');
      throw err;
    }
  };

  const updateCard = async (id: string, updates: Partial<BusinessCard>) => {
    if (!user) {
      throw new Error('User must be authenticated to update cards');
    }

    try {
      const { data, error: updateError } = await supabase
        .from('business_cards')
        .update({
          ...updates,
          lastModified: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating card:', updateError);
        throw updateError;
      }

      setCards(prevCards =>
        prevCards.map(card => (card.id === id ? { ...card, ...data } : card))
      );
      return data;
    } catch (err) {
      console.error('Error updating card:', err);
      toast.error('Failed to update business card');
      throw err;
    }
  };

  const deleteCard = async (id: string) => {
    if (!user) {
      throw new Error('User must be authenticated to delete cards');
    }

    try {
      const { error: deleteError } = await supabase
        .from('business_cards')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (deleteError) {
        console.error('Error deleting card:', deleteError);
        throw deleteError;
      }

      setCards(prevCards => prevCards.filter(card => card.id !== id));
    } catch (err) {
      console.error('Error deleting card:', err);
      toast.error('Failed to delete business card');
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
    refresh: fetchCards,
  };
} 