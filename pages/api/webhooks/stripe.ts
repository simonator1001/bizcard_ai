import { NextApiRequest, NextApiResponse } from 'next';
import { buffer } from 'micro';
import Stripe from 'stripe';
import { supabaseAdmin } from '@/lib/supabase-client';
import { SubscriptionService } from '@/lib/subscription';

// Disable bodyParser to get the raw request body for Stripe
export const config = {
  api: {
    bodyParser: false,
  },
};

// The webhook secret from your Stripe dashboard
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

if (!webhookSecret) {
  console.error('[Stripe Webhook] No webhook secret found in environment variables');
  throw new Error('Missing STRIPE_WEBHOOK_SECRET environment variable');
}

// Initialize Stripe with your test secret key
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey) {
  console.error('[Stripe Webhook] No Stripe secret key found in environment variables');
  throw new Error('Missing STRIPE_SECRET_KEY environment variable');
}

const stripe = new Stripe(stripeSecretKey.replace(/[\r\n\s\t]+/g, ''), {
  apiVersion: '2025-04-30.basil' as const,
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    console.log('[Stripe Webhook] Method not allowed:', req.method);
    return res.status(405).end('Method Not Allowed');
  }

  // Check if supabaseAdmin is available
  if (!supabaseAdmin) {
    console.error('[Stripe Webhook] supabaseAdmin is not available');
    return res.status(500).json({ error: 'Supabase Admin client is not available' });
  }

  try {
    // Get the raw request body
    const rawBody = await buffer(req);
    // Get the signature from headers
    const signature = req.headers['stripe-signature'] as string;

    console.log('[Stripe Webhook] Processing webhook event');
    console.log('[Stripe Webhook] Signature:', signature ? 'Present' : 'Missing');

    let event;

    try {
      // Verify webhook signature
      event = stripe.webhooks.constructEvent(
        rawBody.toString(),
        signature,
        webhookSecret as string
      );
    } catch (err: any) {
      console.error('[Stripe Webhook] Webhook signature verification failed:', err.message);
      return res.status(400).json({ error: `Webhook Error: ${err.message}` });
    }

    console.log('[Stripe Webhook] Event type:', event.type);

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        console.log('[Stripe Webhook] Checkout session completed:', {
          sessionId: session.id,
          customerId: session.customer,
          clientReferenceId: session.client_reference_id,
          paymentStatus: session.payment_status,
        });

        // Make sure we have a client_reference_id (should be the user ID)
        if (!session.client_reference_id) {
          console.error('[Stripe Webhook] No client_reference_id found in session');
          return res.status(400).json({ error: 'Missing client_reference_id in session' });
        }

        // Only process if payment is successful
        if (session.payment_status !== 'paid') {
          console.log('[Stripe Webhook] Payment not completed yet:', session.payment_status);
          return res.status(200).json({ received: true, status: 'payment_pending' });
        }

        const userId = session.client_reference_id;
        const subscriptionId = session.subscription as string || session.id;
        const provider = 'stripe';
        
        // Determine the tier based on the metadata or default to pro
        const tier = session.metadata?.tier || 'pro';

        console.log('[Stripe Webhook] Upgrading subscription for user:', {
          userId,
          tier,
          subscriptionId,
        });

        // Upgrade the user's subscription
        const result = await SubscriptionService.upgradeSubscription(
          userId,
          tier as 'free' | 'basic' | 'pro',
          {
            provider,
            subscriptionId,
          }
        );

        console.log('[Stripe Webhook] Upgrade result:', result);

        // Verify the subscription was created successfully
        if (result) {
          // Double-check the subscription status in the database
          const subscriptionStatus = await verifySubscriptionInDatabase(userId, tier as 'free' | 'basic' | 'pro');
          console.log('[Stripe Webhook] Subscription verification:', subscriptionStatus);
        }
        
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        console.log('[Stripe Webhook] Subscription event:', {
          subscriptionId: subscription.id,
          customerId: subscription.customer,
          status: subscription.status,
        });

        // Get the customer ID
        const customerId = typeof subscription.customer === 'string' 
          ? subscription.customer 
          : subscription.customer.id;

        // Find the user associated with this customer ID
        try {
          // Look up customer in metadata to find user ID
          const { data: customerData } = await supabaseAdmin
            .from('subscriptions')
            .select('user_id')
            .eq('subscription_id', subscription.id)
            .single();

          if (customerData && customerData.user_id) {
            const userId = customerData.user_id;

            // Get subscription metadata - This might require a separate API call
            // For now, we'll default to 'pro' tier for simplicity
            const tier = 'pro';

            // Update the subscription
            const result = await SubscriptionService.upgradeSubscription(
              userId,
              tier,
              {
                provider: 'stripe',
                subscriptionId: subscription.id,
              }
            );

            console.log('[Stripe Webhook] Subscription update result:', result);
          } else {
            console.log('[Stripe Webhook] No user found for subscription:', subscription.id);
          }
        } catch (err) {
          console.error('[Stripe Webhook] Error updating subscription from event:', err);
        }
        
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        // Get subscription ID safely with type assertion
        const subscriptionId = (invoice as any).subscription;
        
        console.log('[Stripe Webhook] Invoice payment succeeded:', {
          invoiceId: invoice.id,
          customerId: invoice.customer,
          subscriptionId,
        });
        
        // If this is a subscription invoice, make sure the subscription is still active
        if (subscriptionId) {
          try {
            // Look up subscription to find user ID
            const { data: subscriptionData } = await supabaseAdmin
              .from('subscriptions')
              .select('user_id, tier')
              .eq('subscription_id', subscriptionId)
              .single();

            if (subscriptionData && subscriptionData.user_id) {
              // Update the subscription end date for recurring billing
              const { data, error } = await supabaseAdmin
                .from('subscriptions')
                .update({
                  status: 'active',
                  current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // Extend by 30 days
                  updated_at: new Date().toISOString()
                })
                .eq('subscription_id', subscriptionId);

              console.log('[Stripe Webhook] Subscription extension result:', { data, error });
            }
          } catch (err) {
            console.error('[Stripe Webhook] Error extending subscription period:', err);
          }
        }
        break;
      }

      default:
        console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
    }

    // Return a 200 response to acknowledge receipt of the event
    return res.status(200).json({ received: true });
  } catch (err: any) {
    console.error('[Stripe Webhook] Error:', err.message);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}

// Helper function to verify a subscription in the database
async function verifySubscriptionInDatabase(userId: string, tier: 'free' | 'basic' | 'pro'): Promise<boolean> {
  try {
    if (!supabaseAdmin) {
      console.error('[Stripe Webhook] supabaseAdmin is not available for verification');
      return false;
    }
    
    const { data, error } = await supabaseAdmin
      .from('subscriptions')
      .select('tier, status')
      .eq('user_id', userId)
      .single();
    
    if (error) {
      console.error('[Stripe Webhook] Error verifying subscription:', error);
      return false;
    }
    
    return data && data.tier === tier && data.status === 'active';
  } catch (err) {
    console.error('[Stripe Webhook] Error in subscription verification:', err);
    return false;
  }
} 