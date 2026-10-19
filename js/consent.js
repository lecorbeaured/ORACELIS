/**
 * ORACELIS cookie consent (Google Consent Mode v2)
 * Load BEFORE the gtag.js script. Visitors in the EEA, UK and Switzerland are
 * denied analytics storage until they accept; everyone else is granted by default
 * and can decline from the banner. The choice is remembered in localStorage.
 */
(function () {
  var KEY = 'oracelis_consent';
  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  window.gtag = window.gtag || gtag;

  function read() { try { return localStorage.getItem(KEY); } catch (e) { return null; } }
  function write(v) { try { localStorage.setItem(KEY, v); } catch (e) {} }
  function state(v) {
    return { analytics_storage: v, ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' };
  }

  var saved = read();
  var regions = ['AT','BE','BG','HR','CY','CZ','DK','EE','FI','FR','DE','GR','HU','IE','IT','LV','LT','LU','MT','NL','PL','PT','RO','SK','SI','ES','SE','IS','LI','NO','GB','CH'];
  gtag('consent', 'default', Object.assign(state('denied'), { region: regions, wait_for_update: 500 }));
  gtag('consent', 'default', state(saved === 'accepted' ? 'granted' : saved === 'declined' ? 'denied' : 'granted'));
  if (saved === 'accepted') gtag('consent', 'update', state('granted'));
  if (saved === 'declined') gtag('consent', 'update', state('denied'));

  function css() {
    var s = document.createElement('style');
    s.textContent =
      '#oc-consent{position:fixed;left:16px;right:16px;bottom:16px;z-index:99999;max-width:560px;margin:0 auto;' +
      'background:rgba(14,10,30,.97);color:#f0f0ff;border:1px solid rgba(255,200,90,.45);border-radius:14px;' +
      'padding:16px 18px;box-shadow:0 8px 40px rgba(0,0,0,.6);font:14px/1.55 system-ui,-apple-system,Segoe UI,sans-serif}' +
      '#oc-consent p{margin:0 0 12px}#oc-consent a,#oc-consent button.oc-link{color:#ffc65a;background:none;border:0;padding:0;font:inherit;text-decoration:underline;cursor:pointer}' +
      '#oc-consent .oc-row{display:flex;gap:10px;flex-wrap:wrap}' +
      '#oc-consent .oc-btn{flex:1 1 120px;padding:10px 14px;border-radius:999px;font:600 14px system-ui,sans-serif;cursor:pointer;border:1px solid #ffc65a}' +
      '#oc-consent .oc-yes{background:linear-gradient(135deg,#ffd77a,#e8a21c);color:#1a1205}' +
      '#oc-consent .oc-no{background:transparent;color:#ffc65a}';
    document.head.appendChild(s);
  }

  function show() {
    if (read() || document.getElementById('oc-consent')) return;
    css();
    var d = document.createElement('div');
    d.id = 'oc-consent'; d.setAttribute('role', 'dialog'); d.setAttribute('aria-label', 'Cookie consent');
    var more = typeof window.openModal === 'function' ? ' <button type="button" class="oc-link" id="oc-more">Privacy Policy</button>' : '';
    d.innerHTML = '<p>We use cookies for anonymous analytics to understand how ORACELIS is used and improve it. No advertising cookies.' + more + '</p>' +
      '<div class="oc-row"><button type="button" class="oc-btn oc-no" id="oc-no">Decline</button>' +
      '<button type="button" class="oc-btn oc-yes" id="oc-yes">Accept</button></div>';
    document.body.appendChild(d);
    function choose(v) {
      write(v); gtag('consent', 'update', state(v === 'accepted' ? 'granted' : 'denied'));
      d.parentNode && d.parentNode.removeChild(d);
    }
    document.getElementById('oc-yes').onclick = function () { choose('accepted'); };
    document.getElementById('oc-no').onclick = function () { choose('declined'); };
    var m = document.getElementById('oc-more');
    if (m) m.onclick = function () { window.openModal('privacy'); };
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', show); else show();
})();
