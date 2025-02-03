'use client';

import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useBusinessCards } from '@/lib/hooks/useBusinessCards';
import { NewsArticle } from '@/types/news-article';
import { NewsItem } from './NewsItem';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Search, RefreshCw } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from '@/lib/supabase-client';

function CompanySelect({ companies, selectedCompanies, onSelect }: { 
  companies: string[], 
  selectedCompanies: string[], 
  onSelect: (company: string) => void 
}) {
  const [search, setSearch] = useState('');
  
  const filteredCompanies = companies.filter(company =>
    company.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-[200px] justify-between">
          {selectedCompanies.length > 0 ? `${selectedCompanies.length} selected` : 'Select Companies'}
          <Search className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] bg-white border shadow-lg">
        <DialogHeader className="border-b pb-4">
          <DialogTitle className="text-gray-900">Select Companies</DialogTitle>
          <div className="text-sm text-gray-500">
            Choose companies to view their latest news articles. You can select multiple companies.
          </div>
        </DialogHeader>
        <div className="py-4">
          <Input
            type="search"
            placeholder="Search companies..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full"
          />
          <ScrollArea className="h-[300px] mt-4 rounded-md border border-gray-200">
            <div className="p-4 space-y-2">
              {filteredCompanies.map(company => (
                <div
                  key={company}
                  className="flex items-center gap-2 p-2 hover:bg-gray-50 cursor-pointer rounded-md transition-colors"
                  onClick={() => onSelect(company)}
                >
                  <input
                    type="checkbox"
                    checked={selectedCompanies.includes(company)}
                    readOnly
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <span className="text-sm text-gray-900">{company}</span>
                </div>
              ))}
              {filteredCompanies.length === 0 && (
                <div className="text-center text-gray-500">
                  No companies found
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function NewsView() {
  const { t } = useTranslation();
  const { cards } = useBusinessCards();
  const { toast } = useToast();
  const [selectedCompanies, setSelectedCompanies] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [articlesPerCompany, setArticlesPerCompany] = useState(3);
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingCompanies, setLoadingCompanies] = useState<Set<string>>(new Set());
  const [errors, setErrors] = useState<Map<string, string>>(new Map());
  const hasInitialized = useRef(false);
  const [uniqueCompanies, setUniqueCompanies] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'date' | 'company'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [open, setOpen] = useState(false);

  // Add session state
  const [session, setSession] = useState<any>(null);
  const [sessionLoading, setSessionLoading] = useState(true);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (open && !target.closest('.company-dropdown')) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [open]);

  // Extract unique companies from cards
  useEffect(() => {
    const companies = Array.from(new Set(cards?.map(card => card.company)))
      .filter((company): company is string => Boolean(company));
    setUniqueCompanies(companies);
  }, [cards]);

  // Function to select random companies
  const selectRandomCompanies = useCallback(() => {
    if (uniqueCompanies.length === 0) {
      toast({
        title: 'No companies available',
        description: 'Please add some business cards first',
        variant: 'destructive',
      });
      return;
    }

    const shuffled = [...uniqueCompanies].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, Math.min(5, uniqueCompanies.length));
    setSelectedCompanies(selected);
  }, [uniqueCompanies, toast]);

  // Initialize with random companies
  useEffect(() => {
    if (uniqueCompanies.length > 0 && selectedCompanies.length === 0 && !hasInitialized.current) {
      hasInitialized.current = true;
      // Don't auto-select companies
      // selectRandomCompanies();
    }
  }, [uniqueCompanies, selectedCompanies.length, selectRandomCompanies]);

  // Initialize session
  useEffect(() => {
    const initSession = async () => {
      try {
        console.log('[DEBUG] Initializing session...');
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error('[DEBUG] Session error:', error);
          toast({
            title: 'Authentication Error',
            description: 'Please sign in to view news.',
            variant: 'destructive',
          });
          return;
        }
        if (!session) {
          console.log('[DEBUG] No session found');
          toast({
            title: 'Authentication Required',
            description: 'Please sign in to view news.',
            variant: 'destructive',
          });
          return;
        }
        console.log('[DEBUG] Session initialized:', session.user.id);
        setSession(session);
      } catch (error) {
        console.error('[DEBUG] Session initialization error:', error);
        toast({
          title: 'Error',
          description: 'Failed to initialize session.',
          variant: 'destructive',
        });
      } finally {
        setSessionLoading(false);
      }
    };

    initSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log('[DEBUG] Auth state changed:', _event);
      setSession(session);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [toast]);

  // Fetch news for a single company
  const fetchNewsForCompany = async (company: string) => {
    if (!session?.access_token) {
      console.error('[DEBUG] No active session');
      toast({
        title: 'Authentication Required',
        description: 'Please sign in to view news.',
        variant: 'destructive',
      });
      return;
    }

    try {
      console.log('[DEBUG] Starting news fetch for company:', company);
      setLoadingCompanies(prev => new Set([...Array.from(prev), company]));
      setErrors(prev => {
        const next = new Map(prev);
        next.delete(company);
        return next;
      });

      const response = await fetch('/api/news', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ companies: [company], count: articlesPerCompany })
      });

      const data = await response.json();
      console.log('[DEBUG] API response:', { status: response.status, data });

      if (!response.ok) {
        let errorMessage = 'Failed to fetch news';
        if (data.error) {
          errorMessage = data.error;
        }
        throw new Error(errorMessage);
      }

      // Validate response structure
      if (!data || typeof data !== 'object') {
        throw new Error('Invalid response format from server');
      }

      // Handle case where articles array is missing or empty
      if (!data.articles || !Array.isArray(data.articles)) {
        console.log('[DEBUG] No articles returned for company:', company);
        setArticles(prev => {
          // Remove any existing articles for this company
          return prev.filter(article => article.company !== company);
        });
        return;
      }

      const companyArticles = data.articles.filter((article: any) => {
        if (!article || typeof article !== 'object') {
          console.warn('[DEBUG] Invalid article object:', article);
          return false;
        }
        
        if (article.company !== company) {
          console.warn('[DEBUG] Article company mismatch:', { 
            expected: company, 
            got: article.company 
          });
          return false;
        }

        // Validate required fields - only check essential fields
        const requiredFields = ['title', 'summary', 'url'];
        const missingFields = requiredFields.filter(field => !article[field]);
        if (missingFields.length > 0) {
          console.warn('[DEBUG] Article missing required fields:', {
            article,
            missingFields
          });
          return false;
        }

        // Ensure URL is valid
        try {
          new URL(article.url);
        } catch (error) {
          console.warn('[DEBUG] Invalid URL:', article.url);
          return false;
        }

        // Handle optional fields with defaults
        if (!article.publishedDate) {
          article.publishedDate = new Date().toISOString().split('T')[0];
        }

        if (!article.source && article.sourceName) {
          article.source = article.sourceName;
        }

        if (!article.source) {
          article.source = 'News Source';
        }

        return true;
      });

      if (companyArticles.length === 0) {
        console.log('[DEBUG] No valid articles found for company:', company);
        // Instead of throwing an error, just update the UI with a user-friendly message
        setErrors(prev => new Map(prev).set(company, `No news articles found for ${company}`));
        // Remove any existing articles for this company
        setArticles(prev => prev.filter(article => article.company !== company));
        return;
      }

      console.log('[DEBUG] Found articles:', {
        company,
        count: companyArticles.length,
        articles: companyArticles
      });

      setArticles(prev => {
        // Remove old articles for this company
        const filtered = prev.filter(article => article.company !== company);
        // Add new articles with normalized fields
        const newArticles = companyArticles.map((article: NewsArticle) => ({
          ...article,
          source: article.source || (article.sourceName as string) || 'News Source',
          publishedDate: article.publishedDate || new Date().toISOString().split('T')[0],
          imageUrl: article.imageUrl || `https://logo.clearbit.com/${company.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`
        }));
        return [...filtered, ...newArticles];
      });

    } catch (error) {
      console.error('[DEBUG] Error fetching news:', error);
      const message = error instanceof Error ? error.message : 'Failed to fetch news';
      
      setErrors(prev => new Map(prev).set(company, message));
      
      // Only show toast for actual errors, not for "no articles found" case
      if (message !== `No news articles found for ${company}`) {
        toast({
          title: 'Error',
          description: `Failed to fetch news for ${company}: ${message}`,
          variant: 'destructive',
        });
      }
    } finally {
      setLoadingCompanies(prev => {
        const next = new Set(Array.from(prev));
        next.delete(company);
        return next;
      });
    }
  };

  // Fetch news when selected companies change
  useEffect(() => {
    const fetchNews = async () => {
      setLoading(true);
      setArticles([]);
      setErrors(new Map());

      // Fetch news for each company in parallel
      await Promise.all(selectedCompanies.map(fetchNewsForCompany));
      
      setLoading(false);
    };

    if (selectedCompanies.length > 0) {
      fetchNews();
    }
  }, [selectedCompanies, articlesPerCompany]);

  const handleCompanySelect = useCallback((company: string) => {
    setSelectedCompanies(prev => {
      const newSelection = prev.includes(company)
        ? prev.filter(c => c !== company)
        : [...prev, company];
      return newSelection;
    });
  }, []);

  const filteredCompanies = uniqueCompanies.filter(company =>
    company.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Group articles by company
  const articlesByCompany = useMemo(() => {
    const grouped = new Map<string, NewsArticle[]>();
    articles.forEach(article => {
      if (!grouped.has(article.company)) {
        grouped.set(article.company, []);
      }
      grouped.get(article.company)!.push(article);
    });
    return grouped;
  }, [articles]);

  // Sort articles
  const sortedArticles = useMemo(() => {
    return [...articles].sort((a, b) => {
      if (sortBy === 'date') {
        const dateA = new Date(a.publishedDate).getTime();
        const dateB = new Date(b.publishedDate).getTime();
        return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
      } else {
        const companyA = a.company.toLowerCase();
        const companyB = b.company.toLowerCase();
        return sortOrder === 'desc' 
          ? companyB.localeCompare(companyA)
          : companyA.localeCompare(companyB);
      }
    });
  }, [articles, sortBy, sortOrder]);

  // Add click outside handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.company-dropdown')) {
        setSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Show loading state while session is initializing
  if (sessionLoading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-sm text-gray-600">Initializing...</p>
        </div>
      </div>
    );
  }

  // Show error state if no session
  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="text-center">
          <div className="text-red-500 mb-2">⚠️</div>
          <h3 className="text-lg font-semibold mb-2">Authentication Required</h3>
          <p className="text-sm text-gray-600">Please sign in to view news and employee information.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b">
          <div>
            <h2 className="text-3xl font-bold">{t('news.title')}</h2>
            <p className="text-muted-foreground mt-1">
              Stay updated with news about your network
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <CompanySelect 
            companies={uniqueCompanies}
            selectedCompanies={selectedCompanies}
            onSelect={handleCompanySelect}
          />

          <Button 
            onClick={selectRandomCompanies} 
            variant="outline"
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Random
          </Button>

          <Select 
            value={articlesPerCompany.toString()} 
            onValueChange={(value) => setArticlesPerCompany(Number(value))}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Articles" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="3">3 articles</SelectItem>
              <SelectItem value="5">5 articles</SelectItem>
              <SelectItem value="10">10 articles</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={sortBy}
            onValueChange={(value: 'date' | 'company') => setSortBy(value)}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date">Sort by Date</SelectItem>
              <SelectItem value="company">Sort by Company</SelectItem>
            </SelectContent>
          </Select>

          <Button 
            variant="outline" 
            onClick={() => setSortOrder(order => order === 'asc' ? 'desc' : 'asc')}
            size="icon"
            className="w-10 h-10"
          >
            {sortOrder === 'asc' ? '↑' : '↓'}
          </Button>
        </div>

        {selectedCompanies.length > 0 && (
          <div className="flex flex-wrap gap-2 items-center">
            <div className="text-sm text-muted-foreground">
              Selected:
            </div>
            {selectedCompanies.map(company => (
              <Badge
                key={company}
                variant="secondary"
                className="px-3 py-1"
              >
                {company}
                <button
                  className="ml-2 hover:text-destructive"
                  onClick={() => handleCompanySelect(company)}
                >
                  ×
                </button>
              </Badge>
            ))}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedCompanies([])}
              className="text-muted-foreground hover:text-destructive"
            >
              Clear all
            </Button>
          </div>
        )}
      </div>

      <div className="space-y-4">
        {loading || loadingCompanies.size > 0 ? (
          <div className="grid grid-cols-1 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-[120px] w-full" />
            ))}
          </div>
        ) : errors.size > 0 ? (
          <div className="rounded-lg border bg-destructive/10 p-4 text-center text-destructive">
            {Array.from(errors.values())[0]}
          </div>
        ) : sortedArticles.length > 0 ? (
          <div className="grid grid-cols-1 gap-4">
            {sortedArticles.map((article) => (
              <NewsItem
                key={article.id || `${article.company}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`}
                article={article}
                onClick={() => {}}
                showCompany={true}
              />
            ))}
          </div>
        ) : selectedCompanies.length > 0 ? (
          <div className="rounded-lg border bg-muted p-8 text-center text-muted-foreground">
            {t('news.noArticles')}
          </div>
        ) : (
          <div className="rounded-lg border bg-muted p-8 text-center">
            <h3 className="text-lg font-semibold mb-2">No companies selected</h3>
            <p className="text-muted-foreground">
              Select companies to view their latest news
            </p>
          </div>
        )}
      </div>
    </div>
  );
} 