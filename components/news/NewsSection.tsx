'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, Filter } from 'lucide-react'
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface NewsSectionProps {
  companies: string[]
  people: string[]
}

export function NewsSection({ companies, people }: NewsSectionProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedFilters, setSelectedFilters] = useState({
    companies: [] as string[],
    people: [] as string[]
  })

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Related News</CardTitle>
        <CardDescription>
          Stay updated with news about companies and people in your network
        </CardDescription>
        <div className="flex gap-4 mt-4">
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
              <Button variant="outline">
                <Filter className="mr-2 h-4 w-4" />
                Filters
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Companies</DropdownMenuLabel>
              <DropdownMenuSeparator />
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
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent>
        <ScrollArea className="h-[calc(100vh-16rem)]">
          <div className="space-y-4">
            <div className="text-center text-gray-500 py-8">
              No news articles found. Add some business cards to see related news.
            </div>
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
} 