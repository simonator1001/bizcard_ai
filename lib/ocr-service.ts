import axios from 'axios';
import sharp from 'sharp';
import { TOGETHER_API_KEY, VISION_MODEL, OCR_PROMPT } from './ocr-config';

const MAX_RETRIES = 3;
const INITIAL_DELAY = 1000;
const MAX_DELAY = 5000;
const TIMEOUT = 60000;

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
  },
  timeout: TIMEOUT,
  maxContentLength: 10 * 1024 * 1024,
  maxBodyLength: 10 * 1024 * 1024,
  httpsAgent: new (require('https').Agent)({
    rejectUnauthorized: true,
    minVersion: 'TLSv1.2',
    maxVersion: 'TLSv1.3',
    ciphers: 'HIGH:!aNULL:!MD5'
  })
});

async function compressImage(base64Image: string): Promise<string> {
  try {
    // Extract MIME type and base64 data
    const matches = base64Image.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      console.warn('[OCR] Invalid base64 image format, attempting to process as raw base64');
      // Try to process as raw base64
      const buffer = Buffer.from(base64Image, 'base64');
      const metadata = await sharp(buffer).metadata();
      console.log('[OCR] Detected image format:', metadata.format);
      const base64Data = base64Image;
      const mimeType = `image/${metadata.format || 'jpeg'}`;
      return processImageBuffer(buffer, mimeType);
    }

    const mimeType = matches[1];
    const base64Data = matches[2];
    const buffer = Buffer.from(base64Data, 'base64');

    return processImageBuffer(buffer, mimeType);
  } catch (error: any) {
    console.error('[OCR] Image compression error:', error);
    if (error.message?.includes('Input buffer contains unsupported image format')) {
      throw new Error('Unsupported or corrupt image format');
    }
    return base64Image; // Return original if compression fails
  }
}

async function processImageBuffer(buffer: Buffer, mimeType: string): Promise<string> {
  try {
    console.log('[OCR] Original image size:', Math.ceil(buffer.length / 1024), 'KB');
    console.log('[OCR] Image MIME type:', mimeType);

    // Get original image metadata
    const metadata = await sharp(buffer).metadata();
    console.log('[OCR] Image metadata:', {
      width: metadata.width,
      height: metadata.height,
      format: metadata.format,
      space: metadata.space
    });

    // Calculate target dimensions while maintaining aspect ratio
    const MAX_DIMENSION = 1200;
    let width = metadata.width;
    let height = metadata.height;
    
    if (width && height) {
      if (width > height && width > MAX_DIMENSION) {
        height = Math.round((height * MAX_DIMENSION) / width);
        width = MAX_DIMENSION;
      } else if (height > MAX_DIMENSION) {
        width = Math.round((width * MAX_DIMENSION) / height);
        height = MAX_DIMENSION;
      }
    }

    // Process image with sharp
    let processedBuffer = await sharp(buffer)
      .resize(width, height, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .normalize() // Enhance contrast
      .modulate({ // Enhance brightness and saturation slightly
        brightness: 1.1,
        saturation: 1.2
      })
      .sharpen() // Improve text clarity
      .jpeg({
        quality: 85,
        chromaSubsampling: '4:4:4', // Better quality for text
        force: false // Don't force JPEG if original is PNG
      })
      .toBuffer();

    const compressedSize = Math.ceil(processedBuffer.length / 1024);
    console.log('[OCR] Compressed image size:', compressedSize, 'KB');

    // If still too large, apply more aggressive compression
    if (compressedSize > 500) {
      console.log('[OCR] Image still large, applying additional compression...');
      processedBuffer = await sharp(processedBuffer)
        .resize(800, 800, {
          fit: 'inside',
          withoutEnlargement: true
        })
        .jpeg({
          quality: 75,
          chromaSubsampling: '4:2:0',
          force: true,
          mozjpeg: true
        })
        .toBuffer();

      console.log('[OCR] Final image size:', Math.ceil(processedBuffer.length / 1024), 'KB');
    }

    // Determine output format based on input
    const outputMimeType = mimeType.includes('png') ? 'image/png' : 'image/jpeg';
    return `data:${outputMimeType};base64,${processedBuffer.toString('base64')}`;
  } catch (error) {
    console.error('[OCR] Image processing error:', error);
    throw error;
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
  let lastResponse: any = null;
  
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
        timeout: TIMEOUT * (attempt + 1), // Increase timeout with each retry
        onUploadProgress: (progressEvent) => {
          const total = progressEvent.total || progressEvent.loaded;
          const progress = Math.round((progressEvent.loaded * 100) / total);
          console.log(`[OCR] Upload progress: ${progress}%`);
        },
        validateStatus: (status) => status < 500, // Don't reject if status < 500
      });

      console.log(`[OCR] Response status: ${response.status}`);
      lastResponse = response;

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
        throw new Error(`API returned status ${response.status}: ${JSON.stringify(response.data)}`);
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
        console.warn('[OCR] No valid data found in OCR result');
        throw new Error('No valid data extracted');
      }

      return result;

    } catch (error: any) {
      lastError = error instanceof Error ? error : new Error(error?.message || 'Unknown error');
      console.error(`[OCR] Attempt ${attempt + 1} failed:`, {
        message: error.message,
        code: error.code,
        response: error.response?.data,
        status: error.response?.status,
        headers: error.response?.headers
      });

      if (attempt === MAX_RETRIES - 1) {
        // On final attempt, throw a detailed error
        const errorDetails = {
          message: lastError.message,
          lastResponseStatus: lastResponse?.status,
          lastResponseData: lastResponse?.data,
          attempts: attempt + 1,
          finalError: error
        };
        console.error('[OCR] All attempts failed. Error details:', errorDetails);
        throw new Error(`OCR failed after ${MAX_RETRIES} attempts. Details: ${JSON.stringify(errorDetails)}`);
      }

      const delay = Math.min(INITIAL_DELAY * Math.pow(2, attempt), MAX_DELAY);
      console.log(`[OCR] Waiting ${delay}ms before retry...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError || new Error('OCR process failed');
} 