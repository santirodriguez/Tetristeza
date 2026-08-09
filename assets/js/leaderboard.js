(() => {
  'use strict';

  const API_URL = 'api/scores.php';
  const REQUEST_TIMEOUT_MS = 5000;
  const LOCAL_TEST = window.location.protocol === 'file:';
  const LOCAL_STORAGE_KEY = 'tetristeza:test-top10:v1';
  const GAME_OVER_TITLES = new Set(['Game Over', 'Fin del juego', 'Fi de la partida']);
  const copy = {
    en: {
      top: 'Top 10', subtitle: 'Brief victories over Tetristeza, ranked.',
      newTop: 'New Top Score!', newTopNote: 'The blocks are taking this personally.',
      empty: 'Nobody has survived the blocks yet.', name: 'Name', email: 'Email · optional',
      emailNote: 'Private · never shown publicly', localEmailNote: 'Local test · email is not stored',
      localTest: 'Local test · this Top 10 is saved only in this browser.',
      save: 'Save score', saving: 'Saving…', unavailable: 'Top 10 unavailable',
      invalidName: 'Use 1–8 letters or numbers; simple punctuation is OK.',
      invalidEmail: 'Enter a valid email or leave it blank.', saveFailed: 'Could not save the score.',
      displaced: 'The Top 10 changed before your score was saved.'
    },
    'es-AR': {
      top: 'Top 10', subtitle: 'Superando la Tetristeza, un puntaje a la vez.',
      newTop: '¡Nuevo Top Score!', newTopNote: 'La Tetristeza no pudo con vos. Esta vez.',
      empty: 'Todavía nadie sobrevivió a la Tetristeza.', name: 'Nombre', email: 'Email · opcional',
      emailNote: 'Privado · nunca se muestra públicamente', localEmailNote: 'Prueba local · el email no se guarda',
      localTest: 'Prueba local · este Top 10 se guarda solo en este navegador.',
      save: 'Guardar puntaje', saving: 'Guardando…', unavailable: 'Top 10 no disponible',
      invalidName: 'Usá 1–8 letras o números; se admite puntuación simple.',
      invalidEmail: 'Ingresá un email válido o dejalo vacío.', saveFailed: 'No se pudo guardar el puntaje.',
      displaced: 'El Top 10 cambió antes de guardar tu puntaje.'
    },
    ca: {
      top: 'Top 10', subtitle: 'Superant la Tetristeza, una puntuació cada vegada.',
      newTop: 'Nou Top Score!', newTopNote: 'La Tetristeza no ha pogut amb tu. Aquesta vegada.',
      empty: 'Encara ningú ha sobreviscut a la Tetristeza.', name: 'Nom', email: 'Email · opcional',
      emailNote: 'Privat · mai no es mostra públicament', localEmailNote: 'Prova local · l’email no es desa',
      localTest: 'Prova local · aquest Top 10 només es desa en aquest navegador.',
      save: 'Desa la puntuació', saving: 'Desant…', unavailable: 'Top 10 no disponible',
      invalidName: 'Fes servir 1–8 lletres o números; s’admet puntuació simple.',
      invalidEmail: 'Introdueix un email vàlid o deixa’l buit.', saveFailed: 'No s’ha pogut desar la puntuació.',
      displaced: 'El Top 10 ha canviat abans de desar la puntuació.'
    }
  };

  const style = document.createElement('style');
  style.textContent = `
    .overlay .modal.leaderboard-modal{max-height:calc(100vh - 40px);max-height:calc(100dvh - 40px);overflow-y:auto;overscroll-behavior:contain}
    .leaderboard-panel{margin:14px auto 0;max-width:390px;text-align:left}
    .leaderboard-panel[hidden]{display:none}
    .leaderboard-title{text-align:center;margin:0;font-size:17px;letter-spacing:.1em;text-transform:uppercase;color:var(--accent-2);text-shadow:0 0 16px rgba(34,211,238,.2)}
    .leaderboard-subtitle{text-align:center;margin:3px 0 10px;font-size:11px;line-height:1.35;color:var(--muted)}
    .leaderboard-form{display:grid;gap:9px;margin:10px 0 14px;padding:13px;background:linear-gradient(180deg,#101827,#0b1018);border:1px solid #2c3950;border-radius:13px;box-shadow:0 10px 26px rgba(0,0,0,.18)}
    .leaderboard-form .leaderboard-subtitle{margin:0 0 2px;color:var(--accent-2)}
    .leaderboard-form label{display:grid;gap:4px;font-size:11px;font-weight:750;letter-spacing:.06em;text-transform:uppercase;color:var(--muted)}
    .leaderboard-form input{width:100%;border:1px solid #303b50;background:#101623;color:var(--text);border-radius:9px;padding:9px 10px;font:inherit;outline:none}
    .leaderboard-form input:focus{border-color:var(--accent-2);box-shadow:0 0 0 2px rgba(34,211,238,.12)}
    .leaderboard-note{font-size:10px;text-transform:none;letter-spacing:0;font-weight:500;color:var(--muted)}
    .leaderboard-error{min-height:16px;margin:0!important;font-size:11px;color:var(--bad)!important;text-align:center}
    .leaderboard-save{justify-self:center;min-width:130px;box-shadow:0 0 18px rgba(34,211,238,.12)}
    .leaderboard-list{list-style:none;margin:0;padding:0;display:grid;gap:5px;font-variant-numeric:tabular-nums}
    .leaderboard-row{display:grid;grid-template-columns:32px minmax(0,1fr) auto;gap:8px;align-items:center;padding:6px 9px;border-radius:9px;background:#0e131c;border:1px solid #1d2635;font-size:13px;transition:transform .12s ease,border-color .12s ease,box-shadow .12s ease}
    .leaderboard-row:nth-child(1){padding-block:8px;border-color:rgba(250,204,21,.5);background:linear-gradient(90deg,rgba(250,204,21,.11),#111721 55%);box-shadow:0 0 20px rgba(250,204,21,.08)}
    .leaderboard-row:nth-child(2){border-color:rgba(34,211,238,.32);background:linear-gradient(90deg,rgba(34,211,238,.07),#0e131c 55%)}
    .leaderboard-row:nth-child(3){border-color:rgba(167,139,250,.32);background:linear-gradient(90deg,rgba(167,139,250,.07),#0e131c 55%)}
    .leaderboard-row.is-new{border-color:rgba(52,211,153,.72);background:linear-gradient(90deg,rgba(52,211,153,.13),#111c29 58%);box-shadow:0 0 20px rgba(52,211,153,.12)}
    .leaderboard-rank{color:var(--muted);text-align:right;font-weight:800}.leaderboard-row:nth-child(1) .leaderboard-rank{color:var(--yellow)}
    .leaderboard-name{font-weight:780;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.leaderboard-score{font-weight:850;color:var(--text)}
    .leaderboard-row:nth-child(1) .leaderboard-name,.leaderboard-row:nth-child(1) .leaderboard-score{font-weight:900}
    .leaderboard-status{text-align:center!important;font-size:12px;margin:10px 0!important}
    .leaderboard-local{color:var(--yellow)!important}
    .leaderboard-empty{padding:12px 8px;border:1px dashed #303b50;border-radius:10px;color:var(--muted)!important}
    @media(max-width:420px){.leaderboard-panel{max-width:100%}.leaderboard-form{padding:10px}.leaderboard-row{padding:5px 7px}.leaderboard-row:nth-child(1){padding-block:7px}}
  `;
  document.head.appendChild(style);

  const overlay = document.getElementById('overlay');
  const modal = overlay?.querySelector('.modal');
  const title = document.getElementById('overlay-title');
  const scoreEl = document.getElementById('score');
  const buttonRow = modal?.querySelector('.buttons.center');
  if (!overlay || !modal || !title || !scoreEl || !buttonRow) return;

  const panel = document.createElement('div');
  panel.className = 'leaderboard-panel';
  panel.hidden = true;
  modal.insertBefore(panel, buttonRow);

  let requestId = 0;
  let gameOverSessionId = 0;
  let gameOverActive = false;
  let lastGameOverScore = null;
  let lastGameOverLanguage = null;
  let submittedScore = null;
  let pendingSubmission = null;
  let localMemoryScores = [];

  function language() {
    const lang = document.documentElement.lang || 'en';
    return copy[lang] ? lang : 'en';
  }

  function text() {
    return copy[language()];
  }

  function parseScore() {
    const value = Number(String(scoreEl.textContent || '').replace(/[^0-9]/g, ''));
    return Number.isSafeInteger(value) && value >= 0 ? value : 0;
  }

  function qualifies(score, scores) {
    if (score <= 0) return false;
    if (scores.length < 10) return true;
    return score > Number(scores[9]?.score || 0);
  }

  function normalizeLocalScores(entries) {
    if (!Array.isArray(entries)) return [];
    return entries
      .filter(entry => entry && typeof entry.name === 'string' && Number.isSafeInteger(entry.score) && entry.score > 0)
      .map(entry => ({
        id: String(entry.id || ''),
        name: Array.from(entry.name).slice(0, 8).join(''),
        score: entry.score,
        createdAt: Number.isSafeInteger(entry.createdAt) ? entry.createdAt : 0
      }))
      .sort((a, b) => b.score - a.score || a.createdAt - b.createdAt || a.id.localeCompare(b.id))
      .slice(0, 10);
  }

  function readLocalScores() {
    try {
      const parsed = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '[]');
      localMemoryScores = normalizeLocalScores(parsed);
    } catch {
      localMemoryScores = normalizeLocalScores(localMemoryScores);
    }
    return localMemoryScores.slice();
  }

  function writeLocalScores(scores) {
    localMemoryScores = normalizeLocalScores(scores);
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(localMemoryScores));
    } catch {
      // In-memory fallback keeps the current local test session usable.
    }
  }

  function publicLocalScores(scores) {
    return scores.map(({name, score}) => ({name, score}));
  }

  function saveLocalScore(name, score) {
    const scores = readLocalScores();
    if (!qualifies(score, publicLocalScores(scores))) {
      return {ok: true, accepted: false, position: null, scores: publicLocalScores(scores)};
    }

    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    scores.push({id, name, score, createdAt: Date.now()});
    const ranked = normalizeLocalScores(scores);
    writeLocalScores(ranked);
    const positionIndex = ranked.findIndex(entry => entry.id === id);

    return {
      ok: true,
      accepted: positionIndex !== -1,
      position: positionIndex === -1 ? null : positionIndex + 1,
      scores: publicLocalScores(ranked)
    };
  }

  function headingBlock(titleText, subtitleText) {
    const heading = document.createElement('h4');
    heading.className = 'leaderboard-title';
    heading.textContent = titleText;

    const subtitle = document.createElement('p');
    subtitle.className = 'leaderboard-subtitle';
    subtitle.textContent = subtitleText;
    return [heading, subtitle];
  }

  function renderRanking(scores, highlightPosition = null) {
    const c = text();
    const nodes = headingBlock(c.top, c.subtitle);

    if (!scores.length) {
      nodes.push(status(c.empty, 'leaderboard-empty'));
      return nodes;
    }

    const list = document.createElement('ol');
    list.className = 'leaderboard-list';
    scores.slice(0, 10).forEach((entry, index) => {
      const row = document.createElement('li');
      row.className = 'leaderboard-row';
      if (highlightPosition === index + 1) row.classList.add('is-new');

      const rank = document.createElement('span');
      rank.className = 'leaderboard-rank';
      rank.textContent = `#${index + 1}`;

      const name = document.createElement('span');
      name.className = 'leaderboard-name';
      name.textContent = Array.from(String(entry.name || '')).slice(0, 8).join('');

      const score = document.createElement('span');
      score.className = 'leaderboard-score';
      score.textContent = Number(entry.score || 0).toLocaleString(language());

      row.append(rank, name, score);
      list.appendChild(row);
    });

    nodes.push(list);
    return nodes;
  }

  function status(message, className = '') {
    const p = document.createElement('p');
    p.className = `leaderboard-status${className ? ` ${className}` : ''}`;
    p.textContent = message;
    return p;
  }

  function localTestNotice() {
    return LOCAL_TEST ? status(text().localTest, 'leaderboard-local') : null;
  }

  function validName(value) {
    const trimmed = value.trim();
    const length = Array.from(trimmed).length;
    return length >= 1
      && length <= 8
      && /[\p{L}\p{N}]/u.test(trimmed)
      && /^[\p{L}\p{N} _.'’·-]+$/u.test(trimmed);
  }

  function validEmail(value) {
    if (!value) return true;
    return value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }

  async function loadScores() {
    if (LOCAL_TEST) {
      return {response: {ok: true}, result: {ok: true, scores: publicLocalScores(readLocalScores())}};
    }

    const options = {headers: {'Accept': 'application/json'}, credentials: 'same-origin'};
    let timer = null;
    let controller = null;

    if (typeof AbortController === 'function') {
      controller = new AbortController();
      options.signal = controller.signal;
      timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    }

    try {
      const response = await fetch(API_URL, options);
      const result = await response.json();
      return {response, result};
    } finally {
      if (timer !== null) clearTimeout(timer);
    }
  }

  async function submitScore(name, email, score) {
    if (LOCAL_TEST) {
      return {response: {ok: true}, result: saveLocalScore(name, score)};
    }

    const options = {
      method: 'POST',
      headers: {'Content-Type': 'application/json', 'Accept': 'application/json'},
      credentials: 'same-origin',
      body: JSON.stringify({name, email, score})
    };
    let timer = null;
    let controller = null;

    if (typeof AbortController === 'function') {
      controller = new AbortController();
      options.signal = controller.signal;
      timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    }

    try {
      const response = await fetch(API_URL, options);
      const result = await response.json();
      return {response, result};
    } finally {
      if (timer !== null) clearTimeout(timer);
    }
  }

  function buildForm(score) {
    const c = text();
    const form = document.createElement('form');
    form.className = 'leaderboard-form';
    form.noValidate = true;

    const [formTitle, formSubtitle] = headingBlock(c.newTop, c.newTopNote);

    const nameLabel = document.createElement('label');
    nameLabel.textContent = c.name;
    const nameInput = document.createElement('input');
    nameInput.type = 'text';
    nameInput.maxLength = 8;
    nameInput.autocomplete = 'nickname';
    nameInput.required = true;
    nameInput.spellcheck = false;
    nameLabel.appendChild(nameInput);

    const emailLabel = document.createElement('label');
    emailLabel.textContent = c.email;
    const emailInput = document.createElement('input');
    emailInput.type = 'email';
    emailInput.maxLength = 254;
    emailInput.autocomplete = 'email';
    const emailNote = document.createElement('span');
    emailNote.className = 'leaderboard-note';
    emailNote.textContent = LOCAL_TEST ? c.localEmailNote : c.emailNote;
    emailLabel.append(emailInput, emailNote);

    const error = document.createElement('p');
    error.className = 'leaderboard-error';

    const save = document.createElement('button');
    save.type = 'submit';
    save.className = 'control btn-accent leaderboard-save';
    save.textContent = c.save;

    form.append(formTitle, formSubtitle, nameLabel, emailLabel, error, save);

    form.addEventListener('submit', async event => {
      event.preventDefault();
      const name = nameInput.value.trim();
      const email = emailInput.value.trim();
      error.textContent = '';

      if (!validName(name)) {
        error.textContent = text().invalidName;
        nameInput.focus();
        return;
      }
      if (!validEmail(email)) {
        error.textContent = text().invalidEmail;
        emailInput.focus();
        return;
      }

      const submitSession = gameOverSessionId;
      if (pendingSubmission?.sessionId === submitSession && pendingSubmission.score === score) return;

      pendingSubmission = {score, sessionId: submitSession};
      save.disabled = true;
      save.textContent = text().saving;

      try {
        const {response, result} = await submitScore(name, email, score);
        if (!gameOverActive || submitSession !== gameOverSessionId) return;
        if (!response.ok || !result?.ok) throw new Error('save_failed');

        pendingSubmission = null;
        submittedScore = score;
        const nodes = [];
        const notice = localTestNotice();
        if (notice) nodes.push(notice);
        nodes.push(...renderRanking(Array.isArray(result.scores) ? result.scores : [], result.accepted ? result.position : null));
        if (!result.accepted) nodes.push(status(text().displaced));
        panel.replaceChildren(...nodes);
      } catch {
        if (!gameOverActive || submitSession !== gameOverSessionId) return;
        pendingSubmission = null;
        submittedScore = null;
        error.textContent = text().saveFailed;
        save.disabled = false;
        save.textContent = text().save;
      }
    });

    return form;
  }

  async function showGameOverLeaderboard() {
    const score = parseScore();
    const currentLanguage = language();
    lastGameOverScore = score;
    lastGameOverLanguage = currentLanguage;
    panel.hidden = false;
    panel.replaceChildren(status('…'));
    const currentRequest = ++requestId;

    try {
      const {response, result} = await loadScores();
      if (currentRequest !== requestId) return;
      if (!response.ok || !result?.ok || !Array.isArray(result.scores)) throw new Error('load_failed');

      const scores = result.scores;
      const nodes = [];
      const notice = localTestNotice();
      if (notice) nodes.push(notice);
      if (submittedScore !== score && qualifies(score, scores)) nodes.push(buildForm(score));
      nodes.push(...renderRanking(scores));
      panel.replaceChildren(...nodes);
    } catch {
      if (currentRequest !== requestId) return;
      panel.replaceChildren(status(text().unavailable));
    }
  }

  function sync() {
    const isGameOver = GAME_OVER_TITLES.has(title.textContent.trim()) && overlay.getAttribute('aria-hidden') === 'false';
    if (isGameOver) {
      if (!gameOverActive) {
        gameOverActive = true;
        gameOverSessionId += 1;
      }

      modal.classList.add('leaderboard-modal');
      const score = parseScore();
      const currentLanguage = language();
      const submissionPending = pendingSubmission?.sessionId === gameOverSessionId && pendingSubmission.score === score;

      if (submissionPending) {
        lastGameOverScore = score;
        lastGameOverLanguage = currentLanguage;
        return;
      }

      if (panel.hidden || lastGameOverScore !== score || lastGameOverLanguage !== currentLanguage) {
        showGameOverLeaderboard();
      }
    } else {
      modal.classList.remove('leaderboard-modal');
      if (gameOverActive) {
        gameOverActive = false;
        gameOverSessionId += 1;
      }
      requestId += 1;
      lastGameOverScore = null;
      lastGameOverLanguage = null;
      submittedScore = null;
      pendingSubmission = null;
      panel.hidden = true;
      panel.replaceChildren();
    }
  }

  new MutationObserver(sync).observe(title, {childList: true, characterData: true, subtree: true});
  new MutationObserver(sync).observe(overlay, {attributes: true, attributeFilter: ['aria-hidden', 'style']});
  sync();
})();
