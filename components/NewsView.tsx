import { useState, useCallback, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Search, Loader2, Star } from 'lucide-react'
import { mockNewsData } from '@/lib/mock-data'

interface BusinessCard {
  id: string
  name: string
  company: string
  position: string
  email: string
  phone: string
  description: string
  imageUrl: string
}

interface NewsArticle {
  id: string
  title: string
  url: string
  publishedAt: string
  source: string
  summary: string
  companies: string[]
  industry: string
  thumbnailUrl: string
}

interface NewsViewProps {
  cards: BusinessCard[]
  onUpgradeToPro: () => void
}

export function NewsView({ cards, onUpgradeToPro }: NewsViewProps) {
  const [newsArticles, setNewsArticles] = useState<NewsArticle[]>(mockNewsData)
  const [loading, setLoading] = useState(false)
  const [selectedCompany, setSelectedCompany] = useState<string>('placeholder')
  const [selectedIndustry, setSelectedIndustry] = useState<string>('placeholder')
  const [searchTerm, setSearchTerm] = useState('')

  const companies = Array.from(new Set(cards.map(card => card.company))).filter(Boolean)
  const industries = Array.from(new Set(mockNewsData.map(article => article.industry))).filter(Boolean)

  const filteredArticles = newsArticles.filter(article => 
    (selectedCompany === 'placeholder' || article.companies.includes(selectedCompany)) &&
    (selectedIndustry === 'placeholder' || article.industry === selectedIndustry) &&
    (searchTerm === '' || 
     article.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
     article.summary.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">Latest News</h1>
        <p className="text-lg text-gray-600">
          Stay updated with the latest news about companies in your network
        </p>
      </div>

      <div className="flex flex-wrap gap-4 mb-6">
        <Select value={selectedCompany} onValueChange={setSelectedCompany}>
          <SelectTrigger className="w-[200px]">
            <SelectValue>
              {selectedCompany === 'placeholder' ? 'All Companies' : selectedCompany}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="placeholder">All Companies</SelectItem>
            {companies.map(company => (
              company && (
                <SelectItem key={company} value={company}>
                  {company}
                </SelectItem>
              )
            ))}
          </SelectContent>
        </Select>

        <Select value={selectedIndustry} onValueChange={setSelectedIndustry}>
          <SelectTrigger className="w-[200px]">
            <SelectValue>
              {selectedIndustry === 'placeholder' ? 'All Industries' : selectedIndustry}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="placeholder">All Industries</SelectItem>
            {industries.map(industry => (
              industry && (
                <SelectItem key={industry} value={industry}>
                  {industry}
                </SelectItem>
              )
            ))}
          </SelectContent>
        </Select>

        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <Input
            type="search"
            placeholder="Search articles..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 w-full"
          />
        </div>
      </div>

      <ScrollArea className="h-[calc(100vh-320px)]">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredArticles.map(article => (
            <div key={article.id} className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-6">
                <div className="flex items-start space-x-4 mb-4">
                  <img 
                    src={article.thumbnailUrl} 
                    alt={article.title} 
                    className="w-20 h-20 object-cover rounded-md"
                  />
                  <div>
                    <h3 className="text-xl font-semibold mb-1">{article.title}</h3>
                    <p className="text-sm text-gray-500">
                      {new Date(article.publishedAt).toLocaleDateString()} - {article.source}
                    </p>
                  </div>
                </div>
                <p className="text-gray-600 mb-4">{article.summary}</p>
                <div className="flex justify-between items-center">
                  <div className="flex gap-2">
                    {article.companies.map(company => (
                      <span 
                        key={company} 
                        className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full"
                      >
                        {company}
                      </span>
                    ))}
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <a href={article.url} target="_blank" rel="noopener noreferrer">
                      Read More
                    </a>
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      <div className="mt-8 text-center">
        <Button 
          onClick={onUpgradeToPro}
          className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
        >
          <Star className="mr-2 h-4 w-4" /> Upgrade to Pro for More Features
        </Button>
      </div>
    </div>
  )
} 