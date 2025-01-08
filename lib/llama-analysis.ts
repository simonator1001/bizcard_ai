import { BusinessCard } from '@/types/business-card'

const TOGETHER_API_KEY = process.env.NEXT_PUBLIC_TOGETHER_API_KEY
const API_URL = 'https://api.together.xyz/v1/chat/completions'

interface Relationship {
  manager_id: string;
  reports_to: string[];
}

interface HierarchyResponse {
  relationships: Relationship[];
  reasoning: string;
}

interface APIResponse {
  choices?: {
    message?: {
      content: string;
    };
  }[];
}

export async function analyzeTitlesHierarchy(cards: BusinessCard[]): Promise<HierarchyResponse> {
  // Create a fallback hierarchy based on titles
  const createFallbackHierarchy = () => {
    const relationships: { manager_id: string; reports_to: string[] }[] = [];
    
    // Group cards by company
    const companiesMap = new Map<string, BusinessCard[]>();
    cards.forEach(card => {
      const company = card.company || 'Unknown';
      if (!companiesMap.has(company)) {
        companiesMap.set(company, []);
      }
      companiesMap.get(company)?.push(card);
    });

    // For each company, create a hierarchy based on titles
    companiesMap.forEach((companyCards) => {
      const sortedCards = [...companyCards].sort((a, b) => {
        const getLevel = (title: string = '') => {
          const lowerTitle = title.toLowerCase();
          if (lowerTitle.includes('ceo') || lowerTitle.includes('president')) return 1;
          if (lowerTitle.includes('vice president') || lowerTitle.includes('vp')) return 2;
          if (lowerTitle.includes('director')) return 3;
          if (lowerTitle.includes('manager')) return 4;
          return 5;
        };
        return getLevel(a.title) - getLevel(b.title);
      });

      // Create relationships
      for (let i = 0; i < sortedCards.length - 1; i++) {
        relationships.push({
          manager_id: sortedCards[i].id,
          reports_to: [sortedCards[i + 1].id]
        });
      }
    });

    return {
      relationships,
      reasoning: 'Fallback hierarchy based on title levels within each company'
    };
  };

  const prompt = `Analyze these business cards and create a JSON response showing the organizational hierarchy.
Input cards:
${JSON.stringify(cards.map(card => ({
  id: card.id,
  name: card.name,
  title: card.title,
  position: card.position,
  company: card.company
})), null, 2)}

Required JSON format (use exactly this structure):
{
  "relationships": [
    {
      "manager_id": "string_id",
      "reports_to": ["string_id1", "string_id2"]
    }
  ],
  "reasoning": "string explanation"
}

Rules:
1. manager_id must be a valid ID from the input cards
2. reports_to must be an array of valid IDs from the input cards
3. Only create relationships within the same company
4. Base hierarchy on titles and positions: CEO/President > VP > Director > Manager > Staff
5. Return ONLY the JSON object, no other text or formatting`;

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${TOGETHER_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: "meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo",
        messages: [
          {
            role: "system",
            content: "You are an expert at analyzing organizational hierarchies. Always respond with only a valid JSON object."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.1,
        max_tokens: 2000,
        top_p: 0.9,
        frequency_penalty: 0.1,
        presence_penalty: 0.1
      })
    });

    if (!response.ok) {
      console.error('API Response:', await response.text());
      return createFallbackHierarchy();
    }

    const data = await response.json() as APIResponse;
    
    if (!data.choices?.[0]?.message?.content) {
      console.error('Unexpected API response:', data);
      return createFallbackHierarchy();
    }

    try {
      let content = data.choices[0].message.content.trim();
      
      // Remove any markdown or code formatting
      content = content
        .replace(/```json\s*/g, '')
        .replace(/```\s*/g, '')
        .replace(/[\u0000-\u001F]/g, '')
        .trim();

      // Ensure content starts with { and ends with }
      if (!content.startsWith('{') || !content.endsWith('}')) {
        console.error('Invalid JSON format:', content);
        return createFallbackHierarchy();
      }

      const parsedResponse = JSON.parse(content) as HierarchyResponse;
      
      // Validate response structure
      if (!parsedResponse.relationships || !Array.isArray(parsedResponse.relationships)) {
        console.error('Invalid response structure:', parsedResponse);
        return createFallbackHierarchy();
      }

      // Validate relationships
      const validRelationships = parsedResponse.relationships.filter((rel: Relationship) => 
        rel && 
        typeof rel.manager_id === 'string' && 
        Array.isArray(rel.reports_to) &&
        rel.reports_to.every(id => typeof id === 'string')
      );

      return {
        relationships: validRelationships,
        reasoning: parsedResponse.reasoning || 'Hierarchy based on title analysis'
      };
    } catch (e) {
      console.error('Failed to parse API response:', e);
      return createFallbackHierarchy();
    }
  } catch (error) {
    console.error('Error analyzing hierarchy:', error);
    return createFallbackHierarchy();
  }
} 