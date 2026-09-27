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
  const game = window.TetristezaGame;

  if (!gameSection || !gameCanvas || !boardWrap || !sidePanel || !controlCard || !controlsLegend || !overlay || !startButton || !pauseButton || !game) return;

  const copy = {
    en: {moveWindow:'Move to window',returnPage:'Return to page',play:'Play',detached:'The game is running in another window.',blocked:'Pop-up blocked',displayTitle:'Tetristeza — Game'},
    'es-AR': {moveWindow:'Mover a otra ventana',returnPage:'Volver a la página',play:'Jugar',detached:'La partida está en otra ventana.',blocked:'El navegador bloqueó la ventana',displayTitle:'Tetristeza — Juego'},
    ca: {moveWindow:'Mou a una finestra',returnPage:'Torna a la pàgina',play:'Juga',detached:'La partida és en una altra finestra.',blocked:'El navegador ha bloquejat la finestra',displayTitle:'Tetristeza — Joc'}
  };

  function language() {
    const lang = game.getLanguage();
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
      body.game-active:not(.display-detached) .nav{display:none}
      body.game-active:not(.display-detached) #game-section>.section-title{display:none}
      .display-popout{display:none}
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
      .detached-document #game-section{padding:8px}.detached-document #game{width:min(100%,420px,calc((100svh - 120px)/2))!important}
      .detached-document .controls-legend{display:none}
    }
    @media (max-width:619px) and (any-pointer:coarse){
      .detached-document #game{width:min(100%,420px,calc((100svh - 230px)/2))!important}
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

  function overlayVisible() {
    return overlay.getAttribute('aria-hidden') === 'false';
  }

  function releaseMainInert() {
    mainRegions.forEach(region => { region.inert = false; });
  }

  function syncDetachedInert() {
    if (!detached || !displayWindow || displayWindow.closed) return;
    const modalVisible = overlayVisible();
    releaseMainInert();
    gameSection.inert = modalVisible;
    const header = displayWindow.document.querySelector('.detached-header');
    if (header) header.inert = modalVisible;
  }

  function suppressReadyOverlay() {
    game.dismissReadyOverlay();
  }

  function detachedTranslation() {
    return copy[language()] || copy.en;
  }

  function syncMovedLanguage() {
    const c = detachedTranslation();
    if (detached && displayWindow && !displayWindow.closed) {
      displayWindow.document.documentElement.lang = language();
      displayWindow.document.title = c.displayTitle;
      game.localizeRoot(gameSection);
      game.localizeRoot(overlay);
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
    displayWindow.document.body.classList.toggle('game-active', game.getState().gameActive);
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
      moveButton.querySelector('.display-popout-label').textContent = c.blocked;
      moveButton.setAttribute('aria-label', c.blocked);
      window.setTimeout(() => {
        if (!detached) updateLocalCopy();
      }, 1800);
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

  function attachPopupListeners(popup) {
    popup.document.getElementById('detached-return').addEventListener('click', () => returnToPage());
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

    game.releaseInput();
    const parent = gameSection.parentNode;
    parent.replaceChild(placeholder, gameSection);
    placeholder.hidden = false;
    popup.document.getElementById('detached-surface').appendChild(gameSection);
    popup.document.body.appendChild(overlay);

    displayWindow = popup;
    detached = true;
    document.body.classList.add('display-detached');
    attachPopupListeners(popup);
    game.setHostWindow(popup);
    syncMovedLanguage();
    syncPopupGameState();
    try { popup.focus(); } catch {}

    clearInterval(displayMonitor);
    displayMonitor = window.setInterval(() => {
      if (detached && (!displayWindow || displayWindow.closed)) returnToPage({fromPopupClose:true});
    }, 500);
  }

  function returnToPage({fromPopupClose=false}={}) {
    if (!detached) return;
    game.releaseInput();
    const popup = displayWindow;
    const wasOverlayVisible = overlayVisible();

    placeholder.replaceWith(gameSection);
    document.body.appendChild(overlay);
    placeholder.hidden = true;
    detached = false;
    document.body.classList.remove('display-detached');
    gameSection.inert = false;

    if (wasOverlayVisible && overlay.dataset.state !== 'ready') mainRegions.forEach(region => { region.inert = true; });
    else releaseMainInert();

    game.setHostWindow(window);
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

  document.addEventListener('tetristeza:statechange', () => {
    suppressReadyOverlay();
    syncPopupGameState();
  });
  document.addEventListener('tetristeza:languagechange', syncMovedLanguage);

  window.addEventListener('beforeunload', () => {
    shuttingDown = true;
    clearInterval(displayMonitor);
    try { if (displayWindow && !displayWindow.closed) displayWindow.close(); } catch {}
  });

  suppressReadyOverlay();
  updateLocalCopy();
})();