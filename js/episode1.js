// episode1.js — Birth of Väinämöinen
// Sea float segment → duck/egg world-formation → shore arrival → 5–6 rune beats → finale

var Episode1Scene = new Phaser.Class({
  Extends: Phaser.Scene,
  initialize: function Episode1Scene() {
    Phaser.Scene.call(this, { key: 'Episode1Scene' });
  },

  create: function () {
    var W = this.scale.width;
    var H = this.scale.height;
    this.WORLD_W = 7200;
    this.WORLD_H = H;
    this._driftT = 0;
    this._waveT = 0;
    this._duckActive = false;
    this._eggFired = false;
    this._stormActive = false;
    this._finaleTriggered = false;
    this._playerFrozen = false;
    this._runeIndex = 0;

    this.physics.world.setBounds(0, 0, this.WORLD_W, H + 200);
    this.cameras.main.setBounds(0, 0, this.WORLD_W, H);
    this.cameras.main.setBackgroundColor(0x080e1a);

    // ── Sea dimensions (set early — used by _buildWorld) ────────────
    this._seaSurface = 340; // y coordinate of sea surface
    this._seaEnd = 2800;    // x where sea ends and shore begins

    // ── Parallax background layers ──────────────────────────────────
    this._buildParallax(W, H);

    // ── World geometry ──────────────────────────────────────────────
    this._buildWorld(W, H);

    // ── Sea surface graphics ────────────────────────────────────────
    this._seaGraphics = this.add.graphics();
    this._seaGraphics.setDepth(6);
    this._seaGraphics.setScrollFactor(1);

    // ── Caustic lines ───────────────────────────────────────────────
    this._causticLines = [];
    this._buildCaustics(W);

    // ── Player ──────────────────────────────────────────────────────
    this._player = PlayerController.init(this, 120, this._seaSurface - 20);
    PlayerController.setCheckpoint(120, this._seaSurface - 20);
    PlayerController.setSwimMode(true); // starts in sea

    // ── Ground / collision ──────────────────────────────────────────
    this.physics.add.collider(this._player, this._groundGroup);

    // ── Fall/drown detection ────────────────────────────────────────
    RespawnSystem.init(this);

    // ── Rune stones ─────────────────────────────────────────────────
    this._runes = this._buildRunes(H);

    // ── Duck and egg setup ──────────────────────────────────────────
    this._duck = null;
    this._buildDuck(H);

    // ── Moon ────────────────────────────────────────────────────────
    var moon = this.add.image(W * 0.7, 80, 'moon');
    moon.setScrollFactor(0.05);
    moon.setDepth(2);
    moon.setAlpha(0.85);

    // ── Camera follows player ───────────────────────────────────────
    this.cameras.main.startFollow(this._player, true, 0.08, 0.08);
    this.cameras.main.setFollowOffset(-80, 0);

    // ── UI ──────────────────────────────────────────────────────────
    MuteButton.create(this);

    // Start audio
    RunoAudio.start(1);

    // Fade in
    this.cameras.main.fadeIn(800, 0, 0, 0);

    // Input for story advance
    this.input.on('pointerdown', function () {
      if (StoryPanel.isActive()) StoryPanel.advance();
    });
    this.input.keyboard.on('keydown-ENTER', function () {
      if (StoryPanel.isActive()) StoryPanel.advance();
    });
    this.input.keyboard.on('keydown-SPACE', function () {
      if (StoryPanel.isActive()) StoryPanel.advance();
    });

    // Show opening verse immediately
    var self = this;
    this.time.delayedCall(600, function () {
      StoryPanel.show(self, [
        'In the beginning there was only water,',
        'and Ilmatar, daughter of air, drifting—',
        'seven hundred years upon the cold sea,',
        'cradling the world not yet born.'
      ], function () {
        // nothing; player can begin walking
      });
    });
  },

  _buildParallax: function (W, H) {
    // Layer 0: far sky gradient (already set as bg color, add subtle horizontal lines)
    this._parallaxLayers = [];

    // Layer 1: far sea horizon glow
    var g1 = this.add.graphics();
    g1.setScrollFactor(0.05);
    g1.setDepth(1);
    g1.fillStyle(0x102030, 0.4);
    for (var y = 200; y < 360; y += 4) {
      var alpha = 0.05 + (y - 200) / 160 * 0.15;
      g1.fillStyle(0x0a2040, alpha);
      g1.fillRect(0, y, W * 12, 4);
    }
    this._parallaxLayers.push({ g: g1, speed: 0.05, origX: 0 });

    // Layer 2: distant hills / far land (right side only — the shore is far away)
    var g2 = this.add.graphics();
    g2.setScrollFactor(0.15);
    g2.setDepth(2);
    // Draw rolling distant silhouette
    g2.fillStyle(0x0a0f1a, 1);
    g2.beginPath();
    g2.moveTo(2600, H);
    for (var x = 2600; x <= 8000; x += 30) {
      var hy = H - 60 - Math.sin((x - 2600) * 0.008) * 30 - Math.sin((x - 2600) * 0.02) * 15;
      g2.lineTo(x, hy);
    }
    g2.lineTo(8000, H);
    g2.closePath();
    g2.fillPath();
    this._parallaxLayers.push({ g: g2, speed: 0.15 });

    // Layer 3: mid-ground rocks / trees near shore
    var g3 = this.add.graphics();
    g3.setScrollFactor(0.35);
    g3.setDepth(3);
    g3.fillStyle(0x080c14, 1);
    g3.beginPath();
    g3.moveTo(2800, H);
    for (var x = 2800; x <= 8000; x += 20) {
      var hy = H - 30 - Math.sin(x * 0.015) * 20 - Math.sin(x * 0.04) * 10;
      g3.lineTo(x, hy);
    }
    g3.lineTo(8000, H);
    g3.closePath();
    g3.fillPath();
    this._parallaxLayers.push({ g: g3, speed: 0.35 });

    // Layer 4: near foreground seaweed/rocks
    var g4 = this.add.graphics();
    g4.setScrollFactor(0.7);
    g4.setDepth(4);
    g4.fillStyle(0x060a10, 1);
    // Occasional rocks jutting up from bottom
    var rockXs = [400, 900, 1400, 1900, 2400, 3200, 4100, 5000, 5800, 6500];
    rockXs.forEach(function (rx) {
      var rh = 20 + Math.random() * 30;
      g4.fillEllipse(rx, H - rh / 2, 30 + Math.random() * 20, rh);
    });
    this._parallaxLayers.push({ g: g4, speed: 0.7 });
  },

  _buildWorld: function (W, H) {
    this._groundGroup = this.physics.add.staticGroup();

    // Sea floor (invisible — respawn zone, not solid)
    // Shore platforms start at x=2800
    var shoreData = [
      // [x, y, w] — y is top of platform
      [2780, H - 40, 200],
      [2980, H - 40, 300],
      [3280, H - 80, 200],
      [3480, H - 60, 400],
      [3880, H - 40, 600],
      [4480, H - 80, 200],
      [4680, H - 40, 800],
      [5480, H - 40, 400],
      [5880, H - 100, 200],
      [6080, H - 40, 1200]
    ];

    shoreData.forEach(function (d) {
      var px = d[0], py = d[1], pw = d[2];
      // Ground drawn as a rectangle
      var g = this.add.graphics();
      g.setDepth(7);
      g.fillStyle(0x0e1018, 1);
      g.fillRect(px, py, pw, H - py + 10);
      // Top edge highlight
      g.fillStyle(0x1a2030, 1);
      g.fillRect(px, py, pw, 3);

      // Physics body
      var body = this.physics.add.staticImage(px + pw / 2, py + 1, 'pixel');
      body.setDisplaySize(pw, 4);
      body.setAlpha(0);
      body.refreshBody();
      this._groundGroup.add(body);
    }, this);

    // Floating log/ice platform in sea (for player to rest on)
    var seaPlatforms = [
      [600, this._seaSurface - 10, 120],
      [1100, this._seaSurface - 10, 100],
      [1600, this._seaSurface - 10, 130],
      [2100, this._seaSurface - 10, 110],
      [2400, this._seaSurface - 10, 100]
    ];
    seaPlatforms.forEach(function (d) {
      var px = d[0], py = d[1], pw = d[2];
      var g = this.add.graphics();
      g.setDepth(7);
      g.fillStyle(0x1a2030, 0.7);
      g.fillRect(px, py, pw, 10);
      g.fillStyle(0x2a3848, 0.5);
      g.fillRect(px, py, pw, 2);
      var body = this.physics.add.staticImage(px + pw / 2, py + 1, 'pixel');
      body.setDisplaySize(pw, 4);
      body.setAlpha(0);
      body.refreshBody();
      this._groundGroup.add(body);
    }, this);
  },

  _buildCaustics: function (W) {
    // Create some caustic highlight objects that animate
    for (var i = 0; i < 12; i++) {
      var cx = Phaser.Math.Between(100, 2600);
      var cobj = this.add.image(cx, this._seaSurface + 10 + Math.random() * 30, 'water_caustic');
      cobj.setDepth(7);
      cobj.setAlpha(0.3);
      this._causticLines.push({ img: cobj, ox: cx, phase: Math.random() * Math.PI * 2 });
    }
  },

  _buildRunes: function (H) {
    var self = this;
    var verses = [
      {
        id: 'r1', x: 700, y: this._seaSurface - 30,
        verse: [
          'The sotka seeks a place to nest,',
          'skimming vast waters, restless, blessed—',
          'finds a knee above the tide,',
          'and there she builds her world inside.'
        ],
        event: function (scene) { self._triggerDuckNest(scene); }
      },
      {
        id: 'r2', x: 1200, y: this._seaSurface - 30,
        verse: [
          'She laid six golden eggs of fire,',
          'and one of iron, cold and dire.',
          'Three days she warmed them, patient, still,',
          'while Ilmatar felt the burning fill.'
        ],
        event: function (scene) { self._triggerEggGlow(scene); }
      },
      {
        id: 'r3', x: 1700, y: this._seaSurface - 30,
        verse: [
          'The knee shifted; the eggs fell free—',
          'they shattered bright into the sea.',
          'The lower shell became the earth,',
          'the upper sky gave heaven birth.'
        ],
        event: function (scene) { self._triggerEggCrack(scene); }
      },
      {
        id: 'r4', x: 2200, y: this._seaSurface - 30,
        verse: [
          'The yolk spread wide as golden sun,',
          'the white spread pale as moon begun.',
          'Spotted fragments flew as stars—',
          'clouds from scattered shell-white shards.'
        ],
        event: function (scene) { self._triggerWorldFormation(scene); }
      },
      {
        id: 'r5', x: 3600, y: H - 100,
        verse: [
          'In the womb of the sea, ages long,',
          'Väinämöinen swam and grew strong.',
          'Eight hundred years he rode the wave—',
          'then swam at last to shore, old and brave.'
        ],
        event: null,
        isCheckpoint: true
      },
      {
        id: 'r6_finale', x: 6700, y: H - 100,
        verse: [
          'He gripped the bare shore with both hands,',
          'and rose from water onto grey sands.',
          'The first man stood on barren ground—',
          'and in the silence, heard no sound.'
        ],
        event: function (scene) { self._triggerFinale(scene); },
        isFinale: true
      }
    ];

    return verses.map(function (v) {
      return RuneManager.createRune(this, v.x, v.y, v);
    }, this);
  },

  _buildDuck: function (H) {
    // Duck starts off-screen right, will fly in at rune r1
    this._duck = this.add.image(-100, this._seaSurface - 20, 'duck');
    this._duck.setDepth(9);
    this._duck.setAlpha(0);
  },

  _triggerDuckNest: function (scene) {
    // Duck flies in from right, lands on "knee" (player position)
    if (scene._duckActive) return;
    scene._duckActive = true;
    var duck = scene._duck;
    var targetX = 720;
    var targetY = scene._seaSurface - 18;
    duck.setPosition(targetX + 300, scene._seaSurface - 60);
    duck.setAlpha(0.9);
    duck.setFlipX(true);
    scene.tweens.add({
      targets: duck,
      x: targetX,
      y: targetY,
      duration: 1800,
      ease: 'Sine.easeOut',
      onComplete: function () {
        // Duck bobs gently
        scene.tweens.add({
          targets: duck,
          y: targetY + 4,
          duration: 900,
          ease: 'Sine.easeInOut',
          yoyo: true,
          repeat: -1
        });
      }
    });
  },

  _triggerEggGlow: function (scene) {
    // Soft orange glow appears under duck
    if (!scene._duck) return;
    var glow = scene.add.graphics();
    glow.setDepth(8);
    glow.fillStyle(0xd4aa44, 0.18);
    glow.fillCircle(scene._duck.x, scene._duck.y, 30);
    scene.tweens.add({
      targets: glow,
      alpha: { from: 0, to: 1 },
      duration: 1000,
      ease: 'Sine.easeIn',
      yoyo: true,
      repeat: 2,
      onComplete: function () { glow.destroy(); }
    });
    RunoAudio.playStingEgg();
  },

  _triggerEggCrack: function (scene) {
    // Eggs shatter — particles fly from duck position
    if (scene._eggFired) return;
    scene._eggFired = true;
    var ex = scene._duck ? scene._duck.x : 1700;
    var ey = scene._seaSurface - 20;
    RunoAudio.playStingEgg();
    // Duck flies away
    if (scene._duck) {
      scene.tweens.add({
        targets: scene._duck,
        x: ex - 400,
        y: ey - 80,
        alpha: 0,
        duration: 1200,
        ease: 'Sine.easeIn'
      });
    }
    // Egg fragment particles
    try {
      var emitter = scene.add.particles(ex, ey, 'egg_fragment', {
        speed: { min: 80, max: 200 },
        angle: { min: 200, max: 340 },
        scale: { start: 1, end: 0.2 },
        alpha: { start: 1, end: 0 },
        gravity: 60,
        lifespan: 1800,
        quantity: 12,
        frequency: -1
      });
      emitter.setDepth(15);
      emitter.explode(12, 0, 0);
      scene.time.delayedCall(2000, function () { emitter.destroy(); });
    } catch (e) {}
  },

  _triggerWorldFormation: function (scene) {
    // Gold particle burst — world forms from egg
    RunoAudio.playStingEgg();
    var ex = scene.cameras.main.scrollX + scene.scale.width / 2;
    var ey = scene.scale.height / 2;
    try {
      var emitter = scene.add.particles(ex, ey, 'particle_gold', {
        speed: { min: 50, max: 300 },
        angle: { min: 0, max: 360 },
        scale: { start: 1.5, end: 0 },
        alpha: { start: 1, end: 0 },
        lifespan: { min: 1000, max: 2500 },
        quantity: 60,
        frequency: -1,
        gravityY: -30
      });
      emitter.setDepth(20);
      emitter.explode(60, 0, 0);
      scene.time.delayedCall(2600, function () { emitter.destroy(); });
    } catch (e) {}

    // Brief sky flash (simulate world forming)
    var flash = scene.add.graphics();
    flash.setScrollFactor(0);
    flash.setDepth(199);
    flash.fillStyle(0xd4aa44, 0.15);
    flash.fillRect(0, 0, scene.scale.width, scene.scale.height);
    scene.tweens.add({
      targets: flash,
      alpha: 0,
      duration: 1500,
      ease: 'Sine.easeOut',
      onComplete: function () { flash.destroy(); }
    });
  },

  _triggerFinale: function (scene) {
    if (scene._finaleTriggered) return;
    scene._finaleTriggered = true;
    scene._playerFrozen = true;

    // Hold the shot — long fade, then title card
    scene.time.delayedCall(2000, function () {
      scene.cameras.main.fadeOut(1500, 0, 0, 0);
      scene.cameras.main.once('camerafadeoutcomplete', function () {
        // Mark Episode 1 complete
        scene.registry.set('ep1Complete', true);
        // Show end card
        scene._showFinaleCard(scene);
      });
    });
  },

  _showFinaleCard: function (scene) {
    var W = scene.scale.width;
    var H = scene.scale.height;
    // Black screen first
    var overlay = scene.add.graphics();
    overlay.setScrollFactor(0);
    overlay.setDepth(250);
    overlay.fillStyle(0x000000, 1);
    overlay.fillRect(0, 0, W, H);

    scene.cameras.main.resetFX(); // reset fade state

    var titleStyle = {
      fontFamily: "'Iowan Old Style', Palatino, Georgia, serif",
      fontSize: '28px',
      color: '#7a8a9a',
      letterSpacing: 6,
      align: 'center',
      wordWrap: { width: W - 60 }
    };
    var t1 = scene.add.text(W / 2, H / 2 - 60, 'I. Birth of Väinämöinen', titleStyle);
    t1.setOrigin(0.5, 0.5);
    t1.setScrollFactor(0);
    t1.setDepth(260);
    t1.setAlpha(0);

    var verseStyle = {
      fontFamily: "Georgia, serif",
      fontSize: '16px',
      color: '#4a5a6a',
      letterSpacing: 2,
      align: 'center',
      wordWrap: { width: W - 60 }
    };
    var t2 = scene.add.text(W / 2, H / 2, 'Complete.', verseStyle);
    t2.setOrigin(0.5, 0.5);
    t2.setScrollFactor(0);
    t2.setDepth(260);
    t2.setAlpha(0);

    var promptStyle = {
      fontFamily: "Georgia, serif",
      fontSize: '13px',
      color: '#2a3a4a',
      letterSpacing: 3
    };
    var prompt = scene.add.text(W / 2, H - 50, 'tap to continue', promptStyle);
    prompt.setOrigin(0.5, 0.5);
    prompt.setScrollFactor(0);
    prompt.setDepth(260);
    prompt.setAlpha(0);

    // Gold drift particles
    try {
      var emitter = scene.add.particles(W / 2, H * 0.7, 'particle_gold', {
        x: { min: -W / 2, max: W / 2 },
        y: { min: 0, max: H },
        speedX: { min: -8, max: 8 },
        speedY: { min: -25, max: -5 },
        scale: { start: 0.8, end: 0 },
        alpha: { start: 0.5, end: 0 },
        lifespan: { min: 3000, max: 6000 },
        frequency: 200,
        quantity: 1
      });
      emitter.setScrollFactor(0);
      emitter.setDepth(255);
    } catch (e) {}

    scene.tweens.add({ targets: t1, alpha: 1, duration: 1500, delay: 400, ease: 'Sine.easeIn' });
    scene.tweens.add({ targets: t2, alpha: 1, duration: 1200, delay: 1400, ease: 'Sine.easeIn' });
    scene.tweens.add({ targets: prompt, alpha: 1, duration: 1000, delay: 2500, ease: 'Sine.easeIn' });

    scene.time.delayedCall(2800, function () {
      scene.input.once('pointerdown', function () {
        scene.cameras.main.fadeOut(600, 0, 0, 0);
        scene.cameras.main.once('camerafadeoutcomplete', function () {
          scene.scene.start('TitleScene');
        });
      });
      scene.input.keyboard.once('keydown', function () {
        scene.cameras.main.fadeOut(600, 0, 0, 0);
        scene.cameras.main.once('camerafadeoutcomplete', function () {
          scene.scene.start('TitleScene');
        });
      });
    });
  },

  update: function (time, delta) {
    this._driftT += delta * 0.001;
    this._waveT += delta * 0.0015;

    if (!this._playerFrozen && !StoryPanel.isActive()) {
      PlayerController.update(delta, this._groundGroup);
    }

    var player = this._player;
    var camX = this.cameras.main.scrollX;

    // Sea / swim mode management
    var inSea = player.x < this._seaEnd && player.y > this._seaSurface - 40;
    PlayerController.setSwimMode(inSea);

    // Draw sea
    this._drawSea(delta);

    // Animate caustics
    this._causticLines.forEach(function (c) {
      c.phase += delta * 0.001;
      c.img.setX(c.ox + Math.sin(c.phase) * 12);
      c.img.setAlpha(0.2 + Math.sin(c.phase * 1.3) * 0.1);
    });

    // Drown / fall check
    if (player.y > this.WORLD_H + 60) {
      RespawnSystem.respawn(player, PlayerController.lastCheckpointX, PlayerController.lastCheckpointY);
    }

    // Rune proximity check
    this._checkRunes(player);

    // Parallax idle drift
    this._idleDrift(delta);
  },

  _drawSea: function (delta) {
    var g = this._seaGraphics;
    g.clear();
    var H = this.scale.height;
    var seaW = this._seaEnd + 200;
    var sy = this._seaSurface;

    // Deep sea fill
    g.fillStyle(0x060e1c, 0.95);
    g.fillRect(0, sy, seaW, H - sy + 10);

    // Wave surface
    g.lineStyle(2, 0x1a3050, 0.8);
    g.beginPath();
    g.moveTo(0, sy);
    for (var x = 0; x <= seaW; x += 8) {
      var wy = sy + Math.sin(x * 0.015 + this._waveT) * 5 + Math.sin(x * 0.04 + this._waveT * 1.5) * 2;
      g.lineTo(x, wy);
    }
    g.strokePath();

    // Surface shimmer
    g.lineStyle(1, 0x2a4860, 0.4);
    g.beginPath();
    g.moveTo(0, sy + 6);
    for (var x = 0; x <= seaW; x += 12) {
      var wy = sy + 6 + Math.sin(x * 0.012 + this._waveT * 0.8) * 3;
      g.lineTo(x, wy);
    }
    g.strokePath();
  },

  _checkRunes: function (player) {
    var self = this;
    this._runes.forEach(function (rune) {
      if (rune.triggered) return;
      var dx = player.x - rune.x;
      var dy = player.y - rune.y;
      var dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 60) {
        // Freeze player briefly
        self._playerFrozen = true;
        // Set as checkpoint
        PlayerController.setCheckpoint(rune.x - 40, rune.y);
        RuneManager.triggerRune(self, rune, function () {
          self._playerFrozen = false;
        });
      }
      // Pulse unlit runes
      if (!rune.triggered) {
        RuneManager.updateRunePulse(rune, 16);
      }
    });
  },

  _idleDrift: function (delta) {
    // Very subtle parallax breathing when idle
  }
});
