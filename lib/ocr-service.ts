import axios, { AxiosError } from 'axios';
import { TOGETHER_API_KEY, VISION_MODEL } from './ocr-config';
import { BusinessCard } from '@/types/business-card';

// Add more detailed validation
function isValidBusinessCardData(data: any): boolean {
  try {
    // Check if data exists and is an object
    if (!data || typeof data !== 'object') {
      return false;
    }

    // Must have at least one of these fields with valid data
    const requiredFields = ['name', 'email', 'phone', 'title', 'company'];
    const hasRequiredField = requiredFields.some(field => 
      data[field] && typeof data[field] === 'string' && data[field].trim().length > 0
    );

    // Additional validation for specific fields
    const isValidEmail = !data.email || (typeof data.email === 'string' && data.email.includes('@'));
    const isValidPhone = !data.phone || (typeof data.phone === 'string' && data.phone.length >= 8);
    const isValidName = !data.name || (typeof data.name === 'string' && data.name.length >= 2);

    return hasRequiredField && isValidEmail && isValidPhone && isValidName;
  } catch (error) {
    console.error('[Validation] Error validating business card data:', error);
    return false;
  }
}

// Add a custom error class for OCR failures
export class OCRError extends Error {
  constructor(message: string, public readonly details?: any) {
    super(message);
    this.name = 'OCRError';
  }
}

export async function recognizeBusinessCard(imageData: string, maxRetries = 3): Promise<any> {
  let lastError = null;
  let attempt = 1;

  while (attempt <= maxRetries) {
    try {
      console.log(`[OCR] Attempt ${attempt}/${maxRetries}`);
      
      const processedImage = await preprocessImageForOCR(imageData);
      
      const response = await axios.post('/api/extract-info', {
        image: processedImage,
        originalImage: imageData
      }, {
        timeout: 30000,
        headers: {
          'Content-Type': 'application/json',
        }
      });

      // Log raw response for debugging
      console.log('[OCR] Raw API response:', response.data);

      // Handle case where no text is found
      if (response.data === 'No text found on the business card.') {
        throw new OCRError('No text detected', {
          attempt,
          message: 'No readable text found on the image'
        });
      }

      // Handle empty or invalid response
      if (!response.data) {
        throw new OCRError('Empty response', { attempt });
      }

      let parsedData;
      try {
        // Handle both string and object responses
        parsedData = typeof response.data === 'string' 
          ? JSON.parse(response.data) 
          : response.data;

        // Validate basic structure
        if (!parsedData || (typeof parsedData === 'object' && Object.keys(parsedData).length === 0)) {
          throw new Error('Empty parsed data');
        }

        console.log('[OCR] Parsed data:', parsedData);

      } catch (parseError) {
        throw new OCRError('Failed to parse response', {
          attempt,
          error: parseError,
          rawData: response.data
        });
      }

      // Create business card with fallbacks
      const businessCard: BusinessCard = {
        id: crypto.randomUUID(),
        name: parsedData.name || parsedData.words_result?.NAME?.words || '',
        title: parsedData.title || parsedData.words_result?.TITLE?.words || '',
        title_zh: parsedData.title_zh || parsedData.words_result?.TITLE_ZH?.words || '',
        company: parsedData.company || parsedData.words_result?.COMPANY?.words || '',
        email: parsedData.email || parsedData.words_result?.EMAIL?.words || '',
        phone: parsedData.phone || parsedData.words_result?.MOBILE?.words || '',
        position: parsedData.title || parsedData.words_result?.TITLE?.words || '',
        imageUrl: imageData
      };

      // Validate extracted data
      if (!isValidBusinessCardData(businessCard)) {
        throw new OCRError('Insufficient data extracted', {
          attempt,
          extractedData: businessCard
        });
      }

      return businessCard;

    } catch (error) {
      lastError = error;
      console.warn(`[OCR] Attempt ${attempt} failed:`, error);

      // Special handling for "no text found" case
      if (error instanceof OCRError && error.details?.message === 'No readable text found on the image') {
        throw new OCRError(
          'No readable text found on the image. Please ensure the image is clear and contains text.',
          error.details
        );
      }

      if (attempt === maxRetries) {
        const errorDetails = {
          lastError: lastError?.message || 'Unknown error',
          details: lastError?.details || lastError,
          attempts: attempt
        };
        
        console.error('[OCR] All attempts failed:', errorDetails);
        
        throw new OCRError(
          'Unable to process the business card. Please try with a clearer image.',
          errorDetails
        );
      }

      // Wait before retry
      const delay = Math.min(2000 * Math.pow(2, attempt - 1), 10000);
      console.log(`[OCR] Waiting ${delay}ms before retry ${attempt + 1}`);
      await new Promise(resolve => setTimeout(resolve, delay));
      
      attempt++;
    }
  }
}

// Helper function to preprocess image
export const preprocessImageForOCR = async (base64Image: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }

      // Use higher resolution for better OCR
      const MAX_SIZE = 2048;
      let width = img.width;
      let height = img.height;
      
      // Maintain aspect ratio while resizing
      if (width > height && width > MAX_SIZE) {
        height = (height * MAX_SIZE) / width;
        width = MAX_SIZE;
      } else if (height > MAX_SIZE) {
        width = (width * MAX_SIZE) / height;
        height = MAX_SIZE;
      }

      canvas.width = width;
      canvas.height = height;

      // White background for better contrast
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, width, height);
      
      // Draw image
      ctx.drawImage(img, 0, 0, width, height);
      
      // Enhance contrast
      const imageData = ctx.getImageData(0, 0, width, height);
      const data = imageData.data;
      
      for (let i = 0; i < data.length; i += 4) {
        const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
        const threshold = 128;
        
        // Binary threshold for better text recognition
        const value = avg < threshold ? 0 : 255;
        
        data[i] = value;     // Red
        data[i + 1] = value; // Green
        data[i + 2] = value; // Blue
      }
      
      ctx.putImageData(imageData, 0, 0);
      
      // Return processed image
      resolve(canvas.toDataURL('image/jpeg', 1.0));
    };
    
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = base64Image;
  });
}; 

// Helper function to validate OCR result
function isValidOCRResult(result: any): boolean {
  // Add your validation logic here
  return result && typeof result === 'object' && Object.keys(result).length > 0;
} 