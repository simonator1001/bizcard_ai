export interface BusinessCard {
  id: string;
  name?: string;
  name_zh?: string;
  company?: string;
  company_zh?: string;
  title?: string;
  title_zh?: string;
  email?: string;
  phone?: string;
  address?: string;
  address_zh?: string;
  image_url?: string;
  notes?: string;
  created_at: string;
  lastModified?: string;
  mergedFrom?: string[]; // IDs of cards that were merged to create this card
  user_id: string;
} 