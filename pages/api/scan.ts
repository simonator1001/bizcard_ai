import { NextApiRequest, NextApiResponse } from 'next'
import { supabase, supabaseAdmin } from '@/lib/supabase-client'
import { SubscriptionService } from '@/lib/subscription'

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Add temporary debug bypass flag
  const DEBUG_BYPASS_SCAN_LIMIT = false; // Set to false when done testing
  
  console.log('[SCAN-API-DEBUG] 1. Request received:', {
    method: req.method,
    headers: {
      contentType: req.headers['content-type'],
      authorization: req.headers.authorization ? 'Present' : 'Missing'
    }
  });

  if (req.method !== 'POST') {
    console.log('[SCAN-API-DEBUG] Invalid method:', req.method);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Debug environment variables at API route level
  console.log('[SCAN] API Environment check:', {
    context: typeof window === 'undefined' ? 'server' : 'client',
    NODE_ENV: process.env.NODE_ENV,
    env_keys: Object.keys(process.env).filter(key => key.includes('SUPABASE')),
    hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  });

  try {
    console.log('[SCAN-API-DEBUG] 2. Checking request body');
    const { image } = req.body

    if (!image) {
      console.log('[SCAN-API-DEBUG] No image in request body');
      return res.status(400).json({ error: 'No image provided' })
    }

    console.log('[SCAN-API-DEBUG] 3. Image received, size:', Math.ceil(image.length / 1024), 'KB')

    // Get user session from auth header
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      console.log('[SCAN-API-DEBUG] No authorization header');
      return res.status(401).json({ error: 'Unauthorized' });
    }

    console.log('[SCAN-API-DEBUG] 4. Authorization header present');
    const token = authHeader.replace('Bearer ', '');
    
    // First try to get session
    console.log('[SCAN-API-DEBUG] 5. Getting session');
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('[SCAN-API-DEBUG] Session error:', sessionError);
    }
    
    // Then verify the token and get user
    console.log('[SCAN-API-DEBUG] 6. Verifying token');
    let userData;
    
    try {
      const { data: { user: tokenUser }, error: authError } = await supabase.auth.getUser(token);
      
      if (authError || !tokenUser) {
        console.error('[SCAN-API-DEBUG] Auth error with provided token:', {
          error: authError,
          token: token ? token.substring(0, 10) + '...' : 'none'
        });
        
        // If we have a session but token verification failed, try using session
        if (session?.user) {
          console.log('[SCAN-API-DEBUG] Using session user as fallback');
          userData = session.user;
        } else {
          // Try with admin client as last resort
          if (supabaseAdmin) {
            const { data: adminData, error: adminError } = await supabaseAdmin.auth.getUser(token);
            
            if (adminError || !adminData.user) {
              return res.status(401).json({ 
                error: 'Unauthorized',
                details: authError?.message || 'Invalid authentication token'
              });
            }
            
            console.log('[SCAN-API-DEBUG] Using admin client authenticated user as fallback');
            userData = adminData.user;
          } else {
            return res.status(401).json({ 
              error: 'Unauthorized',
              details: authError?.message || 'Invalid authentication token and admin client not available'
            });
          }
        }
      } else {
        userData = tokenUser;
      }
    } catch (tokenError) {
      console.error('[SCAN-API-DEBUG] Exception during token verification:', tokenError);
      
      // Last resort fallback to session if available
      if (session?.user) {
        console.log('[SCAN-API-DEBUG] Token verification failed, using session user');
        userData = session.user;
      } else {
        return res.status(401).json({ 
          error: 'Unauthorized',
          details: 'Failed to verify authentication token'
        });
      }
    }

    console.log('[SCAN-API-DEBUG] 7. User authenticated:', {
      id: userData.id,
      email: userData.email,
      sessionId: session?.access_token ? session.access_token.substring(0, 10) + '...' : 'none'
    });

    // Enhanced subscription check with detailed debugging
    console.log('[SCAN-API-DEBUG] 7a. Checking scan limit for user:', userData.id);
    
    // Get detailed usage and subscription info
    const userUsage = await SubscriptionService.getCurrentUsage(userData.id);
    console.log('[SCAN-API-DEBUG] Current usage:', userUsage);
    
    const userSub = await SubscriptionService.getCurrentSubscription(userData.id);
    console.log('[SCAN-API-DEBUG] Current subscription:', userSub);
    
    // Check if user can scan
    const canScan = DEBUG_BYPASS_SCAN_LIMIT || await SubscriptionService.canPerformAction(userData.id, 'scan');
    console.log('[SCAN-API-DEBUG] Can user scan?', canScan);
    
    // Also check if user can track another company
    const canTrackCompany = DEBUG_BYPASS_SCAN_LIMIT || await SubscriptionService.canPerformAction(userData.id, 'track_company');
    console.log('[SCAN-API-DEBUG] Can user track companies?', canTrackCompany);
    
    if (!canScan) {
      console.error('[SCAN-API-DEBUG] User has reached scan limit. Details:', {
        userId: userData.id,
        usage: userUsage,
        subscription: userSub
      });
      return res.status(403).json({ 
        error: 'Failed to process business card',
        message: 'Scanning limit reached for current subscription tier',
        details: {
          usage: userUsage,
          subscription: userSub
        }
      });
    }
    
    if (!canTrackCompany) {
      console.error('[SCAN-API-DEBUG] User has reached company tracking limit. Details:', {
        userId: userData.id,
        usage: userUsage,
        subscription: userSub
      });
      return res.status(403).json({ 
        error: 'Failed to process business card',
        message: 'Company tracking limit reached for current subscription tier',
        details: {
          usage: userUsage,
          subscription: userSub
        }
      });
    }
    console.log('[SCAN-API-DEBUG] 7b. User can perform scan and track company, continuing...');

    console.log('[SCAN] Image received, size:', Math.ceil(image.length / 1024), 'KB')

    // Step 1: Perform OCR
    console.log('[SCAN-API-DEBUG] 8. Calling OCR endpoint')
    const ocrResponse = await fetch(`${req.headers.origin}/api/ocr`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': req.headers.authorization || ''  // Forward the auth token
      },
      body: JSON.stringify({ image }),
    })

    console.log('[SCAN-API-DEBUG] 9. OCR response status:', ocrResponse.status)

    let ocrErrorData;
    try {
      ocrErrorData = await ocrResponse.json();
      console.log('[SCAN-API-DEBUG] 10. OCR response parsed successfully');
    } catch (e) {
      const text = await ocrResponse.text();
      console.error('[SCAN-API-DEBUG] OCR returned non-JSON response:', text);
      console.error('[SCAN-API-DEBUG] Parse error:', e);
      throw new Error('OCR service returned invalid response');
    }

    if (!ocrResponse.ok) {
      console.error('[SCAN-API-DEBUG] OCR failed:', {
        status: ocrResponse.status,
        statusText: ocrResponse.statusText,
        error: ocrErrorData
      })
      throw new Error(ocrErrorData.message || `OCR failed: ${ocrResponse.statusText}`)
    }

    console.log('[SCAN] OCR successful, processing results...')
    const ocrResult = ocrErrorData; // Already parsed above
    console.log('[SCAN] OCR result:', ocrResult)

    // Step 2: Extract information
    console.log('[SCAN] Calling extract-info endpoint...')
    const extractResponse = await fetch(`${req.headers.origin}/api/extract-info`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': req.headers.authorization || ''  // Forward the auth token
      },
      body: JSON.stringify({ text: ocrResult.raw_text }),
    })

    let extractErrorData;
    try {
      extractErrorData = await extractResponse.json();
    } catch (e) {
      const text = await extractResponse.text();
      console.error('[SCAN] Extract-info returned non-JSON response:', text);
      throw new Error('Information extraction service returned invalid response');
    }

    if (!extractResponse.ok) {
      console.error('[SCAN] Information extraction failed:', {
        status: extractResponse.status,
        statusText: extractResponse.statusText,
        error: extractErrorData
      })
      throw new Error(extractErrorData.message || `Information extraction failed: ${extractResponse.statusText}`)
    }

    console.log('[SCAN] Information extraction successful')
    const extractedInfo = extractErrorData; // Already parsed above

    // Upload image to storage
    console.log('[SCAN] Uploading image to storage...')
    const imageUrl = await SubscriptionService.uploadBusinessCardImage(userData.id, image)
    console.log('[SCAN] Image uploaded successfully:', imageUrl)

    // Format the data to match the table schema
    const cardData = {
      user_id: userData.id,
      name: extractedInfo.name?.english || '',
      name_zh: extractedInfo.name?.chinese || '',
      company: extractedInfo.company?.english || '[No Company]',
      company_zh: extractedInfo.company?.chinese || '',
      title: extractedInfo.title?.english || '',
      title_zh: extractedInfo.title?.chinese || '',
      email: extractedInfo.email || '',
      phone: extractedInfo.phone || '',
      address: extractedInfo.address?.english || '',
      address_zh: extractedInfo.address?.chinese || '',
      image_url: imageUrl,
      raw_text: ocrResult.raw_text || ''
      // Removed for local development until migration is applied
      // increment_company_count: !!(extractedInfo.company?.english || extractedInfo.company?.chinese)
    }

    console.log('[SCAN] Prepared card data:', {
      ...cardData,
      raw_text: cardData.raw_text.substring(0, 100) + '...' // Truncate for logging
    })

    // Step 3: Save to database using service role client
    console.log('[SCAN] Saving to database with service role...')
    
    if (!supabaseAdmin) {
      console.error('[SCAN] Service role client not available');
      console.error('[SCAN] Environment check:', {
        hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY
      });
      
      // Try to insert with authenticated user instead
      console.log('[SCAN] Falling back to authenticated user insert...');
      const { data: savedCard, error: insertError } = await supabase
        .from('business_cards')
        .insert([cardData])
        .select()
        .single();

      if (insertError) {
        console.error('[SCAN] Database insert failed:', {
          error: insertError,
          errorCode: insertError.code,
          details: insertError.details,
          hint: insertError.hint,
          message: insertError.message
        });
        throw new Error(`Failed to save card: ${insertError.message}`);
      }

      console.log('[SCAN] Successfully saved card:', {
        id: savedCard.id,
        user_id: savedCard.user_id
      });

      // Increment the user's scan usage count (missing in original code)
      try {
        console.log('[SCAN] Incrementing scan usage count for user:', userData.id);
        await SubscriptionService.incrementUsage(userData.id, 'scan');
        console.log('[SCAN] Successfully incremented scan usage count');
      } catch (incError) {
        console.error('[SCAN] Error incrementing scan usage count:', incError);
        // Continue anyway as the scan was successful
      }

      return res.status(200).json(savedCard);
    }

    // If we have service role client, use it
    const { data: savedCard, error: insertError } = await supabaseAdmin
      .from('business_cards')
      .insert([cardData])
      .select()
      .single();

    if (insertError) {
      console.error('[SCAN] Database insert failed:', {
        error: insertError,
        errorCode: insertError.code,
        details: insertError.details,
        hint: insertError.hint,
        message: insertError.message
      })
      throw new Error(`Failed to save card: ${insertError.message}`)
    }

    console.log('[SCAN] Successfully saved card:', {
      id: savedCard.id,
      user_id: savedCard.user_id
    })

    // Increment the user's scan usage count (missing in original code)
    try {
      console.log('[SCAN] Incrementing scan usage count for user:', userData.id);
      await SubscriptionService.incrementUsage(userData.id, 'scan');
      console.log('[SCAN] Successfully incremented scan usage count');
    } catch (incError) {
      console.error('[SCAN] Error incrementing scan usage count:', incError);
      // Continue anyway as the scan was successful
    }

    // Step 4: Return the saved card data
    console.log('[SCAN] Scan completed successfully')
    
    // Include session information in the response headers to help maintain state
    const sessionId = userData.id || '';
    if (sessionId) {
      res.setHeader('X-User-Id', sessionId);
      
      // If we have a session, include the session token in the response
      if (session?.access_token) {
        // Send part of the token to help client-side code verify auth state without exposing the full token
        res.setHeader('X-Session-Token', session.access_token.substring(0, 10) + '...');
        
        // Set auth cookies to help maintain session
        const projectId = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('.supabase.co') 
          ? process.env.NEXT_PUBLIC_SUPABASE_URL.split('.')[0]
          : 'rzmqepriffysavamtxzg';
        
        // Set cookies to help maintain session across client/server
        if (projectId) {
          // JavaScript accessible token for client-side recovery
          res.setHeader('Set-Cookie', [
            // Mark the scan as completed, helps middleware detect post-scan navigation
            `scan-completed=true; Path=/; Max-Age=3600; SameSite=Lax; HttpOnly=false`,
            
            // Store user session ID for authentication persistence
            `x-user-session=${sessionId}; Path=/; Max-Age=86400; SameSite=Lax; HttpOnly=false`,
            
            // Store a portion of the access token for verification
            `sb-${projectId}-auth-token-raw=${session.access_token.substring(0, 20)}...; Path=/; Max-Age=86400; SameSite=Lax; HttpOnly=false`,
            
            // Mark authentication as successful
            `auth-success=true; Path=/; Max-Age=86400; SameSite=Lax; HttpOnly=false`,
            
            // When the session was last verified
            `session-last-verified=${new Date().toISOString()}; Path=/; Max-Age=86400; SameSite=Lax; HttpOnly=false`
          ]);
        }
      }
    }
    
    // Include cache control headers to prevent caching issues
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    // Set additional headers for CORS and session verification
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Expose-Headers', 'X-User-Id, X-Session-Token');
    
    res.status(200).json({
      ...savedCard,
      _auth: {
        userId: sessionId,
        verified: true,
        timestamp: new Date().toISOString()
      }
    })
  } catch (error: any) {
    console.error('[SCAN] Error in scan endpoint:', {
      message: error.message,
      stack: error.stack,
      cause: error.cause
    })
    res.status(500).json({ 
      error: 'Failed to process business card',
      message: error.message,
      details: error.response?.data || error.cause
    })
  }
} 