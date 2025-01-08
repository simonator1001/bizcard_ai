import type { NextApiRequest, NextApiResponse } from 'next'
import type { BusinessCard } from '@/types/business-card'

const TOGETHER_API_KEY = process.env.TOGETHER_API_KEY

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const { cards } = req.body as { cards: BusinessCard[] }

    if (!cards || cards.length === 0) {
      return res.status(400).json({ message: 'No cards provided' })
    }

    if (!TOGETHER_API_KEY) {
      return res.status(500).json({ message: 'Together API key not configured' })
    }

    // Create a more structured prompt for better results
    const prompt = `<|system|>You are an expert at analyzing organizational hierarchies. Your task is to analyze business cards and create a JSON structure representing the org chart. Only respond with valid JSON, no additional text. Each person should appear exactly once in the hierarchy.

<|user|>Based on these business cards, create an organizational chart JSON:
${cards.map(card => `
Name: ${card.name}
Title: ${card.title}${card.titleZh ? ` / ${card.titleZh}` : ''}
Position: ${card.position || 'N/A'}`).join('\n')}

Create a single hierarchical structure where:
1. The company is at the root
2. Each person appears exactly once
3. People are placed under their most likely supervisor based on title and position
4. The structure is clean and logical

Format as JSON:
{
  "id": "company",
  "name": "${cards[0]?.company || 'Organization'}",
  "title": "Company",
  "subordinates": [
    {
      "id": "person_1",
      "name": "Person Name",
      "title": "Job Title",
      "subordinates": []
    }
  ]
}

<|assistant|>
{
`

    console.log('Sending request to Together API...')
    
    // Call Together.ai API with Meta-Llama-3.1
    const response = await fetch('https://api.together.xyz/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TOGETHER_API_KEY}`
      },
      body: JSON.stringify({
        model: 'meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 2048,
        temperature: 0.3, // Reduced temperature for more consistent output
        top_p: 0.9,
        top_k: 50,
        repetition_penalty: 1.1,
        stop: ['\n\n', '<|user|>', '<|system|>', '<|assistant|>']
      })
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error('Together API error:', errorData)
      throw new Error(`Together API error: ${response.status} ${errorData}`)
    }

    const data = await response.json()
    console.log('Together API response:', data)

    if (!data.choices?.[0]?.message?.content) {
      throw new Error('Invalid response from Together API')
    }

    // Clean and parse the JSON response
    let content = data.choices[0].message.content.trim()
    
    // Remove any potential prefixes
    content = content.replace(/^```json\s*/, '')
    content = content.replace(/^```\s*/, '')
    
    // Remove any potential suffixes
    content = content.replace(/\s*```$/, '')
    
    // Ensure the content starts with { and ends with }
    const firstBrace = content.indexOf('{')
    const lastBrace = content.lastIndexOf('}')
    if (firstBrace === -1 || lastBrace === -1) {
      throw new Error('Invalid JSON structure in response')
    }
    
    content = content.slice(firstBrace, lastBrace + 1)

    try {
      const orgStructure = JSON.parse(content)
      console.log('Parsed org structure:', orgStructure)
      return res.status(200).json({ orgStructure })
    } catch (parseError) {
      console.error('JSON parse error:', parseError)
      console.error('Failed to parse content:', content)
      throw new Error('Failed to parse JSON response')
    }
  } catch (error) {
    console.error('Error in analyze-relationships:', error)
    return res.status(500).json({ 
      message: 'Failed to analyze relationships',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
} 