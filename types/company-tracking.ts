export type NotificationFrequency = 'realtime' | 'daily' | 'weekly';
export type AlertType = 'news' | 'financial' | 'product' | 'personnel' | 'custom';
export type NewsCategory = 'business' | 'technology' | 'finance' | 'industry' | 'custom';

export interface TrackedCompany {
    id: string;
    user_id: string;
    company_name: string;
    company_website?: string;
    industry?: string;
    importance_level: number;
    created_at: string;
    updated_at: string;
}

export interface TrackingPreference {
    id: string;
    company_id: string;
    notification_frequency: NotificationFrequency;
    news_categories: NewsCategory[];
    alert_types: AlertType[];
    created_at: string;
    updated_at: string;
}

export interface NewsArticle {
    id: string;
    title: string;
    content?: string;
    source: string;
    url?: string;
    published_at: string;
    categories: NewsCategory[];
    related_companies: string[];
    created_at: string;
}

export interface UserNewsAlert {
    id: string;
    user_id: string;
    article_id: string;
    is_read: boolean;
    created_at: string;
}

export interface CompanyTrackingState {
    trackedCompanies: TrackedCompany[];
    trackingPreferences: Record<string, TrackingPreference>;
    newsAlerts: UserNewsAlert[];
    loading: boolean;
    error: string | null;
}

export interface CompanyTrackingContextType {
    state: CompanyTrackingState;
    trackCompany: (company: Omit<TrackedCompany, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<void>;
    untrackCompany: (companyId: string) => Promise<void>;
    updateTrackingPreference: (preference: Omit<TrackingPreference, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
    markAlertAsRead: (alertId: string) => Promise<void>;
    getNewsFeed: (companyId?: string) => Promise<NewsArticle[]>;
} 