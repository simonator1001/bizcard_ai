'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useBusinessCards } from '@/lib/hooks/useBusinessCards';
import { NewsArticle } from '@/types/news-article';
import { NewsCard } from './NewsCard';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { useTranslation } from 'react-i18next';

export function NewsView() {
  const { t } = useTranslation();
  const { cards } = useBusinessCards();
  const [selectedCompanies, setSelectedCompanies] = useState<string[]>([]);
  const [newsFilter, setNewsFilter] = useState<'all' | 'related'>('all');
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState<NewsArticle | null>(null);
  const hasInitialized = useRef(false);

  const fetchNews = async (companies: string[]) => {
    if (companies.length === 0) return;

    setLoading(true);
    try {
      const response = await fetch('/api/news', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ companies }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch news');
      }

      const data = await response.json();
      setArticles(data);
    } catch (error) {
      console.error('Error fetching news:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (newsFilter === 'related' && selectedCompanies.length > 0) {
      fetchNews(selectedCompanies);
    }
  }, [newsFilter, selectedCompanies]);

  useEffect(() => {
    if (!hasInitialized.current && cards.length > 0) {
      // Get unique company names, filtering out undefined values
      const uniqueCompanies = Array.from(
        new Set(
          cards
            .map(card => card.company)
            .filter((company): company is string => company !== undefined)
        )
      );

      // Randomly select up to 5 companies
      const randomCompanies = uniqueCompanies
        .sort(() => Math.random() - 0.5)
        .slice(0, 5);

      setSelectedCompanies(randomCompanies);
      fetchNews(randomCompanies);
      hasInitialized.current = true;
    }
  }, [cards]);

  const handleCompanySelect = (company: string) => {
    setSelectedCompanies(prev => {
      const newSelection = prev.includes(company)
        ? prev.filter(c => c !== company)
        : [...prev, company];
      return newSelection;
    });
  };

  // Get unique companies, filtering out undefined values
  const uniqueCompanies = Array.from(
    new Set(
      cards
        .map(card => card.company)
        .filter((company): company is string => company !== undefined)
    )
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold">{t('news.title')}</h2>
        <div className="flex items-center gap-4">
          <Select value={newsFilter} onValueChange={(value: 'all' | 'related') => setNewsFilter(value)}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder={t('news.filter.placeholder')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('news.filter.all')}</SelectItem>
              <SelectItem value="related">{t('news.filter.related')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {newsFilter === 'related' && (
        <Card>
          <CardHeader>
            <CardTitle>{t('news.companies.title')}</CardTitle>
            <CardDescription>
              {t('news.companies.description')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[200px]">
              <div className="space-y-2">
                {uniqueCompanies.map(company => (
                  <div
                    key={company}
                    className="flex items-center space-x-2"
                  >
                    <input
                      type="checkbox"
                      id={company}
                      checked={selectedCompanies.includes(company)}
                      onChange={() => handleCompanySelect(company)}
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <label
                      htmlFor={company}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {company}
                    </label>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-24 w-full" />
              </CardContent>
            </Card>
          ))
        ) : articles.length === 0 ? (
          <div className="col-span-full text-center text-gray-500">
            {t('news.noArticles')}
          </div>
        ) : (
          articles.map((article, index) => (
            <NewsCard
              key={index}
              article={article}
              onClick={() => setSelectedArticle(article)}
            />
          ))
        )}
      </div>
    </div>
  );
} 