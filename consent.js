/* consent.js — Meta Pixel + EU consent gate + outbound-click tracking.
 *
 * Behaviour:
 *   - If consent stored ("granted"/"denied") in localStorage → honour it.
 *   - Else if visitor is likely in EU/EEA/UK (rough timezone heuristic) →
 *     show a small banner and wait for accept/decline.
 *   - Else → load the Pixel immediately (no banner shown).
 *
 * Pixel events:
 *   - PageView on load (after consent).
 *   - trackCustom Click{Substack|Litres|AuthorToday|Telegram} on outbound
 *     anchor clicks site-wide.
 *   - Standard Lead event when the subscribe form is submitted
 *     (fired by app.jsx Subscribe component).
 */
(function () {
  var PIXEL_ID = '1323897889151084';
  var STORAGE_KEY = 'sw_consent_pixel';

  function getStored() {
    try { return localStorage.getItem(STORAGE_KEY); } catch (e) { return null; }
  }
  function setStored(v) {
    try { localStorage.setItem(STORAGE_KEY, v); } catch (e) {}
  }

  // Rough EEA / UK / Switzerland detection by browser timezone.
  // Overinclusive (e.g. Russia, Turkey, Ukraine also fall under Europe/*),
  // which is fine — overshowing the banner is harmless.
  function isLikelyEU() {
    try {
      var tz = (Intl.DateTimeFormat().resolvedOptions().timeZone || '');
      if (tz.indexOf('Europe/') === 0) return true;
      if (tz === 'Atlantic/Reykjavik') return true;  // Iceland (EEA)
      if (tz === 'Atlantic/Faroe') return true;       // Faroes (DK)
      if (tz === 'Atlantic/Madeira') return true;     // Portugal
      if (tz === 'Atlantic/Azores') return true;      // Portugal
      if (tz === 'Atlantic/Canary') return true;      // Spain
      return false;
    } catch (e) { return false; }
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

  // Outbound-click tracking — attaches regardless of consent state; only
  // fires fbq if it's actually loaded.
  function attachClickTracking() {
    document.addEventListener('click', function (e) {
      var a = e.target && e.target.closest && e.target.closest('a[href]');
      if (!a || !window.fbq) return;
      var href = a.getAttribute('href') || '';
      var name = null;
      if (/substack\.com/i.test(href)) name = 'ClickSubstack';
      else if (/litres\.ru/i.test(href)) name = 'ClickLitres';
      else if (/author\.today/i.test(href)) name = 'ClickAuthorToday';
      else if (/(^|\/\/)t\.me\//i.test(href) || /telegram\.me/i.test(href)) name = 'ClickTelegram';
      if (name) {
        try { window.fbq('trackCustom', name, { href: href }); } catch (err) {}
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
      initPixel();
    });
    el.querySelector('.sw-consent__btn--decline').addEventListener('click', function () {
      setStored('denied');
      el.parentNode && el.parentNode.removeChild(el);
    });
  }

  // Bootstrap: decide what to do based on stored consent + region.
  function boot() {
    attachClickTracking();
    var stored = getStored();
    if (stored === 'granted') return initPixel();
    if (stored === 'denied') return;          // respect previous decline
    if (!isLikelyEU()) return initPixel();    // no banner for non-EU
    if (document.body) showBanner();
    else document.addEventListener('DOMContentLoaded', showBanner);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
