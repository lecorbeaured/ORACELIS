// api/create-reading-token.js
// Issues a short-lived encrypted access token for the free-tier reading flow.
//
// Previously, a free reading was opened as reading.html?name=...&dob=...
// &email=..., putting all three in the URL — which lands in browser history
// and could leak if the link is forwarded or screenshotted. This mints the
// same kind of encrypted token paid tiers already use (see _token.js), so
// the URL carries only an opaque token instead of raw PII. It doesn't touch
// Stripe or payment status — tier is always 'free' here.

const { encodeToken, TOKEN_SECRET } = require('./_token');
const { rateLimit } = require('./_rateLimit');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!TOKEN_SECRET) {
    console.error('TOKEN_SECRET is not configured — refusing to issue access tokens');
    return res.status(500).json({ error: 'Server misconfigured' });
  }

  // Unauthenticated, so cap it per IP like the other write-ish endpoints.
  const rl = rateLimit(req, { windowMs: 60 * 60 * 1000, max: 20, keyPrefix: 'create-reading-token' });
  if (!rl.allowed) {
    res.setHeader('Retry-After', String(rl.retryAfterSec));
    return res.status(429).json({ error: 'Too many requests. Please try again later.' });
  }

  const { name, dob, email, version } = req.body || {};

  if (!dob) {
    return res.status(400).json({ error: 'Missing date of birth' });
  }

  const token = encodeToken({
    tier: 'free',
    name: name || 'Seeker',
    dob,
    email: email || '',
    version: version || '1'
  });

  return res.status(200).json({ token });
};
