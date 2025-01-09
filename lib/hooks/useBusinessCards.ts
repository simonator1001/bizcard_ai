'use client'

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase-client';
import { BusinessCard } from '@/types/business-card';

export function useBusinessCards() {
  const [cards, setCards] = useState<BusinessCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    fetchCards();
  }, [user]);

  const fetchCards = async () => {
    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('business_cards')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      setCards(data || []);
    } catch (err) {
      setError(err as Error);
      console.error('Error fetching cards:', err);
    } finally {
      setLoading(false);
    }
  };

  const addCard = async (card: Omit<BusinessCard, 'id' | 'created_at' | 'user_id'>) => {
    try {
      if ('id' in card) {
        setCards(prevCards => [(card as BusinessCard), ...prevCards]);
        return card;
      }

      const { data, error: insertError } = await supabase
        .from('business_cards')
        .insert([{
          ...card,
          user_id: user?.id,
          lastModified: new Date().toISOString()
        }])
        .select()
        .single();

      if (insertError) throw insertError;

      setCards(prevCards => [data, ...prevCards]);
      return data;
    } catch (err) {
      console.error('Error adding card:', err);
      throw err;
    }
  };

  const updateCard = async (id: string, updates: Partial<BusinessCard>) => {
    try {
      const { data, error: updateError } = await supabase
        .from('business_cards')
        .update({
          ...updates,
          lastModified: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (updateError) throw updateError;

      setCards(prevCards =>
        prevCards.map(card => (card.id === id ? { ...card, ...data } : card))
      );
      return data;
    } catch (err) {
      console.error('Error updating card:', err);
      throw err;
    }
  };

  const deleteCard = async (id: string) => {
    try {
      const { error: deleteError } = await supabase
        .from('business_cards')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      setCards(prevCards => prevCards.filter(card => card.id !== id));
    } catch (err) {
      console.error('Error deleting card:', err);
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