// player.js — Shared PlayerController: walk, jump, swim, freeze, touch controls
//
// Feel notes
// - Frozen (a verse is being read, a cutscene is playing): input is ignored and
//   the Wanderer stops where they stand. Gravity and water still apply, so
//   nobody slides off a log while reading.
// - Jumping has coyote time (a moment of grace after walking off a ledge),
//   a jump buffer (pressing just before landing still jumps) and variable
//   height (let go early for a short hop).
// - Water is buoyant. The Wanderer floats with head and shoulders above the
//   surface, bobs with the waves, can kick up out of the water from the
//   surface, and holding down dives a little. Nobody drowns.
// - All damping is frame-rate independent.

var PlayerController = {
  WALK_SPEED: 165,
  SWIM_SPEED: 115,
  JUMP_VEL: -520,
  SWIM_KICK_VEL: -440,
  BODY_GRAVITY: 600,      // added to the world's 500 → 1100 total
  MAX_FALL: 720,
  FLOAT_DEPTH: 30,        // how far the feet hang below the surface
  COYOTE_TIME: 0.10,
  JUMP_BUFFER: 0.13,

  sprite: null,
  scene: null,
  cursors: null,
  wasd: null,
  jumpKey: null,

  // State
  frozen: false,
  isSwimming: false,
  isGrounded: false,
  traction: 1,            // < 1 on ice
  water: null,            // { surfaceAt: fn(x) → y|null, currentAt: fn(x) → vx }
  lastCheckpointX: 200,
  lastCheckpointY: 400,
  walkFrame: 0,
  walkTimer: 0,
  dustTimer: 0,
  facingRight: true,
  isMobile: false,
  touchLeft: false,
  touchRight: false,
  touchJump: false,
  _coyote: 0,
  _buffer: 0,
  _jumpHeldPrev: false,
  _jumping: false,
  _wasInWater: false,
  _touchJumpTap: false,

  init: function (scene, x, y) {
    var P = PlayerController;
    P.scene = scene;
    P.frozen = false;
    P.isSwimming = false;
    P.isGrounded = false;
    P.traction = 1;
    P.water = null;
    P.walkFrame = 0;
    P.walkTimer = 0;
    P.dustTimer = 0;
    P.facingRight = true;
    P.touchLeft = false;
    P.touchRight = false;
    P.touchJump = false;
    P._coyote = 0;
    P._buffer = 0;
    P._jumpHeldPrev = false;
    P._jumping = false;
    P._wasInWater = false;
    P._touchJumpTap = false;

    var sprite = scene.physics.add.sprite(x, y, 'player_stand');
    sprite.setCollideWorldBounds(false);
    sprite.body.setGravityY(P.BODY_GRAVITY);
    sprite.body.setMaxVelocityY(P.MAX_FALL);
    sprite.body.setSize(14, 36);
    sprite.body.setOffset(5, 3);
    sprite.setDepth(10);
    P.sprite = sprite;

    P.cursors = scene.input.keyboard.createCursorKeys();
    P.wasd = scene.input.keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D
    });
    P.jumpKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    P.isMobile = !scene.sys.game.device.os.desktop;
    P.setupTouchControls(scene);

    return sprite;
  },

  setupTouchControls: function (scene) {
    var W = scene.scale.width;
    var H = scene.scale.height;

    // Multi-touch so a movement zone and the jump button can be held together.
    scene.input.addPointer(2);

    var makeZone = function (x, flag) {
      var z = scene.add.zone(x, H / 2, W / 3, H).setOrigin(0, 0.5);
      z.setScrollFactor(0);
      z.setDepth(50);
      z.setInteractive();
      z.on('pointerdown', function () { PlayerController[flag] = true; });
      z.on('pointerup', function () { PlayerController[flag] = false; });
      z.on('pointerout', function () { PlayerController[flag] = false; });
      return z;
    };
    makeZone(0, 'touchLeft');
    makeZone(W / 3, 'touchRight');

    if (PlayerController.isMobile) {
      var hints = scene.add.graphics();
      hints.setScrollFactor(0);
      hints.setDepth(49);
      hints.lineStyle(1, 0x405060, 0.35);
      var lx = W / 6, rx = W / 3 + W / 6, ay = H - 50;
      hints.beginPath();
      hints.moveTo(lx + 12, ay - 8); hints.lineTo(lx - 4, ay); hints.lineTo(lx + 12, ay + 8);
      hints.strokePath();
      hints.beginPath();
      hints.moveTo(rx - 12, ay - 8); hints.lineTo(rx + 4, ay); hints.lineTo(rx - 12, ay + 8);
      hints.strokePath();
    }

    var jumpBtn = scene.add.image(W - 60, H - 60, 'jump_btn');
    jumpBtn.setScrollFactor(0);
    jumpBtn.setDepth(51);
    jumpBtn.setAlpha(PlayerController.isMobile ? 1 : 0.35);
    jumpBtn.setInteractive();
    jumpBtn.on('pointerdown', function () {
      PlayerController.touchJump = true;
      PlayerController._touchJumpTap = true;
    });
    jumpBtn.on('pointerup', function () { PlayerController.touchJump = false; });
    jumpBtn.on('pointerout', function () { PlayerController.touchJump = false; });
    PlayerController.jumpBtn = jumpBtn;
  },

  setCheckpoint: function (x, y) {
    PlayerController.lastCheckpointX = x;
    PlayerController.lastCheckpointY = y;
  },

  setFrozen: function (frozen) {
    PlayerController.frozen = !!frozen;
  },

  // Water description for this scene, or null for dry land everywhere.
  setWater: function (water) {
    PlayerController.water = water;
  },

  // Kept for older callers: swimming is now decided by the water itself.
  setSwimMode: function () {},

  input: function () {
    var P = PlayerController;
    var c = P.cursors, w = P.wasd;
    return {
      left: c.left.isDown || w.left.isDown || P.touchLeft,
      right: c.right.isDown || w.right.isDown || P.touchRight,
      down: c.down.isDown || w.down.isDown,
      jump: c.up.isDown || w.up.isDown || P.jumpKey.isDown || P.touchJump
    };
  },

  update: function (delta) {
    var P = PlayerController;
    var sprite = P.sprite;
    if (!sprite || !sprite.active || !sprite.body) return;
    var body = sprite.body;
    var dt = Math.min(delta, 50) / 1000;

    var inp = P.frozen ? { left: false, right: false, down: false, jump: false } : P.input();
    var dir = inp.left ? -1 : (inp.right ? 1 : 0);
    if (dir !== 0) P.facingRight = dir > 0;
    sprite.setFlipX(!P.facingRight);

    var grounded = body.blocked.down || body.touching.down;
    P.isGrounded = grounded;

    // Jump buffer + coyote time. Edge detection uses JustDown so a quick tap
    // that goes down and up between two frames still counts. Presses made
    // while frozen are swallowed so they don't fire after a verse closes.
    var JD = Phaser.Input.Keyboard.JustDown;
    var tapped = JD(P.jumpKey) | JD(P.cursors.up) | JD(P.wasd.up);
    tapped = tapped || P._touchJumpTap;
    P._touchJumpTap = false;
    var jumpPressed = !P.frozen && (tapped || (inp.jump && !P._jumpHeldPrev));
    P._jumpHeldPrev = inp.jump;
    P._buffer = jumpPressed ? P.JUMP_BUFFER : Math.max(0, P._buffer - dt);
    P._coyote = grounded ? P.COYOTE_TIME : Math.max(0, P._coyote - dt);

    // Water
    var surf = P.water ? P.water.surfaceAt(sprite.x) : null;
    var sub = surf === null || surf === undefined ? -999 : body.bottom - surf;
    var inWater = sub > 4 && !grounded;
    P.isSwimming = inWater;

    var vx = body.velocity.x;
    var vy = body.velocity.y;

    if (inWater) {
      body.setAllowGravity(false);
      if (!P._wasInWater && vy > 120) P.splash(sprite.x, surf);

      // Spring toward floating depth — this is the buoyancy.
      var target = P.FLOAT_DEPTH + (inp.down ? 46 : 0);
      var d = sub - target;
      vy += (-d * 24 - vy * 5.0) * dt;

      // Kick up out of the water when near the surface
      if (P._buffer > 0 && Math.abs(d) < 18) {
        vy = P.SWIM_KICK_VEL;
        P._buffer = 0;
        P.splash(sprite.x, surf);
      }

      // Swimming into a bank or wall: clamber up and out
      var pushing = dir > 0 ? body.blocked.right : (dir < 0 ? body.blocked.left : false);
      if (pushing && !P.frozen) vy = Math.min(vy, -380);

      var current = (P.water.currentAt && !P.frozen) ? P.water.currentAt(sprite.x) : 0;
      var tvx = dir * P.SWIM_SPEED + current;
      vx += (tvx - vx) * (1 - Math.exp(-5 * dt));
      P._jumping = false;
    } else {
      body.setAllowGravity(true);
      var tv = dir * P.WALK_SPEED;
      var accel, decel;
      if (grounded) {
        accel = 1800 * P.traction;
        decel = 2400 * P.traction;
      } else {
        accel = 1200;
        decel = 700;
      }
      if (P.frozen && grounded) {
        vx = 0;
      } else {
        var rate = (dir !== 0 && Math.sign(tv) === Math.sign(vx || tv)) ? accel : decel;
        if (vx < tv) vx = Math.min(tv, vx + rate * dt);
        else if (vx > tv) vx = Math.max(tv, vx - rate * dt);
      }

      if (P._buffer > 0 && P._coyote > 0) {
        vy = P.JUMP_VEL;
        P._buffer = 0;
        P._coyote = 0;
        P._jumping = true;
      }
      // Variable height: releasing early cuts the rise
      if (P._jumping && !inp.jump && vy < -160) {
        vy *= 0.45;
        P._jumping = false;
      }
      if (vy >= 0) P._jumping = false;
    }
    P._wasInWater = inWater;

    body.setVelocity(vx, vy);

    P._animate(delta, grounded, inWater, vx);
  },

  _animate: function (delta, grounded, inWater, vx) {
    var P = PlayerController;
    var sprite = P.sprite;
    var moving = Math.abs(vx) > 12;
    P.walkTimer += delta;
    var interval = inWater ? 320 : 140;
    if (P.walkTimer >= interval) {
      P.walkTimer = 0;
      if (inWater) {
        P.walkFrame = (P.walkFrame + 1) % 2;
        sprite.setTexture(moving ? (P.walkFrame ? 'player_walk1' : 'player_walk2') : 'player_stand');
      } else if (!grounded) {
        sprite.setTexture('player_jump');
      } else if (moving) {
        P.walkFrame = (P.walkFrame + 1) % 2;
        sprite.setTexture(P.walkFrame === 0 ? 'player_walk1' : 'player_walk2');
      } else {
        sprite.setTexture('player_stand');
      }
    }

    if (grounded && moving) {
      P.dustTimer += delta;
      if (P.dustTimer >= 200) {
        P.dustTimer = 0;
        P.spawnDust(sprite.x, sprite.y + 18);
      }
    } else {
      P.dustTimer = 0;
    }
  },

  spawnDust: function (x, y) {
    try {
      var scene = PlayerController.scene;
      var emitter = scene.add.particles(x, y, 'particle_dust', {
        speed: { min: 10, max: 30 },
        angle: { min: 160, max: 200 },
        scale: { start: 0.8, end: 0 },
        alpha: { start: 0.6, end: 0 },
        lifespan: 300,
        frequency: -1
      });
      emitter.setDepth(8);
      emitter.explode(3, 0, 0);
      scene.time.delayedCall(400, function () { emitter.destroy(); });
    } catch (e) {}
  },

  splash: function (x, y) {
    try {
      var scene = PlayerController.scene;
      var emitter = scene.add.particles(x, y, 'particle_star', {
        speed: { min: 40, max: 110 },
        angle: { min: 225, max: 315 },
        scale: { start: 1.4, end: 0 },
        alpha: { start: 0.8, end: 0 },
        gravityY: 300,
        lifespan: 500,
        tint: 0x9ab8d0,
        frequency: -1
      });
      emitter.setDepth(11);
      emitter.explode(10, 0, 0);
      scene.time.delayedCall(600, function () { emitter.destroy(); });
    } catch (e) {}
  }
};
