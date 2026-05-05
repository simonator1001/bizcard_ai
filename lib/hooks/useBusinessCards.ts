'use client'

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/lib/auth-context';
import { databases, ID, DATABASE_ID, CARDS_COLLECTION } from '@/lib/appwrite';
import { Query } from 'appwrite';
import { BusinessCard } from '@/types/business-card';
import { toast } from 'sonner';

const PAGE_SIZE = 100;

function mapDocument(doc: any): BusinessCard {
  // Parse extended metadata from notes
  const notesRaw = doc.notes || ''
  const metaIdx = notesRaw.indexOf('__bizcard_meta__')
  let images: any[] = []
  let cleanNotes = notesRaw
  if (metaIdx !== -1) {
    try {
      const meta = JSON.parse(notesRaw.slice(metaIdx + '__bizcard_meta__'.length))
      images = meta._i || []
      cleanNotes = notesRaw.slice(0, metaIdx).trim()
    } catch {}
  }

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
    images,
    profile_pic_url: doc.profile_pic_url,
    linkedin_url: doc.linkedin_url,
    notes: cleanNotes,
    mergedFrom: doc.mergedFrom,
  };
}

export function useBusinessCards() {
  const [cards, setCards] = useState<BusinessCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);
  const { user } = useAuth();
  const loadingRef = useRef(false);

  const fetchCards = useCallback(async () => {
    if (!user) {
      setLoading(false);
      setCards([]);
      setHasMore(false);
      setTotal(0);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await databases.listDocuments(
        DATABASE_ID,
        CARDS_COLLECTION,
        [
          Query.equal('user_id', user.$id),
          Query.orderDesc('$createdAt'),
          Query.limit(PAGE_SIZE),
        ]
      );

      const totalDocs = response.total;
      const mappedCards = response.documents.map(mapDocument);

      setCards(mappedCards);
      setTotal(totalDocs);
      setHasMore(mappedCards.length < totalDocs);
      console.log(`[useBusinessCards] Loaded ${mappedCards.length} of ${totalDocs} cards`);
    } catch (err) {
      setError(err as Error);
      console.error('Error fetching cards:', err);
      toast.error('Failed to load business cards');
    } finally {
      setLoading(false);
    }
  }, [user]);

  const loadMore = useCallback(async () => {
    if (!user || loadingRef.current || !hasMore) return;

    try {
      loadingRef.current = true;
      setLoadingMore(true);

      const response = await databases.listDocuments(
        DATABASE_ID,
        CARDS_COLLECTION,
        [
          Query.equal('user_id', user.$id),
          Query.orderDesc('$createdAt'),
          Query.limit(PAGE_SIZE),
          Query.offset(cards.length),
        ]
      );

      const mappedCards = response.documents.map(mapDocument);

      setCards(prev => [...prev, ...mappedCards]);
      setHasMore(cards.length + mappedCards.length < response.total);
      console.log(`[useBusinessCards] Loaded ${mappedCards.length} more (${cards.length + mappedCards.length} of ${response.total})`);
    } catch (err) {
      console.error('Error loading more cards:', err);
      toast.error('Failed to load more cards');
    } finally {
      setLoadingMore(false);
      loadingRef.current = false;
    }
  }, [user, cards.length, hasMore]);

  useEffect(() => {
    fetchCards();
  }, [fetchCards]);

  const addCard = async (card: Omit<BusinessCard, 'id' | 'created_at' | 'user_id'>) => {
    if (!user) throw new Error('User must be authenticated to add cards');

    try {
      const newDoc = await databases.createDocument(
        DATABASE_ID,
        CARDS_COLLECTION,
        ID.unique(),
        { ...card, user_id: user.$id, lastModified: new Date().toISOString() }
      );
      const mappedDoc = mapDocument(newDoc);
      setCards(prevCards => [mappedDoc, ...prevCards]);
      setTotal(prev => prev + 1);
      return mappedDoc;
    } catch (err) {
      console.error('Error adding card:', err);
      toast.error('Failed to add business card');
      throw err;
    }
  };

  const updateCard = async (id: string, updates: Partial<BusinessCard>) => {
    if (!user) throw new Error('User must be authenticated to update cards');

    try {
      const updated = await databases.updateDocument(
        DATABASE_ID, CARDS_COLLECTION, id,
        { ...updates, lastModified: new Date().toISOString() }
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
    if (!user) throw new Error('User must be authenticated to delete cards');

    try {
      await databases.deleteDocument(DATABASE_ID, CARDS_COLLECTION, id);
      setCards(prevCards => prevCards.filter(card => card.id !== id));
      setTotal(prev => prev - 1);
    } catch (err) {
      console.error('Error deleting card:', err);
      toast.error('Failed to delete business card');
      throw err;
    }
  };

  return {
    cards,
    loading,
    loadingMore,
    error,
    total,
    hasMore,
    addCard,
    updateCard,
    deleteCard,
    refresh: fetchCards,
    loadMore,
    user,
  };
}
