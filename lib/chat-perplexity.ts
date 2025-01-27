import fetch from 'node-fetch';
import https from 'https';
import { Message } from '@/types/chat';

// Configure HTTPS agent for secure connections
const agent = new https.Agent({
  rejectUnauthorized: false,  // Allow all certificates in development
  minVersion: 'TLSv1.2'      // Use modern TLS version
});

function validateMessages(messages: Message[]): boolean {
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

export async function chatWithPerplexity(messages: Message[]): Promise<string> {
  // Validate message format before making the request
  if (!validateMessages(messages)) {
    console.error('Invalid message sequence:', messages);
    throw new Error('Messages must alternate between user and assistant roles after any system messages');
  }

  console.log('Making request to Perplexity API with SSL configuration:', {
    isDev: process.env.NODE_ENV === 'development',
    hasAgent: true,
    sslConfig: {
      rejectUnauthorized: false,
      minVersion: 'TLSv1.2'
    }
  });

  try {
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      agent: agent,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`
      },
      body: JSON.stringify({
        model: 'sonar',
        messages: messages,
        temperature: 0.7,
        max_tokens: 1024,
        top_p: 0.95,
        stream: false
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error response from Perplexity:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      });
      throw new Error(`API request failed with status ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    if (!data.choices?.[0]?.message?.content) {
      console.error('Unexpected API response format:', data);
      throw new Error('Invalid response format from Perplexity API');
    }
    return data.choices[0].message.content;
  } catch (error) {
    console.error('Error calling Perplexity API:', {
      error,
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    throw error;
  }
} 