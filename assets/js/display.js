(() => {
  'use strict';

  const gameSection = document.getElementById('game-section');
  const gameCanvas = document.getElementById('game');
  const boardWrap = gameCanvas?.closest('.board-wrap');
  const sidePanel = document.querySelector('.side-panel');
  const controlCard = sidePanel?.querySelector('.control-card');
  const controlsLegend = document.querySelector('.controls-legend');
  const overlay = document.getElementById('overlay');
  const startButton = document.getElementById('start');
  const pauseButton = document.getElementById('pause');
  const mainRegions = [...document.querySelectorAll('.nav, main, .footer')];

  if (!gameSection || !gameCanvas || !boardWrap || !sidePanel || !controlCard || !controlsLegend || !overlay || !startButton || !pauseButton) return;

  const copy = {
    en: {
      moveWindow: 'Move to window', returnPage: 'Return to page', play: 'Play',
      detached: 'The game is running in another window.', blocked: 'Pop-up blocked',
      displayTitle: 'Tetristeza — Game', languageSwitcher: 'Language selector',
      game: 'Game', legendMove: 'Move', legendRotate: 'Rotate', legendDrop: 'Drop', legendHold: 'Hold',
      legendPause: 'Pause', legendRestart: 'Restart', legendGhost: 'Ghost', legendSound: 'Sound',
      score: 'Score', lines: 'Lines', level: 'Level', mood: 'Mood', best: 'Best', next: 'Next', hold: 'Hold',
      start: 'Start', pause: 'Pause', reset: 'Reset', holdButton: 'HOLD', help: 'Keyboard or on-screen controls.',
      about: 'About the game', aboutCopy: 'A small falling-block game. It’s quite sensitive, and for once I mean that literally.',
      board: 'Game board', nextPiece: 'Next piece', holdPiece: 'Hold piece', moveLeft: 'Move left', rotate: 'Rotate clockwise',
      moveRight: 'Move right', softDrop: 'Soft drop', hardDrop: 'Hard drop'
    },
    'es-AR': {
      moveWindow: 'Mover a otra ventana', returnPage: 'Volver a la página', play: 'Jugar',
      detached: 'La partida está en otra ventana.', blocked: 'El navegador bloqueó la ventana',
      displayTitle: 'Tetristeza — Juego', languageSwitcher: 'Selector de idioma',
      game: 'Juego', legendMove: 'Mover', legendRotate: 'Rotar', legendDrop: 'Caída', legendHold: 'Guardar',
      legendPause: 'Pausa', legendRestart: 'Reiniciar', legendGhost: 'Fantasma', legendSound: 'Sonido',
      score: 'Puntaje', lines: 'Líneas', level: 'Nivel', mood: 'Ánimo', best: 'Récord', next: 'Siguientes', hold: 'Guardar',
      start: 'Jugar', pause: 'Pausa', reset: 'Reiniciar', holdButton: 'GUARDAR', help: 'Teclado o controles en pantalla.',
      about: 'De qué trata el juego', aboutCopy: 'Un jueguito de bloques que caen. Es bastante sensible y, por una vez, lo digo literalmente.',
      board: 'Tablero de juego', nextPiece: 'Próxima pieza', holdPiece: 'Pieza guardada', moveLeft: 'Mover a la izquierda',
      rotate: 'Rotar a la derecha', moveRight: 'Mover a la derecha', softDrop: 'Bajar', hardDrop: 'Caída rápida'
    },
    ca: {
      moveWindow: 'Mou a una finestra', returnPage: 'Torna a la pàgina', play: 'Juga',
      detached: 'La partida és en una altra finestra.', blocked: 'El navegador ha bloquejat la finestra',
      displayTitle: 'Tetristeza — Joc', languageSwitcher: 'Selector d’idioma',
      game: 'Joc', legendMove: 'Moure', legendRotate: 'Girar', legendDrop: 'Baixar', legendHold: 'Reserva',
      legendPause: 'Pausa', legendRestart: 'Reiniciar', legendGhost: 'Fantasma', legendSound: 'So',
      score: 'Puntuació', lines: 'Línies', level: 'Nivell', mood: 'Ànim', best: 'Rècord', next: 'Següents', hold: 'Reserva',
      start: 'Juga', pause: 'Pausa', reset: 'Reinicia', holdButton: 'RESERVA', help: 'Teclat o controls en pantalla.',
      about: 'De què va el joc', aboutCopy: 'Un joc petit de blocs que cauen. És força sensible i, per una vegada, ho dic literalment.',
      board: 'Tauler de joc', nextPiece: 'Peça següent', holdPiece: 'Peça reservada', moveLeft: 'Mou a l’esquerra',
      rotate: 'Gira a la dreta', moveRight: 'Mou a la dreta', softDrop: 'Baixa', hardDrop: 'Baixada ràpida'
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
    .board-start-prompt{position:absolute;left:50%;bottom:18px;z-index:8;transform:translateX(-50%);display:inline-flex;align-items:center;gap:7px;padding:8px 13px;border:1px solid #36506c;border-radius:999px;background:rgba(15,24,38,.88);color:var(--text);font-weight:750;cursor:pointer;box-shadow:0 8px 24px rgba(0,0,0,.28);opacity:.48;transition:opacity .18s ease,transform .18s ease,background .18s ease;backdrop-filter:blur(6px)}
    .board-wrap:hover .board-start-prompt,.board-start-prompt:focus-visible{opacity:1;transform:translateX(-50%) translateY(-2px);background:rgba(23,32,54,.96)}
    body.game-active .board-start-prompt,.detached-document.game-active .board-start-prompt{display:none}
    .game-detached-placeholder{display:grid;place-items:center;gap:12px;min-height:280px;text-align:center}
    .game-detached-placeholder p{margin:0;color:var(--muted)}
    .game-detached-placeholder .control{min-width:180px}
    body.display-detached.game-active .nav{display:block!important}
    body.display-detached main.wrap{padding-top:18px!important;padding-bottom:18px!important}
    @media (any-pointer:coarse){.touch-wrap{display:block}.board-start-prompt{opacity:1}}
    @media (min-width:701px){
      body.game-active:not(.display-detached) #game{width:min(100%,480px,calc((100svh - 44px)/2))}
    }
    @media (min-width:701px) and (max-height:1100px){
      body.game-active:not(.display-detached) .nav{display:none}
      body.game-active:not(.display-detached) main.wrap{padding-top:8px;padding-bottom:8px}
      body.game-active:not(.display-detached) #game-section{padding:10px 14px}
      body.game-active:not(.display-detached) #game-section>.section-title{display:none}
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
      body.game-active:not(.display-detached) .nav{display:none}
      body.game-active:not(.display-detached) main.wrap{padding-top:6px;padding-bottom:calc(82px + env(safe-area-inset-bottom))}
      body.game-active:not(.display-detached) #game-section{padding:6px}
      body.game-active:not(.display-detached) #game-section>.section-title{display:none}
      body.game-active:not(.display-detached) #game{width:min(100%,420px,calc((100svh - 86px - env(safe-area-inset-bottom))/2))}
      .display-popout{display:none}
    }
    @media (max-width:560px){
      body.game-active:not(.display-detached) main.wrap{padding-bottom:calc(128px + env(safe-area-inset-bottom))}
      body.game-active:not(.display-detached) #game{width:min(100%,calc((100svh - 138px - env(safe-area-inset-bottom))/2))}
    }
    @media (any-pointer:coarse) and (orientation:landscape) and (max-height:600px){
      body.game-active:not(.display-detached) #game{width:min(100%,calc((100svh - 24px - env(safe-area-inset-top) - env(safe-area-inset-bottom))/2))}
    }
    .detached-document{min-height:100%;margin:0;overflow:auto;background:var(--bg);color:var(--text)}
    .detached-header{position:sticky;top:0;z-index:900;display:flex;align-items:center;justify-content:space-between;gap:12px;padding:8px 12px;border-bottom:1px solid var(--border);background:rgba(14,17,22,.94);backdrop-filter:blur(10px)}
    .detached-header img{display:block;width:auto;height:34px;max-width:55vw;object-fit:contain}
    .detached-header .control{padding:8px 10px;font-size:13px}
    .detached-surface{padding:10px;display:grid;place-items:start center}
    .detached-document #game-section{width:min(100%,820px);padding:12px;margin:0}
    .detached-document #game-section>.section-title{display:none}
    .detached-document .display-popout{display:none!important}
    .detached-document #game{width:min(100%,480px,calc((100svh - 86px)/2))!important}
    .detached-document .footer,.detached-document .nav{display:none!important}
    @media (min-width:620px){
      .detached-document .grid{grid-template-columns:minmax(300px,480px) minmax(230px,280px);grid-template-areas:"board side" "touch side";justify-content:center;column-gap:14px;row-gap:8px;align-items:start}
      .detached-document .board-wrap{justify-content:flex-start}
      .detached-document .hud{grid-template-columns:repeat(2,minmax(0,1fr));gap:7px;margin-bottom:8px}
      .detached-document .hud .box:nth-child(5){grid-column:1/-1}
      .detached-document .control-card{grid-template-columns:1fr;gap:8px;padding:10px}
      .detached-document .previews{grid-template-columns:1fr;gap:8px}
      .detached-document .controls-legend{grid-template-columns:repeat(2,minmax(0,1fr))}
    }
    @media (max-width:619px){
      .detached-header{padding:6px 8px}.detached-header img{height:30px}.detached-surface{padding:6px}
      .detached-document #game-section{padding:8px}.detached-document #game{width:min(100%,420px,calc((100svh - 82px)/2))!important}
      .detached-document .controls-legend{display:none}
    }
  `;
  document.head.appendChild(style);

  const playPrompt = document.createElement('button');
  playPrompt.type = 'button';
  playPrompt.className = 'board-start-prompt';
  playPrompt.innerHTML = '<span aria-hidden="true">▶</span><span class="board-start-label"></span>';
  boardWrap.appendChild(playPrompt);

  const moveButton = document.createElement('button');
  moveButton.type = 'button';
  moveButton.className = 'control display-popout';
  moveButton.innerHTML = '<span aria-hidden="true">↗</span> <span class="display-popout-label"></span>';
  controlCard.insertAdjacentElement('afterend', moveButton);
  moveButton.insertAdjacentElement('afterend', controlsLegend);

  const pauseHintKeys = controlsLegend.querySelector('[data-i18n="legendPause"]')?.closest('.control-hint')?.querySelector('.control-hint-keys');
  if (pauseHintKeys && !pauseHintKeys.querySelector('[data-key="escape"]')) {
    const escapeKey = document.createElement('kbd');
    escapeKey.dataset.key = 'escape';
    escapeKey.textContent = 'Esc';
    pauseHintKeys.appendChild(escapeKey);
  }

  const placeholder = document.createElement('section');
  placeholder.className = 'card game-detached-placeholder';
  placeholder.hidden = true;
  placeholder.innerHTML = '<p class="game-detached-message"></p><button class="control btn-accent game-return-button" type="button"></button>';

  let displayWindow = null;
  let displayMonitor = 0;
  let detached = false;
  let shuttingDown = false;

  const nativeRequestAnimationFrame = window.requestAnimationFrame.bind(window);
  const nativeCancelAnimationFrame = window.cancelAnimationFrame.bind(window);
  let renderHost = null;
  let frameToken = 1;
  const scheduledFrames = new Map();

  window.requestAnimationFrame = callback => {
    const host = renderHost && !renderHost.closed ? renderHost : window;
    const request = host === window ? nativeRequestAnimationFrame : host.requestAnimationFrame.bind(host);
    const cancel = host === window ? nativeCancelAnimationFrame : host.cancelAnimationFrame.bind(host);
    const token = frameToken++;
    let nativeId = 0;
    try {
      nativeId = request(() => {
        scheduledFrames.delete(token);
        callback(window.performance.now());
      });
      scheduledFrames.set(token, {cancel, nativeId});
    } catch {
      nativeId = nativeRequestAnimationFrame(() => {
        scheduledFrames.delete(token);
        callback(window.performance.now());
      });
      scheduledFrames.set(token, {cancel: nativeCancelAnimationFrame, nativeId});
    }
    return token;
  };

  window.cancelAnimationFrame = token => {
    const scheduled = scheduledFrames.get(token);
    if (!scheduled) {
      try { nativeCancelAnimationFrame(token); } catch {}
      return;
    }
    scheduledFrames.delete(token);
    try { scheduled.cancel(scheduled.nativeId); } catch {}
  };

  function overlayVisible() {
    return overlay.getAttribute('aria-hidden') === 'false';
  }

  function isPlaying() {
    return Boolean(startButton.disabled) && !overlayVisible() && document.body.classList.contains('game-active');
  }

  function restartRenderCycleIfPlaying() {
    if (!isPlaying() || pauseButton.disabled) return;
    pauseButton.click();
    pauseButton.click();
  }

  function releaseMainInert() {
    mainRegions.forEach(region => { region.inert = false; });
  }

  function syncDetachedInert() {
    if (!detached) return;
    releaseMainInert();
    gameSection.inert = overlayVisible();
  }

  function suppressReadyOverlay() {
    if (overlay.dataset.state !== 'ready') return;
    if (overlay.style.display !== 'none') overlay.style.display = 'none';
    if (overlay.getAttribute('aria-hidden') !== 'true') overlay.setAttribute('aria-hidden', 'true');
    releaseMainInert();
    gameSection.inert = false;
    document.body.classList.remove('game-active');
    const active = document.activeElement;
    if (active instanceof HTMLElement && active.closest('#overlay')) active.blur();
  }

  function detachedTranslation() {
    return copy[language()] || copy.en;
  }

  function syncMovedLanguage() {
    const c = detachedTranslation();
    if (detached && displayWindow && !displayWindow.closed) {
      displayWindow.document.documentElement.lang = language();
      displayWindow.document.title = c.displayTitle;
    }

    if (detached) {
      gameSection.querySelectorAll('[data-i18n]').forEach(node => {
        const value = c[node.dataset.i18n];
        if (value) node.textContent = value;
      });
      const switcher = overlay.querySelector('.language-switcher');
      if (switcher) switcher.setAttribute('aria-label', c.languageSwitcher);
      overlay.querySelectorAll('.lang-btn').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.lang === language())));
      gameCanvas.setAttribute('aria-label', c.board);
      [1,2,3].forEach(index => gameSection.querySelector(`#next-${index}`)?.setAttribute('aria-label', `${c.nextPiece} ${index}`));
      gameSection.querySelector('#hold')?.setAttribute('aria-label', c.holdPiece);
      const actKeys = {left:'moveLeft',rotate:'rotate',right:'moveRight',down:'softDrop',drop:'hardDrop',hold:'holdPiece',pause:'pause'};
      gameSection.querySelectorAll('[data-act]').forEach(button => {
        const key = actKeys[button.dataset.act];
        if (key && c[key]) button.setAttribute('aria-label', c[key]);
      });
    }

    updateLocalCopy();
  }

  function updateLocalCopy() {
    const c = text();
    moveButton.querySelector('.display-popout-label').textContent = c.moveWindow;
    moveButton.setAttribute('aria-label', c.moveWindow);
    playPrompt.querySelector('.board-start-label').textContent = c.play;
    playPrompt.setAttribute('aria-label', c.play);
    placeholder.querySelector('.game-detached-message').textContent = c.detached;
    placeholder.querySelector('.game-return-button').textContent = c.returnPage;
    if (displayWindow && !displayWindow.closed) {
      const returnButton = displayWindow.document.getElementById('detached-return');
      if (returnButton) returnButton.textContent = c.returnPage;
      displayWindow.document.title = c.displayTitle;
    }
  }

  function syncPopupGameState() {
    if (!detached || !displayWindow || displayWindow.closed) return;
    displayWindow.document.body.classList.toggle('game-active', document.body.classList.contains('game-active'));
    syncDetachedInert();
  }

  function cloneStylesTo(targetDocument) {
    document.querySelectorAll('style').forEach(source => {
      const cloned = targetDocument.createElement('style');
      cloned.textContent = source.textContent;
      targetDocument.head.appendChild(cloned);
    });
  }

  function buildDisplayWindow() {
    const c = text();
    const popup = window.open('', 'tetristeza-game-window', 'popup=yes,width=780,height=900,resizable=yes,scrollbars=yes');
    if (!popup) {
      moveButton.title = c.blocked;
      return null;
    }
    moveButton.removeAttribute('title');

    popup.document.open();
    popup.document.write('<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta name="color-scheme" content="dark"><title>Tetristeza</title></head><body class="detached-document"><header class="detached-header"><img id="detached-logo" alt="Tetristeza"><button id="detached-return" class="control btn-accent" type="button"></button></header><main id="detached-surface" class="detached-surface"></main></body></html>');
    popup.document.close();
    cloneStylesTo(popup.document);
    const logo = popup.document.getElementById('detached-logo');
    logo.src = new URL('assets/branding/tetristeza-logo-1.svg', document.baseURI).href;
    popup.document.getElementById('detached-return').textContent = c.returnPage;
    popup.document.documentElement.lang = language();
    popup.document.title = c.displayTitle;
    return popup;
  }

  const gameKeys = new Set(['ArrowLeft','ArrowRight','ArrowDown','ArrowUp','Space','Escape','KeyC','KeyP','KeyR','KeyG','KeyM','KeyX','KeyZ']);

  function isInteractiveKeyboardTarget(target) {
    return Boolean(target && typeof target.closest === 'function' && target.closest('button,input,select,textarea,a,[contenteditable]:not([contenteditable="false"])'));
  }

  function forwardKeyboard(type, event) {
    if (!gameKeys.has(event.code) || isInteractiveKeyboardTarget(event.target)) return;
    event.preventDefault();
    document.dispatchEvent(new KeyboardEvent(type, {
      key: event.key, code: event.code, location: event.location, repeat: event.repeat,
      ctrlKey: event.ctrlKey, shiftKey: event.shiftKey, altKey: event.altKey, metaKey: event.metaKey,
      bubbles: true, cancelable: true
    }));
  }

  function attachPopupListeners(popup) {
    popup.document.getElementById('detached-return').addEventListener('click', () => returnToPage());
    popup.document.addEventListener('keydown', event => forwardKeyboard('keydown', event));
    popup.document.addEventListener('keyup', event => forwardKeyboard('keyup', event));
    popup.document.addEventListener('visibilitychange', () => {
      if (!popup.document.hidden) return;
      window.setTimeout(() => {
        if (detached && displayWindow === popup && !popup.closed && popup.document.hidden && isPlaying()) pauseButton.click();
      }, 150);
    });
    popup.addEventListener('blur', () => {
      ['ArrowLeft','ArrowRight','ArrowDown'].forEach(code => document.dispatchEvent(new KeyboardEvent('keyup', {code, bubbles:true})));
    });
    popup.addEventListener('resize', () => window.dispatchEvent(new Event('resize')));
    popup.addEventListener('beforeunload', () => {
      if (!shuttingDown && detached) returnToPage({fromPopupClose:true});
    });
  }

  function detachToWindow() {
    if (detached && displayWindow && !displayWindow.closed) {
      displayWindow.focus();
      return;
    }

    const popup = buildDisplayWindow();
    if (!popup) return;

    const parent = gameSection.parentNode;
    parent.replaceChild(placeholder, gameSection);
    placeholder.hidden = false;
    popup.document.getElementById('detached-surface').appendChild(gameSection);
    popup.document.body.appendChild(overlay);

    displayWindow = popup;
    detached = true;
    renderHost = popup;
    document.body.classList.add('display-detached');
    syncMovedLanguage();
    syncPopupGameState();
    attachPopupListeners(popup);
    restartRenderCycleIfPlaying();
    window.dispatchEvent(new Event('resize'));
    try { popup.focus(); } catch {}

    clearInterval(displayMonitor);
    displayMonitor = window.setInterval(() => {
      if (detached && (!displayWindow || displayWindow.closed)) returnToPage({fromPopupClose:true});
    }, 500);
  }

  function returnToPage({fromPopupClose=false}={}) {
    if (!detached) return;
    const popup = displayWindow;
    const wasOverlayVisible = overlayVisible();

    renderHost = null;
    placeholder.replaceWith(gameSection);
    document.body.appendChild(overlay);
    placeholder.hidden = true;
    detached = false;
    document.body.classList.remove('display-detached');
    gameSection.inert = false;

    if (wasOverlayVisible && overlay.dataset.state !== 'ready') mainRegions.forEach(region => { region.inert = true; });
    else releaseMainInert();

    restartRenderCycleIfPlaying();
    window.dispatchEvent(new Event('resize'));
    clearInterval(displayMonitor);
    displayMonitor = 0;
    displayWindow = null;

    if (!fromPopupClose && popup && !popup.closed) {
      try { popup.close(); } catch {}
    }
  }

  playPrompt.addEventListener('click', () => {
    if (!startButton.disabled) startButton.click();
  });
  moveButton.addEventListener('click', detachToWindow);
  placeholder.querySelector('.game-return-button').addEventListener('click', () => returnToPage());

  document.addEventListener('keydown', event => {
    if (event.code !== 'Escape' || event.repeat || !startButton.disabled) return;
    event.preventDefault();
    pauseButton.click();
  }, true);

  document.addEventListener('visibilitychange', () => {
    if (document.hidden && !detached && isPlaying()) pauseButton.click();
  });

  document.querySelectorAll('.lang-btn').forEach(button => button.addEventListener('click', () => setTimeout(syncMovedLanguage, 0)));

  new MutationObserver(() => {
    suppressReadyOverlay();
    syncPopupGameState();
  }).observe(overlay, {attributes:true, attributeFilter:['aria-hidden','style','data-state']});

  new MutationObserver(() => syncPopupGameState()).observe(document.body, {attributes:true, attributeFilter:['class']});
  new MutationObserver(() => syncMovedLanguage()).observe(document.documentElement, {attributes:true, attributeFilter:['lang']});
  new MutationObserver(records => {
    if (!detached || !displayWindow || displayWindow.closed) return;
    records.forEach(record => record.addedNodes.forEach(node => {
      if (!(node instanceof HTMLStyleElement)) return;
      const cloned = displayWindow.document.createElement('style');
      cloned.textContent = node.textContent;
      displayWindow.document.head.appendChild(cloned);
    }));
  }).observe(document.head, {childList:true});

  window.addEventListener('beforeunload', () => {
    shuttingDown = true;
    clearInterval(displayMonitor);
    try { if (displayWindow && !displayWindow.closed) displayWindow.close(); } catch {}
  });

  suppressReadyOverlay();
  updateLocalCopy();
})();