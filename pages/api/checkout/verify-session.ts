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

async function saveSubscription(userId: string, tier: string, stripeSubId: string, stripeCusId: string) {
  // Store subscription info in AppWrite user preferences
  const res = await fetch(`${APPWRITE_ENDPOINT}/users/${userId}/prefs`, {
    method: 'PATCH',
    headers: appwriteHeaders(),
    body: JSON.stringify({
      prefs: {
        subscription: {
          tier,
          status: 'active',
          provider: 'stripe',
          stripeSubscriptionId: stripeSubId,
          stripeCustomerId: stripeCusId,
          updatedAt: new Date().toISOString(),
        },
      },
    }),
  });
  if (!res.ok) {
    console.error('[Verify] Failed to save subscription prefs:', await res.text());
  }
  return res.ok;
}

const stripeSecretKey = process.env.STRIPE_SECRET_KEY
  ? process.env.STRIPE_SECRET_KEY.replace(/[\r\n\s\t]+/g, '')
  : '';

const stripe = stripeSecretKey
  ? new Stripe(stripeSecretKey, { apiVersion: '2025-04-30.basil' as const })
  : null;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { session_id, userId, appwriteSession } = req.query;

  if (!userId || !appwriteSession || !session_id) {
    return res.status(400).json({ error: 'Missing required parameters' });
  }

  try {
    // Verify AppWrite session
    const isValid = await verifyAppWriteSession(userId as string, appwriteSession as string);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid session' });
    }

    if (!stripe) {
      return res.status(500).json({ error: 'Stripe not configured' });
    }

    // Retrieve Stripe session
    const session = await stripe.checkout.sessions.retrieve(session_id as string);

    console.log('[Verify] Session retrieved:', {
      id: session.id,
      clientReferenceId: session.client_reference_id,
      paymentStatus: session.payment_status,
    });

    // Verify session belongs to this user
    if (session.client_reference_id !== userId) {
      return res.status(403).json({ error: 'Session does not belong to authenticated user' });
    }

    // Check payment status
    if (session.payment_status !== 'paid') {
      return res.status(400).json({
        error: 'Payment incomplete',
        details: `Payment status: ${session.payment_status}`,
      });
    }

    // Save subscription to AppWrite
    const tier = (session.metadata?.tier as string) || 'pro';
    const stripeSubId = (session.subscription as string) || session.id;
    const stripeCusId = (session.customer as string) || '';

    await saveSubscription(userId as string, tier, stripeSubId, stripeCusId);

    return res.status(200).json({
      success: true,
      message: 'Subscription verified and saved',
      tier,
    });
  } catch (error: any) {
    console.error('[Verify] Error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error.message,
    });
  }
}
