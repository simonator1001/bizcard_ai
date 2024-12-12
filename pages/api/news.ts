import { NextApiRequest, NextApiResponse } from 'next'
import { PerplexityClient } from '@/lib/perplexity-client'

// Add the validation function
const isValidImageUrl = (url: string) => {
  try {
    const urlObj = new URL(url);
    // Add more trusted domains here
    const trustedDomains = [
      'reuters.com',
      'bloomberg.com',
      'ft.com',
      'wsj.com',
      'cnbc.com',
      'bwbx.io',
      'marketwatch.com',
      'businesswire.com',
      'prnewswire.com'
    ];
    
    return trustedDomains.some(domain => urlObj.hostname.includes(domain)) ||
           url.match(/\.(jpg|jpeg|png|webp|avif|gif)$/i) ||
           url.includes('/images/') ||
           url.includes('/media/') ||
           url.includes('/photos/');
  } catch {
    return false;
  }
};

const getCompanyInfo = (companyName: string) => {
  const cleanName = companyName.toLowerCase().replace(/[^a-z0-9]/g, '');
  const domain = `${cleanName}.com`;
  
  return {
    logoUrls: [
      `https://logo.clearbit.com/${domain}`,
      `https://companieslogo.com/img/orig/${cleanName}-LOGO.png`,
      `https://asset.brandfetch.io/id/${cleanName}/logo.png`,
      `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(companyName)}&prop=pageimages&format=json&pithumbsize=500`,
      `https://www.${domain}/assets/images/logo.png`,
      `https://www.${domain}/images/logo.png`,
      `https://www.${domain}/logo.png`
    ],
    domain
  };
};

// Add helper function to clean company names
const cleanCompanyName = (name: string) => {
  // Remove Chinese characters and common suffixes
  return name
    .replace(/[\u3400-\u9FBF]/g, '')
    .replace(/(limited|ltd|inc|corp|corporation|company|co|group|hk|\(.*?\))\.?\s*$/gi, '')
    .trim();
};

// Add more comprehensive image extraction
const extractImageFromArticle = async (url: string, companyName: string): Promise<string | null> => {
  try {
    const response = await fetch(url);
    const html = await response.text();
    
    // Try to find images in this order:
    // 1. OpenGraph image
    const ogMatch = html.match(/<meta[^>]*(?:property="og:image"|name="og:image")[^>]*content="([^"]*)"[^>]*>/i) ||
                   html.match(/<meta[^>]*content="([^"]*)"[^>]*(?:property="og:image"|name="og:image")[^>]*>/i);
    if (ogMatch?.[1]) {
      const ogUrl = ogMatch[1];
      return ogUrl.startsWith('http') ? ogUrl : `${new URL(url).origin}${ogUrl}`;
    }

    // 2. Twitter image
    const twitterMatch = html.match(/<meta[^>]*(?:property="twitter:image"|name="twitter:image")[^>]*content="([^"]*)"[^>]*>/i);
    if (twitterMatch?.[1]) {
      const twitterUrl = twitterMatch[1];
      return twitterUrl.startsWith('http') ? twitterUrl : `${new URL(url).origin}${twitterUrl}`;
    }

    // 3. Article content images
    const imgMatches = html.match(/<img[^>]*src="([^"]*)"[^>]*>/ig);
    if (imgMatches) {
      // Filter and score images
      const images = imgMatches
        .map(img => {
          const srcMatch = img.match(/src="([^"]*)"/i);
          const altMatch = img.match(/alt="([^"]*)"/i);
          if (!srcMatch) return null;

          const src = srcMatch[1];
          const alt = altMatch?.[1] || '';
          const score = scoreImage(src, alt, companyName);
          
          return { src, score };
        })
        .filter(Boolean)
        .sort((a, b) => b.score - a.score);

      if (images.length > 0) {
        const bestImage = images[0].src;
        return bestImage.startsWith('http') ? bestImage : `${new URL(url).origin}${bestImage}`;
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error extracting image from article:', error);
    return null;
  }
};

// Helper function to score image relevance
const scoreImage = (src: string, alt: string, companyName: string): number => {
  let score = 0;
  const lowerCompany = companyName.toLowerCase();
  const lowerAlt = alt.toLowerCase();
  const lowerSrc = src.toLowerCase();

  // Prefer images with company name in alt text or filename
  if (lowerAlt.includes(lowerCompany)) score += 5;
  if (lowerSrc.includes(lowerCompany)) score += 3;

  // Prefer larger images
  if (src.includes('large') || src.includes('hero')) score += 2;
  if (src.includes('thumb') || src.includes('icon')) score -= 1;

  // Prefer certain image types
  if (src.match(/\.(jpg|jpeg|png)$/i)) score += 1;
  if (src.includes('logo')) score -= 1;

  return score;
};

// Add more comprehensive company image search
const searchCompanyImages = async (companyName: string): Promise<string | null> => {
  try {
    // 1. Try Wikipedia first
    const wikiResponse = await fetch(
      `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(companyName)}&prop=pageimages&format=json&pithumbsize=500&origin=*`
    );
    const wikiData = await wikiResponse.json();
    const pages = wikiData.query?.pages;
    if (pages) {
      const pageId = Object.keys(pages)[0];
      const thumbnail = pages[pageId]?.thumbnail?.source;
      if (thumbnail) return thumbnail;
    }

    // 2. Try company website
    const cleanName = companyName.toLowerCase().replace(/[^a-z0-9]/g, '');
    const domain = `${cleanName}.com`;
    const companyUrls = [
      `https://www.${domain}`,
      `https://${domain}`,
      `https://${cleanName}.org`,
      `https://${cleanName}.net`
    ];

    for (const url of companyUrls) {
      try {
        const response = await fetch(url);
        const html = await response.text();
        const logoMatch = html.match(/<img[^>]*(?:logo|brand)[^>]*src="([^"]*)"[^>]*>/i);
        if (logoMatch?.[1]) {
          const logoUrl = logoMatch[1];
          return logoUrl.startsWith('http') ? logoUrl : `${url}${logoUrl}`;
        }
      } catch (e) {
        continue;
      }
    }

    return null;
  } catch (error) {
    console.error('Error searching company images:', error);
    return null;
  }
};

export default async function handler(
  req: NextApiRequest, 
  res: NextApiResponse
) {
  try {
    const { companies, names, page = 1, limit = 10 } = req.body;

    if (!process.env.PERPLEXITY_API_KEY) {
      throw new Error('PERPLEXITY_API_KEY is not configured');
    }

    const perplexity = new PerplexityClient(process.env.PERPLEXITY_API_KEY);

    // Clean and prepare company names
    const searchableCompanies = companies
      .map(company => cleanCompanyName(company))
      .filter(name => name.length > 0);

    if (searchableCompanies.length === 0) {
      return res.status(200).json({
        articles: [],
        hasMore: false,
        nextPage: page + 1
      });
    }

    // Create search query with company aliases
    const searchQuery = searchableCompanies
      .map(company => `"${company}"`)
      .join(' OR ');

    const results = await perplexity.searchNews(searchQuery, page);
    
    // Format results with better error handling
    const articles = await Promise.all(results.map(async (result: any) => {
      try {
        const companyName = result.source || companies[0];
        const { logoUrls, domain } = getCompanyInfo(companyName);

        // Try to get image in this order:
        // 1. Direct article image if valid
        // 2. Extract image from article content
        // 3. Search for company images
        // 4. Use fallback logos
        let imageUrl = result.imageUrl;
        let imageSource = 'direct';
        
        if (!imageUrl || !isValidImageUrl(imageUrl)) {
          // Try to extract image from article
          if (result.url) {
            imageUrl = await extractImageFromArticle(result.url, companyName);
            if (imageUrl) imageSource = 'article';
          }
          
          // If still no image, try company image search
          if (!imageUrl) {
            imageUrl = await searchCompanyImages(companyName);
            if (imageUrl) imageSource = 'search';
          }
          
          // If still no image, use first logo URL
          if (!imageUrl) {
            imageUrl = logoUrls[0];
            imageSource = 'logo';
          }
        }

        console.log(`Image for ${companyName}: ${imageUrl} (${imageSource})`);

        // Generate unique ID
        const id = result.url || 
                  `${companyName}-${result.date}-${Math.random().toString(36).substring(2)}`;

        return {
          id,
          title: result.title || 'Untitled Article',
          source: result.source || 'Unknown Source',
          date: result.date || new Date().toISOString().split('T')[0],
          snippet: result.snippet || '',
          url: result.url || '#',
          imageUrl,
          imageSource,
          fallbackLogos: logoUrls,
          company: companyName,
          domain,
          relatedCompanies: companies.filter(company => 
            (result.title + ' ' + result.snippet)
              .toLowerCase()
              .includes(cleanCompanyName(company).toLowerCase())
          ),
          relatedPeople: names.filter(name => 
            (result.title + ' ' + result.snippet)
              .toLowerCase()
              .includes(name.toLowerCase())
          )
        };
      } catch (error) {
        console.error('Error processing article:', error);
        return null;
      }
    })).then(articles => articles.filter(Boolean));

    return res.status(200).json({
      articles,
      hasMore: articles.length === limit,
      nextPage: page + 1
    });

  } catch (error) {
    console.error('News API error:', error);
    return res.status(500).json({ 
      message: 'Failed to fetch news',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 