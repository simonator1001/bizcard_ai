import type { NextApiRequest, NextApiResponse } from 'next'
import { supabase } from '@/lib/supabase-client'
import https from 'https';

const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY

// Helper function to delay execution
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Helper function to make HTTPS requests with retry logic
async function makeHttpsRequestWithRetry(
  options: https.RequestOptions, 
  data: any, 
  maxRetries: number = 3,
  initialDelay: number = 1000
): Promise<any> {
  let lastError;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`API request attempt ${attempt}/${maxRetries}`);
      const result = await makeHttpsRequest(options, data);
      return result;
    } catch (error) {
      lastError = error;
      console.error(`Attempt ${attempt} failed:`, error.message);
      
      if (attempt < maxRetries) {
        const delayTime = initialDelay * Math.pow(2, attempt - 1); // Exponential backoff
        console.log(`Retrying in ${delayTime}ms...`);
        await delay(delayTime);
      }
    }
  }
  throw lastError;
}

// Helper function to make HTTPS requests
function makeHttpsRequest(options: https.RequestOptions, data: any): Promise<any> {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsedData = JSON.parse(responseData);
          resolve({ ok: res.statusCode === 200, status: res.statusCode, data: parsedData });
        } catch (error) {
          reject(new Error(`Failed to parse response: ${error.message}`));
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

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
  imageUrl?: string;
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
  return Array(Math.min(count, 10)).fill(null).map((_, i) => ({
    title: `${company} Business Update ${i + 1}`,
    summary: `Latest updates and developments from ${company}.`,
    url: `https://www.google.com/search?q=${encodeURIComponent(company)}+news`,
    publishedDate: new Date().toISOString().split('T')[0],
    source: 'News Service',
    company,
    imageUrl: '/images/placeholder-news.jpg'
  }));
}

// Helper function to validate image URL
async function isValidImageUrl(url: string): Promise<boolean> {
  try {
    const parsedUrl = new URL(url);
    // Only allow HTTPS URLs
    if (parsedUrl.protocol !== 'https:') return false;
    
    // Avoid known problematic domains
    const blockedDomains = [
      'marketing-interactive.com',
      'en.yna.co.kr',
      'news.samsung.com'
    ];
    if (blockedDomains.some(domain => parsedUrl.hostname.includes(domain))) {
      return false;
    }
    
    return true;
  } catch {
    return false;
  }
}

// Helper function to get fallback image URL based on company name
function getFallbackImageUrl(company: string): string {
  // List of reliable fallback image sources
  const fallbackImages = {
    default: '/images/placeholder-news.jpg',
    hkust: 'https://hkust.edu.hk/themes/hkust/images/logo.png',
    parknshop: 'https://www.aswatson.com/wp-content/uploads/brands/parknshop-logo.png',
    samsung: 'https://www.samsung.com/etc.clientlibs/samsung/clientlibs/consumer/global/clientlib-common/resources/images/logo.png'
  };

  // Convert company name to lowercase for matching
  const companyLower = company.toLowerCase();
  
  // Match company name with fallback images
  if (companyLower.includes('hkust') || companyLower.includes('hong kong university')) {
    return fallbackImages.hkust;
  }
  if (companyLower.includes('parknshop') || companyLower.includes('park n shop')) {
    return fallbackImages.parknshop;
  }
  if (companyLower.includes('samsung')) {
    return fallbackImages.samsung;
  }

  return fallbackImages.default;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  const { company, count = 3 } = req.body;

  try {
    console.log('News API request received');
    console.log('Request body:', { company, count });

    if (!company) {
      console.error('No company provided in request');
      return res.status(400).json({ error: 'Company is required' });
    }

    // Create fallback articles with the requested count
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
  "source": "Source name here",
  "imageUrl": "https://example.com/image.jpg"
}

Important:
1. Return ONLY the JSON array
2. Include ALL required fields
3. Use valid URLs for both article and image
4. Use today's date for recent news
5. NO additional text or explanation
6. For imageUrl, use a relevant news, company logo, or product image URL`;

    console.log('Making request to Perplexity API');
    try {
      const requestOptions = {
        hostname: 'api.perplexity.ai',
        path: '/chat/completions',
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 15000, // Increased timeout
        minVersion: 'TLSv1.2',
        rejectUnauthorized: true,
        servername: 'api.perplexity.ai' // Explicitly set the server name for SNI
      };

      const requestData = {
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
      };

      const response = await makeHttpsRequestWithRetry(requestOptions, requestData);

      if (!response.ok) {
        console.error('Perplexity API error:', response.status);
        throw new Error(`API error: ${response.status}`);
      }

      if (!response.data?.choices?.[0]?.message?.content) {
        console.error('Invalid API response format');
        throw new Error('Invalid API response format');
      }

      console.log('Raw API response:', response.data.choices[0].message.content);

      try {
        // Try to parse the response
        const content = response.data.choices[0].message.content;
        let articles = [];

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
            return res.status(200).json({ 
              articles: fallbackArticles,
              source: 'mock',
              reason: 'Failed to parse API response'
            });
          }
        }

        // Validate and clean articles, ensuring we only return the requested count
        articles = await Promise.all(
          articles
            .slice(0, count) // Limit to requested count
            .map(async (article: NewsArticleResponse) => {
              const imageUrl = article.imageUrl || '';
              const isValidImage = await isValidImageUrl(imageUrl);
              
              return {
                title: String(article.title || '').trim(),
                summary: String(article.summary || '').trim(),
                url: String(article.url || '').trim(),
                publishedDate: new Date(article.publishedDate || Date.now()).toISOString().split('T')[0],
                source: String(article.source || '').trim(),
                company: article.company || company,
                imageUrl: isValidImage ? imageUrl : getFallbackImageUrl(company)
              };
            })
        );

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