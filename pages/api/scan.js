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
    // Get the auth cookie from the request
    const authCookie = req.cookies['sb-rzmqepriffysavamtxzg-auth-token'];
    console.log('[API] Auth cookie present:', !!authCookie);

    // Also check for Authorization header
    const authHeader = req.headers.authorization;
    console.log('[API] Auth header present:', !!authHeader);

    // Try to get user from cookie first
    let userId = null;
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
            userId = user.id;
            console.log('[API] User authenticated from cookie:', userId);
          } else {
            authError = error;
          }
        }
      } catch (e) {
        console.error('[API] Error parsing auth cookie:', e);
      }
    }

    // If no user found from cookie, try header
    if (!userId && authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user }, error } = await supabase.auth.getUser(token);
      if (user) {
        userId = user.id;
        console.log('[API] User authenticated from header:', userId);
      } else {
        authError = error;
      }
    }

    // If still no user, try the session API
    if (!userId) {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (session?.user) {
        userId = session.user.id;
        console.log('[API] User authenticated from session API:', userId);
      } else {
        authError = error || authError;
      }
    }

    // If no user found through any method, return authentication error
    if (!userId) {
      console.error('[API] Authentication failed:', authError);
      return res.status(401).json({ 
        error: 'Authentication failed',
        details: authError?.message || 'No valid authentication provided'
      });
    }

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