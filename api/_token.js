// api/_token.js
// Shared access-token encode/decode for verify-payment.js and verify-token.js.
//
// Tokens are AES-256-GCM encrypted, not just HMAC-signed: the previous
// scheme signed a plaintext base64url JSON payload, so anyone who saw a
// reading URL (a link that gets emailed, pasted, forwarded) could decode
// the name/DOB/email inside it even though they couldn't forge a new one.
// GCM's auth tag gives the same tamper-detection the HMAC gave, while also
// hiding the payload from anyone who doesn't hold TOKEN_SECRET.
//
// decodeToken() still accepts the old 2-part HMAC-signed format so tokens
// already emailed out before this change keep working until they expire
// (48h from issue) rather than breaking mid-rollout.

const crypto = require('crypto');

const TOKEN_SECRET = process.env.TOKEN_SECRET;
const TOKEN_TTL_MS = 48 * 60 * 60 * 1000; // 48 hours

// Derive a fixed 32-byte AES-256 key from whatever length TOKEN_SECRET is,
// so operators don't need to hand-generate a separate encryption key.
function getKey() {
  return crypto.createHash('sha256').update(TOKEN_SECRET).digest();
}

function encodeToken(data) {
  const payload = { ...data, exp: Date.now() + TOKEN_TTL_MS };
  const iv = crypto.randomBytes(12); // standard GCM nonce size
  const cipher = crypto.createCipheriv('aes-256-gcm', getKey(), iv);
  const ciphertext = Buffer.concat([
    cipher.update(JSON.stringify(payload), 'utf8'),
    cipher.final()
  ]);
  const authTag = cipher.getAuthTag();

  return [iv, authTag, ciphertext].map(b => b.toString('base64url')).join('.');
}

function decodeToken(token) {
  if (typeof token !== 'string') {
    return { valid: false, error: 'Invalid token format' };
  }

  const parts = token.split('.');

  if (parts.length === 3) {
    // Current format: encrypted + authenticated.
    try {
      const [ivStr, tagStr, ctStr] = parts;
      const iv = Buffer.from(ivStr, 'base64url');
      const authTag = Buffer.from(tagStr, 'base64url');
      const ciphertext = Buffer.from(ctStr, 'base64url');

      const decipher = crypto.createDecipheriv('aes-256-gcm', getKey(), iv);
      decipher.setAuthTag(authTag);
      const plaintext = Buffer.concat([
        decipher.update(ciphertext),
        decipher.final() // throws if the auth tag doesn't match — tamper detection
      ]).toString('utf8');

      const payload = JSON.parse(plaintext);
      if (payload.exp && Date.now() > payload.exp) {
        return { valid: false, error: 'Token expired' };
      }
      return { valid: true, data: payload };
    } catch (e) {
      return { valid: false, error: 'Invalid token' };
    }
  }

  if (parts.length === 2) {
    // Legacy format: HMAC-signed plaintext, issued before encryption was
    // added. Honor it until it naturally expires so already-sent purchase
    // emails don't break.
    try {
      const [payloadStr, signature] = parts;
      const expectedSig = crypto
        .createHmac('sha256', TOKEN_SECRET)
        .update(payloadStr)
        .digest('base64url');

      if (signature !== expectedSig) {
        return { valid: false, error: 'Invalid signature' };
      }

      const payload = JSON.parse(Buffer.from(payloadStr, 'base64url').toString());
      if (payload.exp && Date.now() > payload.exp) {
        return { valid: false, error: 'Token expired' };
      }
      return { valid: true, data: payload };
    } catch (e) {
      return { valid: false, error: 'Invalid token format' };
    }
  }

  return { valid: false, error: 'Invalid token format' };
}

module.exports = { encodeToken, decodeToken, TOKEN_SECRET };
