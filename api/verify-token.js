// api/verify-token.js
// Verifies the access token (encrypted+authenticated; see _token.js) and
// returns the user's tier

const { decodeToken, TOKEN_SECRET } = require('./_token');
const { rateLimit } = require('./_rateLimit');

module.exports = async (req, res) => {
  // Fail closed: never fall back to a known/default secret. If this isn't
  // configured, refuse to verify tokens instead of trusting a guessable one.
  if (!TOKEN_SECRET) {
    console.error('TOKEN_SECRET is not configured — refusing to verify tokens');
    return res.status(500).json({ valid: false, tier: 'free', error: 'Server misconfigured' });
  }

  // This is called once per reading-page load in normal use, so a
  // generous cap only bites a script hammering the endpoint.
  const rl = rateLimit(req, { windowMs: 60 * 60 * 1000, max: 60, keyPrefix: 'verify-token' });
  if (!rl.allowed) {
    res.setHeader('Retry-After', String(rl.retryAfterSec));
    return res.status(429).json({ valid: false, tier: 'free', error: 'Too many requests' });
  }

  let token;

  if (req.method === 'GET') {
    token = req.query.token;
  } else if (req.method === 'POST') {
    token = req.body?.token;
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!token) {
    return res.status(200).json({ valid: false, tier: 'free' });
  }

  const result = decodeToken(token);

  if (!result.valid) {
    return res.status(200).json({ valid: false, tier: 'free', error: result.error });
  }

  return res.status(200).json({
    valid: true,
    tier: result.data.tier,
    name: result.data.name,
    dob: result.data.dob,
    email: result.data.email,
    version: result.data.version
  });
};
