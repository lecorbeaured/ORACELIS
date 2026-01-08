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

