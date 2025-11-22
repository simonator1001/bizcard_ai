export interface EmployeeMention {
  name: string;
  title: string;
  company: string;
}

export interface NewsArticle {
  id: string;
  title: string;
  summary: string;
  url: string;
  publishedDate: string;
  source: string;
  sourceName?: string;
  company: string;
  imageUrl?: string;
  mentionedEmployees?: string[];
  isFallback?: boolean;
} 