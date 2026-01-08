/**
 * ORACELIS Analytics
 * GA4 event tracking for funnel analysis
 */

// Track page views
function trackPageView(pageName) {
  if (typeof gtag === 'function') {
    gtag('event', 'page_view', {
      page_title: pageName,
      page_location: window.location.href
    });
  }
}

// Track form start
function trackFormStart() {
  if (typeof gtag === 'function') {
    gtag('event', 'form_start', {
      event_category: 'engagement',
      event_label: 'reading_form'
    });
  }
}

// Track form submission
function trackFormSubmit(hasTime) {
  if (typeof gtag === 'function') {
    gtag('event', 'generate_lead', {
      event_category: 'conversion',
      event_label: 'reading_requested',
      has_birth_time: hasTime
    });
  }
}

// Track reading view
function trackReadingView(tier, readingType) {
  if (typeof gtag === 'function') {
    gtag('event', 'view_item', {
      event_category: 'engagement',
      tier: tier,
      reading_type: readingType
    });
  }
}

// Track page navigation within reading
function trackReadingPage(pageNumber, pageTitle) {
  if (typeof gtag === 'function') {
    gtag('event', 'reading_progress', {
      event_category: 'engagement',
      page_number: pageNumber,
      page_title: pageTitle
    });
  }
}

// Track paywall view
function trackPaywallView(requiredTier) {
  if (typeof gtag === 'function') {
    gtag('event', 'paywall_view', {
      event_category: 'conversion',
      required_tier: requiredTier
    });
  }
}

// Track upgrade click
function trackUpgradeClick(tier, location) {
  if (typeof gtag === 'function') {
    gtag('event', 'begin_checkout', {
      event_category: 'conversion',
      tier: tier,
      value: tier === 'tier1' ? 29 : tier === 'tier2' ? 49 : 20,
      currency: 'USD',
      location: location
    });
  }
}

// Track paywall declined
function trackPaywallDeclined(tier) {
  if (typeof gtag === 'function') {
    gtag('event', 'paywall_declined', {
      event_category: 'conversion',
      tier: tier
    });
  }
}

// Track purchase
function trackPurchase(tier, transactionId) {
  if (typeof gtag === 'function') {
    const value = tier === 'tier1' ? 29 : tier === 'tier2' ? 49 : 20;
    gtag('event', 'purchase', {
      transaction_id: transactionId,
      value: value,
      currency: 'USD',
      items: [{ item_name: tier, price: value }]
    });
  }
}

// Track print click
function trackPrintClick() {
  if (typeof gtag === 'function') {
    gtag('event', 'print_reading', {
      event_category: 'engagement'
    });
  }
}

// Track exit intent
function trackExitIntent() {
  if (typeof gtag === 'function') {
    gtag('event', 'exit_intent', {
      event_category: 'engagement'
    });
  }
}

// Scroll depth tracking
function initScrollTracking() {
  let tracked = [];
  window.addEventListener('scroll', function() {
    const percent = Math.round((window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100);
    [25, 50, 75, 100].forEach(mark => {
      if (percent >= mark && !tracked.includes(mark)) {
        tracked.push(mark);
        if (typeof gtag === 'function') {
          gtag('event', 'scroll', { event_category: 'engagement', depth: mark });
        }
      }
    });
  });
}

// Time on page tracking
function initTimeTracking() {
  [30, 60, 120, 300].forEach(seconds => {
    setTimeout(() => {
      if (typeof gtag === 'function') {
        gtag('event', 'time_on_page', { event_category: 'engagement', seconds: seconds });
      }
    }, seconds * 1000);
  });
}

// CTA click tracking
function trackCTAClick(buttonName) {
  if (typeof gtag === 'function') {
    gtag('event', 'cta_click', { event_category: 'engagement', button: buttonName });
  }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
  initScrollTracking();
  initTimeTracking();
});
