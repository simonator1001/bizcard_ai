import { createClient } from '@supabase/supabase-js';
import { SubscriptionService } from '@/lib/subscription';

// Create a Supabase client with admin privileges
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  console.log('[API] Scan request received');
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Check for authentication
    const { data: { session }, error: authError } = await supabase.auth.getSession();

    if (authError || !session) {
      console.error('[API] Authentication error:', authError || 'No session found');
      return res.status(401).json({ 
        error: 'Authentication required',
        details: authError?.message || 'No active session found'
      });
    }

    const userId = session.user.id;
    console.log('[API] User authenticated:', userId);

    // Check if the user has scans available
    try {
      const canScan = await SubscriptionService.canPerformAction(userId, 'scan');
      
      if (!canScan) {
        console.log('[API] User reached scan limit:', userId);
        return res.status(403).json({ 
          error: 'Scan limit reached',
          details: 'You have reached your monthly scan limit. Please upgrade your plan to continue scanning.'
        });
      }
    } catch (subError) {
      console.error('[API] Subscription check error:', subError);
      // Continue anyway with default free plan limits
    }

    // Get image data from request
    const { imageData } = req.body;
    
    if (!imageData || !imageData.startsWith('data:image')) {
      return res.status(400).json({ 
        error: 'Invalid image data',
        details: 'The provided image data is invalid or missing'
      });
    }

    // Upload to storage
    try {
      const imageUrl = await SubscriptionService.uploadBusinessCardImage(userId, imageData);
      console.log('[API] Image uploaded successfully:', imageUrl?.substring(0, 50) + '...');
      
      // Increment the user's scan count
      await SubscriptionService.incrementUsage(userId, 'scan');

      return res.status(200).json({ 
        success: true, 
        imageUrl,
        message: 'Business card image uploaded successfully'
      });
    } catch (uploadError) {
      console.error('[API] Upload error:', uploadError);
      return res.status(500).json({ 
        error: 'Upload failed',
        details: uploadError.message || 'Failed to upload business card image'
      });
    }
  } catch (error) {
    console.error('[API] Unexpected error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error.message || 'An unexpected error occurred'
    });
  }
} 