// runes.js — Rune trigger / checkpoint / story-text-panel logic shared by both episodes

var RuneManager = {
  // Creates a rune stone at (x, y) with a verse config and returns the game object group
  createRune: function (scene, x, y, config) {
    // config: { id, verse: string[], event: fn(scene), isFinale: bool }
    var group = scene.add.container(x, y);

    var stone = scene.add.image(0, 0, 'rune_unlit');
    stone.setDepth(5);
    group.add(stone);

    // Pulsing ambient glow zone
    var glowZone = scene.add.graphics();
    glowZone.setDepth(4);
    group.add(glowZone);

    var runeData = {
      group: group,
      stone: stone,
      glowZone: glowZone,
      config: config,
      lit: false,
      triggered: false,
      x: x,
      y: y,
      pulseT: Math.random() * Math.PI * 2
    };

    return runeData;
  },

  // Called each frame — animate the pulse on unlit runes
  updateRunePulse: function (runeData, delta) {
    if (runeData.lit) return;
    runeData.pulseT += delta * 0.001;
    var alpha = 0.3 + Math.sin(runeData.pulseT) * 0.2;
    runeData.stone.setAlpha(alpha + 0.5);
  },

  // Trigger a rune — light it up, fire the verse panel, call optional event fn
  triggerRune: function (scene, runeData, onDone) {
    if (runeData.triggered) return;
    runeData.triggered = true;
    runeData.lit = true;
    runeData.stone.setTexture('rune_lit');
    runeData.stone.setAlpha(1);

    // Particle burst
    RuneManager.burstParticles(scene, runeData.x, runeData.y);

    // Audio sting
    RunoAudio.playStingRune();

    // Show verse panel
    if (runeData.config.verse && runeData.config.verse.length > 0) {
      StoryPanel.show(scene, runeData.config.verse, function () {
        if (runeData.config.event) {
          runeData.config.event(scene);
        }
        if (onDone) onDone();
      });
    } else {
      if (runeData.config.event) runeData.config.event(scene);
      if (onDone) onDone();
    }
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

// ── Story text panel ──────────────────────────────────────────────────────────

var StoryPanel = {
  _active: false,
  _onDone: null,
  _bg: null,
  _texts: [],
  _lineIndex: 0,
  _lines: [],
  _scene: null,
  _container: null,
  _advanceKey: null,

  show: function (scene, lines, onDone) {
    if (StoryPanel._active) {
      StoryPanel.dismiss();
    }
    StoryPanel._active = true;
    StoryPanel._onDone = onDone;
    StoryPanel._lines = lines;
    StoryPanel._lineIndex = 0;
    StoryPanel._scene = scene;

    var W = scene.scale.width;
    var H = scene.scale.height;
    var panelH = 110;
    var panelY = H - panelH;

    var container = scene.add.container(0, 0);
    container.setDepth(100);
    container.setScrollFactor(0);
    StoryPanel._container = container;

    // Background bar
    var bg = scene.add.graphics();
    bg.fillStyle(0x050810, 0.82);
    bg.fillRect(0, panelY, W, panelH);
    bg.lineStyle(1, 0x1a2030, 0.6);
    bg.lineBetween(0, panelY, W, panelY);
    container.add(bg);
    StoryPanel._bg = bg;

    // Verse text
    var style = {
      fontFamily: "'Iowan Old Style', 'Palatino Linotype', Palatino, Georgia, serif",
      fontSize: '18px',
      color: '#c8d4dc',
      letterSpacing: 1,
      align: 'center',
      wordWrap: { width: Math.min(W - 80, 740) },
      lineSpacing: 6
    };

    var verse = lines.join('\n');
    var txt = scene.add.text(W / 2, panelY + panelH / 2, verse, style);
    txt.setOrigin(0.5, 0.5);
    txt.setAlpha(0);
    container.add(txt);
    StoryPanel._texts = [txt];

    // Prompt text
    var promptStyle = {
      fontFamily: "'Iowan Old Style', Georgia, serif",
      fontSize: '12px',
      color: '#4a5a6a',
      letterSpacing: 2
    };
    var prompt = scene.add.text(W - 20, H - 14, 'tap / enter', promptStyle);
    prompt.setOrigin(1, 1);
    container.add(prompt);

    // Fade in
    scene.tweens.add({
      targets: txt,
      alpha: 1,
      duration: 600,
      ease: 'Sine.easeIn'
    });
  },

  advance: function () {
    if (!StoryPanel._active) return;
    StoryPanel.dismiss();
  },

  dismiss: function () {
    if (!StoryPanel._active) return;
    StoryPanel._active = false;
    var container = StoryPanel._container;
    var scene = StoryPanel._scene;
    var onDone = StoryPanel._onDone;
    StoryPanel._onDone = null;
    StoryPanel._container = null;

    if (container && scene) {
      scene.tweens.add({
        targets: container,
        alpha: 0,
        duration: 400,
        ease: 'Sine.easeOut',
        onComplete: function () {
          if (container) container.destroy();
          if (onDone) onDone();
        }
      });
    } else {
      if (onDone) onDone();
    }
  },

  isActive: function () {
    return StoryPanel._active;
  }
};

// ── Respawn system ────────────────────────────────────────────────────────────

var RespawnSystem = {
  _overlay: null,
  _scene: null,

  init: function (scene) {
    RespawnSystem._scene = scene;
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

  respawn: function (player, checkpointX, checkpointY) {
    if (!RespawnSystem._scene) return;
    var scene = RespawnSystem._scene;
    var overlay = RespawnSystem._overlay;

    scene.tweens.add({
      targets: overlay,
      alpha: 1,
      duration: 400,
      ease: 'Sine.easeIn',
      onComplete: function () {
        player.setPosition(checkpointX, checkpointY - 20);
        if (player.body) {
          player.body.setVelocity(0, 0);
        }
        scene.tweens.add({
          targets: overlay,
          alpha: 0,
          duration: 500,
          ease: 'Sine.easeOut',
          delay: 150
        });
      }
    });
  }
};

// ── Shared mute button ────────────────────────────────────────────────────────

var MuteButton = {
  _btn: null,

  create: function (scene) {
    var W = scene.scale.width;
    var btn = scene.add.image(W - 22, 22, 'mute_off');
    btn.setScrollFactor(0);
    btn.setDepth(300);
    btn.setInteractive({ useHandCursor: true });
    btn.on('pointerdown', function () {
      var muted = RunoAudio.toggleMute();
      btn.setTexture(muted ? 'mute_on' : 'mute_off');
    });
    MuteButton._btn = btn;
    return btn;
  }
};
