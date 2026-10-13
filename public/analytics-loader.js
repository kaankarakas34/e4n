/* Queue the existing analytics events immediately; load providers after first paint. */
(function () {
  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
  window.gtag('js', new Date());
  // GTM-TBGGZH47 already owns GA4 G-F7E2G1MSXK and Pixel 1850698832727063.
  // Boot each provider through that container once; direct initialization duplicated PageView.
  var started = false;
  function load() {
    if (started) return;
    started = true;
    window.dataLayer.push({ 'gtm.start': Date.now(), event: 'gtm.js' });
    ['https://www.googletagmanager.com/gtm.js?id=GTM-TBGGZH47'].forEach(function (src) {
      var script = document.createElement('script'); script.async = true; script.src = src; document.head.appendChild(script);
    });
  }
  window.addEventListener('pagehide', load, { once: true });
  window.addEventListener('load', function () {
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        if ('requestIdleCallback' in window) window.requestIdleCallback(load, { timeout: 3000 });
        else setTimeout(load, 1000);
      });
    });
  }, { once: true });
})();
