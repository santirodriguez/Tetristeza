(() => {
  'use strict';

  const gameCanvas = document.getElementById('game');
  const sidePanel = document.querySelector('.side-panel');
  const controlCard = sidePanel?.querySelector('.control-card');
  const controlsLegend = document.querySelector('.controls-legend');
  const mainOverlay = document.getElementById('overlay');
  const mainOverlayTitle = document.getElementById('overlay-title');
  const mainOverlayMessage = document.getElementById('overlay-msg');
  const mainOverlayPrimary = document.getElementById('overlay-primary');
  const mainOverlaySecondary = document.getElementById('overlay-secondary');
  const mainStart = document.getElementById('start');
  const mainPause = document.getElementById('pause');
  const mainReset = document.getElementById('reset');
  const mainMute = document.getElementById('mute');
  const mainMuteIcon = document.getElementById('mute-icon');
  const mainMuteLabel = document.getElementById('mute-label');
  const mainNext = [1, 2, 3].map(index => document.getElementById(`next-${index}`));
  const mainHold = document.getElementById('hold');
  const mainStats = {
    score: document.getElementById('score'),
    lines: document.getElementById('lines'),
    level: document.getElementById('level'),
    mood: document.getElementById('mood'),
    best: document.getElementById('best')
  };

  if (!gameCanvas || !sidePanel || !controlCard || !controlsLegend) return;

  const copy = {
    en: {
      display: 'Pop out', displayTitle: 'Tetristeza — Display', score: 'Score', lines: 'Lines',
      level: 'Level', mood: 'Mood', best: 'Best', next: 'Next', hold: 'Hold', start: 'Start',
      pause: 'Pause', reset: 'Reset', mute: 'Mute', sound: 'Sound', blocked: 'Pop-up blocked'
    },
    'es-AR': {
      display: 'Abrir aparte', displayTitle: 'Tetristeza — Display', score: 'Puntaje', lines: 'Líneas',
      level: 'Nivel', mood: 'Ánimo', best: 'Récord', next: 'Siguientes', hold: 'Guardar', start: 'Jugar',
      pause: 'Pausa', reset: 'Reiniciar', mute: 'Silenciar', sound: 'Sonido', blocked: 'El navegador bloqueó la ventana'
    },
    ca: {
      display: 'Obre en una finestra', displayTitle: 'Tetristeza — Display', score: 'Puntuació', lines: 'Línies',
      level: 'Nivell', mood: 'Ànim', best: 'Rècord', next: 'Següents', hold: 'Reserva', start: 'Juga',
      pause: 'Pausa', reset: 'Reinicia', mute: 'Silencia', sound: 'So', blocked: 'El navegador ha bloquejat la finestra'
    }
  };

  function language() {
    const lang = document.documentElement.lang || 'en';
    return copy[lang] ? lang : 'en';
  }

  function text() {
    return copy[language()];
  }

  const style = document.createElement('style');
  style.textContent = `
    .controls-legend{margin:10px 0 0}
    .display-popout{width:100%;margin-top:8px}
    .touch-wrap{display:none}
    #game{width:min(100%,480px,calc((100svh - 180px)/2))}
    @media (any-pointer:coarse){.touch-wrap{display:block}}
    @media (min-width:701px){
      body.game-active #game{width:min(100%,480px,calc((100svh - 44px)/2))}
    }
    @media (min-width:701px) and (max-height:1100px){
      body.game-active .nav{display:none}
      body.game-active main.wrap{padding-top:8px;padding-bottom:8px}
      body.game-active #game-section{padding:10px 14px}
      body.game-active #game-section>.section-title{display:none}
    }
    @media (min-width:920px){
      .grid{grid-template-columns:minmax(320px,480px) minmax(260px,300px)}
      #game{width:min(100%,480px,calc((100svh - 180px)/2));max-width:480px}
      .controls-legend{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:5px;padding:7px}
      .control-hint{min-height:31px;padding:4px 6px;justify-content:space-between}
      .control-hint-label{font-size:9px}
      .control-hint kbd{min-width:22px;font-size:11px}
    }
    @media (max-width:700px){
      .touch-wrap{display:block}
      body.game-active .nav{display:none}
      body.game-active main.wrap{padding-top:6px;padding-bottom:calc(82px + env(safe-area-inset-bottom))}
      body.game-active #game-section{padding:6px}
      body.game-active #game-section>.section-title{display:none}
      body.game-active #game{width:min(100%,420px,calc((100svh - 86px - env(safe-area-inset-bottom))/2))}
      .display-popout{display:none}
    }
    @media (max-width:560px){
      body.game-active main.wrap{padding-bottom:calc(128px + env(safe-area-inset-bottom))}
      body.game-active #game{width:min(100%,calc((100svh - 138px - env(safe-area-inset-bottom))/2))}
    }
    @media (any-pointer:coarse) and (orientation:landscape) and (max-height:600px){
      body.game-active #game{width:min(100%,calc((100svh - 24px - env(safe-area-inset-top) - env(safe-area-inset-bottom))/2))}
    }
  `;
  document.head.appendChild(style);

  sidePanel.insertBefore(controlsLegend, controlCard.nextSibling);

  const popoutButton = document.createElement('button');
  popoutButton.type = 'button';
  popoutButton.className = 'control display-popout';
  popoutButton.innerHTML = '<span aria-hidden="true">↗</span> <span class="display-popout-label"></span>';
  controlCard.insertAdjacentElement('afterend', popoutButton);

  let displayWindow = null;
  let displayFrame = 0;
  let displayUi = null;
  let lastLanguage = '';

  function updateMainButtonCopy() {
    const label = popoutButton.querySelector('.display-popout-label');
    if (label) label.textContent = text().display;
    popoutButton.setAttribute('aria-label', text().display);
  }

  function displayDocument() {
    return `<!doctype html>
<html lang="${language()}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>${text().displayTitle}</title>
<style>
  :root{color-scheme:dark;--bg:#0b0d11;--card:#111522;--border:#232b3a;--text:#e7e9ee;--muted:#93a0b4;--accent:#22d3ee}
  *{box-sizing:border-box}html,body{height:100%;margin:0}body{overflow:hidden;background:var(--bg);color:var(--text);font:400 14px/1.4 system-ui,-apple-system,Segoe UI,Roboto,Ubuntu,Cantarell,Noto Sans,Helvetica,Arial,sans-serif}
  button{font:inherit}.shell{height:100%;display:grid;grid-template-columns:minmax(0,1fr) 220px;gap:10px;padding:10px}
  .board-wrap{min-width:0;min-height:0;display:grid;place-items:center;position:relative}
  #display-game{width:min(100%,480px,calc((100svh - 20px)/2));aspect-ratio:1/2;background:#0c0f15;border:1px solid #1d2432;border-radius:14px;box-shadow:0 10px 30px rgba(0,0,0,.35);image-rendering:pixelated}
  .side{min-height:0;overflow:auto;display:flex;flex-direction:column;gap:8px}.hud{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px}.stat{padding:8px 6px;text-align:center;background:#0f131b;border:1px solid #1f2736;border-radius:10px}.stat.best{grid-column:1/-1}.stat strong{display:block;font-size:9px;letter-spacing:.06em;text-transform:uppercase;color:var(--muted)}.stat span{display:block;margin-top:2px;font-size:17px;font-weight:800}
  .card{background:var(--card);border:1px solid var(--border);border-radius:11px;padding:8px}.preview-label{text-align:center;margin:4px 0 0;color:var(--muted);font-size:10px}.next{display:grid;grid-template-columns:repeat(3,1fr);gap:4px}.next canvas,.hold canvas{width:100%;aspect-ratio:1/1;background:#0c0f15;border:1px solid #1d2432;border-radius:8px;image-rendering:pixelated}.hold canvas{display:block;max-width:76px;margin:auto}.actions{display:grid;grid-template-columns:repeat(2,1fr);gap:6px}.action{appearance:none;border:1px solid #293246;background:#121827;color:var(--text);padding:8px 6px;border-radius:9px;cursor:pointer;font-weight:650}.action:hover{background:#172036}.action:disabled{opacity:.45;cursor:default}
  .status{min-height:18px;text-align:center;color:var(--muted);font-size:11px}
  .display-overlay{position:absolute;inset:0;display:none;place-items:center;padding:16px;background:rgba(0,0,0,.64);border-radius:14px}.display-overlay.visible{display:grid}.display-modal{width:min(300px,90%);padding:16px;text-align:center;background:#0f131b;border:1px solid #2a3446;border-radius:14px}.display-modal h2{margin:0 0 6px;font-size:20px}.display-modal p{margin:0 0 12px;color:var(--muted)}.overlay-actions{display:flex;justify-content:center;gap:6px}
  @media(max-width:620px){body{overflow:auto}.shell{min-height:100%;height:auto;grid-template-columns:1fr;grid-template-rows:minmax(0,1fr) auto}.board-wrap{min-height:0}#display-game{width:min(100%,480px,calc((100svh - 150px)/2))}.side{overflow:visible;display:grid;grid-template-columns:1fr 1fr;gap:6px}.hud{grid-column:1/-1;grid-template-columns:repeat(5,minmax(0,1fr))}.stat.best{grid-column:auto}.stat span{font-size:14px}.previews{grid-column:1/-1;display:grid;grid-template-columns:1.5fr .5fr;gap:6px}.actions{grid-column:1/-1;grid-template-columns:repeat(4,1fr)}.status{grid-column:1/-1}}
  @media(max-width:430px){.shell{padding:6px;gap:6px}#display-game{width:min(100%,calc((100svh - 126px)/2))}.previews{display:none}.side{grid-template-columns:1fr}.hud{grid-template-columns:repeat(5,minmax(0,1fr))}.actions{grid-template-columns:repeat(4,1fr)}}
</style>
</head>
<body>
<div class="shell">
  <div class="board-wrap">
    <canvas id="display-game" width="200" height="400" aria-label="Tetristeza"></canvas>
    <div id="display-overlay" class="display-overlay"><div class="display-modal"><h2 id="display-overlay-title"></h2><p id="display-overlay-message"></p><div class="overlay-actions"><button id="display-primary" class="action" type="button"></button><button id="display-secondary" class="action" type="button"></button></div></div></div>
  </div>
  <aside class="side">
    <div class="hud">
      <div class="stat"><strong data-label="score"></strong><span id="display-score">0</span></div>
      <div class="stat"><strong data-label="lines"></strong><span id="display-lines">0</span></div>
      <div class="stat"><strong data-label="level"></strong><span id="display-level">1</span></div>
      <div class="stat"><strong data-label="mood"></strong><span id="display-mood">—</span></div>
      <div class="stat best"><strong data-label="best"></strong><span id="display-best">0</span></div>
    </div>
    <div class="previews">
      <div class="card"><div class="next"><canvas id="display-next-1"></canvas><canvas id="display-next-2"></canvas><canvas id="display-next-3"></canvas></div><p class="preview-label" data-label="next"></p></div>
      <div class="card hold"><canvas id="display-hold"></canvas><p class="preview-label" data-label="hold"></p></div>
    </div>
    <div class="actions"><button id="display-start" class="action" type="button"></button><button id="display-pause" class="action" type="button"></button><button id="display-reset" class="action" type="button"></button><button id="display-mute" class="action" type="button"></button></div>
    <div id="display-status" class="status"></div>
  </aside>
</div>
</body>
</html>`;
  }

  function popupElement(id) {
    return displayWindow?.document.getElementById(id) || null;
  }

  function fitMirrorCanvas(canvas, aspect = 1) {
    if (!canvas || !displayWindow || displayWindow.closed) return null;
    const dpr = Math.max(1, displayWindow.devicePixelRatio || 1);
    const rect = canvas.getBoundingClientRect();
    const cssWidth = Math.max(1, rect.width);
    const cssHeight = Math.max(1, aspect === 2 ? cssWidth * 2 : rect.height || cssWidth);
    const width = Math.max(1, Math.round(cssWidth * dpr));
    const height = Math.max(1, Math.round(cssHeight * dpr));
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return {canvas, ctx, dpr, cssWidth, cssHeight};
  }

  function copyCanvas(source, target, aspect = 1) {
    if (!source || !target) return;
    const fit = fitMirrorCanvas(target, aspect);
    if (!fit) return;
    fit.ctx.clearRect(0, 0, fit.cssWidth, fit.cssHeight);
    fit.ctx.drawImage(source, 0, 0, source.width, source.height, 0, 0, fit.cssWidth, fit.cssHeight);
  }

  function proxyClick(source) {
    if (!source || source.disabled) return;
    source.click();
    setTimeout(() => {
      try { displayWindow?.focus(); } catch {}
    }, 0);
  }

  const gameKeyCodes = new Set(['ArrowLeft','ArrowRight','ArrowDown','ArrowUp','Space','KeyC','KeyP','KeyR','KeyG','KeyM','KeyX','KeyZ']);

  function forwardKeyboardEvent(type, event) {
    if (!gameKeyCodes.has(event.code)) return;
    event.preventDefault();
    const forwarded = new KeyboardEvent(type, {
      key: event.key,
      code: event.code,
      location: event.location,
      ctrlKey: event.ctrlKey,
      shiftKey: event.shiftKey,
      altKey: event.altKey,
      metaKey: event.metaKey,
      repeat: event.repeat,
      bubbles: true,
      cancelable: true
    });
    document.dispatchEvent(forwarded);
  }

  function syncDisplayLanguage() {
    if (!displayWindow || displayWindow.closed) return;
    const lang = language();
    if (lastLanguage === lang) return;
    lastLanguage = lang;
    const c = text();
    displayWindow.document.documentElement.lang = lang;
    displayWindow.document.title = c.displayTitle;
    displayWindow.document.querySelectorAll('[data-label]').forEach(node => {
      const key = node.dataset.label;
      node.textContent = c[key] || key;
    });
    popupElement('display-start').textContent = c.start;
    popupElement('display-pause').textContent = c.pause;
    popupElement('display-reset').textContent = c.reset;
    popupElement('display-mute').textContent = c.mute;
  }

  function syncDisplayState() {
    if (!displayWindow || displayWindow.closed || !displayUi) return;
    syncDisplayLanguage();

    Object.entries(mainStats).forEach(([key, source]) => {
      const target = displayUi.stats[key];
      if (source && target && target.textContent !== source.textContent) target.textContent = source.textContent;
    });

    copyCanvas(gameCanvas, displayUi.game, 2);
    mainNext.forEach((source, index) => copyCanvas(source, displayUi.next[index], 1));
    copyCanvas(mainHold, displayUi.hold, 1);

    displayUi.start.disabled = Boolean(mainStart?.disabled);
    displayUi.pause.disabled = Boolean(mainPause?.disabled);
    displayUi.mute.textContent = `${mainMuteIcon?.textContent || '🔈'} ${mainMuteLabel?.textContent || text().mute}`;

    const overlayVisible = mainOverlay?.getAttribute('aria-hidden') === 'false';
    displayUi.overlay.classList.toggle('visible', overlayVisible);
    if (overlayVisible) {
      displayUi.overlayTitle.textContent = mainOverlayTitle?.textContent || '';
      displayUi.overlayMessage.textContent = mainOverlayMessage?.textContent || '';
      displayUi.primary.textContent = mainOverlayPrimary?.textContent || text().start;
      displayUi.secondary.textContent = mainOverlaySecondary?.textContent || text().reset;
      displayUi.primary.disabled = Boolean(mainOverlayPrimary?.disabled);
      displayUi.secondary.disabled = Boolean(mainOverlaySecondary?.disabled);
    }

    displayUi.status.textContent = document.body.classList.contains('game-active') ? '' : (overlayVisible ? mainOverlayTitle?.textContent || '' : '');
    displayFrame = displayWindow.requestAnimationFrame(syncDisplayState);
  }

  function closeDisplayReference() {
    if (displayFrame && displayWindow && !displayWindow.closed) {
      try { displayWindow.cancelAnimationFrame(displayFrame); } catch {}
    }
    displayFrame = 0;
    displayUi = null;
    displayWindow = null;
  }

  function openDisplay() {
    if (displayWindow && !displayWindow.closed) {
      displayWindow.focus();
      return;
    }

    displayWindow = window.open('', 'tetristeza-display', 'popup=yes,width=760,height=900,resizable=yes,scrollbars=no');
    if (!displayWindow) {
      popoutButton.title = text().blocked;
      return;
    }

    displayWindow.document.open();
    displayWindow.document.write(displayDocument());
    displayWindow.document.close();

    displayUi = {
      game: popupElement('display-game'),
      next: [1, 2, 3].map(index => popupElement(`display-next-${index}`)),
      hold: popupElement('display-hold'),
      stats: {
        score: popupElement('display-score'), lines: popupElement('display-lines'), level: popupElement('display-level'),
        mood: popupElement('display-mood'), best: popupElement('display-best')
      },
      start: popupElement('display-start'), pause: popupElement('display-pause'), reset: popupElement('display-reset'), mute: popupElement('display-mute'),
      status: popupElement('display-status'), overlay: popupElement('display-overlay'), overlayTitle: popupElement('display-overlay-title'),
      overlayMessage: popupElement('display-overlay-message'), primary: popupElement('display-primary'), secondary: popupElement('display-secondary')
    };

    lastLanguage = '';
    syncDisplayLanguage();

    displayUi.start.addEventListener('click', () => proxyClick(mainStart));
    displayUi.pause.addEventListener('click', () => proxyClick(mainPause));
    displayUi.reset.addEventListener('click', () => proxyClick(mainReset));
    displayUi.mute.addEventListener('click', () => proxyClick(mainMute));
    displayUi.primary.addEventListener('click', () => proxyClick(mainOverlayPrimary));
    displayUi.secondary.addEventListener('click', () => proxyClick(mainOverlaySecondary));
    displayWindow.document.addEventListener('keydown', event => forwardKeyboardEvent('keydown', event));
    displayWindow.document.addEventListener('keyup', event => forwardKeyboardEvent('keyup', event));
    displayWindow.addEventListener('blur', () => {
      ['ArrowLeft','ArrowRight','ArrowDown'].forEach(code => {
        document.dispatchEvent(new KeyboardEvent('keyup', {code, bubbles: true}));
      });
    });
    displayWindow.addEventListener('beforeunload', closeDisplayReference, {once: true});

    displayFrame = displayWindow.requestAnimationFrame(syncDisplayState);
    displayWindow.focus();
  }

  popoutButton.addEventListener('click', openDisplay);
  document.querySelectorAll('.lang-btn').forEach(button => button.addEventListener('click', () => setTimeout(updateMainButtonCopy, 0)));
  window.addEventListener('beforeunload', () => {
    try { if (displayWindow && !displayWindow.closed) displayWindow.close(); } catch {}
  });

  updateMainButtonCopy();
})();
