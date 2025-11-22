import { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';
import { supabase } from '@/lib/supabase-client';

// For debugging purposes - using a test mode
const TEST_MODE = false;

// Initialize Stripe with your test secret key
// Properly format the key to avoid any issues
const stripeSecretKey = process.env.STRIPE_SECRET_KEY ? 
  process.env.STRIPE_SECRET_KEY.replace(/[\r\n\s\t]+/g, '') : 
  '';

// For debugging
console.log('[Checkout] Using', TEST_MODE ? 'TEST_MODE' : 'LIVE_MODE');
if (!TEST_MODE) {
  console.log('[Checkout] Using Stripe key length:', stripeSecretKey.length);
}

// Only initialize Stripe if not in test mode
const stripe = !stripeSecretKey ? 
  null : 
  new Stripe(stripeSecretKey, {
    apiVersion: '2025-04-30.basil' as const,
  });

// Define the product/price IDs for different tiers and frequencies
const PRICE_IDS = {
  pro: {
    monthly: process.env.STRIPE_PRICE_PRO_MONTHLY,
    yearly: process.env.STRIPE_PRICE_PRO_YEARLY,
  },
  basic: {
    monthly: process.env.STRIPE_PRICE_BASIC_MONTHLY,
    yearly: process.env.STRIPE_PRICE_BASIC_YEARLY,
  }
};

// Helper function to determine if a price is for a one-time payment
const isOneTimePrice = (tier: string, frequency: string) => {
  // No longer using one-time payment for pro monthly
  return false;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  console.log('[Checkout] Request received:', req.body);
  console.log('[Checkout] Origin:', req.headers.origin);

  // Check authorization header
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    console.log('[Checkout] No authorization header');
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // Extract token from authorization header
    const token = authHeader.replace('Bearer ', '');

    // Verify token and get user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      console.error('[Checkout] Auth error:', authError);
      return res.status(401).json({ 
        error: 'Unauthorized', 
        details: authError?.message || 'Invalid authentication token'
      });
    }

    console.log('[Checkout] User authenticated:', {
      id: user.id,
      email: user.email
    });

    // Extract data from request body
    const { tier = 'pro', frequency = 'monthly' } = req.body;

    // Validate tier and frequency
    if (!['pro', 'basic'].includes(tier) || !['monthly', 'yearly'].includes(frequency)) {
      return res.status(400).json({ 
        error: 'Bad request', 
        details: 'Invalid tier or frequency' 
      });
    }

    // Get the price ID based on tier and frequency
    // @ts-ignore
    const priceId = PRICE_IDS[tier][frequency];
    if (!priceId) {
      return res.status(400).json({ 
        error: 'Bad request', 
        details: 'Invalid price configuration' 
      });
    }

    // Build the success URL with the correct origin
    const origin = req.headers.origin || 'http://localhost:3000';
    const successUrl = `${origin}/payment/success?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${origin}/pricing`;

    console.log('[Checkout] URLs:', { successUrl, cancelUrl });

    // TEST MODE: Create a simulated session
    if (TEST_MODE) {
      console.log('[Checkout] TEST MODE: Returning simulated checkout session');
      
      // Instead of directly returning the success URL, create a simulated checkout URL
      // This will be a URL to a test payment page that will then redirect to the success page
      const simulated_checkout_url = `${origin}/api/checkout/test-payment?session_id=test_session_${Date.now()}&return_url=${encodeURIComponent(successUrl)}`;
      
      return res.status(200).json({
        sessionId: `test_session_${Date.now()}`,
        url: simulated_checkout_url,
        test_mode: true
      });
    }

    // Determine if this is a one-time payment for testing
    const isOneTimeTest = isOneTimePrice(tier, frequency);

    // LIVE MODE: Create actual Stripe checkout session
    if (!stripe) {
      console.error('[Checkout] Stripe client not initialized but trying to use live mode');
      return res.status(500).json({ 
        error: 'Configuration error', 
        details: 'Stripe client not initialized'
      });
    }
    
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: successUrl,
      cancel_url: cancelUrl,
      client_reference_id: user.id,
      customer_email: user.email,
      metadata: {
        tier,
        frequency,
        userId: user.id,
        isOneTimePayment: isOneTimeTest.toString(),
      },
    });

    console.log('[Checkout] Session created:', {
      sessionId: session.id,
      url: session.url,
    });

    // Return the session URL
    return res.status(200).json({ 
      sessionId: session.id,
      url: session.url
    });
  } catch (error: any) {
    console.error('[Checkout] Error creating checkout session:', error);
    return res.status(500).json({ 
      error: 'Internal server error', 
      details: error.message || 'An unexpected error occurred',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
} 