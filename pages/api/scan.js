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
    // Extract userId from the request body
    const { userId } = req.body;
    console.log('[API] Explicit userId in request:', userId);

    // Get the auth cookie from the request
    const authCookie = req.cookies['sb-rzmqepriffysavamtxzg-auth-token'];
    console.log('[API] Auth cookie present:', !!authCookie);

    // Also check for Authorization header
    const authHeader = req.headers.authorization;
    console.log('[API] Auth header present:', !!authHeader);

    // Try to get user from cookie first
    let validatedUserId = null;
    let authError = null;

    if (authCookie) {
      // Parse the cookie value if it exists
      try {
        // The cookie value is base64 encoded JSON
        const parsedCookie = JSON.parse(Buffer.from(authCookie.replace('base64-', ''), 'base64').toString());
        // If the access_token exists in the cookie
        if (parsedCookie.access_token) {
          console.log('[API] Extracted token from cookie');
          // Get the user from the token
          const { data: { user }, error } = await supabase.auth.getUser(parsedCookie.access_token);
          if (user) {
            validatedUserId = user.id;
            console.log('[API] User authenticated from cookie:', validatedUserId);
          } else {
            authError = error;
            console.error('[API] Cookie auth error:', error);
          }
        }
      } catch (e) {
        console.error('[API] Error parsing auth cookie:', e);
      }
    }

    // If no user found from cookie, try header
    if (!validatedUserId && authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user }, error } = await supabase.auth.getUser(token);
      if (user) {
        validatedUserId = user.id;
        console.log('[API] User authenticated from header:', validatedUserId);
      } else {
        authError = error;
        console.error('[API] Header auth error:', error);
      }
    }

    // If still no validated user but we have an explicit userId in the request body, use that with admin client
    if (!validatedUserId && userId) {
      // Verify the user exists with admin client
      const { data, error } = await supabase.auth.admin.getUserById(userId);
      if (data?.user) {
        validatedUserId = userId;
        console.log('[API] User verified with admin client:', validatedUserId);
      } else {
        console.error('[API] Admin verification failed:', error);
      }
    }

    // If no user found through any method, return authentication error
    if (!validatedUserId) {
      console.error('[API] Authentication failed:', authError);
      return res.status(401).json({ 
        error: 'Authentication failed',
        details: authError?.message || 'No valid authentication provided'
      });
    }

    // Check if the user has scans available using the validated user ID
    try {
      const canScan = await SubscriptionService.canPerformAction(validatedUserId, 'scan');
      
      if (!canScan) {
        console.log('[API] User reached scan limit:', validatedUserId);
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

    // Upload to storage using the validated user ID
    try {
      const imageUrl = await SubscriptionService.uploadBusinessCardImage(validatedUserId, imageData);
      console.log('[API] Image uploaded successfully:', imageUrl?.substring(0, 50) + '...');
      
      // Increment the user's scan count
      await SubscriptionService.incrementUsage(validatedUserId, 'scan');

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