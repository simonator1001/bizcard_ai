import fetch from 'node-fetch';
import https from 'https';
import { Message } from '@/types/chat';

// Configure HTTPS agent to handle TLS record overflow
const agent = new https.Agent({
  rejectUnauthorized: process.env.NODE_ENV === 'development' ? false : true,
  maxHeaderSize: 32768,
  minVersion: 'TLSv1.2'
});

export async function chatWithPerplexity(messages: Message[]): Promise<string> {
  console.log('Making request to Perplexity API with SSL configuration:', {
    isDev: process.env.NODE_ENV === 'development',
    hasAgent: true,
    sslConfig: {
      rejectUnauthorized: process.env.NODE_ENV === 'development' ? false : true,
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
      message: error.message,
      stack: error.stack
    });
    throw error;
  }
} 