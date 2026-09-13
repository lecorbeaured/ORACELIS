/**
 * ORACELIS Stripe Integration
 *
 * Checkout is entirely server-driven: this just posts to /api/create-checkout
 * and redirects to the session URL Stripe returns, so no publishable key or
 * live/test toggle is needed client-side — the real mode is determined by
 * which STRIPE_SECRET_KEY is set in Vercel (see api/create-checkout.js).
 */

async function openCheckout(tier) {
  // Get stored user data
  const userData = window.readingUserData || {};
  
  try {
    const response = await fetch('/api/create-checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tier,
        name: userData.name || 'Guest',
        dob: userData.dob || '',
        email: userData.email || '',
        version: userData.version || '1'
      })
    });
    
    const data = await response.json();
    
    if (data.url) {
      window.location.href = data.url;
    } else {
      console.error('No checkout URL returned');
      alert('Unable to process payment. Please try again.');
    }
  } catch (error) {
    console.error('Checkout error:', error);
    alert('Unable to process payment. Please try again.');
  }
}

