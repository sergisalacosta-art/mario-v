import Phaser from 'phaser';

interface CoinSpawn {
  id: string;
  x: number;
  y: number;
}

const COIN_FRAMES = ['coin_pickup_a', 'coin_pickup_b', 'coin_pickup_c', 'coin_pickup_d'] as const;

class FloatingCoin extends Phaser.Physics.Arcade.Sprite {
  public readonly coinId: string;

  public constructor(scene: Phaser.Scene, spawn: CoinSpawn, textureKey: string) {
    super(scene, spawn.x, spawn.y, textureKey);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.coinId = spawn.id;
    this.setOrigin(0.5, 1);

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);
    body.setImmovable(true);
    body.setSize(12, 14, true);
    body.setOffset(2, 2);
  }

  public animate(nowMs: number): void {
    const availableFrames = COIN_FRAMES.filter((key) => this.scene.textures.exists(key));
    if (availableFrames.length === 0) {
      return;
    }
    const frameIdx = Math.floor(nowMs / 90) % availableFrames.length;
    const key = availableFrames[frameIdx];
    if (key && this.texture.key !== key) {
      this.setTexture(key);
    }
  }
}

export class CoinManager {
  private readonly group: Phaser.Physics.Arcade.Group;
  private readonly coins = new Map<string, FloatingCoin>();
  private readonly collected = new Set<string>();

  public constructor(scene: Phaser.Scene, spawns: CoinSpawn[]) {
    this.group = scene.physics.add.group({
      runChildUpdate: false,
      allowGravity: false,
      immovable: true,
    });
    const defaultKey = this.resolveDefaultTexture(scene);
    spawns.forEach((spawn) => {
      const coin = new FloatingCoin(scene, spawn, defaultKey);
      this.group.add(coin);
      this.coins.set(coin.coinId, coin);
    });
  }

  public getGroup(): Phaser.Physics.Arcade.Group {
    return this.group;
  }

  public update(nowMs: number, camera: Phaser.Cameras.Scene2D.Camera): void {
    this.coins.forEach((coin) => {
      if (!coin.active) {
        return;
      }
      const visible = coin.x >= camera.worldView.left - 32 && coin.x <= camera.worldView.right + 32;
      coin.setVisible(visible);
      if (visible) {
        coin.animate(nowMs);
      }
    });
  }

  public collect(coin: Phaser.Physics.Arcade.Sprite): { id: string; x: number; y: number } | null {
    const floatingCoin = coin as FloatingCoin;
    if (!floatingCoin.active || this.collected.has(floatingCoin.coinId)) {
      return null;
    }
    this.collected.add(floatingCoin.coinId);
    const payload = { id: floatingCoin.coinId, x: floatingCoin.x, y: floatingCoin.y };
    floatingCoin.destroy();
    this.coins.delete(payload.id);
    return payload;
  }

  private resolveDefaultTexture(scene: Phaser.Scene): string {
    const firstAvailable = COIN_FRAMES.find((key) => scene.textures.exists(key));
    return firstAvailable ?? 'coin_pop_b';
  }
}
