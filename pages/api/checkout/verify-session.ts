import { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';
import { supabase, supabaseAdmin } from '@/lib/supabase-client';
import { SubscriptionService } from '@/lib/subscription';

// For debugging purposes - using a test mode
const TEST_MODE = false;

// Initialize Stripe with your test secret key
const stripeSecretKey = process.env.STRIPE_SECRET_KEY ? 
  process.env.STRIPE_SECRET_KEY.replace(/[\r\n\s\t]+/g, '') : 
  '';

// For debugging
console.log('[Verify Session] Using', TEST_MODE ? 'TEST_MODE' : 'LIVE_MODE');

// Only initialize Stripe if not in test mode
const stripe = !stripeSecretKey ? 
  null : 
  new Stripe(stripeSecretKey, {
    apiVersion: '2025-04-30.basil' as const,
  });

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  console.log('[Verify Session] Request received:', {
    query: req.query,
    headers: {
      contentType: req.headers['content-type'],
      origin: req.headers.origin,
      authorization: req.headers.authorization ? 'Present' : 'Missing'
    }
  });

  // Check authorization header
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    console.log('[Verify Session] No authorization header');
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // Extract token from authorization header
    const token = authHeader.replace('Bearer ', '');

    // Verify token and get user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      console.error('[Verify Session] Auth error:', authError);
      return res.status(401).json({ 
        error: 'Unauthorized', 
        details: authError?.message || 'Invalid authentication token'
      });
    }

    // Get session ID from query
    const sessionId = req.query.session_id as string;
    if (!sessionId) {
      return res.status(400).json({ 
        error: 'Bad request', 
        details: 'Missing session_id parameter' 
      });
    }

    // Test mode handling - always return success
    if (TEST_MODE && sessionId.startsWith('test_session_')) {
      console.log('[Verify Session] TEST MODE: Simulating successful session verification');
      
      // Test mode: Return success
      return res.status(200).json({ 
        success: true,
        message: 'TEST MODE: Session verified',
        tier: 'pro',
        test_mode: true
      });
    }

    // Live mode - Retrieve session from Stripe
    console.log('[Verify Session] Retrieving session from Stripe:', sessionId);
    
    // Check if stripe is initialized
    if (!stripe) {
      console.error('[Verify Session] Stripe client not initialized but trying to use live mode');
      return res.status(500).json({ 
        error: 'Configuration error', 
        details: 'Stripe client not initialized'
      });
    }
    
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    console.log('[Verify Session] Session retrieved:', {
      id: session.id,
      clientReferenceId: session.client_reference_id,
      customerId: session.customer,
      paymentStatus: session.payment_status,
      status: session.status,
    });

    // Verify session belongs to this user
    if (session.client_reference_id !== user.id) {
      console.error('[Verify Session] Session belongs to different user:', {
        sessionUserId: session.client_reference_id,
        requestUserId: user.id
      });
      return res.status(403).json({ 
        error: 'Forbidden', 
        details: 'Session does not belong to authenticated user' 
      });
    }

    // Check if payment was successful
    if (session.payment_status !== 'paid') {
      console.log('[Verify Session] Payment not completed:', session.payment_status);
      return res.status(400).json({ 
        error: 'Payment incomplete', 
        details: `Payment status: ${session.payment_status}` 
      });
    }

    // If session is valid and payment is successful, ensure user subscription is updated
    // Determine the tier based on metadata or default to 'pro'
    const tier = session.metadata?.tier || 'pro';
    const subscriptionId = session.subscription as string || session.id;

    // Update user's subscription if not already done by webhook
    const result = await SubscriptionService.upgradeSubscription(
      user.id,
      tier as 'free' | 'basic' | 'pro',
      {
        provider: 'stripe',
        subscriptionId,
      }
    );

    console.log('[Verify Session] Subscription update result:', result);

    return res.status(200).json({ 
      success: true,
      message: 'Session verified and subscription updated',
      tier: tier
    });
  } catch (error: any) {
    console.error('[Verify Session] Error verifying session:', error);
    return res.status(500).json({ 
      error: 'Internal server error', 
      details: error.message || 'An unexpected error occurred',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
} 