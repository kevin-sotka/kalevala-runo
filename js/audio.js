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
    currentEpisode = episode || 1;
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
  }

  function buildDrone(episode) {
    if (!ctx) return;
    droneNodes = [];
    // Base frequencies: Ep1 cold sea = D minor feel; Ep2 forge = lower, darker
    var baseFreqs = episode === 2
      ? [55, 82.4, 110, 146.8]
      : [73.4, 110, 146.8, 196];

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

      var vol = (episode === 2) ? 0.12 - i * 0.02 : 0.10 - i * 0.015;
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
    playStingRune: playStingRune,
    playStingEgg: playStingEgg,
    playStingForge: playStingForge,
    playStingStorm: playStingStorm,
    playStingSampoShatter: playStingSampoShatter,
    setMute: setMute,
    toggleMute: toggleMute,
    isMuted: isMuted,
    isStarted: isStarted,
    setEpisodeFilter: setEpisodeFilter
  };
})();
