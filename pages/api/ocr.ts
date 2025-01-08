import { NextApiRequest, NextApiResponse } from 'next';
import { recognizeBusinessCard } from '@/lib/ocr-service';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { image } = req.body;

    if (!image) {
      return res.status(400).json({ error: 'No image provided' });
    }

    // Ensure image is in base64 format
    const base64Data = image.includes('base64,') 
      ? image 
      : `data:image/jpeg;base64,${image}`;

    // Process the image
    const result = await recognizeBusinessCard(base64Data);
    
    // Return the processed results
    res.status(200).json({
      name: {
        english: result.words_result.NAME?.words,
        chinese: result.words_result.NAME_ZH?.words
      },
      title: {
        english: result.words_result.TITLE?.words,
        chinese: result.words_result.TITLE_ZH?.words
      },
      company: {
        english: result.words_result.COMPANY?.words,
        chinese: result.words_result.COMPANY_ZH?.words
      },
      email: result.words_result.EMAIL?.words,
      phone: result.words_result.MOBILE?.words,
      address: {
        english: result.words_result.ADDR?.words,
        chinese: result.words_result.ADDR_ZH?.words
      },
      raw_text: result.raw_text
    });
  } catch (error: any) {
    console.error('OCR API error:', error);
    res.status(500).json({ 
      error: 'OCR processing failed',
      message: error.message,
      details: error.response?.data
    });
  }
} 