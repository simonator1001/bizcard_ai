import axios from 'axios';
import sharp from 'sharp';
import { TOGETHER_API_KEY, VISION_MODEL, OCR_PROMPT } from './ocr-config';

interface OCRResponse {
  words_result: {
    NAME?: { words: string };
    NAME_ZH?: { words: string };
    TITLE?: { words: string };
    TITLE_ZH?: { words: string };
    COMPANY?: { words: string };
    COMPANY_ZH?: { words: string };
    EMAIL?: { words: string };
    MOBILE?: { words: string };
    ADDR?: { words: string };
    ADDR_ZH?: { words: string };
  };
  raw_text: string;
}

const axiosInstance = axios.create({
  baseURL: 'https://api.together.xyz',
  headers: {
    'Authorization': `Bearer ${TOGETHER_API_KEY}`,
    'Content-Type': 'application/json'
  }
});

const MAX_RETRIES = 3;
const INITIAL_DELAY = 1000;
const MAX_DELAY = 5000;
const TIMEOUT = 60000;

async function compressImage(base64Image: string): Promise<string> {
  try {
    // Extract base64 data
    const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');

    console.log('[OCR] Original image size:', Math.ceil((base64Data.length * 3) / 4 / 1024), 'KB');

    // Process image with sharp
    const processedBuffer = await sharp(buffer)
      .resize(1200, 1200, { // Reduced max dimensions
        fit: 'inside',
        withoutEnlargement: true
      })
      .grayscale() // Convert to grayscale
      .normalise() // Normalize contrast
      .jpeg({ 
        quality: 85, // Reduced quality
        chromaSubsampling: '4:2:0', // Better compression
        force: true // Force JPEG output
      })
      .toBuffer();

    const compressedBase64 = processedBuffer.toString('base64');
    console.log('[OCR] Compressed image size:', Math.ceil((compressedBase64.length * 3) / 4 / 1024), 'KB');

    return `data:image/jpeg;base64,${compressedBase64}`;
  } catch (error) {
    console.error('[OCR] Image compression error:', error);
    return base64Image; // Return original if compression fails
  }
}

function cleanOCRResponse(text: string): string {
  // Remove any text before the first {
  const startIndex = text.indexOf('{');
  const endIndex = text.lastIndexOf('}');
  
  if (startIndex === -1 || endIndex === -1) {
    console.error('No valid JSON structure found in:', text);
    throw new Error('Invalid response format');
  }

  // Extract just the JSON part
  let jsonText = text.slice(startIndex, endIndex + 1);
  
  // Clean up common issues
  jsonText = jsonText
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // Remove control characters
    .replace(/\\n/g, ' ') // Replace newlines with spaces
    .replace(/\s+/g, ' ') // Normalize whitespace
    .replace(/",\s*}/g, '"}') // Fix trailing commas
    .replace(/,\s*]/g, ']') // Fix trailing commas in arrays
    .trim();

  // Validate JSON structure
  try {
    JSON.parse(jsonText);
    return jsonText;
  } catch (e) {
    console.error('Failed to parse cleaned JSON:', jsonText);
    throw new Error('Invalid JSON structure');
  }
}

export async function recognizeBusinessCard(imageBase64: string): Promise<OCRResponse> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      console.log(`[OCR] Attempt ${attempt + 1}: Starting OCR request...`);
      
      // Compress image before processing
      console.log('[OCR] Compressing image...');
      const compressedImage = await compressImage(imageBase64);
      
      // Validate and clean the base64 string
      const base64Data = compressedImage.includes('base64,') 
        ? compressedImage.split('base64,')[1] 
        : compressedImage;

      const sizeInBytes = Math.ceil((base64Data.length * 3) / 4);
      console.log(`[OCR] Final image size: ${(sizeInBytes / 1024 / 1024).toFixed(2)}MB`);

      // Add request ID for tracking
      const requestId = Date.now().toString();
      console.log(`[OCR] Request ID: ${requestId}`);

      const requestBody = {
        model: VISION_MODEL,
        messages: [
          {
            role: "system",
            content: "You are a business card OCR system. For names, titles, companies, and addresses, strictly separate English and Chinese text. Never mix them."
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: OCR_PROMPT
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${base64Data}`
                }
              }
            ]
          }
        ],
        temperature: 0.1,
        max_tokens: 2000,
        top_p: 0.9,
        frequency_penalty: 0.1,
        presence_penalty: 0.1
      };

      // Make the API request with proper error handling and retry logic
      const response = await axiosInstance.post('/v1/chat/completions', requestBody, {
        timeout: TIMEOUT,
        onUploadProgress: (progressEvent) => {
          const total = progressEvent.total || progressEvent.loaded;
          const progress = Math.round((progressEvent.loaded * 100) / total);
          console.log(`[OCR] Upload progress: ${progress}%`);
        },
        validateStatus: (status) => status < 500, // Don't reject if status < 500
      });

      console.log(`[OCR] Response status: ${response.status}`);

      // Check for rate limiting
      if (response.status === 429) {
        const retryAfter = parseInt(response.headers['retry-after'] || '5');
        console.log(`[OCR] Rate limited. Waiting ${retryAfter} seconds...`);
        await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
        throw new Error('Rate limited');
      }

      // Check for other error responses
      if (response.status !== 200) {
        console.error('[OCR] API Error Response:', response.data);
        throw new Error(`API returned status ${response.status}`);
      }

      if (!response.data?.choices?.[0]?.message?.content) {
        throw new Error('Invalid API response structure');
      }

      const extractedText = response.data.choices[0].message.content.trim();
      console.log(`[OCR] Raw response:`, extractedText);

      // Clean and parse the response
      const cleanedJson = cleanOCRResponse(extractedText);
      console.log(`[OCR] Cleaned JSON:`, cleanedJson);
      
      const parsedJson = JSON.parse(cleanedJson);
      console.log(`[OCR] Parsed JSON:`, parsedJson);

      // Map to our format
      const result: OCRResponse = {
        words_result: {
          NAME: { words: parsedJson.name?.english || '' },
          NAME_ZH: { words: parsedJson.name?.chinese || '' },
          TITLE: { words: parsedJson.title?.english || '' },
          TITLE_ZH: { words: parsedJson.title?.chinese || '' },
          COMPANY: { words: parsedJson.company?.english || '' },
          COMPANY_ZH: { words: parsedJson.company?.chinese || '' },
          EMAIL: { words: parsedJson.email || '' },
          MOBILE: { words: parsedJson.phone || '' },
          ADDR: { words: parsedJson.address?.english || '' },
          ADDR_ZH: { words: parsedJson.address?.chinese || '' }
        },
        raw_text: cleanedJson
      };

      // Validate result
      if (!Object.values(result.words_result).some(field => field.words)) {
        console.warn('No valid data found in OCR result');
        throw new Error('No valid data extracted');
      }

      return result;

    } catch (error: any) {
      lastError = error instanceof Error ? error : new Error(error?.message || 'Unknown error');
      console.error(`[OCR] Attempt ${attempt + 1} failed:`, {
        message: error.message,
        code: error.code,
        response: error.response?.data,
        status: error.response?.status
      });

      if (attempt === MAX_RETRIES - 1) {
        throw new Error(`OCR failed after ${MAX_RETRIES} attempts. Last error: ${lastError.message}`);
      }

      const delay = Math.min(INITIAL_DELAY * Math.pow(2, attempt), MAX_DELAY);
      console.log(`[OCR] Waiting ${delay}ms before retry...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError || new Error('OCR process failed');
} 