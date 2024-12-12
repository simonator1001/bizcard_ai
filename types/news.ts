export interface NewsArticle {
  id: string
  title: string
  source: string
  date: string
  snippet: string
  url: string
  imageUrl: string
  imageSource: 'direct' | 'article' | 'search' | 'logo'
  fallbackLogos: string[]
  company: string
  domain: string
  relatedCompanies?: string[]
  relatedPeople?: string[]
} 