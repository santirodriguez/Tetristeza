/* Original synthesized cues. No samples, network requests or playback scheduler. */
(() => {
  'use strict';
  const MAX_VOICES = 8, FADE = .012;
  let ctx = null, master = null, sfx = null, music = null;
  let enabled = false, active = false, visible = true, disposed = false, armed = false;
  let generation = 0, pendingResume = null, pendingSuspend = null, idleTimer = null, timerHost = window;
  const voices = new Set();

  function safely(fn) { try { return fn(); } catch {} }
  function ignore(promise) { promise?.catch?.(() => {}); }
  function clearIdle() {
    if (idleTimer !== null) timerHost.clearTimeout(idleTimer);
    idleTimer = null;
  }
  function ramp(param, value, duration = FADE) {
    const now = ctx.currentTime;
    if (param.cancelAndHoldAtTime) param.cancelAndHoldAtTime(now);
    else { param.cancelScheduledValues(now); param.setValueAtTime(param.value, now); }
    param.linearRampToValueAtTime(value, now + duration);
  }
  function remove(voice) {
    safely(() => voice.osc.disconnect());
    safely(() => voice.gain.disconnect());
    voices.delete(voice);
  }
  function cancelVoices(immediate = false) {
    for (const voice of voices) {
      safely(() => {
        if (!immediate) ramp(voice.gain.gain, 0);
        voice.osc.stop(ctx.currentTime + (immediate ? 0 : FADE));
      });
      if (immediate) remove(voice);
    }
  }
  function idleAfter(milliseconds = 20) {
    clearIdle();
    const token = generation, context = ctx;
    idleTimer = timerHost.setTimeout(() => {
      idleTimer = null;
      if (token !== generation || context !== ctx) return;
      armed = false;
      cancelVoices(true);
      safely(() => { master.gain.value = 0; });
      safely(() => {
        if (context?.state === 'closed') return;
        const request = { context };
        pendingSuspend = request;
        Promise.resolve(context.suspend()).catch(() => {}).then(() => {
          if (pendingSuspend === request) pendingSuspend = null;
        });
      });
    }, milliseconds);
  }
  function stop() {
    generation++;
    armed = false;
    clearIdle();
    if (!ctx) return;
    safely(() => ramp(master.gain, 0));
    cancelVoices(ctx.state !== 'running');
    idleAfter();
  }
  function createContext() {
    if (ctx?.state === 'closed') {
      cancelVoices(true);
      ctx.onstatechange = null;
      ctx = null;
    }
    if (ctx) return true;
    const Constructor = window.AudioContext || window.webkitAudioContext;
    if (!Constructor) return false;
    try {
      ctx = new Constructor();
      master = ctx.createGain(); sfx = ctx.createGain(); music = ctx.createGain();
      master.gain.value = 0; sfx.gain.value = .65; music.gain.value = .2;
      sfx.connect(master); music.connect(master); master.connect(ctx.destination);
      ctx.onstatechange = () => {
        if (ctx.state !== 'running') {
          armed = false;
          cancelVoices(true);
          safely(() => { master.gain.cancelScheduledValues(ctx.currentTime); master.gain.value = 0; });
        }
      };
      return true;
    } catch {
      safely(() => ignore(ctx?.close()));
      ctx = null;
      return false;
    }
  }
  // Only called synchronously from a game input gesture. Never queue missed cues.
  function activate() {
    if (disposed || !enabled || !active || !visible || !createContext()) return;
    clearIdle();
    const context = ctx, token = generation;
    if (context.state === 'running' && pendingSuspend?.context !== context) {
      armed = true;
      safely(() => ramp(master.gain, 1));
      return;
    }
    if (pendingResume?.context === context && pendingResume.token === token) return;
    const request = { context, token };
    pendingResume = request;
    try {
      Promise.resolve(context.resume()).then(() => {
        if (pendingResume === request) pendingResume = null;
        if (disposed || context !== ctx || token !== generation || !enabled || !active || !visible) {
          // A newer gesture owns the context if the generation changed back to active.
          if (context === ctx && (!enabled || !active || !visible || disposed)) stop();
          return;
        }
        if (context.state === 'running') { armed = true; ramp(master.gain, 1); }
      }).catch(() => { if (pendingResume === request) pendingResume = null; });
    } catch { pendingResume = null; }
  }
  function setState(state) {
    const changed = enabled !== state.enabled || active !== state.active || visible !== state.visible;
    enabled = state.enabled; active = state.active; visible = state.visible;
    if (state.host && state.host !== timerHost) {
      clearIdle(); timerHost = state.host;
      if (!active || !enabled || !visible) stop();
    }
    if (changed && (!enabled || !active || !visible)) stop();
  }
  // One voice is one finite oscillator + envelope; stealing disconnects immediately.
  function note(frequency, duration, type, gain, delay = 0, endFrequency = frequency) {
    while (voices.size >= MAX_VOICES) {
      const oldest = voices.values().next().value;
      safely(() => oldest.osc.stop()); remove(oldest);
    }
    let voice, osc, envelope;
    try {
      osc = ctx.createOscillator(); envelope = ctx.createGain();
      voice = { osc, gain: envelope }; voices.add(voice);
      const start = ctx.currentTime + delay, end = start + duration;
      osc.type = type;
      osc.frequency.setValueAtTime(frequency, start);
      osc.frequency.exponentialRampToValueAtTime(endFrequency, end);
      envelope.gain.setValueAtTime(0, ctx.currentTime);
      envelope.gain.setValueAtTime(0, start);
      envelope.gain.linearRampToValueAtTime(gain, start + .004);
      envelope.gain.exponentialRampToValueAtTime(.0001, end - .004);
      envelope.gain.linearRampToValueAtTime(0, end);
      osc.connect(envelope); envelope.connect(sfx);
      osc.onended = () => remove(voice);
      osc.start(start); osc.stop(end);
    } catch { safely(() => osc?.stop()); safely(() => osc?.disconnect()); safely(() => envelope?.disconnect()); if (voice) voices.delete(voice); }
  }
  function play(cue, details = {}) {
    const ending = cue === 'gameOver';
    if (disposed || !enabled || !visible || !ctx || ctx.state !== 'running' || (!ending && (!active || !armed))) return;
    if (ending) {
      clearIdle(); cancelVoices();
      safely(() => ramp(master.gain, 1));
      note(294, .14, 'triangle', .065, 0, 220);
      note(196, .21, 'sine', .09, .10, 98);
      idleAfter(340);
    } else if (cue === 'rotate') note(520, .055, 'triangle', .055, 0, 780);
    else if (cue === 'hold') {
      note(330, .075, 'sine', .07);
      note(494, .075, 'triangle', .05, .045);
    } else if (cue === 'drop') {
      note(180, .12, 'sine', .12, 0, 55);
      note(640, .035, 'triangle', .045, 0, 160);
    } else if (cue === 'lock') note(240, .065, 'triangle', .055, 0, 120);
    else if (cue === 'clear') {
      const count = Math.max(1, Math.min(4, details.count | 0));
      const pitches = [523.25, 659.25, 783.99, 1046.5];
      const lift = details.levelUp ? 1.25 : details.backToBack ? 1.125 : 1;
      const length = count + (details.combo > 0 || details.levelUp ? 1 : 0);
      for (let i = 0; i < length; i++) {
        note(pitches[Math.min(i, 3)] * lift, .11, i % 2 ? 'sine' : 'triangle', .075, i * .04);
      }
    }
  }
  function dispose() {
    disposed = true; stop(); clearIdle(); cancelVoices(true);
    if (ctx) { ctx.onstatechange = null; safely(() => ignore(ctx.close())); }
    for (const node of [sfx, music, master]) safely(() => node?.disconnect());
  }
  // Audio is optional: no public operation may throw into the game loop.
  window.TetristezaAudio = Object.freeze(Object.fromEntries(
    Object.entries({ setState, activate, play, stop, dispose }).map(([name, fn]) => [name, (...args) => safely(() => fn(...args))])
  ));
  window.addEventListener('pagehide', event => { if (event.persisted) stop(); else dispose(); });
})();
