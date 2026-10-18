// api/_rateLimit.js
// Distributed rate limiting via Upstash Redis, with the original in-memory
// limiter as the fallback.
//
// Why: Vercel serverless functions run across many instances that reset on
// cold start, so an in-memory bucket only stops abuse from one IP within a
// single warm instance. An attacker rotating across instances could hammer
// expensive endpoints (each send-reading call burns real Resend emails).
// Upstash's sliding-window limiter shares state across every instance.
//
// Behavior is unchanged for callers: rateLimit(req, { windowMs, max,
// keyPrefix }) -> { allowed, retryAfterSec? }. It is now async, so call
// sites must await it. If Upstash isn't configured or its request fails,
// we fall back to the in-memory bucket rather than failing open or closed.

const { Redis } = require('@upstash/redis');
const { Ratelimit } = require('@upstash/ratelimit');

// ---- In-memory fallback (original implementation, unchanged) ----
const buckets = new Map();

function clientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) return forwarded.split(',')[0].trim();
  return req.socket?.remoteAddress || 'unknown';
}

function memoryLimit(key, windowMs, max) {
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

// ---- Upstash distributed limiter ----
let redis = null;
const limiterCache = new Map(); // `${max}:${windowMs}` -> Ratelimit

function upstashRedis() {
  if (redis !== null) return redis; // cached (or cached null)
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  redis = url && token ? new Redis({ url, token }) : null;
  if (!redis) {
    console.warn('Rate limiter: UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN not set — using in-memory fallback.');
  }
  return redis;
}

function toUpstashWindow(windowMs) {
  if (windowMs % 3600000 === 0) return `${windowMs / 3600000} h`;
  if (windowMs % 60000 === 0) return `${windowMs / 60000} m`;
  return `${Math.max(1, Math.ceil(windowMs / 1000))} s`;
}

function getLimiter(max, windowMs) {
  const key = `${max}:${windowMs}`;
  let limiter = limiterCache.get(key);
  if (!limiter) {
    limiter = new Ratelimit({
      redis: upstashRedis(),
      limiter: Ratelimit.slidingWindow(max, toUpstashWindow(windowMs)),
      analytics: false,
      prefix: 'oracelis-ratelimit',
    });
    limiterCache.set(key, limiter);
  }
  return limiter;
}

/**
 * @param {object} req - the Vercel request object
 * @param {object} opts
 * @param {number} opts.windowMs - length of the rate-limit window
 * @param {number} opts.max - max requests allowed per window per IP
 * @param {string} opts.keyPrefix - namespaces the bucket per endpoint
 * @returns {Promise<{ allowed: boolean, retryAfterSec?: number }>}
 */
async function rateLimit(req, { windowMs = 60_000, max = 10, keyPrefix = '' } = {}) {
  const key = `${keyPrefix}:${clientIp(req)}`;
  const client = upstashRedis();

  if (client) {
    try {
      const { success, reset } = await getLimiter(max, windowMs).limit(key);
      if (success) return { allowed: true };
      const retryAfterSec = Math.max(1, Math.ceil((reset - Date.now()) / 1000));
      return { allowed: false, retryAfterSec };
    } catch (err) {
      console.error('Upstash rate limiter failed, using in-memory fallback:', err && err.message ? err.message : err);
    }
  }

  return memoryLimit(key, windowMs, max);
}

module.exports = { rateLimit };
