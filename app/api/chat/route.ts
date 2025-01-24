import { NextResponse } from 'next/server';
import { Message } from '@/types/chat';
import { getSystemPrompt } from '@/lib/prompts';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import fetch from 'node-fetch';
import https from 'https';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { messages } = body;

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Invalid request body - messages must be an array' },
        { status: 400 }
      );
    }

    if (messages.length === 0) {
      return NextResponse.json(
        { error: 'Messages array cannot be empty' },
        { status: 400 }
      );
    }

    // Validate message format
    const isValidMessage = (msg: any): msg is Message => 
      msg && 
      typeof msg === 'object' && 
      ['system', 'user', 'assistant'].includes(msg.role) && 
      typeof msg.content === 'string';

    if (!messages.every(isValidMessage)) {
      return NextResponse.json(
        { error: 'Invalid message format' },
        { status: 400 }
      );
    }

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
      return NextResponse.json(
        { error: 'Unauthorized - Please sign in' },
        { status: 401 }
      );
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
      return NextResponse.json(
        { error: 'Failed to fetch business cards' },
        { status: 500 }
      );
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

    // Make direct API call to Perplexity
    const agent = new https.Agent({
      rejectUnauthorized: false
    });

    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      // @ts-ignore - node-fetch types don't match https.Agent
      agent,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`
      },
      body: JSON.stringify({
        model: 'sonar',
        messages: messagesWithSystem,
        options: {
          temperature: 0.7,
          top_p: 0.9
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Perplexity API error:', errorText);
      return NextResponse.json(
        { error: `Perplexity API error: ${errorText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json({ content: data.choices[0].message.content });
  } catch (error) {
    console.error('Error in chat API:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
