import React, { createContext, useContext, useState } from 'react'

interface NewsArticle {
  id: string
  title: string
  source: string
  date: string
  snippet: string
  url: string
  imageUrl: string
  relatedCompanies?: string[]
  relatedPeople?: string[]
}

interface NewsContextType {
  articles: NewsArticle[]
  loading: boolean
  error: string | null
  fetchNews: (companies: string[], people: string[]) => Promise<void>
}

const NewsContext = createContext<NewsContextType>({
  articles: [],
  loading: false,
  error: null,
  fetchNews: async () => {}
})

export function NewsProvider({ children }: { children: React.ReactNode }) {
  const [articles, setArticles] = useState<NewsArticle[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchNews = async (companies: string[], people: string[]) => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/news', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ companies, people })
      })

      if (!response.ok) {
        throw new Error('Failed to fetch news')
      }

      const data = await response.json()
      setArticles(data)
    } catch (err) {
      console.error('Error fetching news:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch news')
    } finally {
      setLoading(false)
    }
  }

  return (
    <NewsContext.Provider value={{ articles, loading, error, fetchNews }}>
      {children}
    </NewsContext.Provider>
  )
}

export function useNews() {
  return useContext(NewsContext)
} 