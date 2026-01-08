// api/verify-token.js
// Verifies the signed token and returns user tier

const crypto = require('crypto');

const SECRET = process.env.TOKEN_SECRET || 'oracelis-secret-key-change-me';

// Verify and decode token
function verifyToken(token) {
  try {
    const [payloadStr, signature] = token.split('.');
    
    // Verify signature
    const expectedSig = crypto
      .createHmac('sha256', SECRET)
      .update(payloadStr)
      .digest('base64url');
    
    if (signature !== expectedSig) {
      return { valid: false, error: 'Invalid signature' };
    }
    
    // Decode payload
    const payload = JSON.parse(Buffer.from(payloadStr, 'base64url').toString());
    
    // Check expiry
    if (payload.exp && Date.now() > payload.exp) {
      return { valid: false, error: 'Token expired' };
    }
    
    return { valid: true, data: payload };
  } catch (e) {
    return { valid: false, error: 'Invalid token format' };
  }
}

module.exports = async (req, res) => {
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

  const result = verifyToken(token);

  if (!result.valid) {
    return res.status(200).json({ valid: false, tier: 'free', error: result.error });
  }

  return res.status(200).json({
    valid: true,
    tier: result.data.tier,
    name: result.data.name,
    dob: result.data.dob,
    version: result.data.version
  });
};
