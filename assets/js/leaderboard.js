(() => {
  'use strict';

  const API_URL = 'api/scores.php';
  const GAME_OVER_TITLES = new Set(['Game Over', 'Fin del juego', 'Fi de la partida']);
  const copy = {
    en: {
      top: 'Top 10', newTop: 'New Top Score!', name: 'Name', email: 'Email · optional',
      emailNote: 'Private · never shown publicly', save: 'Save score', saving: 'Saving…',
      unavailable: 'Top 10 unavailable', invalidName: 'Use a name of 1–8 characters.',
      invalidEmail: 'Enter a valid email or leave it blank.', saveFailed: 'Could not save the score.',
      displaced: 'The Top 10 changed before your score was saved.'
    },
    'es-AR': {
      top: 'Top 10', newTop: '¡Nuevo Top Score!', name: 'Nombre', email: 'Email · opcional',
      emailNote: 'Privado · nunca se muestra públicamente', save: 'Guardar puntaje', saving: 'Guardando…',
      unavailable: 'Top 10 no disponible', invalidName: 'Usá un nombre de 1 a 8 caracteres.',
      invalidEmail: 'Ingresá un email válido o dejalo vacío.', saveFailed: 'No se pudo guardar el puntaje.',
      displaced: 'El Top 10 cambió antes de guardar tu puntaje.'
    },
    ca: {
      top: 'Top 10', newTop: 'Nou Top Score!', name: 'Nom', email: 'Email · opcional',
      emailNote: 'Privat · mai no es mostra públicament', save: 'Desa la puntuació', saving: 'Desant…',
      unavailable: 'Top 10 no disponible', invalidName: 'Fes servir un nom d’1 a 8 caràcters.',
      invalidEmail: 'Introdueix un email vàlid o deixa’l buit.', saveFailed: 'No s’ha pogut desar la puntuació.',
      displaced: 'El Top 10 ha canviat abans de desar la puntuació.'
    }
  };

  const style = document.createElement('style');
  style.textContent = `
    .leaderboard-panel{margin:14px auto 0;max-width:390px;text-align:left}
    .leaderboard-panel[hidden]{display:none}
    .leaderboard-title{text-align:center;margin:0 0 9px;font-size:15px;letter-spacing:.08em;text-transform:uppercase;color:var(--accent-2)}
    .leaderboard-form{display:grid;gap:9px;margin:10px 0 14px;padding:12px;background:#0b1018;border:1px solid #222c3d;border-radius:12px}
    .leaderboard-form label{display:grid;gap:4px;font-size:11px;font-weight:750;letter-spacing:.06em;text-transform:uppercase;color:var(--muted)}
    .leaderboard-form input{width:100%;border:1px solid #303b50;background:#101623;color:var(--text);border-radius:9px;padding:9px 10px;font:inherit;outline:none}
    .leaderboard-form input:focus{border-color:var(--accent-2);box-shadow:0 0 0 2px rgba(34,211,238,.12)}
    .leaderboard-note{font-size:10px;text-transform:none;letter-spacing:0;font-weight:500;color:var(--muted)}
    .leaderboard-error{min-height:16px;margin:0!important;font-size:11px;color:var(--bad)!important;text-align:center}
    .leaderboard-save{justify-self:center;min-width:130px}
    .leaderboard-list{list-style:none;margin:0;padding:0;display:grid;gap:4px;font-variant-numeric:tabular-nums}
    .leaderboard-row{display:grid;grid-template-columns:28px minmax(0,1fr) auto;gap:8px;align-items:center;padding:5px 8px;border-radius:8px;background:#0e131c;border:1px solid transparent;font-size:13px}
    .leaderboard-row.is-new{border-color:rgba(34,211,238,.5);background:#111c29;box-shadow:0 0 14px rgba(34,211,238,.08)}
    .leaderboard-rank{color:var(--muted);text-align:right}.leaderboard-name{font-weight:750;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.leaderboard-score{font-weight:800}
    .leaderboard-status{text-align:center!important;font-size:12px;margin:10px 0 0!important}
    @media(max-width:420px){.leaderboard-panel{max-width:100%}.leaderboard-form{padding:10px}.leaderboard-row{padding:4px 6px}}
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
  let lastGameOverScore = null;

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
    if (scores.length < 10) return true;
    return score > Number(scores[9]?.score || 0);
  }

  function renderRanking(scores, highlightPosition = null) {
    const c = text();
    const heading = document.createElement('h4');
    heading.className = 'leaderboard-title';
    heading.textContent = c.top;

    const list = document.createElement('ol');
    list.className = 'leaderboard-list';
    scores.slice(0, 10).forEach((entry, index) => {
      const row = document.createElement('li');
      row.className = 'leaderboard-row';
      if (highlightPosition === index + 1) row.classList.add('is-new');

      const rank = document.createElement('span');
      rank.className = 'leaderboard-rank';
      rank.textContent = `${index + 1}.`;

      const name = document.createElement('span');
      name.className = 'leaderboard-name';
      name.textContent = String(entry.name || '').slice(0, 32);

      const score = document.createElement('span');
      score.className = 'leaderboard-score';
      score.textContent = Number(entry.score || 0).toLocaleString(language());

      row.append(rank, name, score);
      list.appendChild(row);
    });

    return [heading, list];
  }

  function status(message, isError = false) {
    const p = document.createElement('p');
    p.className = 'leaderboard-status';
    if (isError) p.style.color = 'var(--bad)';
    p.textContent = message;
    return p;
  }

  function validName(value) {
    const length = Array.from(value.trim()).length;
    return length >= 1 && length <= 8 && !/[\u0000-\u001f\u007f]/u.test(value);
  }

  function validEmail(value) {
    if (!value) return true;
    return value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }

  function buildForm(score, scores) {
    const c = text();
    const form = document.createElement('form');
    form.className = 'leaderboard-form';
    form.noValidate = true;

    const formTitle = document.createElement('h4');
    formTitle.className = 'leaderboard-title';
    formTitle.textContent = c.newTop;

    const nameLabel = document.createElement('label');
    nameLabel.textContent = c.name;
    const nameInput = document.createElement('input');
    nameInput.type = 'text';
    nameInput.maxLength = 16;
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
    emailNote.textContent = c.emailNote;
    emailLabel.append(emailInput, emailNote);

    const error = document.createElement('p');
    error.className = 'leaderboard-error';

    const save = document.createElement('button');
    save.type = 'submit';
    save.className = 'control btn-accent leaderboard-save';
    save.textContent = c.save;

    form.append(formTitle, nameLabel, emailLabel, error, save);

    form.addEventListener('submit', async event => {
      event.preventDefault();
      const name = nameInput.value.trim();
      const email = emailInput.value.trim();
      error.textContent = '';

      if (!validName(name)) {
        error.textContent = c.invalidName;
        nameInput.focus();
        return;
      }
      if (!validEmail(email)) {
        error.textContent = c.invalidEmail;
        emailInput.focus();
        return;
      }

      save.disabled = true;
      save.textContent = c.saving;

      try {
        const response = await fetch(API_URL, {
          method: 'POST',
          headers: {'Content-Type': 'application/json', 'Accept': 'application/json'},
          credentials: 'same-origin',
          body: JSON.stringify({name, email, score})
        });
        const result = await response.json();
        if (!response.ok || !result?.ok) throw new Error('save_failed');

        panel.replaceChildren(...renderRanking(Array.isArray(result.scores) ? result.scores : [], result.accepted ? result.position : null));
        if (!result.accepted) panel.appendChild(status(c.displaced));
      } catch {
        error.textContent = c.saveFailed;
        save.disabled = false;
        save.textContent = c.save;
      }
    });

    return form;
  }

  async function showGameOverLeaderboard(force = false) {
    const score = parseScore();
    if (!force && lastGameOverScore === score && !panel.hidden) return;
    lastGameOverScore = score;
    panel.hidden = false;
    panel.replaceChildren(status('…'));
    const currentRequest = ++requestId;

    try {
      const response = await fetch(API_URL, {headers: {'Accept': 'application/json'}, credentials: 'same-origin'});
      const result = await response.json();
      if (currentRequest !== requestId) return;
      if (!response.ok || !result?.ok || !Array.isArray(result.scores)) throw new Error('load_failed');

      const scores = result.scores;
      const nodes = [];
      if (qualifies(score, scores)) nodes.push(buildForm(score, scores));
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
      showGameOverLeaderboard(true);
    } else {
      requestId += 1;
      lastGameOverScore = null;
      panel.hidden = true;
      panel.replaceChildren();
    }
  }

  new MutationObserver(sync).observe(title, {childList: true, characterData: true, subtree: true});
  new MutationObserver(sync).observe(overlay, {attributes: true, attributeFilter: ['aria-hidden', 'style']});
  sync();
})();
