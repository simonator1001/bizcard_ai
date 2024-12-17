import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const PERPLEXITY_API_KEY = Deno.env.get('PERPLEXITY_API_KEY')

interface RequestBody {
  company: string
  count: number
}

serve(async (req) => {
  try {
    const { company, count } = await req.json() as RequestBody

    const prompt = `Provide the ${count} most recent news articles related to ${company} from credible news sources, with title, summary, published date, and link. Format as JSON array with fields: title, summary, url, publishedDate, source`

    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-sonar-large-128k-online',
        messages: [{
          role: 'user',
          content: prompt
        }]
      })
    })

    const data = await response.json()
    const articles = JSON.parse(data.choices[0].message.content)

    return new Response(
      JSON.stringify({ articles }),
      { headers: { 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}) 