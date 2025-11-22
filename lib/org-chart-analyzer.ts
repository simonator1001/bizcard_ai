import { BusinessCard } from '@/types/business-card'

// Helper function to determine the level of a position
function getLevel(title: string | undefined): number {
  if (!title) return 999; // Put undefined titles at the end

  title = title.toLowerCase();
  
  if (title.includes('ceo') || title.includes('chairman') || title.includes('president')) {
    return 1;
  }
  if (title.includes('chief') || title.includes('cto') || title.includes('cfo') || title.includes('coo')) {
    return 2;
  }
  if (title.includes('director') || title.includes('head of')) {
    return 3;
  }
  if (title.includes('manager')) {
    return 4;
  }
  if (title.includes('lead') || title.includes('senior')) {
    return 5;
  }
  
  return 6; // Default level for other positions
}

export function analyzeOrgChart(cards: BusinessCard[]) {
  // Sort cards by level, handling undefined titles
  const sortedCards = [...cards].sort((a, b) => {
    const levelA = getLevel(a?.title);
    const levelB = getLevel(b?.title);
    return levelA - levelB;
  });

  // Group cards by company
  const companies = new Map<string, BusinessCard[]>();
  
  sortedCards.forEach(card => {
    if (card.company) {
      const companyCards = companies.get(card.company) || [];
      companyCards.push(card);
      companies.set(card.company, companyCards);
    }
  });

  // Create org chart structure for each company
  const orgCharts = new Map<string, any>();
  
  companies.forEach((companyCards, company) => {
    const levels = new Map<number, BusinessCard[]>();
    
    companyCards.forEach(card => {
      const level = getLevel(card.title);
      const levelCards = levels.get(level) || [];
      levelCards.push(card);
      levels.set(level, levelCards);
    });

    orgCharts.set(company, {
      company,
      levels: Array.from(levels.entries()).sort(([a], [b]) => a - b)
    });
  });

  return Array.from(orgCharts.values());
}

// Update the test function to use the same model
export async function testPerplexityAPI() {
  const apiKey = process.env.NEXT_PUBLIC_PERPLEXITY_API_KEY;
  
  if (!apiKey) {
    console.error('❌ No API key found');
    return false;
  }

  try {
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "llama-3.1-sonar-small-128k-online", // Updated model here too
        messages: [{
          role: "user",
          content: "Reply with 'OK' if you can read this message."
        }],
        temperature: 0.1,
        max_tokens: 10
      })
    });

    console.log('🧪 API Test Response:', {
      status: response.status,
      ok: response.ok
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('❌ API Test Error:', error);
      return false;
    }

    const result = await response.json();
    console.log('✅ API Test Success:', result);
    return true;

  } catch (error) {
    console.error('❌ API Test Error:', error);
    return false;
  }
} 