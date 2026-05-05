import { NextRequest, NextResponse } from 'next/server'

// ─── Stripe Webhook ─────────────────────────────────────────
// POST /api/stripe/webhook
// Handles Stripe events: subscription created/updated/deleted

export async function POST(request: NextRequest) {
  try {
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

    if (!stripeSecretKey || !webhookSecret) {
      return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 })
    }

    const { default: Stripe } = await import('stripe')
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2025-03-31.basil' as any,
    })

    const body = await request.text()
    const signature = request.headers.get('stripe-signature') || ''

    let event: any
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (err: any) {
      console.error('[Stripe Webhook] Signature verification failed:', err.message)
      return NextResponse.json({ error: 'Webhook signature verification failed' }, { status: 400 })
    }

    // ── Handle events ─────────────────────────────────
    const appwriteEndpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://sgp.cloud.appwrite.io/v1'
    const appwriteProject = process.env.NEXT_PUBLIC_APPWRITE_PROJECT
    const appwriteKey = process.env.APPWRITE_API_KEY

    const awHeaders = {
      'Content-Type': 'application/json',
      'X-Appwrite-Key': appwriteKey || '',
      'X-Appwrite-Project': appwriteProject || '',
    }

    const userId = event.data.object.client_reference_id || event.data.object.metadata?.userId

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object
        console.log('[Stripe Webhook] Checkout completed for user:', userId)

        // Update user's subscription status in AppWrite
        if (userId && appwriteKey) {
          await fetch(`${appwriteEndpoint}/users/${userId}/prefs`, {
            method: 'PATCH',
            headers: awHeaders,
            body: JSON.stringify({
              prefs: {
                subscription: 'pro',
                stripeCustomerId: session.customer,
                stripeSubscriptionId: session.subscription,
                subscribedAt: new Date().toISOString(),
              },
            }),
          }).catch(e => console.error('[Stripe Webhook] Failed to update user prefs:', e))
        }
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object
        console.log('[Stripe Webhook] Subscription updated:', subscription.id, subscription.status)

        if (userId && appwriteKey) {
          const isActive = subscription.status === 'active' || subscription.status === 'trialing'
          await fetch(`${appwriteEndpoint}/users/${userId}/prefs`, {
            method: 'PATCH',
            headers: awHeaders,
            body: JSON.stringify({
              prefs: {
                subscription: isActive ? 'pro' : 'free',
                subscriptionStatus: subscription.status,
                currentPeriodEnd: subscription.current_period_end
                  ? new Date(subscription.current_period_end * 1000).toISOString()
                  : null,
              },
            }),
          }).catch(e => console.error('[Stripe Webhook] Failed to update subscription:', e))
        }
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object
        console.log('[Stripe Webhook] Subscription deleted:', subscription.id)

        if (userId && appwriteKey) {
          await fetch(`${appwriteEndpoint}/users/${userId}/prefs`, {
            method: 'PATCH',
            headers: awHeaders,
            body: JSON.stringify({
              prefs: {
                subscription: 'free',
                subscriptionStatus: 'canceled',
              },
            }),
          }).catch(e => console.error('[Stripe Webhook] Failed to mark as free:', e))
        }
        break
      }
    }

    return NextResponse.json({ received: true })
  } catch (error: any) {
    console.error('[Stripe Webhook] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Webhook handler error' },
      { status: 500 }
    )
  }
}
