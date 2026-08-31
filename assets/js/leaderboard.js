(() => {
  'use strict';

  function loadScript(src, onload) {
    const script = document.createElement('script');
    script.src = src;
    if (onload) script.addEventListener('load', onload, {once: true});
    document.head.appendChild(script);
  }

  loadScript('assets/js/leaderboard-core.js', () => {
    loadScript('assets/js/display.js');
  });
})();