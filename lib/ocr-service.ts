import axios from 'axios';
import sharp from 'sharp';
import { OPENROUTER_API_KEY, VISION_MODEL, FALLBACK_VISION_MODEL, OCR_PROMPT } from './ocr-config';

const MAX_RETRIES = 3;
const INITIAL_DELAY = 1000;
const MAX_DELAY = 5000;
const TIMEOUT = 60000;

// OpenRouter API
const OPENROUTER_BASE = 'https://openrouter.ai/api/v1';

// Deepbrick fallback
const DEEPBRICK_BASE = 'https://api.deepbricks.ai/v1';
const DEEPBRICK_API_KEY = process.env.DEEPBRICK_API_KEY || '';

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

function getApiKey(): { key: string; endpoint: string; model: string } {
  // Primary: OpenRouter with Qwen VL Plus
  if (OPENROUTER_API_KEY) {
    return { key: OPENROUTER_API_KEY, endpoint: OPENROUTER_BASE, model: VISION_MODEL };
  }
  // Fallback: Deepbrick with Claude Sonnet
  return { key: DEEPBRICK_API_KEY, endpoint: DEEPBRICK_BASE, model: FALLBACK_VISION_MODEL };
}

function createAxiosInstance(endpoint: string, key: string) {
  const headers: Record<string, string> = {
    'Authorization': `Bearer ${key}`,
    'Content-Type': 'application/json',
  };
  // OpenRouter requires HTTP-Referer and X-Title headers
  if (endpoint === OPENROUTER_BASE) {
    headers['HTTP-Referer'] = 'https://bizcardai.vercel.app';
    headers['X-Title'] = 'BizCard AI';
  }
  
  return axios.create({
    baseURL: endpoint,
    headers,
    timeout: TIMEOUT,
    maxContentLength: 10 * 1024 * 1024,
    maxBodyLength: 10 * 1024 * 1024,
    httpsAgent: new (require('https').Agent)({
      rejectUnauthorized: true,
      minVersion: 'TLSv1.2',
    }),
  });
}

async function compressImage(base64Image: string): Promise<string> {
  try {
    const matches = base64Image.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      console.warn('[OCR] Invalid base64 image format, processing as raw base64');
      const buffer = Buffer.from(base64Image, 'base64');
      const metadata = await sharp(buffer).metadata();
      console.log('[OCR] Detected image format:', metadata.format);
      return processImageBuffer(buffer, `image/${metadata.format || 'jpeg'}`);
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
    return base64Image;
  }
}

async function processImageBuffer(buffer: Buffer, mimeType: string): Promise<string> {
  try {
    console.log('[OCR] Original image size:', Math.ceil(buffer.length / 1024), 'KB');
    console.log('[OCR] Image MIME type:', mimeType);

    const metadata = await sharp(buffer).metadata();
    console.log('[OCR] Image metadata:', {
      width: metadata.width,
      height: metadata.height,
      format: metadata.format,
      space: metadata.space,
    });

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

    let processedBuffer = await sharp(buffer)
      .resize(width, height, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .normalize()
      .modulate({ brightness: 1.1, saturation: 1.2 })
      .sharpen()
      .jpeg({
        quality: 85,
        chromaSubsampling: '4:4:4',
        force: false,
      })
      .toBuffer();

    const compressedSize = Math.ceil(processedBuffer.length / 1024);
    console.log('[OCR] Compressed image size:', compressedSize, 'KB');

    if (compressedSize > 500) {
      console.log('[OCR] Image still large, applying additional compression...');
      processedBuffer = await sharp(processedBuffer)
        .resize(800, 800, { fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 75, chromaSubsampling: '4:2:0', force: true, mozjpeg: true })
        .toBuffer();
      console.log('[OCR] Final image size:', Math.ceil(processedBuffer.length / 1024), 'KB');
    }

    const outputMimeType = mimeType.includes('png') ? 'image/png' : 'image/jpeg';
    return `data:${outputMimeType};base64,${processedBuffer.toString('base64')}`;
  } catch (error) {
    console.error('[OCR] Image processing error:', error);
    throw error;
  }
}

function cleanOCRResponse(text: string): string {
  const startIndex = text.indexOf('{');
  const endIndex = text.lastIndexOf('}');

  if (startIndex === -1 || endIndex === -1) {
    console.error('No valid JSON structure found in:', text);
    throw new Error('Invalid response format');
  }

  let jsonText = text.slice(startIndex, endIndex + 1);

  jsonText = jsonText
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, '')
    .replace(/\\n/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/",\s*}/g, '"}')
    .replace(/,\s*]/g, ']')
    .trim();

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
      const { key, endpoint, model } = getApiKey();
      console.log(`[OCR] Attempt ${attempt + 1}: Using ${model} via ${endpoint.includes('openrouter') ? 'OpenRouter' : 'Deepbrick'}...`);

      // Compress image before processing
      console.log('[OCR] Compressing image...');
      const compressedImage = await compressImage(imageBase64);

      // Extract clean base64 data
      const base64Data = compressedImage.includes('base64,')
        ? compressedImage.split('base64,')[1]
        : compressedImage;

      const sizeInBytes = Math.ceil((base64Data.length * 3) / 4);
      console.log(`[OCR] Final image size: ${(sizeInBytes / 1024 / 1024).toFixed(2)}MB`);

      const mimeType = compressedImage.includes('png') ? 'image/png' : 'image/jpeg';

      const requestBody = {
        model,
        messages: [
          {
            role: 'system',
            content: 'You are a business card OCR system. For names, titles, companies, and addresses, strictly separate English and Chinese text. Never mix them.',
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: OCR_PROMPT,
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:${mimeType};base64,${base64Data}`,
                },
              },
            ],
          },
        ],
        temperature: 0.1,
        max_tokens: 2000,
        top_p: 0.9,
      };

      const axiosInstance = createAxiosInstance(endpoint, key);

      const response = await axiosInstance.post('/chat/completions', requestBody, {
        timeout: TIMEOUT * (attempt + 1),
        validateStatus: (status) => status < 500,
      });

      console.log(`[OCR] Response status: ${response.status}`);
      lastResponse = response;

      // Rate limiting
      if (response.status === 429) {
        const retryAfter = parseInt(response.headers['retry-after'] || '5');
        console.log(`[OCR] Rate limited. Waiting ${retryAfter} seconds...`);
        await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
        throw new Error('Rate limited');
      }

      // Other errors
      if (response.status !== 200) {
        console.error('[OCR] API Error Response:', response.data);
        throw new Error(`API returned status ${response.status}: ${JSON.stringify(response.data)}`);
      }

      if (!response.data?.choices?.[0]?.message?.content) {
        throw new Error('Invalid API response structure');
      }

      const extractedText = response.data.choices[0].message.content.trim();
      console.log(`[OCR] Raw response length:`, extractedText.length);
      console.log(`[OCR] Usage:`, response.data.usage);

      // Clean and parse the response
      const cleanedJson = cleanOCRResponse(extractedText);
      const parsedJson = JSON.parse(cleanedJson);

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
          MOBILE: { words: typeof parsedJson.phone === 'object' 
            ? Object.entries(parsedJson.phone)
                .map(([k, v]) => `${k.toUpperCase()}: ${v}`)
                .join(', ')
            : (parsedJson.phone || '') },
          ADDR: { words: parsedJson.address?.english || '' },
          ADDR_ZH: { words: parsedJson.address?.chinese || '' },
        },
        raw_text: cleanedJson,
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
      });

      if (attempt === MAX_RETRIES - 1) {
        const errorDetails = {
          message: lastError.message,
          lastResponseStatus: lastResponse?.status,
          lastResponseData: lastResponse?.data,
          attempts: attempt + 1,
        };
        console.error('[OCR] All attempts failed:', errorDetails);
        throw new Error(`OCR failed after ${MAX_RETRIES} attempts: ${lastError.message}`);
      }

      const delay = Math.min(INITIAL_DELAY * Math.pow(2, attempt), MAX_DELAY);
      console.log(`[OCR] Waiting ${delay}ms before retry...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError || new Error('OCR process failed');
}
