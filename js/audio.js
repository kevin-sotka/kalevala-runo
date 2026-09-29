// audio.js — WebAudio synthesized ambient drone + event stings
// Off by default; started only after a user gesture. Safe to load before AudioContext exists.

var RunoAudio = (function () {
  var ctx = null;
  var masterGain = null;
  var droneNodes = [];
  var muted = false;
  var started = false;
  var currentEpisode = 0;

  function createCtx() {
    if (ctx) return true;
    try {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;
      ctx = new AC();
      masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0.0, ctx.currentTime);
      masterGain.connect(ctx.destination);
      return true;
    } catch (e) {
      ctx = null;
      return false;
    }
  }

  function start(episode) {
    if (!createCtx()) return;
    currentEpisode = episode === undefined ? 1 : episode;
    if (ctx.state === 'suspended') {
      ctx.resume().catch(function () {});
    }
    stopDrone();
    buildDrone(currentEpisode);
    if (!muted) {
      masterGain.gain.cancelScheduledValues(ctx.currentTime);
      masterGain.gain.setValueAtTime(masterGain.gain.value, ctx.currentTime);
      masterGain.gain.linearRampToValueAtTime(0.18, ctx.currentTime + 2.0);
    }
    started = true;
    startMusic(currentEpisode);
  }

  function buildDrone(episode) {
    if (!ctx) return;
    droneNodes = [];
    // Base frequencies: Ep1 cold sea = D minor feel; Ep2 forge = lower, darker
    // Ep3 winter = high open fifths; Ep4 kantele = warm D; Ep5 Kullervo = low, uneasy
    var DRONES = {
      1: [73.4, 110, 146.8, 196],
      2: [55, 82.4, 110, 146.8],
      3: [110, 164.8, 220, 329.6],
      4: [73.4, 110, 146.8, 220],
      5: [41.2, 43.7, 82.4, 123.5]
    };
    var baseFreqs = DRONES[episode] || DRONES[1];

    baseFreqs.forEach(function (freq, i) {
      var osc = ctx.createOscillator();
      var gain = ctx.createGain();
      var filter = ctx.createBiquadFilter();

      osc.type = i % 2 === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      // Slow detune wobble for organic feel
      osc.detune.setValueAtTime(0, ctx.currentTime);
      var wobbleLfo = ctx.createOscillator();
      var wobbleGain = ctx.createGain();
      wobbleLfo.type = 'sine';
      wobbleLfo.frequency.setValueAtTime(0.07 + i * 0.03, ctx.currentTime);
      wobbleGain.gain.setValueAtTime(3 + i * 2, ctx.currentTime);
      wobbleLfo.connect(wobbleGain);
      wobbleGain.connect(osc.detune);
      wobbleLfo.start();

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(400 + i * 100, ctx.currentTime);
      filter.Q.setValueAtTime(0.8, ctx.currentTime);

      var vol = (episode === 2 || episode === 5) ? 0.12 - i * 0.02 : 0.10 - i * 0.015;
      if (episode === 3) vol = 0.07 - i * 0.012;
      gain.gain.setValueAtTime(vol, ctx.currentTime);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(masterGain);
      osc.start();

      droneNodes.push(osc, wobbleLfo, gain, filter, wobbleGain);
    });
  }

  function stopDrone() {
    droneNodes.forEach(function (node) {
      try { node.stop(); } catch (e) {}
      try { node.disconnect(); } catch (e) {}
    });
    droneNodes = [];
  }

  function playStingRune() {
    if (!ctx || muted) return;
    try {
      var t = ctx.currentTime;
      var osc = ctx.createOscillator();
      var env = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(528, t);
      osc.frequency.linearRampToValueAtTime(660, t + 0.3);
      env.gain.setValueAtTime(0, t);
      env.gain.linearRampToValueAtTime(0.25, t + 0.05);
      env.gain.exponentialRampToValueAtTime(0.001, t + 1.2);
      osc.connect(env);
      env.connect(masterGain);
      osc.start(t);
      osc.stop(t + 1.3);
    } catch (e) {}
  }

  function playStingEgg() {
    if (!ctx || muted) return;
    try {
      var t = ctx.currentTime;
      // Crack: short noise burst
      var bufSize = ctx.sampleRate * 0.1;
      var buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
      var data = buf.getChannelData(0);
      for (var i = 0; i < bufSize; i++) data[i] = (Math.random() * 2 - 1) * 0.4;
      var noise = ctx.createBufferSource();
      noise.buffer = buf;
      var nEnv = ctx.createGain();
      nEnv.gain.setValueAtTime(0.3, t);
      nEnv.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
      noise.connect(nEnv);
      nEnv.connect(masterGain);
      noise.start(t);

      // Rising tone "birth"
      var rise = ctx.createOscillator();
      var rEnv = ctx.createGain();
      rise.type = 'sine';
      rise.frequency.setValueAtTime(200, t + 0.05);
      rise.frequency.exponentialRampToValueAtTime(880, t + 1.0);
      rEnv.gain.setValueAtTime(0.0, t + 0.05);
      rEnv.gain.linearRampToValueAtTime(0.2, t + 0.2);
      rEnv.gain.exponentialRampToValueAtTime(0.001, t + 1.2);
      rise.connect(rEnv);
      rEnv.connect(masterGain);
      rise.start(t + 0.05);
      rise.stop(t + 1.3);
    } catch (e) {}
  }

  function playStingForge() {
    if (!ctx || muted) return;
    try {
      var t = ctx.currentTime;
      [110, 165, 220].forEach(function (freq, i) {
        var osc = ctx.createOscillator();
        var env = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, t + i * 0.06);
        env.gain.setValueAtTime(0.18, t + i * 0.06);
        env.gain.exponentialRampToValueAtTime(0.001, t + i * 0.06 + 0.8);
        osc.connect(env);
        env.connect(masterGain);
        osc.start(t + i * 0.06);
        osc.stop(t + i * 0.06 + 0.9);
      });
    } catch (e) {}
  }

  function playStingStorm() {
    if (!ctx || muted) return;
    try {
      var t = ctx.currentTime;
      var bufSize = ctx.sampleRate * 0.5;
      var buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
      var data = buf.getChannelData(0);
      for (var i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;
      var noise = ctx.createBufferSource();
      noise.buffer = buf;
      var filt = ctx.createBiquadFilter();
      filt.type = 'bandpass';
      filt.frequency.setValueAtTime(800, t);
      filt.frequency.exponentialRampToValueAtTime(200, t + 0.5);
      filt.Q.setValueAtTime(2, t);
      var nEnv = ctx.createGain();
      nEnv.gain.setValueAtTime(0.4, t);
      nEnv.gain.exponentialRampToValueAtTime(0.001, t + 0.55);
      noise.connect(filt);
      filt.connect(nEnv);
      nEnv.connect(masterGain);
      noise.start(t);
    } catch (e) {}
  }

  function playStingSampoShatter() {
    if (!ctx || muted) return;
    try {
      var t = ctx.currentTime;
      // Big crash + shimmer
      var bufSize = ctx.sampleRate * 0.3;
      var buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
      var data = buf.getChannelData(0);
      for (var i = 0; i < bufSize; i++) data[i] = (Math.random() * 2 - 1);
      var noise = ctx.createBufferSource();
      noise.buffer = buf;
      var nEnv = ctx.createGain();
      nEnv.gain.setValueAtTime(0.5, t);
      nEnv.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
      noise.connect(nEnv);
      nEnv.connect(masterGain);
      noise.start(t);

      // High shimmer
      [1320, 1760, 2200, 2640].forEach(function (freq, i) {
        var osc = ctx.createOscillator();
        var env = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t + i * 0.04);
        env.gain.setValueAtTime(0.12, t + i * 0.04);
        env.gain.exponentialRampToValueAtTime(0.001, t + i * 0.04 + 2.5);
        osc.connect(env);
        env.connect(masterGain);
        osc.start(t + i * 0.04);
        osc.stop(t + i * 0.04 + 2.6);
      });
    } catch (e) {}
  }


  // ── Kantele: Karplus-Strong plucked string ───────────────────────────
  // Five-string kantele tuned to the traditional D E F G A.
  var KANTELE = [293.66, 329.63, 349.23, 392.0, 440.0];
  var pluckCache = {};

  function pluckBuffer(freq) {
    var key = Math.round(freq * 10);
    if (pluckCache[key]) return pluckCache[key];
    var sr = ctx.sampleRate;
    var len = Math.floor(sr * 2.4);
    var buf = ctx.createBuffer(1, len, sr);
    var out = buf.getChannelData(0);
    var period = Math.max(2, Math.round(sr / freq));
    var ring = new Float32Array(period);
    for (var i = 0; i < period; i++) ring[i] = Math.random() * 2 - 1;
    var idx = 0, prev = 0;
    for (var n = 0; n < len; n++) {
      var cur = ring[idx];
      var next = 0.5 * (cur + prev) * 0.9965;
      prev = cur;
      ring[idx] = next;
      out[n] = cur;
      idx = (idx + 1) % period;
    }
    pluckCache[key] = buf;
    return buf;
  }

  function pluck(freq, vol, when, dest) {
    if (!ctx || muted) return;
    try {
      var t = when || ctx.currentTime;
      var src = ctx.createBufferSource();
      src.buffer = pluckBuffer(freq);
      var tone = ctx.createBiquadFilter();
      tone.type = 'lowpass';
      tone.frequency.setValueAtTime(3200, t);
      var env = ctx.createGain();
      env.gain.setValueAtTime(vol || 0.35, t);
      env.gain.exponentialRampToValueAtTime(0.001, t + 2.3);
      src.connect(tone);
      tone.connect(env);
      env.connect(dest || masterGain);
      src.start(t);
      src.stop(t + 2.4);
    } catch (e) {}
  }

  // i = string 0..4; octave -1, 0 or 1
  function playKantele(i, octave) {
    var f = KANTELE[((i % 5) + 5) % 5] * Math.pow(2, octave || 0);
    pluck(f, 0.32);
  }

  function playKanteleChord(indices, spread) {
    if (!ctx || muted) return;
    var t = ctx.currentTime;
    indices.forEach(function (i, n) {
      pluck(KANTELE[i % 5] * (i >= 5 ? 2 : 1), 0.22, t + n * (spread || 0.09));
    });
  }

  // A sung note for the singing contest. The player's voice is warm (sine +
  // soft formant); Joukahainen's is thin and reedy.
  var SONG = [220, 261.6, 293.7, 329.6];
  function playSongNote(i, rival) {
    if (!ctx || muted) return;
    try {
      var t = ctx.currentTime;
      var f = SONG[i % 4] * (rival ? 2 : 1);
      var osc = ctx.createOscillator();
      osc.type = rival ? 'square' : 'sawtooth';
      osc.frequency.setValueAtTime(f * 0.97, t);
      osc.frequency.linearRampToValueAtTime(f, t + 0.08);
      var vib = ctx.createOscillator();
      var vibGain = ctx.createGain();
      vib.frequency.setValueAtTime(5.5, t);
      vibGain.gain.setValueAtTime(rival ? 3 : 6, t);
      vib.connect(vibGain);
      vibGain.connect(osc.detune);
      var formant = ctx.createBiquadFilter();
      formant.type = 'bandpass';
      formant.frequency.setValueAtTime(rival ? 1400 : 800, t);
      formant.Q.setValueAtTime(rival ? 6 : 2.5, t);
      var env = ctx.createGain();
      env.gain.setValueAtTime(0, t);
      env.gain.linearRampToValueAtTime(rival ? 0.12 : 0.3, t + 0.06);
      env.gain.setValueAtTime(rival ? 0.12 : 0.3, t + 0.32);
      env.gain.exponentialRampToValueAtTime(0.001, t + 0.7);
      osc.connect(formant);
      formant.connect(env);
      env.connect(masterGain);
      osc.start(t); vib.start(t);
      osc.stop(t + 0.75); vib.stop(t + 0.75);
      if (!rival) pluck(f, 0.18, t);
    } catch (e) {}
  }

  function noiseBurst(dur, freq, q, vol, sweepTo) {
    if (!ctx || muted) return;
    try {
      var t = ctx.currentTime;
      var len = Math.floor(ctx.sampleRate * dur);
      var buf = ctx.createBuffer(1, len, ctx.sampleRate);
      var d = buf.getChannelData(0);
      for (var i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      var src = ctx.createBufferSource();
      src.buffer = buf;
      var f = ctx.createBiquadFilter();
      f.type = 'bandpass';
      f.frequency.setValueAtTime(freq, t);
      if (sweepTo) f.frequency.exponentialRampToValueAtTime(sweepTo, t + dur);
      f.Q.setValueAtTime(q, t);
      var env = ctx.createGain();
      env.gain.setValueAtTime(vol, t);
      env.gain.exponentialRampToValueAtTime(0.001, t + dur);
      src.connect(f); f.connect(env); env.connect(masterGain);
      src.start(t);
    } catch (e) {}
  }

  function glide(type, f0, f1, dur, vol) {
    if (!ctx || muted) return;
    try {
      var t = ctx.currentTime;
      var osc = ctx.createOscillator();
      var env = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(f0, t);
      osc.frequency.exponentialRampToValueAtTime(f1, t + dur);
      env.gain.setValueAtTime(0, t);
      env.gain.linearRampToValueAtTime(vol, t + 0.05);
      env.gain.exponentialRampToValueAtTime(0.001, t + dur);
      osc.connect(env); env.connect(masterGain);
      osc.start(t); osc.stop(t + dur + 0.05);
    } catch (e) {}
  }

  function playStingMiss() { glide('triangle', 180, 120, 0.4, 0.15); }
  function playStingSink() { glide('sine', 330, 82, 1.6, 0.2); noiseBurst(0.8, 300, 1, 0.15, 90); }
  function playStingFire() { noiseBurst(1.2, 900, 0.7, 0.3, 200); }
  function playStingSword() {
    if (!ctx || muted) return;
    [880, 1318, 1760].forEach(function (f, i) { glide('sine', f, f * 0.995, 2.2 - i * 0.4, 0.09); });
    noiseBurst(0.08, 4000, 1, 0.25);
  }
  function playStingHowl() {
    if (!ctx || muted) return;
    try {
      var t = ctx.currentTime;
      var osc = ctx.createOscillator();
      var env = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(380, t);
      osc.frequency.linearRampToValueAtTime(620, t + 0.6);
      osc.frequency.linearRampToValueAtTime(560, t + 1.6);
      osc.frequency.linearRampToValueAtTime(420, t + 2.2);
      env.gain.setValueAtTime(0, t);
      env.gain.linearRampToValueAtTime(0.12, t + 0.4);
      env.gain.linearRampToValueAtTime(0.1, t + 1.6);
      env.gain.exponentialRampToValueAtTime(0.001, t + 2.3);
      osc.connect(env); env.connect(masterGain);
      osc.start(t); osc.stop(t + 2.4);
    } catch (e) {}
  }


  // ── Per-song music: a slow generative kantele line over the drone ──
  // Each song has its own mode. Phrases are short random walks through the
  // mode, spaced by long rests, so the music stays in the background.
  // Song III adds a runo-singer's voice, answered by the kantele.
  var musicGain = null;
  var musicTimer = null;
  var MUSIC = {
    0: { root: 293.66, scale: [0, 2, 3, 5, 7, 9, 10], gap: [6, 11], len: [2, 4], vol: 0.12 },
    1: { root: 293.66, scale: [0, 2, 3, 5, 7, 10], gap: [5, 10], len: [2, 5], vol: 0.13 },
    2: { root: 220.0, scale: [0, 3, 5, 7, 10], gap: [6, 11], len: [2, 4], vol: 0.11 },
    3: { root: 329.63, scale: [0, 3, 5, 7, 10], gap: [7, 12], len: [3, 5], vol: 0.12, singer: true },
    4: { root: 293.66, scale: [0, 2, 3, 5, 7], gap: [4, 8], len: [3, 6], vol: 0.13 },
    5: { root: 164.81, scale: [0, 1, 3, 5, 7, 8], gap: [8, 14], len: [2, 3], vol: 0.12 }
  };

  function rand(a, b) { return a + Math.random() * (b - a); }

  function ensureMusicBus() {
    if (musicGain || !ctx) return;
    musicGain = ctx.createGain();
    musicGain.gain.setValueAtTime(0.9, ctx.currentTime);
    musicGain.connect(masterGain);
  }

  // A soft sung tone: triangle through a vowel-ish formant, with vibrato
  function hum(freq, dur, vol, when) {
    if (!ctx || muted) return;
    try {
      var t = when;
      var osc = ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq * 0.985, t);
      osc.frequency.linearRampToValueAtTime(freq, t + 0.12);
      var vib = ctx.createOscillator();
      var vibGain = ctx.createGain();
      vib.frequency.setValueAtTime(5, t);
      vibGain.gain.setValueAtTime(0, t);
      vibGain.gain.linearRampToValueAtTime(7, t + dur * 0.6);
      vib.connect(vibGain);
      vibGain.connect(osc.detune);
      var formant = ctx.createBiquadFilter();
      formant.type = 'bandpass';
      formant.frequency.setValueAtTime(700, t);
      formant.Q.setValueAtTime(1.6, t);
      var env = ctx.createGain();
      env.gain.setValueAtTime(0, t);
      env.gain.linearRampToValueAtTime(vol, t + 0.15);
      env.gain.setValueAtTime(vol, t + dur * 0.7);
      env.gain.exponentialRampToValueAtTime(0.001, t + dur);
      osc.connect(formant);
      formant.connect(env);
      env.connect(musicGain);
      osc.start(t); vib.start(t);
      osc.stop(t + dur + 0.05); vib.stop(t + dur + 0.05);
    } catch (e) {}
  }

  function phrase(m) {
    var n = Math.round(rand(m.len[0], m.len[1]));
    var deg = Math.floor(Math.random() * m.scale.length);
    var notes = [];
    for (var i = 0; i < n; i++) {
      var oct = Math.floor(deg / m.scale.length);
      var semis = m.scale[((deg % m.scale.length) + m.scale.length) % m.scale.length] + 12 * oct;
      notes.push(m.root * Math.pow(2, semis / 12));
      deg += [-2, -1, -1, 1, 1, 2][Math.floor(Math.random() * 6)];
      deg = Math.max(-2, Math.min(m.scale.length + 2, deg));
    }
    return notes;
  }

  function playPhrase(m) {
    if (!ctx || muted || ctx.state !== 'running') return;
    var t = ctx.currentTime + 0.1;
    var notes = phrase(m);
    var step = rand(0.45, 0.75);
    if (m.singer) {
      // The singer leads; the kantele answers the same line
      notes.forEach(function (f, i) { hum(f / 2, step * 1.6, m.vol * 0.55, t + i * step * 1.4); });
      t += notes.length * step * 1.4 + 0.4;
    }
    notes.forEach(function (f, i) {
      pluck(f, m.vol, t + i * step, musicGain);
      if (i === notes.length - 1 && Math.random() < 0.5) pluck(f * 1.5, m.vol * 0.6, t + i * step, musicGain);
    });
  }

  function startMusic(episode) {
    stopMusic();
    if (!ctx) return;
    ensureMusicBus();
    setMusicLevel(1);
    var m = MUSIC[episode] || MUSIC[1];
    var next = function () {
      playPhrase(m);
      musicTimer = setTimeout(next, rand(m.gap[0], m.gap[1]) * 1000);
    };
    musicTimer = setTimeout(next, rand(2.5, 5) * 1000);
  }

  function stopMusic() {
    if (musicTimer) { clearTimeout(musicTimer); musicTimer = null; }
  }

  // 0..1: songs duck the music while the player makes their own
  function setMusicLevel(v) {
    if (!ctx || !musicGain) return;
    musicGain.gain.setTargetAtTime(0.9 * v, ctx.currentTime, 0.4);
  }

  // ── Footfalls and splashes ─────────────────────────────────────────
  var noiseBuf = null;
  function noise() {
    if (!noiseBuf) {
      var len = ctx.sampleRate;
      noiseBuf = ctx.createBuffer(1, len, ctx.sampleRate);
      var d = noiseBuf.getChannelData(0);
      for (var i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    }
    return noiseBuf;
  }

  function grain(t, dur, type, freq, q, vol) {
    var src = ctx.createBufferSource();
    src.buffer = noise();
    var f = ctx.createBiquadFilter();
    f.type = type;
    f.frequency.setValueAtTime(freq, t);
    f.Q.setValueAtTime(q, t);
    var env = ctx.createGain();
    env.gain.setValueAtTime(vol, t);
    env.gain.exponentialRampToValueAtTime(0.001, t + dur);
    src.connect(f); f.connect(env); env.connect(masterGain);
    src.start(t, Math.random() * 0.8, dur + 0.02);
  }

  function thump(t, freq, dur, vol, type) {
    var o = ctx.createOscillator();
    o.type = type || 'sine';
    o.frequency.setValueAtTime(freq, t);
    o.frequency.exponentialRampToValueAtTime(freq * 0.6, t + dur);
    var env = ctx.createGain();
    env.gain.setValueAtTime(vol, t);
    env.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(env); env.connect(masterGain);
    o.start(t); o.stop(t + dur + 0.02);
  }

  // surface: 'snow' | 'ice' | 'stone' | 'wood' | 'earth'; weight 1 = step, 2 = landing
  function playStep(surface, weight) {
    if (!ctx || muted || ctx.state !== 'running') return;
    try {
      var t = ctx.currentTime;
      var w = weight || 1;
      var p = rand(0.9, 1.1);
      if (surface === 'snow') {
        grain(t, 0.13, 'bandpass', 2600 * p, 0.9, 0.05 * w);
        grain(t + 0.035, 0.08, 'bandpass', 1500 * p, 1.2, 0.03 * w);
      } else if (surface === 'ice') {
        thump(t, 2200 * p, 0.05, 0.025 * w, 'sine');
        grain(t, 0.03, 'highpass', 5000, 0.7, 0.02 * w);
      } else if (surface === 'stone') {
        grain(t, 0.06, 'bandpass', 900 * p, 2, 0.06 * w);
        thump(t, 140 * p, 0.06, 0.05 * w);
      } else if (surface === 'wood') {
        thump(t, 230 * p, 0.09, 0.07 * w, 'triangle');
        grain(t, 0.04, 'bandpass', 700 * p, 3, 0.03 * w);
      } else {
        grain(t, 0.07, 'lowpass', 500 * p, 0.7, 0.06 * w);
        thump(t, 95 * p, 0.05, 0.04 * w);
      }
    } catch (e) {}
  }

  function playSplash(big) {
    if (!ctx || muted || ctx.state !== 'running') return;
    try {
      var t = ctx.currentTime;
      var src = ctx.createBufferSource();
      src.buffer = noise();
      var f = ctx.createBiquadFilter();
      f.type = 'lowpass';
      f.frequency.setValueAtTime(2400, t);
      f.frequency.exponentialRampToValueAtTime(300, t + 0.4);
      var env = ctx.createGain();
      env.gain.setValueAtTime(big ? 0.14 : 0.08, t);
      env.gain.exponentialRampToValueAtTime(0.001, t + 0.45);
      src.connect(f); f.connect(env); env.connect(masterGain);
      src.start(t, Math.random() * 0.5, 0.5);
    } catch (e) {}
  }

  function setMute(val) {
    muted = val;
    if (!ctx || !masterGain) return;
    masterGain.gain.cancelScheduledValues(ctx.currentTime);
    masterGain.gain.setValueAtTime(masterGain.gain.value, ctx.currentTime);
    if (muted) {
      masterGain.gain.linearRampToValueAtTime(0.0, ctx.currentTime + 0.3);
    } else {
      masterGain.gain.linearRampToValueAtTime(0.18, ctx.currentTime + 0.3);
    }
  }

  function toggleMute() {
    setMute(!muted);
    return muted;
  }

  function isMuted() { return muted; }
  function isStarted() { return started; }

  function setEpisodeFilter(val) {
    // Shift filter on drone nodes based on storm intensity (0..1)
    if (!ctx) return;
    droneNodes.forEach(function (node) {
      if (node instanceof BiquadFilterNode) {
        var baseFreq = 400;
        node.frequency.setValueAtTime(baseFreq + val * 600, ctx.currentTime);
      }
    });
  }

  return {
    start: start,
    stop: stopDrone,
    stopMusic: stopMusic,
    setMusicLevel: setMusicLevel,
    playStep: playStep,
    playSplash: playSplash,
    playStingRune: playStingRune,
    playStingEgg: playStingEgg,
    playStingForge: playStingForge,
    playStingStorm: playStingStorm,
    playStingSampoShatter: playStingSampoShatter,
    setMute: setMute,
    toggleMute: toggleMute,
    isMuted: isMuted,
    isStarted: isStarted,
    setEpisodeFilter: setEpisodeFilter,
    playKantele: playKantele,
    playKanteleChord: playKanteleChord,
    playSongNote: playSongNote,
    playStingMiss: playStingMiss,
    playStingSink: playStingSink,
    playStingFire: playStingFire,
    playStingSword: playStingSword,
    playStingHowl: playStingHowl
  };
})();
