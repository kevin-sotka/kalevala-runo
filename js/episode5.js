// episode5.js — V · Kullervo · Kalervo's Son (Runos 31–36)
// The three deaths that would not take him (sea, fire, oak) → the herdsman's
// bread and the broken knife → cattle into wolves and bears → Untamola burns
// (outrun the fire) → the empty home and Musti the dog → the heath and the sword

var Episode5Scene = new Phaser.Class({
  Extends: Phaser.Scene,
  initialize: function Episode5Scene() {
    Phaser.Scene.call(this, { key: 'Episode5Scene' });
  },

  create: function () {
    var W = this.scale.width;
    var H = this.scale.height;
    EpisodeKit.begin(this, { worldW: 8200, bg: 0x0a1018 });
    this._holdPlayer = false;
    this._t = 0;
    this.SEA = { x0: 220, x1: 1600, y: 360 };
    this.OAK_X = 3760;
    this._chase = null;
    this._musti = null;

    // Colour of the world as the song darkens: [x, colour]
    this.PALETTE = [
      [0, 0x0c141c], [1500, 0x0c141c], [1800, 0x1c0a08], [3200, 0x1c0a08],
      [3450, 0x12101c], [4150, 0x12101c], [4400, 0x161c1e], [5450, 0x161c1e],
      [5750, 0x2a0a06], [6750, 0x2a0a06], [7000, 0x121824], [7650, 0x121824], [7900, 0x060608]
    ];
    // Silent checkpoints between runes: [x, y]
    this.SAFE = [[1680, 360], [2530, 360], [3380, 400], [3960, 140], [4300, 380], [6900, 380]];

    this._buildParallax(W, H);
    this._buildWorld(W, H);
    this._buildSea(H);
    this._buildFire();
    this._buildOak();
    this._buildFarm();
    this._buildUntamola();
    this._buildHome();

    var self = this;
    EpisodeKit.finish(this, {
      episode: 5,
      playerX: 90,
      playerY: 340,
      runes: this._runeDefs(),
      opening: {
        fi: [
          'Kalervo ja Untamoinen,',
          'kaksi veljestä verinen,',
          'riitelivät rajamaista,',
          'kalavesistä kavalti.',
          'Untamo kosti kovasti:',
          'kaatoi Kalervon kansan.'
        ],
        en: [
          'Kalervo and Untamoinen,',
          'brothers two, of blood and rancor,',
          'quarrelled over boundary-meadows,',
          'over fishing-waters, bitter.',
          'Untamo took his revenge,',
          'cut down Kalervo\'s whole kindred.'
        ]
      }
    });

    PlayerController.setWater({
      surfaceAt: function (x) { return (x > self.SEA.x0 && x < self.SEA.x1) ? self._seaY(x) : null; },
      // The sea heaves back and forth
      currentAt: function () { return Math.sin(self._t * 0.8) * 38; }
    });

    this._embers = EpisodeKit.weather(this, 'particle_ember', {
      fromBottom: true, speedX: { min: -20, max: 20 }, speedY: { min: -70, max: -30 },
      lifespan: 7000, frequency: 110, depth: 40, alpha: { start: 0.9, end: 0 }
    });
    this._ash = EpisodeKit.weather(this, 'particle_ash', {
      speedX: { min: -30, max: 0 }, speedY: { min: 10, max: 30 }, frequency: 120, depth: 40
    });
    this._snowfall = EpisodeKit.weather(this, 'particle_snow', {
      speedX: { min: -15, max: 5 }, speedY: { min: 15, max: 35 }, frequency: 90, depth: 40
    });
    [this._embers, this._ash, this._snowfall].forEach(function (e) { if (e) e.stop(); });
    this._weatherOn = {};
  },

  _seaY: function (x) {
    return this.SEA.y + Math.sin(x * 0.012 + this._t * 1.4) * 8 + Math.sin(x * 0.035 - this._t * 2) * 3;
  },

  // ── Scenery ───────────────────────────────────────────────────────
  _buildParallax: function (W, H) {
    var sky = this.add.graphics();
    sky.setScrollFactor(0);
    sky.setDepth(0);
    for (var y = 0; y < H; y += 4) {
      sky.fillStyle(0x000000, 0.5 - (y / H) * 0.5);
      sky.fillRect(0, y, W, 4);
    }
    EpisodeKit.ridge(this, 0.08, 2, 0x08080c, function (x) { return 150 + Math.sin(x * 0.006) * 40 + Math.sin(x * 0.02) * 12; }, 0.9);
    EpisodeKit.forest(this, 0.25, 3, 0x060608, function () { return H - 130; },
      { gap: 34, minH: 50, maxH: 120, kinds: ['spruce', 'pine'] });
    EpisodeKit.ridge(this, 0.25, 3, 0x060608, function () { return 132; });
  },

  _buildWorld: function (W, H) {
    var earth = { fill: 0x0c0c10, edge: 0x24242c };
    EpisodeKit.ground(this, [
      [0, 380, 220],
      [520, 372, 60], [860, 368, 70], [1120, 364, 80],     // rocks in the sea
      [1600, 380, 1700],                                    // the burning field
      [3300, 420, 650],                                     // the oak
      [3950, 160, 200],                                     // the rock face: reached only from the oak's crown
      [4150, 400, 800], [4950, 390, 650],                   // Ilmarinen's pasture
      [5600, 400, 400], [6000, 370, 40], [6040, 400, 260],  // Untamola, with fallen beams
      [6300, 366, 50], [6350, 400, 250], [6600, 370, 40], [6640, 400, 210],
      [6850, 400, 900],                                     // home
      [7750, 390, 450]                                      // the heath
    ], earth);
  },

  _buildSea: function (H) {
    this._seaBack = this.add.graphics();
    this._seaBack.setDepth(6);
    this._seaFront = this.add.graphics();
    this._seaFront.setDepth(11);
    var barrel = this.add.graphics();
    barrel.setDepth(9);
    barrel.fillStyle(0x3a2a1c, 1);
    barrel.fillRoundedRect(-14, -18, 28, 30, 6);
    barrel.lineStyle(2, 0x1a1410, 1);
    barrel.lineBetween(-14, -10, 14, -10);
    barrel.lineBetween(-14, 4, 14, 4);
    barrel.setPosition(1020, this.SEA.y);
    this._barrel = barrel;
  },

  _drawSea: function () {
    var S = this.SEA, H = this.scale.height;
    var b = this._seaBack, f = this._seaFront;
    b.clear(); f.clear();
    b.fillStyle(0x080c14, 1);
    b.fillRect(S.x0, S.y - 12, S.x1 - S.x0, H - S.y + 20);
    b.fillStyle(0x0c141c, 1);
    b.fillRect(S.x0, S.y - 40, S.x1 - S.x0, 28);
    f.fillStyle(0x10202c, 0.6);
    f.beginPath();
    f.moveTo(S.x0, H + 10);
    for (var x = S.x0; x <= S.x1; x += 10) f.lineTo(x, this._seaY(x) + 2);
    f.lineTo(S.x1, H + 10);
    f.closePath();
    f.fillPath();
    f.lineStyle(2, 0x5a7080, 0.7);
    f.beginPath();
    f.moveTo(S.x0, this._seaY(S.x0));
    for (var x2 = S.x0; x2 <= S.x1; x2 += 10) f.lineTo(x2, this._seaY(x2));
    f.strokePath();
    this._barrel.y = this._seaY(this._barrel.x) + 2;
    this._barrel.angle = Math.sin(this._t * 1.4) * 10;
  },

  // Fire vents on the burning field: pulse on and off; touching a lit one
  // sends the Wanderer back to the last safe place.
  _buildFire: function () {
    this._vents = [
      { x: 1900, w: 60, phase: 0 },
      { x: 2150, w: 60, phase: 1.6 },
      { x: 2400, w: 90, phase: 3.1 },
      { x: 2700, w: 60, phase: 0.8 },
      { x: 2950, w: 70, phase: 2.4 }
    ];
    this._ventG = this.add.graphics();
    this._ventG.setDepth(9);
    EpisodeKit.ledges(this, [[2360, 280, 120]], { fill: 0x141010, edge: 0x3a2a24 });
    var pyre = this.add.graphics();
    pyre.setDepth(7);
    pyre.fillStyle(0x1a1210, 1);
    this._vents.forEach(function (v) {
      pyre.fillRect(v.x - v.w / 2, 374, v.w, 6);
      for (var k = 0; k < 4; k++) pyre.fillRect(v.x - v.w / 2 + k * v.w / 4, 368 - k % 2 * 3, v.w / 3, 4);
    });
  },

  _ventLevel: function (v) {
    // 0 = cold, 1 = full flame. On ~45% of the cycle with a short flicker-up.
    var s = Math.sin(this._t * 1.9 + v.phase);
    return Phaser.Math.Clamp((s - 0.1) * 2.2, 0, 1);
  },

  _updateVents: function () {
    var g = this._ventG;
    g.clear();
    var p = this._player;
    var hit = false;
    var ground = 380;
    this._vents.forEach(function (v) {
      var lv = this._ventLevel(v);
      if (lv <= 0.02) {
        g.fillStyle(0xa03010, 0.4);
        g.fillRect(v.x - v.w / 2 + 4, ground - 6, v.w - 8, 3);
        return;
      }
      var h = 100 * lv;
      for (var k = 0; k < 5; k++) {
        var fx = v.x - v.w / 2 + (k + 0.5) * v.w / 5;
        var fh = h * (0.6 + 0.4 * Math.sin(this._t * 12 + k * 1.7 + v.phase));
        g.fillStyle(0xd04010, 0.75);
        g.fillTriangle(fx - v.w / 8, ground - 4, fx + v.w / 8, ground - 4, fx, ground - 4 - fh);
        g.fillStyle(0xf0a030, 0.8);
        g.fillTriangle(fx - v.w / 16, ground - 4, fx + v.w / 16, ground - 4, fx, ground - 4 - fh * 0.6);
      }
      if (lv > 0.35 && Math.abs(p.x - v.x) < v.w / 2 + 4 && p.y + 18 > ground - h * 0.85) hit = true;
    }, this);
    if (hit && !RespawnSystem.isBusy()) {
      RunoAudio.playStingFire();
      RespawnSystem.respawn(p, PlayerController.lastCheckpointX, PlayerController.lastCheckpointY);
    }
  },

  _buildOak: function () {
    var x = this.OAK_X, g = this.add.graphics();
    g.setDepth(6);
    g.fillStyle(0x0a0a0e, 1);
    g.fillPoints([{ x: x - 50, y: 420 }, { x: x - 26, y: 300 }, { x: x - 22, y: 60 }, { x: x + 22, y: 60 },
      { x: x + 26, y: 300 }, { x: x + 54, y: 420 }], true);
    g.fillEllipse(x, 50, 360, 110);
    g.fillEllipse(x - 130, 90, 150, 70);
    g.fillEllipse(x + 140, 96, 160, 70);
    this._oakG = g;
    // Branches to climb (one-way): up the left, across, up the right
    EpisodeKit.ledges(this, [
      [x - 130, 352, 110],
      [x + 10, 288, 110],
      [x - 130, 224, 110],
      [x + 10, 160, 110],
      [x - 80, 100, 160]
    ], { fill: 0x121216, edge: 0x2a2a30, thick: 9 });
  },

  _buildFarm: function () {
    var h = this.add.graphics();
    h.setDepth(6);
    Silhouettes.house(h, 5120, 390, 1.5, 0x0a0c0e, { window: 0x9a7040 });
    Silhouettes.birch(h, 4500, 400, 130, 0x0e1214, { bark: 0x9aa0a4 });
    Silhouettes.birch(h, 4880, 400, 150, 0x0e1214, { bark: 0x9aa0a4 });
    this._herd = [4380, 4600, 4780, 5010, 5260, 5480].map(function (cx, i) {
      var g = this.add.graphics();
      g.setDepth(8);
      Silhouettes.cow(g, 0, 0, 0.9, 0x4a4036, i % 2 === 0);
      g.setPosition(cx, cx < 4950 ? 400 : 390);
      this.tweens.add({ targets: g, x: cx + 14, duration: 3000 + i * 400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      return g;
    }, this);
  },

  _buildUntamola: function () {
    var g = this.add.graphics();
    g.setDepth(6);
    [5900, 6120, 6420, 6680].forEach(function (x, i) {
      Silhouettes.house(g, x, 400, 1.3 + (i % 2) * 0.4, 0x080404, {});
    });
    this._untamoFires = [];
    this._chaseG = this.add.graphics();
    this._chaseG.setDepth(12);
  },

  _buildHome: function () {
    var g = this.add.graphics();
    g.setDepth(6);
    Silhouettes.house(g, 7250, 400, 1.6, 0x0a0c10, {});
    Silhouettes.spruce(g, 7080, 400, 170, 0x08090c);
    Silhouettes.spruce(g, 7460, 400, 150, 0x08090c);
    // Snow on the roof, no light in the window, no smoke
    g.fillStyle(0xb8c4d0, 0.5);
    g.fillTriangle(7250 - 70, 400 - 50, 7250 + 70, 400 - 50, 7250, 400 - 96);
  },

  // ── Runes ─────────────────────────────────────────────────────────
  _runeDefs: function () {
    var self = this;
    return [
      {
        id: 'r0', x: 170, y: 330,
        verse: {
          fi: [
            'Jäi yksi Kalervon kansaa,',
            'neiti kohtu kantavana;',
            'siitä syntyi poika pieni,',
            'Kullervo, Kalervon poika.',
            'Kolmiöisnä ojentihe,',
            'potki kapalot kappaleiksi.'
          ],
          en: [
            'One of Kalervo\'s folk was left,',
            'a maiden, carrying a child;',
            'from her came a little boy,',
            'Kullervo, Kalervo\'s son.',
            'Three nights old, he stretched and kicked,',
            'burst his swaddling-bands to pieces.'
          ]
        }
      },
      {
        id: 'r1', x: 1160, y: 316,
        verse: {
          fi: [
            'Pantihin poika tynnyrihin,',
            'työnnettihin aaltoihin.',
            'Kahen yön ja kolmen päivän',
            'käytihin katsomahan:',
            'poika istui aallon päällä,',
            'onki vaskisella vavalla.'
          ],
          en: [
            'Then they put the boy in a barrel,',
            'pushed it out upon the billows.',
            'After two nights and three days',
            'they went down to see what happened:',
            'there the boy sat on the waves,',
            'fishing with a copper rod.'
          ]
        }
      },
      {
        id: 'r2', x: 3130, y: 330,
        verse: {
          fi: [
            'Kannettihin koivut, kuuset,',
            'havut, tervaksiset puut;',
            'poltettihin poika roviolla,',
            'tuli tuikki tuhannen sylen.',
            'Aamulla poika istui tuhassa,',
            'hiilihankoa heilutti.'
          ],
          en: [
            'Birch and spruce were piled around him,',
            'pine boughs, resin-heavy timber;',
            'on the pyre they burned the boy,',
            'fire leaping a thousand fathoms.',
            'Morning found him in the ashes,',
            'stirring embers with a poker.'
          ]
        }
      },
      {
        id: 'r3', x: this.OAK_X, y: 58,
        checkpoint: { x: this.OAK_X - 20, y: 80 },
        verse: {
          fi: [
            'Hirtettihin hirsipuuhun,',
            'ripustettiin tammen oksaan.',
            'Kolmen yön ja päivän päästä:',
            'poika tammessa tapasi,',
            'kirjoitteli kuvasia,',
            'kuvia koverteli.'
          ],
          en: [
            'Then they hanged him on the gallows,',
            'strung him from an oak tree\'s branches.',
            'After three nights and three days:',
            'there the boy was, in the oak,',
            'drawing pictures, scratching patterns,',
            'carving figures in the bark.'
          ]
        },
        event: function (scene) { self._carvings(); }
      },
      {
        id: 'r4', x: 4700, y: 350,
        verse: {
          fi: [
            'Myytihin Ilmariselle,',
            'paimeneksi karjan perään.',
            'Emäntä leipoi leivän:',
            'alle kauran, päälle vehnän,',
            'keskelle kiven kovasti.',
            'Veitsi katkesi kivehen.'
          ],
          en: [
            'Sold he was to Ilmarinen,',
            'sent to herd the cattle out.',
            'The mistress baked his bread for him:',
            'oats beneath and wheat above,',
            'and a stone within the middle.',
            'On the stone his knife was broken.'
          ]
        },
        event: function (scene) { self._knifeBreaks(); }
      },
      {
        id: 'r5', x: 5360, y: 340,
        verse: {
          fi: [
            'Illalla emäntä astui',
            'lypsämähän lehmiänsä;',
            'susi hyökkäsi, karhu kaatoi.',
            'Kullervo pakeni metsään,',
            'itki, kulki, kirosi,',
            'etsi Untamon tupia.'
          ],
          en: [
            'In the evening came the mistress',
            'out to milk her cows at twilight;',
            'the wolf sprang, the bear struck down.',
            'Kullervo fled into the forest,',
            'weeping, walking, cursing, seeking',
            'out the halls of Untamoinen.'
          ]
        }
      },
      {
        id: 'r6', x: 5760, y: 350,
        checkpoint: { x: 5720, y: 380 },
        verse: {
          fi: [
            'Kullervo, Kalervon poika,',
            'sytytti Untamon talot;',
            'tuli nousi tuulen myötä,',
            'paloi pihat, paloi pirtit.',
            'Juokse nyt, poika, juokse,',
            'tuli on kintereilläsi!'
          ],
          en: [
            'Kullervo, Kalervo\'s son,',
            'set the halls of Untamo burning;',
            'up the fire rose on the wind,',
            'burned the yards and burned the cabins.',
            'Run now, boy, run swiftly now,',
            'for the fire is at your heels!'
          ]
        },
        event: function (scene) { self._startChase(); }
      },
      {
        id: 'r7', x: 7050, y: 350,
        verse: {
          fi: [
            'Tuli kotihin Kullervo:',
            'tyhjä tupa, kylmä liesi.',
            'Isä maassa, äiti maassa,',
            'veikko, sisko nurmen alla.',
            'Musta koira, Musti vanha,',
            'yksin tuli vastahansa.'
          ],
          en: [
            'Home at last came Kullervo:',
            'empty house and hearth gone cold.',
            'Father buried, mother buried,',
            'brother, sister under turf.',
            'Only Musti, the old black dog,',
            'came alone to meet him there.'
          ]
        },
        event: function (scene) { self._mustiComes(); }
      },
      {
        id: 'r8_finale', x: 7960, y: 340,
        isFinale: true,
        verse: {
          fi: [
            'Tuli sille kankahalle,',
            'missä neien turmeli,',
            'oman siskonsa tietämättä.',
            'Kysyi miekalta: "Juotko verta?"',
            'Miekka vastasi: "Miks\' en joisi',
            'syyllistä, kun syyttömänki?"'
          ],
          en: [
            'To the heath he came at last,',
            'where he wronged a maiden once,',
            'his own sister, all unknowing.',
            '"Sword," he asked, "will you drink my blood?"',
            'Said the sword: "Why should I not drink',
            'guilty blood, who drank the guiltless?"'
          ]
        },
        event: function (scene) {
          RunoAudio.playStingSword();
          EpisodeKit.flash(scene, 0xffffff, 0.35, 1600);
          EpisodeKit.finale(scene, {
            episode: 5,
            numeral: 'V',
            title: { fi: 'Kullervo', en: 'Kalervo\'s Son' },
            color: '#8a4a3a',
            motes: 'particle_ash',
            motesFall: true,
            hold: 2600,
            lines: [
              { fi: 'Sanoi vanha Väinämöinen:', en: 'Said the old Väinämöinen:' },
              { fi: '"Älkää lasta kasvattako', en: '"Never raise a child, O people,' },
              { fi: 'vieraan kehnon kehtoloissa."', en: 'in a cruel stranger\'s keeping."' },
              { fi: 'Viisi runoa on laulettu. Kiitos.', en: 'Five songs are sung. Kiitos: thank you.' }
            ]
          });
        }
      }
    ];
  },

  _carvings: function () {
    var g = this.add.graphics();
    g.setDepth(6.5);
    g.lineStyle(1.5, 0xc8a870, 0.8);
    var x = this.OAK_X;
    // Figures scratched into the bark: a horse, a man, a sun, a tree
    g.strokeCircle(x - 6, 200, 6);
    g.lineBetween(x - 6, 206, x - 6, 222); g.lineBetween(x - 12, 212, x, 212);
    g.lineBetween(x - 6, 222, x - 11, 232); g.lineBetween(x - 6, 222, x - 1, 232);
    g.strokeCircle(x + 8, 150, 7);
    for (var a = 0; a < 8; a++) {
      g.lineBetween(x + 8 + Math.cos(a * 0.785) * 9, 150 + Math.sin(a * 0.785) * 9,
        x + 8 + Math.cos(a * 0.785) * 13, 150 + Math.sin(a * 0.785) * 13);
    }
    g.lineBetween(x - 12, 280, x + 10, 280); g.lineBetween(x + 10, 280, x + 14, 272);
    g.lineBetween(x - 10, 280, x - 10, 292); g.lineBetween(x + 8, 280, x + 8, 292);
    g.setAlpha(0);
    this.tweens.add({ targets: g, alpha: 1, duration: 2400 });
  },

  _knifeBreaks: function () {
    var self = this;
    this._holdPlayer = true;
    RunoAudio.playStingSword();
    this.cameras.main.shake(200, 0.006);
    var red = EpisodeKit.tint(this, 0x801010, 90);
    this.tweens.add({ targets: red, alpha: 0.35, duration: 300, yoyo: true, hold: 800 });
    this.time.delayedCall(1400, function () {
      StoryPanel.show(self, {
        fi: [
          'Isän ainoa perintö,',
          'Kalervon kalu kaunis!',
          'Siitä suuttui Kullervo:',
          '"Sudet karjaksi sukeukoon,',
          'kontiot lehmiksi kotihin!"'
        ],
        en: [
          'His father\'s only heirloom,',
          'Kalervo\'s one lovely treasure!',
          'Then Kullervo\'s anger kindled:',
          '"Let the wolves become the cattle,',
          'let the bears come home as cows!"'
        ]
      }, function () {
        RunoAudio.playStingHowl();
        self._herd.forEach(function (cow, i) {
          self.tweens.killTweensOf(cow);
          var beast = self.add.graphics();
          beast.setDepth(8);
          if (i % 2) Silhouettes.bear(beast, 0, 0, 0.9, 0x3a3440, i % 3 === 0);
          else Silhouettes.wolf(beast, 0, 0, 0.95, 0x40404a, i % 3 === 0);
          beast.setPosition(cow.x, cow.y);
          beast.setAlpha(0);
          self.tweens.add({ targets: cow, alpha: 0, duration: 1200, delay: i * 160 });
          self.tweens.add({ targets: beast, alpha: 1, duration: 1200, delay: i * 160 + 300 });
          self.tweens.add({ targets: beast, x: beast.x + (i % 2 ? -10 : 12), duration: 900, yoyo: true, repeat: -1, delay: 1600 });
        });
        self.time.delayedCall(2200, function () { self._holdPlayer = false; });
      });
    });
  },

  // Untamola burns: a wall of fire follows the Wanderer to the river ford.
  _startChase: function () {
    var self = this;
    this._chase = { x: 5480, speed: 118, delay: 900, done: false };
    RunoAudio.playStingFire();
    this.cameras.main.shake(300, 0.004);
    [5900, 6120, 6420, 6680].forEach(function (x) {
      try {
        var f = self.add.particles(x, 340, 'particle_ember', {
          x: { min: -50, max: 50 }, speedY: { min: -120, max: -40 }, speedX: { min: -20, max: 20 },
          scale: { start: 1.6, end: 0 }, lifespan: { min: 600, max: 1400 }, frequency: 30
        });
        f.setDepth(7);
        self._untamoFires.push(f);
      } catch (e) {}
    });
  },

  _updateChase: function (delta) {
    var c = this._chase;
    if (!c || c.done) return;
    var p = this._player;
    var H = this.scale.height;
    if (StoryPanel.isActive() || RespawnSystem.isBusy()) return;
    if (c.delay > 0) { c.delay -= delta; } else { c.x += c.speed * delta / 1000; }

    var g = this._chaseG;
    g.clear();
    for (var y = 0; y < H; y += 12) {
      var lick = Math.sin(y * 0.08 + this._t * 9) * 18 + Math.sin(y * 0.03 - this._t * 5) * 10;
      g.fillStyle(0x200404, 0.95);
      g.fillRect(c.x - 900, y, 900 + lick * 0.3, 12);
      g.fillStyle(0xd04010, 0.8);
      g.fillTriangle(c.x + lick * 0.3, y, c.x + lick * 0.3, y + 12, c.x + 26 + lick, y + 6);
      g.fillStyle(0xf0a030, 0.7);
      g.fillTriangle(c.x - 6 + lick * 0.3, y + 2, c.x - 6 + lick * 0.3, y + 10, c.x + 10 + lick * 0.6, y + 6);
    }

    if (p.x > 6860) {
      c.done = true;
      this.tweens.add({ targets: g, alpha: 0, duration: 2000 });
      return;
    }
    if (c.x > p.x - 12) {
      RunoAudio.playStingFire();
      RespawnSystem.respawn(p, PlayerController.lastCheckpointX, PlayerController.lastCheckpointY);
      c.x = 5480;
      c.delay = 1400;
    }
  },

  _mustiComes: function () {
    var g = this.add.graphics();
    g.setDepth(9);
    Silhouettes.dog(g, 0, 0, 1.1, 0x050506, false);
    g.setPosition(7400, 400);
    this._musti = { g: g, hop: 0 };
    RunoAudio.playKantele(0, -1);
  },

  _updateMusti: function (delta) {
    var m = this._musti;
    if (!m) return;
    var p = this._player;
    var target = p.x + (PlayerController.facingRight ? -46 : 46);
    var dx = target - m.g.x;
    var step = Phaser.Math.Clamp(dx, -200 * delta / 1000, 200 * delta / 1000);
    m.g.x += Math.abs(dx) > 6 ? step : 0;
    var moving = Math.abs(dx) > 6;
    m.hop += delta * 0.02;
    var groundY = p.x > 7750 ? 390 : 400;
    m.g.y = groundY - (moving ? Math.abs(Math.sin(m.hop)) * 4 : 0);
    m.g.scaleX = dx < 0 ? -1 : 1;
  },

  _updatePalette: function () {
    var x = this._player.x;
    var P = this.PALETTE, a = P[0], b = P[P.length - 1];
    for (var i = 0; i < P.length - 1; i++) {
      if (x >= P[i][0] && x < P[i + 1][0]) { a = P[i]; b = P[i + 1]; break; }
    }
    var u = b[0] > a[0] ? Phaser.Math.Clamp((x - a[0]) / (b[0] - a[0]), 0, 1) : 0;
    var ca = Phaser.Display.Color.IntegerToColor(a[1]);
    var cb = Phaser.Display.Color.IntegerToColor(b[1]);
    var c = Phaser.Display.Color.Interpolate.ColorWithColor(ca, cb, 100, u * 100);
    this.cameras.main.setBackgroundColor(Phaser.Display.Color.GetColor(c.r, c.g, c.b));
  },

  _updateWeather: function () {
    var x = this._player.x;
    var want = {
      embers: x > 1600 && x < 3300,
      ash: (x > 5600 && x < 6900) || x > 7750,
      snow: x > 6850 && x < 7750
    };
    var map = { embers: this._embers, ash: this._ash, snow: this._snowfall };
    for (var k in want) {
      if (!map[k]) continue;
      if (want[k] && !this._weatherOn[k]) map[k].start();
      if (!want[k] && this._weatherOn[k]) map[k].stop();
      this._weatherOn[k] = want[k];
    }
  },

  _updateSafePoints: function () {
    var p = this._player;
    if (!PlayerController.isGrounded) return;
    for (var i = 0; i < this.SAFE.length; i++) {
      var s = this.SAFE[i];
      if (p.x > s[0] && p.x < s[0] + 80 && PlayerController.lastCheckpointX < s[0]) {
        PlayerController.setCheckpoint(s[0] + 20, s[1]);
      }
    }
  },

  update: function (time, delta) {
    this._t += delta * 0.001;
    EpisodeKit.update(this, delta);
    this._drawSea();
    this._updateVents();
    this._updateChase(delta);
    this._updateMusti(delta);
    this._updatePalette();
    this._updateWeather();
    this._updateSafePoints();
  }
});
