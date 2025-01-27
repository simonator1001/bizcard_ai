import fetch from 'node-fetch';
import https from 'https';
import { Message } from '@/types/chat';

// Configure HTTPS agent for secure connections
const agent = new https.Agent({
  rejectUnauthorized: false,  // Allow all certificates in development
  minVersion: 'TLSv1.2'      // Use modern TLS version
});

export async function chatWithPerplexity(messages: Message[]): Promise<string> {
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