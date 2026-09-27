// episode4.js — IV · Kantele · The Pike-Bone Harp (Runos 40–41)
// White-night lakeside → the rapids (current pushes back until sung calm) →
// the great pike → gather jawbone, teeth, horsehair → build the kantele →
// play it and every creature comes to listen → tears become pearls

var Episode4Scene = new Phaser.Class({
  Extends: Phaser.Scene,
  initialize: function Episode4Scene() {
    Phaser.Scene.call(this, { key: 'Episode4Scene' });
  },

  create: function () {
    var W = this.scale.width;
    var H = this.scale.height;
    EpisodeKit.begin(this, { worldW: 6200, bg: 0x141a3a });
    this._holdPlayer = false;
    this._waveT = 0;
    this.RIVER = { x0: 1500, x1: 3800, y: 440 };
    this.POND = { x0: 5420, x1: 5720, y: 432 };
    this.SEAT_X = 5170;
    this._calm = false;
    this._parts = { jaw: false, teeth: false, hair: false };
    this._kantele = null;

    this._buildSky(W, H);
    this._buildParallax(W, H);
    this._buildWorld(W, H);
    this._buildWater(H);
    this._buildParts();
    this._buildCamp();

    var self = this;
    EpisodeKit.finish(this, {
      episode: 4,
      playerX: 140,
      playerY: 400,
      runes: this._runeDefs(),
      opening: {
        fi: [
          'Vaka vanha Väinämöinen,',
          'seppo Ilmarinen, veikko,',
          'lieto poika Lemminkäinen',
          'lähtivät Pohjolahan',
          'purrella punaposkella,',
          'sotavenehellä suurella.'
        ],
        en: [
          'Steadfast, old Väinämöinen,',
          'Ilmarinen, smith, his brother,',
          'and the reckless Lemminkäinen',
          'set out for the northern Pohjola',
          'in a boat with scarlet cheekboards,',
          'on a mighty ship of battle.'
        ]
      }
    });

    PlayerController.setWater({
      surfaceAt: function (x) {
        if (x > self.RIVER.x0 && x < self.RIVER.x1) return self._riverY(x);
        if (x > self.POND.x0 && x < self.POND.x1) return self.POND.y;
        return null;
      },
      // The rapids push back until Väinämöinen sings them calm
      currentAt: function (x) {
        if (x > self.RIVER.x0 && x < self.RIVER.x1) return self._calm ? -10 : -80;
        return 0;
      }
    });

    this._buildPartsHud();
  },

  _riverY: function (x) {
    var amp = this._calm ? 2 : 5;
    return this.RIVER.y + Math.sin(x * 0.03 + this._waveT * 3) * amp + Math.sin(x * 0.011 - this._waveT) * 2;
  },

  // ── Scenery: the nightless night of midsummer ─────────────────────
  _buildSky: function (W, H) {
    var g = this.add.graphics();
    g.setScrollFactor(0);
    g.setDepth(0);
    var top = [20, 26, 58], mid = [74, 58, 90], low = [196, 128, 112];
    for (var y = 0; y < H; y += 3) {
      var t = y / H, a, b, u;
      if (t < 0.55) { a = top; b = mid; u = t / 0.55; } else { a = mid; b = low; u = (t - 0.55) / 0.45; }
      g.fillStyle(Phaser.Display.Color.GetColor(
        Math.floor(a[0] + (b[0] - a[0]) * u), Math.floor(a[1] + (b[1] - a[1]) * u), Math.floor(a[2] + (b[2] - a[2]) * u)), 1);
      g.fillRect(0, y, W, 3);
    }
    // The midnight sun, resting on the horizon and never setting
    var sun = this.add.graphics();
    sun.setScrollFactor(0.02);
    sun.setDepth(1);
    sun.fillStyle(0xf0b080, 0.18); sun.fillCircle(W * 0.72, 330, 70);
    sun.fillStyle(0xf8c898, 0.9); sun.fillCircle(W * 0.72, 330, 26);
  },

  _buildParallax: function (W, H) {
    EpisodeKit.ridge(this, 0.08, 2, 0x3a3050, function (x) { return 200 + Math.sin(x * 0.005) * 30 + Math.sin(x * 0.013) * 12; });
    EpisodeKit.forest(this, 0.22, 3, 0x241e38, function () { return H - 150; },
      { gap: 20, minH: 40, maxH: 90, kinds: ['spruce', 'spruce', 'pine'] });
    EpisodeKit.ridge(this, 0.22, 3, 0x241e38, function () { return 152; });
    EpisodeKit.forest(this, 0.5, 4, 0x161426, function () { return H - 110; },
      { gap: 60, minH: 90, maxH: 190, kinds: ['spruce', 'birch', 'pine'], bark: 0xd8c8c8, barkAlpha: 0.4 });
    EpisodeKit.ridge(this, 0.5, 4, 0x161426, function () { return 112; });
  },

  _buildWorld: function (W, H) {
    var earth = { fill: 0x141422, edge: 0x3a3448 };
    EpisodeKit.ground(this, [
      [0, 430, 900],
      [900, 410, 600],
      // Rocks standing out of the rapids
      [1640, 420, 70], [1850, 414, 64], [2060, 420, 70], [2250, 410, 130],
      [2520, 420, 70], [2730, 414, 64], [2940, 420, 70], [3140, 416, 80], [3330, 418, 60],
      // The far shore and the campsite
      [3800, 420, 460],
      [4260, 400, 340],
      [4600, 410, 500],
      [5100, 420, 320],
      [5720, 420, 480]
    ], earth);

    EpisodeKit.ledges(this, [
      [4380, 320, 110],
      [4700, 342, 100],
      [4850, 282, 110]
    ], { fill: 0x1a1828, edge: 0x4a4058 });

    // The boat, caught on the pike's shoulders
    var boat = this.add.graphics();
    boat.setDepth(8);
    Silhouettes.boat(boat, 0, 0, 1.3, 0x3a2418);
    boat.fillStyle(0x8a2a20, 1);
    boat.fillRect(-78, -18, 12, 6);
    boat.fillRect(70, -20, 12, 6);
    boat.setPosition(3475, 440);
    this._boat = boat;
    EpisodeKit.addBody(this, 3400, 426, 150, 10, true);

    // Village by the lake: log house and a sauna with smoke
    var v = this.add.graphics();
    v.setDepth(6);
    Silhouettes.house(v, 300, 430, 1.4, 0x0e0c16, { window: 0xe8a860 });
    Silhouettes.house(v, 560, 430, 0.9, 0x0e0c16);
    try {
      var smoke = this.add.particles(560 + 20, 430 - 58, 'particle_ash', {
        speedX: { min: -6, max: 4 }, speedY: { min: -22, max: -10 },
        scale: { start: 1, end: 3 }, alpha: { start: 0.25, end: 0 },
        lifespan: 4000, frequency: 260
      });
      smoke.setDepth(5);
    } catch (e) {}
  },

  _buildWater: function (H) {
    var R = this.RIVER, P = this.POND;
    var back = this.add.graphics();
    back.setDepth(6);
    back.fillStyle(0x0c1024, 1);
    back.fillRect(R.x0, R.y, R.x1 - R.x0, H - R.y + 10);
    back.fillRect(P.x0, P.y, P.x1 - P.x0, H - P.y + 10);
    this._waterFront = this.add.graphics();
    this._waterFront.setDepth(11);
    this._foam = [];
    for (var i = 0; i < 40; i++) {
      this._foam.push({ x: R.x0 + Math.random() * (R.x1 - R.x0), o: Math.random() * 20, len: 10 + Math.random() * 26 });
    }
  },

  _drawWater: function (delta) {
    var R = this.RIVER, P = this.POND, H = this.scale.height;
    var f = this._waterFront;
    f.clear();
    f.fillStyle(0x2a2a50, 0.5);
    f.beginPath();
    f.moveTo(R.x0, H + 10);
    for (var x = R.x0; x <= R.x1; x += 10) f.lineTo(x, this._riverY(x) + 2);
    f.lineTo(R.x1, H + 10);
    f.closePath();
    f.fillPath();
    f.lineStyle(2, 0xc8a8b8, 0.45);
    f.beginPath();
    f.moveTo(R.x0, this._riverY(R.x0));
    for (var x2 = R.x0; x2 <= R.x1; x2 += 10) f.lineTo(x2, this._riverY(x2));
    f.strokePath();

    // Foam streaks racing downstream (fewer once the rapids are calmed)
    var speed = this._calm ? 20 : 150;
    var alpha = this._calm ? 0.2 : 0.7;
    f.lineStyle(2, 0xf0e8f0, alpha);
    this._foam.forEach(function (s) {
      s.x -= speed * delta / 1000;
      if (s.x < R.x0) s.x = R.x1;
      var y = this._riverY(s.x) + 4 + s.o;
      f.lineBetween(s.x, y, s.x + s.len, y);
    }, this);

    f.fillStyle(0x2a2a50, 0.5);
    f.fillRect(P.x0, P.y + 2, P.x1 - P.x0, H - P.y);
    f.lineStyle(1, 0xd8b8c0, 0.5);
    f.lineBetween(P.x0, P.y + 1, P.x1, P.y + 1);
  },

  // ── The three parts of the kantele ────────────────────────────────
  _buildParts: function () {
    var self = this;
    var defs = [
      { key: 'jaw', x: 4060, y: 390, name: { fi: 'Hauin leukaluu', en: 'the pike\'s jawbone' }, draw: function (g) {
        g.lineStyle(4, 0xe8e0d0, 1);
        g.beginPath(); g.arc(0, 4, 14, Math.PI * 1.1, Math.PI * 1.9, false); g.strokePath();
      } },
      { key: 'teeth', x: 4435, y: 296, name: { fi: 'Hauin hampaat', en: 'the pike\'s teeth' }, draw: function (g) {
        g.fillStyle(0xf0ece0, 1);
        for (var i = 0; i < 4; i++) g.fillTriangle(-12 + i * 7, 4, -8 + i * 7, 4, -10 + i * 7, -8);
      } },
      { key: 'hair', x: 4905, y: 256, name: { fi: 'Hiiden ruunan jouhet', en: 'hair of Hiisi\'s gelding' }, draw: function (g) {
        g.lineStyle(1.5, 0xe0c060, 1);
        for (var i = 0; i < 4; i++) {
          g.beginPath();
          g.moveTo(-12, -6 + i * 4);
          for (var k = -12; k <= 12; k += 4) g.lineTo(k, -6 + i * 4 + Math.sin(k * 0.5 + i) * 2);
          g.strokePath();
        }
      } }
    ];
    this._partObjs = defs.map(function (d) {
      var glow = self.add.image(d.x, d.y, 'forge_glow');
      glow.setScale(0.35);
      glow.setAlpha(0.35);
      glow.setDepth(8);
      glow.setTint(0xa0c8ff);
      var g = self.add.graphics();
      g.setDepth(9);
      d.draw(g);
      g.setPosition(d.x, d.y);
      self.tweens.add({ targets: [g, glow], y: d.y - 6, duration: 1400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      return { def: d, g: g, glow: glow, taken: false };
    });
  },

  _buildPartsHud: function () {
    var self = this;
    this._hud = this._partObjs.map(function (p, i) {
      var box = self.add.graphics();
      box.setScrollFactor(0);
      box.setDepth(90);
      box.lineStyle(1, 0x5a5070, 0.8);
      box.strokeRoundedRect(16 + i * 46, 12, 38, 38, 5);
      var icon = self.add.graphics();
      icon.setScrollFactor(0);
      icon.setDepth(91);
      p.def.draw(icon);
      icon.setPosition(35 + i * 46, 32);
      icon.setAlpha(0.18);
      box.setAlpha(0);
      icon.setVisible(false);
      return { box: box, icon: icon };
    });
  },

  _showPartsHud: function () {
    var self = this;
    this._hud.forEach(function (h, i) {
      h.icon.setVisible(true);
      self.tweens.add({ targets: h.box, alpha: 1, duration: 600, delay: i * 120 });
    });
  },

  _checkParts: function () {
    var p = this._player;
    var self = this;
    this._partObjs.forEach(function (o, i) {
      if (o.taken) return;
      var dx = p.x - o.def.x, dy = p.y - o.def.y;
      if (dx * dx + dy * dy < 44 * 44) {
        o.taken = true;
        self._parts[o.def.key] = true;
        RunoAudio.playKantele(i * 2, 0);
        EpisodeKit.burst(self, o.def.x, o.def.y, 'particle_pearl', 14, { speed: { min: 30, max: 110 } });
        self.tweens.killTweensOf([o.g, o.glow]);
        self.tweens.add({ targets: [o.g, o.glow], alpha: 0, y: o.def.y - 30, duration: 600 });
        self._hud[i].box.setAlpha(1);
        self._hud[i].icon.setVisible(true);
        self._hud[i].icon.setAlpha(1);
        var cap = EpisodeKit.prompt(self, o.def.name, 72, '#c8d0e8');
        self.tweens.add({ targets: cap, alpha: 1, duration: 300, yoyo: true, hold: 1600, onComplete: function () { cap.destroy(); } });
      }
    });
  },

  _buildCamp: function () {
    var x = this.SEAT_X + 60, y = 420;
    var g = this.add.graphics();
    g.setDepth(8);
    g.fillStyle(0x2a2020, 1);
    g.fillRect(x - 14, y - 4, 28, 4);
    g.fillStyle(0x1a1616, 1);
    g.fillEllipse(this.SEAT_X - 16, y - 6, 34, 14); // the stone seat
    try {
      var fire = this.add.particles(x, y - 6, 'particle_ember', {
        speedX: { min: -8, max: 8 }, speedY: { min: -60, max: -24 },
        scale: { start: 1.2, end: 0 }, alpha: { start: 1, end: 0 },
        lifespan: { min: 500, max: 1100 }, frequency: 45
      });
      fire.setDepth(9);
    } catch (e) {}
    var glow = this.add.image(x, y - 14, 'forge_glow');
    glow.setScale(0.9);
    glow.setAlpha(0.45);
    glow.setDepth(6);
    this.tweens.add({ targets: glow, alpha: 0.3, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    // Trees around the campsite for the listeners to come to
    var t = this.add.graphics();
    t.setDepth(6);
    Silhouettes.pine(t, 4880, 410, 190, 0x0c0a14);
    Silhouettes.spruce(t, 5010, 420, 150, 0x0c0a14);
    t.fillStyle(0x0c0a14, 1);
    t.fillRect(4990, 330, 60, 4); // the squirrel's branch
  },

  // ── Runes ─────────────────────────────────────────────────────────
  _runeDefs: function () {
    var self = this;
    return [
      {
        id: 'r1', x: 1300, y: 360,
        verse: {
          fi: [
            'Laskivat kosken kovimman,',
            'Äijän kosken äkkiäisen;',
            'vaahto kiehui, aalto kuohui,',
            'vesi valkea väreili.',
            'Vaka vanha Väinämöinen',
            'lausui koskelle kovalle:'
          ],
          en: [
            'Down they shot the fiercest rapids,',
            'the old man\'s torrent, sudden, raging;',
            'foam was boiling, billows seething,',
            'white the water, wildly shaking.',
            'Steadfast, old Väinämöinen',
            'spoke these words to the hard rapids:'
          ]
        }
      },
      {
        id: 'r2', x: 2315, y: 360,
        verse: {
          fi: [
            '"Koski, kuohu, vesi valkea,',
            'lakkaa jo laulamasta!',
            'Kosken neiti, kuohutyttö,',
            'istu kivelle kivisin,',
            'ota aallot syliisi,',
            'ettei vene vierähdä!"'
          ],
          en: [
            '"Rapids, foam and whitest water,',
            'cease at last your roaring singing!',
            'Maiden of the rapids, foam-girl,',
            'sit upon the stones and settle,',
            'take the billows in your bosom,',
            'lest the boat be overturned!"'
          ]
        },
        event: function (scene) {
          scene._calm = true;
          RunoAudio.playKanteleChord([0, 2, 4], 0.14);
          EpisodeKit.flash(scene, 0xc8d8f0, 0.12, 1400);
        }
      },
      {
        id: 'r3', x: 3470, y: 376,
        verse: {
          fi: [
            'Vene seisahti selälle,',
            'tarttui suuren hauin hartioille.',
            'Tempasi miekkansa tuliterän,',
            'iski hauin halki kahtia;',
            'pyrstö vaipui pohjamutahan,',
            'pää jäi purren pohjapuulle.'
          ],
          en: [
            'Then the boat stood still, unmoving,',
            'stuck upon a great pike\'s shoulders.',
            'He drew his sword, the fiery-bladed,',
            'struck the pike in two with fury;',
            'down the tail sank to the mud-deep,',
            'and the head fell in the boat.'
          ]
        },
        event: function (scene) { self._pike(); }
      },
      {
        id: 'r4', x: 3890, y: 370,
        verse: {
          fi: [
            'Katsoi vanha Väinämöinen',
            'hauin luita, hampahia:',
            '"Mitä tuosta tulisikaan,',
            'jos ois seppo sepposilla?',
            'Soitto syntyisi luista,',
            'kantelo kalan leuasta!"'
          ],
          en: [
            'Old Väinämöinen gazed a long while',
            'at the pike-bones and the teeth there:',
            '"What might yet be made of these things,',
            'if a craftsman set to crafting?',
            'Music might be born of bone,',
            'a kantele from a fish\'s jaw!"'
          ]
        },
        event: function (scene) { self._showPartsHud(); }
      },
      {
        id: 'r5', x: this.SEAT_X + 30, y: 370,
        requires: function () { return self._parts.jaw && self._parts.teeth && self._parts.hair; },
        waitingHint: { fi: 'Etsi leuka, hampaat ja jouhet', en: 'Find the jaw, the teeth and the hair' },
        checkpoint: { x: this.SEAT_X, y: 400 },
        verse: {
          fi: [
            'Kantelon teki Väinämöinen:',
            'kopan hauin leukaluusta,',
            'naulat hauin hampahista,',
            'kielet Hiiden ruunan jouhista.',
            'Valmistui iloinen kannel,',
            'soitin suuri, ääni kaunis.'
          ],
          en: [
            'So old Väinämöinen made it:',
            'from the pike\'s jaw, the body,',
            'from the pike\'s teeth, pegs to tune it,',
            'strings from hair of Hiisi\'s gelding.',
            'Thus was made the joyful kantele,',
            'great the harp and fair its voice.'
          ]
        },
        event: function (scene) { self._startPlaying(); }
      }
    ];
  },

  _pike: function () {
    var self = this;
    this._holdPlayer = true;
    var pike = this.add.graphics();
    pike.setDepth(10.5);
    Silhouettes.pike(pike, 0, 0, 3.2, 0x1a2a24, true);
    pike.setPosition(3470, 520);
    this.tweens.add({
      targets: pike, y: 452, duration: 1500, ease: 'Sine.easeOut',
      onComplete: function () {
        self.cameras.main.shake(300, 0.005);
        self.tweens.add({ targets: self._boat, y: 426, angle: -4, duration: 400, yoyo: true });
        self.time.delayedCall(700, function () {
          RunoAudio.playStingSword();
          EpisodeKit.flash(self, 0xf0f0ff, 0.6, 700);
          EpisodeKit.burst(self, 3470, 440, 'particle_pearl', 24, { speed: { min: 60, max: 220 }, gravityY: 200 });
          self.tweens.add({
            targets: pike, y: 600, alpha: 0, duration: 1800, ease: 'Sine.easeIn',
            onComplete: function () { pike.destroy(); self._holdPlayer = false; }
          });
          // The head lies in the boat
          var head = self.add.graphics();
          head.setDepth(9);
          head.fillStyle(0x1a2a24, 1);
          head.fillTriangle(-24, -2, 14, -10, 14, 6);
          head.fillStyle(0xe8e0d0, 1);
          head.fillCircle(8, -3, 1.5);
          head.setPosition(3440, 428);
        });
      }
    });
  },

  // ── Playing the kantele ───────────────────────────────────────────
  _startPlaying: function () {
    var W = this.scale.width, H = this.scale.height;
    var self = this;
    this._holdPlayer = true;
    this._player.setPosition(this.SEAT_X, 400);
    this._player.body.setVelocity(0, 0);
    this._player.setFlipX(false);

    var k = this._kantele = { listen: 0, lastAt: -9999, phase: 'play', next: 0, strings: [] };

    // Five strings, one per finger: keys 1–5, A S D F G, or tap
    var labels = ['1', '2', '3', '4', '5'];
    for (var i = 0; i < 5; i++) {
      (function (i) {
        var x = W / 2 + (i - 2) * 76;
        var zone = self.add.zone(x, H - 70, 66, 110).setScrollFactor(0).setDepth(60).setInteractive({ useHandCursor: true });
        zone.on('pointerdown', function () { self._pluck(i); });
        var g = self.add.graphics().setScrollFactor(0).setDepth(60);
        var lab = self.add.text(x, H - 10, labels[i], {
          fontFamily: RunoFonts.plain, fontSize: '12px', color: '#8a8098'
        }).setOrigin(0.5, 1).setScrollFactor(0).setDepth(60).setAlpha(PlayerController.isMobile ? 0 : 0.8);
        k.strings.push({ zone: zone, g: g, x: x, energy: 0, lab: lab });
      })(i);
    }
    // The body of the kantele behind the strings
    var body = this.add.graphics().setScrollFactor(0).setDepth(59);
    body.fillStyle(0x2a1a14, 0.85);
    body.fillPoints([
      { x: W / 2 - 200, y: H - 128 }, { x: W / 2 + 200, y: H - 118 },
      { x: W / 2 + 220, y: H - 22 }, { x: W / 2 - 200, y: H - 14 }
    ], true);
    body.lineStyle(1, 0x6a4a2a, 0.9);
    body.strokeCircle(W / 2 - 150, H - 70, 12);
    k.body = body;

    this._playPrompt = EpisodeKit.prompt(this, PlayerController.isMobile
      ? { fi: 'Soita kanteletta: napauta kieliä', en: 'Play the kantele: tap the strings' }
      : { fi: 'Soita kanteletta: 1 2 3 4 5', en: 'Play the kantele: keys 1 2 3 4 5' }, 70, '#d8c0a0');
    this.tweens.add({ targets: this._playPrompt, alpha: 1, duration: 600 });

    this._kanteleKeys = function (e) {
      if (e.repeat) return;
      var map = { '1': 0, '2': 1, '3': 2, '4': 3, '5': 4, a: 0, s: 1, d: 2, f: 3, g: 4, A: 0, S: 1, D: 2, F: 3, G: 4 };
      if (map[e.key] !== undefined) self._pluck(map[e.key]);
    };
    this.input.keyboard.on('keydown', this._kanteleKeys);

    // The listening ring around the player
    this._ring = this.add.graphics();
    this._ring.setDepth(12);
  },

  _listeners: function () {
    var self = this;
    var gy = 420;
    var arrive = function (drawFn, fromX, toX, y, dur, flip) {
      var g = self.add.graphics();
      g.setDepth(9);
      drawFn(g, flip);
      g.setPosition(fromX, y);
      g.setAlpha(0);
      self.tweens.add({ targets: g, x: toX, alpha: 1, duration: dur, ease: 'Sine.easeOut' });
      return g;
    };
    return [
      { at: 0.12, caption: { fi: 'Orava hyppi oksalta oksalle kuulemaan.', en: 'The squirrel leapt from bough to bough to listen.' },
        go: function () { arrive(function (g) { Silhouettes.squirrel(g, 0, 0, 1.2, 0x0c0a14, true); }, 5130, 5030, 330, 1600); } },
      { at: 0.25, caption: { fi: 'Joutsen uiskeli ulapalta.', en: 'The swan swam in from the open water.' },
        go: function () { arrive(function (g) { Silhouettes.swan(g, 0, 0, 1.1, 0xe8e4f0, true); }, 5760, 5560, 434, 3200); } },
      { at: 0.38, caption: { fi: 'Kokko jätti poikasensa, lensi kuulemaan.', en: 'The eagle left her nestlings and flew to hear.' },
        go: function () {
          var e = arrive(function (g) { Silhouettes.eagle(g, 0, 0, 0.8, 0x0c0a14); }, 4600, 4880, 60, 2200);
          self.tweens.add({ targets: e, y: 214, duration: 2200, ease: 'Sine.easeInOut' });
        } },
      { at: 0.52, caption: { fi: 'Hirvi hiipi kuusikosta.', en: 'The elk crept out of the spruce-wood.' },
        go: function () { arrive(function (g) { Silhouettes.elk(g, 0, 0, 1.2, 0x2e2640, false); }, 4640, 4980, gy, 3600); } },
      { at: 0.66, caption: { fi: 'Ohto, metsän omena, nousi aidalle.', en: 'Ohto, the forest\'s honey-paw, came to listen.' },
        go: function () { arrive(function (g) { Silhouettes.bear(g, 0, 0, 1.1, 0x2e2640, false); }, 4640, 4800, gy, 3600); } },
      { at: 0.8, caption: { fi: 'Susi heräsi suolta, istui kuulemaan.', en: 'The wolf rose from the marsh and sat to hear.' },
        go: function () { arrive(function (g) { Silhouettes.wolf(g, 0, 0, 1.0, 0x2e2640, true); }, 5460, 5340, gy, 2600); } },
      { at: 0.92, caption: { fi: 'Kalat nousivat vedestä kuulemaan.', en: 'The fish rose from the water to hear.' },
        go: function () {
          for (var n = 0; n < 4; n++) {
            (function (n) {
              self.time.delayedCall(n * 500, function () {
                var f = self.add.graphics();
                f.setDepth(10.5);
                Silhouettes.pike(f, 0, 0, 0.35, 0x2a3a48, n % 2 === 0);
                f.setPosition(5480 + n * 60, self.POND.y + 10);
                self.tweens.add({ targets: f, y: self.POND.y - 40, angle: n % 2 ? 40 : -40, duration: 420, yoyo: true,
                  ease: 'Sine.easeOut', onComplete: function () { f.destroy(); } });
              });
            })(n);
          }
        } }
    ];
  },

  _pluck: function (i) {
    var k = this._kantele;
    if (!k || k.phase !== 'play' || StoryPanel.isActive()) return;
    RunoAudio.playKantele(i, 0);
    var s = k.strings[i];
    s.energy = 1;

    // Unhurried playing is heard best; hammering the strings less so
    var now = this.time.now;
    var gap = now - k.lastAt;
    k.lastAt = now;
    var gain = gap > 220 ? 0.05 : 0.015;
    k.listen = Math.min(1, k.listen + gain);

    EpisodeKit.burst(this, this._player.x + 8, this._player.y - 6, 'particle_gold', 3, {
      speed: { min: 20, max: 60 }, angle: { min: 240, max: 300 }, lifespan: 900
    });

    var list = this._listeners();
    while (k.next < list.length && k.listen >= list[k.next].at) {
      var l = list[k.next++];
      l.go();
      var cap = EpisodeKit.prompt(this, l.caption, 116, '#e0d0b0');
      this.tweens.add({ targets: cap, alpha: 1, duration: 400, yoyo: true, hold: 2200, onComplete: function (tw, t) { t[0].destroy(); } });
    }
    if (k.listen >= 1) this._tears();
  },

  _tears: function () {
    var self = this;
    var k = this._kantele;
    k.phase = 'tears';
    this.input.keyboard.off('keydown', this._kanteleKeys);
    var fade = [this._playPrompt, k.body];
    k.strings.forEach(function (s) { fade.push(s.g, s.lab); s.zone.destroy(); });
    this.tweens.add({ targets: fade, alpha: 0, duration: 800 });
    RunoAudio.playKanteleChord([0, 2, 4, 5, 7], 0.18);

    this.time.delayedCall(1600, function () {
      StoryPanel.show(self, {
        fi: [
          'Itki vanha Väinämöinen;',
          'vierivät vesipisarat,',
          'kyynelet kuti karpalot,',
          'herne\'itä suuremmat.',
          'Vierivät veen sisähän,',
          'muuttuivat sinihelmiksi.'
        ],
        en: [
          'Then old Väinämöinen wept,',
          'and the water-drops went falling,',
          'tears as big as mountain cranberries,',
          'rounder than the peas of summer.',
          'Down they rolled into the water,',
          'turning into pearls of blue.'
        ]
      }, function () { self._pearls(); });
    });
  },

  _pearls: function () {
    var self = this;
    var p = this._player;
    for (var n = 0; n < 7; n++) {
      (function (n) {
        self.time.delayedCall(n * 260, function () {
          var pearl = self.add.image(p.x + 4, p.y - 26, 'particle_pearl');
          pearl.setDepth(12);
          var tx = 5470 + n * 34;
          self.tweens.add({ targets: pearl, x: tx, duration: 1300, ease: 'Linear' });
          self.tweens.add({
            targets: pearl, y: p.y - 120, duration: 650, ease: 'Sine.easeOut', yoyo: true,
            onComplete: function () {
              self.tweens.add({ targets: pearl, y: self.POND.y + 30, alpha: 0.4, duration: 500 });
            }
          });
        });
      })(n);
    }
    // The goldeneye from the first song dives for them
    this.time.delayedCall(2600, function () {
      var duck = self.add.image(6300, 200, 'duck');
      duck.setDepth(12);
      duck.setFlipX(true);
      self.tweens.chain({
        targets: duck,
        tweens: [
          { x: 5580, y: self.POND.y - 12, duration: 1800, ease: 'Sine.easeOut' },
          { y: self.POND.y + 30, alpha: 0.3, duration: 500, ease: 'Sine.easeIn' },
          { y: self.POND.y - 12, alpha: 1, duration: 600, delay: 700, ease: 'Sine.easeOut' },
          { x: p.x + 40, y: p.y - 30, duration: 1400, ease: 'Sine.easeInOut' }
        ],
        onComplete: function () {
          EpisodeKit.burst(self, p.x + 30, p.y - 20, 'particle_pearl', 18, { speed: { min: 20, max: 90 } });
          StoryPanel.show(self, {
            fi: [
              'Tuli sotka, suora lintu,',
              'sukelsi selän syvähän,',
              'toi helmet vetten alta',
              'Väinämöisen kätösehen.'
            ],
            en: [
              'Came the goldeneye, the sotka,',
              'dove down deep into the waters,',
              'brought the pearls up from the bottom',
              'to the hand of Väinämöinen.'
            ]
          }, function () {
            EpisodeKit.finale(self, {
              episode: 4,
              numeral: 'IV',
              title: { fi: 'Kantele', en: 'The Pike-Bone Harp' },
              color: '#c0a090',
              motes: 'particle_pearl',
              lines: [
                { fi: 'Kaikki luodut kuuntelivat.', en: 'All creation stopped to listen.' },
                { fi: 'Seuraavaksi: Kullervo.', en: 'Next: Kullervo.' }
              ]
            });
          });
        }
      });
    });
  },

  _drawStrings: function (delta) {
    var k = this._kantele;
    if (!k || k.phase !== 'play') return;
    var H = this.scale.height;
    var t = this.time.now;
    k.strings.forEach(function (s) {
      s.energy = Math.max(0, s.energy - delta / 900);
      s.g.clear();
      var wob = Math.sin(t * 0.09) * 4 * s.energy;
      s.g.lineStyle(2 + s.energy * 2, 0xe8d8a0, 0.5 + s.energy * 0.5);
      s.g.beginPath();
      s.g.moveTo(s.x, H - 120);
      s.g.lineTo(s.x + wob, H - 70);
      s.g.lineTo(s.x, H - 22);
      s.g.strokePath();
      s.g.fillStyle(0xe8d8a0, 0.9);
      s.g.fillCircle(s.x, H - 120, 3);
    });
    // Listening ring
    var p = this._player;
    this._ring.clear();
    this._ring.lineStyle(2, 0xe8c878, 0.5);
    this._ring.beginPath();
    this._ring.arc(p.x, p.y - 4, 34, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * k.listen, false);
    this._ring.strokePath();
  },

  update: function (time, delta) {
    this._waveT += delta * 0.001;
    EpisodeKit.update(this, delta);
    this._drawWater(delta);
    this._checkParts();
    this._drawStrings(delta);
  }
});
