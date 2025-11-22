'use server';

import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { TrackedCompany, TrackingPreference, NewsArticle } from '@/types/company-tracking';

export async function getTrackedCompanies() {
  const supabase = createServerComponentClient({ cookies });
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    console.error('[Server Action] No authenticated session found');
    return { data: null, error: 'Not authenticated' };
  }

  try {
    console.log('[Server Action] Loading tracked companies from Supabase...');
    const { data, error } = await supabase
      .from('tracked_companies')
      .select(`*, tracking_preferences (*)`)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('[Server Action] Supabase error:', error);
      return { data: null, error: error.message };
    }
    
    console.log('[Server Action] Tracked companies loaded successfully:', data?.length || 0);
    return { data, error: null };
  } catch (error) {
    console.error('[Server Action] Error loading tracked companies:', error);
    return { data: null, error: 'Failed to load tracked companies' };
  }
}

export async function getNewsFeed(companyId?: string) {
  const supabase = createServerComponentClient({ cookies });
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    console.error('[Server Action] No authenticated session found for news feed');
    return { data: null, error: 'Not authenticated' };
  }

  try {
    console.log('[Server Action] Fetching news feed for company:', companyId || 'all companies');
    
    let query = supabase
      .from('news_articles')
      .select('*')
      .order('published_at', { ascending: false });

    if (companyId) {
      query = query.contains('related_companies', [companyId]);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[Server Action] Supabase error fetching news:', error);
      return { data: null, error: error.message };
    }

    console.log('[Server Action] Successfully fetched news articles:', data?.length || 0);
    return { data, error: null };
  } catch (error) {
    console.error('[Server Action] Error fetching news feed:', error);
    return { data: null, error: 'Failed to fetch news feed' };
  }
}

export async function trackCompany(company: Omit<TrackedCompany, 'id' | 'user_id' | 'created_at' | 'updated_at'>) {
  const supabase = createServerComponentClient({ cookies });
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    console.error('[Server Action] No authenticated session found for tracking company');
    return { data: null, error: 'Not authenticated' };
  }

  try {
    console.log('[Server Action] Tracking company:', company.company_name);
    
    const { data, error } = await supabase
      .from('tracked_companies')
      .insert({ ...company, user_id: session.user.id })
      .select()
      .single();

    if (error) {
      console.error('[Server Action] Supabase error tracking company:', error);
      return { data: null, error: error.message };
    }

    console.log('[Server Action] Successfully tracked company:', data);
    return { data, error: null };
  } catch (error) {
    console.error('[Server Action] Error tracking company:', error);
    return { data: null, error: 'Failed to track company' };
  }
} 