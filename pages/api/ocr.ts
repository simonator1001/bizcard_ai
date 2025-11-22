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
  console.log('[OCR-API-DEBUG] 1. Request received');
  
  if (req.method !== 'POST') {
    console.log('[OCR-API-DEBUG] Invalid method:', req.method);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { image } = req.body;

    if (!image) {
      console.log('[OCR-API-DEBUG] No image in request');
      return res.status(400).json({ error: 'No image provided' });
    }

    console.log('[OCR-API-DEBUG] 2. Processing image, size:', Math.ceil(image.length / 1024), 'KB');

    // Ensure image is in base64 format
    const base64Data = image.includes('base64,') 
      ? image 
      : `data:image/jpeg;base64,${image}`;

    // Process the image
    console.log('[OCR-API-DEBUG] 3. Calling OCR service');
    const result = await recognizeBusinessCard(base64Data);
    console.log('[OCR-API-DEBUG] 4. OCR service response received');
    
    // Log the extracted data for debugging
    console.log('[OCR-API-DEBUG] Extracted data:', {
      name: {
        english: result.words_result.NAME?.words || null,
        chinese: result.words_result.NAME_ZH?.words || null
      },
      title: {
        english: result.words_result.TITLE?.words || null,
        chinese: result.words_result.TITLE_ZH?.words || null
      },
      company: {
        english: result.words_result.COMPANY?.words || null,
        chinese: result.words_result.COMPANY_ZH?.words || null
      },
      email: result.words_result.EMAIL?.words || null,
      phone: result.words_result.MOBILE?.words || null,
      address: {
        english: result.words_result.ADDR?.words || null,
        chinese: result.words_result.ADDR_ZH?.words || null
      }
    });
    
    // Return the processed results
    const response = {
      name: {
        english: result.words_result.NAME?.words || '',
        chinese: result.words_result.NAME_ZH?.words || ''
      },
      title: {
        english: result.words_result.TITLE?.words || '',
        chinese: result.words_result.TITLE_ZH?.words || ''
      },
      company: {
        english: result.words_result.COMPANY?.words || '',
        chinese: result.words_result.COMPANY_ZH?.words || ''
      },
      email: result.words_result.EMAIL?.words || '',
      phone: result.words_result.MOBILE?.words || '',
      address: {
        english: result.words_result.ADDR?.words || '',
        chinese: result.words_result.ADDR_ZH?.words || ''
      },
      raw_text: result.raw_text
    };

    console.log('[OCR-API-DEBUG] 5. Sending response');
    res.status(200).json(response);
  } catch (error: any) {
    console.error('[OCR-API-DEBUG] Error:', {
      message: error.message,
      stack: error.stack,
      response: error.response?.data,
      status: error.response?.status
    });
    
    res.status(500).json({ 
      error: 'OCR processing failed',
      message: error.message,
      details: error.response?.data || error.stack
    });
  }
} 