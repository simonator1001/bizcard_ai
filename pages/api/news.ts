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

async function checkAllBusinessCards() {
  console.log('[DEBUG] Checking all business cards in database');
  
  try {
    // Check authentication
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    if (authError) {
      console.error('[DEBUG] Auth error:', authError);
      return;
    }
    if (!session) {
      console.error('[DEBUG] No session found');
      return;
    }
    console.log('[DEBUG] Authenticated as user:', session.user.id);

    const { data: allCards, error } = await supabase
      .from('business_cards')
      .select('id, name, company')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[DEBUG] Error fetching all cards:', error);
      return;
    }

    console.log('[DEBUG] Total cards in database:', allCards?.length || 0);
    console.log('[DEBUG] Sample of cards:', allCards?.slice(0, 3));
  } catch (error) {
    console.error('[DEBUG] Error in checkAllBusinessCards:', error);
  }
}

async function getEmployeesForCompany(company: string, authToken: string) {
  console.log(`[DEBUG] Getting employees for company: "${company}"`);
  
  try {
    // Verify the auth token
    const { data: { user }, error: authError } = await supabase.auth.getUser(authToken);
    if (authError) {
      console.error('[DEBUG] Auth error:', authError);
      return [];
    }
    if (!user) {
      console.error('[DEBUG] No user found');
      return [];
    }
    console.log('[DEBUG] Authenticated as user:', user.id);

    // Get all cards for the user
    const { data: allCards, error: cardsError } = await supabase
      .from('business_cards')
      .select('id, name, name_zh, title, title_zh, company, company_zh')
      .eq('user_id', user.id)
      .not('name', 'is', null)
      .not('name', 'eq', '');

    if (cardsError) {
      console.error('[DEBUG] Error fetching cards:', cardsError);
      return [];
    }

    console.log(`[DEBUG] Found ${allCards?.length || 0} total cards`);
    
    // Helper function to normalize company names
    const normalizeCompany = (name: string) => {
      if (!name) return '';
      return name.toLowerCase()
        .replace(/[^a-z0-9]/g, '') // Remove non-alphanumeric
        .replace(/^(?:the|company|corp|corporation|inc|ltd|limited)/, '') // Remove common prefixes/suffixes
        .trim();
    };

    // Helper function to check if companies match
    const companiesMatch = (card: any, searchCompany: string) => {
      const normalizedSearch = normalizeCompany(searchCompany);
      const cardCompanies = [
        normalizeCompany(card.company),
        normalizeCompany(card.company_zh)
      ].filter(Boolean);

      // Log each comparison for debugging
      cardCompanies.forEach(cardCompany => {
        console.log(`[DEBUG] Comparing companies:`, {
          search: normalizedSearch,
          card: cardCompany,
          matches: cardCompany === normalizedSearch
        });
      });

      return cardCompanies.some(cardCompany => 
        cardCompany === normalizedSearch ||
        cardCompany.includes(normalizedSearch) ||
        normalizedSearch.includes(cardCompany)
      );
    };

    // Filter and deduplicate cards
    const matchingCards = allCards?.filter(card => companiesMatch(card, company)) || [];

    // Deduplicate by name
    const uniqueCards = Array.from(new Map(
      matchingCards.map(card => [card.name.toLowerCase(), card])
    ).values());

    console.log(`[DEBUG] Found ${uniqueCards.length} unique employees for ${company}`, {
      matchingCards: matchingCards.map(card => ({
        name: card.name,
        company: card.company,
        company_zh: card.company_zh
      }))
    });

    return uniqueCards;

  } catch (error) {
    console.error('[DEBUG] Error in getEmployeesForCompany:', error);
    return [];
  }
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
  try {
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
      // Replace newlines and special characters
      .replace(/[\n\r\t]/g, ' ')
      // Remove comments
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/\/\/.*/g, '')
      // Fix string issues
      .replace(/([{,]\s*)(\w+)(?=\s*:)/g, '$1"$2"') // Quote unquoted keys
      .replace(/:\s*'([^']*)'/g, ':"$1"') // Replace single quotes with double quotes
      .replace(/"\s+"/g, '" "') // Fix spaces between quotes
      .replace(/\\"/g, '"') // Fix escaped quotes
      // Fix structural issues
      .replace(/,\s*([}\]])/g, '$1') // Remove trailing commas
      .replace(/,\s*,/g, ',') // Fix multiple commas
      .replace(/\[\s*,/g, '[') // Fix leading commas
      .replace(/,\s*\]/g, ']') // Fix trailing array commas
      // Fix value issues
      .replace(/:\s*"?\s*"(?=\s*[,}])/g, ':null') // Replace empty strings with null
      .replace(/:\s*(?=\s*[,}])/g, ':null') // Add null for missing values
      // Clean up whitespace
      .replace(/\s+/g, ' ')
      .trim();

    // Validate JSON structure
    const parsed = JSON.parse(cleaned);
    if (!Array.isArray(parsed)) {
      throw new Error('Parsed result is not an array');
    }
    
    // Return the stringified version to ensure proper formatting
    return JSON.stringify(parsed);
  } catch (e) {
    console.error('JSON cleaning error:', e);
    throw new Error('Invalid JSON structure after cleaning');
  }
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
  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
  
  for (let i = 0; i < retries; i++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);
      
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          ...options.headers,
          'Accept': 'application/json',
          'Accept-Encoding': 'gzip, deflate',
          'Connection': 'keep-alive',
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`HTTP error! status: ${response.status}, body:`, errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return response;
    } catch (error) {
      console.error(`Attempt ${i + 1} failed:`, error);
      
      const shouldRetry = error instanceof Error && (
        error.message.includes('socket') ||
        error.message.includes('ECONNRESET') ||
        error.message.includes('timeout') ||
        error.message.includes('SSL') ||
        error.message.includes('certificate')
      );
      
      if (!shouldRetry || i === retries - 1) {
        throw error;
      }
      
      const backoff = Math.min(1000 * Math.pow(2, i), 10000);
      const jitter = Math.random() * 1000;
      console.log(`Retrying in ${(backoff + jitter) / 1000} seconds...`);
      await delay(backoff + jitter);
    }
  }
  throw new Error('All retry attempts failed');
}

async function fetchNewsFromPerplexity(company: string, count: number) {
  if (!PERPLEXITY_API_KEY) {
    console.error('NEXT_PUBLIC_PERPLEXITY_API_KEY is not configured');
    return createFallbackArticles(company, count);
  }

  const prompt = `Find ${count} recent news articles about the company "${company}" from reliable sources. For each article, provide: title (string), summary (2-3 sentences), url (string, must be a real news URL), publishedDate (YYYY-MM-DD format), and source (name of the news outlet). Return ONLY a JSON array with these exact fields, no additional text or formatting. Each article must be about real, recent news from verifiable sources.`;

  try {
    console.log(`[DEBUG] Fetching news for ${company} from Perplexity API...`);
    const response = await fetchWithRetry('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${PERPLEXITY_API_KEY}`
      },
      body: JSON.stringify({
        model: 'sonar',
        messages: [
          {
            role: 'system',
            content: 'You are a news search assistant that returns only real, factual news articles in clean JSON format. Only return verifiable news from reputable sources. Format dates as YYYY-MM-DD.'
          },
          { 
            role: 'user', 
            content: prompt 
          }
        ],
        temperature: 0.0,
        max_tokens: 2000,
        top_p: 0.9
      })
    });

    const data = await response.json();
    console.log('[DEBUG] Raw API response:', JSON.stringify(data, null, 2));
    
    if (!data.choices?.[0]?.message?.content) {
      console.error('[DEBUG] Invalid response format from Perplexity API');
      return createFallbackArticles(company, count);
    }

    try {
      const content = data.choices[0].message.content;
      console.log('[DEBUG] Parsing content:', content);
      
      const articles = parse(content);
      
      if (!Array.isArray(articles) || articles.length === 0) {
        console.error('[DEBUG] No valid articles found in response');
        return createFallbackArticles(company, count);
      }

      // Validate and clean each article
      const validatedArticles = articles
        .map((article, index) => {
          try {
            if (!article.title || !article.summary || !article.url || !article.source) {
              console.warn('[DEBUG] Invalid article:', article);
              return null;
            }
            
            // Ensure URL is valid
            try {
              new URL(article.url);
            } catch {
              console.warn('[DEBUG] Invalid URL in article:', article.url);
              return null;
            }

            // Ensure date is valid
            const date = article.publishedDate ? new Date(article.publishedDate) : new Date();
            const formattedDate = date.toISOString().split('T')[0];

            return {
              id: `${company}-${Date.now()}-${index}`,
              title: article.title.trim(),
              summary: article.summary.trim(),
              url: article.url,
              publishedDate: formattedDate,
              source: article.source.trim(),
              imageUrl: article.imageUrl || getFallbackImageUrl(company),
              company
            };
          } catch (error) {
            console.error('[DEBUG] Error validating article:', error);
            return null;
          }
        })
        .filter((article): article is NewsArticle => article !== null);

      if (validatedArticles.length === 0) {
        console.warn('[DEBUG] No valid articles after validation');
        return createFallbackArticles(company, count);
      }

      console.log('[DEBUG] Successfully processed articles:', validatedArticles.length);
      return validatedArticles;
    } catch (error) {
      console.error('[DEBUG] Error parsing Perplexity response:', error);
      return createFallbackArticles(company, count);
    }
  } catch (error) {
    console.error('[DEBUG] Error in fetchNewsFromPerplexity:', error);
    return createFallbackArticles(company, count);
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
  console.log(`[DEBUG] Creating ${count} fallback articles for ${company}`);
  
  const baseUrl = company.toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  
  const domains = [
    'reuters.com',
    'bloomberg.com',
    'ft.com',
    'wsj.com',
    'cnbc.com'
  ];
  
  return Array.from({ length: count }, (_, i) => ({
    id: `${company}-fallback-${Date.now()}-${i}`,
    title: `Latest Updates: ${company} News and Developments`,
    summary: `Stay informed about the latest news, updates, and developments from ${company}. Follow our coverage for real-time information about company announcements, market updates, and industry insights.`,
    url: `https://www.${domains[i % domains.length]}/search?q=${encodeURIComponent(company)}`,
    publishedDate: new Date().toISOString().split('T')[0],
    source: domains[i % domains.length].split('.')[0].toUpperCase(),
    imageUrl: getFallbackImageUrl(company),
    company
  }));
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get auth token from header
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      console.error('[DEBUG] No authorization header');
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const token = authHeader.replace('Bearer ', '');

    // Verify the auth token first
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      console.error('[DEBUG] Auth error:', authError);
      return res.status(401).json({ error: 'Invalid authentication token' });
    }
    console.log('[DEBUG] Authenticated as user:', user.id);

    const { companies } = req.body;
    if (!Array.isArray(companies)) {
      return res.status(400).json({ error: 'Companies must be an array' });
    }

    console.log('[DEBUG] Processing companies:', companies);

    const results = await Promise.all(
      companies.map(async (company) => {
        console.log(`[DEBUG] Processing company: "${company}"`);
        
        // Get employees first, passing the auth token
        const employees = await getEmployeesForCompany(company, token);
        console.log(`[DEBUG] Found ${employees.length} employees for ${company}`);

        // Get company variations for search
        const companyVariations = new Set([
          company,
          ...employees.map(e => e.company).filter(Boolean),
          ...employees.map(e => e.company_zh).filter(Boolean)
        ]);

        console.log(`[DEBUG] Company variations for search:`, Array.from(companyVariations));

        // Try each company variation for news
        let articles: any[] = [];
        for (const companyName of companyVariations) {
          if (!companyName) continue;
          console.log(`[DEBUG] Fetching news for company variation: "${companyName}"`);
          
          try {
            const companyArticles = await fetchNewsFromPerplexity(companyName, 3);
            
            if (companyArticles && companyArticles.length > 0) {
              // Add employee mentions to each article
              const articlesWithEmployees = companyArticles.map(article => {
                const mentionedEmployees = findMentionedEmployees(article, employees);
                return {
                  ...article,
                  mentionedEmployees,
                  company: company // Use the original company name
                };
              });
              
              articles = articles.concat(articlesWithEmployees);
              console.log(`[DEBUG] Found ${articlesWithEmployees.length} articles for "${companyName}" with ${articlesWithEmployees.reduce((sum, a) => sum + (a.mentionedEmployees?.length || 0), 0)} employee mentions`);
            }
          } catch (error) {
            console.error(`[DEBUG] Error fetching news for ${companyName}:`, error);
            // Continue with other variations even if one fails
            continue;
          }
        }

        // Deduplicate articles by URL
        const uniqueArticles = Array.from(
          new Map(articles.map(a => [a.url, a])).values()
        );

        console.log(`[DEBUG] Final article count for ${company}:`, uniqueArticles.length);
        return uniqueArticles;
      })
    );

    // Flatten all articles into a single array
    const allArticles = results.flat();
    console.log(`[DEBUG] Total articles found:`, allArticles.length);

    return res.status(200).json({
      articles: allArticles
    });

  } catch (error) {
    console.error('[DEBUG] Error in handler:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// Helper function to find mentioned employees
function findMentionedEmployees(article: any, employees: any[]) {
  console.log('[DEBUG] Finding mentioned employees in article:', {
    title: article.title,
    summary: article.summary,
    employeeCount: employees.length
  });

  // Helper function to normalize text for comparison
  const normalizeText = (text: string) => text.toLowerCase().trim();

  // Helper function to check if a name appears in text
  const checkNameMatch = (text: string, name: string) => {
    if (!text || !name) return false;
    
    const normalizedText = normalizeText(text);
    const normalizedName = normalizeText(name);

    // Try different name formats
    const nameParts = normalizedName.split(' ').filter(Boolean);
    if (nameParts.length === 0) return false;

    // Check full name
    if (normalizedText.includes(normalizedName)) {
      console.log('[DEBUG] Found full name match:', name);
      return true;
    }

    // Check name parts (first name, last name)
    for (const part of nameParts) {
      if (part.length >= 3 && normalizedText.includes(part)) {
        console.log('[DEBUG] Found partial name match:', { full: name, matched: part });
        return true;
      }
    }

    return false;
  };

  const mentionedEmployees = employees.filter(employee => {
    const articleText = `${article.title} ${article.summary}`;
    
    // Check English name
    if (employee.name && checkNameMatch(articleText, employee.name)) {
      console.log('[DEBUG] Found English name match:', {
        name: employee.name,
        title: employee.title,
        company: employee.company
      });
      return true;
    }

    // Check Chinese name
    if (employee.name_zh && articleText.includes(employee.name_zh)) {
      console.log('[DEBUG] Found Chinese name match:', {
        name: employee.name_zh,
        title: employee.title_zh,
        company: employee.company_zh
      });
      return true;
    }

    // Check title matches
    if (employee.title && checkNameMatch(articleText, employee.title)) {
      console.log('[DEBUG] Found title match:', {
        name: employee.name,
        title: employee.title
      });
      return true;
    }

    if (employee.title_zh && articleText.includes(employee.title_zh)) {
      console.log('[DEBUG] Found Chinese title match:', {
        name: employee.name_zh,
        title: employee.title_zh
      });
      return true;
    }

    return false;
  });

  console.log('[DEBUG] Found mentioned employees:', mentionedEmployees.length);
  return mentionedEmployees;
} 