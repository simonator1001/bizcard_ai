import { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';

const APPWRITE_ENDPOINT = 'https://sgp.cloud.appwrite.io/v1';
const PROJECT_ID = '69efa226000db23fcd89';

function appwriteHeaders() {
  return {
    'X-Appwrite-Project': PROJECT_ID,
    'X-Appwrite-Key': process.env.APPWRITE_API_KEY || '',
    'Content-Type': 'application/json',
  };
}

// Verify AppWrite session by calling GET /account with the session token
async function verifyAppWriteSession(userId: string, sessionSecret: string): Promise<boolean> {
  const res = await fetch(`${APPWRITE_ENDPOINT}/account`, {
    headers: {
      'X-Appwrite-Project': PROJECT_ID,
      'X-Appwrite-Session': sessionSecret,
    },
  });
  if (!res.ok) return false;
  const account = await res.json();
  return account.$id === userId;
}

// Stripe price IDs from env vars
const PRICE_IDS = {
  pro: {
    monthly: process.env.STRIPE_PRICE_PRO_MONTHLY,
    yearly: process.env.STRIPE_PRICE_PRO_YEARLY,
  },
  basic: {
    monthly: process.env.STRIPE_PRICE_BASIC_MONTHLY,
    yearly: process.env.STRIPE_PRICE_BASIC_YEARLY,
  },
};

// Initialize Stripe
const stripeSecretKey = process.env.STRIPE_SECRET_KEY
  ? process.env.STRIPE_SECRET_KEY.replace(/[\r\n\s\t]+/g, '')
  : '';

const stripe = stripeSecretKey
  ? new Stripe(stripeSecretKey, { apiVersion: '2025-04-30.basil' as const })
  : null;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { tier = 'pro', frequency = 'monthly', userId, appwriteSession } = req.body;

    if (!userId || !appwriteSession) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Verify AppWrite session
    const isValid = await verifyAppWriteSession(userId, appwriteSession);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid session' });
    }

    if (!['pro', 'basic'].includes(tier) || !['monthly', 'yearly'].includes(frequency)) {
      return res.status(400).json({ error: 'Invalid tier or frequency' });
    }

    // Get price ID
    const priceId = PRICE_IDS[tier as 'pro' | 'basic']?.[frequency as 'monthly' | 'yearly'];
    if (!priceId) {
      return res.status(400).json({ error: 'Invalid price configuration' });
    }

    if (!stripe) {
      return res.status(500).json({ error: 'Stripe not configured' });
    }

    // Get user email for Stripe
    const userRes = await fetch(`${APPWRITE_ENDPOINT}/users/${userId}`, {
      headers: appwriteHeaders(),
    });
    const userData = await userRes.json();
    const userEmail = userData.email || '';

    const origin = req.headers.origin || 'http://localhost:3000';
    const successUrl = `${origin}/payment/success?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${origin}/pricing`;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'subscription',
      success_url: successUrl,
      cancel_url: cancelUrl,
      client_reference_id: userId,
      customer_email: userEmail,
      metadata: { tier, frequency, userId },
    });

    console.log('[Checkout] Session created:', session.id);

    return res.status(200).json({
      sessionId: session.id,
      url: session.url,
    });
  } catch (error: any) {
    console.error('[Checkout] Error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error.message,
    });
  }
}
