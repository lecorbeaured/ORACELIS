// api/_followup.js
// Day 3 / Day 7 follow-up email scheduler for free readings.
//
// How it works:
// - send-reading.js calls scheduleFollowups() right after the Day 1 reading
//   email goes out (free tier only).
// - Day 3 and Day 7 are sent via Resend's scheduledAt, so no cron, worker,
//   or broadcast is needed. The Day 7 email carries the reader's personal
//   unlock URL, which never expires for free readings (name/dob rebuild the
//   reading, no token involved), so it lands straight on the $29/$49 choice.
// - verify-payment.js calls cancelFollowupPitch() on every successful
//   purchase so buyers never get pitched something they already own.
//   (Day 3 is pure content, so buyers keep receiving it.)
// - Scheduled email IDs live in Upstash Redis, keyed by a SHA-256 hash of
//   the email address, with a 9-day TTL. If Upstash isn't configured,
//   everything below is a no-op and the Day 1 flow is untouched.

const crypto = require('crypto');
const { Redis } = require('@upstash/redis');

const DAY_MS = 24 * 60 * 60 * 1000;
const KEY_TTL_SEC = 9 * 24 * 60 * 60; // 9 days: covers Day 7 + buffer
const FROM = 'ORACELIS <readings@oracelis.app>';
const UNSUBSCRIBE_MAILTO = '<mailto:readings@oracelis.app?subject=unsubscribe>';

function redisClient() {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  return new Redis({ url, token });
}

function keyFor(email) {
  const hash = crypto.createHash('sha256')
    .update(String(email).toLowerCase().trim())
    .digest('hex');
  return `followup:${hash}`;
}

function esc(str) {
  return String(str == null ? '' : str).replace(/[\r\n]/g, '');
}

function emailShell(title, preheader, bodyInner) {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>${title}</title></head>
<body style="margin:0;padding:0;background-color:#0a0a12;font-family:Georgia,'Times New Roman',serif;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${preheader}</div>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#0a0a12;">
<tr><td align="center" style="padding:40px 20px;">
<table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width:600px;width:100%;">
<tr><td align="center" style="padding-bottom:30px;">
<h1 style="color:#d4a574;font-size:24px;font-weight:300;letter-spacing:0.2em;margin:0;">✦ ORACELIS ✦</h1>
</td></tr>
<tr><td style="background:rgba(255,255,255,0.02);border:1px solid rgba(200,197,214,0.1);border-radius:12px;padding:30px;">
<div style="color:#c8c5d6;font-size:16px;line-height:1.9;">${bodyInner}</div>
</td></tr>
<tr><td align="center" style="padding-top:30px;">
<p style="color:#666;font-size:12px;margin:0;">✦ ORACELIS ✦<br>Spiritual guidance for the modern seeker</p>
<p style="color:#444;font-size:11px;margin:15px 0 0;">You're receiving this because you requested a free reading at oracelis.app.<br>Don't want these notes? Just reply with "unsubscribe".</p>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}

function day3Html(name) {
  const body = `
<p style="color:#f5f5f7;font-size:18px;">Hi ${name},</p>
<p>Your birth date gave you your life path number. But numbers move. Every single day carries its own vibration, and when you know it, you stop pushing against the week and start moving with it.</p>
<p>Here is the 30-second calculation. Add your birth month + birth day + today's date, then reduce to a single digit.</p>
<p>Born March 14, and today is the 18th: 3 + 1 + 4 + 1 + 8 = 17, then 1 + 7 = 8. An 8 day.</p>
<p>Each result has a flavor:</p>
<ul style="color:#c8c5d6;line-height:2;">
<li><strong style="color:#d4a574;">1:</strong> start something. <strong style="color:#d4a574;">2:</strong> listen and connect. <strong style="color:#d4a574;">3:</strong> create and express.</li>
<li><strong style="color:#d4a574;">4:</strong> organize and ground. <strong style="color:#d4a574;">5:</strong> embrace change. <strong style="color:#d4a574;">6:</strong> nurture and repair.</li>
<li><strong style="color:#d4a574;">7:</strong> reflect and study. <strong style="color:#d4a574;">8:</strong> act on money and goals. <strong style="color:#d4a574;">9:</strong> release and forgive.</li>
</ul>
<p>Try it tomorrow morning before you check your phone. Notice how the day bends toward the number.</p>
<p>If you want to go deeper into what the year ahead holds, this is a good place to continue: <a href="https://oracelis.app/blog/personal-year-number-2027.html" style="color:#d4a574;">your personal year number for 2027</a>.</p>
<p>Talk soon,<br>ORACELIS</p>`;
  return emailShell('The energy of this week, for you', 'A 30-second calculation reveals what this week is asking of you.', body);
}

function day7Html(name, unlockUrl) {
  const body = `
<p style="color:#f5f5f7;font-size:18px;">Hi ${name},</p>
<p>A week ago you received your free ORACELIS reading: your core theme, and a first look at what you're experiencing right now.</p>
<p>That was the doorway. Here is what sits behind it in the Full Current State Reading:</p>
<ul style="color:#c8c5d6;line-height:2;">
<li><strong style="color:#d4a574;">Your life lessons:</strong> the patterns that keep repeating, and why</li>
<li><strong style="color:#d4a574;">Your hidden strengths:</strong> the ones you undervalue most</li>
<li><strong style="color:#d4a574;">What's keeping you stuck:</strong> named plainly, with a way through</li>
</ul>
<p style="font-style:italic;border-left:2px solid #d4a574;padding-left:16px;">"It described exactly what I'm going through right now and gave me hope for what's coming. I've printed it and read it every morning." — Sarah M., Los Angeles</p>
<p>The Full Current State Reading is <strong style="color:#d4a574;">$29, one time</strong>. No subscription, no upsell maze. If it doesn't resonate, you're covered by the 7-day guarantee.</p>
<p align="center" style="margin:30px 0;">
<a href="${unlockUrl}" style="display:inline-block;background:linear-gradient(135deg,#d4a574 0%,#c49a6c 100%);color:#0a0a12;text-decoration:none;padding:14px 32px;border-radius:8px;font-size:14px;font-weight:600;letter-spacing:0.05em;">Unlock My Full Reading →</a>
</p>
<p style="font-size:14px;">That takes you straight back to your reading, on the $29 / $49 choice. Either way, your free reading is yours to keep. But if you've felt the pull this week, trust it.</p>
<p>ORACELIS</p>
<p style="font-size:13px;color:#888;">P.S. The readers who get the most from the full reading are the ones who print it. Something about seeing it on paper makes the patterns impossible to unsee.</p>`;
  return emailShell('Your free reading was just the surface', "The deeper layers are still waiting, whenever you're ready.", body);
}

/**
 * Schedule Day 3 + Day 7 follow-ups for a free reading. Never throws:
 * failures are logged and the Day 1 flow continues untouched.
 */
async function scheduleFollowups({ resend, email, name, unlockUrl }) {
  const redis = redisClient();
  if (!redis) {
    console.warn('Follow-up scheduler skipped: UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN not set.');
    return;
  }
  if (!resend || !email) return;

  try {
    const safeName = esc(name || 'Seeker').slice(0, 100) || 'Seeker';
    const safeEmail = esc(email);
    const common = {
      from: FROM,
      to: safeEmail,
      headers: { 'List-Unsubscribe': UNSUBSCRIBE_MAILTO },
    };

    const day3 = await resend.emails.send({
      ...common,
      subject: 'The energy of this week, for you',
      html: day3Html(safeName),
      scheduledAt: new Date(Date.now() + 3 * DAY_MS).toISOString(),
    });
    if (day3.error) throw new Error('Day 3 schedule failed: ' + JSON.stringify(day3.error));

    const day7 = await resend.emails.send({
      ...common,
      subject: 'Your free reading was just the surface',
      html: day7Html(safeName, unlockUrl || 'https://oracelis.app'),
      scheduledAt: new Date(Date.now() + 7 * DAY_MS).toISOString(),
    });
    if (day7.error) throw new Error('Day 7 schedule failed: ' + JSON.stringify(day7.error));

    await redis.set(
      keyFor(safeEmail),
      JSON.stringify({ day3: day3.data.id, day7: day7.data.id }),
      { ex: KEY_TTL_SEC }
    );
    console.log('Follow-ups scheduled', { day3: day3.data.id, day7: day7.data.id });
  } catch (err) {
    console.error('Follow-up scheduling failed (Day 1 unaffected):', err && err.message ? err.message : err);
  }
}

/**
 * Cancel the scheduled Day 7 pitch after a purchase. Keeps Day 3 (pure
 * content). Never throws.
 */
async function cancelFollowupPitch({ resend, email }) {
  const redis = redisClient();
  if (!redis || !resend || !email) return;
  try {
    const raw = await redis.get(keyFor(email));
    if (!raw) return;
    const ids = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (ids && ids.day7) {
      await resend.emails.cancel(ids.day7);
      console.log('Cancelled Day 7 pitch after purchase', { day7: ids.day7 });
    }
    await redis.del(keyFor(email));
  } catch (err) {
    console.error('Follow-up cancellation failed:', err && err.message ? err.message : err);
  }
}

module.exports = { scheduleFollowups, cancelFollowupPitch, keyFor };
