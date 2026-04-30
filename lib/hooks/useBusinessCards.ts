'use client'

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth-context';
import { databases, ID, DATABASE_ID, CARDS_COLLECTION } from '@/lib/appwrite';
import { Query } from 'appwrite';
import { BusinessCard } from '@/types/business-card';
import { toast } from 'sonner';

function mapDocument(doc: any): BusinessCard {
  return {
    id: doc.$id,
    created_at: doc.$createdAt,
    lastModified: doc.lastModified,
    user_id: doc.user_id,
    name: doc.name,
    name_zh: doc.name_zh,
    company: doc.company,
    company_zh: doc.company_zh,
    title: doc.title,
    title_zh: doc.title_zh,
    email: doc.email,
    phone: doc.phone,
    address: doc.address,
    address_zh: doc.address_zh,
    image_url: doc.image_url,
    images: doc.images,
    notes: doc.notes,
    mergedFrom: doc.mergedFrom,
  };
}

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

      // Fetch cards from AppWrite
      const response = await databases.listDocuments(
        DATABASE_ID,
        CARDS_COLLECTION,
        [
          Query.equal('user_id', user.$id),
          Query.orderDesc('$createdAt'),
          Query.isNotNull('company'),
          Query.notEqual('company', ''),
        ]
      );

      console.log('Total cards in database for user:', response.total);

      // Map AppWrite documents to BusinessCard type
      const mappedCards = response.documents.map(mapDocument);

      setCards(mappedCards);
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
      const newDoc = await databases.createDocument(
        DATABASE_ID,
        CARDS_COLLECTION,
        ID.unique(),
        {
          ...card,
          user_id: user.$id,
          lastModified: new Date().toISOString()
        }
      );

      const mappedDoc = mapDocument(newDoc);
      setCards(prevCards => [mappedDoc, ...prevCards]);
      return mappedDoc;
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
      const updated = await databases.updateDocument(
        DATABASE_ID,
        CARDS_COLLECTION,
        id,
        {
          ...updates,
          lastModified: new Date().toISOString(),
        }
      );

      const mappedDoc = mapDocument(updated);
      setCards(prevCards =>
        prevCards.map(card => (card.id === id ? { ...card, ...mappedDoc } : card))
      );
      return mappedDoc;
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
      await databases.deleteDocument(
        DATABASE_ID,
        CARDS_COLLECTION,
        id
      );

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
    user,
  };
}
