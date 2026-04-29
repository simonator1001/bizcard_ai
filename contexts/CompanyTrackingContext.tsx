'use client';

import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { databases, ID, DATABASE_ID } from '@/lib/appwrite';
import { Query } from 'appwrite';
import { CompanyTrackingContextType, CompanyTrackingState, TrackedCompany, TrackingPreference, NewsArticle } from '@/types/company-tracking';
import { useAuth } from '@/lib/auth-context';

// AppWrite collection IDs (same as Supabase table names)
const TRACKED_COLLECTION = 'tracked_companies';
const PREFERENCES_COLLECTION = 'tracking_preferences';
const ALERTS_COLLECTION = 'user_news_alerts';
const NEWS_COLLECTION = 'news_articles';

const initialState: CompanyTrackingState = {
    trackedCompanies: [],
    trackingPreferences: {},
    newsAlerts: [],
    loading: false,
    error: null,
};

type Action =
    | { type: 'SET_LOADING'; payload: boolean }
    | { type: 'SET_ERROR'; payload: string | null }
    | { type: 'SET_TRACKED_COMPANIES'; payload: TrackedCompany[] }
    | { type: 'SET_TRACKING_PREFERENCES'; payload: Record<string, TrackingPreference> }
    | { type: 'SET_NEWS_ALERTS'; payload: import('@/types/company-tracking').UserNewsAlert[] }
    | { type: 'ADD_TRACKED_COMPANY'; payload: TrackedCompany }
    | { type: 'REMOVE_TRACKED_COMPANY'; payload: string }
    | { type: 'UPDATE_TRACKING_PREFERENCE'; payload: TrackingPreference }
    | { type: 'MARK_ALERT_AS_READ'; payload: string };

function reducer(state: CompanyTrackingState, action: Action): CompanyTrackingState {
    switch (action.type) {
        case 'SET_LOADING':
            return { ...state, loading: action.payload };
        case 'SET_ERROR':
            return { ...state, error: action.payload };
        case 'SET_TRACKED_COMPANIES':
            return { ...state, trackedCompanies: action.payload };
        case 'SET_TRACKING_PREFERENCES':
            return { ...state, trackingPreferences: action.payload };
        case 'SET_NEWS_ALERTS':
            return { ...state, newsAlerts: action.payload };
        case 'ADD_TRACKED_COMPANY':
            return {
                ...state,
                trackedCompanies: [...state.trackedCompanies, action.payload],
            };
        case 'REMOVE_TRACKED_COMPANY':
            return {
                ...state,
                trackedCompanies: state.trackedCompanies.filter(
                    company => company.id !== action.payload
                ),
            };
        case 'UPDATE_TRACKING_PREFERENCE':
            return {
                ...state,
                trackingPreferences: {
                    ...state.trackingPreferences,
                    [action.payload.company_id]: action.payload,
                },
            };
        case 'MARK_ALERT_AS_READ':
            return {
                ...state,
                newsAlerts: state.newsAlerts.map(alert =>
                    alert.id === action.payload
                        ? { ...alert, is_read: true }
                        : alert
                ),
            };
        default:
            return state;
    }
}

const CompanyTrackingContext = createContext<CompanyTrackingContextType | undefined>(undefined);

function mapDocument<T>(doc: any): T {
    return { ...doc, id: doc.$id, created_at: doc.$createdAt, updated_at: doc.$updatedAt } as unknown as T;
}

export function CompanyTrackingProvider({ children }: { children: React.ReactNode }) {
    const [state, dispatch] = useReducer(reducer, initialState);
    const { user, loading: authLoading, initialized: authInitialized } = useAuth();

    useEffect(() => {
        async function loadInitialData() {
            console.log('[CompanyTrackingProvider] loadInitialData called', {
                authLoading,
                authInitialized,
                user: user?.$id,
            });
            if (authLoading || !authInitialized) {
                console.log('[CompanyTrackingProvider] Auth not initialized yet, skipping data load');
                return;
            }

            if (!user) {
                console.log('[CompanyTrackingProvider] No authenticated user, skipping data load');
                dispatch({ type: 'SET_TRACKED_COMPANIES', payload: [] });
                dispatch({ type: 'SET_NEWS_ALERTS', payload: [] });
                return;
            }

            try {
                dispatch({ type: 'SET_LOADING', payload: true });

                // Load tracked companies
                console.log('[CompanyTrackingProvider] Loading tracked companies from AppWrite...');
                try {
                    const companiesRes = await databases.listDocuments(
                        DATABASE_ID, TRACKED_COLLECTION,
                        [Query.equal('user_id', user.$id), Query.orderDesc('$createdAt')]
                    );
                    const companies = companiesRes.documents.map(mapDocument<TrackedCompany>);
                    console.log('[CompanyTrackingProvider] Tracked companies loaded:', companies.length);
                    dispatch({ type: 'SET_TRACKED_COMPANIES', payload: companies });

                    // Load tracking preferences for each company
                    const prefs: Record<string, TrackingPreference> = {};
                    for (const company of companies) {
                        try {
                            const prefRes = await databases.listDocuments(
                                DATABASE_ID, PREFERENCES_COLLECTION,
                                [Query.equal('company_id', company.id)]
                            );
                            if (prefRes.documents.length > 0) {
                                prefs[company.id] = mapDocument<TrackingPreference>(prefRes.documents[0]);
                            }
                        } catch (e) {
                            // Preferences collection may not exist yet — skip
                            console.log('[CompanyTrackingProvider] No preferences for', company.id);
                        }
                    }
                    dispatch({ type: 'SET_TRACKING_PREFERENCES', payload: prefs });
                } catch (e: any) {
                    console.log('[CompanyTrackingProvider] Tracked companies collection not available:', e?.message);
                    dispatch({ type: 'SET_TRACKED_COMPANIES', payload: [] });
                }

                // Load news alerts
                try {
                    const alertsRes = await databases.listDocuments(
                        DATABASE_ID, ALERTS_COLLECTION,
                        [Query.equal('user_id', user.$id), Query.equal('is_read', false), Query.orderDesc('$createdAt')]
                    );
                    const alerts = alertsRes.documents.map(mapDocument);
                    console.log('[CompanyTrackingProvider] News alerts loaded:', alerts.length);
                    dispatch({ type: 'SET_NEWS_ALERTS', payload: alerts });
                } catch (e: any) {
                    console.log('[CompanyTrackingProvider] Alerts collection not available:', e?.message);
                    dispatch({ type: 'SET_NEWS_ALERTS', payload: [] });
                }
            } catch (error) {
                console.error('[CompanyTrackingProvider] Error loading company tracking data:', error);
                dispatch({
                    type: 'SET_ERROR',
                    payload: 'Failed to load company tracking data',
                });
            } finally {
                dispatch({ type: 'SET_LOADING', payload: false });
            }
        }

        loadInitialData();
    }, [user, authLoading, authInitialized]);

    const trackCompany = async (company: Omit<TrackedCompany, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
        try {
            dispatch({ type: 'SET_LOADING', payload: true });

            const doc = await databases.createDocument(
                DATABASE_ID, TRACKED_COLLECTION, ID.unique(),
                { ...company, user_id: user?.$id }
            );
            const tracked = mapDocument<TrackedCompany>(doc);

            dispatch({ type: 'ADD_TRACKED_COMPANY', payload: tracked });
        } catch (error) {
            console.error('Error tracking company:', error);
            dispatch({
                type: 'SET_ERROR',
                payload: 'Failed to track company',
            });
            throw error;
        } finally {
            dispatch({ type: 'SET_LOADING', payload: false });
        }
    };

    const untrackCompany = async (companyId: string) => {
        try {
            dispatch({ type: 'SET_LOADING', payload: true });

            await databases.deleteDocument(DATABASE_ID, TRACKED_COLLECTION, companyId);

            dispatch({ type: 'REMOVE_TRACKED_COMPANY', payload: companyId });
        } catch (error) {
            console.error('Error untracking company:', error);
            dispatch({
                type: 'SET_ERROR',
                payload: 'Failed to untrack company',
            });
            throw error;
        } finally {
            dispatch({ type: 'SET_LOADING', payload: false });
        }
    };

    const updateTrackingPreference = async (preference: Omit<TrackingPreference, 'id' | 'created_at' | 'updated_at'>) => {
        try {
            dispatch({ type: 'SET_LOADING', payload: true });

            // Try to find existing preference
            let existingId: string | null = null;
            try {
                const existing = await databases.listDocuments(
                    DATABASE_ID, PREFERENCES_COLLECTION,
                    [Query.equal('company_id', preference.company_id)]
                );
                if (existing.documents.length > 0) {
                    existingId = existing.documents[0].$id;
                }
            } catch (e) {
                // Collection may not exist
            }

            let doc;
            if (existingId) {
                doc = await databases.updateDocument(
                    DATABASE_ID, PREFERENCES_COLLECTION, existingId,
                    preference as any
                );
            } else {
                doc = await databases.createDocument(
                    DATABASE_ID, PREFERENCES_COLLECTION, ID.unique(),
                    preference as any
                );
            }

            const pref = mapDocument<TrackingPreference>(doc);
            dispatch({ type: 'UPDATE_TRACKING_PREFERENCE', payload: pref });
        } catch (error) {
            console.error('Error updating tracking preference:', error);
            dispatch({
                type: 'SET_ERROR',
                payload: 'Failed to update tracking preference',
            });
            throw error;
        } finally {
            dispatch({ type: 'SET_LOADING', payload: false });
        }
    };

    const markAlertAsRead = async (alertId: string) => {
        try {
            dispatch({ type: 'SET_LOADING', payload: true });

            await databases.updateDocument(
                DATABASE_ID, ALERTS_COLLECTION, alertId,
                { is_read: true }
            );

            dispatch({ type: 'MARK_ALERT_AS_READ', payload: alertId });
        } catch (error) {
            console.error('Error marking alert as read:', error);
            dispatch({
                type: 'SET_ERROR',
                payload: 'Failed to mark alert as read',
            });
            throw error;
        } finally {
            dispatch({ type: 'SET_LOADING', payload: false });
        }
    };

    const getNewsFeed = async (companyId?: string): Promise<NewsArticle[]> => {
        try {
            dispatch({ type: 'SET_LOADING', payload: true });
            console.log('[CompanyTrackingContext] Fetching news feed for company:', companyId || 'all companies');

            const queries = [Query.orderDesc('published_at'), Query.limit(50)];
            const res = await databases.listDocuments(
                DATABASE_ID, NEWS_COLLECTION,
                queries
            );

            let articles = res.documents.map(mapDocument<NewsArticle>);

            // Client-side filter by company if specified (AppWrite doesn't support array 'contains' query)
            if (companyId) {
                articles = articles.filter(a =>
                    a.related_companies?.includes(companyId)
                );
            }

            console.log('[CompanyTrackingContext] Successfully fetched news articles:', articles.length);
            return articles;
        } catch (error) {
            console.error('[CompanyTrackingContext] Error fetching news feed:', error);
            dispatch({
                type: 'SET_ERROR',
                payload: 'Failed to fetch news feed',
            });
            return [];
        } finally {
            dispatch({ type: 'SET_LOADING', payload: false });
        }
    };

    return (
        <CompanyTrackingContext.Provider
            value={{
                state,
                trackCompany,
                untrackCompany,
                updateTrackingPreference,
                markAlertAsRead,
                getNewsFeed,
            }}
        >
            {children}
        </CompanyTrackingContext.Provider>
    );
}

export function useCompanyTracking() {
    const context = useContext(CompanyTrackingContext);
    if (context === undefined) {
        throw new Error('useCompanyTracking must be used within a CompanyTrackingProvider');
    }
    return context;
}
