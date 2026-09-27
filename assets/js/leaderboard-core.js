(() => {
  'use strict';

  const API_URL = 'api/scores.php';
  const REQUEST_TIMEOUT_MS = 5000;
  const SUBMISSION_RECEIPT_TTL_MS = 15 * 60 * 1000;
  const LOCAL_TEST = window.location.protocol === 'file:';
  const LOCAL_STORAGE_KEY = 'tetristeza:test-top10:v1';
  const copy = {
    en: {
      top: 'Top 10', subtitle: 'Brief victories over Tetristeza, ranked.',
      newTop: 'You made the Top 10!', newTopNote: 'The blocks are taking this personally.',
      empty: 'Nobody has survived the blocks yet.', name: 'Name', email: 'Email · optional',
      emailNote: 'Private · never shown publicly', localEmailNote: 'Local test · email is not stored',
      localTest: 'Local test · this Top 10 is saved only in this browser.',
      save: 'Save score', saving: 'Saving…', retry: 'Retry', unavailable: 'Top 10 unavailable',
      invalidName: 'Use 1–8 letters or numbers; simple punctuation is OK.',
      invalidEmail: 'Enter a valid email or leave it blank.', saveFailed: 'Could not save the score.',
      rateLimited: 'Too many attempts. Try again in {seconds}s.',
      retryAmbiguous: 'The save result is uncertain. Retry uses the same protected submission.',
      retryExpired: 'The protected retry window expired. Check the Top 10 before trying again.',
      displaced: 'The Top 10 changed before your score was saved.'
    },
    'es-AR': {
      top: 'Top 10', subtitle: 'Superando la Tetristeza, un puntaje a la vez.',
      newTop: '¡Entraste al Top 10!', newTopNote: 'La Tetristeza no pudo con vos. Esta vez.',
      empty: 'Todavía nadie sobrevivió a la Tetristeza.', name: 'Nombre', email: 'Email · opcional',
      emailNote: 'Privado · nunca se muestra públicamente', localEmailNote: 'Prueba local · el email no se guarda',
      localTest: 'Prueba local · este Top 10 se guarda solo en este navegador.',
      save: 'Guardar puntaje', saving: 'Guardando…', retry: 'Reintentar', unavailable: 'Top 10 no disponible',
      invalidName: 'Usá 1–8 letras o números; se admite puntuación simple.',
      invalidEmail: 'Ingresá un email válido o dejalo vacío.', saveFailed: 'No se pudo guardar el puntaje.',
      rateLimited: 'Demasiados intentos. Probá de nuevo en {seconds}s.',
      retryAmbiguous: 'El resultado del guardado es incierto. El reintento usa el mismo envío protegido.',
      retryExpired: 'Venció la ventana de reintento protegido. Revisá el Top 10 antes de intentar otra vez.',
      displaced: 'El Top 10 cambió antes de guardar tu puntaje.'
    },
    ca: {
      top: 'Top 10', subtitle: 'Superant la Tetristeza, una puntuació cada vegada.',
      newTop: 'Has entrat al Top 10!', newTopNote: 'La Tetristeza no ha pogut amb tu. Aquesta vegada.',
      empty: 'Encara ningú ha sobreviscut a la Tetristeza.', name: 'Nom', email: 'Email · opcional',
      emailNote: 'Privat · mai no es mostra públicament', localEmailNote: 'Prova local · l’email no es desa',
      localTest: 'Prova local · aquest Top 10 només es desa en aquest navegador.',
      save: 'Desa la puntuació', saving: 'Desant…', retry: 'Torna-ho a provar', unavailable: 'Top 10 no disponible',
      invalidName: 'Fes servir 1–8 lletres o números; s’admet puntuació simple.',
      invalidEmail: 'Introdueix un email vàlid o deixa’l buit.', saveFailed: 'No s’ha pogut desar la puntuació.',
      rateLimited: 'Massa intents. Torna-ho a provar d’aquí a {seconds}s.',
      retryAmbiguous: 'El resultat del desament és incert. El reintent utilitza el mateix enviament protegit.',
      retryExpired: 'Ha vençut la finestra de reintent protegit. Revisa el Top 10 abans de tornar-ho a provar.',
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
    .leaderboard-field-error{min-height:14px;margin:0;font-size:10px;text-transform:none;letter-spacing:0;font-weight:600;color:var(--bad)}
    .leaderboard-actions{display:flex;justify-content:center;gap:8px;flex-wrap:wrap}
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
  const scoreEl = document.getElementById('score');
  const buttonRow = modal?.querySelector('.buttons.center');
  if (!overlay || !modal || !scoreEl || !buttonRow) return;

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
  let submissionId = null;
  let pendingSubmission = null;
  let retryLockedSubmission = null;
  let draft = null;
  let cachedScores = null;
  let scoresLoading = false;
  let loadFailed = false;
  let rateLimitUntil = 0;
  let localMemoryScores = [];
  let localSequence = 0;
  let localMemoryOnly = false;

  function language() {
    const lang = document.documentElement.lang || 'en';
    return copy[lang] ? lang : 'en';
  }

  function text() {
    return copy[language()];
  }

  function formatCopy(key, vars = {}) {
    let value = text()[key] || copy.en[key] || key;
    for (const [name, replacement] of Object.entries(vars)) {
      value = value.replace(`{${name}}`, String(replacement));
    }
    return value;
  }

  function createSubmissionId() {
    const cryptoApi = window.crypto;
    if (cryptoApi && typeof cryptoApi.randomUUID === 'function') {
      return cryptoApi.randomUUID();
    }
    if (cryptoApi && typeof cryptoApi.getRandomValues === 'function') {
      const bytes = new Uint8Array(16);
      cryptoApi.getRandomValues(bytes);
      return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
    }
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 14)}-${Math.random().toString(36).slice(2, 14)}`;
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
    const ranked = entries
      .filter(entry => entry && typeof entry.name === 'string' && Number.isSafeInteger(entry.score) && entry.score > 0)
      .map((entry, index) => ({
        id: String(entry.id || ''),
        name: Array.from(entry.name).slice(0, 8).join(''),
        score: entry.score,
        createdAt: Number.isSafeInteger(entry.createdAt) ? entry.createdAt : 0,
        order: Number.isSafeInteger(entry.order) ? entry.order : index
      }))
      .sort((a, b) => b.score - a.score || a.createdAt - b.createdAt || a.order - b.order)
      .slice(0, 10);
    localSequence = Math.max(localSequence, ...ranked.map(entry => entry.order + 1), 0);
    return ranked;
  }

  function readLocalScores() {
    if (localMemoryOnly) return normalizeLocalScores(localMemoryScores).slice();
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (raw !== null) localMemoryScores = normalizeLocalScores(JSON.parse(raw));
      else localMemoryScores = normalizeLocalScores(localMemoryScores);
    } catch {
      localMemoryOnly = true;
      localMemoryScores = normalizeLocalScores(localMemoryScores);
    }
    return localMemoryScores.slice();
  }

  function writeLocalScores(scores) {
    localMemoryScores = normalizeLocalScores(scores);
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(localMemoryScores));
      localMemoryOnly = false;
    } catch {
      localMemoryOnly = true;
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

    const createdAt = Date.now();
    const order = localSequence++;
    const id = `local-${createdAt}-${order}`;
    scores.push({id, name, score, createdAt, order});
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

  function normalizePublicScores(entries) {
    if (!Array.isArray(entries)) return null;
    return entries
      .filter(entry => entry && typeof entry.name === 'string')
      .map(entry => ({name: Array.from(entry.name).slice(0, 8).join(''), score: Number(entry.score)}))
      .filter(entry => Number.isSafeInteger(entry.score) && entry.score > 0)
      .slice(0, 10);
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

  function status(message, className = '', {alert = false} = {}) {
    const p = document.createElement('p');
    p.className = `leaderboard-status${className ? ` ${className}` : ''}`;
    p.textContent = message;
    p.setAttribute('role', alert ? 'alert' : 'status');
    p.setAttribute('aria-live', alert ? 'assertive' : 'polite');
    return p;
  }

  function retryStatus(message, onRetry) {
    const wrapper = document.createElement('div');
    wrapper.className = 'leaderboard-actions';
    const messageNode = status(message, '', {alert: true});
    const retry = document.createElement('button');
    retry.type = 'button';
    retry.className = 'control';
    retry.textContent = text().retry;
    retry.addEventListener('click', onRetry);
    wrapper.append(messageNode, retry);
    return wrapper;
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

  async function responseJson(response) {
    try {
      return await response.json();
    } catch {
      return null;
    }
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
      const result = await responseJson(response);
      return {response, result};
    } finally {
      if (timer !== null) clearTimeout(timer);
    }
  }

  async function submitScore(name, email, score, operationId) {
    if (LOCAL_TEST) {
      return {response: {ok: true}, result: saveLocalScore(name, score)};
    }

    const options = {
      method: 'POST',
      headers: {'Content-Type': 'application/json', 'Accept': 'application/json'},
      credentials: 'same-origin',
      body: JSON.stringify({name, email, score, submissionId: operationId})
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
      const result = await responseJson(response);
      return {response, result};
    } finally {
      if (timer !== null) clearTimeout(timer);
    }
  }

  function retryAfterMs(response) {
    const raw = response?.headers?.get?.('Retry-After');
    if (!raw) return 0;
    const seconds = Number(raw);
    if (Number.isFinite(seconds) && seconds >= 0) return Math.ceil(seconds * 1000);
    const date = Date.parse(raw);
    return Number.isFinite(date) ? Math.max(0, date - Date.now()) : 0;
  }

  function buildForm(score) {
    const c = text();
    const currentDraft = draft?.sessionId === gameOverSessionId && draft.score === score
      ? draft
      : {sessionId: gameOverSessionId, score, name: '', email: ''};
    draft = currentDraft;

    const form = document.createElement('form');
    form.className = 'leaderboard-form';
    form.noValidate = true;

    const [formTitle, formSubtitle] = headingBlock(c.newTop, c.newTopNote);

    const nameLabel = document.createElement('label');
    nameLabel.textContent = c.name;
    const nameInput = document.createElement('input');
    nameInput.type = 'text';
    nameInput.autocomplete = 'nickname';
    nameInput.required = true;
    nameInput.spellcheck = false;
    nameInput.value = currentDraft.name;
    const nameError = document.createElement('span');
    nameError.className = 'leaderboard-field-error';
    nameError.id = `leaderboard-name-error-${gameOverSessionId}`;
    nameError.setAttribute('aria-live', 'polite');
    nameInput.setAttribute('aria-describedby', nameError.id);
    nameLabel.append(nameInput, nameError);

    const emailLabel = document.createElement('label');
    emailLabel.textContent = c.email;
    const emailInput = document.createElement('input');
    emailInput.type = 'email';
    emailInput.maxLength = 254;
    emailInput.autocomplete = 'email';
    emailInput.value = currentDraft.email;
    const emailNote = document.createElement('span');
    emailNote.className = 'leaderboard-note';
    emailNote.id = `leaderboard-email-note-${gameOverSessionId}`;
    emailNote.textContent = LOCAL_TEST ? c.localEmailNote : c.emailNote;
    const emailError = document.createElement('span');
    emailError.className = 'leaderboard-field-error';
    emailError.id = `leaderboard-email-error-${gameOverSessionId}`;
    emailError.setAttribute('aria-live', 'polite');
    emailInput.setAttribute('aria-describedby', `${emailNote.id} ${emailError.id}`);
    emailLabel.append(emailInput, emailNote, emailError);

    const error = document.createElement('p');
    error.className = 'leaderboard-error';
    error.setAttribute('role', 'status');
    error.setAttribute('aria-live', 'polite');

    const save = document.createElement('button');
    save.type = 'submit';
    save.className = 'control btn-accent leaderboard-save';
    save.textContent = c.save;

    function storeDraft() {
      if (draft?.sessionId !== gameOverSessionId || draft.score !== score) return;
      draft.name = nameInput.value;
      draft.email = emailInput.value;
    }

    function applyRateLimit() {
      const remaining = rateLimitUntil - Date.now();
      if (remaining <= 0) return false;
      const seconds = Math.max(1, Math.ceil(remaining / 1000));
      save.disabled = true;
      error.textContent = formatCopy('rateLimited', {seconds});
      error.setAttribute('role', 'alert');
      window.setTimeout(() => {
        if (!gameOverActive || currentDraft.sessionId !== gameOverSessionId) return;
        if (rateLimitUntil > Date.now()) {
          applyRateLimit();
          return;
        }
        save.disabled = false;
        save.textContent = text().save;
        error.textContent = '';
        error.setAttribute('role', 'status');
      }, Math.min(remaining, 1000));
      return true;
    }

    nameInput.addEventListener('input', () => {
      const limited = Array.from(nameInput.value).slice(0, 8).join('');
      if (limited !== nameInput.value) nameInput.value = limited;
      nameInput.removeAttribute('aria-invalid');
      nameError.textContent = '';
      storeDraft();
    });
    emailInput.addEventListener('input', () => {
      emailInput.removeAttribute('aria-invalid');
      emailError.textContent = '';
      storeDraft();
    });

    form.append(formTitle, formSubtitle, nameLabel, emailLabel, error, save);

    const retryLock = retryLockedSubmission?.sessionId === gameOverSessionId
      && retryLockedSubmission.score === score
      ? retryLockedSubmission
      : null;

    if (retryLock) {
      nameInput.value = retryLock.payload.name;
      emailInput.value = retryLock.payload.email;
      nameInput.disabled = true;
      emailInput.disabled = true;
      if (Date.now() - retryLock.createdAt >= SUBMISSION_RECEIPT_TTL_MS) {
        error.textContent = c.retryExpired;
        error.setAttribute('role', 'alert');
        save.disabled = true;
      } else {
        error.textContent = c.retryAmbiguous;
      }
    }
    applyRateLimit();

    form.addEventListener('submit', async event => {
      event.preventDefault();
      nameError.textContent = '';
      emailError.textContent = '';
      error.textContent = '';
      error.setAttribute('role', 'status');
      nameInput.removeAttribute('aria-invalid');
      emailInput.removeAttribute('aria-invalid');

      if (applyRateLimit()) return;

      const submitSession = gameOverSessionId;
      const activeRetry = retryLockedSubmission?.sessionId === submitSession
        && retryLockedSubmission.score === score
        ? retryLockedSubmission
        : null;

      let payload;
      if (activeRetry) {
        if (Date.now() - activeRetry.createdAt >= SUBMISSION_RECEIPT_TTL_MS) {
          error.textContent = text().retryExpired;
          error.setAttribute('role', 'alert');
          save.disabled = true;
          return;
        }
        payload = activeRetry.payload;
      } else {
        const name = nameInput.value.trim();
        const email = emailInput.value.trim();
        currentDraft.name = nameInput.value;
        currentDraft.email = emailInput.value;

        if (!validName(name)) {
          nameInput.setAttribute('aria-invalid', 'true');
          nameError.textContent = text().invalidName;
          nameInput.focus();
          return;
        }
        if (!validEmail(email)) {
          emailInput.setAttribute('aria-invalid', 'true');
          emailError.textContent = text().invalidEmail;
          emailInput.focus();
          return;
        }

        if (!submissionId) submissionId = createSubmissionId();
        payload = {name, email, score, submissionId};
      }

      if (pendingSubmission?.sessionId === submitSession && pendingSubmission.score === score) return;

      const attemptStartedAt = Date.now();
      pendingSubmission = {score, sessionId: submitSession, payload};
      save.disabled = true;
      save.textContent = text().saving;
      let ambiguousFailure = true;

      try {
        const {response, result} = await submitScore(payload.name, payload.email, payload.score, payload.submissionId);
        if (!gameOverActive || submitSession !== gameOverSessionId) return;

        if (!response.ok) {
          ambiguousFailure = false;
          const serverError = typeof result?.error === 'string' ? result.error : '';
          if (response.status === 422 && serverError === 'invalid_name') {
            retryLockedSubmission = null;
            nameInput.disabled = false;
            emailInput.disabled = false;
            nameInput.setAttribute('aria-invalid', 'true');
            nameError.textContent = text().invalidName;
            nameInput.focus();
            return;
          }
          if (response.status === 422 && serverError === 'invalid_email') {
            retryLockedSubmission = null;
            nameInput.disabled = false;
            emailInput.disabled = false;
            emailInput.setAttribute('aria-invalid', 'true');
            emailError.textContent = text().invalidEmail;
            emailInput.focus();
            return;
          }
          if (response.status === 429 || serverError === 'rate_limited') {
            if (!activeRetry) retryLockedSubmission = null;
            rateLimitUntil = Date.now() + Math.max(1000, retryAfterMs(response));
            applyRateLimit();
            return;
          }
          throw new Error('save_failed');
        }

        const scores = normalizePublicScores(result?.scores);
        if (!result?.ok || typeof result.accepted !== 'boolean' || !scores) {
          throw new Error('ambiguous_response');
        }
        ambiguousFailure = false;

        pendingSubmission = null;
        retryLockedSubmission = null;
        submittedScore = score;
        draft = null;
        cachedScores = scores;
        const nodes = [];
        const notice = localTestNotice();
        if (notice) nodes.push(notice);
        const highlightPosition = result.accepted && !result.replayed && Number.isInteger(result.position) ? result.position : null;
        nodes.push(...renderRanking(scores, highlightPosition));
        if (!result.accepted) nodes.push(status(text().displaced));
        panel.replaceChildren(...nodes);
      } catch {
        if (!gameOverActive || submitSession !== gameOverSessionId) return;
        pendingSubmission = null;
        submittedScore = null;
        if (ambiguousFailure) {
          retryLockedSubmission = {
            score,
            sessionId: submitSession,
            payload,
            createdAt: activeRetry?.createdAt || attemptStartedAt
          };
          nameInput.value = payload.name;
          emailInput.value = payload.email;
          nameInput.disabled = true;
          emailInput.disabled = true;
          error.textContent = text().retryAmbiguous;
        } else {
          retryLockedSubmission = null;
          nameInput.disabled = false;
          emailInput.disabled = false;
          error.textContent = text().saveFailed;
        }
        error.setAttribute('role', 'alert');
      } finally {
        if (gameOverActive && submitSession === gameOverSessionId) {
          pendingSubmission = null;
          const retryExpired = retryLockedSubmission
            && Date.now() - retryLockedSubmission.createdAt >= SUBMISSION_RECEIPT_TTL_MS;
          if (!applyRateLimit()) save.disabled = Boolean(retryExpired);
          save.textContent = text().save;
        }
      }
    });

    return form;
  }

  function renderCurrentLeaderboard() {
    const score = parseScore();
    const scores = cachedScores || [];
    const nodes = [];
    const notice = localTestNotice();
    if (notice) nodes.push(notice);
    if (submittedScore !== score && qualifies(score, scores)) nodes.push(buildForm(score));
    nodes.push(...renderRanking(scores));
    panel.replaceChildren(...nodes);
  }

  async function showGameOverLeaderboard({forceLoad = false} = {}) {
    const score = parseScore();
    const currentLanguage = language();
    lastGameOverScore = score;
    lastGameOverLanguage = currentLanguage;
    panel.hidden = false;

    if (!forceLoad && cachedScores) {
      renderCurrentLeaderboard();
      return;
    }
    if (scoresLoading) return;

    scoresLoading = true;
    loadFailed = false;
    panel.replaceChildren(status('…'));
    const currentRequest = ++requestId;
    const currentSession = gameOverSessionId;

    try {
      const {response, result} = await loadScores();
      if (currentRequest !== requestId || currentSession !== gameOverSessionId || !gameOverActive) return;
      const scores = normalizePublicScores(result?.scores);
      if (!response.ok || !result?.ok || !scores) throw new Error('load_failed');

      cachedScores = scores;
      loadFailed = false;
      renderCurrentLeaderboard();
    } catch {
      if (currentRequest !== requestId || currentSession !== gameOverSessionId || !gameOverActive) return;
      loadFailed = true;
      panel.replaceChildren(retryStatus(text().unavailable, () => {
        if (!gameOverActive || currentSession !== gameOverSessionId) return;
        showGameOverLeaderboard({forceLoad: true});
      }));
    } finally {
      if (currentRequest === requestId) scoresLoading = false;
    }
  }

  function sync() {
    const isGameOver = overlay.dataset.state === 'gameOver' && overlay.getAttribute('aria-hidden') === 'false';
    if (isGameOver) {
      if (!gameOverActive) {
        gameOverActive = true;
        gameOverSessionId += 1;
        cachedScores = null;
        loadFailed = false;
        draft = null;
        rateLimitUntil = 0;
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

      if (panel.hidden || lastGameOverScore !== score) {
        showGameOverLeaderboard();
        return;
      }

      if (lastGameOverLanguage !== currentLanguage) {
        lastGameOverLanguage = currentLanguage;
        if (cachedScores) renderCurrentLeaderboard();
        else if (loadFailed) {
          panel.replaceChildren(retryStatus(text().unavailable, () => showGameOverLeaderboard({forceLoad: true})));
        }
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
      submissionId = null;
      pendingSubmission = null;
      retryLockedSubmission = null;
      draft = null;
      cachedScores = null;
      scoresLoading = false;
      loadFailed = false;
      rateLimitUntil = 0;
      panel.hidden = true;
      panel.replaceChildren();
    }
  }

  document.addEventListener('tetristeza:languagechange', sync);
  document.addEventListener('tetristeza:statechange', sync);
  sync();
})();
