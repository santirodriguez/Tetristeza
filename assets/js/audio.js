/* Original synthesized cues. No samples, network requests or playback scheduler. */
(() => {
  'use strict';
  const MAX_VOICES = 8, FADE = .012;
  let ctx = null, master = null, sfx = null, music = null;
  let enabled = false, active = false, visible = true, disposed = false, armed = false;
  let generation = 0, pendingResume = null, pendingSuspend = null, idleTimer = null, timerHost = window;
  const voices = new Set();

  // Original 16-bar arcade score, composed for Tetristeza (GPL-3.0).
  // Fixed C-major A/B phrases at 124 BPM; all note tails end before the loop seam.
  const BEAT = 60 / 124, RATE = 32000, LOOP_FRAMES = Math.round(64 * BEAT * RATE);
  let musicEnabled = false, musicStatus = 'off', musicBuffer = null, rendering = null;
  let musicVoice = null, retiringMusic = null, musicOffset = 0;
  function musicChanged() { safely(() => window.dispatchEvent(new Event('tetristeza:audiochange'))); }
  function status(next) { if (next !== musicStatus) { musicStatus = next; musicChanged(); } }
  function wantsMusic() { return !disposed && enabled && active && visible && musicEnabled && armed && ctx?.state === 'running'; }
  function stopMusic(immediate = false) {
    const voice = musicVoice;
    if (voice) {
      musicOffset = (voice.offset + Math.max(0, ctx.currentTime - voice.startedAt)) % musicBuffer.duration;
      musicVoice = null; retiringMusic = voice;
      safely(() => { ramp(voice.gain.gain, 0); voice.source.stop(ctx.currentTime + (immediate ? 0 : FADE)); });
    }
    if (immediate && retiringMusic) {
      const old = retiringMusic; retiringMusic = null;
      safely(() => old.source.stop()); safely(() => old.source.disconnect()); safely(() => old.gain.disconnect());
    }
  }
  function startMusic() {
    if (!wantsMusic() || !musicBuffer || musicVoice || retiringMusic) return;
    let source, gain;
    try {
      source = ctx.createBufferSource(); gain = ctx.createGain();
      source.buffer = musicBuffer; source.loop = true;
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(1, ctx.currentTime + .025);
      source.connect(gain); gain.connect(music);
      const voice = { source, gain, offset: musicOffset, startedAt: ctx.currentTime };
      musicVoice = voice;
      source.onended = () => {
        safely(() => source.disconnect()); safely(() => gain.disconnect());
        if (retiringMusic === voice) { retiringMusic = null; startMusic(); }
        if (musicVoice === voice) musicVoice = null;
      };
      source.start(0, musicOffset);
    } catch {
      musicVoice = null;
      safely(() => source?.stop()); safely(() => source?.disconnect()); safely(() => gain?.disconnect());
      status('unavailable');
    }
  }
  async function renderScore() {
    const Offline = window.OfflineAudioContext || window.webkitOfflineAudioContext;
    if (!Offline) throw Error('Offline audio unavailable');
    const offline = new Offline(1, LOOP_FRAMES, RATE);
    const noise = offline.createBuffer(1, RATE / 8, RATE), samples = noise.getChannelData(0);
    let seed = 163;
    for (let i = 0; i < samples.length; i++) {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      samples[i] = (seed / 2147483648 - 1);
    }
    const hz = midi => 440 * 2 ** ((midi - 69) / 12);
    function hit(beat, duration, amplitude, type, midi, endMidi = midi) {
      const start = beat * BEAT, envelope = offline.createGain();
      const source = type === 'noise' ? offline.createBufferSource() : offline.createOscillator();
      if (type === 'noise') source.buffer = noise;
      else {
        source.type = type;
        source.frequency.setValueAtTime(hz(midi), start);
        source.frequency.exponentialRampToValueAtTime(hz(endMidi), start + duration);
      }
      envelope.gain.setValueAtTime(0, start);
      envelope.gain.linearRampToValueAtTime(amplitude, start + .003);
      envelope.gain.exponentialRampToValueAtTime(.0001, start + duration - .003);
      envelope.gain.linearRampToValueAtTime(0, start + duration);
      source.connect(envelope); envelope.connect(offline.destination);
      source.start(start); source.stop(start + duration);
    }
    const roots = [48, 45, 41, 43];
    const phrases = [
      [72, 76, 79, 76, 74, 72, 76, 79],
      [76, 72, 69, 72, 76, 79, 76, 72],
      [77, 76, 72, 69, 72, 77, 79, 77],
      [74, 71, 67, 71, 74, 79, 77, 74]
    ];
    for (let bar = 0; bar < 16; bar++) {
      const at = bar * 4, root = roots[bar % 4], phrase = phrases[bar % 4];
      for (let step = 0; step < 8; step++) {
        // Second half answers the opening; rests leave room for game feedback.
        if (step !== 3 && !(bar % 4 === 3 && step === 7)) {
          const pitch = phrase[(step + (bar >= 8 ? 2 : 0)) % 8] + (bar >= 12 && step === 6 ? 12 : 0);
          hit(at + step / 2, .18, step % 2 ? .09 : .12, 'triangle', pitch);
        }
        hit(at + step / 2, .035, step % 2 ? .028 : .018, 'noise');
      }
      for (let beat = 0; beat < 4; beat++) {
        hit(at + beat, .19, .14, 'triangle', root + (beat % 2 ? 12 : 0));
        if (beat % 2 === 0) hit(at + beat, .16, .24, 'sine', 48, 28);
        else { hit(at + beat, .10, .09, 'noise'); hit(at + beat, .065, .06, 'triangle', 50, 38); }
      }
      // Bounded graph setup yields between four-bar groups, never on the game rAF.
      if (bar % 4 === 3 && bar < 15) await new Promise(resolve => window.setTimeout(resolve, 0));
    }
    return offline.startRendering();
  }
  function prepareMusic() {
    if (!wantsMusic() || musicStatus === 'unavailable') return;
    if (musicBuffer) { startMusic(); return; }
    if (rendering) return;
    status('pending');
    rendering = renderScore().then(buffer => {
      if (disposed) return;
      musicBuffer = buffer; status('ready'); startMusic();
    }).catch(() => { if (!disposed) status('unavailable'); }).finally(() => { rendering = null; });
  }
  function restart() { stop(); musicOffset = 0; }
  function getMusicState() { return { status: musicStatus, playing: Boolean(musicVoice) && wantsMusic() }; }

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
      stopMusic(true);
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
    stopMusic(ctx.state !== 'running');
    safely(() => ramp(master.gain, 0));
    cancelVoices(ctx.state !== 'running');
    idleAfter();
  }
  function createContext() {
    if (ctx?.state === 'closed') {
      stopMusic(true);
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
          stopMusic(true);
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
    if (disposed || !enabled || !active || !visible) return;
    if (!createContext()) { if (musicEnabled) status('unavailable'); return; }
    clearIdle();
    const context = ctx, token = generation;
    if (context.state === 'running' && pendingSuspend?.context !== context) {
      armed = true;
      safely(() => ramp(master.gain, 1));
      prepareMusic();
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
        if (context.state === 'running') { armed = true; ramp(master.gain, 1); prepareMusic(); }
      }).catch(() => { if (pendingResume === request) { pendingResume = null; if (musicEnabled) status('unavailable'); } });
    } catch { pendingResume = null; if (musicEnabled) status('unavailable'); }
  }
  function setState(state) {
    const changed = enabled !== state.enabled || active !== state.active || visible !== state.visible;
    enabled = state.enabled; active = state.active; visible = state.visible;
    const nextMusic = Boolean(state.musicEnabled);
    if (nextMusic !== musicEnabled) {
      musicEnabled = nextMusic;
      if (!musicEnabled) stopMusic(ctx?.state !== 'running');
      else if (musicStatus === 'unavailable') status(musicBuffer ? 'ready' : 'off');
    }
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
    disposed = true; stop(); clearIdle(); cancelVoices(true); stopMusic(true); musicBuffer = null;
    if (ctx) { ctx.onstatechange = null; safely(() => ignore(ctx.close())); }
    for (const node of [sfx, music, master]) safely(() => node?.disconnect());
  }
  // Audio is optional: no public operation may throw into the game loop.
  window.TetristezaAudio = Object.freeze(Object.fromEntries(
    Object.entries({ setState, activate, play, stop, restart, getMusicState, dispose }).map(([name, fn]) => [name, (...args) => safely(() => fn(...args))])
  ));
  window.addEventListener('pagehide', event => { if (event.persisted) stop(); else dispose(); });
})();
