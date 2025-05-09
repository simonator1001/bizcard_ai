import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  const apiKey = process.env.PERPLEXITY_API_KEY || process.env.NEXT_PUBLIC_PERPLEXITY_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'No Perplexity API key configured' }, { status: 500 });
  }

  let body: { messages: any[] };
  try {
    body = await req.json();
  } catch (e) {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (!body.messages || !Array.isArray(body.messages)) {
    return NextResponse.json({ error: 'Missing or invalid messages array' }, { status: 400 });
  }

  // Authenticate user and fetch business cards
  let cards = [];
  let userId = null;
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized - Please sign in' }, { status: 401 });
    }
    userId = user.id;
    const { data: userCards, error: cardsError } = await supabase
      .from('business_cards')
      .select(`id, name, title, company, email, phone, address, notes, created_at, updated_at, user_id`)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (cardsError) {
      return NextResponse.json({ error: 'Failed to fetch business cards', details: cardsError }, { status: 500 });
    }
    cards = userCards || [];
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch user or cards', details: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }

  // Summarize cards for the system prompt (limit to 10 for brevity)
  const cardSummary = cards.slice(0, 10).map(card => {
    return `${card.name || ''} (${card.title || ''}) at ${card.company || ''}${card.email ? ', email: ' + card.email : ''}${card.phone ? ', phone: ' + card.phone : ''}`;
  }).join('\n');
  const systemPrompt = cards.length > 0
    ? `The user has ${cards.length} business cards in their database. Here are up to 10 of them:\n${cardSummary}\nAlways answer questions about the user's business cards using this data, including the total count.`
    : `The user has no business cards saved.`;

  // Inject system message at the start
  const messages = [
    { role: 'system', content: systemPrompt },
    ...body.messages
  ];

  try {
    const perplexityRes = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-sonar-small-128k-online',
        messages,
        temperature: 0.7,
        max_tokens: 1024,
        top_p: 0.95,
        stream: false
      })
    });

    if (!perplexityRes.ok) {
      const errorText = await perplexityRes.text();
      return NextResponse.json({ error: 'Perplexity API error', details: errorText }, { status: perplexityRes.status });
    }

    const data = await perplexityRes.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      return NextResponse.json({ error: 'Invalid response from Perplexity', details: data }, { status: 500 });
    }
    return NextResponse.json({ content });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to call Perplexity', details: error?.message || String(error) }, { status: 500 });
  }
} 