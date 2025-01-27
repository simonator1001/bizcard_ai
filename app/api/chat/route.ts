import { NextResponse } from 'next/server';
import { getSystemPrompt } from '@/lib/prompts';
import { Message } from '@/types/chat';
import { chatWithPerplexity } from '@/lib/chat-perplexity';
import { createClient } from '@/lib/supabase/server';

function isValidMessage(message: any): message is Message {
  return typeof message === 'object' && 
    message !== null && 
    'role' in message && 
    'content' in message &&
    typeof message.role === 'string' &&
    typeof message.content === 'string' &&
    ['system', 'user', 'assistant'].includes(message.role);
}

function validateMessageSequence(messages: Message[]): boolean {
  // Skip system messages at the start
  let i = 0;
  while (i < messages.length && messages[i].role === 'system') {
    i++;
  }
  
  // Check alternating user/assistant messages
  let expectedRole = 'user';
  while (i < messages.length) {
    if (messages[i].role !== expectedRole) {
      return false;
    }
    expectedRole = expectedRole === 'user' ? 'assistant' : 'user';
    i++;
  }
  
  return true;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    let messages = body.messages;

    if (!Array.isArray(messages) || !messages.every(isValidMessage)) {
      return NextResponse.json({ error: 'Invalid messages format' }, { status: 400 });
    }

    // Create Supabase client using the helper function
    const supabase = await createClient();

    // Get authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.error('Auth error:', userError);
      return NextResponse.json({ error: 'Authentication error' }, { status: 401 });
    }
    
    if (!user) {
      console.error('No user found');
      return NextResponse.json({ error: 'User not found' }, { status: 401 });
    }

    console.log('Authenticated user:', user.id);

    // Fetch user's business cards
    const { data: cards, error: cardsError } = await supabase
      .from('business_cards')
      .select('*')
      .eq('user_id', user.id);

    if (cardsError) {
      console.error('Error fetching business cards:', cardsError);
      return NextResponse.json({ error: 'Error fetching business cards' }, { status: 500 });
    }

    if (!cards) {
      console.log('No cards found for user');
      return NextResponse.json({ error: 'No business cards found' }, { status: 404 });
    }

    console.log('Fetched cards:', cards.length);

    // Format business card data for the system prompt
    const businessCardData = {
      total_cards: cards.length,
      cards: cards.map(card => ({
        name: card.name || '',
        title: card.title || '',
        company: card.company || '',
        contact: {
          email: card.email || '',
          phone: card.phone || '',
          address: card.address || ''
        },
        notes: card.notes || '',
        added: card.created_at
      }))
    };

    // Always update system message with latest business card data
    const systemPrompt = getSystemPrompt();
    const systemMessage = {
      role: 'system',
      content: `${systemPrompt}\n\nCurrent business card data:\n${JSON.stringify(businessCardData, null, 2)}`
    };

    // Remove any existing system messages
    messages = messages.filter(msg => msg.role !== 'system');

    // Ensure messages are properly alternating
    if (!validateMessageSequence(messages)) {
      console.error('Invalid message sequence:', messages);
      return NextResponse.json({ error: 'Messages must alternate between user and assistant roles' }, { status: 400 });
    }

    // Add system message at the start
    messages.unshift(systemMessage);

    console.log('Sending messages to Perplexity with business card data');

    try {
      // Call Perplexity API with the new implementation
      const response = await chatWithPerplexity(messages);
      return NextResponse.json({ content: response });
    } catch (error) {
      console.error('Error calling Perplexity API:', error);
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Error calling Perplexity API' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Error in chat route:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
} 