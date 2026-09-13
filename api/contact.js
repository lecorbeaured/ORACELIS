// api/contact.js
// Handles contact form submissions — sends a notification via Resend

const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

const MAX_NAME_LENGTH = 100;
const MAX_SUBJECT_LENGTH = 200;
const MAX_MESSAGE_LENGTH = 5000;

// Escape before interpolating into the notification email — this endpoint
// has no auth, so nothing from the request body is trusted as markup.
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

module.exports = async (req, res) => {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { name, email, subject, message } = req.body;

    // Validate required fields
    if (!name || !email || !message) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Cap lengths — this endpoint is unauthenticated, so never trust size
    const safeName = String(name).slice(0, MAX_NAME_LENGTH);
    const safeSubject = subject ? String(subject).slice(0, MAX_SUBJECT_LENGTH) : 'New Message';
    const safeMessage = String(message).slice(0, MAX_MESSAGE_LENGTH);

    const { error } = await resend.emails.send({
      from: 'ORACELIS <noreply@oracelis.app>',
      to: process.env.CONTACT_EMAIL || 'support@oracelis.app',
      replyTo: email,
      subject: `[ORACELIS Contact] ${safeSubject}`,
      html: `
        <h2>New Contact Form Submission</h2>
        <p><strong>Name:</strong> ${escapeHtml(safeName)}</p>
        <p><strong>Email:</strong> ${escapeHtml(email)}</p>
        <p><strong>Subject:</strong> ${escapeHtml(safeSubject)}</p>
        <p><strong>Message:</strong></p>
        <p>${escapeHtml(safeMessage).replace(/\n/g, '<br>')}</p>
      `
    });

    if (error) {
      console.error('Resend error (contact form):', error);
      return res.status(500).json({ error: 'Failed to send message' });
    }

    console.log('Contact form submission sent', { timestamp: new Date().toISOString() });

    return res.status(200).json({
      success: true,
      message: 'Thank you for your message. We will get back to you soon.'
    });

  } catch (error) {
    console.error('Contact form error:', error);
    return res.status(500).json({ error: 'Failed to send message' });
  }
};
