/* ════════════════════════════════════════════════════════════════
   MOTION LAYER — the entrances are pure CSS (reliable, compositor
   driven; see polish.css @keyframes under `.js-anim` / `.anim-enter`).
   This script only:
     1. toggles `.anim-enter` on the active page so its CSS entrance
        replays on every navigation,
     2. runs one anime.js count-up for the periodic-table readout,
     3. guarantees nothing stays hidden (drops `.js-anim` after load).
   All of it is skipped under reduced motion.
   ════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var root   = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var anime  = window.anime;

  if (reduce) { root.classList.remove('js-anim'); return; }

  // Replay a page's CSS entrance by re-adding the trigger class.
  function markEnter(page) {
    var el = document.getElementById('page-' + page);
    if (!el) return;
    el.classList.remove('anim-enter');
    void el.offsetWidth;                 // force reflow so animations restart
    el.classList.add('anim-enter');
    window.setTimeout(function () { el.classList.remove('anim-enter'); }, 1100);
  }

  // Count-up for the readout. Safe: if anime never ticks, the number
  // simply stays as rendered (update is never called).
  var counted = false;
  function countReadout() {
    if (counted || !anime) return;
    var el = document.getElementById('pt-num');
    if (!el) return;
    var target = parseInt(el.textContent, 10);
    if (isNaN(target)) return;
    counted = true;
    var obj = { v: 0 };
    try {
      anime({
        targets: obj, v: target, round: 1,
        duration: 1150, easing: 'easeOutExpo', delay: 300,
        update: function () { el.textContent = obj.v; },
        complete: function () { el.textContent = target; }
      });
    } catch (e) { el.textContent = target; }
  }

  // Wrap navigate() so each page change replays its entrance.
  var lastPage = null;
  if (typeof window.navigate === 'function') {
    var _navigate = window.navigate;
    window.navigate = function (page, mineralName) {
      var mineralChanged = page === 'mineral' &&
        window.AppState && mineralName && mineralName !== window.AppState.selectedMineral;
      var changed = page !== lastPage || mineralChanged;
      var result = _navigate.apply(this, arguments);
      lastPage = page;
      if (changed) {
        if (page !== 'overview') markEnter(page);   // overview hero/grid animate via .js-anim on load
        if (page === 'overview') countReadout();
      }
      return result;
    };
  }

  function boot() {
    var ov = document.getElementById('page-overview');
    if (ov && ov.classList.contains('active')) { lastPage = 'overview'; countReadout(); }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();

  // Failsafe: never keep content hidden.
  window.addEventListener('load', function () {
    setTimeout(function () { root.classList.remove('js-anim'); }, 2600);
  });
})();
