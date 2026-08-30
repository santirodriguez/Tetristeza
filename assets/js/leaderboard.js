(() => {
  'use strict';

  function loadScript(src) {
    const script = document.createElement('script');
    script.src = src;
    script.async = false;
    document.head.appendChild(script);
  }

  loadScript('assets/js/display.js');
  loadScript('assets/js/leaderboard-core.js');
})();
