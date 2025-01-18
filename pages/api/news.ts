import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase-client';
import { NewsArticle } from '@/types/news-article';

const PERPLEXITY_API_KEY = process.env.NEXT_PUBLIC_PERPLEXITY_API_KEY;
const LLAMA_API_KEY = process.env.LLAMA_API_KEY;

console.log('API Keys check:', {
  hasPerplexityKey: !!PERPLEXITY_API_KEY,
  hasLlamaKey: !!LLAMA_API_KEY
});

if (!PERPLEXITY_API_KEY) {
  console.error('NEXT_PUBLIC_PERPLEXITY_API_KEY is not set in environment variables');
}

if (!LLAMA_API_KEY) {
  console.error('LLAMA_API_KEY is not set in environment variables');
}

async function getEmployeesForCompany(company: string) {
  console.log('Fetching employees for company:', company);
  const { data: employees, error } = await supabase
    .from('business_cards')
    .select('name, name_zh, email')
    .eq('company', company);

  if (error) {
    console.error('Error fetching employees:', error);
    return [];
  }

  console.log('Found employees:', employees?.length || 0, 'for company:', company);
  return employees || [];
}

async function isValidImageUrl(url: string) {
  console.log('Validating image URL:', url);
  
  if (!url || url === '#' || !url.startsWith('http')) {
    console.log('Invalid image URL format:', url);
    return false;
  }
    
  try {
    const response = await fetch(url, { 
      method: 'HEAD',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    if (!response.ok) {
      console.log('Image URL returned non-200 status:', response.status);
      return false;
    }
    
    const contentType = response.headers.get('content-type');
    if (!contentType) {
      console.log('No content-type header found');
      return false;
    }
    
    const isValid = contentType.startsWith('image/');
    console.log('Image validation result:', { url, contentType, isValid });
    return isValid;
  } catch (error) {
    console.error('Error validating image URL:', url, error);
    return false;
  }
}

function getFallbackImageUrl(company: string) {
  const cleanCompany = company.toLowerCase().replace(/[^a-z0-9]/g, '');
  const url = `https://logo.clearbit.com/${cleanCompany}.com`;
  console.log('Generated fallback image URL:', { company, url });
  return url;
}

function cleanJsonString(str: string): string {
  // Remove code blocks and backticks
  let cleaned = str.replace(/```(?:json)?\n?/g, '').replace(/`/g, '');
  
  // Remove any leading/trailing whitespace
  cleaned = cleaned.trim();
  
  // Find the first [ and last ]
  const startIdx = cleaned.indexOf('[');
  const endIdx = cleaned.lastIndexOf(']');
  
  if (startIdx === -1 || endIdx === -1) {
    throw new Error('Invalid JSON format: No array found');
  }
  
  // Extract just the array portion
  cleaned = cleaned.slice(startIdx, endIdx + 1);
  
  // Fix common JSON issues
  cleaned = cleaned
    .replace(/([{,]\s*)(\w+)(\s*:)/g, '$1"$2"$3') // Quote unquoted keys
    .replace(/:\s*'([^']*?)'/g, ':"$1"') // Replace single quotes with double quotes
    .replace(/,\s*([}\]])/g, '$1') // Remove trailing commas
    .replace(/\n/g, '') // Remove newlines
    .replace(/\r/g, '') // Remove carriage returns
    .replace(/\t/g, '') // Remove tabs
    .replace(/\\"/g, '"') // Fix escaped quotes
    .replace(/"\s+"/g, '" "'); // Fix spaces between quotes
    
  return cleaned;
}

function parse(content: string): any[] {
  try {
    // Clean the content first
    const cleanContent = cleanJsonString(content);
    console.log('Cleaned content for parsing:', cleanContent);
    
    try {
      // First attempt: direct parse
      const result = JSON.parse(cleanContent);
      if (!Array.isArray(result)) {
        throw new Error('Parsed result is not an array');
      }
      return result;
    } catch (e) {
      console.error('JSON parsing failed:', e);
      throw new Error('Failed to parse news articles: Invalid JSON format');
    }
  } catch (error) {
    console.error('Error in parse function:', error);
    throw error;
  }
}

async function fetchWithRetry(url: string, options: any, retries = 3): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, {
        ...options,
        // Add proper SSL configuration
        agent: new (require('https').Agent)({
          rejectUnauthorized: true,
          secureProtocol: 'TLS_method',
          minVersion: 'TLSv1.2'
        })
      });
      return response;
    } catch (error) {
      console.error(`Attempt ${i + 1} failed:`, error);
      if (i === retries - 1) throw error;
      // Wait before retrying (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
    }
  }
  throw new Error('All retry attempts failed');
}

async function fetchNewsFromPerplexity(company: string, count: number) {
  if (!PERPLEXITY_API_KEY) {
    throw new Error('NEXT_PUBLIC_PERPLEXITY_API_KEY is not configured');
  }

  const prompt = `Generate exactly ${count} recent news articles about ${company} from the past month. Return the response as a JSON array where each article has these fields: title (string), summary (string, max 200 words), url (string), publishedDate (YYYY-MM-DD), source (string), and imageUrl (string). Return only the JSON array without any additional text or formatting.`;

  try {
    const response = await fetchWithRetry('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      body: JSON.stringify({
        model: 'llama-3.1-sonar-large-128k-online',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.1,
        response_format: { type: 'text' }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Perplexity API error:', errorText);
      return []; // Return empty array instead of throwing
    }

    const data = await response.json();
    console.log('Raw API response:', JSON.stringify(data, null, 2));
    
    if (!data.choices?.[0]?.message?.content) {
      console.error('Invalid response format from Perplexity API');
      return [];
    }

    let articles;
    try {
      const content = data.choices[0].message.content;
      articles = parse(content);

      // Validate and clean each article
      articles = articles.map((article, index) => ({
        id: `${company}-${Date.now()}-${index}-${Math.random().toString(36).substr(2, 9)}`,
        title: article.title || `News about ${company}`,
        summary: article.summary || `Recent updates about ${company}`,
        url: article.url || `https://www.google.com/search?q=${encodeURIComponent(company)}+news`,
        publishedDate: article.publishedDate || new Date().toISOString().split('T')[0],
        source: article.source || 'News Service',
        imageUrl: article.imageUrl || getFallbackImageUrl(company),
        company
      }));

      return articles;
    } catch (error) {
      console.error('Error parsing Perplexity response:', error);
      return []; // Return empty array instead of throwing
    }
  } catch (error) {
    console.error(`Error fetching news for ${company}:`, error);
    return []; // Return empty array instead of throwing
  }
}

async function fetchNewsFromLlama(company: string, count: number) {
  console.log('Fetching news from Llama for:', company, 'count:', count);
  
  if (!LLAMA_API_KEY) {
    throw new Error('LLAMA_API_KEY is not configured');
  }

  const prompt = `Provide the ${count} most recent news articles related to ${company} from credible news sources. For each article, include: title, summary (max 200 words), published date (YYYY-MM-DD format), source name, and URL. Format as JSON array.`;

  const response = await fetch('https://api.llama-api.com/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${LLAMA_API_KEY}`
    },
    body: JSON.stringify({
      model: 'llama-3.1-sonar-large-128k-online',
      messages: [{ role: 'user', content: prompt }]
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Llama API error:', response.status, errorText);
    throw new Error(`Llama API request failed: ${errorText}`);
  }

  const data = await response.json();
  console.log('Llama API response:', data);

  if (!data.choices?.[0]?.message?.content) {
    throw new Error('Invalid response format from Llama API');
  }

  try {
    const content = data.choices[0].message.content;
    const articles = JSON.parse(content);
    
    if (!Array.isArray(articles)) {
      throw new Error('Response is not an array');
    }

    return articles;
  } catch (error) {
    console.error('Error parsing Llama response:', error);
    throw error;
  }
}

function createFallbackArticles(company: string, count: number): NewsArticle[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `${company}-fallback-${i}`,
    title: `Recent updates about ${company}`,
    summary: `Stay tuned for the latest news and updates about ${company}.`,
    url: `https://www.google.com/search?q=${encodeURIComponent(company)}+news`,
    publishedDate: new Date().toISOString().split('T')[0],
    source: 'News Service',
    company,
    imageUrl: getFallbackImageUrl(company),
    mentionedEmployees: []
  }));
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { companies, count = 3 } = req.body;

  if (!Array.isArray(companies) || companies.length === 0) {
    return res.status(400).json({ error: 'Companies array is required' });
  }

  if (!PERPLEXITY_API_KEY) {
    return res.status(500).json({ error: 'API key not configured' });
  }

  try {
    const companyPromises = companies.map(async (company) => {
      try {
        const employees = await getEmployeesForCompany(company);
        const articles = await fetchNewsFromPerplexity(company, count);
        
        const processedArticles = await Promise.all(
          articles.map(async (article: any) => {
            const [isValidImage, mentionedEmployees] = await Promise.all([
              isValidImageUrl(article.imageUrl),
              findMentionedEmployees(article, employees)
            ]);

            return {
              ...article,
              imageUrl: isValidImage ? article.imageUrl : getFallbackImageUrl(company),
              mentionedEmployees
            };
          })
        );

        return processedArticles;
      } catch (error) {
        console.error(`Failed to process company ${company}:`, error);
        return []; // Return empty array instead of throwing
      }
    });

    const results = await Promise.all(companyPromises);
    const allArticles = results.flat().sort((a, b) => 
      new Date(b.publishedDate).getTime() - new Date(a.publishedDate).getTime()
    );

    if (allArticles.length === 0) {
      return res.status(404).json({ error: 'No news found for the selected companies' });
    }

    return res.status(200).json({ articles: allArticles });
  } catch (error) {
    console.error('Error in news API:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch news',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

// Helper function to find mentioned employees
async function findMentionedEmployees(article: any, employees: any[]) {
  const content = `${article.title} ${article.summary}`.toLowerCase();
  return employees
    .filter(employee => {
      return (
        (employee.name && content.includes(employee.name.toLowerCase())) ||
        (employee.name_zh && content.includes(employee.name_zh.toLowerCase()))
      );
    })
    .map(employee => employee.name || employee.name_zh);
} 