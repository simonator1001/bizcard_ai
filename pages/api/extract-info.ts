import { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import { OPENROUTER_API_KEY } from '@/lib/ocr-config';

const DEEPBRICK_API_KEY = process.env.DEEPBRICK_API_KEY || '';
const DEEPBRICK_API_KEY_2 = process.env.DEEPBRICK_API_KEY_2 || '';

function getApiKey(): string {
  // Primary: OpenRouter
  if (OPENROUTER_API_KEY) return OPENROUTER_API_KEY;
  // Fallback: Deepbrick key rotation
  const keys = [DEEPBRICK_API_KEY, DEEPBRICK_API_KEY_2].filter(k => k);
  if (keys.length === 0) throw new Error('No API key configured');
  const idx = Math.floor(Date.now() / 1000) % keys.length;
  return keys[idx];
}

function getEndpoint(): string {
  return OPENROUTER_API_KEY ? 'https://openrouter.ai/api/v1' : 'https://api.deepbricks.ai/v1';
}

const axiosInstance = axios.create({
  baseURL: getEndpoint(),
  headers: {
    'Authorization': `Bearer ${getApiKey()}`,
    ...(OPENROUTER_API_KEY ? {
      'HTTP-Referer': 'https://bizcardai.vercel.app',
      'X-Title': 'BizCard AI'
    } : {}),
    'Content-Type': 'application/json',
  },
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'No text provided' });
    }

    console.log('[EXTRACT] Processing text:', text);

    // Check if the input is already in JSON format
    try {
      const parsedInput = JSON.parse(text);
      if (parsedInput && typeof parsedInput === 'object') {
        console.log('[EXTRACT] Input is already in JSON format, returning as is');
        return res.status(200).json(parsedInput);
      }
    } catch (e) {
      console.log('[EXTRACT] Input is not JSON, proceeding with extraction');
    }

    const requestBody = {
      model: 'claude-sonnet-4.5',
      messages: [
        {
          role: "system",
          content: "You are a precise business card information extractor. Extract only the information that is clearly visible in the text. If a field is uncertain, mark it as 'N/A'.",
        },
        {
          role: "user",
          content: `Extract information from this business card text and return ONLY a JSON object with these fields:
- name: The person's name (include both English and Chinese if available)
- title: Job title or position
- company: Company name (include both English and Chinese if available)
- email: Email address
- phone: Phone number (format as a single string)
- address: Full address (include both English and Chinese if available)
- website: Website URL or domain

Original text:
${text}

Return ONLY the JSON object with no additional text.`,
        },
      ],
      temperature: 0.1,
      max_tokens: 1000,
      top_p: 0.9,
    };

    console.log('[EXTRACT] Calling Deepbrick API...');
    const response = await axiosInstance.post('/chat/completions', requestBody);

    if (!response.data?.choices?.[0]?.message?.content) {
      console.error('[EXTRACT] Invalid API response:', response.data);
      throw new Error('Invalid API response');
    }

    const result = response.data.choices[0].message.content.trim();
    console.log('[EXTRACT] Raw API response:', result);

    // Extract JSON from the response
    const jsonMatch = result.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('[EXTRACT] No JSON found in response');
      throw new Error('No valid JSON found in response');
    }

    const jsonStr = jsonMatch[0];
    console.log('[EXTRACT] Extracted JSON:', jsonStr);

    const parsedResult = JSON.parse(jsonStr);
    console.log('[EXTRACT] Parsed result:', parsedResult);

    res.status(200).json(parsedResult);
  } catch (error: any) {
    console.error('[EXTRACT] Error:', error);
    res.status(500).json({
      error: 'Failed to process the text',
      message: error.message,
      details: error.response?.data,
    });
  }
}
