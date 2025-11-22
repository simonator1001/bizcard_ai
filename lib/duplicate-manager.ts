import type { BusinessCard } from '@/types/business-card';

export interface DuplicateGroup {
  cards: BusinessCard[];
  primaryCard: BusinessCard;
}

export function findDuplicates(cards: BusinessCard[]): DuplicateGroup[] {
  if (!Array.isArray(cards) || cards.length === 0) {
    return [];
  }

  const emailGroups = new Map<string, BusinessCard[]>();
  
  // Group cards by email
  cards.forEach(card => {
    if (card.email) {
      const normalizedEmail = card.email.toLowerCase().trim();
      const group = emailGroups.get(normalizedEmail) || [];
      group.push(card);
      emailGroups.set(normalizedEmail, group);
    }
  });

  // Convert groups with more than one card into DuplicateGroups
  const duplicateGroups: DuplicateGroup[] = [];
  emailGroups.forEach((group) => {
    if (group.length > 1) {
      // Sort by last modified date to get the most recent card as primary
      const sortedCards = [...group].sort((a, b) => {
        const dateA = a.lastModified ? new Date(a.lastModified).getTime() : 0;
        const dateB = b.lastModified ? new Date(b.lastModified).getTime() : 0;
        return dateB - dateA;
      });

      duplicateGroups.push({
        cards: sortedCards,
        primaryCard: sortedCards[0], // Most recent card is primary
      });
    }
  });

  return duplicateGroups;
}

export function mergeCards(cards: BusinessCard[]): BusinessCard {
  if (!Array.isArray(cards) || cards.length === 0) {
    throw new Error('No cards to merge');
  }

  // Sort cards by last modified date to get the most recent one as the base
  const sortedCards = [...cards].sort((a, b) => {
    const dateA = a.lastModified ? new Date(a.lastModified).getTime() : 0;
    const dateB = b.lastModified ? new Date(b.lastModified).getTime() : 0;
    return dateB - dateA;
  });

  const baseCard = { ...sortedCards[0] };

  // Explicitly assign each string field by taking the first non-empty value from any card
  baseCard.name = sortedCards.map(card => card.name).find(val => typeof val === 'string' && val.trim() !== '') || '';
  baseCard.name_zh = sortedCards.map(card => card.name_zh).find(val => typeof val === 'string' && val.trim() !== '') || '';
  baseCard.company = sortedCards.map(card => card.company).find(val => typeof val === 'string' && val.trim() !== '') || '';
  baseCard.company_zh = sortedCards.map(card => card.company_zh).find(val => typeof val === 'string' && val.trim() !== '') || '';
  baseCard.title = sortedCards.map(card => card.title).find(val => typeof val === 'string' && val.trim() !== '') || '';
  baseCard.title_zh = sortedCards.map(card => card.title_zh).find(val => typeof val === 'string' && val.trim() !== '') || '';
  baseCard.email = sortedCards.map(card => card.email).find(val => typeof val === 'string' && val.trim() !== '') || '';
  baseCard.phone = sortedCards.map(card => card.phone).find(val => typeof val === 'string' && val.trim() !== '') || '';
  baseCard.address = sortedCards.map(card => card.address).find(val => typeof val === 'string' && val.trim() !== '') || '';
  baseCard.address_zh = sortedCards.map(card => card.address_zh).find(val => typeof val === 'string' && val.trim() !== '') || '';
  baseCard.image_url = sortedCards.map(card => card.image_url).find(val => typeof val === 'string' && val.trim() !== '') || '';

  // For notes, combine all unique notes
  const allNotes = Array.from(new Set(sortedCards.map(card => card.notes).filter(Boolean)));
  baseCard.notes = allNotes.join('\n');

  // Set mergedFrom to all card IDs except the base card
  baseCard.mergedFrom = sortedCards.map(card => card.id).filter(id => id !== baseCard.id);

  // Update lastModified timestamp
  const now = new Date().toISOString();
  baseCard.lastModified = now;

  return baseCard;
} 