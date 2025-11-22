import { NextApiRequest, NextApiResponse } from 'next';
import { supabase, supabaseAdmin } from '@/lib/supabase-client';
import { SubscriptionService } from '@/lib/subscription';

// For debugging purposes - using a test mode
const TEST_MODE = false;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  console.log('[API] Subscription upgrade request received:', {
    method: req.method,
    headers: {
      contentType: req.headers['content-type'],
      authorization: req.headers.authorization ? 'Present' : 'Missing'
    }
  });
  
  // Only allow POST requests
  if (req.method !== 'POST') {
    console.log('[API] Invalid method:', req.method);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Check authorization header
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    console.log('[API] No authorization header');
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // Extract token from authorization header
    const token = authHeader.replace('Bearer ', '');
    console.log('[API] Token extracted:', token.substring(0, 10) + '...');

    // Verify token and get user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      console.error('[API] Auth error:', authError);
      return res.status(401).json({ 
        error: 'Unauthorized', 
        details: authError?.message || 'Invalid authentication token'
      });
    }

    console.log('[API] User authenticated:', {
      id: user.id,
      email: user.email
    });

    // Extract data from request body
    const { tier, provider, subscriptionId, force_update } = req.body;
    console.log('[API] Request parameters:', { tier, provider, subscriptionId, force_update });

    if (!tier || !provider) {
      console.log('[API] Missing parameters:', { tier, provider });
      return res.status(400).json({ 
        error: 'Bad request', 
        details: 'Missing required parameters: tier, provider' 
      });
    }

    // Validate tier
    if (!['free', 'basic', 'pro'].includes(tier)) {
      console.log('[API] Invalid tier:', tier);
      return res.status(400).json({
        error: 'Bad request',
        details: 'Invalid tier. Must be one of: free, basic, pro'
      });
    }
    
    // Debug info about our clients
    console.log('[API] Client status:', {
      hasRegularClient: !!supabase,
      hasAdminClient: !!supabaseAdmin,
      clientToUse: supabaseAdmin ? 'admin' : 'regular'
    });

    // Test mode handling with force update flag
    if (TEST_MODE && subscriptionId && subscriptionId.startsWith('test_session_')) {
      console.log('[API] TEST MODE: Handling test mode subscription update for user', user.id);
      
      // If force_update is enabled, update directly in the database instead of simulating
      if (force_update) {
        console.log('[API] TEST MODE with force_update: Directly updating database');
        
        try {
          // Use either admin client or regular client, whichever is available
          const client = supabaseAdmin || supabase;
          
          if (!client) {
            throw new Error("No database client available");
          }
          
          console.log('[API] Using client for database operations:', supabaseAdmin ? 'admin' : 'regular');
          
          // Current date and expiration date (one year from now)
          const now = new Date();
          const expirationDate = new Date();
          expirationDate.setFullYear(expirationDate.getFullYear() + 1);
          
          // Add logging before upsert
          console.log('[API] Upsert payload:', {
            user_id: user.id,
            tier,
            provider,
            subscription_id: subscriptionId,
            status: 'active',
            current_period_start: new Date().toISOString(),
            current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            updated_at: new Date().toISOString(),
          });
          
          // Directly update/insert the subscription record
          const { data, error: dbError } = await client
            .from('subscriptions')
            .upsert({
              user_id: user.id,
              tier: tier,
              status: 'active',
              current_period_start: now.toISOString(),
              current_period_end: expirationDate.toISOString(),
              cancel_at_period_end: false,
              payment_provider: provider,
              subscription_id: subscriptionId,
              created_at: now.toISOString(),
              updated_at: now.toISOString()
            }, {
              onConflict: 'user_id'
            });
          
          // Add logging after upsert
          console.log('[API] Upsert response:', { data, error: dbError });
          
          if (dbError) {
            console.error('[API] TEST MODE: Error updating subscription in database:', dbError);
            throw new Error(`Database error: ${JSON.stringify(dbError)}`);
          }
          
          // Initialize usage stats directly
          console.log('[API] Initializing usage stats');
          const { error: usageDbError } = await client
            .from('user_usage_stats')
            .upsert({
              user_id: user.id,
              scans_this_month: 0,
              unique_companies: 0,
              cards_count: 0,
              updated_at: new Date().toISOString()
            }, {
              onConflict: 'user_id'
            });
            
          if (usageDbError) {
            console.error('[API] TEST MODE: Error initializing usage stats:', usageDbError);
            // Not critical, continue
          }
          
          console.log('[API] TEST MODE: Successfully updated subscription in database');
          return res.status(200).json({ 
            success: true,
            message: 'TEST MODE: Subscription updated directly in database',
            tier: tier,
            test_mode: true
          });
        } catch (error) {
          // Full error dump for debugging
          console.error('[API] TEST MODE: Error during force update:', error);
          console.error('[API] Error details:', {
            message: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined,
            object: error
          });
          
          return res.status(500).json({ 
            error: 'Internal server error', 
            details: error instanceof Error ? error.message : 'Unknown error during subscription update'
          });
        }
      }
      
      // Regular test mode simulation (without force_update)
      console.log('[API] TEST MODE: Simulating successful subscription upgrade for user', user.id);
      return res.status(200).json({ 
        success: true,
        message: 'TEST MODE: Subscription upgraded successfully',
        tier: tier,
        test_mode: true
      });
    }

    // Check if adminClient is available
    console.log('[API] Admin client available:', !!supabaseAdmin);

    // Call SubscriptionService to upgrade the subscription
    // Since we're on the server side, we have access to the admin client
    console.log('[API] Calling SubscriptionService.upgradeSubscription');
    const result = await SubscriptionService.upgradeSubscription(
      user.id,
      tier,
      {
        provider,
        subscriptionId: subscriptionId || 'direct_payment'
      }
    );

    console.log('[API] Upgrade result:', result);

    if (!result) {
      return res.status(500).json({ 
        error: 'Failed to upgrade subscription',
        details: 'The service was unable to update your subscription'
      });
    }

    // Return success response
    console.log('[API] Subscription upgraded successfully');
    return res.status(200).json({ 
      success: true,
      message: 'Subscription upgraded successfully',
      tier: tier
    });
  } catch (error: any) {
    console.error('[API] Error upgrading subscription:', error);
    return res.status(500).json({ 
      error: 'Internal server error', 
      details: error.message || 'An unexpected error occurred'
    });
  }
} 