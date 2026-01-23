// api/verify-payment.js
// Verifies Stripe payment and redirects with signed token

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const crypto = require('crypto');

const SECRET = process.env.TOKEN_SECRET || 'oracelis-secret-key-change-me';

// Generate signed token
function generateToken(data) {
  const payload = {
    ...data,
    exp: Date.now() + (48 * 60 * 60 * 1000) // 48 hour expiry
  };
  const payloadStr = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', SECRET)
    .update(payloadStr)
    .digest('base64url');
  return `${payloadStr}.${signature}`;
}

module.exports = async (req, res) => {
  const sessionId = req.query.session_id;

  if (!sessionId) {
    return res.status(400).send('Missing session_id');
  }

  try {
    // Retrieve the checkout session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    // Verify payment was successful
    if (session.payment_status !== 'paid') {
      return res.status(400).send('Payment not completed');
    }

    // Get user data from metadata
    const { tier, name, dob, email, version } = session.metadata;

    // Generate signed token
    const token = generateToken({
      tier,
      name,
      dob,
      email,
      version,
      sessionId
    });

    // Get base URL
    const baseUrl = process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}` 
      : process.env.SITE_URL || 'http://localhost:3000';

    // Redirect to reading page with token
    return res.redirect(302, `${baseUrl}/reading.html?token=${token}`);

  } catch (error) {
    console.error('Verification error:', error);
    return res.status(500).send('Failed to verify payment');
  }
};
