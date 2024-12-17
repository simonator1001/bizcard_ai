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
    const apiKey = process.env.NEXT_PUBLIC_PERPLEXITY_API_KEY;
    
    if (!apiKey) {
      console.warn('⚠️ No API key found - using fallback analysis');
      return analyzeRelationshipsByTitle(cards);
    }

    // Log the cards we're analyzing
    console.log('📊 Analyzing org structure for:', cards.map(card => ({
      id: card.id,
      name: card.name,
      position: card.position,
      company: card.company
    })));

    const messages = [{
      role: 'system',
      content: `You are an expert at analyzing organizational hierarchies based on job titles and positions.
        You must determine reporting relationships based on standard corporate hierarchy and job titles in both English and Chinese.
        Always follow these rules:
        1. C-level executives (CEO, CTO, etc.) and equivalents (總裁, 行政總裁) are at the top
        2. EVP/SVP (執行副總裁/高級副總裁) report to C-level
        3. VP/Directors (副總裁/總監) report to EVP/SVP
        4. Senior Managers (高級經理) report to Directors
        5. Managers (經理) report to Senior Managers
        6. Staff report to Managers
        7. Consider seniority indicators in both languages:
           - Senior/Sr/高級 > Regular > Junior/Jr/初級
           - Principal/首席 > Senior/高級 > Associate/助理
        8. Common Chinese hierarchy:
            總裁 > 執行副總裁 > 高級副總裁 > 副總裁 > 總監 > 高級經理 > 經理 > 主任
        
        Return only a valid JSON array with no additional text or formatting.`
    }, {
      role: 'user',
      content: `Analyze these business cards and return a JSON array of reporting relationships:
        ${JSON.stringify(cards.map(c => ({
          id: c.id,
          name: c.name,
          title: c.title,
          title_zh: c.title_zh,
          company: c.company
        })), null, 2)}

        Return an array where each object has:
        - id: string (card id)
        - reportsTo: string (manager's card id) or null for top level
        
        Example format: [{"id":"card1","reportsTo":null},{"id":"card2","reportsTo":"card1"}]
        Return only the JSON array with no additional text, comments, or markdown formatting.`
    }];

    const requestPayload = {
      model: "llama-3.1-sonar-small-128k-online",
      messages,
      temperature: 0.1,
      max_tokens: 1000,
      top_p: 0.9
    };

    console.log('📤 Sending request to Perplexity:', {
      model: requestPayload.model,
      cardCount: cards.length,
      sampleCard: cards[0]
    });

    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(requestPayload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Perplexity API error:', {
        status: response.status,
        error: errorText
      });
      return analyzeRelationshipsByTitle(cards);
    }

    const result = await response.json();
    
    if (!result.choices?.[0]?.message?.content) {
      console.error('❌ Invalid API response format:', result);
      return analyzeRelationshipsByTitle(cards);
    }

    try {
      const content = result.choices[0].message.content;
      console.log('✅ Raw API response:', content);
      
      // Try to extract JSON from the response
      let jsonStr = content.trim();
      
      // If response contains explanation text, try to extract just the JSON part
      if (jsonStr.includes('[') && jsonStr.includes(']')) {
        const startIdx = jsonStr.indexOf('[');
        const endIdx = jsonStr.lastIndexOf(']') + 1;
        jsonStr = jsonStr.substring(startIdx, endIdx);
      }

      // Clean up any markdown code block markers
      jsonStr = jsonStr
        .replace(/```json\s*/g, '')    // Remove ```json with any whitespace
        .replace(/```\s*/g, '')        // Remove ``` with any whitespace
        .replace(/\/\/.+$/gm, '')      // Remove single-line comments
        .replace(/\/\*[\s\S]*?\*\//g, '') // Remove multi-line comments
        .trim();
      
      // Remove any trailing commas before closing brackets
      jsonStr = jsonStr
        .replace(/,(\s*[\]}])/g, '$1')
        .replace(/\n/g, '')            // Remove newlines
        .replace(/\s+/g, ' ');         // Normalize whitespace
      
      console.log('🔄 Cleaned JSON string:', jsonStr);
      
      try {
        const relationships = JSON.parse(jsonStr);
        
        if (!Array.isArray(relationships)) {
          throw new Error('Response is not an array');
        }

        console.log('✅ Parsed relationships:', relationships);

        // Validate the relationships
        const validRelationships = relationships.filter(r => 
          typeof r === 'object' && 
          r !== null && 
          typeof r.id === 'string' && 
          (r.reportsTo === null || typeof r.reportsTo === 'string')
        );

        if (validRelationships.length === 0) {
          throw new Error('No valid relationships found');
        }

        // Map the relationships back to the original cards
        return cards.map(card => ({
          ...card,
          reportsTo: validRelationships.find(r => r.id === card.id)?.reportsTo || null
        }));

      } catch (parseError) {
        console.error('❌ Failed to parse relationships:', parseError);
        console.error('Problem content:', jsonStr);
        return analyzeRelationshipsByTitle(cards);
      }

    } catch (error) {
      console.error('❌ Error processing API response:', error);
      return analyzeRelationshipsByTitle(cards);
    }

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