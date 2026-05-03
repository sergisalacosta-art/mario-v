import Phaser from 'phaser';
import type { Mario } from './mario';

const FIREBALL_SPEED_X = 186;
const FIREBALL_BOUNCE_Y = -228;
const FIREBALL_GRAVITY = 960;
const FIREBALL_MAX_AGE_MS = 3600;
const FIREBALL_SHOT_COOLDOWN_FRAMES = 10;
const FIREBALL_MAX_ACTIVE = 2;

export class Fireball extends Phaser.Physics.Arcade.Sprite {
  private readonly bornAtMs: number;
  private exploded = false;

  public constructor(scene: Phaser.Scene, x: number, y: number, direction: -1 | 1, nowMs: number) {
    super(scene, x, y, 'fireball_a');
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setOrigin(0.5, 0.5);

    this.bornAtMs = nowMs;

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setSize(6, 6, true);
    body.setOffset(1, 1);
    body.setCollideWorldBounds(false);
    body.setGravityY(FIREBALL_GRAVITY);
    body.setVelocity(direction * FIREBALL_SPEED_X, FIREBALL_BOUNCE_Y * 0.5);
    body.setAllowGravity(true);
  }

  public step(nowMs: number): void {
    if (this.exploded || !this.active) {
      return;
    }

    const body = this.body as Phaser.Physics.Arcade.Body;

    if (body.blocked.down && body.velocity.y >= 0) {
      body.setVelocityY(FIREBALL_BOUNCE_Y);
    }

    if (body.blocked.left || body.blocked.right || body.blocked.up) {
      this.explode();
      return;
    }

    const frame = Math.floor(nowMs / 55) % 4;
    const texture = frame < 2 ? 'fireball_a' : 'fireball_b';
    if (this.texture.key !== texture) {
      this.setTexture(texture);
    }
  }

  public isExpired(nowMs: number, camera: Phaser.Cameras.Scene2D.Camera): boolean {
    if (!this.active) {
      return true;
    }
    if (nowMs - this.bornAtMs > FIREBALL_MAX_AGE_MS) {
      return true;
    }
    return (
      this.x < camera.worldView.left - 32 ||
      this.x > camera.worldView.right + 32 ||
      this.y > camera.worldView.bottom + 32 ||
      this.y < camera.worldView.top - 64
    );
  }

  public explode(): void {
    if (this.exploded || !this.active) {
      return;
    }
    this.exploded = true;

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.stop();
    body.setAllowGravity(false);
    body.enable = false;

    if (this.scene.textures.exists('fireball_hit')) {
      this.setTexture('fireball_hit');
    }

    this.scene.time.delayedCall(85, () => {
      this.destroy();
    });
  }
}

export class FireballManager {
  private readonly scene: Phaser.Scene;
  private readonly group: Phaser.Physics.Arcade.Group;
  private lastShotFrame = -999;

  public constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.group = scene.physics.add.group({
      runChildUpdate: false,
      allowGravity: true,
      immovable: false,
    });
  }

  public getGroup(): Phaser.Physics.Arcade.Group {
    return this.group;
  }

  public tryShootFromMario(mario: Mario, frameNumber: number, nowMs: number): void {
    if (frameNumber - this.lastShotFrame < FIREBALL_SHOT_COOLDOWN_FRAMES) {
      return;
    }

    if (this.group.countActive(true) >= FIREBALL_MAX_ACTIVE) {
      return;
    }

    const direction: -1 | 1 = mario.flipX ? -1 : 1;
    const spawnX = mario.x + direction * 9;
    const spawnY = mario.y - (mario.getForm() === 'small' ? 8 : 16);

    const fireball = new Fireball(this.scene, spawnX, spawnY, direction, nowMs);
    this.group.add(fireball);
    this.lastShotFrame = frameNumber;
  }

  public update(camera: Phaser.Cameras.Scene2D.Camera, nowMs: number): void {
    const fireballs = this.group.getChildren() as Fireball[];
    fireballs.forEach((fireball) => {
      if (!fireball.active) {
        return;
      }

      fireball.step(nowMs);
      if (fireball.isExpired(nowMs, camera)) {
        fireball.destroy();
      }
    });
  }
}
