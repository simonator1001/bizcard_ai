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

async function parse(content: string, company: string): Promise<NewsArticle[]> {
  try {
    const cleaned = await cleanJsonString(content);
    
    // Extract JSON array from response if needed
    const jsonMatch = cleaned.match(/\[.*\]/s);
    if (!jsonMatch) {
      console.error('[DEBUG] No JSON array found in content');
      return [];
    }
    
    // Validate JSON structure
    const parsed = JSON.parse(jsonMatch[0]);
    if (!Array.isArray(parsed)) {
      console.error('[DEBUG] Parsed result is not an array:', parsed);
      return [];
    }

    // Validate each article
    const validArticles = parsed.filter(article => {
      if (!article || typeof article !== 'object') {
        console.warn('[DEBUG] Invalid article object:', article);
        return false;
      }

      // Check required fields
      const requiredFields = ['title', 'summary', 'url'];
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
          article.title.includes('News and Developments') ||
          article.title.toLowerCase().includes('no recent news')) {
        console.warn('[DEBUG] Generic title detected:', article.title);
        return false;
      }

      // Validate summary isn't generic
      if (article.summary.includes('Stay informed about the latest news') ||
          article.summary.toLowerCase().includes('unable to fetch')) {
        console.warn('[DEBUG] Generic summary detected');
        return false;
      }

      return true;
    }).map(article => ({
      id: `${company}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title: article.title.trim(),
      summary: article.summary.trim(),
      url: article.url,
      publishedDate: article.publishedDate || new Date().toISOString().split('T')[0],
      source: article.sourceName || article.source || 'News Source',
      sourceName: article.sourceName || article.source || 'News Source',
      company,
      imageUrl: article.imageUrl || getFallbackImageUrl(company),
      isFallback: false
    }));

    console.log('[DEBUG] Successfully parsed articles:', validArticles.length);
    return validArticles;
  } catch (e) {
    console.error('[DEBUG] JSON parsing error:', e);
    return [];
  }
}

async function fetchWithRetry(url: string, options: any, maxRetries = 3): Promise<Response> {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000);
      
      // Create custom agent for SSL/TLS configuration
      const https = require('https');
      const agent = new https.Agent({
        rejectUnauthorized: true,
        secureProtocol: 'TLS_method',
        minVersion: 'TLSv1.2',
        maxVersion: 'TLSv1.3',
        keepAlive: true,
        keepAliveMsecs: 1000,
        maxSockets: 10
      });

      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        agent,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          ...options.headers
        }
      });
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[DEBUG] API error on attempt ${attempt}:`, {
          status: response.status,
          statusText: response.statusText,
          error: errorText
        });
        throw new Error(`API error: ${response.status} ${response.statusText} - ${errorText}`);
      }
      
      return response;
    } catch (error) {
      console.error(`[DEBUG] Attempt ${attempt} failed:`, {
        error: error.message,
        cause: error.cause,
        stack: error.stack
      });
      
      lastError = error;
      
      if (attempt < maxRetries) {
        const baseDelay = Math.pow(2, attempt) * 1000;
        const jitter = Math.random() * 1000;
        const delay = baseDelay + jitter;
        
        console.log(`[DEBUG] Retrying in ${delay}ms... (attempt ${attempt + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  console.error('[DEBUG] All retry attempts failed:', lastError);
  throw lastError;
}

async function fetchNewsFromPerplexity(company: string, count: number) {
  console.log(`[DEBUG] Fetching news for ${company} from Perplexity API...`);
  
  if (!PERPLEXITY_API_KEY) {
    console.error('[DEBUG] PERPLEXITY_API_KEY is not configured');
    throw new Error('Perplexity API key not configured');
  }

  try {
    const response = await fetchWithRetry('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PERPLEXITY_API_KEY}`
      },
      body: JSON.stringify({
        model: 'sonar',
        messages: [
          {
            role: 'system',
            content: 'You are a precise news search assistant that returns only real, verifiable news articles in exact JSON format. Each article must include title, summary (50-200 words), url, publishedDate (YYYY-MM-DD), and source fields.'
          },
          { 
            role: 'user', 
            content: `Search for ${count} recent, factual news articles about the company "${company}" or its industry from the past 6 months. Format as JSON array.` 
          }
        ],
        temperature: 0.3,
        max_tokens: 2000
      })
    });

    const responseText = await response.text();
    console.log('[DEBUG] Raw response text:', responseText);

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (error) {
      console.error('[DEBUG] Failed to parse response as JSON:', error);
      throw new Error('Invalid JSON response from API');
    }

    if (!data.choices?.[0]?.message?.content) {
      console.error('[DEBUG] Invalid response format:', data);
      throw new Error('Invalid response format from API');
    }

    const content = data.choices[0].message.content;
    console.log('[DEBUG] Content to parse:', content);
    
    const articles = await parse(content, company);
    
    if (articles.length === 0) {
      console.log('[DEBUG] No valid articles found for', company);
      throw new Error('No articles found');
    }
    
    const validArticles = articles.filter(article => {
      try {
        const url = new URL(article.url);
        if (!url.hostname.includes('.')) {
          console.warn('[DEBUG] Invalid article URL hostname:', url.hostname);
          return false;
        }
      } catch {
        console.warn('[DEBUG] Invalid article URL format');
        return false;
      }

      const isRelevant = 
        article.title.toLowerCase().includes(company.toLowerCase()) ||
        article.summary.toLowerCase().includes(company.toLowerCase()) ||
        article.summary.toLowerCase().includes('industry') ||
        article.summary.toLowerCase().includes('market') ||
        article.summary.toLowerCase().includes('sector') ||
        article.summary.toLowerCase().includes('business');

      if (!isRelevant) {
        console.warn('[DEBUG] Article not relevant to company or industry:', article.title);
        return false;
      }

      if (article.summary.length < 30) {
        console.warn('[DEBUG] Article summary too short:', article.summary);
        return false;
      }

      return true;
    });

    if (validArticles.length === 0) {
      throw new Error('No relevant articles found');
    }
    
    console.log('[DEBUG] Successfully processed articles:', validArticles.length);
    return validArticles;
  } catch (error) {
    console.error('[DEBUG] Error in fetchNewsFromPerplexity:', error);
    throw error;
  }
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