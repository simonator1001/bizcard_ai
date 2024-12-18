import { useState } from 'react';
import { Select, Button, Input, Tag, Card, Spin } from 'antd';
import { SearchOutlined, SyncOutlined, ClearOutlined } from '@ant-design/icons';

interface Company {
  value: string;
  label: string;
}

interface NewsArticle {
  title: string;
  summary: string;
  url: string;
  publishedDate: string;
  source: string;
  company: string;
}

export default function NewsPage() {
  const [selectedCompanies, setSelectedCompanies] = useState<string[]>([]);
  const [articleCount, setArticleCount] = useState<number>(3);
  const [loading, setLoading] = useState(false);
  const [articles, setArticles] = useState<NewsArticle[]>([]);

  const articleCountOptions = [
    { value: 3, label: '3 articles' },
    { value: 5, label: '5 articles' },
    { value: 10, label: '10 articles' },
    { value: 15, label: '15 articles' },
  ];

  const handleFetchNews = async () => {
    setLoading(true);
    try {
      const responses = await Promise.all(
        selectedCompanies.map(company =>
          fetch('/api/news', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ company, count: articleCount })
          }).then(res => res.json())
        )
      );
      
      const allArticles = responses.flatMap(response => response.articles);
      setArticles(allArticles);
    } catch (error) {
      console.error('Error fetching news:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRandomize = async () => {
    // Implementation for randomizing companies
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6 sticky top-4 z-10">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Company News</h1>
          
          {/* Top Controls Row */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-4">
            <div className="md:col-span-5">
              <Select
                mode="multiple"
                placeholder="Select companies"
                value={selectedCompanies}
                onChange={setSelectedCompanies}
                className="w-full"
                maxTagCount={3}
                showSearch
              />
            </div>
            
            <div className="md:col-span-4">
              <Input
                prefix={<SearchOutlined className="text-gray-400" />}
                placeholder="Search news..."
                className="w-full"
              />
            </div>
            
            <div className="md:col-span-3">
              <Select
                value={articleCount}
                onChange={setArticleCount}
                options={articleCountOptions}
                className="w-full"
              />
            </div>
          </div>
          
          {/* Action Buttons Row */}
          <div className="flex flex-wrap gap-3 justify-end">
            <Button
              type="primary"
              onClick={handleFetchNews}
              className="bg-blue-600 hover:bg-blue-700"
              icon={<SearchOutlined />}
            >
              Fetch News
            </Button>
            
            <Button
              onClick={handleRandomize}
              icon={<SyncOutlined />}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              Randomize Companies
            </Button>
            
            <Button
              onClick={() => setSelectedCompanies([])}
              icon={<ClearOutlined />}
              className="border-gray-300"
            >
              Clear Selection
            </Button>
          </div>
        </div>

        {/* News Grid */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Spin size="large" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {articles.map((article, index) => (
              <Card
                key={index}
                hoverable
                className="overflow-hidden transition-transform duration-200 hover:-translate-y-1"
              >
                <div className="flex flex-col h-full">
                  <h3 className="text-lg font-semibold mb-2 line-clamp-2">
                    <a
                      href={article.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-900 hover:text-blue-600"
                    >
                      {article.title}
                    </a>
                  </h3>
                  
                  <p className="text-gray-600 mb-4 line-clamp-3">
                    {article.summary}
                  </p>
                  
                  <div className="mt-auto">
                    <div className="flex flex-wrap gap-2 mb-2">
                      <Tag color="blue">{article.company}</Tag>
                      <Tag color="green">{article.source}</Tag>
                    </div>
                    
                    <div className="text-sm text-gray-500">
                      {new Date(article.publishedDate).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 