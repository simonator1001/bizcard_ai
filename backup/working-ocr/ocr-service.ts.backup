import axios, { AxiosError } from 'axios';
import { TOGETHER_API_KEY, VISION_MODEL } from './ocr-config';
import { BusinessCard } from '@/types/business-card';

// Add more detailed validation
function isValidBusinessCardData(data: any): boolean {
  // Must have at least one of these fields
  const hasRequiredField = data.name || data.email || data.phone || data.title || data.company;
  
  // Check for obviously invalid data
  const hasValidFormat = 
    (!data.email || data.email.includes('@')) &&
    (!data.phone || data.phone.length >= 8) &&
    (!data.name || data.name.length >= 2);

  return hasRequiredField && hasValidFormat;
}

export async function recognizeBusinessCard(imageData: string, retries = 3): Promise<BusinessCard> {
  let lastError: any;
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`🔍 OCR attempt ${attempt}/${retries}`);
      
      // First try preprocessing
      const processedImage = await preprocessImageForOCR(imageData);
      
      // Make the API request
      const response = await axios.post('/api/extract-info', {
        image: processedImage,
        originalImage: imageData // Send both versions
      }, {
        timeout: 30000, // 30 second timeout
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.data) {
        throw new Error('Empty response from OCR service');
      }

      // Log the raw OCR result for debugging
      console.log('Raw OCR result:', response.data);

      // Validate the extracted data
      if (!isValidBusinessCardData(response.data)) {
        throw new Error('Invalid or incomplete data extracted');
      }

      // Map the response to our BusinessCard type
      const businessCard: BusinessCard = {
        id: crypto.randomUUID(),
        name: response.data.name || '',
        title: response.data.title || '',
        title_zh: response.data.title_zh || '',
        company: response.data.company || '',
        email: response.data.email || '',
        phone: response.data.phone || '',
        position: response.data.title || response.data.title_zh || '',
        imageUrl: imageData
      };

      console.log('✅ Successfully extracted business card:', businessCard);
      return businessCard;

    } catch (error) {
      console.error(`❌ OCR attempt ${attempt} failed:`, error);
      lastError = error;
      
      // Add specific error handling
      if (error instanceof AxiosError) {
        if (error.response?.status === 429) {
          // Rate limit error - wait longer
          await new Promise(resolve => setTimeout(resolve, 5000));
        } else if (error.code === 'ECONNABORTED') {
          // Timeout error - might need longer timeout
          console.log('Request timed out, increasing timeout for next attempt');
        }
      }
      
      // If this isn't the last attempt, wait before retrying
      if (attempt < retries) {
        const delay = Math.min(2000 * Math.pow(2, attempt - 1), 10000);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  // If we get here, all attempts failed
  throw new Error(`OCR failed after ${retries} attempts. Last error: ${lastError?.message || 'No valid data extracted'}`);
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