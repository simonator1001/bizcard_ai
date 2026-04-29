'use server';

// NOTE: Company tracking has been migrated to AppWrite client-side SDK.
// These server actions are no longer used by the app components.
// The client-side CompanyTrackingContext handles all CRUD via AppWrite SDK directly.
// These stubs remain for backward compatibility with any external callers.

import { TrackedCompany, TrackingPreference, NewsArticle } from '@/types/company-tracking';

export async function getTrackedCompanies() {
    console.log('[Server Action] getTrackedCompanies: migrated to client-side AppWrite SDK');
    return { data: [], error: 'Server action deprecated — use client-side context' };
}

export async function getNewsFeed(companyId?: string) {
    console.log('[Server Action] getNewsFeed: migrated to client-side AppWrite SDK');
    return { data: [], error: 'Server action deprecated — use client-side context' };
}

export async function trackCompany(company: Omit<TrackedCompany, 'id' | 'user_id' | 'created_at' | 'updated_at'>) {
    console.log('[Server Action] trackCompany: migrated to client-side AppWrite SDK');
    return { data: null, error: 'Server action deprecated — use client-side context' };
}
