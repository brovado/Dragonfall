(() => {
  const DF = window.DF;
  const Phaser = window.Phaser;
  if (!DF || !Phaser) return;

  class BootScene extends Phaser.Scene {
    constructor() {
      super({ key: "BootScene" });
    }

    create() {
      this.cameras.main.setBackgroundColor("#0b0f19");
      if (DF.bridge) {
        this.registry.set("dfBridge", DF.bridge);
      }
      this.scene.start("CombatRoomScene");
    }
  }

  DF.PhaserBootScene = BootScene;
})();
