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

    // Aurora hint — drawn as faint horizontal gradient bands
    this._buildAurora(W, H);

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
    var title = this.add.text(W / 2, H * 0.28, 'RUNO', titleStyle);
    title.setOrigin(0.5, 0.5);
    title.setDepth(10);

    var subtitleStyle = {
      fontFamily: "'Iowan Old Style', Georgia, serif",
      fontSize: '16px',
      color: '#5a6a7a',
      letterSpacing: 6
    };
    var subtitle = this.add.text(W / 2, H * 0.38, 'Songs of the Kalevala', subtitleStyle);
    subtitle.setOrigin(0.5, 0.5);
    subtitle.setDepth(10);

    // Episode cards
    this._buildEpisodeCards(W, H);

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

    // Handle touch for audio start (any tap on the scene)
    this.input.once('pointerdown', function () {
      if (!RunoAudio.isStarted()) {
        RunoAudio.start(0);
      }
    });
  },

  _buildAurora: function (W, H) {
    // Faint aurora bands near top
    var bands = this.add.graphics();
    bands.setDepth(1);
    var auroraColors = [0x0a2030, 0x0a1828, 0x081420];
    for (var i = 0; i < 3; i++) {
      bands.fillStyle(auroraColors[i], 0.18 - i * 0.04);
      var yOff = H * 0.05 + i * 30;
      // Wavy band using fillRect strips
      for (var x = 0; x < W; x += 20) {
        var h = 18 + Math.sin(x * 0.02 + i * 1.2) * 8;
        bands.fillRect(x, yOff, 20, h);
      }
    }
    this._auroraBands = bands;
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
    var ep1Complete = this.registry.get('ep1Complete') || false;
    var cardY = H * 0.65;

    // Episode 1 card
    var card1 = this._buildCard(W / 2 - 160, cardY, {
      title: 'I. Birth of Väinämöinen',
      sub: 'The primordial sea',
      locked: false,
      scene: 'Episode1Scene',
      episode: 1
    }, W, H);

    // Episode 2 card
    var card2 = this._buildCard(W / 2 + 160, cardY, {
      title: 'II. The Sampo',
      sub: ep1Complete ? 'The great forge' : 'Complete Episode I',
      locked: !ep1Complete,
      scene: 'Episode2Scene',
      episode: 2
    }, W, H);

    this._card1 = card1;
    this._card2 = card2;
  },

  _buildCard: function (cx, cy, config, W, H) {
    var cardW = 260, cardH = 150;
    var container = this.add.container(cx, cy);
    container.setDepth(15);

    // Card background
    var bg = this.add.graphics();
    bg.fillStyle(0x080c18, 0.88);
    bg.fillRoundedRect(-cardW / 2, -cardH / 2, cardW, cardH, 6);
    bg.lineStyle(1, config.locked ? 0x1a2030 : 0x2a4050, 0.7);
    bg.strokeRoundedRect(-cardW / 2, -cardH / 2, cardW, cardH, 6);
    container.add(bg);

    var titleStyle = {
      fontFamily: "'Iowan Old Style', Georgia, serif",
      fontSize: '15px',
      color: config.locked ? '#2a3a4a' : '#8090a8',
      letterSpacing: 2,
      wordWrap: { width: cardW - 40 },
      align: 'center'
    };
    var titleTxt = this.add.text(0, -30, config.title, titleStyle);
    titleTxt.setOrigin(0.5, 0.5);
    container.add(titleTxt);

    var subStyle = {
      fontFamily: "Georgia, serif",
      fontSize: '12px',
      color: config.locked ? '#1a2a38' : '#4a6070',
      letterSpacing: 1,
      align: 'center'
    };
    var subTxt = this.add.text(0, 4, config.sub, subStyle);
    subTxt.setOrigin(0.5, 0.5);
    container.add(subTxt);

    if (!config.locked) {
      // Episode rune icon
      var runeIcon = this.add.image(0, 38, 'rune_unlit');
      runeIcon.setScale(0.6);
      container.add(runeIcon);

      // Hover / click
      bg.setInteractive(new Phaser.Geom.Rectangle(-cardW / 2, -cardH / 2, cardW, cardH), Phaser.Geom.Rectangle.Contains);
      bg.on('pointerover', function () {
        bg.clear();
        bg.fillStyle(0x0c1428, 0.95);
        bg.fillRoundedRect(-cardW / 2, -cardH / 2, cardW, cardH, 6);
        bg.lineStyle(2, 0x4a7090, 0.9);
        bg.strokeRoundedRect(-cardW / 2, -cardH / 2, cardW, cardH, 6);
        titleTxt.setColor('#c0d0e0');
      });
      bg.on('pointerout', function () {
        bg.clear();
        bg.fillStyle(0x080c18, 0.88);
        bg.fillRoundedRect(-cardW / 2, -cardH / 2, cardW, cardH, 6);
        bg.lineStyle(1, 0x2a4050, 0.7);
        bg.strokeRoundedRect(-cardW / 2, -cardH / 2, cardW, cardH, 6);
        titleTxt.setColor('#8090a8');
      });

      var self = this;
      bg.on('pointerdown', function () {
        if (!RunoAudio.isStarted()) RunoAudio.start(config.episode);
        // Fade out and launch scene
        self.cameras.main.fadeOut(500, 0, 0, 0);
        self.cameras.main.once('camerafadeoutcomplete', function () {
          self.scene.start(config.scene);
        });
      });

      // Subtle pulse on the rune icon
      this.tweens.add({
        targets: runeIcon,
        alpha: { from: 0.5, to: 1 },
        duration: 1800,
        ease: 'Sine.easeInOut',
        yoyo: true,
        repeat: -1
      });
    } else {
      // Lock icon
      var lockStyle = {
        fontFamily: 'Georgia, serif',
        fontSize: '22px',
        color: '#1a2a38'
      };
      var lockTxt = this.add.text(0, 38, '⟡', lockStyle);
      lockTxt.setOrigin(0.5, 0.5);
      container.add(lockTxt);
    }

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
