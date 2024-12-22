'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronDown } from 'lucide-react';
import { CompanySelect } from '@/components/shared/CompanySelect';
import { BusinessCard } from '@/types/business-card';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTranslation } from 'react-i18next';

interface NewsViewProps {
  cards: BusinessCard[];
  onUpgradeToPro: () => void;
}

interface EmployeeMention {
  name: string;
  title: string;
  company: string;
}

interface NewsArticle {
  title: string;
  summary: string;
  url: string;
  publishedDate: string;
  source: string;
  company: string;
  imageUrl?: string;
  mentionedEmployees?: EmployeeMention[];
}

export function NewsView({ cards, onUpgradeToPro }: NewsViewProps) {
  const { t } = useTranslation();
  const [selectedCompanies, setSelectedCompanies] = useState<string[]>([]);
  const [newsArticles, setNewsArticles] = useState<NewsArticle[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [companySearchTerm, setCompanySearchTerm] = useState('');
  const [showCompanySelect, setShowCompanySelect] = useState(false);
  const [articlesPerCompany, setArticlesPerCompany] = useState(3);
  const hasInitialized = useRef(false);

  // Get unique companies from cards
  const uniqueCompanies = Array.from(new Set(cards.map(card => card.company))).filter(Boolean);

  const fetchNews = async (companies: string[]) => {
    if (companies.length === 0) {
      setNewsArticles([]);
      return;
    }

    setIsLoading(true);
    try {
      const newsPromises = companies.map(async (company) => {
        try {
          const response = await fetch('/api/news', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
              'Cache-Control': 'no-cache',
            },
            body: JSON.stringify({
              company,
              count: articlesPerCompany
            })
          });

          if (!response.ok) {
            console.error('News API error:', response.status, response.statusText);
            const errorText = await response.text();
            console.error('Error details:', errorText);
            return [];
          }

          const data = await response.json();
          
          if (!Array.isArray(data.articles)) {
            console.error('Invalid response format:', data);
            return [];
          }
          
          return data.articles.map((article: NewsArticle) => ({
            ...article,
            company: company
          }));
        } catch (e) {
          console.error(`Error fetching news for ${company}:`, e);
          return [];
        }
      });

      const results = await Promise.all(newsPromises);
      const articles = results.flat().filter(Boolean);

      if (articles.length === 0) {
        toast.error('No news articles found for any selected company');
      } else {
        setNewsArticles(articles);
      }
    } catch (error) {
      console.error('Error fetching news:', error);
      toast.error('Failed to fetch news articles');
    } finally {
      setIsLoading(false);
    }
  };

  // Initialize with random companies only once
  useEffect(() => {
    if (!hasInitialized.current && uniqueCompanies.length > 0) {
      const randomCompanies = uniqueCompanies
        .sort(() => Math.random() - 0.5)
        .slice(0, 5);
      setSelectedCompanies(randomCompanies);
      fetchNews(randomCompanies);
      hasInitialized.current = true;
    }
  }, [uniqueCompanies]);

  const handleCompanyToggle = (company: string) => {
    setSelectedCompanies(prev => {
      const newSelectedCompanies = prev.includes(company)
        ? prev.filter(c => c !== company)
        : [...prev, company];
      
      // Only fetch if the selection actually changed
      if (JSON.stringify(prev) !== JSON.stringify(newSelectedCompanies)) {
        fetchNews(newSelectedCompanies);
      }
      
      return newSelectedCompanies;
    });
  };

  return (
    <Card className="backdrop-blur-sm bg-white/90 shadow-lg border-0">
      <CardHeader>
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-primary/10 p-2 rounded-lg">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-primary"
            >
              <path d="M18 8V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h8" />
              <path d="M10 19v-3.96 3.15" />
              <path d="M14 19v-6" />
              <path d="M18 19v-8" />
              <path d="M22 19v-11" />
            </svg>
          </div>
          <CardTitle className="text-3xl font-bold">{t('news.title')}</CardTitle>
        </div>
        
        {/* Main Controls Container */}
        <div className="space-y-4 mt-4">
          {/* Controls Row */}
          <div className="flex flex-wrap gap-4 items-center">
            {/* Company Selection */}
            <Button
              variant="outline"
              className="flex-grow md:flex-grow-0 md:w-[400px] justify-between"
              onClick={() => setShowCompanySelect(true)}
            >
              <span>
                {selectedCompanies.length 
                  ? t('news.companiesSelected', { count: selectedCompanies.length })
                  : t('news.noCompanies')
                }
              </span>
              <ChevronDown className="ml-2 h-4 w-4" />
            </Button>

            {/* Articles Per Company Selection */}
            <Select
              value={articlesPerCompany.toString()}
              onValueChange={(value) => {
                setArticlesPerCompany(Number(value));
                if (selectedCompanies.length > 0) {
                  fetchNews(selectedCompanies);
                }
              }}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">{t('news.articlesPerCompany.one')}</SelectItem>
                <SelectItem value="3">{t('news.articlesPerCompany.three')}</SelectItem>
                <SelectItem value="5">{t('news.articlesPerCompany.five')}</SelectItem>
                <SelectItem value="10">{t('news.articlesPerCompany.ten')}</SelectItem>
              </SelectContent>
            </Select>

            {/* Clear All Button */}
            {selectedCompanies.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedCompanies([]);
                  setNewsArticles([]);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                {t('news.clearAll')}
              </Button>
            )}
          </div>

          {/* Selected Companies Tags */}
          {selectedCompanies.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {selectedCompanies.map((company) => (
                <div
                  key={company}
                  className="flex items-center gap-1 bg-gray-100 rounded-full px-3 py-1"
                >
                  <span className="text-sm">{company}</span>
                  <button
                    onClick={() => handleCompanyToggle(company)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardHeader>

      {/* Company Select Modal */}
      {showCompanySelect && (
        <CompanySelect
          companies={uniqueCompanies}
          selectedCompanies={selectedCompanies}
          searchTerm={companySearchTerm}
          onSearchChange={setCompanySearchTerm}
          onCompanyToggle={handleCompanyToggle}
          onClose={() => setShowCompanySelect(false)}
        />
      )}

      <CardContent>
        {isLoading ? (
          <div className="flex justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            <span className="ml-3">{t('news.loading')}</span>
          </div>
        ) : newsArticles.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            {selectedCompanies.length === 0 
              ? t('news.selectCompanies')
              : t('news.noArticles')}
            {selectedCompanies.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchNews(selectedCompanies)}
                className="mt-4"
              >
                {t('actions.tryAgain')}
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {newsArticles.map((article, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-4 flex flex-col gap-3">
                  {/* Article Image */}
                  <div className="relative w-full h-40 bg-gray-100 rounded-lg overflow-hidden">
                    <img
                      src={article.imageUrl || '/images/placeholder-news.jpg'}
                      alt={article.title}
                      className="object-cover w-full h-full hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = '/images/placeholder-news.jpg';
                      }}
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent p-3">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-white font-medium">{article.source}</span>
                        <span className="text-xs text-white/80">{new Date(article.publishedDate).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Article Content */}
                  <div>
                    <a 
                      href={article.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="font-semibold hover:text-primary line-clamp-2 mb-2"
                    >
                      {article.title}
                    </a>
                    <p className="text-sm text-gray-600 mb-2 line-clamp-3">{article.summary}</p>
                    <div className="flex flex-wrap gap-2">
                      <span className="inline-block bg-primary/10 text-primary rounded-full px-2 py-1 text-xs">
                        {article.company}
                      </span>
                      {article.mentionedEmployees?.map((employee, i) => (
                        <span 
                          key={i}
                          className="inline-block bg-secondary/10 text-secondary rounded-full px-2 py-1 text-xs"
                          title={`${employee.title} at ${employee.company}`}
                        >
                          {employee.name}
                        </span>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
} 