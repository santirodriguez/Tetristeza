// Run with: node --test tests/audio.test.cjs (no dependencies).
const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname, '../assets/js/audio.js'), 'utf8');
const flush = () => new Promise(resolve => setImmediate(resolve));

function fixture({ unavailable = false, throws = false, resume = 'ok', offline = false } = {}) {
  let time = 0, nextTimer = 0;
  const timers = new Map(), contexts = [], renders = [], events = new Map();
  const host = () => ({
    setTimeout(fn, delay) { const id = ++nextTimer; timers.set(id, { fn, at: time + delay }); return id; },
    clearTimeout(id) { timers.delete(id); }
  });
  class Param {
    constructor() { this.value = 0; this.events = []; }
    setValueAtTime(v, t) { this.value = v; this.events.push(['set', v, t]); }
    linearRampToValueAtTime(v, t) { this.events.push(['linear', v, t]); }
    exponentialRampToValueAtTime(v, t) { this.events.push(['exponential', v, t]); }
    cancelScheduledValues(t) { this.events.push(['cancel', t]); }
    cancelAndHoldAtTime(t) { this.events.push(['hold', t]); }
  }
  class Context {
    constructor() {
      if (throws) throw Error('unavailable hardware');
      this.state = 'suspended'; this.destination = {}; this.oscillators = []; this.gains = [];
      this.sources = []; this.requests = []; this.resumes = 0; contexts.push(this);
    }
    get currentTime() { return time / 1000; }
    stateTo(state) { this.state = state; this.onstatechange?.(); }
    resume() {
      this.resumes++;
      if (resume === 'reject') return Promise.reject(Error('blocked'));
      if (resume === 'defer') return new Promise(resolve => this.requests.push(() => { this.stateTo('running'); resolve(); }));
      this.stateTo('running'); return Promise.resolve();
    }
    suspend() { this.stateTo('suspended'); return Promise.resolve(); }
    close() { this.stateTo('closed'); return Promise.resolve(); }
    createBufferSource() {
      const node = { connect() {}, disconnect() { this.disconnected = true; }, start(at, offset) { this.offset = offset; }, stop(at = time / 1000) { this.stopAt = at; } };
      this.sources.push(node); return node;
    }
    createGain() {
      const node = { gain: new Param(), connect() {}, disconnect() { this.disconnected = true; } };
      this.gains.push(node); return node;
    }
    createOscillator() {
      const node = {
        frequency: new Param(), connect() {}, disconnect() { this.disconnected = true; },
        start(at) { this.startAt = at; }, stop(at = time / 1000) { this.stopAt = at; }
      };
      this.oscillators.push(node); return node;
    }
  }
  class Offline {
    constructor(channels, length, rate) { this.destination = {}; this.oscillators = []; this.gains = []; this.sources = []; this.buffer = { duration: length / rate, length, sampleRate: rate, numberOfChannels: channels }; renders.push(this); }
    createBuffer(channels, length) { return { getChannelData: () => new Float32Array(length) }; }
    createGain() { return Context.prototype.createGain.call(this); }
    createOscillator() { return Context.prototype.createOscillator.call(this); }
    createBufferSource() { return Context.prototype.createBufferSource.call(this); }
    startRendering() { return new Promise((resolve, reject) => { this.finish = () => resolve(this.buffer); this.fail = () => reject(Error('render failed')); }); }
  }
  const window = { ...host(), OfflineAudioContext: offline ? Offline : undefined, AudioContext: unavailable ? undefined : Context, addEventListener: (name, fn) => events.set(name, fn) };
  vm.runInNewContext(source, { window });
  const service = window.TetristezaAudio;
  let state = { enabled: true, active: true, visible: true, host: window };
  function set(patch = {}) { Object.assign(state, patch); service.setState(state); }
  function advance(ms) {
    time += ms;
    for (const c of contexts) for (const voice of [...c.oscillators, ...c.sources]) {
      if (!voice.ended && voice.stopAt <= c.currentTime) { voice.ended = true; voice.onended?.(); }
    }
    for (const [id, timer] of timers) if (timer.at <= time) { timers.delete(id); timer.fn(); }
  }
  return { service, contexts, renders, timers, events, set, advance, host, window };
}

test('load, Ready and persisted mute never construct a context', () => {
  const f = fixture(); assert.equal(f.contexts.length, 0);
  f.set({ active: false }); f.service.activate();
  f.set({ active: true, enabled: false }); f.service.activate(); f.service.play('drop');
  assert.equal(f.contexts.length, 0);
});

test('audio construction failures and rejected resumes are harmless and retryable', async () => {
  for (const options of [{ unavailable: true }, { throws: true }, { resume: 'reject' }]) {
    const f = fixture(options); f.set();
    f.service.activate(); f.service.play('drop'); await flush();
    f.service.activate(); await flush();
    assert.ok(f.contexts.every(c => c.oscillators.length === 0));
    if (f.contexts.length) assert.equal(f.contexts[0].resumes, 2);
  }
});

test('rapid cues stay bounded, end and disconnect; ordinary movement is silent', async () => {
  const f = fixture(); f.set(); f.service.activate(); await flush();
  const c = f.contexts[0];
  for (let i = 0; i < 50; i++) f.service.play('hold');
  assert.equal(c.oscillators.filter(v => !v.disconnected).length, 8);
  const count = c.oscillators.length; f.service.play('move'); assert.equal(c.oscillators.length, count);
  f.advance(200); assert.ok(c.oscillators.every(v => v.disconnected));
  assert.equal(f.contexts.length, 1);
});

test('mute ramps and cancels all active/future notes within 30ms, then suspends', async () => {
  const f = fixture(); f.set(); f.service.activate(); await flush();
  f.service.play('clear', { count: 4, combo: 2, levelUp: true });
  const c = f.contexts[0]; f.set({ enabled: false });
  assert.ok(c.oscillators.every(v => v.stopAt <= .03));
  assert.ok(c.gains[0].gain.events.some(e => e[0] === 'linear' && e[1] === 0 && e[2] <= .03));
  f.advance(25); assert.equal(c.state, 'suspended');
  assert.ok(c.oscillators.every(v => v.disconnected));
  f.set({ enabled: true }); f.service.activate(); await flush();
  assert.equal(c.oscillators.length, 5, 'unlock must not replay canceled cues');
  f.service.play('rotate'); assert.equal(c.oscillators.length, 6);
});

test('pause and hidden host stop processing; visibility return alone never resumes', async () => {
  const f = fixture(); f.set(); f.service.activate(); await flush();
  for (const patch of [{ active: false }, { visible: false }]) {
    f.set(patch); f.advance(25); assert.equal(f.contexts[0].state, 'suspended');
    f.set({ active: true, visible: true }); f.service.play('hold');
    assert.equal(f.contexts[0].state, 'suspended');
    f.service.activate(); await flush();
  }
});

test('late resume cannot defeat mute/pause/disposal or replay earlier cues', async () => {
  for (const action of ['mute', 'pause', 'dispose']) {
    const f = fixture({ resume: 'defer' }); f.set(); f.service.activate();
    f.service.play('drop');
    if (action === 'dispose') f.service.dispose();
    else f.set(action === 'mute' ? { enabled: false } : { active: false });
    f.contexts[0].requests[0](); await flush(); f.advance(25);
    assert.notEqual(f.contexts[0].state, 'running');
    assert.equal(f.contexts[0].oscillators.length, 0);
  }
});

test('rapid off/on owns a newer resume and a stale completion cannot silence it', async () => {
  const f = fixture({ resume: 'defer' }); f.set(); f.service.activate();
  f.set({ enabled: false }); f.set({ enabled: true }); f.service.activate();
  const c = f.contexts[0]; assert.equal(c.requests.length, 2);
  c.requests[1](); await flush(); c.requests[0](); await flush();
  f.advance(30); f.service.play('rotate');
  assert.equal(c.state, 'running'); assert.equal(c.oscillators.length, 1);
});

test('interruption drops voices, waits for gesture; closed context can be replaced', async () => {
  const f = fixture(); f.set(); f.service.activate(); await flush();
  const c = f.contexts[0]; f.service.play('clear', { count: 4 }); c.stateTo('interrupted');
  assert.ok(c.oscillators.every(v => v.disconnected));
  f.service.play('drop'); assert.equal(c.oscillators.length, 4);
  c.stateTo('running'); f.service.play('drop'); assert.equal(c.oscillators.length, 4);
  f.service.activate(); f.service.play('rotate'); assert.equal(c.oscillators.length, 5);
  c.stateTo('closed'); f.service.activate(); await flush();
  assert.equal(f.contexts.length, 2); assert.equal(f.contexts.filter(c => c.state !== 'closed').length, 1);
});

test('Game Over has one finite tail, state refresh cannot replay it', async () => {
  const f = fixture(); f.set(); f.service.activate(); await flush();
  f.set({ active: false }); f.service.play('gameOver');
  const c = f.contexts[0]; assert.equal(c.oscillators.length, 5);
  f.set(); f.advance(850); assert.equal(c.state, 'suspended');
  f.set(); assert.equal(c.oscillators.length, 5); assert.equal(f.timers.size, 0);
});

test('detached host keeps one engine and migrates idle cleanup; unload closes it', async () => {
  const f = fixture(); f.set(); f.service.activate(); await flush();
  f.set({ host: f.host() }); f.service.play('hold');
  assert.equal(f.contexts.length, 1); assert.equal(f.contexts[0].oscillators.length, 2);
  f.set({ active: false }); f.set({ host: f.window }); f.advance(30);
  assert.equal(f.contexts[0].state, 'suspended');
  f.events.get('pagehide')({ persisted: false });
  assert.equal(f.contexts[0].state, 'closed'); assert.equal(f.timers.size, 0);
  f.set({ active: true }); f.service.activate(); assert.equal(f.contexts.length, 1);
});

test('gesture during an in-flight suspend queues resume even while state still reads running', async () => {
  const f = fixture(); f.set(); f.service.activate(); await flush();
  const c = f.contexts[0]; let finishSuspend;
  c.suspend = () => new Promise(resolve => { finishSuspend = () => { c.stateTo('suspended'); resolve(); }; });
  f.set({ active: false }); f.advance(25);
  assert.equal(c.state, 'running');
  const before = c.resumes;
  // Native resume queues after suspend; model that ordering explicitly.
  c.resume = () => { c.resumes++; return new Promise(resolve => {
    const finish = finishSuspend; finishSuspend = () => { finish(); c.stateTo('running'); resolve(); };
  }); };
  f.set({ active: true }); f.service.activate();
  assert.equal(c.resumes, before + 1);
  finishSuspend(); await flush(); f.service.play('rotate');
  assert.equal(c.oscillators.length, 1);
});

test('partial node creation failure releases the oscillator and keeps the service usable', async () => {
  const f = fixture(); f.set(); f.service.activate(); await flush();
  const c = f.contexts[0], createGain = c.createGain;
  c.createGain = () => { throw Error('allocation failed'); };
  f.service.play('rotate'); assert.equal(c.oscillators[0].disconnected, true);
  c.createGain = createGain; f.service.play('rotate'); assert.equal(c.oscillators.length, 2);
});


async function startRender(f) {
  f.set({ musicEnabled: true }); f.service.activate(); await flush();
  for (let i = 0; i < 3; i++) { f.advance(1); await flush(); }
  assert.equal(f.renders.length, 1);
  assert.equal(typeof f.renders[0].finish, 'function');
}

test('music is opt-in and rendered once; pending work deduplicates across toggles', async () => {
  const f = fixture({ offline: true }); f.set(); f.service.activate(); await flush();
  assert.equal(f.renders.length, 0);
  await startRender(f);
  f.set({ musicEnabled: false }); f.set({ musicEnabled: true }); f.service.activate();
  assert.equal(f.renders.length, 1);
  f.renders[0].finish(); await flush();
  assert.equal(f.contexts[0].sources.length, 1);
  assert.ok(f.renders[0].buffer.length * 4 <= 4 * 1024 * 1024);
  f.set({ musicEnabled: false }); f.set({ musicEnabled: true }); f.service.activate();
  assert.equal(f.contexts[0].sources.length, 1, 'retiring source must end before replacement');
  f.advance(20); assert.equal(f.contexts[0].sources.length, 2);
  assert.equal(f.contexts[0].sources.filter(s => !s.disconnected).length, 1);
  assert.equal(f.renders.length, 1);
});

test('late rendering only caches after off, mute, pause, hidden, game end or disposal', async () => {
  for (const patch of [{ musicEnabled: false }, { enabled: false }, { active: false }, { visible: false }, 'dispose']) {
    const f = fixture({ offline: true }); await startRender(f);
    if (patch === 'dispose') f.service.dispose(); else f.set(patch);
    f.renders[0].finish(); await flush();
    assert.equal(f.contexts[0].sources.length, 0);
  }
});

test('pause remembers offset, restart resets it, and host transfer does not recreate music', async () => {
  const f = fixture({ offline: true }); await startRender(f); f.renders[0].finish(); await flush();
  const c = f.contexts[0]; f.advance(1500);
  f.set({ host: f.host() }); assert.equal(c.sources.length, 1);
  f.set({ active: false }); f.advance(30); await flush();
  f.set({ active: true }); f.service.activate(); await flush();
  assert.equal(c.sources[1].offset, 1.5);
  f.service.restart(); f.service.activate(); f.advance(20); await flush();
  assert.equal(c.sources[2].offset, 0);
  assert.equal(f.renders.length, 1);
});

test('render failure is reported without a retry loop and a new opt-in may retry', async () => {
  const f = fixture({ offline: true }); await startRender(f); f.renders[0].fail(); await flush();
  assert.equal(f.service.getMusicState().status, 'unavailable');
  f.service.activate(); await flush(); assert.equal(f.renders.length, 1);
  f.set({ musicEnabled: false }); f.set({ musicEnabled: true }); f.service.activate(); await flush();
  assert.equal(f.renders.length, 2);
});

test('missing offline support leaves SFX usable', async () => {
  const f = fixture(); f.set({ musicEnabled: true }); f.service.activate(); await flush();
  assert.equal(f.service.getMusicState().status, 'unavailable');
  f.service.play('rotate'); assert.equal(f.contexts[0].oscillators.length, 1);
});

test('restart during rendering uses the latest session and closed-context recovery reuses the buffer', async () => {
  const f = fixture({ offline: true }); await startRender(f);
  f.service.restart(); f.service.activate(); f.renders[0].finish(); await flush();
  assert.equal(f.contexts[0].sources[0].offset, 0);
  f.contexts[0].stateTo('closed'); f.service.activate(); await flush();
  assert.equal(f.contexts.length, 2); assert.equal(f.renders.length, 1);
  assert.equal(f.contexts[0].sources[0].disconnected, true);
  assert.equal(f.contexts[1].sources.length, 1);
  f.set({ active: false }); f.service.play('gameOver'); f.advance(850);
  assert.equal(f.contexts[1].sources[0].disconnected, true);
  assert.equal(f.contexts[1].state, 'suspended');
});
