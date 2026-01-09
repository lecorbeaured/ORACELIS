/**
 * ORACELIS Legal Pages
 * Modal-based legal content
 */

const legalContent = {
  contact: `
    <h2>Contact Us</h2>
    <p>We'd love to hear from you. Whether you have questions about your reading, need support, or want to share feedback, we're here to help.</p>
    
    <h3>Email</h3>
    <p><a href="mailto:support@oracelis.app">support@oracelis.app</a></p>
    <p>We typically respond within 24-48 hours.</p>
    
    <h3>Location</h3>
    <p>ORACELIS<br>Las Vegas, NV<br>United States</p>
    
    <h3>Send a Message</h3>
    <form class="contact-form" id="contact-form" onsubmit="handleContactSubmit(event)">
      <input type="hidden" name="access_key" value="YOUR_WEB3FORMS_ACCESS_KEY">
      <input type="hidden" name="subject" value="New ORACELIS Contact Form Submission">
      <input type="hidden" name="from_name" value="ORACELIS Contact Form">
      <input type="checkbox" name="botcheck" class="hidden" style="display:none !important;">
      <input type="text" name="name" placeholder="Your Name" required>
      <input type="email" name="email" placeholder="Your Email" required>
      <textarea name="message" placeholder="Your Message" required></textarea>
      <button type="submit" class="btn btn-primary">Send Message</button>
      <div id="contact-status"></div>
    </form>
  `,
  
  privacy: `
    <h2>Privacy Policy</h2>
    <p>Your privacy is important to us. This policy explains how ORACELIS collects, uses, and protects your personal information.</p>
    
    <h3>Information We Collect</h3>
    <p>We collect information you provide directly:</p>
    <ul>
      <li>Name (first name only)</li>
      <li>Date of birth</li>
      <li>Time of birth (optional)</li>
      <li>Email address (if provided for contact)</li>
      <li>Payment information (processed securely by Stripe)</li>
    </ul>
    
    <h3>How We Use Your Information</h3>
    <ul>
      <li>Generate your personalized reading</li>
      <li>Process payments securely</li>
      <li>Respond to support inquiries</li>
      <li>Improve our services</li>
    </ul>
    
    <h3>Data Storage & Security</h3>
    <p>Your birth data is used only to generate your reading and is not permanently stored on our servers. Payment processing is handled securely by Stripe. We do not store credit card information.</p>
    
    <h3>Cookies & Analytics</h3>
    <p>We use Google Analytics to understand how visitors use our site. This helps us improve our service. You can opt out of analytics tracking through your browser settings.</p>
    
    <h3>Third-Party Services</h3>
    <ul>
      <li><strong>Stripe:</strong> Payment processing</li>
      <li><strong>Google Analytics:</strong> Site analytics</li>
      <li><strong>Netlify:</strong> Website hosting</li>
    </ul>
    
    <h3>Your Rights</h3>
    <p>You have the right to:</p>
    <ul>
      <li>Request access to your data</li>
      <li>Request deletion of your data</li>
      <li>Opt out of marketing communications</li>
    </ul>
    
    <h3>Contact</h3>
    <p>For privacy-related questions, contact us at <a href="mailto:support@oracelis.app">support@oracelis.app</a>.</p>
    
    <p class="last-updated">Last updated: January 2025</p>
  `,
  
  terms: `
    <h2>Terms of Service</h2>
    <p>By using ORACELIS, you agree to these terms. Please read them carefully.</p>
    
    <h3>Service Description</h3>
    <p>ORACELIS provides personalized spiritual readings based on birth date information. Our readings are generated for entertainment, personal reflection, and self-discovery purposes.</p>
    
    <h3>User Responsibilities</h3>
    <ul>
      <li>Provide accurate information when requested</li>
      <li>Use the service for personal, non-commercial purposes</li>
      <li>Not share, redistribute, or resell readings</li>
      <li>Be at least 18 years old or have parental consent</li>
    </ul>
    
    <h3>Intellectual Property</h3>
    <p>All content on ORACELIS, including readings, text, graphics, and code, is owned by ORACELIS and protected by copyright. You may print readings for personal use only.</p>
    
    <h3>Payment Terms</h3>
    <ul>
      <li>Prices are listed in USD</li>
      <li>Payment is processed securely by Stripe</li>
      <li>Access is granted immediately upon successful payment</li>
      <li>See our Refund Policy for refund eligibility</li>
    </ul>
    
    <h3>Limitation of Liability</h3>
    <p>ORACELIS readings are for entertainment purposes only. We are not liable for any decisions made based on reading content. See our Disclaimer for more details.</p>
    
    <h3>Modifications</h3>
    <p>We reserve the right to modify these terms at any time. Continued use of the service constitutes acceptance of updated terms.</p>
    
    <h3>Governing Law</h3>
    <p>These terms are governed by the laws of the State of Nevada, United States.</p>
    
    <p class="last-updated">Last updated: January 2025</p>
  `,
  
  refund: `
    <h2>Refund Policy</h2>
    <p>We want you to be satisfied with your ORACELIS reading. Please review our refund policy below.</p>
    
    <h3>Digital Product Nature</h3>
    <p>ORACELIS readings are digital products delivered instantly upon purchase. Due to the immediate delivery and personalized nature of our readings, we have specific refund guidelines.</p>
    
    <h3>Refund Eligibility</h3>
    <p><strong>Eligible for refund:</strong></p>
    <ul>
      <li>Technical errors preventing reading delivery</li>
      <li>Duplicate charges</li>
      <li>Unauthorized transactions (with verification)</li>
    </ul>
    
    <p><strong>Not eligible for refund:</strong></p>
    <ul>
      <li>Dissatisfaction with reading content (readings are subjective)</li>
      <li>Change of mind after purchase</li>
      <li>Readings already viewed or printed</li>
    </ul>
    
    <h3>How to Request a Refund</h3>
    <p>Contact us within 7 days of purchase at <a href="mailto:support@oracelis.app">support@oracelis.app</a> with:</p>
    <ul>
      <li>Your email address used for purchase</li>
      <li>Date of purchase</li>
      <li>Reason for refund request</li>
    </ul>
    
    <h3>Processing Time</h3>
    <p>Approved refunds are processed within 5-7 business days. Refunds are issued to the original payment method.</p>
    
    <h3>Questions?</h3>
    <p>If you're experiencing issues with your reading, please contact us first. We're often able to resolve concerns without a refund.</p>
    
    <p class="last-updated">Last updated: January 2025</p>
  `,
  
  disclaimer: `
    <h2>Disclaimer</h2>
    <p>Please read this disclaimer carefully before using ORACELIS.</p>
    
    <h3>Entertainment Purpose</h3>
    <p><strong>ORACELIS readings are provided for entertainment, personal reflection, and self-discovery purposes only.</strong> They should not be taken as professional advice of any kind.</p>
    
    <h3>Not Professional Advice</h3>
    <p>ORACELIS readings are <strong>not</strong> a substitute for:</p>
    <ul>
      <li>Professional medical or mental health advice</li>
      <li>Licensed financial or investment advice</li>
      <li>Legal counsel</li>
      <li>Professional therapy or counseling</li>
      <li>Any other professional services</li>
    </ul>
    
    <h3>Personal Responsibility</h3>
    <p>You are solely responsible for any decisions you make based on or influenced by our readings. ORACELIS and its creators are not responsible for any actions taken as a result of reading content.</p>
    
    <h3>No Guarantees</h3>
    <p>We make no claims or guarantees regarding:</p>
    <ul>
      <li>Accuracy of reading content</li>
      <li>Future predictions or outcomes</li>
      <li>Results from following any suggestions</li>
      <li>Compatibility with your personal beliefs</li>
    </ul>
    
    <h3>Health & Safety</h3>
    <p>If you are experiencing a mental health crisis, please contact a qualified professional or emergency services immediately. ORACELIS is not equipped to provide crisis support.</p>
    
    <h3>Age Requirement</h3>
    <p>ORACELIS is intended for users 18 years of age or older. Users under 18 should have parental or guardian consent.</p>
    
    <h3>Acceptance</h3>
    <p>By using ORACELIS, you acknowledge that you have read, understood, and agree to this disclaimer.</p>
    
    <p class="last-updated">Last updated: January 2025</p>
  `
};

function openModal(type) {
  const modal = document.getElementById('legal-modal');
  const content = document.getElementById('legal-modal-content');
  
  if (legalContent[type]) {
    content.innerHTML = legalContent[type];
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
}

function closeModal(event) {
  // If called from overlay click, check if click was on overlay itself
  if (event && event.target !== event.currentTarget) return;
  
  const modal = document.getElementById('legal-modal');
  modal.classList.remove('active');
  document.body.style.overflow = '';
}

// Close on Escape key
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') {
    closeModal();
  }
});

// Contact form rate limiting
const CONTACT_RATE_LIMIT = {
  maxMessages: 3,
  windowMs: 60 * 60 * 1000, // 1 hour
  storageKey: 'oracelis_contact'
};

function checkContactRateLimit() {
  const now = Date.now();
  try {
    const stored = localStorage.getItem(CONTACT_RATE_LIMIT.storageKey);
    let data = stored ? JSON.parse(stored) : { windowStart: now, count: 0 };
    
    // Reset if window expired
    if ((now - data.windowStart) > CONTACT_RATE_LIMIT.windowMs) {
      data = { windowStart: now, count: 0 };
    }
    
    if (data.count >= CONTACT_RATE_LIMIT.maxMessages) {
      const minsLeft = Math.ceil((data.windowStart + CONTACT_RATE_LIMIT.windowMs - now) / 60000);
      return { allowed: false, message: `Too many messages. Try again in ${minsLeft} minute${minsLeft > 1 ? 's' : ''}.` };
    }
    
    return { allowed: true };
  } catch (e) {
    return { allowed: true };
  }
}

function recordContactSubmission() {
  const now = Date.now();
  try {
    const stored = localStorage.getItem(CONTACT_RATE_LIMIT.storageKey);
    let data = stored ? JSON.parse(stored) : { windowStart: now, count: 0 };
    
    if ((now - data.windowStart) > CONTACT_RATE_LIMIT.windowMs) {
      data = { windowStart: now, count: 0 };
    }
    
    data.count++;
    localStorage.setItem(CONTACT_RATE_LIMIT.storageKey, JSON.stringify(data));
  } catch (e) {}
}

// Contact form handler - Web3Forms
async function handleContactSubmit(e) {
  e.preventDefault();
  const form = e.target;
  const submitBtn = form.querySelector('button[type="submit"]');
  const statusDiv = document.getElementById('contact-status');
  
  // Check honeypot (bot check)
  if (form.querySelector('input[name="botcheck"]').checked) {
    return; // Bot detected
  }
  
  // Check rate limit
  const rateCheck = checkContactRateLimit();
  if (!rateCheck.allowed) {
    statusDiv.innerHTML = `<p style="color: #ff9999; font-size: 0.85rem; margin-top: 0.5rem;">${rateCheck.message}</p>`;
    return;
  }
  
  // Disable button and show loading
  submitBtn.disabled = true;
  submitBtn.textContent = 'Sending...';
  statusDiv.innerHTML = '';
  
  try {
    const formData = new FormData(form);
    const object = Object.fromEntries(formData);
    delete object.botcheck; // Remove honeypot from submission
    const json = JSON.stringify(object);
    
    const response = await fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: json
    });
    
    const data = await response.json();
    
    if (data.success) {
      recordContactSubmission();
      form.innerHTML = '<p style="color: var(--gold-shimmer); text-align: center;">✓ Thank you! Your message has been sent. We\'ll get back to you soon.</p>';
    } else {
      throw new Error(data.message || 'Failed to send message');
    }
  } catch (error) {
    console.error('Contact form error:', error);
    submitBtn.disabled = false;
    submitBtn.textContent = 'Send Message';
    statusDiv.innerHTML = '<p style="color: #ff9999; font-size: 0.85rem; margin-top: 0.5rem;">Failed to send. Please try again or email us directly.</p>';
  }
}
