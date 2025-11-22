import { NextResponse } from 'next/server';
import axios from 'axios';

const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY;
const NEXT_PUBLIC_PERPLEXITY_API_KEY = process.env.NEXT_PUBLIC_PERPLEXITY_API_KEY;

// Define request body type
interface TestRequestBody {
  model: string;
  messages: Array<{
    role: string;
    content: string;
  }>;
  temperature: number;
  max_tokens: number;
}

// Define request body outside try block so it's accessible in catch block
const requestBody: TestRequestBody = {
  model: "llama-3.1-sonar-small-128k-online",
  messages: [{
    role: "user",
    content: "Say 'Connection successful' if you can read this."
  }],
  temperature: 0.1,
  max_tokens: 10
};

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
    
    console.log('Request details:', {
      url: 'https://api.perplexity.ai/chat/completions',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey.substring(0, 10)}...`,
        'Content-Type': 'application/json'
      },
      body: requestBody
    });

    const response = await axios.post('https://api.perplexity.ai/chat/completions', 
      requestBody,
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        timeout: 30000,
        maxBodyLength: Infinity,
        maxContentLength: Infinity
      }
    );

    console.log('Response status:', response.status);
    console.log('Response headers:', response.headers);

    const data = response.data;
    console.log('API Response:', data);

    return NextResponse.json({ 
      success: true, 
      message: data.choices[0].message.content 
    });
  } catch (error) {
    console.error('API Test error:', error);
    if (axios.isAxiosError(error)) {
      return NextResponse.json({ 
        error: 'API request failed', 
        status: error.response?.status,
        details: error.response?.data,
        requestInfo: {
          url: 'https://api.perplexity.ai/chat/completions',
          method: 'POST',
          headers: {
            'Authorization': 'Bearer [HIDDEN]',
            'Content-Type': 'application/json'
          },
          body: requestBody
        }
      }, { status: error.response?.status || 500 });
    }
    return NextResponse.json({ 
      error: 'API test failed', 
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 