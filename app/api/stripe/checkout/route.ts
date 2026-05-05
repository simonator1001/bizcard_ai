import { NextRequest, NextResponse } from 'next/server'

// ─── Stripe Checkout ────────────────────────────────────────
// POST /api/stripe/checkout
// Creates a Stripe Checkout session for Pro subscription

export async function POST(request: NextRequest) {
  try {
    const { userId, email, plan } = await request.json()

    if (!userId || !email) {
      return NextResponse.json({ error: 'Missing userId or email' }, { status: 400 })
    }

    const stripeSecretKey = process.env.STRIPE_SECRET_KEY
    if (!stripeSecretKey) {
      return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 })
    }

    // ── Define price IDs ──────────────────────────────
    // Replace these with actual Stripe price IDs from your dashboard
    const priceMap: Record<string, string> = {
      pro_monthly: process.env.STRIPE_PRICE_PRO_MONTHLY || 'price_placeholder_monthly',
      pro_yearly: process.env.STRIPE_PRICE_PRO_YEARLY || 'price_placeholder_yearly',
    }

    const priceId = priceMap[plan] || priceMap.pro_monthly

    // ── Dynamically import Stripe ─────────────────────
    const { default: Stripe } = await import('stripe')
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2025-03-31.basil' as any,
    })

    // ── Create Checkout Session ───────────────────────
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      customer_email: email,
      client_reference_id: userId,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${request.nextUrl.origin}/pricing?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${request.nextUrl.origin}/pricing?canceled=true`,
      metadata: { userId, plan },
    })

    return NextResponse.json({ url: session.url })
  } catch (error: any) {
    console.error('[Stripe Checkout] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}
