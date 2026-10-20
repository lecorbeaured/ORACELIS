// api/send-followups.js
// Daily cron target: sends Day 3 / Day 7 follow-up emails that are due.
//
// Vercel Cron calls this with GET. When CRON_SECRET is set as an env var,
// Vercel sends it as `Authorization: Bearer <secret>` and we require it,
// so the endpoint can't be triggered by just anyone. Sends are staged in
// Upstash by _followup.js; this endpoint only delivers what is due, and
// re-running it is safe (each stage sends exactly once).

const { Resend } = require('resend');
const { processDueFollowups } = require('./_followup');

const resend = new Resend(process.env.RESEND_API_KEY);

module.exports = async (req, res) => {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.authorization || '';
    if (auth !== `Bearer ${secret}`) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
  } else {
    console.warn('CRON_SECRET is not set — /api/send-followups is unauthenticated.');
  }

  const summary = await processDueFollowups({ resend });
  return res.status(200).json({ ok: true, ...summary });
};
