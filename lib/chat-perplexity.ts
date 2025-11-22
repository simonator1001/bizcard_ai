import axios from 'axios';
import { Message } from '@/types/chat';

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

  try {
    const response = await axios.post('https://api.perplexity.ai/chat/completions', 
      {
        model: 'sonar',
        messages: messages,
        temperature: 0.7,
        max_tokens: 1024,
        top_p: 0.95,
        stream: false
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`,
          'Accept': 'application/json'
        },
        timeout: 30000,
        maxBodyLength: Infinity,
        maxContentLength: Infinity
      }
    );

    if (!response.data?.choices?.[0]?.message?.content) {
      console.error('Unexpected API response format:', response.data);
      throw new Error('Invalid response format from Perplexity API');
    }
    return response.data.choices[0].message.content;
  } catch (error) {
    console.error('Error calling Perplexity API:', {
      error,
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    throw error;
  }
} 