import { NextApiRequest, NextApiResponse } from 'next';
import { supabase, supabaseAdmin } from '@/lib/supabase-client';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get user session from auth header
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      console.error('[ADD CARD] No authorization header');
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Verify the token and get user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.error('[ADD CARD] Auth error:', authError);
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get card data from request body and remove any existing ID
    const { id, created_at, updated_at, ...cardData } = req.body;

    // Log the data we're working with
    console.log('[ADD CARD] Request data:', {
      authenticated_user_id: user.id,
      card_user_id: cardData.user_id,
      card_data: {
        ...cardData,
        rawText: cardData.rawText?.substring(0, 100) + '...' // Truncate for logging
      }
    });

    // Ensure user_id matches authenticated user
    if (cardData.user_id !== user.id) {
      console.error('[ADD CARD] User ID mismatch:', {
        authenticated_user_id: user.id,
        card_user_id: cardData.user_id
      });
      return res.status(403).json({ 
        error: 'Forbidden',
        message: 'User ID mismatch'
      });
    }

    console.log('[ADD CARD] Adding card for user:', user.id);

    if (!supabaseAdmin) {
      console.error('[ADD CARD] Service role client not available');
      return res.status(500).json({ error: 'Service configuration error' });
    }

    // Insert card using service role client, ensuring we don't include any existing ID
    const { data: savedCard, error: insertError } = await supabaseAdmin
      .from('business_cards')
      .insert([{
        ...cardData,
        user_id: user.id // Ensure we're using the authenticated user's ID
      }])
      .select()
      .single();

    if (insertError) {
      console.error('[ADD CARD] Insert error:', insertError);
      throw insertError;
    }

    console.log('[ADD CARD] Successfully added card:', savedCard.id);
    return res.status(200).json(savedCard);
  } catch (error: any) {
    console.error('[ADD CARD] Error:', error);
    return res.status(500).json({
      error: 'Failed to add business card',
      message: error.message,
      details: error.details
    });
  }
} 