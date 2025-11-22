'use client';

import { CompanyTrackingProvider } from '@/contexts/CompanyTrackingContext';
import { CompanyTrackingList } from '@/components/CompanyTracking/CompanyTrackingList';
import { NewsFeed } from '@/components/CompanyTracking/NewsFeed';
import { useAuth } from '@/lib/auth-context';
import React from 'react';

export default function CompaniesPage() {
    const { user, loading, initialized } = useAuth();
    console.log('[CompaniesPage] Rendering with auth state:', {
        user: user ? { id: user.id, email: user.email } : null,
        loading,
        initialized
    });

    try {
        // Show loading state while auth is initializing
        if (loading || !initialized) {
            console.log('[CompaniesPage] Auth is still initializing, showing loading state');
            return (
                <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                    <p className="text-muted-foreground">Loading...</p>
                </div>
            );
        }

        if (!user) {
            console.log('[CompaniesPage] No authenticated user, showing public message');
            return (
                <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                    <h2 className="text-2xl font-bold">Company Tracking</h2>
                    <p className="text-muted-foreground">Sign in to track companies and get personalized news, or browse public company info below.</p>
                    {/* Optionally, render a public version of the company/news UI here */}
                </div>
            );
        }

        console.log('[CompaniesPage] User is authenticated, rendering CompanyTrackingProvider');
        return (
            <CompanyTrackingProvider>
                <div className="flex flex-col md:flex-row gap-8 w-full max-w-7xl mx-auto py-8">
                    <div className="w-full md:w-1/2">
                        <CompanyTrackingList />
                    </div>
                    <div className="w-full md:w-1/2">
                        <NewsFeed />
                    </div>
                </div>
            </CompanyTrackingProvider>
        );
    } catch (error) {
        console.error('[CompaniesPage] Error rendering page:', error);
        return (
            <div className="p-8 text-red-600">
                <h2>Error rendering /companies page</h2>
                <pre>{String(error)}</pre>
            </div>
        );
    }
} 