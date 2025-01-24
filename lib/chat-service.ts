import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Message } from '@/types/chat';
import { getSystemPrompt } from '@/lib/prompts';
import fetch from 'node-fetch';
import https from 'https';

export async function handleChatRequest(messages: Message[]): Promise<string> {
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
    throw new Error(`API request failed with status ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
} 