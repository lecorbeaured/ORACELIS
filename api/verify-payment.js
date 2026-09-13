// api/verify-payment.js
// Verifies Stripe payment and redirects with an access token (encrypted+
// authenticated; see _token.js)

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { encodeToken, TOKEN_SECRET } = require('./_token');
const { rateLimit } = require('./_rateLimit');

module.exports = async (req, res) => {
  // Fail closed: never fall back to a known/default secret. If this isn't
  // configured, refuse to issue tokens instead of minting ones anyone could forge.
  if (!TOKEN_SECRET) {
    console.error('TOKEN_SECRET is not configured — refusing to issue access tokens');
    return res.status(500).send('Server misconfigured: missing TOKEN_SECRET');
  }

  // Each real purchase hits this once via the Stripe redirect; a generous
  // cap here just blunts someone scripting session_id guesses.
  const rl = rateLimit(req, { windowMs: 60 * 60 * 1000, max: 30, keyPrefix: 'verify-payment' });
  if (!rl.allowed) {
    res.setHeader('Retry-After', String(rl.retryAfterSec));
    return res.status(429).send('Too many requests, please try again shortly.');
  }

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

    // Generate access token
    const token = encodeToken({
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
