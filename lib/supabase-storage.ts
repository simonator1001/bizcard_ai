import { supabase } from './supabase-client';

const BUSINESS_CARDS_BUCKET = 'business-cards';

export async function getImageUrl(path: string): Promise<string | null> {
  try {
    // Debug the input path
    console.log('[Storage] Getting URL for path:', path);

    // If it's already a full URL from our domain, return it
    const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!baseUrl) {
      console.error('[Storage] Missing SUPABASE_URL environment variable');
      return null;
    }

    if (path.startsWith(baseUrl)) {
      console.log('[Storage] URL is already a full path:', path);
      return path;
    }

    // Handle both full URLs and relative paths
    const imagePath = path.includes('storage/v1/object') 
      ? path.split('storage/v1/object/public/business-cards/').pop()
      : path;

    if (!imagePath) {
      console.error('[Storage] Invalid image path:', path);
      return null;
    }

    console.log('[Storage] Using image path:', imagePath);

    // Construct the storage URL manually for self-hosted instance
    const storageUrl = `${baseUrl}/storage/v1/object/public/${BUSINESS_CARDS_BUCKET}/${imagePath}`;
    
    // Add cache-busting parameter to prevent stale images
    const url = new URL(storageUrl);
    url.searchParams.set('t', Date.now().toString());
    
    console.log('[Storage] Generated URL:', url.toString());
    return url.toString();
  } catch (error) {
    console.error('[Storage] Error in getImageUrl:', error);
    return null;
  }
}

export async function uploadImage(file: File, userId: string): Promise<string | null> {
  try {
    // Generate a unique file path
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/${Date.now()}.${fileExt}`;

    console.log('[Storage] Uploading file:', {
      fileName,
      size: file.size,
      type: file.type
    });

    // Upload the file
    const { data, error } = await supabase
      .storage
      .from(BUSINESS_CARDS_BUCKET)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('[Storage] Upload error:', error);
      return null;
    }

    console.log('[Storage] Upload successful:', data);

    // Get the public URL
    return await getImageUrl(data.path);
  } catch (error) {
    console.error('[Storage] Error in uploadImage:', error);
    return null;
  }
}

export async function deleteImage(path: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .storage
      .from(BUSINESS_CARDS_BUCKET)
      .remove([path]);

    if (error) {
      console.error('[Storage] Delete error:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('[Storage] Error in deleteImage:', error);
    return false;
  }
}

export async function validateImageUrl(url: string): Promise<boolean> {
  try {
    // Check if the URL is from our Supabase storage
    const storageUrl = supabase.storage.from(BUSINESS_CARDS_BUCKET).getPublicUrl('').data.publicUrl;
    if (!url.startsWith(storageUrl)) {
      console.warn('[Storage] Invalid storage URL:', url);
      return false;
    }

    // Extract the path from the URL
    const path = url.replace(storageUrl, '').split('?')[0];
    
    // Check if the file exists
    const { data, error } = await supabase
      .storage
      .from(BUSINESS_CARDS_BUCKET)
      .list(path.split('/').slice(0, -1).join('/'));

    if (error) {
      console.error('[Storage] Validation error:', error);
      return false;
    }

    const fileName = path.split('/').pop();
    return data.some(file => file.name === fileName);
  } catch (error) {
    console.error('[Storage] Error in validateImageUrl:', error);
    return false;
  }
} 