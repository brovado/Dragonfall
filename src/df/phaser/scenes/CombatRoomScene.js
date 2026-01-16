(() => {
  const DF = window.DF;
  const Phaser = window.Phaser;
  if (!DF || !Phaser) return;

  class CombatRoomScene extends Phaser.Scene {
    constructor() {
      super({ key: "CombatRoomScene" });
      this.player = null;
      this.enemies = null;
      this.gold = null;
      this.cursors = null;
      this.facing = new Phaser.Math.Vector2(1, 0);
      this.attackCooldown = 0;
      this.lastDispatch = 0;
    }

    create() {
      const width = 800;
      const height = 450;
      this.physics.world.setBounds(0, 0, width, height);

      this.add.rectangle(width / 2, height / 2, width, height, 0x0b0f19).setDepth(-1);
      this.add.rectangle(width / 2, height / 2, width - 40, height - 40, 0x101826).setDepth(-1).setAlpha(0.9);

      this.player = this.add.rectangle(width / 2, height / 2, 18, 18, 0x38bdf8);
      this.physics.add.existing(this.player);
      this.player.body.setCollideWorldBounds(true);
      this.player.body.setDrag(900, 900);
      this.player.body.setMaxVelocity(180);

      this.enemies = this.physics.add.group();
      this.gold = this.physics.add.group();
      this.spawnEnemies(3);

      this.cursors = this.input.keyboard.addKeys({
        up: Phaser.Input.Keyboard.KeyCodes.W,
        down: Phaser.Input.Keyboard.KeyCodes.S,
        left: Phaser.Input.Keyboard.KeyCodes.A,
        right: Phaser.Input.Keyboard.KeyCodes.D,
        attack: Phaser.Input.Keyboard.KeyCodes.SPACE,
      });

      this.input.on("pointerdown", () => this.handleAttack());

      this.physics.add.overlap(this.player, this.gold, (_player, coin) => {
        coin.destroy();
        const bridge = this.registry.get("dfBridge");
        if (bridge) bridge.dispatch({ type: "GOLD_ADD", amount: 1 });
      });
    }

    spawnEnemies(count) {
      for (let i = 0; i < count; i += 1) {
        const x = Phaser.Math.Between(120, 680);
        const y = Phaser.Math.Between(90, 360);
        const enemy = this.add.rectangle(x, y, 20, 20, 0xf97316);
        this.physics.add.existing(enemy);
        enemy.body.setCollideWorldBounds(true);
        enemy.body.setMaxVelocity(120);
        enemy.hp = 3;
        enemy.baseColor = 0xf97316;
        enemy.speed = 70 + i * 10;
        this.enemies.add(enemy);
      }
    }

    handleAttack() {
      if (this.attackCooldown > this.time.now) return;
      this.attackCooldown = this.time.now + 280;

      const dir = this.facing.clone().normalize();
      const offset = dir.clone().scale(20);
      const hitbox = this.add.rectangle(this.player.x + offset.x, this.player.y + offset.y, 28, 18, 0x22d3ee, 0.4);
      this.physics.add.existing(hitbox);
      hitbox.body.setAllowGravity(false);
      hitbox.body.setImmovable(true);

      this.physics.add.overlap(hitbox, this.enemies, (_hb, enemy) => {
        if (!enemy.active) return;
        enemy.hp -= 1;
        enemy.body.velocity.x += dir.x * 160;
        enemy.body.velocity.y += dir.y * 160;
        enemy.setFillStyle(0xf87171);
        this.time.delayedCall(120, () => enemy.setFillStyle(enemy.baseColor));
        this.cameras.main.shake(70, 0.004);

        if (enemy.hp <= 0) {
          this.spawnGold(enemy.x, enemy.y);
          enemy.destroy();
        }
      });

      this.time.delayedCall(120, () => hitbox.destroy());
    }

    spawnGold(x, y) {
      const coin = this.add.circle(x, y, 4, 0xfacc15);
      this.physics.add.existing(coin);
      coin.body.setAllowGravity(false);
      coin.body.setVelocity(Phaser.Math.Between(-30, 30), Phaser.Math.Between(-30, 30));
      this.gold.add(coin);
    }

    update(time) {
      if (!this.player || !this.player.body) return;
      const dir = new Phaser.Math.Vector2(0, 0);
      if (this.cursors.left.isDown) dir.x -= 1;
      if (this.cursors.right.isDown) dir.x += 1;
      if (this.cursors.up.isDown) dir.y -= 1;
      if (this.cursors.down.isDown) dir.y += 1;

      if (dir.lengthSq() > 0) {
        dir.normalize();
        this.facing = dir.clone();
        this.player.body.setVelocity(dir.x * 160, dir.y * 160);
      } else {
        this.player.body.setVelocity(0, 0);
      }

      if (Phaser.Input.Keyboard.JustDown(this.cursors.attack)) {
        this.handleAttack();
      }

      this.enemies.children.each((enemy) => {
        if (!enemy.active) return;
        this.physics.moveToObject(enemy, this.player, enemy.speed || 70);
      });

      if (time - this.lastDispatch > 120) {
        const bridge = this.registry.get("dfBridge");
        if (bridge) bridge.dispatch({ type: "PLAYER_POSITION", x: this.player.x, y: this.player.y });
        this.lastDispatch = time;
      }
    }
  }

  DF.PhaserCombatRoomScene = CombatRoomScene;
})();
