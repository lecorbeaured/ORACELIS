// api/send-reading.js
// Sends reading to user's email and stores email for marketing

const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { name, email, dob, readingTitle, readingContent, nodeSign } = req.body;

    // Validate
    if (!email || !name || !readingContent) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Format the reading content for email
    const htmlContent = generateEmailHTML(name, readingTitle, readingContent, nodeSign);

    // Send email via Resend
    const { data, error } = await resend.emails.send({
      from: 'ORACELIS <readings@oracelis.app>',
      to: email,
      subject: `${name}, Your ORACELIS Reading is Ready`,
      html: htmlContent
    });

    if (error) {
      console.error('Resend error:', error);
      return res.status(500).json({ error: 'Failed to send email' });
    }

    // Store email for marketing (using Resend Audiences or log for now)
    // You can add to Resend Audience, or store in Vercel KV, or webhook to email service
    console.log('Email collected:', { email, name, dob, timestamp: new Date().toISOString() });

    // Optional: Add to Resend Audience for marketing
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
    }

    return res.status(200).json({ success: true, messageId: data?.id });

  } catch (error) {
    console.error('Send reading error:', error);
    return res.status(500).json({ error: 'Failed to send reading' });
  }
};

function generateEmailHTML(name, readingTitle, readingContent, nodeSign) {
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
              <h2 style="color: #f5f5f7; font-size: 24px; font-weight: 300; margin: 0 0 10px;">Dear ${name},</h2>
              <p style="color: #c8c5d6; font-size: 16px; line-height: 1.8; margin: 0;">
                Your soul reading has been prepared based on your unique cosmic blueprint. 
                Below is your personalized reading: <strong style="color: #d4a574;">${readingTitle}</strong>
              </p>
            </td>
          </tr>
          
          <!-- Reading Content -->
          <tr>
            <td style="background: rgba(255,255,255,0.02); border: 1px solid rgba(200,197,214,0.1); border-radius: 12px; padding: 30px;">
              <div style="color: #c8c5d6; font-size: 16px; line-height: 1.9;">
                ${readingContent.replace(/\n/g, '<br><br>')}
              </div>
            </td>
          </tr>
          
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
          </tr>
          
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
