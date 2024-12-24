import axios, { AxiosError } from 'axios';
import { TOGETHER_API_KEY, VISION_MODEL } from './ocr-config';

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
  raw_text?: string;
}

// Constants for retry logic
const MAX_RETRIES = 3;
const INITIAL_DELAY = 2000;
const MAX_DELAY = 15000;
const TIMEOUT = 60000;

// Create a stable axios instance with proper configuration
const axiosInstance = axios.create({
  baseURL: '/api',
  timeout: TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
  // Increase maxContentLength and maxBodyLength
  maxContentLength: Infinity,
  maxBodyLength: Infinity
});

// Add request interceptor for logging
axiosInstance.interceptors.request.use(request => {
  console.log('Starting Request:', request.url);
  return request;
});

// Add response interceptor for retry logic
axiosInstance.interceptors.response.use(
  response => response,
  async (error: AxiosError) => {
    const config = error.config;
    if (!config) return Promise.reject(error);

    // Add retry count to config if it doesn't exist
    config.retryCount = config.retryCount ?? 0;

    // Check if we should retry the request
    const shouldRetry = (
      config.retryCount < MAX_RETRIES &&
      (error.code === 'ERR_NETWORK' || 
       error.code === 'ECONNABORTED' ||
       error.response?.status === 429 ||
       (error.response?.status ?? 0) >= 500)
    );

    if (shouldRetry) {
      config.retryCount += 1;

      // Calculate delay with exponential backoff and jitter
      const delay = Math.min(
        INITIAL_DELAY * Math.pow(2, config.retryCount - 1) + Math.random() * 1000,
        MAX_DELAY
      );

      console.log(`Retrying request (attempt ${config.retryCount}) after ${delay}ms`);
      await new Promise(resolve => setTimeout(resolve, delay));

      return axiosInstance(config);
    }

    return Promise.reject(error);
  }
);

// Add these helper functions at the top
function sanitizeResponse(text: string): string {
  // Remove any text before the first { and after the last }
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return '{}';
  
  // Clean up the JSON string
  return jsonMatch[0]
    .replace(/\\u[\dA-F]{4}/gi, '') // Remove malformed Unicode
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // Remove control characters
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
}

function decodeUnicode(str: string): string {
  try {
    return decodeURIComponent(escape(str));
  } catch (e) {
    return str.replace(/\\u[\dA-F]{4}/gi, match => {
      try {
        return String.fromCharCode(parseInt(match.replace(/\\u/g, ''), 16));
      } catch (e) {
        return '';
      }
    });
  }
}

// Add this helper function
function validateExtractedData(result: OCRResponse): boolean {
  const hasData = Object.values(result.words_result).some(field => 
    field.words && field.words.trim().length > 0
  );

  if (!hasData) {
    console.error('No valid data extracted from image');
    return false;
  }

  // Validate JSON structure
  try {
    const rawData = JSON.parse(result.raw_text || '{}');
    const hasValidStructure = 
      rawData.name && 
      rawData.company && 
      rawData.contact &&
      typeof rawData.contact === 'object';

    if (!hasValidStructure) {
      console.error('Invalid JSON structure in response');
      return false;
    }
  } catch (e) {
    console.error('Invalid JSON in raw_text');
    return false;
  }

  return true;
}

// Add this interface for better type checking
interface BilingualText {
  traditional?: string;
  simplified?: string;
  english?: string;
}

// Add this helper function at the top
function decodeUnicodeEscapes(str: string): string {
  return str.replace(/\\u[\dA-F]{4}/gi, match => {
    return String.fromCharCode(parseInt(match.replace(/\\u/g, ''), 16));
  });
}

// Add this helper function to clean the OCR response
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

// Update the recognizeBusinessCard function
export async function recognizeBusinessCard(imageBase64: string): Promise<OCRResponse> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      console.log(`[OCR] Attempt ${attempt + 1}: Starting OCR request...`);
      
      // Validate and clean the base64 string
      const base64Data = imageBase64.includes('base64,') 
        ? imageBase64.split('base64,')[1] 
        : imageBase64;

      const sizeInBytes = Math.ceil((base64Data.length * 3) / 4);
      console.log(`[OCR] Image size: ${(sizeInBytes / 1024 / 1024).toFixed(2)}MB`);

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
                text: `Extract text from this business card and return in this EXACT format:
                {
                  "name": {
                    "chinese": "中文姓名 (ONLY Chinese characters)",
                    "english": "English Name (ONLY English text)"
                  },
                  "title": {
                    "chinese": "職位名稱 (ONLY Chinese characters)",
                    "english": "Job Title (ONLY English text)"
                  },
                  "company": {
                    "chinese": "公司名稱 (ONLY Chinese characters)",
                    "english": "Company Name (ONLY English text)"
                  },
                  "contact": {
                    "phone": ["Phone Numbers"],
                    "email": "Email",
                    "address": {
                      "chinese": "中文地址 (ONLY Chinese characters)",
                      "english": "English Address (ONLY English text)"
                    }
                  }
                }
                IMPORTANT: 
                1. Return ONLY the JSON object above
                2. Keep English and Chinese text strictly separated
                3. Never mix languages in the same field
                4. If text is only in one language, leave the other field empty`
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
        max_tokens: 1500,
        temperature: 0,
        request_id: requestId,
        stream: false, // Explicitly disable streaming
      };

      console.log(`[OCR] Making API request to ${VISION_MODEL}`);
      console.time(`OCR Request ${requestId}`);
      
      let response;
      try {
        response = await axiosInstance.post('/ocr', requestBody, {
          timeout: TIMEOUT,
          onUploadProgress: (progressEvent) => {
            console.log(`[OCR] Upload progress: ${Math.round((progressEvent.loaded * 100) / progressEvent.total)}%`);
          },
          validateStatus: (status) => status < 500, // Don't reject if status < 500
        });
        
        console.timeEnd(`OCR Request ${requestId}`);
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

      } catch (error: any) {
        if (error.code === 'ECONNABORTED') {
          console.log('[OCR] Request timed out, will retry with increased timeout');
          axiosInstance.defaults.timeout = axiosInstance.defaults.timeout * 1.5;
        }
        throw error;
      }

      if (!response.data?.choices?.[0]?.message?.content) {
        throw new Error('Invalid API response structure');
      }

      const extractedText = response.data.choices[0].message.content.trim();
      console.log(`[OCR] Raw response:`, extractedText);

      // Validate JSON structure
      try {
        JSON.parse(extractedText);
      } catch (e) {
        console.error('[OCR] Invalid JSON response:', extractedText);
        throw new Error('Invalid JSON response from API');
      }

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
          EMAIL: { words: parsedJson.contact?.email || '' },
          MOBILE: { words: Array.isArray(parsedJson.contact?.phone) 
            ? parsedJson.contact.phone.join(', ') 
            : parsedJson.contact?.phone || '' 
          },
          ADDR: { words: parsedJson.contact?.address?.english || '' },
          ADDR_ZH: { words: parsedJson.contact?.address?.chinese || '' }
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
      lastError = error;
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

// Update the image preprocessing function
const optimizeImageForChinese = async (base64: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }

      // Higher resolution for better character recognition
      const MAX_SIZE = 3200;
      let width = img.width;
      let height = img.height;
      
      if (width > height && width > MAX_SIZE) {
        height = (height * MAX_SIZE) / width;
        width = MAX_SIZE;
      } else if (height > MAX_SIZE) {
        width = (width * MAX_SIZE) / height;
        height = MAX_SIZE;
      }

      canvas.width = width;
      canvas.height = height;

      // White background
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, width, height);
      
      // Disable smoothing for sharper text
      ctx.imageSmoothingEnabled = false;
      
      // Draw original image
      ctx.drawImage(img, 0, 0, width, height);
      
      // Enhance contrast and sharpness
      const imageData = ctx.getImageData(0, 0, width, height);
      const data = imageData.data;
      
      for (let i = 0; i < data.length; i += 4) {
        // Convert to grayscale with better contrast
        const avg = (data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114);
        
        // Enhance contrast
        const contrast = 1.2; // Increase contrast
        const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));
        const value = factor * (avg - 128) + 128;
        
        // Threshold for clearer text
        const threshold = 180;
        const final = value < threshold ? 0 : 255;
        
        data[i] = final;     // red
        data[i + 1] = final; // green
        data[i + 2] = final; // blue
      }
      
      ctx.putImageData(imageData, 0, 0);
      
      // Return highest quality image
      resolve(canvas.toDataURL('image/jpeg', 1.0));
    };
    
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = base64;
  });
};

// Update the handleFileUpload function in pages/index.tsx to use the optimized image
const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
  // ... existing code ...

  try {
    // Load and optimize image
    const base64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = () => reject(new Error(`Failed to read file ${file.name}`));
      reader.readAsDataURL(file);
    });

    // Optimize image specifically for Chinese text
    const optimizedBase64 = await optimizeImageForChinese(base64);
    
    // Process with OCR
    const result = await recognizeBusinessCard(optimizedBase64);
    console.log('OCR Result:', result);

    // ... rest of the code ...
  } catch (error) {
    // ... error handling ...
  }
}; 

// Export the preprocessing function
export const preprocessImageForOCR = async (base64: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }

      // Use higher resolution for better character recognition
      const MAX_SIZE = 4096;
      let width = img.width;
      let height = img.height;
      
      if (width > height && width > MAX_SIZE) {
        height = (height * MAX_SIZE) / width;
        width = MAX_SIZE;
      } else if (height > MAX_SIZE) {
        width = (width * MAX_SIZE) / height;
        height = MAX_SIZE;
      }

      canvas.width = width;
      canvas.height = height;

      // White background
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, width, height);
      
      // Disable image smoothing for sharper text
      ctx.imageSmoothingEnabled = false;
      
      // Draw image
      ctx.drawImage(img, 0, 0, width, height);
      
      // Apply image processing for better text recognition
      const imageData = ctx.getImageData(0, 0, width, height);
      const data = imageData.data;
      
      for (let i = 0; i < data.length; i += 4) {
        // Convert to grayscale with better contrast for Chinese characters
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        
        // Weighted grayscale conversion (better for Chinese characters)
        const gray = 0.299 * r + 0.587 * g + 0.114 * b;
        
        // Increase contrast
        const contrast = 1.5;
        const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));
        const value = factor * (gray - 128) + 128;
        
        // Thresholding for clearer text
        const threshold = 180;
        const final = value < threshold ? 0 : 255;
        
        data[i] = final;     // red
        data[i + 1] = final; // green
        data[i + 2] = final; // blue
      }
      
      ctx.putImageData(imageData, 0, 0);
      
      // Return highest quality image
      resolve(canvas.toDataURL('image/jpeg', 1.0));
    };
    
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = base64;
  });
}; 