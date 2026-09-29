// episode1.js — I · Väinämöisen synty · The Birth of Väinämöinen (Runo 1)
// Sea float segment → the sotka's nest → egg-crack world formation → shore → finale

var Episode1Scene = new Phaser.Class({
  Extends: Phaser.Scene,
  initialize: function Episode1Scene() {
    Phaser.Scene.call(this, { key: 'Episode1Scene' });
  },

  create: function () {
    var W = this.scale.width;
    var H = this.scale.height;
    EpisodeKit.begin(this, { worldW: 7200, bg: 0x080e1a });
    this._driftT = 0;
    this._waveT = 0;
    this._duckActive = false;
    this._eggFired = false;

    this._seaSurface = 340; // y of the calm sea surface
    this._seaEnd = 2800;    // x where the sea meets the shore

    this._buildParallax(W, H);
    this._buildWorld(W, H);

    this._seaGraphics = this.add.graphics();
    this._seaGraphics.setDepth(6);
    // Translucent water in front of the Wanderer so a swimmer reads as
    // half-submerged rather than standing on the surface.
    this._seaFront = this.add.graphics();
    this._seaFront.setDepth(11);

    this._causticLines = [];
    this._buildCaustics();

    // The sea is buoyant; a gentle swell carries the Wanderer toward the shore.
    var self = this;
    PlayerController.setWater(null);
    this._water = {
      surfaceAt: function (x) { return x < self._seaEnd ? self._waveY(x) : null; },
      currentAt: function () { return 12; }
    };

    this._buildDuck();

    var moon = this.add.image(W * 0.7, 80, 'moon');
    moon.setScrollFactor(0.05);
    moon.setDepth(2);
    moon.setAlpha(0.85);

    EpisodeKit.finish(this, {
      episode: 1,
      playerX: 140,
      playerY: this._seaSurface - 30,
      runes: this._runeDefs(H),
      opening: {
        fi: [
          'Mieleni minun tekevi,',
          'aivoni ajattelevi',
          'lähteäni laulamahan,',
          'saa\'ani sanelemahan.'
        ],
        en: [
          'I am driven by my longing,',
          'and my understanding urges',
          'that I should commence my singing,',
          'and begin my recitation.'
        ]
      }
    });
    PlayerController.setWater(this._water);
  },

  _waveY: function (x) {
    return this._seaSurface + Math.sin(x * 0.015 + this._waveT) * 5 + Math.sin(x * 0.04 + this._waveT * 1.5) * 2;
  },

  _buildParallax: function (W, H) {
    var px = EpisodeKit.px;

    // Far horizon glow
    var g1 = this.add.graphics();
    g1.setScrollFactor(0.05);
    g1.setDepth(1);
    for (var y = 200; y < 360; y += 4) {
      g1.fillStyle(0x0a2040, 0.05 + (y - 200) / 160 * 0.15);
      g1.fillRect(0, y, W * 2, 4);
    }
    EpisodeKit.layer(this, g1, { top: 200, left: 0, right: W * 2 });

    // Distant hills rise on the horizon as the shore draws near
    var hillStart = px(this._seaEnd - 500, 0.15, W);
    var g2 = this.add.graphics();
    g2.setScrollFactor(0.15);
    g2.setDepth(2);
    g2.fillStyle(0x0a0f1a, 1);
    g2.beginPath();
    g2.moveTo(hillStart, H);
    for (var x = hillStart; x <= px(this.WORLD_W, 0.15, W) + W; x += 20) {
      var rise = Math.min(1, (x - hillStart) / 200);
      var hy = this._seaSurface - 20 - rise * (40 + Math.sin(x * 0.02) * 22 + Math.sin(x * 0.05) * 10);
      g2.lineTo(x, hy);
    }
    g2.lineTo(px(this.WORLD_W, 0.15, W) + W, H);
    g2.closePath();
    g2.fillPath();
    EpisodeKit.layer(this, g2, { top: this._seaSurface - 100, left: hillStart });

    // Mid-ground pines behind the shore
    var treeStart = px(this._seaEnd, 0.35, W);
    var sea = this._seaSurface;
    var g3 = EpisodeKit.forest(this, 0.35, 3, 0x080c14, function (x) {
      return sea - 10 - Math.sin(x * 0.015) * 8;
    }, { from: treeStart, gap: 46, minH: 40, maxH: 90, kinds: ['spruce', 'pine'] });
    g3.fillStyle(0x080c14, 1);
    g3.fillRect(treeStart - 10, sea - 12, px(this.WORLD_W, 0.35, W) + W - treeStart, H);

    // Near rocks breaking the surface of the sea
    var g4 = this.add.graphics();
    g4.setScrollFactor(0.7);
    g4.setDepth(4);
    g4.fillStyle(0x060a10, 1);
    [400, 900, 1400, 1900, 2400].forEach(function (rx) {
      var X = px(rx, 0.7, W);
      var rh = 20 + Math.random() * 30;
      g4.fillEllipse(X, H - rh / 2, 30 + Math.random() * 20, rh);
    });
    EpisodeKit.layer(this, g4, { top: H - 60 });
  },

  _buildWorld: function (W, H) {
    var sea = this._seaSurface;

    // The shore climbs out of the sea: [x, top, width]
    EpisodeKit.ground(this, [
      [2760, sea + 4, 540],
      [3300, sea - 34, 200],
      [3500, sea - 20, 400],
      [3900, sea - 8, 580],
      [4480, sea - 50, 200],
      [4680, sea - 22, 1200],
      [5880, sea - 90, 200],
      [6080, sea - 40, 1200]
    ], { fill: 0x0e1018, edge: 0x1a2030 });

    // Drifting logs, one under each sea rune, plus stepping logs between.
    // One-way: swim up from below and kick onto them.
    var logs = [
      [300, 150], [640, 170], [960, 120], [1130, 170], [1450, 120],
      [1630, 170], [1950, 120], [2130, 170], [2450, 140]
    ];
    this._logs = logs.map(function (d) {
      var x = d[0], w = d[1], y = sea - 8;
      var g = this.add.graphics();
      g.setDepth(7);
      g.fillStyle(0x2a2218, 1);
      g.fillRoundedRect(0, 0, w, 11, 5);
      g.fillStyle(0x3a3020, 1);
      g.fillRoundedRect(2, 1, w - 4, 3, 2);
      g.lineStyle(1, 0x1a140c, 0.9);
      for (var k = 18; k < w - 8; k += 26) g.lineBetween(k, 4, k + 10, 7);
      g.fillStyle(0x4a3c28, 1);
      g.fillCircle(w - 4, 5.5, 4);
      g.setPosition(x, y);
      EpisodeKit.addBody(this, x, y, w, 10, true);
      return { g: g, y: y, phase: Math.random() * 6 };
    }, this);
  },

  _buildCaustics: function () {
    for (var i = 0; i < 12; i++) {
      var cx = Phaser.Math.Between(100, 2600);
      var cobj = this.add.image(cx, this._seaSurface + 10 + Math.random() * 30, 'water_caustic');
      cobj.setDepth(7);
      cobj.setAlpha(0.3);
      this._causticLines.push({ img: cobj, ox: cx, phase: Math.random() * Math.PI * 2 });
    }
  },

  _runeDefs: function (H) {
    var self = this;
    var sea = this._seaSurface;
    return [
      {
        id: 'r0', x: 380, y: sea - 36,
        verse: {
          fi: [
            'Olipa impi, ilman tyttö,',
            'kave Luonnotar korea;',
            'laskeusi lainehille,',
            'aallon selkähän ajeli.',
            'Seitsemän sataa vuotta',
            'vieri vettä, uiskenteli.'
          ],
          en: [
            'Once there was a maiden, air-born,',
            'Luonnotar, the lovely daughter;',
            'down she came upon the billows,',
            'rode the broad back of the water.',
            'Seven hundred years she drifted,',
            'swam the sea, and waited, waiting.'
          ]
        }
      },
      {
        id: 'r1', x: 720, y: sea - 36,
        verse: {
          fi: [
            'Tuli sotka, suora lintu,',
            'lenteli, liihytteli,',
            'etsi pesän paikkoansa,',
            'asuinmaata arvaeli.',
            'Näki polven meren päällä,',
            'siihen laati pesäsensä.'
          ],
          en: [
            'Came the goldeneye, the sotka,',
            'flying, fluttering and gliding,',
            'seeking out a place for nesting,',
            'searching for a home to dwell in.',
            'Saw a knee above the water;',
            'there she built her nest of grasses.'
          ]
        },
        event: function (scene) { self._triggerDuckNest(scene); }
      },
      {
        id: 'r2', x: 1210, y: sea - 36,
        verse: {
          fi: [
            'Muni kuusi kultamunaa,',
            'rautamunan seitsemännen;',
            'hautoi päivän, hautoi toisen,',
            'hautoi kohta kolmannenki.',
            'Impi tunsi polven polton,',
            'suonensa tulena tuiki.'
          ],
          en: [
            'Six gold eggs she laid within it,',
            'and the seventh, egg of iron;',
            'brooded one day, brooded two days,',
            'brooded soon upon the third day.',
            'And the maiden felt the burning,',
            'felt her sinews flare like fire.'
          ]
        },
        event: function (scene) { self._triggerEggGlow(scene); }
      },
      {
        id: 'r3', x: 1710, y: sea - 36,
        verse: {
          fi: [
            'Liikahutti polveansa,',
            'järkytti jäsentänsä;',
            'munat vierähti vetehen,',
            'meren aaltohon ajausi,',
            'karskahti munat muruiksi,',
            'katkesivat kappaleiksi.'
          ],
          en: [
            'Then she moved her knee, the maiden,',
            'shook her limbs and stirred her body;',
            'down the eggs rolled into water,',
            'sank beneath the rolling billows,',
            'cracked and broke to little fragments,',
            'shattered into shards and pieces.'
          ]
        },
        event: function (scene) { self._triggerEggCrack(scene); }
      },
      {
        id: 'r4', x: 2210, y: sea - 36,
        verse: {
          fi: [
            'Munasen alainen puoli',
            'alaiseksi maaemäksi,',
            'munasen yläinen puoli',
            'yläiseksi taivahaksi;',
            'ruskeainen päivöseksi,',
            'valkeainen kuuhuteksi.'
          ],
          en: [
            'From the egg the lower half-shell',
            'grew to be the earth beneath us;',
            'from the egg the upper half-shell',
            'rose to be the sky above us;',
            'from the yolk, the sun of morning,',
            'from the white, the moon of evening.'
          ]
        },
        event: function (scene) { self._triggerWorldFormation(scene); }
      },
      {
        id: 'r5', x: 3640, y: sea - 60,
        verse: {
          fi: [
            'Vaka vanha Väinämöinen',
            'kulki äitinsä kohussa',
            'kolmekymmentä kesäistä,',
            'yhtä monta talveaki.',
            'Sitten sortui aalloille,',
            'uipi vuotta viisi, kuusi.'
          ],
          en: [
            'Steadfast, old Väinämöinen',
            'lingered in his mother\'s body',
            'thirty summers in the darkness,',
            'thirty winters, just as many.',
            'Then he tumbled to the billows,',
            'swam for five years, swam for six years.'
          ]
        }
      },
      {
        id: 'r6_finale', x: 6700, y: sea - 80,
        isFinale: true,
        verse: {
          fi: [
            'Nousi niemen nenähän,',
            'maalle mantereen selälle;',
            'polvin nousi, käsin kääntyi,',
            'seisoi selvällä kivellä.',
            'Katsoi kuuta, päiveä,',
            'otavaista, tähtiänsä.'
          ],
          en: [
            'Up he rose upon the headland,',
            'onto land, the mainland\'s shoulder;',
            'on his knees and hands he struggled,',
            'stood at last on stone, unshaken.',
            'Saw the moon and saw the sunlight,',
            'saw the Great Bear and the starlight.'
          ]
        },
        event: function (scene) {
          EpisodeKit.finale(scene, {
            episode: 1,
            numeral: 'I',
            title: { fi: 'Väinämöisen synty', en: 'The Birth of Väinämöinen' },
            color: '#7a8a9a',
            lines: [
              { fi: 'Ensimmäinen runo on laulettu.', en: 'The first song has been sung.' },
              { fi: 'Seuraavaksi: Sampo.', en: 'Next: the Sampo.' }
            ]
          });
        }
      }
    ];
  },

  _buildDuck: function () {
    this._duck = this.add.image(-100, this._seaSurface - 20, 'duck');
    this._duck.setDepth(9);
    this._duck.setAlpha(0);
  },

  _triggerDuckNest: function (scene) {
    if (scene._duckActive) return;
    scene._duckActive = true;
    var duck = scene._duck;
    var targetX = 760;
    var targetY = scene._seaSurface - 20;
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
        scene.tweens.add({
          targets: duck, y: targetY + 4, duration: 900,
          ease: 'Sine.easeInOut', yoyo: true, repeat: -1
        });
      }
    });
  },

  _triggerEggGlow: function (scene) {
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
    if (scene._eggFired) return;
    scene._eggFired = true;
    var ex = scene._duck ? scene._duck.x : 1700;
    var ey = scene._seaSurface - 20;
    RunoAudio.playStingEgg();
    if (scene._duck) {
      scene.tweens.killTweensOf(scene._duck);
      scene.tweens.add({
        targets: scene._duck,
        x: ex - 400, y: ey - 80, alpha: 0,
        duration: 1200, ease: 'Sine.easeIn'
      });
    }
    EpisodeKit.burst(scene, scene._player.x + 60, ey, 'egg_fragment', 12, {
      speed: { min: 80, max: 200 }, angle: { min: 200, max: 340 },
      scale: { start: 1, end: 0.2 }, gravityY: 60, lifespan: 1800, depth: 15
    });
  },

  _triggerWorldFormation: function (scene) {
    RunoAudio.playStingEgg();
    var ex = scene.cameras.main.scrollX + scene.scale.width / 2;
    EpisodeKit.burst(scene, ex, scene.scale.height / 2, 'particle_gold', 60, {
      speed: { min: 50, max: 300 }, scale: { start: 1.5, end: 0 },
      lifespan: { min: 1000, max: 2500 }, gravityY: -30
    });
    EpisodeKit.flash(scene, 0xd4aa44, 0.15, 1500);
  },

  _surfaceAt: function (x) {
    return x < this._seaEnd ? 'wood' : 'stone';
  },

  update: function (time, delta) {
    this._driftT += delta * 0.001;
    this._waveT += delta * 0.0015;

    EpisodeKit.update(this, delta);

    this._drawSea();

    // Logs ride the swell (visual only — a pixel or two)
    var self = this;
    this._logs.forEach(function (l) {
      l.phase += delta * 0.002;
      l.g.y = l.y + Math.sin(l.phase) * 1.2;
    });

    this._causticLines.forEach(function (c) {
      c.phase += delta * 0.001;
      c.img.setX(c.ox + Math.sin(c.phase) * 12);
      c.img.setAlpha(0.2 + Math.sin(c.phase * 1.3) * 0.1);
    });
  },

  _drawSea: function () {
    var g = this._seaGraphics;
    g.clear();
    var H = this.scale.height;
    var seaW = this._seaEnd + 40;
    var sy = this._seaSurface;

    g.fillStyle(0x060e1c, 0.95);
    g.fillRect(0, sy, seaW, H - sy + 10);

    g.lineStyle(2, 0x1a3050, 0.8);
    g.beginPath();
    g.moveTo(0, this._waveY(0));
    for (var x = 8; x <= seaW; x += 8) g.lineTo(x, this._waveY(x));
    g.strokePath();

    var f = this._seaFront;
    f.clear();
    f.fillStyle(0x0a1a30, 0.55);
    f.beginPath();
    f.moveTo(0, H + 10);
    for (var fx = 0; fx <= seaW; fx += 8) f.lineTo(fx, this._waveY(fx) + 2);
    f.lineTo(seaW, H + 10);
    f.closePath();
    f.fillPath();

    g.lineStyle(1, 0x2a4860, 0.4);
    g.beginPath();
    g.moveTo(0, sy + 6);
    for (var x2 = 0; x2 <= seaW; x2 += 12) {
      g.lineTo(x2, sy + 6 + Math.sin(x2 * 0.012 + this._waveT * 0.8) * 3);
    }
    g.strokePath();
  }
});
