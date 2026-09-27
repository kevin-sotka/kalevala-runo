// episode3.js — III · Laulukilpa · The Singing Contest (Runo 3)
// Winter road → frozen lake with ice-holes → the sleighs collide → the singing
// duel (call-and-response rune glyphs) → Joukahainen sunk in the swamp → Aino

var Episode3Scene = new Phaser.Class({
  Extends: Phaser.Scene,
  initialize: function Episode3Scene() {
    Phaser.Scene.call(this, { key: 'Episode3Scene' });
  },

  create: function () {
    var W = this.scale.width;
    var H = this.scale.height;
    EpisodeKit.begin(this, { worldW: 7000, bg: 0x08101e });
    this._holdPlayer = false;
    this._duel = null;
    this.LAKE = { x0: 1400, x1: 2600, y: 446 };
    this.HOLES = [[1700, 1780], [2160, 2240]];
    this.JOUKA_X = 3590;
    this.GROUND_Y = 410;

    this._buildSky(W, H);
    this._buildParallax(W, H);
    this._buildWorld(W, H);
    this._buildSwamp(H);

    var self = this;
    EpisodeKit.finish(this, {
      episode: 3,
      playerX: 120,
      playerY: 400,
      runes: this._runeDefs(),
      opening: {
        fi: [
          'Oli nuori Joukahainen,',
          'laiha poika lappalainen;',
          'kuuli kerran kerrottavan',
          'Väinämöisen laulavaksi,',
          'paremmaksi laulajaksi',
          'kuin oli itse oppinunna.'
        ],
        en: [
          'Young and lean was Joukahainen,',
          'a thin lad from Lapland\'s borders;',
          'once he heard the people saying',
          'that the songs of Väinämöinen',
          'rang out finer than his own songs,',
          'wiser than the ones he\'d mastered.'
        ]
      }
    });

    PlayerController.setWater({
      surfaceAt: function (x) {
        for (var i = 0; i < self.HOLES.length; i++) {
          if (x > self.HOLES[i][0] - 6 && x < self.HOLES[i][1] + 6) return self.LAKE.y + 6;
        }
        return null;
      },
      currentAt: function () { return 0; }
    });

    this._snow = EpisodeKit.weather(this, 'particle_snow', {
      speedX: { min: -30, max: 5 }, speedY: { min: 18, max: 45 }, frequency: 70, depth: 40
    });
  },

  // ── Scenery ───────────────────────────────────────────────────────
  _buildSky: function (W, H) {
    var g = this.add.graphics();
    g.setScrollFactor(0);
    g.setDepth(0);
    for (var y = 0; y < H; y += 3) {
      var t = y / H;
      var c = Phaser.Display.Color.GetColor(
        Math.floor(6 + t * 20), Math.floor(12 + t * 26), Math.floor(28 + t * 34));
      g.fillStyle(c, 1);
      g.fillRect(0, y, W, 3);
    }
    for (var i = 0; i < 90; i++) {
      g.fillStyle(0xc8d8ff, 0.2 + Math.random() * 0.6);
      g.fillCircle(Math.random() * W, Math.random() * H * 0.55, Math.random() < 0.15 ? 1.5 : 0.8);
    }
    // Revontulet — the fox's fires
    EpisodeKit.aurora(this, 1, [0x2aa878, 0x2a8aa0, 0x7a50b0]);
  },

  _buildParallax: function (W, H) {
    // Far fells with snowy crowns
    var fell = function (x) { return 170 + Math.sin(x * 0.004) * 50 + Math.sin(x * 0.011) * 20; };
    EpisodeKit.ridge(this, 0.08, 2, 0x16203a, fell);
    EpisodeKit.ridge(this, 0.08, 2, 0x9aa8c0, function (x) { return fell(x) - 2; }, 0.08);

    EpisodeKit.forest(this, 0.22, 3, 0x0e1628, function () { return H - 120; },
      { gap: 22, minH: 50, maxH: 110, kinds: ['spruce'] });
    var g = EpisodeKit.ridge(this, 0.22, 3, 0x0e1628, function () { return 122; });

    EpisodeKit.forest(this, 0.5, 4, 0x0a101c, function () { return H - 100; },
      { gap: 55, minH: 80, maxH: 170, kinds: ['spruce', 'spruce', 'birch'], bark: 0x8a96a8, barkAlpha: 0.35 });
    EpisodeKit.ridge(this, 0.5, 4, 0x0a101c, function () { return 102; });
  },

  _buildWorld: function (W, H) {
    var L = this.LAKE;
    var snowy = { fill: 0x121824, edge: 0x2a3446, snow: 0xc8d4e4 };

    EpisodeKit.ground(this, [
      [0, 440, 700],
      [700, 418, 300],
      [1000, 440, 400],
      [2600, 430, 300],
      [2900, 410, 1000],
      [3900, 380, 300],
      [4200, 350, 400],
      [5250, 380, 600],
      [5850, 420, 1150]
    ], snowy);

    // Frozen lake: pale ice with two open holes (avanto)
    var ice = { fill: 0x1a2436, edge: 0x8aa0bc };
    EpisodeKit.ground(this, [
      [L.x0, L.y, 300],
      [1780, L.y, 380],
      [2240, L.y, 360]
    ], ice);
    var sheen = this.add.graphics();
    sheen.setDepth(7);
    sheen.lineStyle(1, 0xb8d0e8, 0.25);
    for (var x = L.x0 + 20; x < L.x1 - 20; x += 70) {
      if (this._inHole(x) || this._inHole(x + 30)) continue;
      sheen.lineBetween(x, L.y + 6, x + 30, L.y + 9);
    }

    // Dark water in the ice-holes
    var water = this.add.graphics();
    water.setDepth(6);
    this.HOLES.forEach(function (h) {
      water.fillStyle(0x040a14, 1);
      water.fillRect(h[0], L.y + 6, h[1] - h[0], H - L.y);
      water.lineStyle(1, 0x4a6a8a, 0.6);
      water.lineBetween(h[0], L.y + 6, h[1], L.y + 6);
    });

    EpisodeKit.ledges(this, [
      [4650, 300, 120],
      [4850, 262, 120],
      [5050, 300, 140]
    ], { fill: 0x121824, edge: 0x2a3446, snow: 0xc8d4e4 });
  },

  _inHole: function (x) {
    for (var i = 0; i < this.HOLES.length; i++) {
      if (x >= this.HOLES[i][0] && x <= this.HOLES[i][1]) return true;
    }
    return false;
  },

  _buildSwamp: function (H) {
    var gy = this.GROUND_Y;
    var jx = this.JOUKA_X;

    // Joukahainen: a figure in the red cap of the four winds, with his bow
    var c = this.add.container(jx, gy);
    c.setDepth(8);
    var body = this.add.graphics();
    Silhouettes.figure(body, 0, 0, 1.35, 0xc08a6a);
    var cap = this.add.graphics();
    cap.fillStyle(0xb03a2a, 1);
    cap.fillTriangle(-9, -53, 9, -53, 3, -70);
    cap.fillStyle(0xe0c040, 1);
    cap.fillRect(-9, -55, 18, 3);
    var bow = this.add.graphics();
    bow.lineStyle(2, 0x9a7a4a, 1);
    bow.beginPath();
    bow.arc(14, -28, 18, -1.2, 1.2, false);
    bow.strokePath();
    bow.lineStyle(1, 0x9a7a4a, 0.7);
    bow.lineBetween(14 + Math.cos(-1.2) * 18, -28 + Math.sin(-1.2) * 18, 14 + Math.cos(1.2) * 18, -28 + Math.sin(1.2) * 18);
    c.add([body, cap, bow]);
    c.setAlpha(0);
    this._jouka = { c: c, cap: cap, bow: bow };

    // Swamp (suo): murky pool with reeds and cotton-grass, drawn in front of
    // Joukahainen so he disappears into it as he sinks.
    var front = this.add.graphics();
    front.setDepth(9);
    front.fillStyle(0x1a2016, 1);
    front.fillRect(jx - 120, gy + 1, 240, H - gy);
    front.fillStyle(0x2a3424, 1);
    front.fillEllipse(jx, gy + 2, 250, 10);
    front.lineStyle(1, 0x5a6a3a, 0.9);
    for (var r = jx - 110; r < jx + 110; r += 11) {
      var rh = 8 + (r * 7 % 13);
      front.lineBetween(r, gy + 2, r + 2, gy - rh);
      if (r % 3 === 0) {
        front.fillStyle(0xe8ecf0, 0.8);
        front.fillCircle(r + 2, gy - rh, 1.6);
      }
    }
    this._swampFront = front;

    // Joukahainen's sleigh and stallion arrive with the collision rune
    var rig = this.add.graphics();
    rig.setDepth(8);
    Silhouettes.horse(rig, -60, 0, 1.0, 0x2a1e18, true);
    Silhouettes.sleigh(rig, 20, 0, 1.1, 0x3a2a1c, true);
    rig.setPosition(jx + 700, gy);
    rig.setAlpha(0);
    this._rig = rig;
  },

  // ── Runes ─────────────────────────────────────────────────────────
  _runeDefs: function () {
    var self = this;
    return [
      {
        id: 'r1', x: 520, y: 390,
        verse: {
          fi: [
            'Tuosta suuttui Joukahainen,',
            'kovin suuttui ja kaehti.',
            'Valjasti oriinsa ruskean,',
            'tulisen tulta iskevän,',
            'lähti Väinölän ahoille',
            'laulukilpaan kilvoittamaan.'
          ],
          en: [
            'At this Joukahainen sulked,',
            'bitterly he burned with envy.',
            'Then he yoked his tawny stallion,',
            'yoked his fiery, spark-struck stallion,',
            'set off for the fields of Väinö,',
            'bent upon a singing contest.'
          ]
        }
      },
      {
        id: 'r2', x: 1950, y: 396,
        checkpoint: { x: 1880, y: 420 },
        verse: {
          fi: [
            'Ajoi päivän, ajoi toisen,',
            'ajoi kohta kolmannenki;',
            'jää jyrisi jalkoin alla,',
            'lumi pöllysi perässä.',
            'Kuu kulki kumottamassa,',
            'revontulet taivahalla.'
          ],
          en: [
            'Drove one day, and drove a second,',
            'drove on swiftly through the third day;',
            'the ice thundered under hooves,',
            'snow went smoking out behind him.',
            'The moon walked on, gleaming, shining,',
            'fox-fires burning in the heavens.'
          ]
        }
      },
      {
        id: 'r3', x: 3080, y: 360,
        verse: {
          fi: [
            'Vaka vanha Väinämöinen',
            'ajoi tietä vastahansa.',
            'Aisa aisahan osasi,',
            'rahe rahkehen rapisi,',
            'länki länkehen takeutui,',
            'vemmel vempelen nenähän.'
          ],
          en: [
            'Steadfast, old Väinämöinen',
            'drove along the road to meet him.',
            'Shaft against shaft now tangled,',
            'trace on trace went scraping, rasping,',
            'collar caught upon the collar,',
            'bow-yoke hooked against the bow-yoke.'
          ]
        },
        event: function (scene) { self._arrive(); }
      },
      {
        id: 'r4', x: 3330, y: 360,
        verse: {
          fi: [
            'Virkki nuori Joukahainen:',
            '"Tieän mie tiaisen linnuksi,',
            'kyyn kyyksi, kalan kalaksi;',
            'itse kynnin meren kyntehet,',
            'kaivoin kalahauat,',
            'nostin vuoret, vierin vaarat!"'
          ],
          en: [
            'Spoke the young Joukahainen:',
            '"I know the titmouse for a bird,',
            'the viper for a snake, the fish a fish;',
            'I ploughed the furrows of the sea,',
            'I dug the hollows for the fishes,',
            'raised the mountains, heaped the hillsides!"'
          ]
        },
        event: function (scene) {
          scene._holdPlayer = true;
          scene.time.delayedCall(300, function () {
            StoryPanel.show(scene, {
              fi: [
                'Suuttui vanha Väinämöinen,',
                'itse laulaa leuhautti:',
                'järvet läikkyi, maa järisi,',
                'vuoret vaskiset vapisi,',
                'paaet vahvat paukkoeli,',
                'kalliot kaha lensi.'
              ],
              en: [
                'Then old Väinämöinen, angered,',
                'lifted up his voice in singing:',
                'lakes swelled up, the earth was shaking,',
                'copper mountains shook and trembled,',
                'mighty boulders cracked asunder,',
                'cliffs were split and flew in pieces.'
              ]
            }, function () {
              self._startDuel();
            });
          });
        }
      },
      {
        id: 'r6_finale', x: 6300, y: 370,
        isFinale: true,
        verse: {
          fi: [
            'Kotihin tuli Joukahainen,',
            'itki äitinsä edessä.',
            'Äiti iloitsi: "Hyvä on!',
            'Väinö vävyksi tulevi!"',
            'Mutta Aino, nuori neiti,',
            'itki päivän, itki toisen.'
          ],
          en: [
            'Joukahainen came home weeping,',
            'wept before his aged mother.',
            'But his mother cried, "How fine!',
            'Väinö comes to be our kinsman!"',
            'Yet the maiden Aino, youngest,',
            'wept one day, and wept another.'
          ]
        },
        event: function (scene) {
          EpisodeKit.finale(scene, {
            episode: 3,
            numeral: 'III',
            title: { fi: 'Laulukilpa', en: 'The Singing Contest' },
            color: '#9ab0c8',
            motes: 'particle_snow',
            motesFall: true,
            lines: [
              { fi: 'Laulu voitti, mutta Aino itki.', en: 'The song prevailed, yet Aino wept.' },
              { fi: 'Seuraavaksi: Kantele.', en: 'Next: the Kantele.' }
            ]
          });
        }
      }
    ];
  },

  _arrive: function () {
    var self = this;
    var gy = this.GROUND_Y;
    this._holdPlayer = true;
    this._rig.setAlpha(1);
    this.tweens.add({
      targets: this._rig,
      x: this.JOUKA_X - 70,
      duration: 1600,
      ease: 'Cubic.easeOut',
      onComplete: function () {
        self.cameras.main.shake(260, 0.006);
        RunoAudio.playStingStorm();
        EpisodeKit.burst(self, self.JOUKA_X - 150, gy - 6, 'particle_snow', 30, {
          speed: { min: 30, max: 140 }, angle: { min: 200, max: 340 }, gravityY: 120
        });
        self._jouka.c.setAlpha(1);
        self._jouka.c.y = gy - 30;
        self.tweens.add({
          targets: self._jouka.c, y: gy, duration: 380, ease: 'Bounce.easeOut',
          onComplete: function () { self._holdPlayer = false; }
        });
      }
    });
  },

  // ── The singing contest ───────────────────────────────────────────
  // Joukahainen sings a phrase of glyphs; the player sings it back.
  // Every phrase won sings him deeper into the swamp and changes one of his
  // belongings into part of the landscape.

  _roundDefs: function () {
    var self = this;
    return [
      {
        len: 3,
        change: function () { self._sleighToLog(); },
        verse: {
          fi: [
            'Lauloi reen Joukahaisen',
            'lahoksi lahden rannalle,',
            'puuksi vesiliepehelle;',
            'lauloi nuoren Joukahaisen',
            'suohon polvia myöten.'
          ],
          en: [
            'Sang the sleigh of Joukahainen',
            'into rot along the lakeshore,',
            'to a log among the waters;',
            'sang the young Joukahainen',
            'in the swamp up to his knees.'
          ]
        }
      },
      {
        len: 4,
        change: function () { self._horseToStone(); },
        verse: {
          fi: [
            'Lauloi ruunan, tuliliekin,',
            'kiveksi kosken rannalle;',
            'lauloi nuoren Joukahaisen',
            'suohon vyötä myöten.'
          ],
          en: [
            'Sang the fiery tawny stallion',
            'to a stone beside the rapids;',
            'sang the young Joukahainen',
            'in the swamp up to his waist.'
          ]
        }
      },
      {
        len: 5,
        change: function () { self._bowToRainbow(); },
        verse: {
          fi: [
            'Lauloi jousen, kaunokaaren,',
            'taivonkaareksi vesille;',
            'nuolet lauloi haukoiksi,',
            'kiitäjiksi kotkan siivin;',
            'lauloi nuoren Joukahaisen',
            'suohon kainaloita myöten.'
          ],
          en: [
            'Sang the bow, the lovely arching,',
            'to a rainbow on the waters;',
            'sang the arrows into hawks,',
            'swift as eagles on the wind;',
            'sang the young Joukahainen',
            'in the swamp up to his armpits.'
          ]
        }
      },
      {
        len: 5,
        change: function () { self._capToCloud(); },
        verse: {
          fi: [
            'Lauloi lakin, kirjavaisen,',
            'pilveksi pään päälle;',
            'lauloi nuoren Joukahaisen',
            'suohon suuta myöten,',
            'partaa myöten sammalehen.'
          ],
          en: [
            'Sang the cap, the bright-embroidered,',
            'to a cloud above his forehead;',
            'sang the young Joukahainen',
            'in the swamp up to his mouth,',
            'to his beard among the mosses.'
          ]
        }
      }
    ];
  },

  _startDuel: function () {
    var W = this.scale.width, H = this.scale.height;
    var self = this;
    this._holdPlayer = true;
    this._duel = { round: 0, phase: 'idle', seq: [], pos: 0, misses: 0, rounds: this._roundDefs(), timers: [] };

    // Rune stones the player sings with (bottom centre, above touch zones)
    this._duelButtons = [0, 1, 2, 3].map(function (i) {
      var b = self.add.image(W / 2 + (i - 1.5) * 78, H - 62, 'glyph_' + i + '_dim');
      b.setScrollFactor(0);
      b.setDepth(60);
      b.setAlpha(0);
      b.setInteractive({ useHandCursor: true });
      b.on('pointerdown', function () { self._sing(i); });
      self.tweens.add({ targets: b, alpha: 1, duration: 500, delay: i * 90 });
      return b;
    });
    var keys = ['←', '↑', '→', '↓'];
    this._duelKeyLabels = keys.map(function (k, i) {
      return self.add.text(W / 2 + (i - 1.5) * 78, H - 24, k, {
        fontFamily: RunoFonts.plain, fontSize: '13px', color: '#6a7a8a'
      }).setOrigin(0.5).setScrollFactor(0).setDepth(60).setAlpha(PlayerController.isMobile ? 0 : 0.8);
    });

    // Joukahainen's glyphs appear above his head as he sings
    this._rivalGlyphs = [0, 1, 2, 3].map(function (i) {
      var g = self.add.image(self.JOUKA_X + (i - 1.5) * 38, self.GROUND_Y - 120, 'glyph_' + i + '_dim');
      g.setScale(0.62);
      g.setDepth(12);
      g.setAlpha(0.5);
      return g;
    });

    this._duelPrompt = EpisodeKit.prompt(this, { fi: '', en: '' }, 70);
    this._duelKeyHandler = function (e) {
      if (e.repeat) return;
      var map = { ArrowLeft: 0, a: 0, A: 0, ArrowUp: 1, w: 1, W: 1, ArrowRight: 2, d: 2, D: 2, ArrowDown: 3, s: 3, S: 3 };
      if (map[e.key] !== undefined) self._sing(map[e.key]);
    };
    this.input.keyboard.on('keydown', this._duelKeyHandler);

    this.time.delayedCall(700, function () { self._duelRound(); });
  },

  _setPrompt: function (pair) {
    this._duelPrompt.setText(RunoLang.pick(pair));
    this.tweens.killTweensOf(this._duelPrompt);
    this._duelPrompt.setAlpha(0);
    this.tweens.add({ targets: this._duelPrompt, alpha: 1, duration: 300 });
  },

  _duelRound: function (replay) {
    var d = this._duel;
    var def = d.rounds[d.round];
    if (!replay) {
      // A kindness: after two misses the phrase grows shorter
      var len = Math.max(3, def.len - Math.floor(d.misses / 2));
      d.seq = [];
      for (var i = 0; i < len; i++) {
        var n;
        do { n = Math.floor(Math.random() * 4); }
        while (i >= 2 && n === d.seq[i - 1] && n === d.seq[i - 2]);
        d.seq.push(n);
      }
    } else if (d.misses >= 2 && d.misses % 2 === 0 && d.seq.length > 3) {
      d.seq.pop();
    }
    d.pos = 0;
    d.phase = 'listen';
    this._setPrompt({ fi: 'Kuuntele Joukahaista…', en: 'Listen to Joukahainen…' });

    var self = this;
    var step = 640;
    d.seq.forEach(function (n, k) {
      self.time.delayedCall(500 + k * step, function () {
        var g = self._rivalGlyphs[n];
        g.setTexture('glyph_' + n + '_lit');
        g.setAlpha(1);
        g.setScale(0.75);
        self.tweens.add({ targets: g, scale: 0.62, duration: 380, ease: 'Back.easeOut' });
        RunoAudio.playSongNote(n, true);
        self.time.delayedCall(420, function () {
          g.setTexture('glyph_' + n + '_dim');
          g.setAlpha(0.5);
        });
        self._jouka.c.y -= 3;
        self.tweens.add({ targets: self._jouka.c, y: '+=3', duration: 200 });
      });
    });
    this.time.delayedCall(500 + d.seq.length * step + 200, function () {
      if (!self._duel || self._duel.phase !== 'listen') return;
      d.phase = 'answer';
      self._setPrompt(PlayerController.isMobile
        ? { fi: 'Laula vastaan: napauta kiviä', en: 'Sing it back: tap the stones' }
        : { fi: 'Laula vastaan: ← ↑ → ↓', en: 'Sing it back: ← ↑ → ↓' });
    });
  },

  _sing: function (i) {
    var d = this._duel;
    if (!d || d.phase !== 'answer' || StoryPanel.isActive()) return;
    var btn = this._duelButtons[i];
    btn.setTexture('glyph_' + i + '_lit');
    btn.setScale(1.15);
    this.tweens.add({ targets: btn, scale: 1, duration: 260, ease: 'Back.easeOut' });
    this.time.delayedCall(260, function () { btn.setTexture('glyph_' + i + '_dim'); });
    RunoAudio.playSongNote(i, false);

    var p = this._player;
    EpisodeKit.burst(this, p.x + 10, p.y - 18, 'particle_gold', 6, {
      speed: { min: 60, max: 160 }, angle: { min: -40, max: 10 }, lifespan: 700
    });

    if (d.seq[d.pos] === i) {
      d.pos++;
      if (d.pos >= d.seq.length) this._roundWon();
    } else {
      this._roundMissed();
    }
  },

  _roundMissed: function () {
    var d = this._duel;
    var self = this;
    d.phase = 'miss';
    d.misses++;
    RunoAudio.playStingMiss();
    this._duelButtons.forEach(function (b) {
      self.tweens.add({ targets: b, x: b.x + 5, duration: 50, yoyo: true, repeat: 3 });
    });
    this._setPrompt({ fi: 'Joukahainen nauraa. Uudestaan!', en: 'Joukahainen laughs. Again!' });
    this.tweens.add({ targets: this._jouka.c, y: '-=6', duration: 120, yoyo: true, repeat: 2 });
    this.time.delayedCall(1300, function () { self._duelRound(true); });
  },

  _roundWon: function () {
    var d = this._duel;
    var self = this;
    var def = d.rounds[d.round];
    d.phase = 'verse';
    d.misses = 0;
    this._setPrompt({ fi: 'Laulu kantaa!', en: 'The song takes hold!' });
    RunoAudio.playStingSink();
    this.cameras.main.shake(300, 0.004);

    var sinkTo = [16, 32, 46, 58][d.round];
    this.tweens.add({ targets: this._jouka.c, y: this.GROUND_Y + sinkTo, duration: 1200, ease: 'Sine.easeInOut' });
    def.change();

    this.time.delayedCall(1400, function () {
      StoryPanel.show(self, def.verse, function () {
        d.round++;
        if (d.round < d.rounds.length) {
          self.time.delayedCall(500, function () { self._duelRound(); });
        } else {
          self._endDuel();
        }
      });
    });
  },

  _sleighToLog: function () {
    var self = this;
    var rig = this._rig;
    var log = this.add.graphics();
    log.setDepth(8);
    log.fillStyle(0x2a2218, 1);
    log.fillRoundedRect(-40, -9, 80, 10, 5);
    log.fillStyle(0x4a3c28, 1);
    log.fillCircle(36, -4, 5);
    log.setPosition(rig.x + 20, this.GROUND_Y + 2);
    log.setAlpha(0);
    // Redraw the rig without the sleigh, fade the log in
    this.tweens.add({
      targets: rig, alpha: 0, duration: 700,
      onComplete: function () {
        rig.clear();
        Silhouettes.horse(rig, -60, 0, 1.0, 0x2a1e18, true);
        self.tweens.add({ targets: rig, alpha: 1, duration: 500 });
      }
    });
    this.tweens.add({ targets: log, alpha: 1, duration: 900, delay: 500 });
    EpisodeKit.burst(this, rig.x + 20, this.GROUND_Y - 10, 'particle_gold', 20);
  },

  _horseToStone: function () {
    var rig = this._rig;
    var stone = this.add.graphics();
    stone.setDepth(8);
    stone.fillStyle(0x3a4050, 1);
    stone.fillEllipse(0, -16, 58, 34);
    stone.fillStyle(0xc8d4e4, 0.8);
    stone.fillEllipse(-4, -30, 40, 8);
    stone.setPosition(rig.x - 60, this.GROUND_Y);
    stone.setAlpha(0);
    this.tweens.add({ targets: rig, alpha: 0, duration: 800 });
    this.tweens.add({ targets: stone, alpha: 1, duration: 900, delay: 400 });
    EpisodeKit.burst(this, rig.x - 60, this.GROUND_Y - 20, 'particle_gold', 20);
  },

  _bowToRainbow: function () {
    var W = this.scale.width;
    this.tweens.add({ targets: this._jouka.bow, alpha: 0, duration: 600 });
    var sf = 0.6;
    var g = this.add.graphics();
    g.setScrollFactor(sf);
    g.setDepth(3.5);
    var cx = EpisodeKit.px(this.JOUKA_X + 60, sf, W);
    [0xc04040, 0xd08a30, 0xd8c848, 0x50a060, 0x4070b0, 0x7050a0].forEach(function (c, i) {
      g.lineStyle(7, c, 0.5);
      g.beginPath();
      g.arc(cx, 470, 300 - i * 7, Math.PI, 0, false);
      g.strokePath();
    });
    g.setAlpha(0);
    this.tweens.add({ targets: g, alpha: 0.55, duration: 2200 });
    // The arrows fly off as hawks
    var hx = this.JOUKA_X;
    for (var k = 0; k < 3; k++) {
      var hawk = this.add.graphics();
      hawk.setDepth(12);
      Silhouettes.eagle(hawk, 0, 0, 0.35, 0x1a1a22);
      hawk.setPosition(hx + 10, this.GROUND_Y - 40);
      this.tweens.add({
        targets: hawk, x: hx + 300 + k * 90, y: 60 + k * 30, alpha: 0,
        duration: 2600 + k * 300, ease: 'Sine.easeIn',
        onComplete: function (tw, targets) { targets[0].destroy(); }
      });
    }
  },

  _capToCloud: function () {
    var cap = this._jouka.cap;
    this.tweens.add({ targets: cap, alpha: 0, duration: 600 });
    var cloud = this.add.graphics();
    cloud.setDepth(12);
    cloud.fillStyle(0x8a94a8, 0.5);
    cloud.fillEllipse(0, 0, 90, 26);
    cloud.fillEllipse(-26, -8, 50, 24);
    cloud.fillEllipse(22, -10, 56, 28);
    cloud.setPosition(this.JOUKA_X, this.GROUND_Y - 30);
    cloud.setAlpha(0);
    this.tweens.add({ targets: cloud, alpha: 1, y: this.GROUND_Y - 170, duration: 2400, ease: 'Sine.easeOut' });
    this.tweens.add({ targets: cloud, x: '+=24', duration: 4000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut', delay: 2400 });
  },

  _endDuel: function () {
    var self = this;
    var d = this._duel;
    d.phase = 'done';
    this.input.keyboard.off('keydown', this._duelKeyHandler);
    this.tweens.add({ targets: this._duelButtons.concat(this._duelKeyLabels, this._rivalGlyphs, [this._duelPrompt]), alpha: 0, duration: 500 });

    var plea = {
      fi: [
        'Virkki nuori Joukahainen:',
        '"Oi sa viisas Väinämöinen,',
        'peräytä pyhät sanasi!',
        'Annan jouset, annan veneet,',
        'annan kultia kypärin,',
        'hopeita huovan täyen!"'
      ],
      en: [
        'Spoke the young Joukahainen:',
        '"O you wise old Väinämöinen,',
        'turn aside your holy singing!',
        'I will give you bows and boats,',
        'give you gold by the helmet-full,',
        'silver by the saddle-blanket!"'
      ]
    };
    var aino = {
      fi: [
        'Ei huolinut Väinämöinen.',
        'Silloin lausui Joukahainen:',
        '"Annan Aino siskoseni,',
        'äitini ainoan tyttären,',
        'sulle sukimaan päätä,',
        'kotia pitelemähän!"'
      ],
      en: [
        'Väinämöinen would not listen.',
        'Then cried out young Joukahainen:',
        '"I will give you Aino, my sister,',
        'my mother\'s only daughter,',
        'to comb your hair and keep your house,',
        'to tend your hearth for all her days!"'
      ]
    };
    var free = {
      fi: [
        'Siitä vanha Väinämöinen',
        'ihastui ikihyväksi;',
        'lauloi laulunsa takaisin,',
        'päästi nuoren Joukahaisen.'
      ],
      en: [
        'Then old Väinämöinen, gladdened,',
        'felt a joy that would not leave him;',
        'sang his singing back again,',
        'and let the young Joukahainen go.'
      ]
    };

    this.time.delayedCall(700, function () {
      StoryPanel.show(self, plea, function () {
        self.time.delayedCall(300, function () {
          StoryPanel.show(self, aino, function () {
            RunoAudio.playKanteleChord([0, 2, 4, 7], 0.12);
            self.tweens.add({ targets: self._jouka.c, y: self.GROUND_Y, duration: 1400, ease: 'Sine.easeOut' });
            self.time.delayedCall(1500, function () {
              StoryPanel.show(self, free, function () {
                // Joukahainen trudges home, north and east
                self.tweens.add({
                  targets: self._jouka.c, x: self.JOUKA_X + 520, alpha: 0,
                  duration: 3600, ease: 'Sine.easeIn'
                });
                self._holdPlayer = false;
                self._duel = null;
              });
            });
          });
        });
      });
    });
  },

  update: function (time, delta) {
    var p = this._player;
    var onIce = p.x > this.LAKE.x0 && p.x < this.LAKE.x1 && p.y < this.LAKE.y;
    PlayerController.traction = onIce ? 0.16 : 1;
    EpisodeKit.update(this, delta);
  }
});
