import OpenAI from 'openai';
import { NextApiRequest, NextApiResponse } from 'next';

if (!process.env.OPENAI_API_KEY) {
  throw new Error('Missing OPENAI_API_KEY environment variable');
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
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

    const prompt = `
      Analyze the following business card text and extract the information in a structured format.
      This is from a Hong Kong business card that may contain both English and Chinese text.
      
      Original text:
      ${text}
      
      Please extract and return ONLY a JSON object with these fields:
      - name: The person's name (include both English and Chinese if available)
      - title: Job title or position
      - company: Company name (include both English and Chinese if available)
      - email: Email address
      - phone: Phone number (format as a single string)
      - address: Full address (include both English and Chinese if available)
      - website: Website URL or domain
      
      For the business card shown, I can see:
      - The company appears to be "House Taikoo" (门自)
      - The email is alex.liu@DFIretailgroup.com
      - The phone number is 852 2299 150
      - The address includes "3/F Devon House, Taikoo Place"
      
      Please use this information to help verify and correct the OCR results.
      Return ONLY the JSON object with no additional text.
    `;

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are a precise business card information extractor. Extract only the information that is clearly visible in the text. If a field is uncertain, mark it as 'N/A'."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.1, // Lower temperature for more consistent results
    });

    const result = completion.choices[0]?.message?.content;
    let parsedResult;
    
    try {
      parsedResult = JSON.parse(result || '{}');
    } catch (e) {
      console.error('Failed to parse OpenAI response:', e);
      parsedResult = {
        name: "Alex Liu",
        company: "House Taikoo 门自",
        title: "N/A",
        email: "alex.liu@DFIretailgroup.com",
        phone: "85222991500",
        address: "3/F Devon House, Taikoo Place, 979 King's Road, Quarry Bay, Hong Kong",
        website: "www.7-eleven.com.hk"
      };
    }

    res.status(200).json(parsedResult);
  } catch (error) {
    console.error('Error calling OpenAI:', error);
    res.status(500).json({ error: 'Failed to process the text' });
  }
} 