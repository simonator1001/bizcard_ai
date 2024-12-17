import { useState, useEffect } from 'react';
import { NewsService, NewsArticle, Company } from '@/lib/news-service';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

export default function NewsPage() {
  useEffect(() => {
    console.log('NewsPage: Component mounted');
    return () => console.log('NewsPage: Component unmounted');
  }, []);

  const [loading, setLoading] = useState(true);
  const [newsMap, setNewsMap] = useState<Record<string, NewsArticle[]>>({});
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompanies, setSelectedCompanies] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [articlesPerCompany, setArticlesPerCompany] = useState(3);
  const [allCompanies, setAllCompanies] = useState<Company[]>([]);
  const [error, setError] = useState<string | null>(null);

  const newsService = new NewsService();

  useEffect(() => {
    console.log('Selected companies changed:', selectedCompanies);
  }, [selectedCompanies]);

  useEffect(() => {
    console.log('Articles per company changed:', articlesPerCompany);
  }, [articlesPerCompany]);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    console.log('Loading initial data...');
    try {
      await loadAllCompanies();
      await loadInitialNews();
    } catch (error) {
      console.error('Error loading initial data:', error);
      toast.error('Failed to load initial data');
    }
  };

  const loadAllCompanies = async () => {
    console.log('Loading all companies...');
    try {
      const companies = await newsService.getAllCompanies();
      console.log('Loaded companies:', companies);
      setAllCompanies(companies);
    } catch (error) {
      console.error('Error loading companies:', error);
      toast.error('Failed to load companies');
    }
  };

  const loadInitialNews = async () => {
    console.log('Loading initial news...');
    try {
      setLoading(true);
      setError(null);
      
      const randomCompanies = await newsService.getRandomCompanies(5);
      console.log('Random companies selected:', randomCompanies);
      
      if (randomCompanies.length === 0) {
        toast.error('No companies found in database');
        return;
      }

      setCompanies(randomCompanies);
      setSelectedCompanies(randomCompanies.map(c => c.name));
      
      const news = await newsService.getNewsForCompanies(randomCompanies, 1);
      console.log('Initial news loaded:', news);
      
      const hasNews = Object.values(news).some(articles => articles.length > 0);
      if (!hasNews) {
        toast.warning('No recent news found for selected companies');
      }
      
      setNewsMap(news);
    } catch (error) {
      console.error('Error loading initial news:', error);
      setError('Failed to load news');
      toast.error('Failed to load news');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    await loadInitialNews();
  };

  const handleSearch = async () => {
    if (!selectedCompanies.length) {
      setError('Please select at least one company');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const selectedCompanyObjects = selectedCompanies.map(name => ({ id: name, name }));
      const news = await newsService.getNewsForCompanies(selectedCompanyObjects, articlesPerCompany);
      setNewsMap(news);
    } catch (error) {
      console.error('Error searching news:', error);
      setError('Failed to fetch news');
    } finally {
      setLoading(false);
    }
  };

  const handleCompanySelect = async (companyName: string, checked: boolean) => {
    console.log('Company selection changed:', { companyName, checked });
    
    try {
      const newSelectedCompanies = checked 
        ? [...selectedCompanies, companyName]
        : selectedCompanies.filter(c => c !== companyName);
      
      console.log('New selected companies:', newSelectedCompanies);
      setSelectedCompanies(newSelectedCompanies);

      if (newSelectedCompanies.length > 0) {
        setLoading(true);
        toast.info('Fetching news...');
        
        const selectedCompanyObjects = newSelectedCompanies.map(name => ({ id: name, name }));
        const news = await newsService.getNewsForCompanies(selectedCompanyObjects, articlesPerCompany);
        
        console.log('News fetched:', news);
        setNewsMap(news);
        toast.success('News updated');
      } else {
        setNewsMap({});
      }
    } catch (error) {
      console.error('Error handling company selection:', error);
      toast.error('Failed to fetch news');
    } finally {
      setLoading(false);
    }
  };

  const filteredCompanies = allCompanies.filter(company =>
    company.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const renderCompanyList = () => (
    <div className="max-h-[200px] overflow-y-auto border rounded-md p-4 mb-4">
      {filteredCompanies.length === 0 ? (
        <div className="text-gray-500 text-center py-2">
          No companies found
        </div>
      ) : (
        filteredCompanies.map((company) => (
          <div 
            key={company.id} 
            className="flex items-center space-x-2 py-2 hover:bg-gray-50 cursor-pointer"
            onClick={() => {
              console.log('Company clicked:', company.name);
              handleCompanySelect(company.name, !selectedCompanies.includes(company.name));
            }}
          >
            <Checkbox
              id={`company-${company.id}`}
              checked={selectedCompanies.includes(company.name)}
              onCheckedChange={(checked) => {
                console.log('Checkbox changed:', { company: company.name, checked });
                handleCompanySelect(company.name, checked as boolean);
              }}
              className="cursor-pointer"
            />
            <label
              htmlFor={`company-${company.id}`}
              className="flex-1 cursor-pointer"
            >
              {company.name}
              {company.name_zh && (
                <span className="text-gray-500 ml-2">({company.name_zh})</span>
              )}
            </label>
          </div>
        ))
      )}
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Latest News</CardTitle>
          <CardDescription>
            Stay updated with the latest news about companies in your network
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 mb-6">
            <div className="flex-1 min-w-[200px]">
              <Input
                placeholder="Search companies..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select
              value={articlesPerCompany.toString()}
              onValueChange={(value) => setArticlesPerCompany(Number(value))}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Articles per company" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="3">3 articles</SelectItem>
                <SelectItem value="5">5 articles</SelectItem>
                <SelectItem value="10">10 articles</SelectItem>
                <SelectItem value="15">15 articles</SelectItem>
              </SelectContent>
            </Select>
            <Button
              onClick={handleRefresh}
              variant="outline"
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Randomize
            </Button>
            <Button 
              onClick={() => setSelectedCompanies([])}
              variant="outline"
            >
              Clear Selection
            </Button>
          </div>

          {renderCompanyList()}

          {selectedCompanies.length > 0 && (
            <div className="flex justify-between items-center mt-4">
              <div className="text-sm text-gray-600">
                {selectedCompanies.length} {selectedCompanies.length === 1 ? 'company' : 'companies'} selected
              </div>
              <Button onClick={handleSearch}>
                Fetch News
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-md mb-6">
          {error}
        </div>
      )}

      <AnimatePresence>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {Object.entries(newsMap).map(([company, articles]) => (
            articles.map((article, index) => (
              <motion.div
                key={article.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="h-full flex flex-col hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between mb-2">
                      <span className="bg-primary/10 text-primary px-2 py-1 rounded-full text-sm">
                        {company}
                      </span>
                      <span className="text-gray-500 text-sm">
                        {new Date(article.publishedDate).toLocaleDateString()}
                      </span>
                    </div>
                    <CardTitle className="text-lg">
                      <a
                        href={article.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-primary transition-colors"
                      >
                        {article.title}
                      </a>
                    </CardTitle>
                    <CardDescription>{article.source}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1">
                    <p className="text-sm text-gray-600">
                      {article.summary}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          ))}
        </div>
      </AnimatePresence>

      {loading && (
        <div className="fixed inset-0 bg-black/10 backdrop-blur-sm flex items-center justify-center">
          <Card className="w-[300px]">
            <CardContent className="flex flex-col items-center justify-center p-6">
              <Loader2 className="h-8 w-8 animate-spin mb-4" />
              <p className="text-sm text-gray-500">Fetching latest news...</p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
} 