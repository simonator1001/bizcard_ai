'use client';

import React, { useEffect, useState } from 'react';
import { useCompanyTracking } from '@/contexts/CompanyTrackingContext';
import { NewsArticle } from '@/types/company-tracking';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
export function NewsFeed() {
    const { state, markAlertAsRead, getNewsFeed } = useCompanyTracking();
    const [articles, setArticles] = useState<NewsArticle[]>([]);
    const [selectedCompany, setSelectedCompany] = useState<string>('');
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadNewsFeed();
    }, [selectedCompany, page]);

    const loadNewsFeed = async () => {
        try {
            setLoading(true);
            console.log('[NewsFeed] Fetching news feed for company:', selectedCompany || 'all companies');
            
            const data = await getNewsFeed(selectedCompany || undefined);
            console.log('[NewsFeed] Successfully fetched news feed:', data);
            setArticles(data || []);
        } catch (error) {
            console.error('[NewsFeed] Error loading news feed:', error);
            toast.error('Failed to load news feed');
        } finally {
            setLoading(false);
        }
    };

    const handleMarkAsRead = async (alertId: string) => {
        try {
            await markAlertAsRead(alertId);
            toast.success('Marked as read');
        } catch (error) {
            toast.error('Failed to mark as read');
        }
    };

    if (loading) {
        return <div>Loading news feed...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">News Feed</h2>
                <Select
                    value={selectedCompany}
                    onValueChange={setSelectedCompany}
                >
                    <SelectTrigger className="w-64">
                        <SelectValue placeholder="Select company" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="__all__">All Companies</SelectItem>
                        {state.trackedCompanies.filter(company => typeof company.id === 'string' && company.id).map((company) => (
                            <SelectItem key={company.id} value={company.id}>
                                {company.company_name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="space-y-4">
                {articles.map((article) => (
                    <Card key={article.id} className="p-4">
                        <div className="flex justify-between items-start">
                            <div>
                                <h3 className="text-lg font-semibold">
                                    {article.title}
                                </h3>
                                <p className="text-sm text-gray-500 mt-1">
                                    {new Date(article.published_at).toLocaleDateString()}
                                </p>
                                {article.content && (
                                    <p className="mt-2 text-gray-700">
                                        {article.content}
                                    </p>
                                )}
                                <div className="mt-2 space-x-2">
                                    {article.categories.map((category) => (
                                        <Badge key={category}>{category}</Badge>
                                    ))}
                                </div>
                                {article.url && (
                                    <a
                                        href={article.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-500 hover:underline mt-2 inline-block"
                                    >
                                        Read more
                                    </a>
                                )}
                            </div>
                        </div>
                    </Card>
                ))}
            </div>

            {articles.length === 0 && (
                <div className="text-center text-gray-500 py-8">
                    No news articles found
                </div>
            )}

            <div className="flex justify-center space-x-2">
                <Button
                    variant="outline"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                >
                    Previous
                </Button>
                <Button
                    variant="outline"
                    onClick={() => setPage((p) => p + 1)}
                    disabled={articles.length < 10}
                >
                    Next
                </Button>
            </div>
        </div>
    );
} 