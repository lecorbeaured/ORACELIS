/**
 * ORACELIS Stripe Integration
 * 
 * ENVIRONMENT TOGGLE
 * Set to 'test' for testing, 'live' for production
 */
const STRIPE_ENV = 'test'; // Change to 'live' for production

const STRIPE_CONFIG = {
  test: {
    publishableKey: 'pk_test_51Pc8WRJhzVL29jxA6G1cOzTiWaa0jdbWyIBtIcgv6Xut6W3x9UBQJczrGSptVHmayr3juYYFfqRuUd92I1in0LS000LOVmxOyG', // Replace with your test key
  },
  live: {
    publishableKey: 'pk_live_51Pc8WRJhzVL29jxApt2VuvLRrvlNvdJV1mb1VKbwj3rWvwYnVvCWQl1YLOVTYYMhRO71sd3i33zcS0KOYY0xYjfQ00pr79dNqn', // Replace with your live key
  }
};

// Get current config based on environment
const stripeConfig = STRIPE_CONFIG[STRIPE_ENV];

// Log environment (remove in production if desired)
console.log(`💳 Stripe running in ${STRIPE_ENV.toUpperCase()} mode`);

const PRICING = {
  tier1: { name: 'Insight Overview', price: 29 },
  tier2: { name: 'Complete Reading', price: 49 },
  upgrade: { name: 'Upgrade to Complete', price: 20 }
};

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

