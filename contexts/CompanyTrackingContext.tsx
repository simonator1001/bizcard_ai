'use client';

import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { CompanyTrackingContextType, CompanyTrackingState, TrackedCompany, TrackingPreference, NewsArticle } from '@/types/company-tracking';
import { useAuth } from '@/lib/auth-context';

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

export function CompanyTrackingProvider({ children }: { children: React.ReactNode }) {
    const [state, dispatch] = useReducer(reducer, initialState);
    const supabase = useSupabaseClient();
    const { user, loading: authLoading, initialized: authInitialized } = useAuth();

    useEffect(() => {
        async function loadInitialData() {
            console.log('[CompanyTrackingProvider] loadInitialData called', {
                authLoading,
                authInitialized,
                user
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
                console.log('[CompanyTrackingProvider] Loading tracked companies from Supabase...');
                // Load tracked companies
                const { data: companies, error: companiesError } = await supabase
                    .from('tracked_companies')
                    .select(`*, tracking_preferences (*)`)
                    .order('created_at', { ascending: false });
                if (companiesError) {
                    console.error('[CompanyTrackingProvider] Supabase companiesError:', companiesError);
                    throw companiesError;
                }
                console.log('[CompanyTrackingProvider] Tracked companies loaded:', companies);
                dispatch({ type: 'SET_TRACKED_COMPANIES', payload: companies });

                // Load news alerts
                console.log('[CompanyTrackingProvider] Loading news alerts from Supabase...');
                const { data: alerts, error: alertsError } = await supabase
                    .from('user_news_alerts')
                    .select('*')
                    .eq('is_read', false)
                    .order('created_at', { ascending: false });
                if (alertsError) {
                    console.error('[CompanyTrackingProvider] Supabase alertsError:', alertsError);
                    throw alertsError;
                }
                console.log('[CompanyTrackingProvider] News alerts loaded:', alerts);
                dispatch({ type: 'SET_NEWS_ALERTS', payload: alerts });
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
    }, [supabase, user, authLoading, authInitialized]);

    const trackCompany = async (company: Omit<TrackedCompany, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
        try {
            dispatch({ type: 'SET_LOADING', payload: true });
            
            const { data, error } = await supabase
                .from('tracked_companies')
                .insert(company)
                .select()
                .single();

            if (error) throw error;

            dispatch({ type: 'ADD_TRACKED_COMPANY', payload: data });
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
            
            const { error } = await supabase
                .from('tracked_companies')
                .delete()
                .eq('id', companyId);

            if (error) throw error;

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
            
            const { data, error } = await supabase
                .from('tracking_preferences')
                .upsert(preference)
                .select()
                .single();

            if (error) throw error;

            dispatch({ type: 'UPDATE_TRACKING_PREFERENCE', payload: data });
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
            
            const { error } = await supabase
                .from('user_news_alerts')
                .update({ is_read: true })
                .eq('id', alertId);

            if (error) throw error;

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

    const getNewsFeed = async (companyId?: string) => {
        try {
            dispatch({ type: 'SET_LOADING', payload: true });
            console.log('[CompanyTrackingContext] Fetching news feed for company:', companyId || 'all companies');
            
            let query = supabase
                .from('news_articles')
                .select('*')
                .order('published_at', { ascending: false });

            if (companyId) {
                query = query.contains('related_companies', [companyId]);
            }

            console.log('[CompanyTrackingContext] Executing Supabase query for news articles');
            const { data, error } = await query;

            if (error) {
                console.error('[CompanyTrackingContext] Supabase error fetching news:', error);
                throw error;
            }

            console.log('[CompanyTrackingContext] Successfully fetched news articles:', data);
            return data;
        } catch (error) {
            console.error('[CompanyTrackingContext] Error fetching news feed:', error);
            dispatch({
                type: 'SET_ERROR',
                payload: 'Failed to fetch news feed',
            });
            throw error;
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