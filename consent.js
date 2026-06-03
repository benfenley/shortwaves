/* consent.js — Google Consent Mode v2 + Meta Pixel + outbound-click tracking.
 *
 * Approach:
 *   - Google Analytics 4 (gtag.js) is ALWAYS loaded so it can send cookieless
 *     pings under Consent Mode v2. Default consent state is:
 *       • EU + no decision yet → denied (banner shown)
 *       • EU + user previously declined → denied (no banner)
 *       • EU + user previously accepted → granted (no banner)
 *       • Non-EU → granted (no banner)
 *     When the user clicks Accept, we update consent → granted, which
 *     unlocks regular GA tracking with cookies.
 *
 *   - Meta Pixel is binary: it does NOT have a real consent-mode equivalent
 *     in the EU. We only load it after a "granted" decision. Visitors who
 *     decline never get Pixel.
 *
 *   - Outbound clicks (substack/litres/telegram) are mirrored
 *     to both fbq trackCustom and gtag('event','outbound_click', …).
 */
(function () {
  var PIXEL_ID = '1323897889151084';
  var GA_ID    = 'G-40QGHVQLRK';
  var STORAGE_KEY = 'sw_consent_pixel';

  var GRANTED = {
    ad_storage:          'granted',
    ad_user_data:        'granted',
    ad_personalization:  'granted',
    analytics_storage:   'granted',
  };
  var DENIED = {
    ad_storage:          'denied',
    ad_user_data:        'denied',
    ad_personalization:  'denied',
    analytics_storage:   'denied',
    wait_for_update:     500, // give the user 500ms to click before pings fire
  };

  function getStored() {
    try { return localStorage.getItem(STORAGE_KEY); } catch (e) { return null; }
  }
  function setStored(v) {
    try { localStorage.setItem(STORAGE_KEY, v); } catch (e) {}
  }

  function isLikelyEU() {
    try {
      var tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
      if (tz.indexOf('Europe/') === 0) return true;
      if (tz === 'Atlantic/Reykjavik') return true;
      if (tz === 'Atlantic/Faroe') return true;
      if (tz === 'Atlantic/Madeira') return true;
      if (tz === 'Atlantic/Azores') return true;
      if (tz === 'Atlantic/Canary') return true;
      return false;
    } catch (e) { return false; }
  }

  function initGA(defaultConsent) {
    if (window.__swGAInited) return;
    window.__swGAInited = true;
    window.dataLayer = window.dataLayer || [];
    function gtag() { window.dataLayer.push(arguments); }
    window.gtag = gtag;
    // Consent default MUST be set before any other gtag calls.
    gtag('consent', 'default', defaultConsent);
    gtag('js', new Date());
    gtag('config', GA_ID);
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
    document.head.appendChild(s);
  }

  function updateGAConsent(state) {
    if (window.gtag) {
      try { window.gtag('consent', 'update', state); } catch (e) {}
    }
  }

  function initPixel() {
    if (window.fbq) return;
    /* eslint-disable */
    !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
    n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
    n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
    t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
    document,'script','https://connect.facebook.net/en_US/fbevents.js');
    /* eslint-enable */
    window.fbq('init', PIXEL_ID);
    window.fbq('track', 'PageView');
  }

  function attachClickTracking() {
    document.addEventListener('click', function (e) {
      var a = e.target && e.target.closest && e.target.closest('a[href]');
      if (!a) return;
      var href = a.getAttribute('href') || '';
      var provider = null;
      if (/substack\.com/i.test(href)) provider = 'substack';
      else if (/litres\.ru/i.test(href)) provider = 'litres';
      else if (/(^|\/\/)t\.me\//i.test(href) || /telegram\.me/i.test(href)) provider = 'telegram';
      if (!provider) return;
      var pixelName = 'Click' + provider.split('_').map(function (s) {
        return s[0].toUpperCase() + s.slice(1);
      }).join('');
      if (window.fbq) {
        try { window.fbq('trackCustom', pixelName, { href: href }); } catch (err) {}
      }
      if (window.gtag) {
        try { window.gtag('event', 'outbound_click', { provider: provider, href: href }); } catch (err) {}
      }
    }, true);
  }

  function showBanner() {
    if (document.querySelector('.sw-consent')) return;
    var lang = (document.documentElement.lang || 'ru').toLowerCase();
    var EN = lang.indexOf('en') === 0;
    var STR = EN ? {
      msg: 'We use cookies for anonymous analytics.',
      accept: 'Accept',
      decline: 'Decline',
    } : {
      msg: 'Мы используем cookie для анонимной аналитики.',
      accept: 'Принять',
      decline: 'Отклонить',
    };
    var el = document.createElement('div');
    el.className = 'sw-consent';
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-label', EN ? 'Cookie consent' : 'Согласие на куки');
    el.innerHTML =
      '<div class="sw-consent__inner">' +
      '  <p class="sw-consent__msg"></p>' +
      '  <div class="sw-consent__btns">' +
      '    <button type="button" class="sw-consent__btn sw-consent__btn--decline"></button>' +
      '    <button type="button" class="sw-consent__btn sw-consent__btn--accept"></button>' +
      '  </div>' +
      '</div>';
    el.querySelector('.sw-consent__msg').textContent = STR.msg;
    el.querySelector('.sw-consent__btn--accept').textContent = STR.accept;
    el.querySelector('.sw-consent__btn--decline').textContent = STR.decline;
    document.body.appendChild(el);
    el.querySelector('.sw-consent__btn--accept').addEventListener('click', function () {
      setStored('granted');
      el.parentNode && el.parentNode.removeChild(el);
      updateGAConsent(GRANTED);
      initPixel();
    });
    el.querySelector('.sw-consent__btn--decline').addEventListener('click', function () {
      setStored('denied');
      el.parentNode && el.parentNode.removeChild(el);
      // GA stays loaded but in denied state — cookieless pings only.
    });
  }

  function boot() {
    attachClickTracking();
    var stored = getStored();

    if (stored === 'granted') {
      initGA(GRANTED);
      initPixel();
      return;
    }
    if (stored === 'denied') {
      initGA(DENIED); // cookieless pings only
      return;
    }
    // First visit, no stored decision.
    if (!isLikelyEU()) {
      initGA(GRANTED);
      initPixel();
      return;
    }
    // EU first visit — show banner, default denied.
    initGA(DENIED);
    if (document.body) showBanner();
    else document.addEventListener('DOMContentLoaded', showBanner);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
