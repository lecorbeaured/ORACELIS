// api/send-reading.js
// Sends reading to user's email and stores email for marketing

const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

const MAX_PAGES = 10;
const MAX_TITLE_LENGTH = 200;
const MAX_CONTENT_LENGTH = 20000;

// Escape before any interpolation into the email HTML. Everything in the
// request body is client-supplied (this endpoint has no auth), so nothing
// from it is ever trusted as markup — only as plain text.
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Mirrors the client's formatContent() (paragraphs, bullets, bold) but
// escapes the raw text first, so the only HTML in the output is the tags
// this function itself writes.
function formatContentForEmail(text) {
  const escaped = escapeHtml(text);
  let html = escaped
    .split('\n\n')
    .map(p => {
      if (p.includes('•')) {
        const lines = p.split('\n');
        const bullets = lines.filter(l => l.trim().startsWith('•'));
        const nonBullets = lines.filter(l => !l.trim().startsWith('•'));
        let result = '';
        if (nonBullets.length > 0) result += `<p>${nonBullets.join(' ')}</p>`;
        if (bullets.length > 0) {
          result += '<ul>' + bullets.map(b => `<li>${b.replace('•', '').trim()}</li>`).join('') + '</ul>';
        }
        return result;
      }
      return `<p>${p.replace(/\n/g, '<br>')}</p>`;
    })
    .join('');
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  return html;
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { name, email, dob, tier, pages, nodeSign } = req.body;

    // Validate
    if (!email || !name || !Array.isArray(pages) || pages.length === 0) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Never trust the shape or size of client-supplied content. Cap page
    // count and length so this can't be used to build an oversized or
    // malformed email, and drop anything that isn't a plain string.
    const safePages = pages
      .filter(p => p && typeof p.title === 'string' && typeof p.content === 'string')
      .slice(0, MAX_PAGES)
      .map(p => ({
        title: p.title.slice(0, MAX_TITLE_LENGTH),
        content: p.content.slice(0, MAX_CONTENT_LENGTH)
      }));

    if (safePages.length === 0) {
      return res.status(400).json({ error: 'Invalid reading content' });
    }

    // Format the reading content for email
    const htmlContent = generateEmailHTML(name, safePages, tier || 'free');
    const safeSubjectName = String(name).replace(/[\r\n]/g, '').slice(0, 100);

    // Send email via Resend
    const { data, error } = await resend.emails.send({
      from: 'ORACELIS <readings@oracelis.app>',
      to: email,
      subject: `${safeSubjectName}, Your ORACELIS Reading is Ready`,
      html: htmlContent
    });

    if (error) {
      console.error('Resend error:', error);
      return res.status(500).json({ error: 'Failed to send email' });
    }

    // Log send activity without birth data or the full email/name pair —
    // enough to debug delivery without persisting PII in Vercel's logs.
    console.log('Reading email sent', { tier: tier || 'free', pageCount: safePages.length, timestamp: new Date().toISOString() });

    // Add to Resend Audience for marketing, if one is configured
    if (process.env.RESEND_AUDIENCE_ID) {
      try {
        await resend.contacts.create({
          email,
          firstName: name,
          audienceId: process.env.RESEND_AUDIENCE_ID,
          unsubscribed: false
        });
      } catch (audienceError) {
        console.error('Audience error:', audienceError);
        // Don't fail the request if audience add fails
      }
    } else {
      console.warn('RESEND_AUDIENCE_ID is not set — this email was sent but the contact was not saved to any Resend Audience.');
    }

    return res.status(200).json({ success: true, messageId: data?.id });

  } catch (error) {
    console.error('Send reading error:', error);
    return res.status(500).json({ error: 'Failed to send reading' });
  }
};

function generateEmailHTML(name, pages, tier) {
  const safeName = escapeHtml(name);
  const readingTitle = escapeHtml(pages[0]?.title || 'Your Soul Reading');
  const bodyHtml = pages
    .map(p => `<h3 style="color: #d4a574; margin: 20px 0 10px;">${escapeHtml(p.title)}</h3>\n${formatContentForEmail(p.content)}`)
    .join('\n\n');

  // Customize CTA based on tier
  let ctaSection = '';

  if (tier === 'free') {
    ctaSection = `
          <!-- Upgrade CTA -->
          <tr>
            <td align="center" style="padding: 40px 0;">
              <p style="color: #c8c5d6; font-size: 14px; margin: 0 0 20px;">
                This is your free preview. Unlock your complete soul reading for deeper insights.
              </p>
              <a href="https://oracelis.app" style="display: inline-block; background: linear-gradient(135deg, #d4a574 0%, #c49a6c 100%); color: #0a0a12; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 14px; font-weight: 600; letter-spacing: 0.05em;">
                Unlock Complete Reading →
              </a>
            </td>
          </tr>`;
  } else if (tier === 'tier1') {
    ctaSection = `
          <!-- Upgrade CTA -->
          <tr>
            <td align="center" style="padding: 40px 0;">
              <p style="color: #c8c5d6; font-size: 14px; margin: 0 0 20px;">
                Ready for even deeper insights? Upgrade to unlock your complete soul journey.
              </p>
              <a href="https://oracelis.app" style="display: inline-block; background: linear-gradient(135deg, #d4a574 0%, #c49a6c 100%); color: #0a0a12; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 14px; font-weight: 600; letter-spacing: 0.05em;">
                Unlock Full Journey →
              </a>
            </td>
          </tr>`;
  } else {
    // tier2 - full access, thank you message instead
    ctaSection = `
          <!-- Thank You -->
          <tr>
            <td align="center" style="padding: 40px 0;">
              <p style="color: #d4a574; font-size: 16px; margin: 0;">
                ✦ Thank you for your purchase ✦
              </p>
              <p style="color: #c8c5d6; font-size: 14px; margin: 10px 0 0;">
                This is your complete soul reading. Save this email to revisit your insights anytime.
              </p>
            </td>
          </tr>`;
  }

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your ORACELIS Reading</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0a0a12; font-family: Georgia, 'Times New Roman', serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #0a0a12;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width: 600px; width: 100%;">

          <!-- Header -->
          <tr>
            <td align="center" style="padding-bottom: 30px;">
              <h1 style="color: #d4a574; font-size: 28px; font-weight: 300; letter-spacing: 0.2em; margin: 0;">✦ ORACELIS ✦</h1>
              <p style="color: #c8c5d6; font-size: 14px; margin: 10px 0 0;">Your Personal Soul Reading</p>
            </td>
          </tr>

          <!-- Greeting -->
          <tr>
            <td style="background: linear-gradient(135deg, rgba(212,165,116,0.1) 0%, rgba(10,10,18,0.9) 100%); border: 1px solid rgba(212,165,116,0.3); border-radius: 12px; padding: 30px;">
              <h2 style="color: #f5f5f7; font-size: 24px; font-weight: 300; margin: 0 0 10px;">Dear ${safeName},</h2>
              <p style="color: #c8c5d6; font-size: 16px; line-height: 1.8; margin: 0;">
                Your soul reading has been prepared based on your unique cosmic blueprint.
                Below is your personalized reading: <strong style="color: #d4a574;">${readingTitle}</strong>
              </p>
            </td>
          </tr>

          <!-- Reading Content -->
          <tr>
            <td style="background: rgba(255,255,255,0.02); border: 1px solid rgba(200,197,214,0.1); border-radius: 12px; padding: 30px; margin-top: 20px;">
              <div style="color: #c8c5d6; font-size: 16px; line-height: 1.9;">
                ${bodyHtml}
              </div>
            </td>
          </tr>

          ${ctaSection}

          <!-- Footer -->
          <tr>
            <td align="center" style="padding-top: 30px; border-top: 1px solid rgba(200,197,214,0.1);">
              <p style="color: #666; font-size: 12px; margin: 0;">
                ✦ ORACELIS ✦<br>
                Spiritual guidance for the modern seeker
              </p>
              <p style="color: #444; font-size: 11px; margin: 15px 0 0;">
                You received this email because you requested a reading at oracelis.app<br>
                <a href="https://oracelis.app" style="color: #d4a574;">Visit ORACELIS</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}
