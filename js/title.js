// title.js — TitleScene: episode select cards, atmospheric parallax drift

var TitleScene = new Phaser.Class({
  Extends: Phaser.Scene,
  initialize: function TitleScene() {
    Phaser.Scene.call(this, { key: 'TitleScene' });
  },

  create: function () {
    var W = this.scale.width;
    var H = this.scale.height;

    // Background sky
    var sky = this.add.image(W / 2, H / 2, 'sky_title');
    sky.setDisplaySize(W, H);
    sky.setDepth(0);

    // Revontulet over the title, the same fox-fires as the winter song
    EpisodeKit.aurora(this, 1, [0x1e7a5a, 0x1e6478, 0x503878]);

    // Parallax layers (star fields at different depths)
    this._parallaxLayers = [];
    this._buildStarLayers(W, H);

    // Title text
    var titleStyle = {
      fontFamily: "'Iowan Old Style', 'Palatino Linotype', Palatino, Georgia, serif",
      fontSize: '72px',
      color: '#c0c8d8',
      letterSpacing: 18,
      shadow: { offsetX: 0, offsetY: 2, color: '#000820', fill: true, blur: 8 }
    };
    var title = this.add.text(W / 2, H * 0.24, 'RUNO', titleStyle);
    title.setOrigin(0.5, 0.5);
    title.setDepth(10);

    var subtitleStyle = {
      fontFamily: "'Iowan Old Style', Georgia, serif",
      fontSize: '16px',
      color: '#5a6a7a',
      letterSpacing: 6
    };
    var subtitle = this.add.text(W / 2, H * 0.36, 'Kalevalan lauluja  ·  Songs of the Kalevala', subtitleStyle);
    subtitle.setOrigin(0.5, 0.5);
    subtitle.setDepth(10);

    // Episode cards
    this._launching = false;
    this._buildEpisodeCards(W, H);

    var credit = this.add.text(W / 2, H - 20,
      'Elias Lönnrotin Kalevala (1849)  ·  L kieli / language  ·  M ääni / sound', {
        fontFamily: RunoFonts.plain, fontSize: '11px', color: '#34424f', letterSpacing: 2
      });
    credit.setOrigin(0.5, 0.5);
    credit.setDepth(10);

    // Mute button
    MuteButton.create(this);

    // Ambient particles (aurora motes)
    this._buildAmbientParticles(W, H);

    // Gentle title pulse
    this.tweens.add({
      targets: title,
      alpha: { from: 0.85, to: 1 },
      duration: 3000,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1
    });

    // Drift timer
    this._driftT = 0;

    // Back from a song: let the title's own music take over
    if (RunoAudio.isStarted()) RunoAudio.start(0);

    // Handle touch for audio start (any tap on the scene)
    this.input.once('pointerdown', function () {
      if (!RunoAudio.isStarted()) {
        RunoAudio.start(0);
      }
    });
  },

  _buildStarLayers: function (W, H) {
    // 3 star layers at different depths / speeds
    var counts = [80, 50, 25];
    var alphas = [0.4, 0.6, 0.9];
    var sizes = [1, 1.5, 2];

    for (var layer = 0; layer < 3; layer++) {
      var g = this.add.graphics();
      g.setDepth(2 + layer);
      var stars = [];
      for (var i = 0; i < counts[layer]; i++) {
        var sx = Phaser.Math.Between(0, W);
        var sy = Phaser.Math.Between(0, H * 0.7);
        g.fillStyle(0x8090c0, alphas[layer] * (0.6 + Math.random() * 0.4));
        g.fillCircle(sx, sy, sizes[layer]);
        stars.push({ ox: sx, oy: sy });
      }
      this._parallaxLayers.push({ g: g, stars: stars, speed: 0.04 + layer * 0.02, offsetX: 0 });
    }
  },

  _buildEpisodeCards: function (W, H) {
    var episodes = [
      { n: 1, numeral: 'I', fi: 'Väinämöisen synty', en: 'The Birth of Väinämöinen', scene: 'Episode1Scene' },
      { n: 2, numeral: 'II', fi: 'Sampo', en: 'The Sampo', scene: 'Episode2Scene' },
      { n: 3, numeral: 'III', fi: 'Laulukilpa', en: 'The Singing Contest', scene: 'Episode3Scene' },
      { n: 4, numeral: 'IV', fi: 'Kantele', en: 'The Pike-Bone Harp', scene: 'Episode4Scene' },
      { n: 5, numeral: 'V', fi: 'Kullervo', en: 'Kalervo\'s Son', scene: 'Episode5Scene' }
    ];
    var gap = 182;
    var cardY = H * 0.67;
    this._cards = episodes.map(function (ep, i) {
      ep.locked = !RunoSave.isUnlocked(ep.n);
      ep.done = RunoSave.isComplete(ep.n);
      return this._buildCard(W / 2 + (i - 2) * gap, cardY, ep);
    }, this);
  },

  _buildCard: function (cx, cy, config) {
    var cardW = 170, cardH = 132;
    var container = this.add.container(cx, cy);
    container.setDepth(15);

    var bg = this.add.graphics();
    var draw = function (hover) {
      bg.clear();
      bg.fillStyle(hover ? 0x0c1428 : 0x080c18, hover ? 0.95 : 0.88);
      bg.fillRoundedRect(-cardW / 2, -cardH / 2, cardW, cardH, 6);
      bg.lineStyle(hover ? 2 : 1, config.locked ? 0x1a2030 : (hover ? 0x4a7090 : 0x2a4050), hover ? 0.9 : 0.7);
      bg.strokeRoundedRect(-cardW / 2, -cardH / 2, cardW, cardH, 6);
    };
    draw(false);
    container.add(bg);

    var dim = config.locked;
    var numeral = this.add.text(0, -44, config.numeral, {
      fontFamily: RunoFonts.verse, fontSize: '18px',
      color: dim ? '#1e2a38' : '#a08850', letterSpacing: 4
    }).setOrigin(0.5, 0.5);
    var fi = this.add.text(0, -18, config.fi, {
      fontFamily: RunoFonts.verse, fontSize: '15px',
      color: dim ? '#2a3a4a' : '#9aa8c0', letterSpacing: 1,
      align: 'center', wordWrap: { width: cardW - 20 }
    }).setOrigin(0.5, 0.5);
    var en = this.add.text(0, 4, config.en, {
      fontFamily: RunoFonts.plain, fontSize: '11px',
      color: dim ? '#1a2a38' : '#4a6070', letterSpacing: 1,
      align: 'center', wordWrap: { width: cardW - 20 }
    }).setOrigin(0.5, 0.5);
    container.add([numeral, fi, en]);

    if (dim) {
      var lockTxt = this.add.text(0, 40, '⟡', { fontFamily: 'Georgia, serif', fontSize: '22px', color: '#1a2a38' });
      lockTxt.setOrigin(0.5, 0.5);
      container.add(lockTxt);
      return container;
    }

    var runeIcon = this.add.image(0, 40, config.done ? 'rune_lit' : 'rune_unlit');
    runeIcon.setScale(0.55);
    container.add(runeIcon);
    this.tweens.add({
      targets: runeIcon, alpha: { from: 0.55, to: 1 }, duration: 1800,
      ease: 'Sine.easeInOut', yoyo: true, repeat: -1
    });

    bg.setInteractive(new Phaser.Geom.Rectangle(-cardW / 2, -cardH / 2, cardW, cardH), Phaser.Geom.Rectangle.Contains);
    bg.on('pointerover', function () { draw(true); fi.setColor('#d0dcec'); });
    bg.on('pointerout', function () { draw(false); fi.setColor('#9aa8c0'); });

    var self = this;
    bg.on('pointerdown', function () {
      if (self._launching) return;
      self._launching = true;
      if (!RunoAudio.isStarted()) RunoAudio.start(config.n);
      self.cameras.main.fadeOut(500, 0, 0, 0);
      self.cameras.main.once('camerafadeoutcomplete', function () {
        self.scene.start(config.scene);
      });
    });
    return container;
  },

  _buildAmbientParticles: function (W, H) {
    try {
      var emitter = this.add.particles(W / 2, H * 0.4, 'particle_star', {
        x: { min: -W / 2, max: W / 2 },
        y: { min: -H * 0.3, max: H * 0.2 },
        speedX: { min: -8, max: 8 },
        speedY: { min: -15, max: -3 },
        scale: { start: 1, end: 0 },
        alpha: { start: 0.6, end: 0 },
        lifespan: { min: 3000, max: 6000 },
        frequency: 300,
        quantity: 1
      });
      emitter.setDepth(6);
    } catch (e) {}
  },

  update: function (time, delta) {
    this._driftT += delta * 0.0003;

    // Parallax drift
    this._parallaxLayers.forEach(function (layer, i) {
      layer.offsetX = Math.sin(this._driftT * (0.4 + i * 0.2)) * 15;
      layer.g.clear();
      layer.g.setDepth(2 + i);
      var alphas = [0.4, 0.6, 0.9];
      var sizes = [1, 1.5, 2];
      layer.stars.forEach(function (star) {
        var sx = star.ox + layer.offsetX;
        // Wrap
        var W = this.scale.width;
        if (sx < 0) sx += W;
        if (sx > W) sx -= W;
        layer.g.fillStyle(0x8090c0, alphas[i] * (0.6 + 0.4));
        layer.g.fillCircle(sx, star.oy, sizes[i]);
      }, this);
    }, this);
  }
});
