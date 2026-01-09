/**
 * ORACELIS Paginated Reading
 * Handles page navigation, tier gating, printing
 */

let currentPage = 0;
let pages = [];
let userTier = 'free';
let userName = 'Seeker';
let northNode = '';
let southNode = '';

document.addEventListener('DOMContentLoaded', function() {
  createStarField();
  loadReading();
  setupEventListeners();
  setupExitIntent();
});

function createStarField() {
  const c = document.getElementById('starfield');
  if (!c) return;
  for (let i = 0; i < 40; i++) {
    const s = document.createElement('div');
    s.className = 'star';
    s.style.left = `${Math.random()*100}%`;
    s.style.top = `${Math.random()*100}%`;
    s.style.width = `${Math.random()*2+1}px`;
    s.style.height = s.style.width;
    s.style.setProperty('--opacity', Math.random()*0.5+0.2);
    s.style.setProperty('--duration', `${Math.random()*3+2}s`);
    s.style.setProperty('--delay', `${Math.random()*5}s`);
    c.appendChild(s);
  }
}

async function loadReading() {
  const params = new URLSearchParams(window.location.search);
  const token = params.get('token');
  
  // If we have a token, verify it server-side
  if (token) {
    try {
      const response = await fetch('/api/verify-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
      });
      
      const data = await response.json();
      
      if (data.valid) {
        userName = data.name || 'Seeker';
        userTier = data.tier || 'free';
        const dob = data.dob;
        const version = parseInt(data.version) || getRandomVersion();
        
        // Store for potential upgrades
        window.readingUserData = { name: userName, dob, version };
        
        return initializeReading(dob, version);
      }
    } catch (e) {
      console.error('Token verification failed:', e);
    }
  }
  
  // Fallback to URL params (free tier or local testing)
  userName = params.get('name') || 'Seeker';
  const dob = params.get('dob');
  userTier = params.get('tier') || 'free';
  const version = parseInt(params.get('v')) || getRandomVersion();
  
  // Store for potential upgrades
  window.readingUserData = { name: userName, dob, version };
  
  if (!dob) {
    showError('Missing birth date');
    return;
  }
  
  initializeReading(dob, version);
}

function initializeReading(dob, version) {
  if (!dob) {
    showError('Missing birth date');
    return;
  }
  
  // Calculate which reading to show (internally uses nodes, but user never sees this)
  const nodes = calculateNodes(dob);
  if (!nodes) {
    showError('Could not generate your reading');
    return;
  }
  
  // Get reading content
  const reading = getNodeReading(nodes.northNode, version);
  if (!reading || !reading.pages || reading.pages.length === 0) {
    const fallbackReading = getNodeReading('gemini', version);
    if (fallbackReading && fallbackReading.pages.length > 0) {
      pages = fallbackReading.pages;
    } else {
      showError('Reading not available');
      return;
    }
  } else {
    pages = reading.pages;
  }
  
  // Personalize content
  pages = pages.map(page => ({
    ...page,
    content: page.content.replace(/{NAME}/g, userName)
  }));
  
  // Setup UI
  document.getElementById('node-badge').textContent = `Your Personal Reading`;
  document.getElementById('print-name').textContent = userName;
  
  // Build progress dots
  buildProgressDots();
  
  // Build print content
  buildPrintContent();
  
  // Show modal
  document.getElementById('loading').style.display = 'none';
  document.getElementById('reading-modal').style.display = 'flex';
  
  // Show first page
  showPage(0);
  
  // Track
  if (typeof trackReadingView === 'function') {
    trackReadingView(userTier, 'reading');
  }
}

function buildProgressDots() {
  const container = document.getElementById('progress-dots');
  container.innerHTML = '';
  
  pages.forEach((page, i) => {
    const dot = document.createElement('button');
    dot.className = 'progress-dot';
    dot.setAttribute('aria-label', `Page ${i + 1}: ${page.title}`);
    
    // Check if locked
    const isLocked = isPageLocked(page.tier);
    if (isLocked) {
      dot.classList.add('locked');
    }
    
    dot.addEventListener('click', () => {
      if (!isLocked) {
        showPage(i);
      }
    });
    
    container.appendChild(dot);
  });
}

function buildPrintContent() {
  const container = document.getElementById('print-content');
  let html = '';
  
  pages.forEach(page => {
    // Only include pages the user has access to
    if (!isPageLocked(page.tier)) {
      html += `
        <div class="print-content-section">
          <h3>${page.title}</h3>
          ${formatContent(page.content)}
        </div>
      `;
    }
  });
  
  container.innerHTML = html;
}

function showPage(index) {
  if (index < 0 || index >= pages.length) return;
  
  currentPage = index;
  const page = pages[index];
  const isLocked = isPageLocked(page.tier);
  
  // Update page indicator
  document.getElementById('page-indicator').textContent = `${index + 1} of ${pages.length}`;
  document.getElementById('page-title').textContent = page.title;
  
  // Track page view
  if (typeof trackReadingPage === 'function') trackReadingPage(index + 1, page.title);
  
  // Update content
  const contentEl = document.getElementById('page-content');
  contentEl.innerHTML = formatContent(page.content);
  
  // Scroll to top of content
  document.querySelector('.reading-content-area').scrollTop = 0;
  
  // Handle locked state
  const lockedOverlay = document.getElementById('locked-overlay');
  if (isLocked) {
    lockedOverlay.style.display = 'flex';
    updateLockedUI(page.tier);
    // Track paywall view
    if (typeof trackPaywallView === 'function') trackPaywallView(page.tier);
  } else {
    lockedOverlay.style.display = 'none';
  }
  
  // Update progress dots
  document.querySelectorAll('.progress-dot').forEach((dot, i) => {
    dot.classList.remove('active', 'completed');
    if (i === currentPage) {
      dot.classList.add('active');
    } else if (i < currentPage && !isPageLocked(pages[i].tier)) {
      dot.classList.add('completed');
    }
  });
  
  // Update nav buttons
  document.getElementById('prev-btn').disabled = currentPage === 0;
  
  const nextBtn = document.getElementById('next-btn');
  if (currentPage === pages.length - 1) {
    nextBtn.innerHTML = '🖨️ Print Reading';
  } else {
    nextBtn.innerHTML = 'Next <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>';
  }
}

function isPageLocked(tier) {
  if (tier === 'free') return false;
  if (tier === 'tier1' && (userTier === 'tier1' || userTier === 'tier2')) return false;
  if (tier === 'tier2' && userTier === 'tier2') return false;
  return true;
}

function updateLockedUI(requiredTier) {
  const titleEl = document.getElementById('locked-title');
  const descEl = document.getElementById('locked-description');
  const pricingEl = document.getElementById('locked-pricing');
  
  if (requiredTier === 'tier1') {
    titleEl.textContent = 'Continue Your Reading';
    descEl.textContent = 'Discover how to work with your patterns.';
    
    pricingEl.innerHTML = `
      <div class="pricing-option">
        <div class="pricing-option-header">
          <span class="pricing-option-name">Insight</span>
          <span class="pricing-option-price">$29</span>
        </div>
        <ul class="pricing-option-features">
          <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>Your hidden strengths</li>
          <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>What keeps you stuck</li>
          <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>Action steps</li>
        </ul>
        <button class="btn btn-secondary unlock-btn" onclick="handleUpgrade('tier1')">Unlock $29</button>
      </div>
      
      <div class="pricing-option recommended">
        <div class="pricing-option-header">
          <span class="pricing-option-name">Complete</span>
          <span class="pricing-option-price">$49</span>
        </div>
        <ul class="pricing-option-features">
          <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>Everything above</li>
          <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>Success code</li>
          <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>Blessing blockers</li>
          <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>Alignment mantra</li>
        </ul>
        <button class="btn btn-primary unlock-btn" onclick="handleUpgrade('tier2')">Get Complete</button>
      </div>
      
      <button class="maybe-later-btn" onclick="handleMaybeLater()">Maybe Later</button>
    `;
  } else if (requiredTier === 'tier2') {
    titleEl.textContent = 'Unlock Your Success Code';
    descEl.textContent = 'Get the complete picture.';
    
    pricingEl.innerHTML = `
      <div class="pricing-option recommended">
        <div class="pricing-option-header">
          <span class="pricing-option-name">Upgrade</span>
          <span class="pricing-option-price">$20</span>
        </div>
        <ul class="pricing-option-features">
          <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>Success code</li>
          <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>Blessing blockers</li>
          <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>Alignment mantra</li>
        </ul>
        <button class="btn btn-primary unlock-btn" onclick="handleUpgrade('upgrade')">Unlock $20</button>
      </div>
      
      <button class="maybe-later-btn" onclick="handleMaybeLater()">Maybe Later</button>
    `;
  }
}

function handleMaybeLater() {
  // Track the decline
  if (typeof gtag === 'function') {
    gtag('event', 'paywall_declined', { event_category: 'conversion', tier: userTier });
  }
  
  // Find last free page
  let lastFreePage = 0;
  for (let i = 0; i < pages.length; i++) {
    if (pages[i].tier === 'free') {
      lastFreePage = i;
    } else if (pages[i].tier === 'tier1' && userTier === 'tier1') {
      lastFreePage = i;
    } else {
      break;
    }
  }
  
  showPage(lastFreePage);
}

function handleUpgrade(tier) {
  if (typeof trackUpgradeClick === 'function') {
    trackUpgradeClick(tier, 'reading_modal');
  }
  if (typeof openCheckout === 'function') {
    openCheckout(tier);
  }
}

function formatContent(text) {
  // Convert line breaks to paragraphs
  let html = text
    .split('\n\n')
    .map(p => {
      // Check for bullet points
      if (p.includes('•')) {
        const lines = p.split('\n');
        const bullets = lines.filter(l => l.trim().startsWith('•'));
        const nonBullets = lines.filter(l => !l.trim().startsWith('•'));
        
        let result = '';
        if (nonBullets.length > 0) {
          result += `<p>${nonBullets.join(' ')}</p>`;
        }
        if (bullets.length > 0) {
          result += '<ul>' + bullets.map(b => `<li>${b.replace('•', '').trim()}</li>`).join('') + '</ul>';
        }
        return result;
      }
      return `<p>${p.replace(/\n/g, '<br>')}</p>`;
    })
    .join('');
  
  // Bold text between **
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  
  return html;
}

function setupEventListeners() {
  // Navigation
  document.getElementById('prev-btn').addEventListener('click', () => {
    if (currentPage > 0) {
      showPage(currentPage - 1);
    }
  });
  
  document.getElementById('next-btn').addEventListener('click', () => {
    if (currentPage < pages.length - 1) {
      const nextPage = pages[currentPage + 1];
      showPage(currentPage + 1);
    } else {
      // Last page - print
      handlePrint();
    }
  });
  
  // Print buttons
  document.getElementById('print-btn').addEventListener('click', handlePrint);
  document.getElementById('exit-print-btn').addEventListener('click', () => {
    document.getElementById('exit-popup').style.display = 'none';
    handlePrint();
  });
  document.getElementById('exit-close-btn').addEventListener('click', () => {
    window.location.href = 'index.html';
  });
  
  // Keyboard navigation
  document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft' && currentPage > 0) {
      showPage(currentPage - 1);
    } else if (e.key === 'ArrowRight' && currentPage < pages.length - 1) {
      showPage(currentPage + 1);
    }
  });
}

function setupExitIntent() {
  let hasShownPopup = false;
  
  document.addEventListener('mouseout', (e) => {
    if (e.clientY < 10 && !hasShownPopup) {
      hasShownPopup = true;
      document.getElementById('exit-popup').style.display = 'flex';
      if (typeof trackExitIntent === 'function') trackExitIntent();
    }
  });
  
  // Also show on window blur (mobile/tab switch)
  window.addEventListener('blur', () => {
    if (!hasShownPopup) {
      hasShownPopup = true;
      setTimeout(() => {
        document.getElementById('exit-popup').style.display = 'flex';
        if (typeof trackExitIntent === 'function') trackExitIntent();
      }, 500);
    }
  });
}

function handlePrint() {
  if (typeof trackPrintClick === 'function') {
    trackPrintClick();
  }
  
  // Populate print view with accessible content
  const printContent = document.getElementById('print-content');
  const printName = document.getElementById('print-name');
  
  // Set user name
  printName.textContent = userName || 'Seeker';
  
  // Build print content from all accessible pages
  let html = '';
  pages.forEach((page, index) => {
    // Only include pages user has access to
    const canAccess = page.tier === 'free' || 
                      (page.tier === 'tier1' && (userTier === 'tier1' || userTier === 'tier2')) ||
                      (page.tier === 'tier2' && userTier === 'tier2');
    
    if (canAccess) {
      const content = page.content.replace(/{NAME}/g, userName || 'Seeker');
      // Convert markdown-style formatting to HTML
      const formattedContent = formatContent(content);
      
      html += `
        <div class="print-content-section">
          <h3>${page.title}</h3>
          <div>${formattedContent}</div>
        </div>
      `;
    }
  });
  
  printContent.innerHTML = html;
  
  // Trigger print
  window.print();
}

function showError(message) {
  document.getElementById('loading').innerHTML = `
    <p style="color: var(--aurora-pink);">${message}</p>
    <p><a href="index.html" style="color: var(--gold-shimmer);">Return to home</a></p>
  `;
}
