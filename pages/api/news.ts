import type { NextApiRequest, NextApiResponse } from 'next'
import { supabase } from '@/lib/supabase-client'

const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY

interface NewsArticle {
  title: string
  summary: string
  url: string
  publishedDate: string
  source: string
  mentionedEmployees?: Array<{
    name: string
    title: string
    company: string
  }>
}

interface NewsArticleResponse {
  title?: string;
  summary?: string;
  url?: string;
  publishedDate?: string;
  source?: string;
  company?: string;
}

async function getEmployeesForCompany(company: string) {
  const { data: employees, error } = await supabase
    .from('business_cards')
    .select('name, title')
    .eq('company', company)

  if (error) {
    console.error('Error fetching employees:', error)
    return []
  }

  return employees
}

function createFallbackArticles(company: string, count: number) {
  return Array(count).fill(null).map((_, i) => ({
    title: `${company} Business Update ${i + 1}`,
    summary: `Latest updates and developments from ${company}.`,
    url: `https://www.google.com/search?q=${encodeURIComponent(company)}+news`,
    publishedDate: new Date().toISOString().split('T')[0],
    source: 'News Service',
    company
  }));
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  // Extract request parameters early to ensure they're available throughout the function
  const { company, count = 3 } = req.body;

  try {
    console.log('News API request received');
    console.log('Request body:', { company, count });

    if (!company) {
      console.error('No company provided in request');
      return res.status(400).json({ error: 'Company is required' });
    }

    // Create fallback articles
    const fallbackArticles = createFallbackArticles(company, count);

    // If no API key, return fallback articles immediately
    if (!PERPLEXITY_API_KEY) {
      console.log('No Perplexity API key configured, using fallback articles');
      return res.status(200).json({ 
        articles: fallbackArticles,
        source: 'mock',
        reason: 'No API key configured'
      });
    }

    console.log('Fetching employees for company:', company);
    const employees = await getEmployeesForCompany(company);
    console.log('Found employees:', employees.length);

    // Simplified prompt focused on JSON structure
    const prompt = `Return a JSON array containing ${count} recent news articles about ${company}.
Each article must have these exact fields:
{
  "title": "Article title here",
  "summary": "Brief article summary here",
  "url": "https://example.com/article",
  "publishedDate": "${new Date().toISOString().split('T')[0]}",
  "source": "Source name here"
}

Important:
1. Return ONLY the JSON array
2. Include ALL required fields
3. Use valid URLs
4. Use today's date for recent news
5. NO additional text or explanation`;

    console.log('Making request to Perplexity API');
    try {
      const response = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.1-sonar-small-128k-online',
          messages: [{
            role: 'system',
            content: 'You are a JSON API. Return only valid JSON arrays. No other text.'
          }, {
            role: 'user',
            content: prompt
          }],
          temperature: 0.1,
          max_tokens: 1000,
        })
      });

      if (!response.ok) {
        console.error('Perplexity API error:', response.status, response.statusText);
        const errorText = await response.text();
        console.error('Error details:', errorText);
        return res.status(200).json({ 
          articles: fallbackArticles,
          source: 'mock',
          reason: `API error: ${response.status} ${response.statusText}`
        });
      }

      const data = await response.json();
      console.log('Raw API response:', data.choices[0].message.content);

      try {
        // Try to parse the response
        const content = data.choices[0].message.content;
        let articles = [];

        // Try different parsing strategies
        try {
          // First try: Direct parse
          articles = JSON.parse(content);
          console.log('Successfully parsed articles directly');
        } catch (e) {
          console.log('Direct parse failed, trying to extract JSON array');
          // Second try: Find JSON array in text
          const match = content.match(/\[\s*\{[\s\S]*\}\s*\]/);
          if (match) {
            articles = JSON.parse(match[0]);
            console.log('Successfully parsed articles from extracted JSON');
          } else {
            console.error('No valid JSON array found in response');
            throw new Error('No valid JSON array found');
          }
        }

        // Validate and clean articles
        articles = articles.map((article: NewsArticleResponse) => ({
          title: String(article.title || '').trim(),
          summary: String(article.summary || '').trim(),
          url: String(article.url || '').trim(),
          publishedDate: new Date(article.publishedDate || Date.now()).toISOString().split('T')[0],
          source: String(article.source || '').trim(),
          company: article.company || company
        }));

        console.log('Processed articles:', articles.length);

        // Return parsed articles if valid, otherwise use fallback
        return res.status(200).json({ 
          articles: articles.length > 0 ? articles : fallbackArticles,
          source: articles.length > 0 ? 'api' : 'mock',
          reason: articles.length === 0 ? 'Failed to parse API response' : undefined
        });
      } catch (error) {
        // Return fallback articles if parsing fails
        console.error('Failed to parse articles:', error);
        return res.status(200).json({ 
          articles: fallbackArticles,
          source: 'mock',
          reason: 'Failed to parse API response'
        });
      }
    } catch (fetchError) {
      console.error('Perplexity API fetch error:', fetchError);
      return res.status(200).json({ 
        articles: fallbackArticles,
        source: 'mock',
        reason: 'API connection failed'
      });
    }
  } catch (error) {
    console.error('News API Error:', error);
    return res.status(200).json({ 
      articles: createFallbackArticles(company, count),
      source: 'mock',
      reason: 'Internal server error'
    });
  }
} 