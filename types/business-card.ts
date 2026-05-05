export interface CardImage {
  url: string;
  label?: string; // 'front' | 'back' | 'profile' | custom string
  added_at?: string;
}

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
  images?: CardImage[];
  profile_pic_url?: string;
  linkedin_url?: string;
  notes?: string;
  created_at: string;
  lastModified?: string;
  mergedFrom?: string[];
  user_id: string;
}