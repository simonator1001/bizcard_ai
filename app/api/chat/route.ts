import { NextResponse } from 'next/server';
import { chatWithPerplexity } from '@/lib/perplexity-client';

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
    const isValidMessage = (msg: any) => 
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

    const response = await chatWithPerplexity(messages);
    return NextResponse.json({ response });
  } catch (error) {
    console.error('Error in chat API:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
} 