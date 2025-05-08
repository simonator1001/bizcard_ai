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

  // Merge fields from other cards if they are empty in the base card
  sortedCards.slice(1).forEach(card => {
    if (!baseCard.name && card.name) baseCard.name = card.name;
    if (!baseCard.name_zh && card.name_zh) baseCard.name_zh = card.name_zh;
    if (!baseCard.title && card.title) baseCard.title = card.title;
    if (!baseCard.title_zh && card.title_zh) baseCard.title_zh = card.title_zh;
    if (!baseCard.company && card.company) baseCard.company = card.company;
    if (!baseCard.company_zh && card.company_zh) baseCard.company_zh = card.company_zh;
    if (!baseCard.email && card.email) baseCard.email = card.email;
    if (!baseCard.phone && card.phone) baseCard.phone = card.phone;
    if (!baseCard.address && card.address) baseCard.address = card.address;
    if (!baseCard.address_zh && card.address_zh) baseCard.address_zh = card.address_zh;
    if (!baseCard.notes && card.notes) baseCard.notes = card.notes;
  });

  // Set mergedFrom to all card IDs except the base card
  baseCard.mergedFrom = sortedCards.map(card => card.id).filter(id => id !== baseCard.id);

  // Update lastModified and last_modified timestamps
  const now = new Date().toISOString();
  baseCard.lastModified = now;
  // @ts-ignore
  baseCard.last_modified = now;

  return baseCard;
} 