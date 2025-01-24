import fetch from 'node-fetch';
import https from 'https';
import { Message } from '@/types/chat';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getSystemPrompt } from '@/lib/prompts';

export class PerplexityClient {
  private apiKey: string;
  private baseUrl = 'https://api.perplexity.ai';
  private agent: https.Agent;

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error('Perplexity API key is required');
    }
    this.apiKey = apiKey;
    this.agent = new https.Agent({
      rejectUnauthorized: false
    });
  }

  async searchNews(query: string, page: number = 1): Promise<any> {
    try {
      console.log('Making request to Perplexity API with query:', query);
      
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.1-sonar-large-128k-online',
          messages: [
            {
              role: 'system',
              content: `You are a news search assistant that returns real, factual news articles about companies. 
              Return ONLY a JSON array of news articles, with no additional text.
              Each article must be real and verifiable.
              Focus on recent news from reputable sources.
              For each article, you MUST include either:
              1. A direct image URL from the news article
              2. The company's official logo URL
              3. A relevant image from a trusted news source`
            },
            {
              role: 'user',
              content: `Search for news articles about these companies: ${query}
              
              For each company, return up to 3 most relevant news articles as a JSON array.
              Each article must have:
              - id: unique string (use URL or timestamp)
              - title: article headline
              - source: publisher name (must be real news source)
              - date: YYYY-MM-DD format
              - snippet: brief description
              - url: direct link to article (must be real URL)
              - imageUrl: MUST be one of:
                1. Direct article image URL from news source
                2. Company's official logo URL
                3. Related image from trusted news sources
              
              Only include real articles from verifiable news sources.
              Ensure each imageUrl is accessible and relevant.
              Return ONLY the JSON array, no other text or formatting.`
            }
          ],
          options: {
            temperature: 0,
            top_p: 0.9,
            top_k: 50
          }
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Perplexity API error response:', errorText);
        throw new Error(`Perplexity API error: ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      console.log('Perplexity API response:', data);
      
      // Extract the content and parse JSON
      const content = data.choices[0].message.content;
      console.log('Raw content:', content);
      
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        console.error('No JSON array found in response');
        return [];
      }
      
      const articles = JSON.parse(jsonMatch[0]);
      
      // Additional validation to ensure only real articles are returned
      const validArticles = articles.filter((article: any) => 
        article.url && 
        article.url !== 'null' && 
        article.url !== '#' &&
        article.title && 
        article.source && 
        article.source !== 'N/A' && 
        article.source !== 'No Source' &&
        article.date && 
        /^\d{4}-\d{2}-\d{2}$/.test(article.date)
      );

      console.log('Validated articles:', validArticles);
      return validArticles;
    } catch (error: unknown) {
      console.error('Perplexity search error:', {
        error,
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }
  }

  async generateSummary(text: string): Promise<string> {
    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'sonar',
          messages: [
            {
              role: 'system',
              content: 'You are a news summarizer that creates concise, factual bullet-point summaries. Focus on the key facts, figures, and implications.'
            },
            {
              role: 'user',
              content: `Summarize this news article in exactly 3 bullet points, focusing on the most important facts and developments:

${text}

Format as:
• First key point
• Second key point
• Third key point`
            }
          ],
          options: {
            temperature: 0.1,
            frequency_penalty: 0.1
          }
        })
      });

      if (!response.ok) {
        return 'Unable to generate summary';
      }

      const data = await response.json();
      return data.choices[0].message.content || 'No summary available';
    } catch (error) {
      console.error('Error generating summary:', error);
      return 'Failed to generate summary';
    }
  }
}

export async function chatWithPerplexity(messages: Message[]): Promise<string> {
  try {
    // Initialize Supabase client with async cookie handling
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: any) {
            cookieStore.set({ name, value, ...options });
          },
          remove(name: string, options: any) {
            cookieStore.delete({ name, ...options });
          },
        },
      }
    );

    // Get authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('Unauthorized - Please sign in');
    }

    // Fetch user's business cards
    const { data: cards, error: cardsError } = await supabase
      .from('business_cards')
      .select(`
        id,
        name,
        title,
        company,
        email,
        phone,
        address,
        notes,
        created_at,
        updated_at,
        user_id
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (cardsError) {
      console.error('Error fetching business cards:', cardsError);
      throw new Error('Failed to fetch business cards');
    }

    // Format the response for the AI
    const cardSummary = cards ? {
      total_cards: cards.length,
      cards: cards.map(card => ({
        name: card.name,
        title: card.title,
        company: card.company,
        contact: {
          email: card.email,
          phone: card.phone,
          address: card.address
        },
        notes: card.notes,
        added: new Date(card.created_at).toLocaleDateString()
      }))
    } : { total_cards: 0, cards: [] };

    // Add system prompt if not present
    const systemPromptWithData = getSystemPrompt() + `\n\nCurrent user's business card data:\n${JSON.stringify(cardSummary, null, 2)}`;
    const systemMessage: Message = { role: 'system', content: systemPromptWithData };
    const messagesWithSystem = messages[0].role === 'system' 
      ? messages
      : [systemMessage, ...messages];

    const agent = new https.Agent({
      rejectUnauthorized: false
    });

    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      agent,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`
      },
      body: JSON.stringify({
        model: 'sonar',
        messages: messagesWithSystem.map(({ role, content }) => ({ role, content })),
        options: {
          temperature: 0.7,
          top_p: 0.9
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Perplexity API error:', errorText);
      throw new Error(`API request failed with status ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error('Error calling Perplexity API:', error);
    throw error;
  }
} 