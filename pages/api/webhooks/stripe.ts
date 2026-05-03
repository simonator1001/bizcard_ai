import { NextApiRequest, NextApiResponse } from 'next';
import { buffer } from 'micro';
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

async function saveSubscription(userId: string, tier: string, stripeSubId: string, stripeCusId: string) {
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
  return res.ok;
}

async function extendSubscription(userId: string, days: number = 30) {
  // Extend subscription end date in prefs
  const getRes = await fetch(`${APPWRITE_ENDPOINT}/users/${userId}/prefs`, {
    headers: appwriteHeaders(),
  });
  if (!getRes.ok) return false;
  const prefs = await getRes.json();
  const sub = prefs.subscription || {};
  
  const newEnd = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
  const res = await fetch(`${APPWRITE_ENDPOINT}/users/${userId}/prefs`, {
    method: 'PATCH',
    headers: appwriteHeaders(),
    body: JSON.stringify({
      prefs: {
        subscription: { ...sub, status: 'active', updatedAt: new Date().toISOString() },
      },
    }),
  });
  return res.ok;
}

export const config = { api: { bodyParser: false } };

const stripeSecretKey = process.env.STRIPE_SECRET_KEY?.replace(/[\r\n\s\t]+/g, '') || '';
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

if (!stripeSecretKey || !webhookSecret) {
  console.error('[Stripe Webhook] Missing STRIPE_SECRET_KEY or STRIPE_WEBHOOK_SECRET');
}

const stripe = stripeSecretKey
  ? new Stripe(stripeSecretKey, { apiVersion: '2025-04-30.basil' as const })
  : null;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).end('Method Not Allowed');
  }

  if (!stripe) {
    return res.status(500).json({ error: 'Stripe not configured' });
  }

  try {
    const rawBody = await buffer(req);
    const signature = req.headers['stripe-signature'] as string;

    const event = stripe.webhooks.constructEvent(rawBody.toString(), signature, webhookSecret);
    console.log('[Stripe Webhook] Event:', event.type);

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.payment_status !== 'paid') {
          return res.status(200).json({ received: true, status: 'payment_pending' });
        }

        const userId = session.client_reference_id;
        const tier = session.metadata?.tier || 'pro';
        const stripeSubId = (session.subscription as string) || session.id;
        const stripeCusId = (session.customer as string) || '';

        if (!userId) {
          console.error('[Stripe Webhook] No client_reference_id');
          return res.status(400).json({ error: 'Missing client_reference_id' });
        }

        await saveSubscription(userId, tier, stripeSubId, stripeCusId);
        console.log('[Stripe Webhook] Subscription saved for user:', userId);
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        const stripeSubId = (invoice as any).subscription;
        
        if (stripeSubId && invoice.customer_email) {
          // Find user by email in AppWrite, then extend subscription
          const searchRes = await fetch(
            `${APPWRITE_ENDPOINT}/users?search=${encodeURIComponent(invoice.customer_email)}&limit=1`,
            { headers: appwriteHeaders() }
          );
          const searchData = await searchRes.json();
          if (searchData.users?.[0]?.$id) {
            await extendSubscription(searchData.users[0].$id);
            console.log('[Stripe Webhook] Extended subscription for:', invoice.customer_email);
          }
        }
        break;
      }

      default:
        console.log('[Stripe Webhook] Unhandled event:', event.type);
    }

    return res.status(200).json({ received: true });
  } catch (err: any) {
    console.error('[Stripe Webhook] Error:', err.message);
    return res.status(400).json({ error: `Webhook Error: ${err.message}` });
  }
}
