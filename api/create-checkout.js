// api/create-checkout.js
// Creates a Stripe checkout session with user metadata

/**
 * ENVIRONMENT SETUP
 * 
 * In Vercel, set these environment variables:
 * 
 * For TEST mode:
 *   STRIPE_SECRET_KEY = sk_test_xxxxx
 *   STRIPE_PRICE_TIER1 = price_test_xxxxx
 *   STRIPE_PRICE_TIER2 = price_test_xxxxx
 *   STRIPE_PRICE_UPGRADE = price_test_xxxxx
 * 
 * For LIVE mode:
 *   STRIPE_SECRET_KEY = sk_live_xxxxx
 *   STRIPE_PRICE_TIER1 = price_live_xxxxx
 *   STRIPE_PRICE_TIER2 = price_live_xxxxx
 *   STRIPE_PRICE_UPGRADE = price_live_xxxxx
 * 
 * TIP: Use Vercel's Preview vs Production environment variables
 *      to automatically switch between test and live modes.
 */

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Log mode on cold start (helps with debugging)
const isTestMode = process.env.STRIPE_SECRET_KEY?.startsWith('sk_test');
console.log(`💳 Stripe API running in ${isTestMode ? 'TEST' : 'LIVE'} mode`);

const PRICES = {
  tier1: process.env.STRIPE_PRICE_TIER1,
  tier2: process.env.STRIPE_PRICE_TIER2,
  upgrade: process.env.STRIPE_PRICE_UPGRADE
};

module.exports = async (req, res) => {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { tier, name, dob, version } = req.body;

    // Validate
    if (!tier || !PRICES[tier]) {
      return res.status(400).json({ error: 'Invalid tier' });
    }
    if (!name || !dob) {
      return res.status(400).json({ error: 'Missing user data' });
    }

    // Get the base URL for redirects
    const baseUrl = process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}` 
      : process.env.SITE_URL || 'http://localhost:3000';

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price: PRICES[tier],
        quantity: 1
      }],
      mode: 'payment',
      success_url: `${baseUrl}/api/verify-payment?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/reading.html?name=${encodeURIComponent(name)}&dob=${dob}&tier=free&v=${version}`,
      metadata: {
        tier: tier === 'upgrade' ? 'tier2' : tier,
        name,
        dob,
        version: version || '1'
      }
    });

    return res.status(200).json({ sessionId: session.id, url: session.url });

  } catch (error) {
    console.error('Checkout error:', error);
    return res.status(500).json({ error: 'Failed to create checkout session' });
  }
};
