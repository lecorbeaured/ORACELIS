// api/_rateLimit.js
// Lightweight in-memory rate limiter shared by the API routes.
//
// Vercel serverless functions can run across multiple instances and reset
// on cold start, so this is NOT a distributed rate limit — it's a
// best-effort speed bump against a single script hammering an endpoint
// from one IP within one warm instance. It stops the easy, casual abuse
// (a bot looping a form submit, a scraper hitting an endpoint in a tight
// loop) without adding new paid infrastructure. If you need airtight,
// cross-instance protection, put a shared store (e.g. Upstash Redis) behind
// this same function signature — nothing above this module needs to change.

const buckets = new Map();

function clientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) return forwarded.split(',')[0].trim();
  return req.socket?.remoteAddress || 'unknown';
}

/**
 * @param {object} req - the Vercel request object
 * @param {object} opts
 * @param {number} opts.windowMs - length of the rate-limit window
 * @param {number} opts.max - max requests allowed per window per IP
 * @param {string} opts.keyPrefix - namespaces the bucket per endpoint
 * @returns {{ allowed: boolean, retryAfterSec?: number }}
 */
function rateLimit(req, { windowMs = 60_000, max = 10, keyPrefix = '' } = {}) {
  const key = `${keyPrefix}:${clientIp(req)}`;
  const now = Date.now();

  let bucket = buckets.get(key);
  if (!bucket || now - bucket.windowStart > windowMs) {
    bucket = { windowStart: now, count: 0 };
    buckets.set(key, bucket);
  }

  bucket.count++;

  // Keep the map from growing unbounded on a long-lived warm instance —
  // sweep stale buckets once it gets large rather than on every call.
  if (buckets.size > 5000) {
    for (const [k, b] of buckets) {
      if (now - b.windowStart > windowMs) buckets.delete(k);
    }
  }

  if (bucket.count > max) {
    const retryAfterSec = Math.max(1, Math.ceil((bucket.windowStart + windowMs - now) / 1000));
    return { allowed: false, retryAfterSec };
  }

  return { allowed: true };
}

module.exports = { rateLimit };
