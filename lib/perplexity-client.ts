import axios from 'axios';
import { Message } from '@/types/chat';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getSystemPrompt } from '@/lib/prompts';

export class PerplexityClient {
  private apiKey: string;
  private baseUrl = 'https://api.perplexity.ai';
  private axiosInstance;

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error('Perplexity API key is required');
    }
    this.apiKey = apiKey;
    this.axiosInstance = axios.create({
      baseURL: this.baseUrl,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      timeout: 30000,
      maxBodyLength: Infinity,
      maxContentLength: Infinity
    });
  }

  async searchNews(query: string, page: number = 1): Promise<any> {
    try {
      console.log('Making request to Perplexity API with query:', query);
      
      const response = await this.axiosInstance.post('/chat/completions', {
        model: 'llama-3.1-sonar-large-128k-online',
        messages: [
          {
            role: 'system',
            content: `You are a news search assistant that returns real, factual news articles about companies. 
            Return ONLY a JSON array of news articles, with no additional text.
            Each article must be real and verifiable.
            Focus on recent news from reputable sources.
            For each article, you MUST include either:
            1. A direct image URL from the news article
            2. The company's official logo URL
            3. A relevant image from a trusted news source`
          },
          {
            role: 'user',
            content: `Search for news articles about these companies: ${query}
            
            For each company, return up to 3 most relevant news articles as a JSON array.
            Each article must have:
            - id: unique string (use URL or timestamp)
            - title: article headline
            - source: publisher name (must be real news source)
            - date: YYYY-MM-DD format
            - snippet: brief description
            - url: direct link to article (must be real URL)
            - imageUrl: MUST be one of:
              1. Direct article image URL from news source
              2. Company's official logo URL
              3. Related image from trusted news sources
            
            Only include real articles from verifiable news sources.
            Ensure each imageUrl is accessible and relevant.
            Return ONLY the JSON array, no other text or formatting.`
          }
        ],
        options: {
          temperature: 0,
          top_p: 0.9,
          top_k: 50
        }
      });

      const data = response.data;
      console.log('Perplexity API response:', data);
      
      // Extract the content and parse JSON
      const content = data.choices[0].message.content;
      console.log('Raw content:', content);
      
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        console.error('No JSON array found in response');
        return [];
      }
      
      const articles = JSON.parse(jsonMatch[0]);
      
      // Additional validation to ensure only real articles are returned
      const validArticles = articles.filter((article: any) => 
        article.url && 
        article.url !== 'null' && 
        article.url !== '#' &&
        article.title && 
        article.source && 
        article.source !== 'N/A' && 
        article.source !== 'No Source' &&
        article.date && 
        /^\d{4}-\d{2}-\d{2}$/.test(article.date)
      );

      console.log('Validated articles:', validArticles);
      return validArticles;
    } catch (error) {
      console.error('Perplexity search error:', {
        error,
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }
  }

  async generateSummary(text: string): Promise<string> {
    try {
      const response = await this.axiosInstance.post('/chat/completions', {
        model: 'sonar',
        messages: [
          {
            role: 'system',
            content: 'You are a news summarizer that creates concise, factual bullet-point summaries. Focus on the key facts, figures, and implications.'
          },
          {
            role: 'user',
            content: `Summarize this news article in exactly 3 bullet points, focusing on the most important facts and developments:

${text}

Format as:
• First key point
• Second key point
• Third key point`
          }
        ],
        options: {
          temperature: 0.1,
          frequency_penalty: 0.1
        }
      });

      return response.data.choices[0].message.content || 'No summary available';
    } catch (error) {
      console.error('Error generating summary:', error);
      return 'Failed to generate summary';
    }
  }
} 