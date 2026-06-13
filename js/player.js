// player.js — Shared PlayerController: walk, jump, float-swim, respawn, stick figure animation

var PlayerController = {
  sprite: null,
  scene: null,
  cursors: null,
  wasd: null,
  jumpKey: null,
  enterKey: null,

  // State
  isSwimming: false,
  isGrounded: false,
  lastCheckpointX: 200,
  lastCheckpointY: 400,
  walkFrame: 0,
  walkTimer: 0,
  walkInterval: 140,
  dustTimer: 0,
  dustInterval: 200,
  facingRight: true,
  isMobile: false,
  touchLeft: false,
  touchRight: false,
  touchJump: false,
  jumpPressed: false,
  prevGrounded: false,

  init: function (scene, x, y) {
    PlayerController.scene = scene;
    PlayerController.isSwimming = false;
    PlayerController.walkFrame = 0;
    PlayerController.walkTimer = 0;
    PlayerController.dustTimer = 0;
    PlayerController.facingRight = true;
    PlayerController.touchLeft = false;
    PlayerController.touchRight = false;
    PlayerController.touchJump = false;
    PlayerController.jumpPressed = false;
    PlayerController.prevGrounded = false;

    // Create physics sprite using player_stand texture
    var sprite = scene.physics.add.sprite(x, y, 'player_stand');
    sprite.setCollideWorldBounds(false);
    sprite.setGravityY(0); // we control gravity
    sprite.body.setSize(16, 36);
    sprite.body.setOffset(4, 3);
    sprite.setDepth(10);
    PlayerController.sprite = sprite;

    // Keyboard
    PlayerController.cursors = scene.input.keyboard.createCursorKeys();
    PlayerController.wasd = scene.input.keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D
    });
    PlayerController.jumpKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    PlayerController.enterKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);

    // Detect mobile
    PlayerController.isMobile = !scene.sys.game.device.os.desktop;

    PlayerController.setupTouchControls(scene);

    return sprite;
  },

  setupTouchControls: function (scene) {
    var W = scene.scale.width;
    var H = scene.scale.height;

    // Multi-touch: Phaser defaults to a single touch pointer, which makes
    // hold-to-move + tap-to-jump impossible on a phone. Add pointers so a
    // movement zone and the jump button can be pressed at the same time.
    scene.input.addPointer(2);

    // Left zone (left third of screen)
    var leftZone = scene.add.zone(0, H / 2, W / 3, H).setOrigin(0, 0.5);
    leftZone.setScrollFactor(0);
    leftZone.setDepth(50);
    leftZone.setInteractive();
    leftZone.on('pointerdown', function () { PlayerController.touchLeft = true; });
    leftZone.on('pointerup', function () { PlayerController.touchLeft = false; });
    leftZone.on('pointerout', function () { PlayerController.touchLeft = false; });

    // Right zone (middle third)
    var rightZone = scene.add.zone(W / 3, H / 2, W / 3, H).setOrigin(0, 0.5);
    rightZone.setScrollFactor(0);
    rightZone.setDepth(50);
    rightZone.setInteractive();
    rightZone.on('pointerdown', function () { PlayerController.touchRight = true; });
    rightZone.on('pointerup', function () { PlayerController.touchRight = false; });
    rightZone.on('pointerout', function () { PlayerController.touchRight = false; });

    // Left zone outline (faint)
    var lOutline = scene.add.graphics();
    lOutline.lineStyle(1, 0x304050, 0.25);
    lOutline.strokeRect(4, H / 2 - H / 3, W / 3 - 8, H * 2 / 3 - 8);
    lOutline.setScrollFactor(0);
    lOutline.setDepth(49);
    // Arrow left hint
    lOutline.lineStyle(1, 0x405060, 0.3);
    var lx = W / 6, ly = H - 50;
    lOutline.beginPath();
    lOutline.moveTo(lx + 12, ly - 8);
    lOutline.lineTo(lx - 4, ly);
    lOutline.lineTo(lx + 12, ly + 8);
    lOutline.strokePath();

    // Right zone outline
    var rOutline = scene.add.graphics();
    rOutline.lineStyle(1, 0x304050, 0.25);
    rOutline.strokeRect(W / 3 + 4, H / 2 - H / 3, W / 3 - 8, H * 2 / 3 - 8);
    rOutline.setScrollFactor(0);
    rOutline.setDepth(49);
    // Arrow right hint
    rOutline.lineStyle(1, 0x405060, 0.3);
    var rx = W / 3 + W / 6, ry = H - 50;
    rOutline.beginPath();
    rOutline.moveTo(rx - 12, ry - 8);
    rOutline.lineTo(rx + 4, ry);
    rOutline.lineTo(rx - 12, ry + 8);
    rOutline.strokePath();

    // Jump button (bottom-right)
    var jumpBtn = scene.add.image(W - 60, H - 60, 'jump_btn');
    jumpBtn.setScrollFactor(0);
    jumpBtn.setDepth(51);
    jumpBtn.setScale(1.0);
    jumpBtn.setInteractive();
    jumpBtn.on('pointerdown', function () { PlayerController.touchJump = true; });
    jumpBtn.on('pointerup', function () { PlayerController.touchJump = false; });
    jumpBtn.on('pointerout', function () { PlayerController.touchJump = false; });
  },

  setCheckpoint: function (x, y) {
    PlayerController.lastCheckpointX = x;
    PlayerController.lastCheckpointY = y;
  },

  setSwimMode: function (swimming) {
    PlayerController.isSwimming = swimming;
  },

  update: function (delta, groundGroup) {
    var sprite = PlayerController.sprite;
    if (!sprite || !sprite.active) return;

    var scene = PlayerController.scene;
    var cursors = PlayerController.cursors;
    var wasd = PlayerController.wasd;
    var speed = 160;
    var jumpVel = PlayerController.isSwimming ? -180 : -400;
    var gravity = PlayerController.isSwimming ? 40 : 500;

    // Apply gravity manually (since we use sprite.setGravityY = 0 for control)
    if (!sprite.body.blocked.down) {
      sprite.body.setGravityY(gravity);
    } else {
      sprite.body.setGravityY(gravity);
    }

    var left = cursors.left.isDown || wasd.left.isDown || PlayerController.touchLeft;
    var right = cursors.right.isDown || wasd.right.isDown || PlayerController.touchRight;
    var jumpDown = cursors.up.isDown || wasd.up.isDown || PlayerController.jumpKey.isDown || PlayerController.touchJump;

    // Movement
    if (left) {
      sprite.setVelocityX(-speed);
      PlayerController.facingRight = false;
    } else if (right) {
      sprite.setVelocityX(speed);
      PlayerController.facingRight = true;
    } else {
      sprite.setVelocityX(0);
    }

    sprite.setFlipX(!PlayerController.facingRight);

    var grounded = sprite.body.blocked.down;
    PlayerController.isGrounded = grounded;

    // Jump / swim-float
    if (jumpDown && !PlayerController.jumpPressed) {
      if (grounded || PlayerController.isSwimming) {
        sprite.setVelocityY(jumpVel);
        PlayerController.jumpPressed = true;
      }
    }
    if (!jumpDown) {
      PlayerController.jumpPressed = false;
    }

    // Swim: dampen vertical velocity
    if (PlayerController.isSwimming) {
      var vy = sprite.body.velocity.y;
      sprite.setVelocityY(vy * 0.92);
    }

    // Animation frames
    PlayerController.walkTimer += delta;
    if (PlayerController.walkTimer >= PlayerController.walkInterval) {
      PlayerController.walkTimer = 0;
      if (!grounded) {
        sprite.setTexture('player_jump');
      } else if (Math.abs(sprite.body.velocity.x) > 10) {
        PlayerController.walkFrame = (PlayerController.walkFrame + 1) % 2;
        sprite.setTexture(PlayerController.walkFrame === 0 ? 'player_walk1' : 'player_walk2');
      } else {
        sprite.setTexture('player_stand');
      }
    }

    // Footstep dust
    if (grounded && Math.abs(sprite.body.velocity.x) > 10) {
      PlayerController.dustTimer += delta;
      if (PlayerController.dustTimer >= PlayerController.dustInterval) {
        PlayerController.dustTimer = 0;
        PlayerController.spawnDust(sprite.x, sprite.y + 18);
      }
    } else {
      PlayerController.dustTimer = 0;
    }

    PlayerController.prevGrounded = grounded;
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
        quantity: 3,
        frequency: -1
      });
      emitter.setDepth(8);
      emitter.explode(3, 0, 0);
      scene.time.delayedCall(400, function () { emitter.destroy(); });
    } catch (e) {}
  },

  handleEnterKey: function () {
    return Phaser.Input.Keyboard.JustDown(PlayerController.enterKey);
  }
};
