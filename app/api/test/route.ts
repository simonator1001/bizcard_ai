import { NextResponse } from 'next/server';

const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY;
const NEXT_PUBLIC_PERPLEXITY_API_KEY = process.env.NEXT_PUBLIC_PERPLEXITY_API_KEY;

export async function GET() {
  console.log('API Key check:', {
    privateKeyExists: !!PERPLEXITY_API_KEY,
    privateKeyLength: PERPLEXITY_API_KEY?.length,
    privateKeyPrefix: PERPLEXITY_API_KEY?.substring(0, 5),
    publicKeyExists: !!NEXT_PUBLIC_PERPLEXITY_API_KEY,
    publicKeyLength: NEXT_PUBLIC_PERPLEXITY_API_KEY?.length,
    publicKeyPrefix: NEXT_PUBLIC_PERPLEXITY_API_KEY?.substring(0, 5),
    keysMatch: PERPLEXITY_API_KEY === NEXT_PUBLIC_PERPLEXITY_API_KEY
  });

  // Try both keys
  const apiKey = NEXT_PUBLIC_PERPLEXITY_API_KEY || PERPLEXITY_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ error: 'No API key configured' }, { status: 500 });
  }

  try {
    console.log('Testing Perplexity API connection...');
    
    const requestBody = {
      model: "llama-3.1-sonar-small-128k-online",
      messages: [{
        role: "user",
        content: "Say 'Connection successful' if you can read this."
      }],
      temperature: 0.1,
      max_tokens: 10
    };
    
    console.log('Request details:', {
      url: 'https://api.perplexity.ai/chat/completions',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey.substring(0, 10)}...`,
        'Content-Type': 'application/json'
      },
      body: requestBody
    });

    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Perplexity API error:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        error: errorText
      });
      return NextResponse.json({ 
        error: 'API request failed', 
        status: response.status,
        details: errorText,
        requestInfo: {
          url: 'https://api.perplexity.ai/chat/completions',
          method: 'POST',
          headers: {
            'Authorization': 'Bearer [HIDDEN]',
            'Content-Type': 'application/json'
          },
          body: requestBody
        }
      }, { status: response.status });
    }

    const data = await response.json();
    console.log('API Response:', data);

    return NextResponse.json({ 
      success: true, 
      message: data.choices?.[0]?.message?.content || 'No content in response'
    });

  } catch (error) {
    console.error('Error testing Perplexity API:', error);
    return NextResponse.json({ 
      error: 'Connection failed', 
      details: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
} 