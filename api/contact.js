// api/contact.js
// Handles contact form submissions

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

    // Option 1: Send via email service (Resend, SendGrid, etc.)
    // Uncomment and configure if using Resend:
    /*
    const { Resend } = require('resend');
    const resend = new Resend(process.env.RESEND_API_KEY);
    
    await resend.emails.send({
      from: 'ORACELIS <noreply@oracelis.app>',
      to: process.env.CONTACT_EMAIL || 'support@oracelis.app',
      subject: `[ORACELIS Contact] ${subject || 'New Message'}`,
      html: `
        <h2>New Contact Form Submission</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Subject:</strong> ${subject || 'N/A'}</p>
        <p><strong>Message:</strong></p>
        <p>${message.replace(/\n/g, '<br>')}</p>
      `
    });
    */

    // Option 2: Log to console (for testing/development)
    console.log('Contact form submission:', {
      name,
      email,
      subject: subject || 'N/A',
      message,
      timestamp: new Date().toISOString()
    });

    // Option 3: Store in database or external service
    // Add your preferred storage method here

    return res.status(200).json({ 
      success: true, 
      message: 'Thank you for your message. We will get back to you soon.' 
    });

  } catch (error) {
    console.error('Contact form error:', error);
    return res.status(500).json({ error: 'Failed to send message' });
  }
};
