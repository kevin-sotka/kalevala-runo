// main.js — Phaser game config + scene registration

var RunoGame = new Phaser.Game({
  type: Phaser.AUTO,
  width: 960,
  height: 540,
  backgroundColor: '#0a0a12',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 960,
    height: 540
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 500 },
      debug: false
    }
  },
  scene: [
    BootScene,
    TitleScene,
    Episode1Scene,
    Episode2Scene,
    Episode3Scene,
    Episode4Scene,
    Episode5Scene
  ]
});
