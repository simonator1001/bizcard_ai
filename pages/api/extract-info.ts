import type { NextApiRequest, NextApiResponse } from 'next'
import { createWorker } from 'tesseract.js'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { image, originalImage } = req.body

    if (!image && !originalImage) {
      return res.status(400).json({ error: 'No image data provided' })
    }

    // Try both processed and original images
    const results = await Promise.all([
      processImage(image),
      processImage(originalImage)
    ]);

    // Combine and validate results
    const combinedResult = mergeResults(results);
    
    if (!isValidResult(combinedResult)) {
      throw new Error('No valid information extracted');
    }

    return res.status(200).json(combinedResult);

  } catch (error) {
    console.error('API error:', error);
    return res.status(500).json({ 
      error: 'OCR processing failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

async function processImage(imageData: string) {
  const worker = await createWorker('eng+chi_tra');
  try {
    const { data: { text } } = await worker.recognize(imageData);
    const extractedInfo = extractBusinessCardInfo(text);
    return extractedInfo;
  } finally {
    await worker.terminate();
  }
}

function mergeResults(results: any[]) {
  const merged: any = {};
  const fields = ['name', 'title', 'title_zh', 'company', 'email', 'phone'];
  
  fields.forEach(field => {
    merged[field] = results
      .map(r => r[field])
      .find(val => val && val.length > 0) || '';
  });
  
  return merged;
}

function isValidResult(result: any) {
  return result.name || result.email || result.phone || result.title || result.company;
}

function extractBusinessCardInfo(text: string) {
  const lines = text.split('\n').map(line => line.trim()).filter(Boolean);
  const info: any = {
    name: '',
    title: '',
    title_zh: '',
    company: '',
    email: '',
    phone: ''
  };

  lines.forEach((line, index) => {
    // Email
    if (line.includes('@')) {
      info.email = line.trim();
    }
    // Phone (improved pattern matching)
    else if (/[\d\(\)\+\-\s]{8,}/.test(line)) {
      info.phone = line.trim();
    }
    // Name (usually first non-numeric, non-email line)
    else if (!info.name && !/^\d+/.test(line) && !line.includes('@')) {
      info.name = line.trim();
    }
    // Title (usually after name)
    else if (info.name && !info.title && line.length < 50) {
      // Check if it's Chinese
      if (/[\u4e00-\u9fa5]/.test(line)) {
        info.title_zh = line.trim();
      } else {
        info.title = line.trim();
      }
    }
    // Company (usually longer line)
    else if (!info.company && line.length > 10) {
      info.company = line.trim();
    }
  });

  return info;
} 