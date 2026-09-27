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
    EpisodeKit.begin(this, { worldW: 8000, bg: 0x06060a });
    this._driftT = 0;
    this._stormActive = false;
    this._stormIntensity = 0;
    this._sampoActive = false;
    this._sampoProgress = 0;
    this._sampoComplete = false;
    this._crankingNow = false;
    this._sampoSprite = null;
    this._forgeGlowSprite = null;
    this._windEmitter = null;
    this._isMobile = !this.sys.game.device.os.desktop;

    this._buildParallax(W, H);
    this._buildWorld(W, H);
    this._buildForge(W, H);

    EpisodeKit.finish(this, {
      episode: 2,
      playerX: 120,
      playerY: H - 80,
      runes: this._runeDefs(H),
      opening: {
        fi: [
          'Seppo Ilmarinen, taitaja,',
          'takoja iän-ikuinen,',
          'kutsuttihin Pohjolahan',
          'takomahan Sampo uusi.',
          'Louhi, Pohjolan emäntä,',
          'lupasi tyttären palkaksi.'
        ],
        en: [
          'Ilmarinen, smith eternal,',
          'hammerer from days before us,',
          'was called north to gloomy Pohjola,',
          'there to forge a Sampo, new-made.',
          'Louhi, mistress of the Northland,',
          'pledged her daughter as his payment.'
        ]
      }
    });

    this._vignetteGraphics = this.add.graphics();
    this._vignetteGraphics.setScrollFactor(0);
    this._vignetteGraphics.setDepth(80);
    this._buildCrankPrompt(W, H);
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
    EpisodeKit.ground(this, [
      [0, H - 40, 500],
      [500, H - 70, 200],
      [700, H - 40, 800],
      [1500, H - 90, 180],
      [1680, H - 40, 1000],
      [2680, H - 70, 200],
      [2880, H - 40, 800],
      [3680, H - 50, 600],   // the forge floor
      [4280, H - 40, 1200],  // the escape run begins
      [5480, H - 70, 200],
      [5680, H - 40, 2320]
    ], { fill: 0x0c0c10, edge: 0x18181e });

    EpisodeKit.ledges(this, [
      [1200, H - 150, 120],
      [1600, H - 190, 100],
      [2200, H - 140, 120],
      [3000, H - 160, 100],
      [5000, H - 140, 120],
      [5560, H - 170, 100]
    ], { fill: 0x0e0e14, edge: 0x1e1e28 });
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
      fontSize: '14px',
      color: '#c09040',
      letterSpacing: 2,
      align: 'center',
      backgroundColor: 'rgba(8,6,4,0.6)',
      padding: { x: 10, y: 5 }
    };
    var label = PlayerController.isMobile
      ? 'Pidä hyppynappia · hold jump to turn the Sampo'
      : 'Pidä välilyöntiä · hold Space / ↑ to turn the Sampo';
    this._crankPrompt = this.add.text(W / 2, 64, label, promptStyle);
    this._crankPrompt.setOrigin(0.5, 0.5);
    this._crankPrompt.setScrollFactor(0);
    this._crankPrompt.setDepth(102);
    this._crankPrompt.setAlpha(0);
  },

  _runeDefs: function (H) {
    var self = this;
    return [
      {
        id: 'r1', x: 600, y: H - 110,
        verse: {
          fi: [
            'Kulki kautta kallioiden,',
            'halki Pohjan hämäräisen;',
            'seppo astui, vasara soi,',
            'rauta rinnassa rämisi.'
          ],
          en: [
            'Through the caverns, through the stone-halls,',
            'through the northern gloom he wandered;',
            'on the smith walked, his hammer ringing,',
            'iron singing in his bosom.'
          ]
        }
      },
      {
        id: 'r2', x: 1590, y: H - 140,
        verse: {
          fi: [
            'Lietsoivat lietsehet orjat,',
            'painoivat palkeita väkevät;',
            'kolme päivää, kolme yötä',
            'tuli ahjossa tuhisi.',
            'Katsoi seppo ahjon alle:',
            'Sampo nousi tulen alta.'
          ],
          en: [
            'Thralls were set to work the bellows,',
            'strong men pressed and pumped the leather;',
            'three long days and three long nights through',
            'roared the fire within the furnace.',
            'Then the smith looked in the embers:',
            'from the flame the Sampo, rising.'
          ]
        },
        event: function (scene) { self._triggerForgeApproach(scene); }
      },
      {
        id: 'r3_sampo', x: 3900, y: H - 110,
        verse: {
          fi: [
            'Jauhoi Sampo, kirjokansi,',
            'jauhoi purnun puhtehessa:',
            'yhen purnun syötäviä,',
            'toisen purnun myötäviä,',
            'kolmannen kotipitoja.',
            'Kierrä kirjokantta, kierrä!'
          ],
          en: [
            'Now the Sampo ground, bright-lidded,',
            'ground a binful at the dusking:',
            'one bin full of grain for eating,',
            'one bin full of goods for trading,',
            'and a third for home and keeping.',
            'Turn the bright lid, turn the Sampo!'
          ]
        },
        event: function (scene) { self._triggerSampoCrank(scene); }
      },
      {
        id: 'r4', x: 5100, y: H - 100,
        verse: {
          fi: [
            'Veivät Sammon venehesen,',
            'soutivat selälle suurelle.',
            'Heräsi Pohjolan emäntä,',
            'nosti myrskyn, nosti tuulen.',
            'Pimeni taivas, pauhui meri.'
          ],
          en: [
            'Then the heroes stole the Sampo,',
            'rowed it out upon the broad sea.',
            'Woke the mistress of the Northland,',
            'raised a tempest, raised the storm-wind.',
            'Black the sky grew, roared the ocean.'
          ]
        },
        event: function (scene) { self._triggerStorm(scene); }
      },
      {
        id: 'r5', x: 6200, y: H - 100,
        verse: {
          fi: [
            'Kirposi kirjokansi,',
            'Sampo särkyi kappaleiksi;',
            'muruset meren sisähän,',
            'suuret alle aaltojen.',
            'Ne muruset maalle jäivät:',
            'siitä kasvu, siitä onni.'
          ],
          en: [
            'Burst apart the bright-lidded Sampo,',
            'into fragments it was shattered;',
            'little pieces to the ocean,',
            'great ones deep beneath the billows.',
            'Those that drifted to the shoreline:',
            'from them growth, and from them fortune.'
          ]
        },
        event: function (scene) { self._triggerSampoShatter(scene); }
      },
      {
        id: 'r6_finale', x: 7600, y: H - 100,
        isFinale: true,
        verse: {
          fi: [
            'Tyyntyi myrsky, lepäsi meri,',
            'päivä nousi kultaisena.',
            'Vaka vanha Väinämöinen',
            'kylvi Sammon kappaleita:',
            '"Siitä kasvu, siitä onni,',
            'siitä leipä Suomen maalle!"'
          ],
          en: [
            'Stilled the storm; the sea lay sleeping;',
            'up the sun rose, golden, gleaming.',
            'Steadfast, old Väinämöinen',
            'sowed the fragments of the Sampo:',
            '"Here be growth and here be fortune,',
            'here be bread for Suomi\'s children!"'
          ]
        },
        event: function (scene) {
          EpisodeKit.finale(scene, {
            episode: 2,
            numeral: 'II',
            title: { fi: 'Sampo', en: 'The Sampo' },
            color: '#8a7040',
            hold: 2200,
            lines: [
              { fi: 'Sampo on särkynyt, mutta maa vihannoi.', en: 'The Sampo is broken, yet the land grows green.' },
              { fi: 'Seuraavaksi: Laulukilpa.', en: 'Next: the Singing Contest.' }
            ]
          });
        }
      }
    ];
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

  update: function (time, delta) {
    this._driftT += delta * 0.001;
    var player = this._player;

    // Cranking holds the smith in place: jump turns the mill instead of jumping.
    var nearForge = Math.abs(player.x - this._forgeX) < 220;
    this._crankingNow = this._sampoActive && !this._sampoComplete && nearForge &&
      !StoryPanel.isActive() && PlayerController.input().jump;
    this._holdPlayer = this._crankingNow;

    EpisodeKit.update(this, delta);

    if (this._sampoActive && !this._sampoComplete) {
      this._updateSampoCrank(delta, player);
    }

    if (this._sampoSprite && this._sampoProgress > 0) {
      this._sampoSprite.setAngle(this._sampoSprite.angle + delta * 0.08 * (0.5 + this._sampoProgress));
    }

    if (this._stormActive) {
      this._updateStorm(delta);
    } else if (this._stormIntensity > 0) {
      this._stormIntensity = Math.max(0, this._stormIntensity - delta * 0.001);
      this._drawVignette(this._stormIntensity);
    }
  },

  _updateSampoCrank: function (delta, player) {
    var cranking = this._crankingNow;

    // Must be near forge
    if (cranking) {
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
