/**
 * ORACELIS Main Landing Page JavaScript
 */

// Rate Limiting Configuration
const RATE_LIMIT = {
  maxReadings: 5,        // Max free readings per day
  windowMs: 24 * 60 * 60 * 1000,  // 24 hours
  storageKey: 'oracelis_readings'
};

// Simple browser fingerprint (not bulletproof but deters casual abuse)
function getDeviceId() {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  ctx.textBaseline = 'top';
  ctx.font = '14px Arial';
  ctx.fillText('ORACELIS', 2, 2);
  const canvasData = canvas.toDataURL();
  
  const data = [
    navigator.userAgent,
    navigator.language,
    screen.width + 'x' + screen.height,
    new Date().getTimezoneOffset(),
    canvasData.slice(-50)
  ].join('|');
  
  // Simple hash
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return 'dev_' + Math.abs(hash).toString(36);
}

// Check and update rate limit
function checkReadingRateLimit() {
  const deviceId = getDeviceId();
  const now = Date.now();
  
  try {
    const stored = localStorage.getItem(RATE_LIMIT.storageKey);
    let data = stored ? JSON.parse(stored) : {};
    
    // Clean up old entries
    if (data.deviceId !== deviceId || (now - data.windowStart) > RATE_LIMIT.windowMs) {
      data = { deviceId, windowStart: now, count: 0 };
    }
    
    // Check limit
    if (data.count >= RATE_LIMIT.maxReadings) {
      const resetTime = new Date(data.windowStart + RATE_LIMIT.windowMs);
      const hoursLeft = Math.ceil((resetTime - now) / (60 * 60 * 1000));
      return { 
        allowed: false, 
        message: `You've reached the limit of ${RATE_LIMIT.maxReadings} free readings. Try again in ${hoursLeft} hour${hoursLeft > 1 ? 's' : ''}.`,
        remaining: 0
      };
    }
    
    return { allowed: true, remaining: RATE_LIMIT.maxReadings - data.count };
  } catch (e) {
    // If localStorage fails, allow the reading
    return { allowed: true, remaining: RATE_LIMIT.maxReadings };
  }
}

// Record a reading
function recordReading() {
  const deviceId = getDeviceId();
  const now = Date.now();
  
  try {
    const stored = localStorage.getItem(RATE_LIMIT.storageKey);
    let data = stored ? JSON.parse(stored) : {};
    
    // Reset if new window or new device
    if (data.deviceId !== deviceId || (now - data.windowStart) > RATE_LIMIT.windowMs) {
      data = { deviceId, windowStart: now, count: 0 };
    }
    
    data.count++;
    localStorage.setItem(RATE_LIMIT.storageKey, JSON.stringify(data));
  } catch (e) {
    // Silently fail if localStorage is unavailable
  }
}

document.addEventListener('DOMContentLoaded', function() {
  createStarField();
  initForm();
  initCarousel();
  
  const ctaButton = document.querySelector('.hero-cta');
  if (ctaButton) {
    ctaButton.addEventListener('click', function() {
      if (typeof trackCTAClick === 'function') trackCTAClick('hero_cta');
      document.getElementById('reading-form')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  }
});

function createStarField() {
  const container = document.getElementById('starfield');
  if (!container) return;
  for (let i = 0; i < 80; i++) {
    const star = document.createElement('div');
    star.className = 'star';
    star.style.left = `${Math.random() * 100}%`;
    star.style.top = `${Math.random() * 100}%`;
    star.style.width = `${Math.random() * 2 + 1}px`;
    star.style.height = star.style.width;
    star.style.setProperty('--opacity', Math.random() * 0.5 + 0.2);
    star.style.setProperty('--duration', `${Math.random() * 3 + 2}s`);
    star.style.setProperty('--delay', `${Math.random() * 5}s`);
    container.appendChild(star);
  }
}

// Carousel
let currentSlide = 0;
const totalSlides = 5;

function initCarousel() {
  const dotsContainer = document.getElementById('carousel-dots');
  if (!dotsContainer) return;
  
  for (let i = 0; i < totalSlides; i++) {
    const dot = document.createElement('button');
    dot.className = 'carousel-dot' + (i === 0 ? ' active' : '');
    dot.addEventListener('click', () => goToSlide(i));
    dotsContainer.appendChild(dot);
  }
  
  document.getElementById('prev-btn')?.addEventListener('click', () => goToSlide(currentSlide - 1));
  document.getElementById('next-btn')?.addEventListener('click', () => goToSlide(currentSlide + 1));
  
  // Auto-advance
  setInterval(() => goToSlide(currentSlide + 1), 6000);
}

function goToSlide(n) {
  currentSlide = (n + totalSlides) % totalSlides;
  const slides = document.getElementById('testimonial-slides');
  if (slides) slides.style.transform = `translateX(-${currentSlide * 100}%)`;
  
  document.querySelectorAll('.carousel-dot').forEach((dot, i) => {
    dot.classList.toggle('active', i === currentSlide);
  });
}

// Form
function initForm() {
  const form = document.getElementById('birth-form');
  if (!form) return;
  
  // Track form start on first interaction
  let formStarted = false;
  form.querySelectorAll('input').forEach(input => {
    input.addEventListener('focus', function() {
      if (!formStarted) {
        formStarted = true;
        if (typeof trackFormStart === 'function') trackFormStart();
      }
    });
  });
  
  form.addEventListener('submit', handleFormSubmit);
}

function handleFormSubmit(e) {
  e.preventDefault();
  const form = e.target;
  const firstName = form.querySelector('#firstName').value.trim();
  const dateOfBirth = form.querySelector('#dateOfBirth').value;
  const timeOfBirth = form.querySelector('#timeOfBirth').value;
  
  let isValid = true;
  if (!firstName) { showError('firstName', 'Please enter your first name'); isValid = false; }
  if (!dateOfBirth) { showError('dateOfBirth', 'Please enter your date of birth'); isValid = false; }
  if (!isValid) return;
  
  // Check rate limit
  const rateCheck = checkReadingRateLimit();
  if (!rateCheck.allowed) {
    showRateLimitError(rateCheck.message);
    return;
  }
  
  // Track form submission
  if (typeof trackFormSubmit === 'function') trackFormSubmit(!!timeOfBirth);
  
  // Record this reading attempt
  recordReading();
  
  const submitBtn = form.querySelector('.submit-btn');
  submitBtn.disabled = true;
  submitBtn.innerHTML = 'Preparing...<span class="loading-spinner"></span>';
  
  window.pendingReadingData = { firstName, dateOfBirth, timeOfBirth };
  showTimer();
}

function showRateLimitError(message) {
  // Remove existing rate limit error
  const existing = document.querySelector('.rate-limit-error');
  if (existing) existing.remove();
  
  const form = document.getElementById('birth-form');
  const errorDiv = document.createElement('div');
  errorDiv.className = 'rate-limit-error';
  errorDiv.innerHTML = `
    <div style="background: rgba(255, 100, 100, 0.1); border: 1px solid rgba(255, 100, 100, 0.3); border-radius: 8px; padding: 1rem; margin-bottom: 1rem; text-align: center;">
      <p style="color: #ff9999; margin: 0; font-size: 0.9rem;">${message}</p>
      <p style="color: var(--moonbeam); margin: 0.5rem 0 0; font-size: 0.8rem;">Upgrade to unlock unlimited access to your complete reading.</p>
    </div>
  `;
  form.parentElement.insertBefore(errorDiv, form);
}

function showError(inputId, message) {
  const input = document.getElementById(inputId);
  if (!input) return;
  input.classList.add('error');
  const existing = input.parentElement.querySelector('.form-error');
  if (existing) existing.remove();
  const errorEl = document.createElement('span');
  errorEl.className = 'form-error';
  errorEl.textContent = message;
  input.parentElement.appendChild(errorEl);
}

// Timer
const TIMER_DURATION = 8000;
const TIMER_PHASES = [
  { text: 'Aligning celestial energies...', icon: '✦' },
  { text: 'Reading your soul signature...', icon: '◈' },
  { text: 'Channeling ancient wisdom...', icon: '⬡' },
  { text: 'Weaving your personal narrative...', icon: '✧' },
  { text: 'Revealing your truth...', icon: '◉' },
];

let timerInterval, particleInterval, currentPhase = -1;

function showTimer() {
  const overlay = document.getElementById('timer-overlay');
  if (!overlay) return;
  overlay.classList.add('active');
  
  const startTime = Date.now();
  timerInterval = setInterval(() => {
    const progress = Math.min((Date.now() - startTime) / TIMER_DURATION, 1);
    updateTimerProgress(progress);
    const phaseIndex = Math.min(Math.floor(progress * TIMER_PHASES.length), TIMER_PHASES.length - 1);
    if (phaseIndex !== currentPhase) {
      currentPhase = phaseIndex;
      const phase = TIMER_PHASES[phaseIndex];
      document.querySelector('.timer-phase-icon').textContent = phase.icon;
      document.querySelector('.timer-phase-text').textContent = phase.text;
    }
    if (progress >= 1) {
      clearInterval(timerInterval);
      clearInterval(particleInterval);
      setTimeout(() => { openReading(); hideTimer(); }, 500);
    }
  }, 50);
  
  particleInterval = setInterval(createParticle, 200);
}

function updateTimerProgress(progress) {
  const circle = document.querySelector('.timer-ring-progress');
  if (circle) circle.style.strokeDashoffset = 565.48 * (1 - progress);
  const pct = document.querySelector('.timer-percentage');
  if (pct) pct.textContent = `${Math.round(progress * 100)}%`;
  const fill = document.querySelector('.timer-progress-fill');
  if (fill) fill.style.width = `${progress * 100}%`;
}

function createParticle() {
  const container = document.querySelector('.timer-particles');
  if (!container) return;
  const particle = document.createElement('div');
  particle.className = 'timer-particle';
  particle.style.left = `${Math.random() * 100}%`;
  particle.style.top = `${Math.random() * 100}%`;
  particle.style.width = `${Math.random() * 4 + 2}px`;
  particle.style.height = particle.style.width;
  container.appendChild(particle);
  setTimeout(() => particle.remove(), 2000);
}

function hideTimer() {
  document.getElementById('timer-overlay')?.classList.remove('active');
  const btn = document.querySelector('.submit-btn');
  if (btn) { btn.disabled = false; btn.innerHTML = 'Reveal My Reading →'; }
  currentPhase = -1;
}

function openReading() {
  const data = window.pendingReadingData;
  if (!data) return;
  const version = Math.floor(Math.random() * 3) + 1;
  const params = new URLSearchParams({ name: data.firstName, dob: data.dateOfBirth, tier: 'free', v: version });
  const url = `reading.html?${params}`;
  const win = window.open(url, '_blank', 'width=800,height=700');
  if (win) win.focus(); else window.location.href = url;
  window.pendingReadingData = null;
}

// Back to Top Button
(function() {
  const btn = document.getElementById('back-to-top');
  if (!btn) return;
  
  // Show/hide based on scroll position
  window.addEventListener('scroll', () => {
    if (window.scrollY > 400) {
      btn.classList.add('visible');
    } else {
      btn.classList.remove('visible');
    }
  }, { passive: true });
  
  // Scroll to top on click
  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
})();
