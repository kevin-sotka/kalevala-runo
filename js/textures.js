// textures.js — BootScene: procedurally generates ALL textures via Phaser Graphics/RenderTexture

var BootScene = new Phaser.Class({
  Extends: Phaser.Scene,
  initialize: function BootScene() {
    Phaser.Scene.call(this, { key: 'BootScene' });
  },

  preload: function () {
    // No external files — everything is generated in create()
  },

  create: function () {
    var g = this.make.graphics({ x: 0, y: 0, add: false });

    this._generateSkies(g);
    this._generateTerrain(g);
    this._generateRuneStone(g);
    this._generatePlayer(g);
    this._generateDuck(g);
    this._generateEggFragment(g);
    this._generateSampo(g);
    this._generateParticles(g);
    this._generateMisc(g);
    this._generateKalevala(g);

    g.destroy();

    this.scene.start('TitleScene');
  },

  // ── Sky gradients ─────────────────────────────────────────────────
  _generateSkies: function (g) {
    var W = 960, H = 540;

    // Episode 1 sky: deep indigo to teal night
    var rt1 = this.add.renderTexture(0, 0, W, H);
    g.clear();
    // Draw gradient manually using horizontal strips
    for (var y = 0; y < H; y++) {
      var t = y / H;
      var r = Math.floor(Phaser.Math.Linear(12, 8, t));
      var gv = Math.floor(Phaser.Math.Linear(10, 28, t));
      var b = Math.floor(Phaser.Math.Linear(42, 52, t));
      g.fillStyle(Phaser.Display.Color.GetColor(r, gv, b), 1);
      g.fillRect(0, y, W, 1);
    }
    rt1.draw(g, 0, 0);
    rt1.saveTexture('sky_ep1');
    rt1.destroy();

    // Episode 2 sky: charcoal/iron darkness, forge warmth at horizon
    var rt2 = this.add.renderTexture(0, 0, W, H);
    g.clear();
    for (var y = 0; y < H; y++) {
      var t = y / H;
      var r = Math.floor(Phaser.Math.Linear(8, 22, t));
      var gv = Math.floor(Phaser.Math.Linear(8, 14, t));
      var b = Math.floor(Phaser.Math.Linear(14, 10, t));
      g.fillStyle(Phaser.Display.Color.GetColor(r, gv, b), 1);
      g.fillRect(0, y, W, 1);
    }
    rt2.draw(g, 0, 0);
    rt2.saveTexture('sky_ep2');
    rt2.destroy();

    // Title sky: near-black with subtle blue
    var rt3 = this.add.renderTexture(0, 0, W, H);
    g.clear();
    for (var y = 0; y < H; y++) {
      var t = y / H;
      var r = Math.floor(Phaser.Math.Linear(6, 10, t));
      var gv = Math.floor(Phaser.Math.Linear(7, 12, t));
      var b = Math.floor(Phaser.Math.Linear(20, 18, t));
      g.fillStyle(Phaser.Display.Color.GetColor(r, gv, b), 1);
      g.fillRect(0, y, W, 1);
    }
    rt3.draw(g, 0, 0);
    rt3.saveTexture('sky_title');
    rt3.destroy();

    // Dawn sky (ep2 finale): dark to pale amber gold
    var rt4 = this.add.renderTexture(0, 0, W, H);
    g.clear();
    for (var y = 0; y < H; y++) {
      var t = y / H;
      var r = Math.floor(Phaser.Math.Linear(10, 44, t));
      var gv = Math.floor(Phaser.Math.Linear(10, 28, t));
      var b = Math.floor(Phaser.Math.Linear(18, 12, t));
      g.fillStyle(Phaser.Display.Color.GetColor(r, gv, b), 1);
      g.fillRect(0, y, W, 1);
    }
    rt4.draw(g, 0, 0);
    rt4.saveTexture('sky_dawn');
    rt4.destroy();
  },

  // ── Terrain silhouettes ───────────────────────────────────────────
  _generateTerrain: function (g) {
    var W = 960, H = 120;

    // Ep1 far mountains: smooth indigo hills
    var rt = this.add.renderTexture(0, 0, W, H);
    g.clear();
    g.fillStyle(0x0d1422, 1);
    g.beginPath();
    g.moveTo(0, H);
    var pts = [];
    for (var x = 0; x <= W; x += 40) {
      var h = 30 + Math.sin(x * 0.008) * 20 + Math.sin(x * 0.022) * 12;
      pts.push({ x: x, y: H - h });
    }
    pts.forEach(function (p) { g.lineTo(p.x, p.y); });
    g.lineTo(W, H);
    g.closePath();
    g.fillPath();
    rt.draw(g, 0, 0);
    rt.saveTexture('terrain_far_ep1');
    rt.destroy();

    // Ep1 mid terrain: darker foreground rocks
    var rt2 = this.add.renderTexture(0, 0, W, H);
    g.clear();
    g.fillStyle(0x080e18, 1);
    g.beginPath();
    g.moveTo(0, H);
    for (var x = 0; x <= W; x += 20) {
      var h = 20 + Math.sin(x * 0.015) * 15 + Math.sin(x * 0.04) * 8;
      g.lineTo(x, H - h);
    }
    g.lineTo(W, H);
    g.closePath();
    g.fillPath();
    rt2.draw(g, 0, 0);
    rt2.saveTexture('terrain_mid_ep1');
    rt2.destroy();

    // Ep2 far terrain: industrial silhouette, low jagged
    var rt3 = this.add.renderTexture(0, 0, W, H);
    g.clear();
    g.fillStyle(0x0c0c0f, 1);
    g.beginPath();
    g.moveTo(0, H);
    for (var x = 0; x <= W; x += 30) {
      var h = 25 + Math.sin(x * 0.012) * 18 + Math.sin(x * 0.035) * 10;
      g.lineTo(x, H - h);
    }
    g.lineTo(W, H);
    g.closePath();
    g.fillPath();
    rt3.draw(g, 0, 0);
    rt3.saveTexture('terrain_far_ep2');
    rt3.destroy();

    // Solid ground tile (dark stone)
    var rtGround = this.add.renderTexture(0, 0, 32, 32);
    g.clear();
    g.fillStyle(0x0e1018, 1);
    g.fillRect(0, 0, 32, 32);
    g.fillStyle(0x141820, 1);
    g.fillRect(0, 0, 32, 2);
    rtGround.draw(g, 0, 0);
    rtGround.saveTexture('ground_tile');
    rtGround.destroy();

    // Platform tile
    var rtPlat = this.add.renderTexture(0, 0, 64, 16);
    g.clear();
    g.fillStyle(0x0e1018, 1);
    g.fillRect(0, 0, 64, 16);
    g.fillStyle(0x1a2030, 1);
    g.fillRect(0, 0, 64, 3);
    rtPlat.draw(g, 0, 0);
    rtPlat.saveTexture('platform_tile');
    rtPlat.destroy();
  },

  // ── Rune stone + glyph ────────────────────────────────────────────
  _generateRuneStone: function (g) {
    var S = 48;
    // Unlit rune: dim amber
    var rtUnlit = this.add.renderTexture(0, 0, S, S);
    g.clear();
    // Stone base
    g.fillStyle(0x1a1a22, 1);
    g.fillCircle(S / 2, S / 2, S / 2 - 2);
    // Dim glow ring
    g.lineStyle(2, 0x4a3a18, 0.6);
    g.strokeCircle(S / 2, S / 2, S / 2 - 3);
    // Nordic glyph: Elder Futhark-inspired lines
    g.lineStyle(1.5, 0x5a4a22, 0.7);
    var cx = S / 2, cy = S / 2;
    // Vertical staff
    g.beginPath(); g.moveTo(cx, cy - 12); g.lineTo(cx, cy + 12); g.strokePath();
    // Two diagonal branches left+right at top
    g.beginPath(); g.moveTo(cx, cy - 8); g.lineTo(cx - 8, cy - 2); g.strokePath();
    g.beginPath(); g.moveTo(cx, cy - 8); g.lineTo(cx + 8, cy - 2); g.strokePath();
    // Lower branches
    g.beginPath(); g.moveTo(cx, cy + 4); g.lineTo(cx - 6, cy + 10); g.strokePath();
    g.beginPath(); g.moveTo(cx, cy + 4); g.lineTo(cx + 6, cy + 10); g.strokePath();
    rtUnlit.draw(g, 0, 0);
    rtUnlit.saveTexture('rune_unlit');
    rtUnlit.destroy();

    // Lit rune: bright gold
    var rtLit = this.add.renderTexture(0, 0, S, S);
    g.clear();
    g.fillStyle(0x1a1a22, 1);
    g.fillCircle(S / 2, S / 2, S / 2 - 2);
    // Outer glow
    g.lineStyle(4, 0xc89a28, 0.3);
    g.strokeCircle(S / 2, S / 2, S / 2);
    g.lineStyle(2, 0xe8c040, 0.8);
    g.strokeCircle(S / 2, S / 2, S / 2 - 3);
    // Glyph bright
    g.lineStyle(2, 0xf0d060, 1);
    g.beginPath(); g.moveTo(cx, cy - 12); g.lineTo(cx, cy + 12); g.strokePath();
    g.beginPath(); g.moveTo(cx, cy - 8); g.lineTo(cx - 8, cy - 2); g.strokePath();
    g.beginPath(); g.moveTo(cx, cy - 8); g.lineTo(cx + 8, cy - 2); g.strokePath();
    g.beginPath(); g.moveTo(cx, cy + 4); g.lineTo(cx - 6, cy + 10); g.strokePath();
    g.beginPath(); g.moveTo(cx, cy + 4); g.lineTo(cx + 6, cy + 10); g.strokePath();
    // Inner glow fill
    g.fillStyle(0xe8c040, 0.12);
    g.fillCircle(cx, cy, 16);
    rtLit.draw(g, 0, 0);
    rtLit.saveTexture('rune_lit');
    rtLit.destroy();
  },

  // ── Stick figure player frames ────────────────────────────────────
  _generatePlayer: function (g) {
    var W = 24, H = 40;
    var frames = ['stand', 'walk1', 'walk2', 'jump'];

    function drawFigure(g, frame) {
      var cx = W / 2;
      var headY = 5, bodyTop = 12, bodyBot = 26, legBot = 38;
      var col = 0xd8dce0;
      g.lineStyle(2, col, 1);
      g.fillStyle(col, 1);

      // Head
      g.strokeCircle(cx, headY, 5);

      // Body
      g.beginPath(); g.moveTo(cx, bodyTop); g.lineTo(cx, bodyBot); g.strokePath();

      if (frame === 'stand') {
        // Arms spread slightly
        g.beginPath(); g.moveTo(cx, 16); g.lineTo(cx - 7, 21); g.strokePath();
        g.beginPath(); g.moveTo(cx, 16); g.lineTo(cx + 7, 21); g.strokePath();
        // Legs
        g.beginPath(); g.moveTo(cx, bodyBot); g.lineTo(cx - 5, legBot); g.strokePath();
        g.beginPath(); g.moveTo(cx, bodyBot); g.lineTo(cx + 5, legBot); g.strokePath();
      } else if (frame === 'walk1') {
        // Stride 1: left leg forward, right back
        g.beginPath(); g.moveTo(cx, 16); g.lineTo(cx - 8, 20); g.strokePath();
        g.beginPath(); g.moveTo(cx, 16); g.lineTo(cx + 6, 22); g.strokePath();
        g.beginPath(); g.moveTo(cx, bodyBot); g.lineTo(cx + 7, legBot); g.strokePath();
        g.beginPath(); g.moveTo(cx, bodyBot); g.lineTo(cx - 6, legBot - 2); g.strokePath();
      } else if (frame === 'walk2') {
        // Stride 2: right leg forward, left back
        g.beginPath(); g.moveTo(cx, 16); g.lineTo(cx + 8, 20); g.strokePath();
        g.beginPath(); g.moveTo(cx, 16); g.lineTo(cx - 6, 22); g.strokePath();
        g.beginPath(); g.moveTo(cx, bodyBot); g.lineTo(cx - 7, legBot); g.strokePath();
        g.beginPath(); g.moveTo(cx, bodyBot); g.lineTo(cx + 6, legBot - 2); g.strokePath();
      } else if (frame === 'jump') {
        // Arms up
        g.beginPath(); g.moveTo(cx, 16); g.lineTo(cx - 9, 12); g.strokePath();
        g.beginPath(); g.moveTo(cx, 16); g.lineTo(cx + 9, 12); g.strokePath();
        // Legs bent
        g.beginPath(); g.moveTo(cx, bodyBot); g.lineTo(cx - 8, 33); g.strokePath();
        g.beginPath(); g.moveTo(cx - 8, 33); g.lineTo(cx - 4, 38); g.strokePath();
        g.beginPath(); g.moveTo(cx, bodyBot); g.lineTo(cx + 8, 33); g.strokePath();
        g.beginPath(); g.moveTo(cx + 8, 33); g.lineTo(cx + 4, 38); g.strokePath();
      }
    }

    frames.forEach(function (frame) {
      var rt = this.add.renderTexture(0, 0, W, H);
      g.clear();
      drawFigure(g, frame);
      rt.draw(g, 0, 0);
      rt.saveTexture('player_' + frame);
      rt.destroy();
    }, this);
  },

  // ── Duck (goldeneye) ──────────────────────────────────────────────
  _generateDuck: function (g) {
    var W = 36, H = 24;
    var rt = this.add.renderTexture(0, 0, W, H);
    g.clear();
    var col = 0x1a1c20;
    g.fillStyle(col, 1);
    // Body oval
    g.fillEllipse(18, 14, 28, 16);
    // Head
    g.fillCircle(28, 8, 8);
    // White cheek patch (goldeneye characteristic)
    g.fillStyle(0xc8d0cc, 0.8);
    g.fillCircle(31, 9, 3);
    // Beak
    g.fillStyle(0x8a7040, 1);
    g.fillRect(34, 8, 5, 3);
    // Wing highlight
    g.fillStyle(0x22262c, 0.7);
    g.fillEllipse(15, 14, 18, 8);
    rt.draw(g, 0, 0);
    rt.saveTexture('duck');
    rt.destroy();
  },

  // ── Egg fragment ──────────────────────────────────────────────────
  _generateEggFragment: function (g) {
    var rt = this.add.renderTexture(0, 0, 16, 12);
    g.clear();
    g.fillStyle(0xd4c8a0, 1);
    g.fillTriangle(0, 12, 8, 0, 16, 12);
    g.lineStyle(1, 0xe8d8b0, 0.8);
    g.beginPath(); g.moveTo(8, 2); g.lineTo(4, 10); g.strokePath();
    rt.draw(g, 0, 0);
    rt.saveTexture('egg_fragment');
    rt.destroy();
  },

  // ── Sampo mill ────────────────────────────────────────────────────
  _generateSampo: function (g) {
    var S = 80;
    var rt = this.add.renderTexture(0, 0, S, S);
    g.clear();
    var cx = S / 2, cy = S / 2;
    // Outer ring
    g.lineStyle(4, 0x5a4010, 1);
    g.strokeCircle(cx, cy, 36);
    // Inner mechanism
    g.fillStyle(0x2a1a08, 1);
    g.fillCircle(cx, cy, 28);
    // Spokes (8)
    g.lineStyle(3, 0x6a5020, 1);
    for (var i = 0; i < 8; i++) {
      var angle = (i / 8) * Math.PI * 2;
      g.beginPath();
      g.moveTo(cx + Math.cos(angle) * 8, cy + Math.sin(angle) * 8);
      g.lineTo(cx + Math.cos(angle) * 28, cy + Math.sin(angle) * 28);
      g.strokePath();
    }
    // Hub
    g.fillStyle(0x8a6828, 1);
    g.fillCircle(cx, cy, 8);
    // Nordic rune marks on face
    g.lineStyle(1.5, 0xc8a040, 0.7);
    g.strokeCircle(cx, cy, 20);
    // Gold grain/salt/coin symbols — dots at cardinals
    [0, 1, 2, 3].forEach(function (i) {
      var a = (i / 4) * Math.PI * 2 - Math.PI / 4;
      g.fillStyle(0xd4aa44, 0.8);
      g.fillCircle(cx + Math.cos(a) * 20, cy + Math.sin(a) * 20, 3);
    });
    rt.draw(g, 0, 0);
    rt.saveTexture('sampo');
    rt.destroy();
  },

  // ── Particles ─────────────────────────────────────────────────────
  _generateParticles: function (g) {
    // Gold mote
    var rt1 = this.add.renderTexture(0, 0, 8, 8);
    g.clear();
    g.fillStyle(0xd4aa44, 1);
    g.fillCircle(4, 4, 3);
    rt1.draw(g, 0, 0);
    rt1.saveTexture('particle_gold');
    rt1.destroy();

    // Dust mote (footfall)
    var rt2 = this.add.renderTexture(0, 0, 6, 6);
    g.clear();
    g.fillStyle(0x2a3040, 1);
    g.fillCircle(3, 3, 2);
    rt2.draw(g, 0, 0);
    rt2.saveTexture('particle_dust');
    rt2.destroy();

    // Wind particle (thin horizontal streak)
    var rt3 = this.add.renderTexture(0, 0, 12, 3);
    g.clear();
    g.fillStyle(0x304060, 0.8);
    g.fillRect(0, 1, 12, 1);
    rt3.draw(g, 0, 0);
    rt3.saveTexture('particle_wind');
    rt3.destroy();

    // Forge spark
    var rt4 = this.add.renderTexture(0, 0, 6, 6);
    g.clear();
    g.fillStyle(0xff8820, 1);
    g.fillCircle(3, 3, 2);
    rt4.draw(g, 0, 0);
    rt4.saveTexture('particle_spark');
    rt4.destroy();

    // Star/aurora mote for title
    var rt5 = this.add.renderTexture(0, 0, 4, 4);
    g.clear();
    g.fillStyle(0x8090c0, 0.9);
    g.fillCircle(2, 2, 1.5);
    rt5.draw(g, 0, 0);
    rt5.saveTexture('particle_star');
    rt5.destroy();

    // Water caustic highlight
    var rt6 = this.add.renderTexture(0, 0, 40, 3);
    g.clear();
    g.fillStyle(0x2a4060, 0.5);
    g.fillRect(0, 1, 40, 1);
    rt6.draw(g, 0, 0);
    rt6.saveTexture('water_caustic');
    rt6.destroy();
  },

  // ── Misc UI elements ──────────────────────────────────────────────
  _generateMisc: function (g) {
    // Jump button circle
    var S = 64;
    var rt1 = this.add.renderTexture(0, 0, S, S);
    g.clear();
    g.lineStyle(2, 0x607080, 0.5);
    g.strokeCircle(S / 2, S / 2, S / 2 - 2);
    g.fillStyle(0x304050, 0.25);
    g.fillCircle(S / 2, S / 2, S / 2 - 2);
    // Arrow up symbol
    g.lineStyle(2, 0x8090a0, 0.7);
    g.beginPath();
    g.moveTo(S / 2, 12);
    g.lineTo(S / 2 - 10, 28);
    g.lineTo(S / 2 + 10, 28);
    g.closePath();
    g.strokePath();
    g.fillStyle(0x8090a0, 0.5);
    g.fillTriangle(S / 2, 12, S / 2 - 10, 28, S / 2 + 10, 28);
    rt1.draw(g, 0, 0);
    rt1.saveTexture('jump_btn');
    rt1.destroy();

    // Mute icon (speaker symbol)
    var rt2 = this.add.renderTexture(0, 0, 32, 32);
    g.clear();
    g.lineStyle(2, 0x607080, 0.6);
    g.fillStyle(0x607080, 0.6);
    // Speaker cone
    g.fillRect(6, 11, 8, 10);
    g.fillTriangle(14, 8, 14, 24, 22, 18);
    // Sound waves
    g.strokeCircle(22, 16, 5);
    g.strokeCircle(22, 16, 9);
    rt2.draw(g, 0, 0);
    rt2.saveTexture('mute_off');
    rt2.destroy();

    var rt3 = this.add.renderTexture(0, 0, 32, 32);
    g.clear();
    g.lineStyle(2, 0x607080, 0.4);
    g.fillStyle(0x607080, 0.4);
    g.fillRect(6, 11, 8, 10);
    g.fillTriangle(14, 8, 14, 24, 22, 18);
    // X cross
    g.lineStyle(2, 0x907070, 0.7);
    g.beginPath(); g.moveTo(24, 8); g.lineTo(32, 16); g.strokePath();
    g.beginPath(); g.moveTo(32, 8); g.lineTo(24, 16); g.strokePath();
    rt3.draw(g, 0, 0);
    rt3.saveTexture('mute_on');
    rt3.destroy();

    // Pixel (1x1 white for tinting)
    var rtPx = this.add.renderTexture(0, 0, 2, 2);
    g.clear();
    g.fillStyle(0xffffff, 1);
    g.fillRect(0, 0, 2, 2);
    rtPx.draw(g, 0, 0);
    rtPx.saveTexture('pixel');
    rtPx.destroy();

    // Moon (ep1)
    var rtMoon = this.add.renderTexture(0, 0, 40, 40);
    g.clear();
    g.fillStyle(0xb8c8d0, 0.85);
    g.fillCircle(20, 20, 18);
    // Subtle craters
    g.fillStyle(0x90a0a8, 0.3);
    g.fillCircle(14, 16, 6);
    g.fillCircle(24, 25, 4);
    g.fillCircle(20, 14, 3);
    rtMoon.draw(g, 0, 0);
    rtMoon.saveTexture('moon');
    rtMoon.destroy();

    // Forge glow blob
    var rtForge = this.add.renderTexture(0, 0, 120, 120);
    g.clear();
    // Radial orange glow (drawn as concentric circles)
    var cols = [0xff8820, 0xc06010, 0x803000, 0x401800, 0x200800];
    var alphas = [0.5, 0.3, 0.2, 0.1, 0.05];
    cols.forEach(function (c, i) {
      g.fillStyle(c, alphas[i]);
      g.fillCircle(60, 60, 60 - i * 10);
    });
    rtForge.draw(g, 0, 0);
    rtForge.saveTexture('forge_glow');
    rtForge.destroy();

    // Episode card backgrounds
    var rtCard = this.add.renderTexture(0, 0, 280, 180);
    g.clear();
    g.fillStyle(0x0a0e18, 0.9);
    g.fillRoundedRect(0, 0, 280, 180, 8);
    g.lineStyle(1, 0x2a3040, 0.8);
    g.strokeRoundedRect(0, 0, 280, 180, 8);
    rtCard.draw(g, 0, 0);
    rtCard.saveTexture('ep_card');
    rtCard.destroy();

    // Anvil silhouette
    var rtAnvil = this.add.renderTexture(0, 0, 60, 40);
    g.clear();
    g.fillStyle(0x181820, 1);
    // Base
    g.fillRect(10, 28, 40, 12);
    // Waist
    g.fillRect(16, 20, 28, 10);
    // Top face
    g.fillRect(8, 14, 44, 8);
    // Horn
    g.fillTriangle(50, 14, 60, 18, 52, 22);
    rtAnvil.draw(g, 0, 0);
    rtAnvil.saveTexture('anvil');
    rtAnvil.destroy();
  },

  // ── Textures for Runos III–V: snow, embers, ash, pearls, song glyphs ─
  _generateKalevala: function (g) {
    var self = this;
    function save(key, w, h, draw) {
      var rt = self.add.renderTexture(0, 0, w, h);
      g.clear();
      draw();
      rt.draw(g, 0, 0);
      rt.saveTexture(key);
      rt.destroy();
    }

    save('particle_snow', 6, 6, function () {
      g.fillStyle(0xdde6f0, 0.35); g.fillCircle(3, 3, 3);
      g.fillStyle(0xf4f8ff, 0.9); g.fillCircle(3, 3, 1.5);
    });
    save('particle_ember', 6, 6, function () {
      g.fillStyle(0xff5a1a, 0.4); g.fillCircle(3, 3, 3);
      g.fillStyle(0xffb040, 1); g.fillCircle(3, 3, 1.5);
    });
    save('particle_ash', 5, 5, function () {
      g.fillStyle(0x6a6a70, 0.8); g.fillCircle(2.5, 2.5, 2);
    });
    save('particle_pearl', 10, 10, function () {
      g.fillStyle(0x6090c0, 0.35); g.fillCircle(5, 5, 5);
      g.fillStyle(0xa8d0f0, 1); g.fillCircle(5, 5, 3);
      g.fillStyle(0xffffff, 0.9); g.fillCircle(4, 4, 1);
    });

    // Four song glyphs for the singing contest. Each is a rune stone with a
    // different carved sign: the four winds / four arrow keys.
    var glyphs = [
      // 0 ← : "Tuuli" — branch to the left
      function (cx, cy) {
        g.beginPath(); g.moveTo(cx + 6, cy - 14); g.lineTo(cx + 6, cy + 14); g.strokePath();
        g.beginPath(); g.moveTo(cx + 6, cy - 6); g.lineTo(cx - 10, cy); g.lineTo(cx + 6, cy + 6); g.strokePath();
      },
      // 1 ↑ : "Taivas" — the sky arrow (Tiwaz-like)
      function (cx, cy) {
        g.beginPath(); g.moveTo(cx, cy - 14); g.lineTo(cx, cy + 14); g.strokePath();
        g.beginPath(); g.moveTo(cx - 10, cy - 3); g.lineTo(cx, cy - 14); g.lineTo(cx + 10, cy - 3); g.strokePath();
      },
      // 2 → : "Vesi" — branch to the right
      function (cx, cy) {
        g.beginPath(); g.moveTo(cx - 6, cy - 14); g.lineTo(cx - 6, cy + 14); g.strokePath();
        g.beginPath(); g.moveTo(cx - 6, cy - 6); g.lineTo(cx + 10, cy); g.lineTo(cx - 6, cy + 6); g.strokePath();
      },
      // 3 ↓ : "Maa" — the earth root (Algiz reversed)
      function (cx, cy) {
        g.beginPath(); g.moveTo(cx, cy - 14); g.lineTo(cx, cy + 14); g.strokePath();
        g.beginPath(); g.moveTo(cx - 10, cy + 3); g.lineTo(cx, cy + 14); g.lineTo(cx + 10, cy + 3); g.strokePath();
      }
    ];
    glyphs.forEach(function (draw, i) {
      [['dim', 0x1a1a22, 0x4a3a18, 0x6a5a30], ['lit', 0x221c10, 0xe8c040, 0xfff0a0]].forEach(function (v) {
        save('glyph_' + i + '_' + v[0], 56, 56, function () {
          g.fillStyle(v[1], 1); g.fillCircle(28, 28, 26);
          g.lineStyle(2, v[2], 0.9); g.strokeCircle(28, 28, 25);
          g.lineStyle(3, v[3], 1);
          draw(28, 28);
        });
      });
    });
  }
});
