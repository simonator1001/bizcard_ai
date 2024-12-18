import { BusinessCard } from '@/types/business-card'

// Fallback function to analyze relationships based on titles
function analyzeRelationshipsByTitle(cards: BusinessCard[]) {
  const titleHierarchy = {
    level1: ['ceo', 'chief', 'president', 'founder', 'chairman'],
    level2: ['vp', 'vice president', 'director', 'head'],
    level3: ['manager', 'lead', 'supervisor'],
    level4: ['senior', 'sr', 'principal'],
    level5: ['associate', 'junior', 'staff'],
  };

  // Sort cards by hierarchy level
  const getLevel = (title?: string): number => {
    if (!title) return 6; // Default level for undefined/null titles
    
    const lowerTitle = title.toLowerCase();
    for (const [level, keywords] of Object.entries(titleHierarchy)) {
      if (keywords.some(keyword => lowerTitle.includes(keyword))) {
        return parseInt(level.replace('level', ''));
      }
    }
    return 6;
  };

  // Sort cards by level, handling undefined positions
  const sortedCards = [...cards].sort((a, b) => {
    const levelA = getLevel(a?.position);
    const levelB = getLevel(b?.position);
    return levelA - levelB;
  });

  // Assign reporting relationships
  return sortedCards.map((card, currentIndex) => {
    if (!card) return null; // Handle null/undefined cards
    
    const cardLevel = getLevel(card.position);
    let reportsTo = null;

    // Find the nearest superior by looking at previous cards
    for (let i = currentIndex - 1; i >= 0; i--) {
      const potentialManager = sortedCards[i];
      if (!potentialManager) continue; // Skip null/undefined managers
      
      const managerLevel = getLevel(potentialManager.position);
      if (managerLevel < cardLevel) {
        reportsTo = potentialManager.id;
        break;
      }
    }

    return {
      ...card,
      reportsTo
    };
  }).filter(Boolean) as BusinessCard[]; // Remove any null results
}

export async function analyzeOrgStructure(cards: BusinessCard[]) {
  if (!Array.isArray(cards) || cards.length === 0) {
    console.error('❌ Invalid or empty cards array:', cards);
    return [];
  }

  try {
    // Log the cards we're analyzing
    console.log('📊 Analyzing org structure for:', cards.map(card => ({
      id: card.id,
      name: card.name,
      position: card.position,
      company: card.company
    })));

    const response = await fetch('/api/analyze-org-structure', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ cards })
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('❌ API error:', error);
      return analyzeRelationshipsByTitle(cards);
    }

    const { relationships } = await response.json();
    
    if (!Array.isArray(relationships)) {
      console.error('❌ Invalid response format:', relationships);
      return analyzeRelationshipsByTitle(cards);
    }

    // Map the relationships back to the original cards
    return cards.map(card => ({
      ...card,
      reportsTo: relationships.find(r => r.id === card.id)?.reportsTo || null
    }));

  } catch (error) {
    console.error('❌ Error in analyzeOrgStructure:', error);
    return analyzeRelationshipsByTitle(cards);
  }
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