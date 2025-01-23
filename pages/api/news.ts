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

async function cleanJsonString(content: string): Promise<string> {
  try {
    // Extract JSON array from the response
    const jsonMatch = content.match(/```json\s*(\[[\s\S]*?\])\s*```/);
    if (!jsonMatch) {
      console.error('[DEBUG] No JSON array found in content');
      throw new Error('No JSON array found in content');
    }
    
    let cleaned = jsonMatch[1];
    
    // Handle special characters in URLs and text
    cleaned = cleaned.replace(/[\u2018\u2019]/g, "'")
      .replace(/[\u201C\u201D]/g, '"')
      .replace(/&/g, 'and')
      .replace(/\n/g, ' ')
      .replace(/\s+/g, ' ');
    
    // Escape special characters in URLs
    cleaned = cleaned.replace(/(https?:\/\/[^\s"]+)/g, (url) => {
      return url.replace(/[&]/g, '%26');
    });

    console.log('[DEBUG] Cleaned JSON:', cleaned);
    return cleaned;
  } catch (e) {
    console.error('[DEBUG] Error in cleanJsonString:', e);
    throw e;
  }
}

async function parse(content: string, company: string): Promise<any[]> {
  try {
    const cleaned = await cleanJsonString(content);
    
    // Validate JSON structure
    const parsed = JSON.parse(cleaned);
    if (!Array.isArray(parsed)) {
      console.error('[DEBUG] Parsed result is not an array:', parsed);
      throw new Error('Parsed result is not an array');
    }

    // Validate each article
    const validArticles = parsed.filter(article => {
      if (!article || typeof article !== 'object') {
        console.warn('[DEBUG] Invalid article object:', article);
        return false;
      }

      // Check required fields
      const requiredFields = ['title', 'summary', 'url', 'publishedDate', 'sourceName'];
      const missingFields = requiredFields.filter(field => !article[field]);
      if (missingFields.length > 0) {
        console.warn('[DEBUG] Article missing required fields:', {
          article,
          missingFields
        });
        return false;
      }

      // Validate URL format and accessibility
      try {
        const url = new URL(article.url);
        if (!url.protocol.startsWith('http')) {
          console.warn('[DEBUG] Invalid URL protocol:', url.protocol);
          return false;
        }
        // Reject generic search URLs
        if (url.pathname.includes('search') || url.pathname === '/') {
          console.warn('[DEBUG] Generic search or root URL detected:', url.toString());
          return false;
        }
      } catch (e) {
        console.warn('[DEBUG] Invalid URL:', article.url);
        return false;
      }

      // Validate title isn't a generic format
      if (article.title.startsWith('Latest Updates:') || 
          article.title.includes('News and Developments')) {
        console.warn('[DEBUG] Generic title detected:', article.title);
        return false;
      }

      // Validate summary isn't generic
      if (article.summary.includes('Stay informed about the latest news')) {
        console.warn('[DEBUG] Generic summary detected');
        return false;
      }

      return true;
    }).map(article => ({
      ...article,
      id: `${company}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      company,
      source: article.sourceName,
      imageUrl: article.imageUrl || getFallbackImageUrl(company)
    }));

    if (validArticles.length === 0) {
      console.error('[DEBUG] No valid articles found after parsing');
      throw new Error('No valid articles found');
    }

    console.log('[DEBUG] Successfully parsed articles:', validArticles.length);
    return validArticles;
  } catch (e) {
    console.error('[DEBUG] JSON parsing error:', e);
    throw new Error('Failed to parse response');
  }
}

async function fetchWithRetry(url: string, options: any, maxRetries = 3): Promise<Response> {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);
      
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
          ...options.headers
        }
      });
      
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      console.error(`Attempt ${attempt} failed:`, error);
      lastError = error;
      
      if (attempt < maxRetries) {
        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }
  }
  
  throw lastError;
}

async function fetchNewsFromPerplexity(company: string, count: number) {
  console.log(`[DEBUG] Fetching news for ${company} from Perplexity API...`);
  
  if (!PERPLEXITY_API_KEY) {
    console.error('[DEBUG] PERPLEXITY_API_KEY is not configured');
    return createFallbackArticles(company, count);
  }

  try {
    const prompt = `Provide ${count} recent news articles about ${company}. Include title, summary (max 200 words), URL, published date (YYYY-MM-DD), and source name. Format as JSON array.`;
    
    const response = await fetchWithRetry('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      body: JSON.stringify({
        model: 'sonar',
        messages: [{ role: 'user', content: prompt }]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[DEBUG] Perplexity API error:', response.status, errorText);
      return createFallbackArticles(company, count);
    }

    const data = await response.json();
    console.log('[DEBUG] Raw API response:', data);

    if (!data.choices?.[0]?.message?.content) {
      console.error('[DEBUG] Invalid response format from Perplexity API');
      return createFallbackArticles(company, count);
    }

    try {
      const content = data.choices[0].message.content;
      console.log('[DEBUG] Parsing content:', content);
      
      const articles = await parse(content, company); // Pass company to parse function
      
      console.log('[DEBUG] Successfully processed articles:', articles.length);
      return articles;
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
  
  const domains = [
    'reuters.com/companies',
    'bloomberg.com/companies',
    'ft.com/companies',
    'wsj.com/news/business',
    'cnbc.com/business'
  ];
  
  return Array.from({ length: count }, (_, i) => ({
    id: `${company}-fallback-${Date.now()}-${i}`,
    title: `No Recent News Available for ${company}`,
    summary: `We are currently unable to fetch recent news articles for ${company}. Please try again later or visit the company's official website for the latest updates.`,
    url: `https://www.${domains[i % domains.length]}`,
    publishedDate: new Date().toISOString().split('T')[0],
    source: domains[i % domains.length].split('.')[0].toUpperCase(),
    imageUrl: getFallbackImageUrl(company),
    company,
    isFallback: true
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
        for (const companyName of Array.from(companyVariations)) {
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