import type { NextApiRequest, NextApiResponse } from 'next'

const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY

interface NewsArticle {
  title: string
  summary: string
  url: string
  publishedDate: string
  source: string
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  console.log('API Key status:', PERPLEXITY_API_KEY ? 'Present' : 'Missing')

  if (!PERPLEXITY_API_KEY) {
    console.error('Missing PERPLEXITY_API_KEY in environment variables')
    return res.status(500).json({ 
      error: 'PERPLEXITY_API_KEY is not configured',
      details: 'Please add PERPLEXITY_API_KEY to your .env.local file'
    })
  }

  try {
    const { company, count } = req.body
    console.log('Received request for company:', company, 'count:', count)

    if (!company || !count) {
      return res.status(400).json({ 
        error: 'Missing required parameters',
        details: 'Both company and count are required'
      })
    }

    const prompt = `Generate a JSON array of ${count} recent news articles about ${company}. Format EXACTLY like this example:
[
  {
    "title": "Example Title",
    "summary": "Brief summary of the news",
    "url": "https://example.com/article",
    "publishedDate": "2024-01-17T00:00:00Z",
    "source": "News Source Name"
  }
]
Return ONLY the JSON array with no additional text.`

    console.log('Making request to Perplexity API...')
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-sonar-large-128k-online',
        messages: [{
          role: 'system',
          content: 'You are a JSON API. Always respond with valid JSON arrays only. Never include explanatory text.'
        }, {
          role: 'user',
          content: prompt
        }]
      })
    })

    console.log('Perplexity API response status:', response.status)
    
    if (!response.ok) {
      const errorData = await response.json()
      console.error('Perplexity API error:', errorData)
      throw new Error(errorData.message || 'Perplexity API request failed')
    }

    const data = await response.json()
    console.log('Perplexity API raw response:', data.choices[0].message.content)
    
    if (!data.choices?.[0]?.message?.content) {
      throw new Error('Invalid response format from Perplexity API')
    }

    let articles: NewsArticle[]
    try {
      const content = data.choices[0].message.content.trim()
      const jsonMatch = content.match(/\[\s*\{[\s\S]*\}\s*\]/m)
      
      if (jsonMatch) {
        articles = JSON.parse(jsonMatch[0])
      } else {
        throw new Error('Could not find JSON array in response')
      }

      articles = articles.map(article => ({
        title: String(article.title || '').trim(),
        summary: String(article.summary || '').trim(),
        url: String(article.url || '').trim(),
        publishedDate: new Date(article.publishedDate || Date.now()).toISOString(),
        source: String(article.source || '').trim()
      }))

      console.log('Parsed and validated articles:', articles)
    } catch (parseError) {
      console.error('Failed to parse response:', parseError)
      throw new Error('Failed to parse news articles from API response')
    }

    res.status(200).json({ articles })
  } catch (error) {
    console.error('News API Error:', error)
    res.status(500).json({ 
      error: 'Failed to fetch news',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
} 