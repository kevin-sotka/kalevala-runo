// episode2.js — The Sampo
// Forge approach → Sampo crank mechanic → Louhi storm escape → shattering finale → end card

var Episode2Scene = new Phaser.Class({
  Extends: Phaser.Scene,
  initialize: function Episode2Scene() {
    Phaser.Scene.call(this, { key: 'Episode2Scene' });
  },

  create: function () {
    var W = this.scale.width;
    var H = this.scale.height;
    this.WORLD_W = 8000;
    this.WORLD_H = H;
    this._driftT = 0;
    this._finaleTriggered = false;
    this._playerFrozen = false;
    this._stormActive = false;
    this._stormIntensity = 0;
    this._sampoProgress = 0;
    this._sampoCranking = false;
    this._sampoComplete = false;
    this._sampoSprite = null;
    this._forgeGlowSprite = null;
    this._vignetteGraphics = null;
    this._shakeTimer = 0;
    this._shakeIntensity = 0;
    this._windEmitter = null;
    this._isMobile = !this.sys.game.device.os.desktop;

    this.physics.world.setBounds(0, 0, this.WORLD_W, H + 200);
    this.cameras.main.setBounds(0, 0, this.WORLD_W, H);
    this.cameras.main.setBackgroundColor(0x06060a);

    // ── Background / parallax ───────────────────────────────────────
    this._buildParallax(W, H);

    // ── World geometry ──────────────────────────────────────────────
    this._buildWorld(W, H);

    // ── Special entities ────────────────────────────────────────────
    this._buildForge(W, H);

    // ── Player ──────────────────────────────────────────────────────
    this._player = PlayerController.init(this, 120, H - 80);
    PlayerController.setCheckpoint(120, H - 80);
    PlayerController.setSwimMode(false);

    // ── Colliders ───────────────────────────────────────────────────
    this.physics.add.collider(this._player, this._groundGroup);

    // ── Respawn ─────────────────────────────────────────────────────
    RespawnSystem.init(this);

    // ── Vignette (storm darkness) ───────────────────────────────────
    this._vignetteGraphics = this.add.graphics();
    this._vignetteGraphics.setScrollFactor(0);
    this._vignetteGraphics.setDepth(150);

    // ── Rune stones ─────────────────────────────────────────────────
    this._runes = this._buildRunes(H);

    // ── Camera ──────────────────────────────────────────────────────
    this.cameras.main.startFollow(this._player, true, 0.08, 0.08);
    this.cameras.main.setFollowOffset(-80, 0);

    // ── UI ──────────────────────────────────────────────────────────
    MuteButton.create(this);
    this._buildCrankPrompt(W, H);

    // ── Audio ───────────────────────────────────────────────────────
    RunoAudio.start(2);

    // ── Camera fade in ──────────────────────────────────────────────
    this.cameras.main.fadeIn(800, 0, 0, 0);

    // ── Input for story ─────────────────────────────────────────────
    this.input.on('pointerdown', function () {
      if (StoryPanel.isActive()) StoryPanel.advance();
    });
    this.input.keyboard.on('keydown-ENTER', function () {
      if (StoryPanel.isActive()) StoryPanel.advance();
    });
    this.input.keyboard.on('keydown-SPACE', function () {
      if (StoryPanel.isActive()) StoryPanel.advance();
    });

    // Opening verse
    var self = this;
    this.time.delayedCall(600, function () {
      StoryPanel.show(self, [
        'Ilmarinen, great smith of the north,',
        'was called to Pohjola to bring forth',
        'a Sampo — mill of salt, grain, and gold—',
        'payment for a bride, so it was told.'
      ], function () {});
    });
  },

  _buildParallax: function (W, H) {
    // Layer 1: far darkness — rocky cliffs, very dark iron
    var g1 = this.add.graphics();
    g1.setScrollFactor(0.08);
    g1.setDepth(1);
    g1.fillStyle(0x080810, 1);
    g1.beginPath();
    g1.moveTo(0, H);
    for (var x = 0; x <= this.WORLD_W + 200; x += 25) {
      var hy = H - 80 - Math.sin(x * 0.006) * 40 - Math.sin(x * 0.018) * 20;
      g1.lineTo(x, hy);
    }
    g1.lineTo(this.WORLD_W + 200, H);
    g1.closePath();
    g1.fillPath();

    // Layer 2: mid-ground jagged dark cliffs
    var g2 = this.add.graphics();
    g2.setScrollFactor(0.2);
    g2.setDepth(2);
    g2.fillStyle(0x060608, 1);
    g2.beginPath();
    g2.moveTo(0, H);
    for (var x = 0; x <= this.WORLD_W + 100; x += 15) {
      var hy = H - 40 - Math.abs(Math.sin(x * 0.01)) * 30 - Math.sin(x * 0.03) * 12;
      g2.lineTo(x, hy);
    }
    g2.lineTo(this.WORLD_W + 100, H);
    g2.closePath();
    g2.fillPath();

    // Layer 3: forge warmth glow in mid-ground (amber smear near forge area)
    this._forgeBgGlow = this.add.graphics();
    this._forgeBgGlow.setScrollFactor(0.4);
    this._forgeBgGlow.setDepth(3);
    this._forgeBgGlow.setAlpha(0);
    var fgx = 3200, fgy = H - 120;
    [0.3, 0.15, 0.06].forEach(function (a, i) {
      this._forgeBgGlow.fillStyle(0xc06010, a);
      this._forgeBgGlow.fillCircle(fgx, fgy, 160 + i * 80);
    }, this);

    // Layer 4: near rock silhouettes
    var g4 = this.add.graphics();
    g4.setScrollFactor(0.6);
    g4.setDepth(4);
    g4.fillStyle(0x040406, 1);
    var rockXs = [300, 800, 1600, 2000, 4500, 5500, 6000, 7000];
    rockXs.forEach(function (rx) {
      var rh = 40 + Math.random() * 50;
      var rw = 30 + Math.random() * 50;
      g4.fillEllipse(rx, H - rh / 2, rw, rh);
    });
  },

  _buildWorld: function (W, H) {
    this._groundGroup = this.physics.add.staticGroup();

    // Ground segments — forge cavern landscape
    var segments = [
      [0, H - 40, 500],
      [500, H - 70, 200],
      [700, H - 40, 300],
      [1000, H - 40, 500],
      [1500, H - 90, 180],
      [1680, H - 40, 400],
      [2080, H - 40, 600],
      [2680, H - 70, 200],
      [2880, H - 40, 800],
      // Forge platform
      [3680, H - 50, 600],
      [4280, H - 40, 400],
      [4680, H - 40, 800],  // escape run begins
      [5480, H - 70, 200],
      [5680, H - 40, 600],
      [6280, H - 40, 400],
      [6680, H - 40, 800],
      [7480, H - 40, 600]
    ];

    segments.forEach(function (d) {
      var px = d[0], py = d[1], pw = d[2];
      var g = this.add.graphics();
      g.setDepth(7);
      g.fillStyle(0x0c0c10, 1);
      g.fillRect(px, py, pw, H - py + 10);
      g.fillStyle(0x18181e, 1);
      g.fillRect(px, py, pw, 3);
      var body = this.physics.add.staticImage(px + pw / 2, py + 1, 'pixel');
      body.setDisplaySize(pw, 4);
      body.setAlpha(0);
      body.refreshBody();
      this._groundGroup.add(body);
    }, this);

    // Elevated platforms
    var platforms = [
      [1200, H - 150, 120],
      [1600, H - 180, 100],
      [2200, H - 140, 120],
      [3000, H - 160, 100],
      [5000, H - 140, 120],
      [5600, H - 170, 100]
    ];
    platforms.forEach(function (d) {
      var px = d[0], py = d[1], pw = d[2];
      var g = this.add.graphics();
      g.setDepth(7);
      g.fillStyle(0x0e0e14, 1);
      g.fillRect(px, py, pw, 12);
      g.fillStyle(0x1e1e28, 1);
      g.fillRect(px, py, pw, 3);
      var body = this.physics.add.staticImage(px + pw / 2, py + 1, 'pixel');
      body.setDisplaySize(pw, 4);
      body.setAlpha(0);
      body.refreshBody();
      this._groundGroup.add(body);
    }, this);
  },

  _buildForge: function (W, H) {
    var forgeX = 3900;
    var forgeY = H - 50;

    // Anvil
    var anvil = this.add.image(forgeX - 60, forgeY - 20, 'anvil');
    anvil.setDepth(8);

    // Sampo mill
    this._sampoSprite = this.add.image(forgeX + 20, forgeY - 50, 'sampo');
    this._sampoSprite.setDepth(9);

    // Forge glow (hidden until crank)
    this._forgeGlowSprite = this.add.image(forgeX, forgeY - 30, 'forge_glow');
    this._forgeGlowSprite.setDepth(6);
    this._forgeGlowSprite.setAlpha(0);
    this._forgeX = forgeX;
    this._forgeY = forgeY;
  },

  _buildCrankPrompt: function (W, H) {
    var promptStyle = {
      fontFamily: "Georgia, serif",
      fontSize: '13px',
      color: '#6a5020',
      letterSpacing: 2,
      align: 'center'
    };
    this._crankPrompt = this.add.text(W / 2, H - 30, 'Hold RIGHT / hold jump to crank the Sampo', promptStyle);
    this._crankPrompt.setOrigin(0.5, 1);
    this._crankPrompt.setScrollFactor(0);
    this._crankPrompt.setDepth(102);
    this._crankPrompt.setAlpha(0);
  },

  _buildRunes: function (H) {
    var self = this;
    var verses = [
      {
        id: 'r1', x: 600, y: H - 100,
        verse: [
          'Through caverns dark and caverns deep,',
          "where Pohjola's cold shadows creep,",
          'the smith walked on with iron will—',
          'his hammer singing, never still.'
        ],
        event: null
      },
      {
        id: 'r2', x: 1500, y: H - 130,
        verse: [
          'At the forge the bellows roared and blew,',
          'three days of fire until iron grew',
          'into shapes unimagined, turning slow—',
          'the Sampo rose in amber glow.'
        ],
        event: function (scene) { self._triggerForgeApproach(scene); }
      },
      {
        id: 'r3_sampo', x: 3900, y: H - 110,
        verse: [
          'Here the Sampo turns — grain, salt, and gold,',
          "a world's abundance, yet to be told.",
          'Crank the great mill; let it begin.',
          'Turn, Sampo, turn — let plenty in.'
        ],
        event: function (scene) { self._triggerSampoCrank(scene); },
        isSampoRune: true
      },
      {
        id: 'r4', x: 5100, y: H - 100,
        verse: [
          'The heroes seized the Sampo in the night,',
          'sailed swift across the sea in flight.',
          'But Louhi woke — her voice became the storm.',
          'Black skies devoured the morning warm.'
        ],
        event: function (scene) { self._triggerStorm(scene); }
      },
      {
        id: 'r5', x: 6200, y: H - 100,
        verse: [
          'The Sampo struck the rock and broke in three,',
          'its shards flew wide across the winter sea.',
          'Fragments that sank would seed the deep—',
          'those on shore, abundance for man to keep.'
        ],
        event: function (scene) { self._triggerSampoShatter(scene); }
      },
      {
        id: 'r6_finale', x: 7600, y: H - 100,
        verse: [
          'The storm grew quiet; the sea lay still.',
          'Gold light crept up from under the hill.',
          'The Sampo was gone — yet the world grew green.',
          'All plenty from what had shattered, unseen.'
        ],
        event: function (scene) { self._triggerFinale(scene); },
        isFinale: true
      }
    ];

    return verses.map(function (v) {
      return RuneManager.createRune(this, v.x, v.y, v);
    }, this);
  },

  _triggerForgeApproach: function (scene) {
    // Forge glow background fades in
    scene.tweens.add({
      targets: scene._forgeBgGlow,
      alpha: 1,
      duration: 2000,
      ease: 'Sine.easeIn'
    });
    RunoAudio.playStingForge();
  },

  _triggerSampoCrank: function (scene) {
    // Show crank prompt, enable crank mechanic
    scene._sampoActive = true;
    scene.tweens.add({
      targets: scene._crankPrompt,
      alpha: 1,
      duration: 600,
      ease: 'Sine.easeIn'
    });
    scene.tweens.add({
      targets: scene._forgeGlowSprite,
      alpha: 0.6,
      duration: 1000,
      ease: 'Sine.easeIn'
    });
    RunoAudio.playStingForge();
  },

  _triggerStorm: function (scene) {
    if (scene._stormActive) return;
    scene._stormActive = true;
    RunoAudio.playStingStorm();

    // Start wind particles
    try {
      scene._windEmitter = scene.add.particles(
        scene.cameras.main.scrollX + scene.scale.width + 50,
        scene.scale.height / 2,
        'particle_wind',
        {
          x: { min: 0, max: scene.scale.width },
          y: { min: 0, max: scene.scale.height },
          speedX: { min: -200, max: -80 },
          speedY: { min: -20, max: 20 },
          scale: { start: 1, end: 0 },
          alpha: { start: 0.5, end: 0 },
          lifespan: { min: 400, max: 800 },
          frequency: 40,
          quantity: 2
        }
      );
      scene._windEmitter.setScrollFactor(0);
      scene._windEmitter.setDepth(120);
    } catch (e) {}
  },

  _triggerSampoShatter: function (scene) {
    // Flash + gold particle burst
    RunoAudio.playStingSampoShatter();

    var W = scene.scale.width;
    var H = scene.scale.height;

    // White flash
    var flash = scene.add.graphics();
    flash.setScrollFactor(0);
    flash.setDepth(220);
    flash.fillStyle(0xffffff, 1);
    flash.fillRect(0, 0, W, H);
    scene.tweens.add({
      targets: flash,
      alpha: 0,
      duration: 800,
      ease: 'Sine.easeOut',
      onComplete: function () { flash.destroy(); }
    });

    // Gold burst from current camera center
    var ex = scene.cameras.main.scrollX + W / 2;
    var ey = H / 2;
    try {
      var emitter = scene.add.particles(ex, ey, 'particle_gold', {
        speed: { min: 80, max: 380 },
        angle: { min: 0, max: 360 },
        scale: { start: 1.5, end: 0 },
        alpha: { start: 1, end: 0 },
        lifespan: { min: 1500, max: 3500 },
        quantity: 80,
        frequency: -1,
        gravityY: -20
      });
      emitter.setDepth(200);
      emitter.explode(80, 0, 0);
      scene.time.delayedCall(4000, function () { emitter.destroy(); });
    } catch (e) {}

    // Transition sky to dawn (fade in dawn layer)
    scene._showDawnSky(scene);

    // Stop storm
    scene._stormActive = false;
    scene._stormIntensity = 0;
    if (scene._windEmitter) {
      scene._windEmitter.stop();
      scene.time.delayedCall(1000, function () {
        if (scene._windEmitter) { scene._windEmitter.destroy(); scene._windEmitter = null; }
      });
    }
  },

  _showDawnSky: function (scene) {
    var W = scene.scale.width;
    var H = scene.scale.height;
    var dawnSky = scene.add.image(W / 2, H / 2, 'sky_dawn');
    dawnSky.setDisplaySize(W, H);
    dawnSky.setScrollFactor(0);
    dawnSky.setDepth(0);
    dawnSky.setAlpha(0);
    scene.tweens.add({
      targets: dawnSky,
      alpha: 1,
      duration: 3000,
      ease: 'Sine.easeIn'
    });
  },

  _triggerFinale: function (scene) {
    if (scene._finaleTriggered) return;
    scene._finaleTriggered = true;
    scene._playerFrozen = true;

    scene.time.delayedCall(2200, function () {
      scene.cameras.main.fadeOut(1500, 0, 0, 0);
      scene.cameras.main.once('camerafadeoutcomplete', function () {
        scene._showEndCard(scene);
      });
    });
  },

  _showEndCard: function (scene) {
    var W = scene.scale.width;
    var H = scene.scale.height;

    var overlay = scene.add.graphics();
    overlay.setScrollFactor(0);
    overlay.setDepth(250);
    overlay.fillStyle(0x000000, 1);
    overlay.fillRect(0, 0, W, H);

    scene.cameras.main.resetFX();

    // Gold mote drift
    try {
      var emitter = scene.add.particles(W / 2, H * 0.7, 'particle_gold', {
        x: { min: -W / 2, max: W / 2 },
        y: { min: 0, max: H },
        speedX: { min: -10, max: 10 },
        speedY: { min: -30, max: -6 },
        scale: { start: 1, end: 0 },
        alpha: { start: 0.6, end: 0 },
        lifespan: { min: 3000, max: 7000 },
        frequency: 160,
        quantity: 1
      });
      emitter.setScrollFactor(0);
      emitter.setDepth(255);
    } catch (e) {}

    var titleStyle = {
      fontFamily: "'Iowan Old Style', Palatino, Georgia, serif",
      fontSize: '26px',
      color: '#8a7040',
      letterSpacing: 8,
      align: 'center',
      wordWrap: { width: W - 60 }
    };
    var t1 = scene.add.text(W / 2, H / 2 - 80, 'II. The Sampo', titleStyle);
    t1.setOrigin(0.5, 0.5);
    t1.setScrollFactor(0);
    t1.setDepth(260);
    t1.setAlpha(0);

    var endStyle = {
      fontFamily: "'Iowan Old Style', Georgia, serif",
      fontSize: '20px',
      color: '#6a8060',
      letterSpacing: 4,
      align: 'center',
      wordWrap: { width: W - 60 }
    };
    var t2 = scene.add.text(W / 2, H / 2 - 20, 'More runos to come.', endStyle);
    t2.setOrigin(0.5, 0.5);
    t2.setScrollFactor(0);
    t2.setDepth(260);
    t2.setAlpha(0);

    var subStyle = {
      fontFamily: "Georgia, serif",
      fontSize: '13px',
      color: '#3a4a3a',
      letterSpacing: 3,
      align: 'center',
      wordWrap: { width: W - 60 }
    };
    var t3 = scene.add.text(W / 2, H / 2 + 30, 'Lemminkäinen · The Kantele · The Bear Hunt', subStyle);
    t3.setOrigin(0.5, 0.5);
    t3.setScrollFactor(0);
    t3.setDepth(260);
    t3.setAlpha(0);

    var promptStyle = {
      fontFamily: "Georgia, serif",
      fontSize: '13px',
      color: '#2a3a2a',
      letterSpacing: 3
    };
    var prompt = scene.add.text(W / 2, H - 50, 'tap to return', promptStyle);
    prompt.setOrigin(0.5, 0.5);
    prompt.setScrollFactor(0);
    prompt.setDepth(260);
    prompt.setAlpha(0);

    scene.tweens.add({ targets: t1, alpha: 1, duration: 1500, delay: 400, ease: 'Sine.easeIn' });
    scene.tweens.add({ targets: t2, alpha: 1, duration: 1200, delay: 1800, ease: 'Sine.easeIn' });
    scene.tweens.add({ targets: t3, alpha: 1, duration: 1000, delay: 2600, ease: 'Sine.easeIn' });
    scene.tweens.add({ targets: prompt, alpha: 1, duration: 1000, delay: 3200, ease: 'Sine.easeIn' });

    scene.time.delayedCall(3500, function () {
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

    if (!this._playerFrozen && !StoryPanel.isActive()) {
      PlayerController.update(delta, this._groundGroup);
    }

    var player = this._player;

    // Fall / off-world check
    if (player.y > this.WORLD_H + 80) {
      RespawnSystem.respawn(player, PlayerController.lastCheckpointX, PlayerController.lastCheckpointY);
    }

    // Rune proximity check
    this._checkRunes(player);

    // Sampo crank mechanic
    if (this._sampoActive && !this._sampoComplete) {
      this._updateSampoCrank(delta, player);
    }

    // Sampo spin
    if (this._sampoSprite && this._sampoProgress > 0) {
      this._sampoSprite.setAngle(this._sampoSprite.angle + delta * 0.08 * (0.5 + this._sampoProgress));
    }

    // Storm / shake
    if (this._stormActive) {
      this._updateStorm(delta);
    } else if (this._stormIntensity > 0) {
      this._stormIntensity = Math.max(0, this._stormIntensity - delta * 0.001);
      this._drawVignette(this._stormIntensity);
    }
  },

  _checkRunes: function (player) {
    var self = this;
    this._runes.forEach(function (rune) {
      if (rune.triggered) return;
      var dx = player.x - rune.x;
      var dy = player.y - rune.y;
      var dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 60) {
        self._playerFrozen = true;
        PlayerController.setCheckpoint(rune.x - 40, rune.y);
        RuneManager.triggerRune(self, rune, function () {
          self._playerFrozen = false;
        });
      }
      if (!rune.triggered) RuneManager.updateRunePulse(rune, 16);
    });
  },

  _updateSampoCrank: function (delta, player) {
    var cursors = PlayerController.cursors;
    var wasd = PlayerController.wasd;
    var touchRight = PlayerController.touchRight;
    var touchJump = PlayerController.touchJump;

    var cranking = cursors.right.isDown || wasd.right.isDown || touchRight || touchJump;

    // Must be near forge
    var nearForge = Math.abs(player.x - this._forgeX) < 200;
    if (cranking && nearForge) {
      this._sampoProgress = Math.min(1, this._sampoProgress + delta * 0.0008);
      this._sampoCranking = true;

      // Forge glow intensity
      if (this._forgeGlowSprite) {
        this._forgeGlowSprite.setAlpha(0.4 + this._sampoProgress * 0.6);
        this._forgeGlowSprite.setScale(0.8 + this._sampoProgress * 0.8);
      }
      if (this._forgeBgGlow) {
        this._forgeBgGlow.setAlpha(this._sampoProgress);
      }

      // Audio pitch shift hint
      RunoAudio.setEpisodeFilter(this._sampoProgress);

      if (this._sampoProgress >= 1.0 && !this._sampoComplete) {
        this._sampoComplete = true;
        this._onSampoComplete();
      }
    } else {
      this._sampoCranking = false;
    }
  },

  _onSampoComplete: function () {
    // Hide crank prompt
    this.tweens.add({
      targets: this._crankPrompt,
      alpha: 0,
      duration: 400,
      ease: 'Sine.easeOut'
    });
    RunoAudio.playStingForge();

    // Forge sparkle burst
    try {
      var emitter = this.add.particles(this._forgeX, this._forgeY - 50, 'particle_spark', {
        speed: { min: 60, max: 200 },
        angle: { min: 230, max: 310 },
        scale: { start: 1, end: 0 },
        alpha: { start: 1, end: 0 },
        lifespan: { min: 400, max: 800 },
        quantity: 30,
        frequency: -1
      });
      emitter.setDepth(15);
      emitter.explode(30, 0, 0);
      this.time.delayedCall(900, function () { emitter.destroy(); });
    } catch (e) {}
  },

  _updateStorm: function (delta) {
    this._stormTimer = (this._stormTimer || 0) + delta;
    this._stormIntensity = Math.min(1, this._stormIntensity + delta * 0.0005);

    // Screen shake (capped on mobile); re-fire as each pulse ends for a rhythmic rumble
    var shakeMax = this._isMobile ? 0.002 : 0.005;
    if (!this.cameras.main.shakeEffect.isRunning) {
      this.cameras.main.shake(150, shakeMax * this._stormIntensity);
    }

    // Draw closing vignette
    this._drawVignette(this._stormIntensity);

    // Wind emitter follow camera
    if (this._windEmitter) {
      // Keep emitter anchored to screen
    }
  },

  _drawVignette: function (intensity) {
    if (!this._vignetteGraphics) return;
    var W = this.scale.width;
    var H = this.scale.height;
    var g = this._vignetteGraphics;
    g.clear();
    if (intensity <= 0) return;

    // Radial darkness from right edge
    var breathe = 0.85 + Math.sin(this._driftT * 3) * 0.08;
    var edgeW = W * 0.55 * intensity * breathe;

    // Right side darkness band
    for (var i = 0; i < 20; i++) {
      var t = i / 20;
      var bandW = edgeW * (1 - t);
      var alpha = intensity * (1 - t) * 0.85;
      g.fillStyle(0x000000, alpha);
      g.fillRect(W - bandW, 0, bandW, H);
    }
  }
});
