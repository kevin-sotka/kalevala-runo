// kit.js — Shared building blocks for episodes: terrain, parallax, per-frame
// update, effects, end cards, and a library of Finnish-forest silhouettes.

var EpisodeKit = {
  // World x for a parallax layer (scroll factor sf) so that a feature drawn
  // there lines up with world x X when X is at the centre of the screen.
  px: function (X, sf, W) {
    return X * sf + (W / 2) * (1 - sf);
  },

  // Common scene setup. Call first in create().
  begin: function (scene, opts) {
    var W = scene.scale.width;
    var H = scene.scale.height;
    scene.WORLD_W = opts.worldW;
    scene.WORLD_H = H;
    scene._playerFrozen = false;
    scene._finaleTriggered = false;
    scene._runeHint = null;
    scene.physics.world.setBounds(0, 0, opts.worldW, H + 200);
    scene.cameras.main.setBounds(0, 0, opts.worldW, H);
    scene.cameras.main.setBackgroundColor(opts.bg || 0x080e1a);
    if (opts.sky) {
      var sky = scene.add.image(W / 2, H / 2, opts.sky);
      sky.setDisplaySize(W, H);
      sky.setScrollFactor(0);
      sky.setDepth(0);
      scene._sky = sky;
    }
    scene._groundGroup = scene.physics.add.staticGroup();
  },

  // Player, collisions, runes, camera, UI, audio, fade-in, opening verse.
  // Call after the world geometry exists.
  finish: function (scene, opts) {
    var player = PlayerController.init(scene, opts.playerX, opts.playerY);
    PlayerController.setCheckpoint(opts.playerX, opts.playerY);
    scene._player = player;
    scene.physics.add.collider(player, scene._groundGroup);
    RespawnSystem.init(scene);

    scene._runes = (opts.runes || []).map(function (v) {
      return RuneManager.createRune(scene, v.x, v.y, v);
    });

    EpisodeKit.bakeLayers(scene);

    scene.cameras.main.startFollow(player, true, 0.08, 0.08);
    scene.cameras.main.setFollowOffset(-80, 0);

    MuteButton.create(scene);
    RunoAudio.start(opts.episode);
    scene.cameras.main.fadeIn(900, 0, 0, 0);

    if (opts.opening) {
      scene.time.delayedCall(700, function () {
        StoryPanel.show(scene, opts.opening, null);
      });
    }
  },

  // Per-frame: freeze while reading, move the player, respawn on falls, runes.
  update: function (scene, delta) {
    PlayerController.setFrozen(scene._playerFrozen || scene._holdPlayer ||
      StoryPanel.isActive() || RespawnSystem.isBusy());
    PlayerController.update(delta);
    var player = scene._player;
    if (player.y > scene.WORLD_H + 80) {
      RespawnSystem.respawn(player, PlayerController.lastCheckpointX, PlayerController.lastCheckpointY);
    }
    RuneManager.updateAll(scene, scene._runes, player, delta);
    EpisodeKit.breathe(scene);
  },

  // Solid ground: [x, topY, width]. The body reaches to the bottom of the
  // world so steps are real walls, not 4px ledges you snag on.
  ground: function (scene, segments, style) {
    var H = scene.scale.height;
    var g = scene.add.graphics();
    g.setDepth(style.depth || 7);
    segments.forEach(function (d) {
      var x = d[0], y = d[1], w = d[2];
      g.fillStyle(style.fill, 1);
      g.fillRect(x, y, w, H - y + 10);
      g.fillStyle(style.edge, 1);
      g.fillRect(x, y, w, 3);
      if (style.snow) {
        g.fillStyle(style.snow, 0.9);
        g.fillRect(x, y - 2, w, 5);
        for (var sx = x + 6; sx < x + w - 6; sx += 18) {
          g.fillEllipse(sx, y + 1, 16, 5);
        }
      }
      EpisodeKit.addBody(scene, x, y, w, H - y + 40, false);
    });
    return g;
  },

  // One-way ledges: [x, topY, width]. Jump up through them, land on top.
  ledges: function (scene, list, style) {
    var g = scene.add.graphics();
    g.setDepth(style.depth || 7);
    list.forEach(function (d) {
      var x = d[0], y = d[1], w = d[2];
      g.fillStyle(style.fill, style.alpha || 1);
      g.fillRect(x, y, w, style.thick || 12);
      g.fillStyle(style.edge, 1);
      g.fillRect(x, y, w, 3);
      if (style.snow) {
        g.fillStyle(style.snow, 0.9);
        g.fillRect(x, y - 2, w, 4);
      }
      EpisodeKit.addBody(scene, x, y, w, 10, true);
    });
    return g;
  },

  addBody: function (scene, x, y, w, h, oneWay) {
    var body = scene.physics.add.staticImage(x + w / 2, y + h / 2, 'pixel');
    body.setDisplaySize(w, h);
    body.setAlpha(0);
    body.refreshBody();
    if (oneWay) {
      body.body.checkCollision.down = false;
      body.body.checkCollision.left = false;
      body.body.checkCollision.right = false;
    }
    scene._groundGroup.add(body);
    return body;
  },

  // Rolling silhouette band for parallax. fn(x) → height above bottom.
  ridge: function (scene, sf, depth, color, fn, alpha) {
    var W = scene.scale.width, H = scene.scale.height;
    var g = scene.add.graphics();
    g.setScrollFactor(sf);
    g.setDepth(depth);
    g.fillStyle(color, alpha === undefined ? 1 : alpha);
    var span = (scene.WORLD_W - W) * sf + W + 40;
    var maxH = 0;
    g.beginPath();
    g.moveTo(-20, H);
    for (var x = -20; x <= span; x += 12) {
      var h = fn(x);
      if (h > maxH) maxH = h;
      g.lineTo(x, H - h);
    }
    g.lineTo(span, H);
    g.closePath();
    g.fillPath();
    EpisodeKit.layer(scene, g, { top: H - maxH - 4, left: -20, right: span });
    return g;
  },

  // Line of trees across a parallax layer. kind: 'spruce' | 'birch' | 'pine'
  forest: function (scene, sf, depth, color, baseFn, opts) {
    var W = scene.scale.width;
    var g = scene.add.graphics();
    g.setScrollFactor(sf);
    g.setDepth(depth);
    var span = (scene.WORLD_W - W) * sf + W + 40;
    var gap = opts.gap || 40;
    var from = opts.from || -10, to = opts.to || span;
    var top = scene.scale.height;
    for (var x = from; x < to; x += gap * (0.6 + Math.random() * 0.8)) {
      var h = opts.minH + Math.random() * (opts.maxH - opts.minH);
      var kind = opts.kinds ? opts.kinds[Math.floor(Math.random() * opts.kinds.length)] : 'spruce';
      var base = baseFn(x);
      Silhouettes[kind](g, x, base, h, color, opts);
      top = Math.min(top, base - h * 1.12);
    }
    EpisodeKit.layer(scene, g, { top: top - 4, left: from - opts.maxH, right: to + 60 });
    return g;
  },

  // ── Static layers: baked to textures, then left to breathe ──────────
  // A Graphics object is redrawn (and its shapes re-triangulated) every
  // frame. Parallax layers never change, so once the scene is built they are
  // painted into textures, cropped to what they contain and cut into tiles
  // no wider than 2048 px, which is safe for low-end phones.
  // bounds: { top, left, right } in the layer's own coordinates.
  layer: function (scene, g, bounds) {
    (scene._layers = scene._layers || []).push({ g: g, b: bounds || {} });
    return g;
  },

  bakeLayers: function (scene) {
    var W = scene.scale.width, H = scene.scale.height;
    var list = scene._layers || [];
    scene._layers = [];
    scene._breathing = [];
    var groups = [], byKey = {};
    list.forEach(function (it) {
      var key = it.g.scrollFactorX + '|' + it.g.depth;
      if (!byKey[key]) { byKey[key] = { sf: it.g.scrollFactorX, depth: it.g.depth, items: [] }; groups.push(byKey[key]); }
      byKey[key].items.push(it);
    });
    groups.forEach(function (grp) {
      var span = (scene.WORLD_W - W) * grp.sf + W + 40;
      var top = H, left = Infinity, right = -Infinity;
      grp.items.forEach(function (it) {
        top = Math.min(top, it.b.top === undefined ? 0 : it.b.top);
        left = Math.min(left, it.b.left === undefined ? -40 : it.b.left);
        right = Math.max(right, it.b.right === undefined ? span : it.b.right);
      });
      // Nothing past the layer's farthest visible point is ever seen
      top = Math.max(0, Math.floor(top));
      left = Math.max(-60, Math.floor(left) - 4);
      right = Math.min(span + 60, Math.ceil(right) + 4);
      var h = H - top;
      if (h <= 0 || right <= left) return;
      var anchor = grp.items[0].g;
      var tiles = [];
      for (var x0 = left; x0 < right; x0 += 2048) {
        var w = Math.ceil(Math.min(2048, right - x0));
        var rt = scene.add.renderTexture(x0, top, w, h);
        rt.setOrigin(0, 0);
        grp.items.forEach(function (it) { rt.draw(it.g, -x0, -top); });
        rt.setScrollFactor(grp.sf);
        rt.setDepth(grp.depth);
        try { scene.children.moveAbove(rt, anchor); } catch (e) {}
        tiles.push(rt);
      }
      grp.items.forEach(function (it) { it.g.destroy(); });
      // Far layers sway a little, so the world breathes while you stand still
      var amp = grp.sf <= 0 ? 0 : grp.sf <= 0.1 ? 2.4 : grp.sf <= 0.3 ? 1.6 : grp.sf <= 0.5 ? 0.9 : 0;
      if (amp > 0) {
        scene._breathing.push({ tiles: tiles, base: tiles.map(function (t) { return t.x; }),
          amp: amp, speed: 0.00025 + Math.random() * 0.0002, phase: Math.random() * 6.28 });
      }
    });
  },

  breathe: function (scene) {
    var t = scene.time.now;
    (scene._breathing || []).forEach(function (b) {
      var dx = Math.sin(t * b.speed + b.phase) * b.amp;
      b.tiles.forEach(function (tile, i) { tile.x = b.base[i] + dx; });
    });
  },

  // Aurora borealis — revontulet, "the fox's fires"
  aurora: function (scene, depth, colors) {
    var W = scene.scale.width;
    var g = scene.add.graphics();
    g.setScrollFactor(0);
    g.setDepth(depth);
    var state = { t: 0 };
    var frame = 0;
    var draw = function (time, delta) {
      state.t += delta * 0.00025;
      // The aurora drifts slowly; redrawing every third frame is plenty.
      if ((frame++ % 3) !== 0) return;
      g.clear();
      colors.forEach(function (c, band) {
        for (var x = 0; x < W; x += 8) {
          var wave = Math.sin(x * 0.006 + state.t * (1 + band * 0.3) + band) * 26 +
            Math.sin(x * 0.017 - state.t * 1.7) * 10;
          var top = 40 + band * 26 + wave;
          var h = 60 + Math.sin(x * 0.01 + state.t * 2 + band) * 30;
          var a = 0.05 + 0.05 * Math.sin(x * 0.008 + state.t * 3 + band * 2);
          g.fillStyle(c, Math.max(0.01, a));
          g.fillRect(x, top, 8, h);
        }
      });
    };
    scene.events.on('update', draw);
    scene.events.once('shutdown', function () { scene.events.off('update', draw); });
    return g;
  },

  // Screen-anchored drifting particles (snow, ash, embers).
  weather: function (scene, key, opts) {
    var W = scene.scale.width, H = scene.scale.height;
    try {
      var em = scene.add.particles(0, 0, key, {
        x: { min: -40, max: W + 40 },
        y: opts.fromBottom ? { min: H, max: H + 10 } : { min: -20, max: -10 },
        speedX: opts.speedX || { min: -20, max: 10 },
        speedY: opts.speedY || { min: 20, max: 50 },
        scale: opts.scale || { min: 0.3, max: 0.75 },
        alpha: opts.alpha || { start: 0.8, end: 0.2 },
        lifespan: opts.lifespan || 12000,
        frequency: opts.frequency || 90,
        quantity: 1
      });
      em.setScrollFactor(0);
      em.setDepth(opts.depth || 40);
      return em;
    } catch (e) { return null; }
  },

  burst: function (scene, x, y, key, n, opts) {
    opts = opts || {};
    try {
      var em = scene.add.particles(x, y, key, {
        speed: opts.speed || { min: 40, max: 160 },
        angle: opts.angle || { min: 0, max: 360 },
        scale: opts.scale || { start: 1.2, end: 0 },
        alpha: { start: 1, end: 0 },
        gravityY: opts.gravityY || 0,
        lifespan: opts.lifespan || { min: 700, max: 1600 },
        frequency: -1
      });
      em.setDepth(opts.depth || 20);
      em.explode(n, 0, 0);
      scene.time.delayedCall(3200, function () { em.destroy(); });
      return em;
    } catch (e) { return null; }
  },

  flash: function (scene, color, alpha, duration) {
    var W = scene.scale.width, H = scene.scale.height;
    var f = scene.add.graphics();
    f.setScrollFactor(0);
    f.setDepth(199);
    f.fillStyle(color, alpha);
    f.fillRect(0, 0, W, H);
    scene.tweens.add({
      targets: f, alpha: 0, duration: duration || 1200, ease: 'Sine.easeOut',
      onComplete: function () { f.destroy(); }
    });
  },

  // Screen-space tint that can be faded in and out (e.g. Kullervo's rage)
  tint: function (scene, color, depth) {
    var W = scene.scale.width, H = scene.scale.height;
    var t = scene.add.graphics();
    t.setScrollFactor(0);
    t.setDepth(depth || 90);
    t.fillStyle(color, 1);
    t.fillRect(0, 0, W, H);
    t.setAlpha(0);
    return t;
  },

  // Floating prompt text anchored to the screen
  prompt: function (scene, pair, y, color) {
    var W = scene.scale.width;
    var t = scene.add.text(W / 2, y, RunoLang.pick(pair), {
      fontFamily: RunoFonts.plain,
      fontSize: '14px',
      color: color || '#b09860',
      letterSpacing: 2,
      align: 'center',
      backgroundColor: 'rgba(5,8,16,0.55)',
      padding: { x: 10, y: 5 }
    });
    t.setOrigin(0.5, 0.5);
    t.setScrollFactor(0);
    t.setDepth(102);
    t.setAlpha(0);
    return t;
  },

  // Episode finale: hold the shot, fade, show the end card, save progress.
  finale: function (scene, card) {
    if (scene._finaleTriggered) return;
    scene._finaleTriggered = true;
    scene._playerFrozen = true;
    RunoSave.complete(card.episode);
    scene.time.delayedCall(card.hold || 2000, function () {
      scene.cameras.main.fadeOut(1500, 0, 0, 0);
      scene.cameras.main.once('camerafadeoutcomplete', function () {
        EpisodeKit.endCard(scene, card);
      });
    });
  },

  // card: { episode, numeral, title: {fi,en}, lines: [{fi,en}...], motes, color }
  endCard: function (scene, card) {
    var W = scene.scale.width, H = scene.scale.height;
    scene.cameras.main.resetFX();

    var overlay = scene.add.graphics();
    overlay.setScrollFactor(0);
    overlay.setDepth(250);
    overlay.fillStyle(0x000000, 1);
    overlay.fillRect(0, 0, W, H);

    try {
      var em = scene.add.particles(0, 0, card.motes || 'particle_gold', {
        x: { min: 0, max: W },
        y: { min: H * 0.3, max: H },
        speedX: { min: -10, max: 10 },
        speedY: card.motesFall ? { min: 8, max: 26 } : { min: -30, max: -6 },
        scale: { start: 1, end: 0 },
        alpha: { start: 0.55, end: 0 },
        lifespan: { min: 3000, max: 7000 },
        frequency: 170,
        quantity: 1
      });
      em.setScrollFactor(0);
      em.setDepth(255);
    } catch (e) {}

    var texts = [];
    var add = function (y, str, style, delay) {
      var t = scene.add.text(W / 2, y, str, Object.assign({
        align: 'center', wordWrap: { width: W - 80 }
      }, style));
      t.setOrigin(0.5, 0.5).setScrollFactor(0).setDepth(260).setAlpha(0);
      scene.tweens.add({ targets: t, alpha: 1, duration: 1400, delay: delay, ease: 'Sine.easeIn' });
      texts.push(t);
      return t;
    };

    add(H / 2 - 100, card.numeral + '. ' + card.title.fi, {
      fontFamily: RunoFonts.verse, fontSize: '30px', color: card.color || '#a89060', letterSpacing: 6
    }, 400);
    add(H / 2 - 64, card.title.en, {
      fontFamily: RunoFonts.verse, fontSize: '16px', color: '#5a6a7a', letterSpacing: 4
    }, 900);
    (card.lines || []).forEach(function (pair, i) {
      add(H / 2 - 10 + i * 30, RunoLang.pick(pair), {
        fontFamily: RunoFonts.verse, fontStyle: 'italic', fontSize: '16px', color: '#7a8a8a', letterSpacing: 1
      }, 1800 + i * 700);
    });
    var promptDelay = 2600 + (card.lines || []).length * 700;
    add(H - 50, 'napauta · tap to return', {
      fontFamily: RunoFonts.plain, fontSize: '13px', color: '#3a4a5a', letterSpacing: 3
    }, promptDelay);

    scene.time.delayedCall(promptDelay, function () {
      var go = function () {
        scene.cameras.main.fadeOut(600, 0, 0, 0);
        scene.cameras.main.once('camerafadeoutcomplete', function () {
          scene.scene.start('TitleScene');
        });
      };
      scene.input.once('pointerdown', go);
      scene.input.keyboard.once('keydown', go);
    });
  }
};

// ── Silhouettes ───────────────────────────────────────────────────────────────
// Each draws into a Graphics `g` with feet/base at (x, y). `s` scales,
// `flip` mirrors (face left). Trees take a height instead of a scale.

var Silhouettes = {
  _poly: function (g, pts, x, y, s, flip) {
    var out = pts.map(function (p) {
      return { x: x + (flip ? -p[0] : p[0]) * s, y: y + p[1] * s };
    });
    g.fillPoints(out, true);
  },

  // Kuusi — the Finnish spruce, tall and narrow with drooping tiers
  spruce: function (g, x, y, h, color) {
    g.fillStyle(color, 1);
    var tiers = 6;
    var w = h * 0.32;
    for (var i = 0; i < tiers; i++) {
      var t = i / tiers;
      var ty = y - h * 0.08 - t * h * 0.86;
      var tw = w * (1 - t * 0.85);
      g.fillTriangle(x - tw / 2, ty, x + tw / 2, ty, x, ty - h * 0.26);
    }
    g.fillRect(x - 2, y - h * 0.1, 4, h * 0.1);
  },

  // Koivu — birch: pale trunk with black marks, thin crown
  birch: function (g, x, y, h, color, opts) {
    var bark = (opts && opts.bark) || 0xc8ccd0;
    g.fillStyle(color, 0.9);
    // Ragged, drooping crown built from small leaf-clumps
    for (var k = 0; k < 9; k++) {
      var a = k / 9 * Math.PI * 2;
      var cx = x + Math.cos(a) * h * 0.13 + ((k * 37) % 7 - 3);
      var cy = y - h * 0.78 + Math.sin(a) * h * 0.16 + k % 3 * 3;
      g.fillEllipse(cx, cy, h * 0.14, h * 0.2);
    }
    g.fillStyle(bark, (opts && opts.barkAlpha) || 0.5);
    g.fillRect(x - 2.5, y - h * 0.85, 5, h * 0.85);
    g.fillStyle(0x101014, 0.8);
    for (var m = y - 8; m > y - h * 0.8; m -= 9 + (m % 7)) {
      g.fillRect(x - 2.5, m, 3 + (m % 3), 2);
    }
  },

  // Mänty — Scots pine: tall bare trunk, a ragged crown of clumps at the top
  pine: function (g, x, y, h, color) {
    g.fillStyle(color, 1);
    g.fillTriangle(x - 3, y, x + 3, y, x, y - h * 0.95);
    var clumps = [[0, -0.9, 0.2], [-0.09, -0.82, 0.16], [0.1, -0.8, 0.15], [-0.05, -0.72, 0.13],
      [0.07, -0.66, 0.11], [0.02, -0.97, 0.12]];
    clumps.forEach(function (c, i) {
      var w = h * c[2] * (1 + (i % 2) * 0.3);
      g.fillEllipse(x + c[0] * h, y + c[1] * h, w, w * 0.62);
    });
    // One crooked side branch
    g.fillTriangle(x, y - h * 0.62, x, y - h * 0.58, x + h * 0.12, y - h * 0.66);
  },

  figure: function (g, x, y, s, color, opts) {
    opts = opts || {};
    g.lineStyle(2 * s, color, 1);
    g.strokeCircle(x, y - 35 * s, 5 * s);
    g.lineBetween(x, y - 28 * s, x, y - 14 * s);
    g.lineBetween(x, y - 14 * s, x - 5 * s, y);
    g.lineBetween(x, y - 14 * s, x + 5 * s, y);
    g.lineBetween(x, y - 24 * s, x - 8 * s, y - 18 * s);
    g.lineBetween(x, y - 24 * s, x + 8 * s, y - 18 * s);
    if (opts.cap) {
      g.fillStyle(color, 1);
      g.fillTriangle(x - 6 * s, y - 39 * s, x + 6 * s, y - 39 * s, x + 2 * s, y - 50 * s);
    }
    if (opts.beard) {
      g.fillStyle(color, 1);
      g.fillTriangle(x - 4 * s, y - 32 * s, x + 4 * s, y - 32 * s, x, y - 22 * s);
    }
    if (opts.bow) {
      g.lineStyle(1.5 * s, color, 1);
      g.beginPath();
      g.arc(x + 8 * s, y - 20 * s, 12 * s, -1.2, 1.2, false);
      g.strokePath();
    }
  },

  wolf: function (g, x, y, s, color, flip) {
    g.fillStyle(color, 1);
    Silhouettes._poly(g, [[-34, -14], [-26, -22], [-6, -26], [14, -26], [20, -32], [24, -40], [27, -32],
      [38, -28], [44, -24], [32, -20], [24, -14], [22, 0], [18, 0], [15, -12], [-12, -12],
      [-14, 0], [-18, 0], [-22, -14], [-40, -8], [-44, -12]], x, y, s, flip);
  },

  bear: function (g, x, y, s, color, flip) {
    g.fillStyle(color, 1);
    Silhouettes._poly(g, [[-36, -12], [-38, -30], [-24, -42], [4, -46], [20, -40], [30, -34], [42, -30],
      [46, -24], [36, -20], [30, -16], [28, 0], [18, 0], [16, -12], [-16, -12], [-18, 0],
      [-30, 0], [-32, -8]], x, y, s, flip);
    g.fillCircle(x + (flip ? -26 : 26) * s, y - 38 * s, 4 * s);
  },

  elk: function (g, x, y, s, color, flip) {
    g.fillStyle(color, 1);
    Silhouettes._poly(g, [[-32, -34], [-20, -44], [18, -46], [28, -54], [38, -52], [48, -40], [42, -36],
      [32, -38], [26, -30], [24, 0], [19, 0], [17, -26], [-20, -26], [-22, 0], [-27, 0],
      [-28, -28]], x, y, s, flip);
    // Palmate antlers
    Silhouettes._poly(g, [[28, -54], [18, -66], [22, -58], [26, -68], [30, -58], [34, -66], [34, -56]], x, y, s, flip);
  },

  horse: function (g, x, y, s, color, flip) {
    g.fillStyle(color, 1);
    Silhouettes._poly(g, [[-30, -30], [-18, -38], [16, -38], [24, -48], [30, -58], [42, -52], [44, -46],
      [34, -44], [28, -34], [24, 0], [19, 0], [17, -24], [-18, -24], [-21, 0], [-26, 0],
      [-28, -24], [-38, -18], [-34, -28]], x, y, s, flip);
  },

  cow: function (g, x, y, s, color, flip) {
    g.fillStyle(color, 1);
    Silhouettes._poly(g, [[-30, -32], [22, -34], [30, -36], [40, -30], [40, -22], [30, -22], [24, -18],
      [22, 0], [17, 0], [15, -14], [-18, -14], [-20, 0], [-25, 0], [-28, -16], [-34, -26]], x, y, s, flip);
    Silhouettes._poly(g, [[30, -36], [26, -44], [33, -38]], x, y, s, flip);
  },

  dog: function (g, x, y, s, color, flip) {
    g.fillStyle(color, 1);
    Silhouettes._poly(g, [[-16, -12], [-6, -16], [10, -16], [14, -22], [16, -28], [19, -22], [26, -20],
      [28, -16], [18, -12], [16, 0], [12, 0], [11, -8], [-8, -8], [-9, 0], [-13, 0], [-14, -8]], x, y, s, flip);
    // Curled spitz tail
    g.fillCircle(x + (flip ? 16 : -16) * s, y - 18 * s, 5 * s);
  },

  squirrel: function (g, x, y, s, color, flip) {
    g.fillStyle(color, 1);
    g.fillEllipse(x, y - 6 * s, 12 * s, 10 * s);
    g.fillCircle(x + (flip ? -6 : 6) * s, y - 12 * s, 4 * s);
    g.fillEllipse(x + (flip ? 9 : -9) * s, y - 14 * s, 9 * s, 18 * s);
  },

  swan: function (g, x, y, s, color, flip) {
    g.fillStyle(color, 1);
    Silhouettes._poly(g, [[-22, -4], [-18, -12], [8, -12], [12, -16], [10, -30], [14, -36], [22, -35],
      [16, -32], [15, -16], [18, -8], [12, 0], [-14, 0]], x, y, s, flip);
  },

  eagle: function (g, x, y, s, color) {
    g.fillStyle(color, 1);
    Silhouettes._poly(g, [[-44, -6], [-24, -12], [-8, -8], [-4, -14], [4, -14], [8, -8], [24, -12], [44, -6],
      [26, -2], [8, 0], [4, 8], [-4, 8], [-8, 0], [-26, -2]], x, y, s, false);
  },

  pike: function (g, x, y, s, color, flip) {
    g.fillStyle(color, 1);
    Silhouettes._poly(g, [[-60, 0], [-70, -12], [-66, 0], [-70, 12], [-60, 0], [-40, -9], [0, -12],
      [30, -10], [52, -6], [66, -2], [70, 2], [50, 6], [20, 10], [-20, 10], [-40, 8]], x, y, s, flip);
    g.fillStyle(0x000000, 0.9);
    g.fillCircle(x + (flip ? -46 : 46) * s, y - 4 * s, 2 * s);
  },

  boat: function (g, x, y, s, color) {
    g.fillStyle(color, 1);
    Silhouettes._poly(g, [[-60, -14], [-50, 0], [50, 0], [64, -16], [48, -8], [-48, -8]], x, y, s, false);
  },

  sleigh: function (g, x, y, s, color, flip) {
    g.fillStyle(color, 1);
    Silhouettes._poly(g, [[-30, -4], [26, -4], [34, -14], [36, -8], [28, 0], [-30, 0]], x, y, s, flip);
    Silhouettes._poly(g, [[-26, -4], [-26, -20], [-18, -22], [10, -12], [18, -12], [18, -4]], x, y, s, flip);
  },

  // Five-string kantele: the wing-shaped Finnish zither
  kantele: function (g, x, y, s, color, strings) {
    g.fillStyle(color, 1);
    Silhouettes._poly(g, [[-30, -6], [30, -2], [34, 6], [-30, 10]], x, y, s, false);
    g.lineStyle(1, strings || 0xe8d8a0, 0.9);
    for (var i = 0; i < 5; i++) {
      g.lineBetween(x - 26 * s, y + (-3 + i * 3) * s, x + 28 * s, y + (-1 + i * 1.6) * s);
    }
  },

  // Log house (tupa / savusauna) with pitched roof
  house: function (g, x, y, s, color, opts) {
    g.fillStyle(color, 1);
    g.fillRect(x - 40 * s, y - 34 * s, 80 * s, 34 * s);
    g.fillTriangle(x - 48 * s, y - 32 * s, x + 48 * s, y - 32 * s, x, y - 62 * s);
    g.fillRect(x + 18 * s, y - 62 * s, 8 * s, 18 * s);
    if (opts && opts.window) {
      g.fillStyle(opts.window, 0.8);
      g.fillRect(x - 24 * s, y - 24 * s, 10 * s, 9 * s);
    }
  }
};
