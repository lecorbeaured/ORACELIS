// api/create-checkout.js
// Creates a Stripe checkout session with user metadata

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

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
