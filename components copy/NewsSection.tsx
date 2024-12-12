import { useNews } from '@/lib/news-context'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Search, Filter, Loader2 } from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useState, useEffect } from 'react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { motion } from 'framer-motion'
import Image from "next/image"
import { NewsPlaceholder } from './NewsPlaceholder'
import { cn } from "@/lib/utils"

export function NewsSection({ companies, people }: { companies: string[], people: string[] }) {
  const { articles, loading, error, fetchNews } = useNews()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedFilters, setSelectedFilters] = useState({
    companies: [] as string[],
    people: [] as string[]
  })

  useEffect(() => {
    fetchNews(companies, people)
  }, [companies, people])

  useEffect(() => {
    console.log('Articles:', articles.map(a => ({
      title: a.title,
      imageUrl: a.imageUrl
    })))
  }, [articles])

  useEffect(() => {
    console.log('Articles with imageUrls:', articles.map(a => ({
      title: a.title,
      imageUrl: a.imageUrl,
      source: a.source
    })))
  }, [articles])

  const filteredArticles = articles.filter(article => {
    const articleText = `${article.title} ${article.snippet}`.toLowerCase()
    const searchMatch = !searchTerm || articleText.includes(searchTerm.toLowerCase())
    
    const companyMatch = selectedFilters.companies.length === 0 || 
      selectedFilters.companies.some(company => articleText.includes(company.toLowerCase()))
    
    const peopleMatch = selectedFilters.people.length === 0 || 
      selectedFilters.people.some(person => articleText.includes(person.toLowerCase()))
    
    return searchMatch && companyMatch && peopleMatch
  })

  return (
    <div className="h-full p-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl font-bold">Related News</CardTitle>
          <CardDescription className="text-lg">
            Stay updated with news about companies and people in your network
          </CardDescription>
          <div className="flex flex-col sm:flex-row gap-4 mt-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                type="search"
                placeholder="Search news..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-[150px]">
                  <Filter className="mr-2 h-4 w-4" />
                  Filter
                  {(selectedFilters.companies.length > 0 || selectedFilters.people.length > 0) && (
                    <Badge variant="secondary" className="ml-2">
                      {selectedFilters.companies.length + selectedFilters.people.length}
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[300px]">
                <DropdownMenuLabel>Companies</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <ScrollArea className="h-[200px] px-2">
                  {companies.map((company) => (
                    <DropdownMenuCheckboxItem
                      key={company}
                      checked={selectedFilters.companies.includes(company)}
                      onCheckedChange={(checked) => {
                        setSelectedFilters(prev => ({
                          ...prev,
                          companies: checked 
                            ? [...prev.companies, company]
                            : prev.companies.filter(c => c !== company)
                        }))
                      }}
                    >
                      {company}
                    </DropdownMenuCheckboxItem>
                  ))}
                </ScrollArea>
                <DropdownMenuSeparator />
                <DropdownMenuLabel>People</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <ScrollArea className="h-[200px] px-2">
                  {people.map((person) => (
                    <DropdownMenuCheckboxItem
                      key={person}
                      checked={selectedFilters.people.includes(person)}
                      onCheckedChange={(checked) => {
                        setSelectedFilters(prev => ({
                          ...prev,
                          people: checked 
                            ? [...prev.people, person]
                            : prev.people.filter(p => p !== person)
                        }))
                      }}
                    >
                      {person}
                    </DropdownMenuCheckboxItem>
                  ))}
                </ScrollArea>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[600px] pr-4">
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : filteredArticles.length > 0 ? (
              filteredArticles.map((article, index) => (
                <motion.div
                  key={`${article.id || article.url}-${index}-${article.title}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className="mb-6">
                    <CardContent className="p-6">
                      <div className="grid md:grid-cols-[2fr,3fr] gap-6">
                        <div className="relative w-full aspect-video bg-gray-100 rounded-lg overflow-hidden">
                          {article.imageUrl ? (
                            <Image
                              src={article.imageUrl}
                              alt={article.title}
                              fill
                              className={cn(
                                "rounded-lg transition-all duration-200",
                                article.imageUrl.includes('clearbit.com') || 
                                article.imageUrl.includes('companieslogo.com') || 
                                article.imageUrl.includes('brandfetch.io')
                                  ? "object-contain p-4"
                                  : "object-cover"
                              )}
                              sizes="(max-width: 768px) 100vw, 33vw"
                              priority={index < 2}
                              onError={(e) => {
                                const imgElement = e.target as HTMLImageElement;
                                const currentSrc = imgElement.src;
                                
                                if (article.fallbackLogos?.length) {
                                  const currentIndex = article.fallbackLogos.indexOf(currentSrc);
                                  const nextIndex = currentIndex + 1;
                                  
                                  if (nextIndex < article.fallbackLogos.length) {
                                    imgElement.src = article.fallbackLogos[nextIndex];
                                    imgElement.className = cn(
                                      imgElement.className,
                                      "object-contain p-4"
                                    );
                                  } else {
                                    imgElement.src = '/placeholder-news.png';
                                    imgElement.className = cn(
                                      imgElement.className,
                                      "object-cover p-0"
                                    );
                                  }
                                } else {
                                  imgElement.src = '/placeholder-news.png';
                                  imgElement.className = cn(
                                    imgElement.className,
                                    "object-cover p-0"
                                  );
                                }
                              }}
                            />
                          ) : (
                            <NewsPlaceholder />
                          )}
                        </div>
                        <div className="space-y-3">
                          <a 
                            href={article.url} 
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xl font-semibold hover:underline block"
                          >
                            {article.title}
                          </a>
                          <div className="text-sm text-muted-foreground">
                            {article.source} • {article.date}
                          </div>
                          <p className="text-sm text-muted-foreground">{article.snippet}</p>
                          <div className="flex flex-wrap gap-2">
                            {article.relatedCompanies?.map((company) => (
                              <Badge key={company} variant="secondary" className="bg-blue-100 text-blue-800">
                                {company}
                              </Badge>
                            ))}
                            {article.relatedPeople?.map((person) => (
                              <Badge key={person} variant="outline" className="bg-green-100 text-green-800">
                                {person}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))
            ) : (
              <div className="text-center text-gray-500 mt-8">
                No news articles found for the selected filters
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
} 