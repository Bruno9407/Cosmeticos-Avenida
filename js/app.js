/* Cosméticos Avenida — inicialização, PWA */
(function () {
  'use strict';
  const AV = window.AV;
  AV.initStorage().then(() => {
    AV.initState();
    if (!location.hash) location.hash = '#/';
    AV.render();
    document.body.classList.add('ready');
  });
  window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); AV.ui.installEvt = e; if (AV.S.settings) AV.updateChrome(); });
  if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
    window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
  }
  window.addEventListener('resize', (() => { let t; return () => { clearTimeout(t); t = setTimeout(() => { if (!AV.route().parts[0]) AV.render({ keepScroll: true }); }, 300); }; })());
})();
