// runes.js — Rune stones, the bilingual verse panel, respawn, save/progress,
// language + mute buttons. Shared by every episode.

// ── Persistent settings + progress ────────────────────────────────────────────
// localStorage can throw (private mode, blocked storage) so every access is
// wrapped and falls back to an in-memory copy.

var RunoSave = (function () {
  var KEY = 'runo.save.v1';
  var mem = { done: {}, lang: 'both' };
  var unlockAll = /[?&]unlock=all\b/.test(window.location.search);

  function load() {
    try {
      var raw = window.localStorage.getItem(KEY);
      if (raw) {
        var data = JSON.parse(raw);
        if (data && typeof data === 'object') {
          mem.done = data.done || {};
          mem.lang = data.lang || 'both';
        }
      }
    } catch (e) {}
  }
  function persist() {
    try { window.localStorage.setItem(KEY, JSON.stringify(mem)); } catch (e) {}
  }
  load();

  return {
    isComplete: function (ep) { return !!mem.done[ep]; },
    complete: function (ep) { mem.done[ep] = true; persist(); },
    isUnlocked: function (ep) { return unlockAll || ep === 1 || !!mem.done[ep - 1]; },
    getLang: function () { return mem.lang; },
    setLang: function (lang) { mem.lang = lang; persist(); }
  };
})();

// Verse language: 'both' (Finnish beside English), 'en', or 'fi'.
var RunoLang = {
  MODES: ['both', 'en', 'fi'],
  LABELS: { both: 'FI · EN', en: 'EN', fi: 'FI' },
  get: function () { return RunoSave.getLang(); },
  cycle: function () {
    var i = RunoLang.MODES.indexOf(RunoLang.get());
    var next = RunoLang.MODES[(i + 1) % RunoLang.MODES.length];
    RunoSave.setLang(next);
    return next;
  },
  // Pick a string from a {fi, en} pair (or pass a plain string through).
  pick: function (pair) {
    if (typeof pair === 'string') return pair;
    var mode = RunoLang.get();
    if (mode === 'fi') return pair.fi;
    if (mode === 'en') return pair.en;
    return pair.fi + '  ·  ' + pair.en;
  }
};

var RunoFonts = {
  verse: "'Iowan Old Style', 'Palatino Linotype', Palatino, Georgia, serif",
  plain: 'Georgia, serif'
};

// ── Rune stones ───────────────────────────────────────────────────────────────

var RuneManager = {
  TRIGGER_DIST: 60,
  REREAD_DIST: 80,

  // config: { id, verse: {fi:[], en:[]} | string[], event: fn(scene), isFinale }
  createRune: function (scene, x, y, config) {
    var group = scene.add.container(x, y);
    group.setDepth(5);

    var stone = scene.add.image(0, 0, 'rune_unlit');
    group.add(stone);

    var runeData = {
      group: group,
      stone: stone,
      config: config,
      lit: false,
      triggered: false,
      x: x,
      y: y,
      pulseT: Math.random() * Math.PI * 2,
      hint: null
    };

    // Tapping a lit rune re-reads its verse.
    stone.setInteractive({ useHandCursor: true });
    stone.on('pointerdown', function () {
      if (runeData.lit && !StoryPanel.isActive()) {
        RuneManager.reread(scene, runeData);
      }
    });

    return runeData;
  },

  updateRunePulse: function (runeData, delta) {
    if (runeData.lit) return;
    runeData.pulseT += delta * 0.001;
    runeData.stone.setAlpha(0.8 + Math.sin(runeData.pulseT) * 0.2);
  },

  triggerRune: function (scene, runeData, onDone) {
    if (runeData.triggered) return;
    runeData.triggered = true;
    runeData.lit = true;
    runeData.stone.setTexture('rune_lit');
    runeData.stone.setAlpha(1);

    RuneManager.burstParticles(scene, runeData.x, runeData.y);
    RunoAudio.playStingRune();

    var cfg = runeData.config;
    var finish = function () {
      if (cfg.event) cfg.event(scene);
      if (onDone) onDone();
    };
    if (cfg.verse) {
      StoryPanel.show(scene, cfg.verse, finish);
    } else {
      finish();
    }
  },

  reread: function (scene, runeData) {
    if (!runeData.config.verse) return;
    RunoAudio.playStingRune();
    StoryPanel.show(scene, runeData.config.verse, null);
  },

  // One call per frame from each episode. Lights runes the player walks into
  // (freezing the player and making the rune the checkpoint), pulses unlit
  // runes, and offers a re-read of lit runes the player is standing near.
  updateAll: function (scene, runes, player, delta) {
    var nearLit = null;
    var nearWaiting = null;
    var locked = scene._playerFrozen || StoryPanel.isActive();
    runes.forEach(function (rune) {
      var dx = player.x - rune.x;
      var dy = player.y - rune.y;
      var dist = Math.sqrt(dx * dx + dy * dy);
      if (!rune.triggered) {
        RuneManager.updateRunePulse(rune, delta);
        var waiting = rune.config.requires && !rune.config.requires();
        if (waiting && dist < RuneManager.REREAD_DIST) nearWaiting = rune;
        if (!locked && !waiting && dist < RuneManager.TRIGGER_DIST) {
          scene._playerFrozen = true;
          locked = true;
          var cp = rune.config.checkpoint || { x: rune.x - 40, y: rune.y };
          PlayerController.setCheckpoint(cp.x, cp.y);
          RuneManager.triggerRune(scene, rune, function () {
            scene._playerFrozen = false;
          });
        }
      } else if (dist < RuneManager.REREAD_DIST && rune.config.verse && !rune.config.isFinale) {
        nearLit = rune;
      }
    });

    // "Read again" hint over the nearest lit rune, or what a waiting rune needs
    RuneManager._updateHint(scene, locked ? null : (nearWaiting || nearLit));
    var pressed = RuneManager._rereadPressed(scene);
    var justClosed = scene.time.now - StoryPanel.closedAt < 400;
    if (nearLit && !locked && pressed && !justClosed) {
      RuneManager.reread(scene, nearLit);
    }
  },

  _updateHint: function (scene, rune) {
    if (!scene._runeHint) {
      scene._runeHint = scene.add.text(0, 0, '', {
        fontFamily: RunoFonts.plain,
        fontSize: '12px',
        color: '#8a7a50',
        letterSpacing: 2
      }).setOrigin(0.5, 1).setDepth(55).setAlpha(0);
      // The hint is itself a button, above the touch zones, for phones
      scene._runeHint.setPadding(10, 8, 10, 8);
      scene._runeHint.setInteractive({ useHandCursor: true });
      scene._runeHint.on('pointerdown', function () {
        var r = scene._runeHint._rune;
        if (r && r.triggered && !StoryPanel.isActive() && scene._runeHint.alpha > 0.3) RuneManager.reread(scene, r);
      });
      scene._runeHintKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
      scene._runeHintEnter = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
    }
    var hint = scene._runeHint;
    hint._rune = rune;
    if (hint.input) hint.input.enabled = !!rune;
    if (rune) {
      var touch = PlayerController.isMobile;
      if (!rune.triggered && rune.config.waitingHint) {
        hint.setText(RunoLang.pick(rune.config.waitingHint));
      } else {
        hint.setText(touch ? 'napauta · tap rune to read' : 'E · lue uudelleen · read again');
      }
      hint.setPosition(rune.x, rune.y - 30);
      hint.setAlpha(Math.min(0.85, hint.alpha + 0.05));
    } else {
      hint.setAlpha(Math.max(0, hint.alpha - 0.08));
    }
  },

  _rereadPressed: function (scene) {
    return Phaser.Input.Keyboard.JustDown(scene._runeHintKey) ||
      Phaser.Input.Keyboard.JustDown(scene._runeHintEnter);
  },

  burstParticles: function (scene, x, y) {
    try {
      var emitter = scene.add.particles(x, y, 'particle_gold', {
        speed: { min: 40, max: 120 },
        angle: { min: 0, max: 360 },
        scale: { start: 1, end: 0 },
        alpha: { start: 1, end: 0 },
        lifespan: 700,
        quantity: 16,
        frequency: -1
      });
      emitter.setDepth(20);
      emitter.explode(16, 0, 0);
      scene.time.delayedCall(800, function () { emitter.destroy(); });
    } catch (e) {}
  }
};

// ── Story verse panel ─────────────────────────────────────────────────────────
// Verses are { fi: [...], en: [...] } (plain string arrays still work as English).
// The panel owns its own input: it can't be dismissed by the jump key, by the
// movement touch zones, or before the reader has had time to take it in.
// Advance with Enter / E, or a tap anywhere once "jatka · continue" shows.

var StoryPanel = {
  _active: false,
  _ready: false,
  closedAt: -1e9,
  _queue: [],
  _queueScene: null,
  _onDone: null,
  _container: null,
  _scene: null,
  _hitZone: null,
  _keyHandler: null,
  _prompt: null,
  _readyTimer: null,

  show: function (scene, verse, onDone) {
    // One verse at a time: a verse asked for while another is open waits its
    // turn (and its onDone still runs), rather than cutting the first short.
    if (StoryPanel._active) {
      if (StoryPanel._scene === scene) {
        StoryPanel._queue.push({ verse: verse, onDone: onDone });
        return;
      }
      StoryPanel._teardown(true);
    }
    if (StoryPanel._queueScene !== scene) {
      StoryPanel._queue = [];
      StoryPanel._queueScene = scene;
    }

    StoryPanel._active = true;
    StoryPanel._ready = false;
    StoryPanel._onDone = onDone || null;
    StoryPanel._scene = scene;

    var W = scene.scale.width;
    var H = scene.scale.height;
    var pair = Array.isArray(verse) ? { fi: null, en: verse } : verse;
    var mode = RunoLang.get();
    if (!pair.fi) mode = 'en';

    var container = scene.add.container(0, 0);
    container.setDepth(100);
    container.setScrollFactor(0);
    StoryPanel._container = container;

    var fiStyle = {
      fontFamily: RunoFonts.verse,
      fontStyle: 'italic',
      fontSize: '17px',
      color: '#d8c48a',
      lineSpacing: 7,
      align: 'center'
    };
    var enStyle = {
      fontFamily: RunoFonts.verse,
      fontSize: '17px',
      color: '#c8d4dc',
      lineSpacing: 7,
      align: 'center'
    };

    // Build one Text per line so lines can fade in one after another,
    // the way a runo-singer's lines come one breath at a time.
    var columns = [];
    if (mode === 'both') {
      columns.push({ lines: pair.fi, style: fiStyle, cx: W * 0.27, wrap: W * 0.44 });
      columns.push({ lines: pair.en, style: enStyle, cx: W * 0.73, wrap: W * 0.44 });
    } else if (mode === 'fi') {
      fiStyle.fontSize = '19px';
      columns.push({ lines: pair.fi, style: fiStyle, cx: W / 2, wrap: Math.min(W - 80, 760) });
    } else {
      enStyle.fontSize = '19px';
      columns.push({ lines: pair.en, style: enStyle, cx: W / 2, wrap: Math.min(W - 80, 760) });
    }

    var lineGap = 26;
    var maxLines = 0;
    columns.forEach(function (c) { maxLines = Math.max(maxLines, c.lines.length); });
    // The panel hangs from the top of the screen: every episode keeps its
    // sky clear, so the verse never hides the Wanderer or the story's action.
    var panelH = Math.max(110, maxLines * lineGap + 52);

    var bg = scene.add.graphics();
    bg.fillStyle(0x050810, 0.84);
    bg.fillRect(0, 0, W, panelH);
    bg.lineStyle(1, 0x2a3040, 0.7);
    bg.lineBetween(0, panelH, W, panelH);
    // Woven band along the edge, a nod to the red-and-white käspaikka towel
    bg.lineStyle(1, 0x7a3a2a, 0.55);
    for (var x = 8; x < W; x += 16) {
      bg.lineBetween(x, panelH - 4, x + 4, panelH - 8);
      bg.lineBetween(x + 4, panelH - 8, x + 8, panelH - 4);
    }
    if (mode === 'both') {
      bg.lineStyle(1, 0x3a3420, 0.5);
      bg.lineBetween(W / 2, 18, W / 2, panelH - 18);
    }
    container.add(bg);

    var textTop = 18;
    var lineTexts = [];
    columns.forEach(function (c) {
      var style = Object.assign({}, c.style, { wordWrap: { width: c.wrap } });
      var top = textTop + (maxLines - c.lines.length) * lineGap / 2;
      c.lines.forEach(function (line, i) {
        var t = scene.add.text(c.cx, top + i * lineGap, line, style);
        t.setOrigin(0.5, 0);
        t.setAlpha(0);
        container.add(t);
        lineTexts.push({ t: t, i: i });
      });
    });

    lineTexts.forEach(function (lt) {
      scene.tweens.add({
        targets: lt.t,
        alpha: 1,
        duration: 700,
        delay: 150 + lt.i * 420,
        ease: 'Sine.easeOut'
      });
    });

    var touch = PlayerController.isMobile;
    var prompt = scene.add.text(W - 18, panelH - 12, touch ? 'napauta · tap ▸' : 'jatka · Enter ▸', {
      fontFamily: RunoFonts.plain,
      fontSize: '12px',
      color: '#8a7a50',
      letterSpacing: 2
    });
    prompt.setOrigin(1, 1);
    prompt.setAlpha(0);
    container.add(prompt);
    StoryPanel._prompt = prompt;

    // Full-screen hit zone above the touch controls: swallows taps while the
    // verse is up so they never reach the move/jump zones underneath.
    var hit = scene.add.zone(0, 0, W, H).setOrigin(0, 0);
    hit.setScrollFactor(0);
    hit.setDepth(101);
    hit.setInteractive();
    hit.on('pointerdown', function () { StoryPanel.advance(); });
    StoryPanel._hitZone = hit;

    StoryPanel._keyHandler = function (event) {
      if (event.repeat) return;
      if (event.key === 'Enter' || event.key === 'e' || event.key === 'E') {
        StoryPanel.advance();
      }
    };
    scene.input.keyboard.on('keydown', StoryPanel._keyHandler);

    // Minimum reading time: every line has faded in, plus a breath.
    var minRead = 150 + (maxLines - 1) * 420 + 700 + 900;
    StoryPanel._readyTimer = scene.time.delayedCall(minRead, function () {
      StoryPanel._ready = true;
      if (StoryPanel._prompt && StoryPanel._prompt.scene) {
        scene.tweens.add({
          targets: StoryPanel._prompt,
          alpha: { from: 0, to: 1 },
          duration: 500
        });
        scene.tweens.add({
          targets: StoryPanel._prompt,
          alpha: 0.45,
          duration: 1100,
          delay: 500,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut'
        });
      }
    });

    // Clean up if the scene shuts down with a verse open
    scene.events.once('shutdown', function () {
      if (StoryPanel._scene === scene) StoryPanel._teardown(true);
      if (StoryPanel._queueScene === scene) StoryPanel._queue = [];
    });
  },

  advance: function () {
    if (!StoryPanel._active || !StoryPanel._ready) return;
    StoryPanel.dismiss();
  },

  dismiss: function () {
    if (!StoryPanel._active) return;
    var container = StoryPanel._container;
    var scene = StoryPanel._scene;
    var onDone = StoryPanel._onDone;
    StoryPanel._teardown(false);
    if (scene) StoryPanel.closedAt = scene.time.now;

    if (container && scene && container.scene) {
      scene.tweens.add({
        targets: container,
        alpha: 0,
        duration: 350,
        ease: 'Sine.easeOut',
        onComplete: function () { container.destroy(); }
      });
    }
    if (onDone) onDone();
    if (!StoryPanel._active && StoryPanel._queue.length && scene && scene.sys.isActive()) {
      var next = StoryPanel._queue.shift();
      scene.time.delayedCall(250, function () {
        if (StoryPanel._active) StoryPanel._queue.unshift(next);
        else StoryPanel.show(scene, next.verse, next.onDone);
      });
    }
  },

  // Remove input hooks; optionally destroy the visuals immediately.
  _teardown: function (destroyVisuals) {
    var scene = StoryPanel._scene;
    StoryPanel._active = false;
    StoryPanel._ready = false;
    StoryPanel._onDone = null;
    if (StoryPanel._readyTimer) { StoryPanel._readyTimer.remove(false); StoryPanel._readyTimer = null; }
    if (StoryPanel._hitZone) { StoryPanel._hitZone.destroy(); StoryPanel._hitZone = null; }
    if (scene && StoryPanel._keyHandler && scene.input && scene.input.keyboard) {
      scene.input.keyboard.off('keydown', StoryPanel._keyHandler);
    }
    StoryPanel._keyHandler = null;
    if (destroyVisuals && StoryPanel._container) {
      StoryPanel._container.destroy();
    }
    StoryPanel._container = null;
    StoryPanel._prompt = null;
  },

  isActive: function () {
    return StoryPanel._active;
  }
};

// ── Respawn system ────────────────────────────────────────────────────────────

var RespawnSystem = {
  _overlay: null,
  _scene: null,
  _busy: false,

  init: function (scene) {
    RespawnSystem._scene = scene;
    RespawnSystem._busy = false;
    var W = scene.scale.width;
    var H = scene.scale.height;
    var overlay = scene.add.graphics();
    overlay.fillStyle(0x000000, 1);
    overlay.fillRect(0, 0, W, H);
    overlay.setDepth(200);
    overlay.setScrollFactor(0);
    overlay.setAlpha(0);
    RespawnSystem._overlay = overlay;
  },

  isBusy: function () { return RespawnSystem._busy; },

  respawn: function (player, checkpointX, checkpointY) {
    if (!RespawnSystem._scene || RespawnSystem._busy) return;
    RespawnSystem._busy = true;
    var scene = RespawnSystem._scene;
    var overlay = RespawnSystem._overlay;

    scene.tweens.add({
      targets: overlay,
      alpha: 1,
      duration: 350,
      ease: 'Sine.easeIn',
      onComplete: function () {
        player.setPosition(checkpointX, checkpointY - 20);
        if (player.body) player.body.setVelocity(0, 0);
        scene.tweens.add({
          targets: overlay,
          alpha: 0,
          duration: 450,
          ease: 'Sine.easeOut',
          delay: 150,
          onComplete: function () { RespawnSystem._busy = false; }
        });
      }
    });
  }
};

// ── Mute + language buttons (top-right) ───────────────────────────────────────

var MuteButton = {
  create: function (scene) {
    var W = scene.scale.width;
    var btn = scene.add.image(W - 22, 22, RunoAudio.isMuted() ? 'mute_on' : 'mute_off');
    btn.setScrollFactor(0);
    btn.setDepth(300);
    btn.setInteractive({ useHandCursor: true });
    btn.on('pointerdown', function () {
      var muted = RunoAudio.toggleMute();
      btn.setTexture(muted ? 'mute_on' : 'mute_off');
    });
    scene.input.keyboard.on('keydown-M', function () {
      var muted = RunoAudio.toggleMute();
      btn.setTexture(muted ? 'mute_on' : 'mute_off');
    });
    LangButton.create(scene);
    return btn;
  }
};

var LangButton = {
  create: function (scene) {
    var W = scene.scale.width;
    var txt = scene.add.text(W - 48, 22, RunoLang.LABELS[RunoLang.get()], {
      fontFamily: RunoFonts.plain,
      fontSize: '12px',
      color: '#7a8a9a',
      letterSpacing: 2,
      backgroundColor: 'rgba(8,12,24,0.6)',
      padding: { x: 6, y: 4 }
    });
    txt.setOrigin(1, 0.5);
    txt.setScrollFactor(0);
    txt.setDepth(300);
    txt.setInteractive({ useHandCursor: true });
    txt.on('pointerdown', function () {
      txt.setText(RunoLang.LABELS[RunoLang.cycle()]);
      scene.events.emit('runo-lang-changed');
    });
    scene.input.keyboard.on('keydown-L', function () {
      txt.setText(RunoLang.LABELS[RunoLang.cycle()]);
      scene.events.emit('runo-lang-changed');
    });
    return txt;
  }
};
