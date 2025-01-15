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
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
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
    console.log('[SCAN] Starting business card scan...')
    const { image } = req.body

    if (!image) {
      console.error('[SCAN] No image provided in request body')
      return res.status(400).json({ error: 'No image provided' })
    }

    // Get user session from auth header
    const authHeader = req.headers.authorization
    if (!authHeader) {
      console.error('[SCAN] No authorization header')
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const token = authHeader.replace('Bearer ', '')
    
    // Verify the token and get user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      console.error('[SCAN] Auth error:', authError)
      return res.status(401).json({ error: 'Unauthorized' })
    }

    console.log('[SCAN] Authenticated user:', user.id)
    console.log('[SCAN] Image received, size:', Math.ceil(image.length / 1024), 'KB')

    // Step 1: Perform OCR
    console.log('[SCAN] Calling OCR endpoint...')
    const ocrResponse = await fetch(`${req.headers.origin}/api/ocr`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ image }),
    })

    let ocrErrorData;
    try {
      ocrErrorData = await ocrResponse.json();
    } catch (e) {
      const text = await ocrResponse.text();
      console.error('[SCAN] OCR returned non-JSON response:', text);
      throw new Error('OCR service returned invalid response');
    }

    if (!ocrResponse.ok) {
      console.error('[SCAN] OCR failed:', {
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
    const imageUrl = await SubscriptionService.uploadBusinessCardImage(user.id, image)
    console.log('[SCAN] Image uploaded successfully:', imageUrl)

    // Format the data to match the table schema
    const cardData = {
      user_id: user.id, // Ensure this matches the authenticated user's ID
      name: extractedInfo.name?.english || '',
      name_zh: extractedInfo.name?.chinese || '',
      company: extractedInfo.company?.english || '',
      company_zh: extractedInfo.company?.chinese || '',
      title: extractedInfo.title?.english || '',
      title_zh: extractedInfo.title?.chinese || '',
      email: extractedInfo.contact?.email || '',
      phone: extractedInfo.contact?.phone || extractedInfo.contact?.mobile || '',
      address: extractedInfo.address?.english || '',
      address_zh: extractedInfo.address?.chinese || '',
      image_url: imageUrl, // Add the image URL
      raw_text: ocrResult.raw_text || ''
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

    // Step 4: Return the saved card data
    console.log('[SCAN] Scan completed successfully')
    res.status(200).json(savedCard)
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