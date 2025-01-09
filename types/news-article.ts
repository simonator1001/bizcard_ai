export interface EmployeeMention {
  name: string;
  title: string;
  company: string;
}

export interface NewsArticle {
  id: string;
  title: string;
  summary: string;
  content: string;
  url: string;
  imageUrl?: string;
  source: string;
  publishedDate: string;
  company: string;
  mentionedEmployees?: EmployeeMention[];
  sentiment?: 'positive' | 'negative' | 'neutral';
  relevanceScore?: number;
} 