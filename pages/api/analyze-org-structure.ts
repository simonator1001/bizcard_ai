import type { NextApiRequest, NextApiResponse } from 'next'
import type { BusinessCard } from '@/types/business-card'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const { cards } = req.body as { cards: BusinessCard[] }
    const apiKey = process.env.PERPLEXITY_API_KEY

    if (!cards || cards.length === 0) {
      return res.status(400).json({ message: 'No cards provided' })
    }

    if (!apiKey) {
      return res.status(500).json({ message: 'Perplexity API key not configured' })
    }

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
          titleZh: c.titleZh,
          company: c.company
        })), null, 2)}

        Return an array where each object has:
        - id: string (card id)
        - reportsTo: string (manager's card id) or null for top level
        
        Example format: [{"id":"card1","reportsTo":null},{"id":"card2","reportsTo":"card1"}]
        Return only the JSON array with no additional text, comments, or markdown formatting.`
    }]

    const requestPayload = {
      model: "llama-3.1-sonar-small-128k-online",
      messages,
      temperature: 0.1,
      max_tokens: 1000,
      top_p: 0.9
    }

    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(requestPayload)
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Perplexity API error:', {
        status: response.status,
        error: errorText
      })
      return res.status(response.status).json({ 
        message: 'Perplexity API error',
        error: errorText
      })
    }

    const result = await response.json()
    
    if (!result.choices?.[0]?.message?.content) {
      return res.status(500).json({ 
        message: 'Invalid API response format',
        error: result
      })
    }

    let jsonStr = result.choices[0].message.content.trim()
    
    // Extract JSON array if embedded in other text
    if (jsonStr.includes('[') && jsonStr.includes(']')) {
      const startIdx = jsonStr.indexOf('[')
      const endIdx = jsonStr.lastIndexOf(']') + 1
      jsonStr = jsonStr.substring(startIdx, endIdx)
    }

    // Clean up the JSON string
    jsonStr = jsonStr
      .replace(/```json\s*/g, '')
      .replace(/```\s*/g, '')
      .replace(/\/\/.+$/gm, '')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/,(\s*[\]}])/g, '$1')
      .replace(/\n/g, '')
      .replace(/\s+/g, ' ')
      .trim()

    try {
      const relationships = JSON.parse(jsonStr)
      
      if (!Array.isArray(relationships)) {
        throw new Error('Response is not an array')
      }

      // Validate the relationships
      const validRelationships = relationships.filter(r => 
        typeof r === 'object' && 
        r !== null && 
        typeof r.id === 'string' && 
        (r.reportsTo === null || typeof r.reportsTo === 'string')
      )

      if (validRelationships.length === 0) {
        throw new Error('No valid relationships found')
      }

      return res.status(200).json({ relationships: validRelationships })

    } catch (parseError) {
      console.error('Failed to parse relationships:', parseError)
      return res.status(500).json({ 
        message: 'Failed to parse relationships',
        error: parseError instanceof Error ? parseError.message : 'Unknown error',
        content: jsonStr
      })
    }

  } catch (error) {
    console.error('Error in analyze-org-structure:', error)
    return res.status(500).json({ 
      message: 'Server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
} 