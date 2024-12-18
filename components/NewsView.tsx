import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { supabase } from '@/lib/supabase-client'
import { toast } from 'sonner'
import { BusinessCard } from '@/types/business-card'
import { Checkbox } from '@/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu'
import { ChevronDown, Search } from 'lucide-react'
import { ScrollArea } from "@/components/ui/scroll-area"
import { CompanySelect } from './CompanySelect'

interface NewsViewProps {
  cards: BusinessCard[]
  onUpgradeToPro: () => void
}

interface EmployeeMention {
  name: string
  title: string
  company: string
}

interface NewsArticle {
  title: string
  summary: string
  url: string
  publishedDate: string
  source: string
  company: string
  mentionedEmployees?: EmployeeMention[]
}

export function NewsView({ cards, onUpgradeToPro }: NewsViewProps) {
  const [selectedCompanies, setSelectedCompanies] = useState<string[]>([])
  const [newsArticles, setNewsArticles] = useState<NewsArticle[]>([])
  const [articlesPerCompany, setArticlesPerCompany] = useState(3)
  const [isLoading, setIsLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [companySearchTerm, setCompanySearchTerm] = useState('')
  const [showCompanySelect, setShowCompanySelect] = useState(false)

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
        const maxRetries = 3
        
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

            if (!Array.isArray(data.articles)) {
              throw new Error('Invalid response format: articles not found')
            }
            
            return data.articles.map((article: NewsArticle) => ({
              ...article,
              company
            }))
          } catch (e) {
            console.error(`Attempt ${i + 1} failed for ${company}:`, e)
            if (i === maxRetries - 1) throw e
            await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)))
          }
        }
      })

      const results = await Promise.allSettled(newsPromises)
      const successfulArticles = results
        .filter((result): result is PromiseFulfilledResult<NewsArticle[]> => 
          result.status === 'fulfilled'
        )
        .map(result => result.value)
        .flat()

      if (successfulArticles.length === 0) {
        toast.error('No news articles found for any selected company')
      } else {
        setNewsArticles(successfulArticles)
      }
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

  // Filter companies based on search term
  const filteredCompanies = uniqueCompanies.filter(company =>
    company.toLowerCase().includes(companySearchTerm.toLowerCase())
  )

  const handleCompanyToggle = (company: string) => {
    setSelectedCompanies(prev => {
      if (prev.includes(company)) {
        return prev.filter(c => c !== company)
      } else {
        return [...prev, company]
      }
    })
  }

  return (
    <Card className="backdrop-blur-sm bg-white/90 shadow-lg border-0">
      <CardHeader>
        <CardTitle className="text-3xl font-bold">Company News</CardTitle>
        
        {/* Main Controls Container */}
        <div className="space-y-4 mt-4">
          {/* Top Row - Company Selection */}
          <div className="flex flex-col gap-2">
            <Button
              variant="outline"
              className="w-full md:w-[400px] justify-between"
              onClick={() => setShowCompanySelect(true)}
            >
              <span>
                {selectedCompanies.length 
                  ? `${selectedCompanies.length} companies selected`
                  : "Select Companies"
                }
              </span>
              <ChevronDown className="ml-2 h-4 w-4" />
            </Button>

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

          {/* Bottom Row - Controls */}
          <div className="flex flex-wrap items-center gap-4">
            <Input
              placeholder="Search news..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full md:w-[200px]"
            />
            <Select 
              value={articlesPerCompany.toString()}
              onValueChange={(value) => setArticlesPerCompany(parseInt(value))}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Articles per company" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="3">3 articles</SelectItem>
                <SelectItem value="5">5 articles</SelectItem>
                <SelectItem value="10">10 articles</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex gap-2 ml-auto">
              <Button onClick={handleRandomize}>
                Randomize Companies
              </Button>
              {selectedCompanies.length > 0 && (
                <Button 
                  onClick={() => fetchNews(selectedCompanies)}
                  className="whitespace-nowrap"
                >
                  Fetch News
                </Button>
              )}
            </div>
          </div>
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
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                    <span>{article.source}</span>
                    <span>{new Date(article.publishedDate).toLocaleDateString()}</span>
                  </div>
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
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
} 