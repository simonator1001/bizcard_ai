// DISABLED: Supabase removed
import { LlamaAPI } from './llama-api';

const PERPLEXITY_API_KEY = process.env.NEXT_PUBLIC_PERPLEXITY_API_KEY;
if (!PERPLEXITY_API_KEY) {
  console.error('PERPLEXITY_API_KEY is not defined in environment variables');
}

console.log('Perplexity API Key available:', !!PERPLEXITY_API_KEY);

export interface NewsArticle {
  id: string;
  title: string;
  summary: string;
  publishedDate: string;
  source: string;
  url: string;
  companyName: string;
  relatedPerson?: string;
}

export interface Company {
  id: string;
  name: string;
  name_zh?: string;
}

export class NewsService {
  private llamaApi: LlamaAPI;
  private perplexityApiKey: string;

  constructor() {
    console.log('Initializing NewsService...');
    
    if (!process.env.NEXT_PUBLIC_PERPLEXITY_API_KEY) {
      console.error('PERPLEXITY_API_KEY is missing in environment variables');
      throw new Error('PERPLEXITY_API_KEY is not defined');
    }
    this.perplexityApiKey = process.env.NEXT_PUBLIC_PERPLEXITY_API_KEY;
    console.log('Perplexity API Key loaded:', this.perplexityApiKey.substring(0, 10) + '...');
    
    if (!process.env.LLAMA_API_KEY) {
      console.error('LLAMA_API_KEY is missing in environment variables');
      throw new Error('LLAMA_API_KEY is not defined');
    }
    this.llamaApi = new LlamaAPI(process.env.LLAMA_API_KEY);
    console.log('NewsService initialized successfully');
  }

  async getRandomCompanies(count: number = 5): Promise<Company[]> {
    // DISABLED: Supabase removed
    console.log('[DISABLED] getRandomCompanies: Supabase removed');
    return [];
  }

  async getNewsForCompanies(
    companies: Company[], 
    articlesPerCompany: number = 3
  ): Promise<Record<string, NewsArticle[]>> {
    console.log(`Fetching news for ${companies.length} companies, ${articlesPerCompany} articles each`);
    try {
      const newsMap: Record<string, NewsArticle[]> = {};

      await Promise.all(
        companies.map(async (company) => {
          console.log(`Fetching news for company: ${company.name}`);
          try {
            const articles = await this.getCompanyNews(company.name, articlesPerCompany);
            console.log(`Retrieved ${articles.length} articles for ${company.name}`);
            newsMap[company.name] = articles;
          } catch (error) {
            console.error(`Failed to fetch news for ${company.name}:`, error);
            newsMap[company.name] = [];
          }
        })
      );

      console.log('Final news map:', newsMap);
      return newsMap;
    } catch (error) {
      console.error('Error in getNewsForCompanies:', error);
      throw error;
    }
  }

  private async getCompanyNews(companyName: string, count: number): Promise<NewsArticle[]> {
    console.log(`Getting news for ${companyName}, requesting ${count} articles`);
    try {
      // First try with Perplexity AI
      console.log('Attempting to fetch news from Perplexity AI...');
      const perplexityArticles = await this.getNewsFromPerplexity(companyName, count);
      if (perplexityArticles.length > 0) {
        console.log('Successfully retrieved articles from Perplexity AI');
        return perplexityArticles;
      }

      // Fallback to Llama if Perplexity fails
      console.log('Falling back to Llama API...');
      return this.getNewsFromLlama(companyName, count);
    } catch (error) {
      console.error(`Error in getCompanyNews for ${companyName}:`, error);
      throw error;
    }
  }

  private async getNewsFromPerplexity(companyName: string, count: number): Promise<NewsArticle[]> {
    console.log(`Fetching news from Perplexity AI for ${companyName}`);
    try {
      const prompt = `Find ${count} most recent news articles about the company "${companyName}". Return the response as a JSON array with each article having these fields: title (string), summary (string, max 200 words), publishedDate (YYYY-MM-DD), source (string), url (string). Only include actual news articles from the past 3 months.`;
      
      console.log('Sending request to Perplexity API...');
      const response = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.perplexityApiKey}`
        },
        body: JSON.stringify({
          model: 'llama-3.1-sonar-large-128k-online',
          messages: [
            { 
              role: 'system', 
              content: 'You are a news aggregator that returns only factual, recent news articles in JSON format. Always verify the information and include only real articles from credible sources.'
            },
            { role: 'user', content: prompt }
          ]
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Perplexity API error status:', response.status);
        console.error('Perplexity API error text:', errorText);
        throw new Error(`Perplexity API error: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Perplexity API response for', companyName, ':', data);

      const articles = this.parseNewsResponse(data, companyName);
      console.log('Parsed articles for', companyName, ':', articles);
      return articles;
    } catch (error) {
      console.error('Error in getNewsFromPerplexity:', error);
      return [];
    }
  }

  private async getNewsFromLlama(companyName: string, count: number): Promise<NewsArticle[]> {
    try {
      const prompt = `Provide the ${count} most recent news articles related to ${companyName} from credible news sources. For each article, include: title, summary (max 200 words), published date (YYYY-MM-DD format), source name, and URL. Format as JSON array.`;

      const response = await this.llamaApi.chat({
        model: "llama-3.1-sonar-large-128k-online",
        messages: [{ role: "user", content: prompt }]
      });

      return this.parseNewsResponse(response, companyName);
    } catch (error) {
      console.error('Llama API error:', error);
      return [];
    }
  }

  private parseNewsResponse(response: any, companyName: string): NewsArticle[] {
    try {
      let articles;
      
      // Handle different response formats
      if (response.choices && response.choices[0]?.message?.content) {
        // Perplexity API format
        const content = response.choices[0].message.content;
        articles = this.extractJSONFromText(content);
      } else if (response.content) {
        // Llama API format
        articles = this.extractJSONFromText(response.content);
      } else {
        throw new Error('Unexpected response format');
      }

      if (!Array.isArray(articles)) {
        console.error('Parsed response is not an array:', articles);
        return [];
      }

      return articles.map((article: any, index: number) => ({
        id: `${companyName}-${index}`,
        title: article.title || 'Untitled',
        summary: article.summary || 'No summary available',
        publishedDate: article.publishedDate || new Date().toISOString().split('T')[0],
        source: article.source || 'Unknown Source',
        url: article.url || '#',
        companyName
      }));
    } catch (error) {
      console.error('Error parsing news response:', error);
      return [];
    }
  }

  private extractJSONFromText(text: string): any[] {
    try {
      // First try to parse the entire text as JSON
      return JSON.parse(text);
    } catch (e) {
      // If that fails, try to extract JSON from the text
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        try {
          return JSON.parse(jsonMatch[0]);
        } catch (e) {
          console.error('Failed to parse extracted JSON:', e);
          return [];
        }
      }
      console.error('No JSON array found in text');
      return [];
    }
  }

  async getAllCompanies(): Promise<Company[]> {
    // DISABLED: Supabase removed
    console.log('[DISABLED] getAllCompanies: Supabase removed');
    return [];
  }
}