// api/_followup.js
// Day 3 / Day 7 follow-up email scheduler for free readings.
//
// How it works (v2, self-scheduled):
// - Resend's scheduledAt was verified broken for us on Oct 19, 2026: two
//   live test runs delivered the "scheduled" follow-ups immediately, so
//   we no longer trust Resend to hold them. We hold them ourselves.
// - send-reading.js calls scheduleFollowups() after the Day 1 email. It
//   stores a record in Upstash Redis (keyed by a SHA-256 hash of the
//   email) plus an entry in a `followup:due` sorted set scored by the
//   Day 3 timestamp. No email is sent at schedule time.
// - A daily Vercel Cron hits /api/send-followups, which calls
//   processDueFollowups(): it sends whatever is due (Day 3 first, then
//   Day 7) as ordinary immediate Resend sends and advances the record.
// - verify-payment.js calls cancelFollowupPitch() on every successful
//   purchase; it flags the record `buyer: true` so the Day 7 pitch is
//   skipped. (Day 3 is pure content, so buyers keep receiving it.)
// - The Day 7 email carries the reader's personal unlock URL, which
//   never expires for free readings (name/dob rebuild the reading, no
//   token involved), so it lands straight on the $29/$49 choice.
// - If Upstash isn't configured, everything below is a no-op and the
//   Day 1 flow is untouched.

const crypto = require('crypto');
const { Redis } = require('@upstash/redis');

const DAY_MS = 24 * 60 * 60 * 1000;
const KEY_TTL_SEC = 10 * 24 * 60 * 60; // 10 days: covers Day 7 + buffer
const DUE_SET = 'followup:due'; // sorted set: member = email hash, score = next due timestamp (ms)
const READERS_SET = 'readers:all'; // sorted set: member = email, score = first-seen timestamp (ms). No expiry.
const MAX_PER_RUN = 50; // records processed per cron run
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
  // The worked example below always uses the real send date for "today"
  // (UTC, matching the Vercel cron), computed at send time. March 14 is
  // an example birth date only: no reader birth dates are stored, so the
  // example cannot be personalized.
  const day = new Date().getUTCDate();
  const suffix = (day % 10 === 1 && day !== 11) ? 'st'
    : (day % 10 === 2 && day !== 12) ? 'nd'
    : (day % 10 === 3 && day !== 13) ? 'rd' : 'th';
  const digits = [3, 1, 4, ...String(day).split('').map(Number)];
  let total = digits.reduce((a, b) => a + b, 0);
  let math = `${digits.join(' + ')} = ${total}`;
  while (total > 9) {
    const parts = String(total).split('').map(Number);
    total = parts.reduce((a, b) => a + b, 0);
    math += `, then ${parts.join(' + ')} = ${total}`;
  }
  const todayExample = `For example, born March 14, and today is the ${day}${suffix}: ${math}. ${total === 8 ? 'An' : 'A'} ${total} day.`;
  const body = `
<p style="color:#f5f5f7;font-size:18px;">Hi ${name},</p>
<p>Your birth date gave you your life path number. But numbers move. Every single day carries its own vibration, and when you know it, you stop pushing against the week and start moving with it.</p>
<p>Here is the 30-second calculation. Add your birth month + birth day + today's date, then reduce to a single digit.</p>
<p>${todayExample}</p>
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
 * Store a pending follow-up record for a free reading. Sends nothing:
 * a daily cron (api/send-followups.js) delivers Day 3 / Day 7 when due.
 * Never throws: failures are logged and the Day 1 flow continues.
 */
async function scheduleFollowups({ email, name, unlockUrl }) {
  const redis = redisClient();
  if (!redis) {
    console.warn('Follow-up scheduler skipped: UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN not set.');
    return;
  }
  if (!email) return;

  try {
    const now = Date.now();
    const record = {
      email: String(email),
      name: esc(name || 'Seeker').slice(0, 100) || 'Seeker',
      unlockUrl: unlockUrl || 'https://oracelis.app',
      day3At: now + 3 * DAY_MS,
      day7At: now + 7 * DAY_MS,
      stage: 0, // 0 = nothing sent, 1 = Day 3 sent
      buyer: false,
    };
    const key = keyFor(email);
    const hash = key.slice('followup:'.length);
    await redis.set(key, JSON.stringify(record), { ex: KEY_TTL_SEC });
    await redis.zadd(DUE_SET, { score: record.day3At, member: hash });
    console.log('Follow-ups stored', { day3At: new Date(record.day3At).toISOString(), day7At: new Date(record.day7At).toISOString() });
  } catch (err) {
    console.error('Follow-up scheduling failed (Day 1 unaffected):', err && err.message ? err.message : err);
  }
}

/**
 * Send every follow-up that is due. Called by the daily cron endpoint.
 * Sends are plain immediate sends (no Resend scheduling). A record whose
 * send fails keeps its stage, so the next run retries it. Returns a
 * summary; never throws.
 */
async function processDueFollowups({ resend }) {
  const summary = { checked: 0, day3Sent: 0, day7Sent: 0, skippedBuyer: 0, errors: 0 };
  const redis = redisClient();
  if (!redis || !resend) return { ...summary, skipped: 'not-configured' };

  const now = Date.now();
  let hashes = [];
  try {
    hashes = await redis.zrange(DUE_SET, '-inf', now, { byScore: true, offset: 0, count: MAX_PER_RUN });
  } catch (err) {
    console.error('Follow-up due-scan failed:', err && err.message ? err.message : err);
    return { ...summary, errors: 1 };
  }

  for (const hash of hashes) {
    const key = `followup:${hash}`;
    try {
      const raw = await redis.get(key);
      if (!raw) { await redis.zrem(DUE_SET, hash); continue; }
      const rec = typeof raw === 'string' ? JSON.parse(raw) : raw;
      // Records written by the old Resend-scheduled version have no
      // timestamps; those emails already went out, so just clean up.
      if (!rec || !rec.day3At || !rec.day7At || !rec.email) {
        await redis.del(key);
        await redis.zrem(DUE_SET, hash);
        continue;
      }
      summary.checked++;

      if (rec.stage === 0 && now >= rec.day3At) {
        const { error } = await resend.emails.send({
          from: FROM,
          to: rec.email,
          headers: { 'List-Unsubscribe': UNSUBSCRIBE_MAILTO },
          subject: 'The energy of this week, for you',
          html: day3Html(rec.name),
        });
        if (error) throw new Error('Day 3 send failed: ' + JSON.stringify(error));
        rec.stage = 1;
        summary.day3Sent++;
      }

      if (rec.stage === 1 && now >= rec.day7At) {
        if (rec.buyer) {
          summary.skippedBuyer++;
        } else {
          const { error } = await resend.emails.send({
            from: FROM,
            to: rec.email,
            headers: { 'List-Unsubscribe': UNSUBSCRIBE_MAILTO },
            subject: 'Your free reading was just the surface',
            html: day7Html(rec.name, rec.unlockUrl),
          });
          if (error) throw new Error('Day 7 send failed: ' + JSON.stringify(error));
          summary.day7Sent++;
        }
        await redis.del(key);
        await redis.zrem(DUE_SET, hash);
        continue;
      }

      // Not finished: persist any stage change and re-score to Day 7.
      await redis.set(key, JSON.stringify(rec), { ex: KEY_TTL_SEC });
      await redis.zadd(DUE_SET, { score: rec.day7At, member: hash });
    } catch (err) {
      summary.errors++;
      console.error('Follow-up processing failed for one record:', err && err.message ? err.message : err);
    }
  }

  console.log('Follow-up run complete', summary);
  return summary;
}

/**
 * Permanently archive the reader in Upstash, independent of Resend.
 * Resend deletes email logs after 30 days; this is the owned copy of the
 * mailing list: a `readers:all` sorted set (member = email, score =
 * first-seen timestamp) plus a `reader:<hash>` record with the name.
 * No expiry. Repeat signups keep the original first-seen date.
 * Never throws; no-op when Upstash isn't configured.
 */
async function saveReaderRecord({ email, name }) {
  const redis = redisClient();
  if (!redis || !email) return;
  try {
    const member = String(email).toLowerCase().trim();
    const existing = await redis.zscore(READERS_SET, member);
    if (existing === null || existing === undefined) {
      const now = Date.now();
      await redis.zadd(READERS_SET, { score: now, member });
      await redis.set(
        `reader:${keyFor(email).slice('followup:'.length)}`,
        JSON.stringify({ email: member, name: esc(name || '').slice(0, 100), firstSeen: new Date(now).toISOString() })
      );
      console.log('Reader archived to Upstash list');
    }
  } catch (err) {
    console.error('Reader archive failed:', err && err.message ? err.message : err);
  }
}

/**
 * Flag a reader as a buyer after purchase so the Day 7 pitch is skipped.
 * Day 3 (pure content) still goes out. Never throws.
 */
async function cancelFollowupPitch({ email }) {
  const redis = redisClient();
  if (!redis || !email) return;
  try {
    const key = keyFor(email);
    const raw = await redis.get(key);
    if (!raw) return;
    const rec = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (!rec || !rec.day3At) { await redis.del(key); return; }
    rec.buyer = true;
    await redis.set(key, JSON.stringify(rec), { ex: KEY_TTL_SEC });
    console.log('Day 7 pitch will be skipped (buyer)');
  } catch (err) {
    console.error('Follow-up cancellation failed:', err && err.message ? err.message : err);
  }
}

module.exports = { scheduleFollowups, processDueFollowups, cancelFollowupPitch, saveReaderRecord, keyFor };
