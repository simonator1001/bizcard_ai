import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { supabase } from '@/lib/supabase-client'
import { toast } from 'sonner'
import { BusinessCard } from '@/types/business-card'

interface NewsViewProps {
  cards: BusinessCard[]
  onUpgradeToPro: () => void
}

interface NewsArticle {
  title: string
  summary: string
  url: string
  publishedDate: string
  source: string
  company: string
}

export function NewsView({ cards, onUpgradeToPro }: NewsViewProps) {
  const [selectedCompanies, setSelectedCompanies] = useState<string[]>([])
  const [newsArticles, setNewsArticles] = useState<NewsArticle[]>([])
  const [articlesPerCompany, setArticlesPerCompany] = useState(3)
  const [isLoading, setIsLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  // Get unique companies from cards
  const uniqueCompanies = Array.from(new Set(cards.map(card => card.company))).filter(Boolean)

  // Fetch news on component mount for 5 random companies
  useEffect(() => {
    const randomCompanies = uniqueCompanies
      .sort(() => Math.random() - 0.5)
      .slice(0, 5)
    
    setSelectedCompanies(randomCompanies)
    fetchNews(randomCompanies)
  }, [])

  const fetchNews = async (companies: string[]) => {
    setIsLoading(true)
    try {
      const newsPromises = companies.map(async (company) => {
        // Add retry logic
        const maxRetries = 3
        let lastError
        
        for (let i = 0; i < maxRetries; i++) {
          try {
            const response = await fetch('/api/news', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                company,
                count: articlesPerCompany
              })
            })

            const data = await response.json()
            
            if (!response.ok) {
              throw new Error(data.details || data.error || 'Failed to fetch news')
            }
            
            return data.articles.map((article: NewsArticle) => ({
              ...article,
              company
            }))
          } catch (e) {
            lastError = e
            if (i === maxRetries - 1) throw e
            // Wait before retrying
            await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)))
          }
        }
      })

      const allArticles = await Promise.all(newsPromises)
      setNewsArticles(allArticles.flat())
    } catch (error) {
      console.error('Error fetching news:', error)
      toast.error(
        error instanceof Error 
          ? `Error: ${error.message}` 
          : 'Failed to fetch news articles'
      )
    } finally {
      setIsLoading(false)
    }
  }

  const handleRandomize = () => {
    const randomCompanies = uniqueCompanies
      .sort(() => Math.random() - 0.5)
      .slice(0, 5)
    setSelectedCompanies(randomCompanies)
    fetchNews(randomCompanies)
  }

  const filteredArticles = newsArticles.filter(article => 
    article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    article.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
    article.company.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <Card className="backdrop-blur-sm bg-white/90 shadow-lg border-0">
      <CardHeader>
        <CardTitle className="text-3xl font-bold">Company News</CardTitle>
        <div className="flex items-center gap-4 mt-4">
          <Input
            placeholder="Search news..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
          <Select 
            value={articlesPerCompany.toString()}
            onValueChange={(value) => setArticlesPerCompany(parseInt(value))}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Articles per company" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="3">3 articles</SelectItem>
              <SelectItem value="5">5 articles</SelectItem>
              <SelectItem value="10">10 articles</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleRandomize}>
            Randomize Companies
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="flex justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredArticles.map((article, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-4">
                  <div className="font-semibold mb-2 hover:text-primary">
                    <a href={article.url} target="_blank" rel="noopener noreferrer">
                      {article.title}
                    </a>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{article.summary}</p>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{article.source}</span>
                    <span>{new Date(article.publishedDate).toLocaleDateString()}</span>
                  </div>
                  <div className="mt-2">
                    <span className="inline-block bg-primary/10 text-primary rounded-full px-2 py-1 text-xs">
                      {article.company}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
} 