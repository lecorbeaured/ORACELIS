// api/subscribe.js
// Email signup from the planetary hours page. Adds the address to the Resend Audience.

const { Resend } = require('resend');
const { rateLimit } = require('./_rateLimit');
const { audienceId } = require('./_audience');

const resend = new Resend(process.env.RESEND_API_KEY);

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const rl = await rateLimit(req, { windowMs: 60 * 60 * 1000, max: 10, keyPrefix: 'subscribe' });
  if (!rl.allowed) {
    res.setHeader('Retry-After', String(rl.retryAfterSec));
    return res.status(429).json({ error: 'Too many attempts. Please try again later.' });
  }

  const email = String((req.body && req.body.email) || '').trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) || email.length > 254) {
    return res.status(400).json({ error: 'Invalid email' });
  }
  const audId = audienceId();
  if (!process.env.RESEND_API_KEY || !audId) {
    console.error('subscribe: RESEND_API_KEY missing or RESEND_AUDIENCE_ID missing/not a valid UUID');
    return res.status(500).json({ error: 'Not configured' });
  }

  try {
    const { error } = await resend.contacts.create({
      email,
      audienceId: audId,
      unsubscribed: false
    });
    if (error) {
      console.error('subscribe: Resend error', error);
      return res.status(502).json({ error: 'Could not save email' });
    }

    // Also archive to our own Upstash readers list, same as the main
    // reading flow, so tool signups are in the owned copy too.
    // Never throws; a failure here must not fail the signup.
    try {
      const { saveReaderRecord } = require('./_followup');
      await saveReaderRecord({ email });
    } catch (archiveError) {
      console.error('subscribe: archive failed', archiveError);
    }

    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error('subscribe: failed', e);
    return res.status(502).json({ error: 'Could not save email' });
  }
};
