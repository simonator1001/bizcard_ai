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
import { Search, RefreshCw, Calendar, SlidersHorizontal, ArrowUpAZ, ArrowDownAZ } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from '@/lib/supabase-client';
import { NewsTimeline } from './NewsTab';
import { motion, AnimatePresence } from 'framer-motion';

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

// Holographic/3D Glass effect component
const HoloGlassPanel = ({ children, className }: { children: React.ReactNode, className?: string }) => {
  return (
    <div className={`relative rounded-2xl overflow-hidden shadow-2xl border-2 border-transparent bg-gradient-to-br from-[#a1c4fd]/60 via-[#c2e9fb]/40 to-[#fbc2eb]/60 p-1 ${className}`} style={{ boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)' }}>
      <div className="absolute inset-0 bg-gradient-to-br from-white/60 via-white/10 to-white/5 pointer-events-none" style={{ mixBlendMode: 'overlay' }} />
      <div className="relative z-10 backdrop-blur-2xl bg-white/40 rounded-2xl p-6">
        {children}
      </div>
      {/* Glass reflection */}
      <div className="absolute left-0 top-0 w-1/2 h-1/4 bg-white/30 rounded-tl-2xl blur-lg opacity-60 pointer-events-none" />
      <div className="absolute right-0 bottom-0 w-1/3 h-1/6 bg-white/20 rounded-br-2xl blur-md opacity-40 pointer-events-none" />
    </div>
  );
};

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
      <HoloGlassPanel>
        <div className="flex flex-col gap-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-[#a1c4fd] via-[#c2e9fb] to-[#fbc2eb] bg-clip-text text-transparent drop-shadow-[0_2px_8px_rgba(161,196,253,0.5)]">
                {t('news.title')}
              </h2>
              <p className="text-muted-foreground mt-1 text-lg font-medium">
                Stay updated with news about your network
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="relative flex items-center">
                <span className="absolute inline-flex h-6 w-6 rounded-full bg-gradient-to-br from-[#a1c4fd] via-[#fbc2eb] to-[#c2e9fb] opacity-70 animate-pulse" />
                <span className="relative z-10 px-3 py-1 rounded-full bg-white/60 text-xs font-bold text-[#7f53ac] shadow-md border border-white/40 animate-holo-shimmer" style={{ background: 'linear-gradient(90deg, #a1c4fd 0%, #fbc2eb 100%)', boxShadow: '0 0 16px #a1c4fd55' }}>
                  Live Updates
                </span>
              </span>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-[auto_1fr] gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <CompanySelect 
                companies={uniqueCompanies}
                selectedCompanies={selectedCompanies}
                onSelect={handleCompanySelect}
              />
              <Button 
                onClick={selectRandomCompanies} 
                variant="outline"
                className="gap-2 rounded-xl bg-white/60 shadow-lg border-2 border-transparent hover:border-[#a1c4fd] hover:bg-gradient-to-br hover:from-[#a1c4fd]/30 hover:to-[#fbc2eb]/30 text-[#7f53ac] font-semibold transition-all duration-300"
              >
                <RefreshCw className="h-4 w-4 text-[#a1c4fd]" />
                Random
              </Button>
              <Select 
                value={articlesPerCompany.toString()} 
                onValueChange={(value) => setArticlesPerCompany(Number(value))}
              >
                <SelectTrigger className="w-[140px] rounded-xl bg-white/60 shadow-lg border-2 border-transparent hover:border-[#a1c4fd] hover:bg-gradient-to-br hover:from-[#a1c4fd]/30 hover:to-[#fbc2eb]/30 text-[#7f53ac] font-semibold transition-all duration-300">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-[#a1c4fd]" />
                    <SelectValue placeholder="Articles" />
                  </div>
                </SelectTrigger>
                <SelectContent className="bg-white/90 rounded-xl border-2 border-[#a1c4fd]/30 shadow-xl">
                  <SelectItem value="3">3 articles</SelectItem>
                  <SelectItem value="5">5 articles</SelectItem>
                  <SelectItem value="10">10 articles</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={sortBy}
                onValueChange={(value: 'date' | 'company') => setSortBy(value)}
              >
                <SelectTrigger className="w-[140px] rounded-xl bg-white/60 shadow-lg border-2 border-transparent hover:border-[#a1c4fd] hover:bg-gradient-to-br hover:from-[#a1c4fd]/30 hover:to-[#fbc2eb]/30 text-[#7f53ac] font-semibold transition-all duration-300">
                  <div className="flex items-center gap-2">
                    <SlidersHorizontal className="h-4 w-4 text-[#a1c4fd]" />
                    <SelectValue placeholder="Sort by" />
                  </div>
                </SelectTrigger>
                <SelectContent className="bg-white/90 rounded-xl border-2 border-[#a1c4fd]/30 shadow-xl">
                  <SelectItem value="date">Sort by Date</SelectItem>
                  <SelectItem value="company">Sort by Company</SelectItem>
                </SelectContent>
              </Select>
              <Button 
                variant="outline" 
                onClick={() => setSortOrder(order => order === 'asc' ? 'desc' : 'asc')}
                size="icon"
                className="w-10 h-10 rounded-xl bg-white/60 shadow-lg border-2 border-transparent hover:border-[#a1c4fd] hover:bg-gradient-to-br hover:from-[#a1c4fd]/30 hover:to-[#fbc2eb]/30 text-[#7f53ac] font-semibold transition-all duration-300"
              >
                {sortOrder === 'asc' ? 
                  <ArrowUpAZ className="h-4 w-4 text-[#a1c4fd]" /> : 
                  <ArrowDownAZ className="h-4 w-4 text-[#a1c4fd]" />
                }
              </Button>
            </div>
            {selectedCompanies.length > 0 && (
              <div className="flex flex-wrap gap-2 items-center">
                <div className="text-sm text-muted-foreground">
                  Selected:
                </div>
                <AnimatePresence>
                  {selectedCompanies.map(company => (
                    <motion.div
                      key={company}
                      initial={{ opacity: 0, scale: 0.8, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.8, y: 10 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Badge
                        variant="secondary"
                        className="px-3 py-1 rounded-xl bg-gradient-to-r from-[#a1c4fd]/30 to-[#fbc2eb]/30 text-[#7f53ac] border border-[#a1c4fd]/30 shadow-md font-semibold transition-all duration-300"
                      >
                        {company}
                        <button
                          className="ml-2 text-[#a1c4fd] hover:text-[#fbc2eb] transition-colors"
                          onClick={() => handleCompanySelect(company)}
                        >
                          ×
                        </button>
                      </Badge>
                    </motion.div>
                  ))}
                </AnimatePresence>
                {selectedCompanies.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedCompanies([])}
                    className="text-[#a1c4fd] hover:text-[#fbc2eb] hover:bg-gradient-to-r hover:from-[#a1c4fd]/10 hover:to-[#fbc2eb]/10 rounded-xl font-semibold transition-colors"
                  >
                    Clear all
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </HoloGlassPanel>

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
          <NewsTimeline articles={sortedArticles} />
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