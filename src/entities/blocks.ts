import Phaser from 'phaser';
import { TILE_BRICK, TILE_EMPTY, TILE_QUESTION, TILE_QUESTION_USED, TILE_SIZE } from '../core/constants';
import type { BlockDefinition, MarioForm } from '../core/contracts';

export interface SpawnedItem {
  sprite: Phaser.Physics.Arcade.Sprite;
  kind: 'mushroom' | 'fireflower';
}

export interface BlockHitResult {
  outcome: 'coin' | 'item' | 'brickBreak' | 'bump';
  spawnedItem?: SpawnedItem;
  worldX?: number;
  worldY?: number;
  scoreDelta?: number;
  coinsDelta?: number;
}

export class BlockManager {
  private static readonly GREEN_MUSHROOM_BLOCK = { x: 129, y: 4 } as const;
  private readonly scene: Phaser.Scene;
  private readonly tileLayer: Phaser.Tilemaps.TilemapLayer;
  private readonly worldOffsetY: number;
  private readonly blocksByPos = new Map<string, BlockDefinition>();
  private readonly usedBlocks = new Set<string>();
  private readonly itemGroup: Phaser.Physics.Arcade.Group;

  public constructor(scene: Phaser.Scene, tileLayer: Phaser.Tilemaps.TilemapLayer, blocks: BlockDefinition[], worldOffsetY: number) {
    this.scene = scene;
    this.tileLayer = tileLayer;
    this.worldOffsetY = worldOffsetY;
    this.itemGroup = scene.physics.add.group({ allowGravity: true });

    blocks.forEach((block) => {
      this.blocksByPos.set(this.key(block.x, block.y), block);
    });
  }

  public getItemGroup(): Phaser.Physics.Arcade.Group {
    return this.itemGroup;
  }

  public tryHitFromBelow(tileX: number, tileY: number, marioForm: MarioForm): BlockHitResult | null {
    const lookupY = tileY;
    const key = this.key(tileX, lookupY);
    const block = this.blocksByPos.get(key);
    if (!block || this.usedBlocks.has(key)) {
      return null;
    }

    const tile = this.tileLayer.getTileAt(tileX, lookupY);
    if (!tile) {
      return null;
    }

    if (tile.index !== TILE_QUESTION && tile.index !== TILE_BRICK) {
      return null;
    }

    this.bumpTile(tile);

    if (block.kind === 'question') {
      this.tileLayer.putTileAt(TILE_QUESTION_USED, tileX, lookupY);
      this.usedBlocks.add(key);
      const worldX = tileX * TILE_SIZE + TILE_SIZE / 2;
      const worldY = lookupY * TILE_SIZE + this.worldOffsetY;

      if (block.contains === 'coin') {
        return { outcome: 'coin', worldX, worldY, scoreDelta: 200, coinsDelta: 1 };
      }
      if (block.contains === 'mushroom') {
        return {
          outcome: 'item',
          spawnedItem: { sprite: this.spawnItem(tileX, lookupY, 'mushroom', marioForm), kind: 'mushroom' },
          worldX,
          worldY,
        };
      }
      if (block.contains === 'fireflower') {
        const spawnKind: 'mushroom' | 'fireflower' = this.shouldSpawnGreenMushroom(tileX, lookupY)
          ? 'mushroom'
          : marioForm === 'small'
            ? 'mushroom'
            : 'fireflower';
        return {
          outcome: 'item',
          spawnedItem: { sprite: this.spawnItem(tileX, lookupY, spawnKind, marioForm), kind: spawnKind },
          worldX,
          worldY,
        };
      }
      return { outcome: 'bump' };
    }

    if (block.kind === 'brick') {
      if (marioForm !== 'small') {
        this.tileLayer.putTileAt(TILE_EMPTY, tileX, lookupY);
        this.usedBlocks.add(key);
        this.spawnBrickBreakEffect(tileX, lookupY);
        return {
          outcome: 'brickBreak',
          worldX: tileX * TILE_SIZE + TILE_SIZE / 2,
          worldY: lookupY * TILE_SIZE + this.worldOffsetY,
          scoreDelta: 50,
        };
      } else {
        this.tileLayer.putTileAt(TILE_BRICK, tileX, lookupY);
        return { outcome: 'bump' };
      }
    }

    return { outcome: 'bump' };
  }

  private spawnItem(tileX: number, tileY: number, kind: 'mushroom' | 'fireflower', marioForm: MarioForm): Phaser.Physics.Arcade.Sprite {
    const texture = this.resolveItemTexture(tileX, tileY, kind, marioForm);
    const spawnX = tileX * TILE_SIZE + TILE_SIZE / 2;
    const spawnY = tileY * TILE_SIZE + TILE_SIZE + this.worldOffsetY;
    const emergeY = tileY * TILE_SIZE + this.worldOffsetY;

    const item = this.scene.physics.add.sprite(spawnX, spawnY, texture);
    item.setOrigin(0.5, 1);
    // Keep power-up behind the block while it emerges, then restore normal gameplay depth.
    item.setDepth(-1);
    item.setData('kind', kind);
    item.setData('spawnTime', this.scene.time.now);
    item.setData('emerging', true);
    item.setBounce(0);
    item.setCollideWorldBounds(false);

    const body = item.body as Phaser.Physics.Arcade.Body;
    body.enable = false;

    this.scene.tweens.add({
      targets: item,
      y: emergeY,
      duration: 220,
      ease: 'Linear',
      onComplete: () => {
        body.enable = true;
        item.setData('emerging', false);
        item.setDepth(0);
        body.setSize(14, 14, true);
        body.setOffset(1, 2);

        if (kind === 'mushroom') {
          item.setGravityY(1080);
          item.setVelocityX(0);
          this.scene.time.delayedCall(100, () => {
            if (item.active) {
              item.setVelocityX(44);
            }
          });
        } else {
          item.setVelocity(0, 0);
          item.setGravityY(0);
        }
      },
    });

    this.itemGroup.add(item);
    return item;
  }

  private bumpTile(tile: Phaser.Tilemaps.Tile): void {
    const worldX = tile.pixelX;
    const worldY = tile.pixelY;
    this.scene.tweens.add({
      targets: tile,
      pixelY: worldY - 5,
      duration: 55,
      yoyo: true,
      ease: 'Quad.Out',
      onComplete: () => {
        tile.pixelY = worldY;
        tile.pixelX = worldX;
      },
    });
  }

  private spawnBrickBreakEffect(tileX: number, tileY: number): void {
    const centerX = tileX * TILE_SIZE + TILE_SIZE / 2;
    const centerY = tileY * TILE_SIZE + TILE_SIZE / 2 + this.worldOffsetY;
    const spriteKeys = [
      'block_debris_brown_a',
      'block_debris_brown_b',
      'block_debris_brown_c',
      'block_debris_brown_d',
    ];
    const hasSpriteDebris = spriteKeys.every((key) => this.scene.textures.exists(key));
    const pieces = [
      { dx: -4, dy: -4, tx: -18, ty: -20 },
      { dx: 4, dy: -4, tx: 18, ty: -20 },
      { dx: -4, dy: 4, tx: -14, ty: 18 },
      { dx: 4, dy: 4, tx: 14, ty: 18 },
    ] as const;

    if (hasSpriteDebris) {
      pieces.forEach((piece, idx) => {
        const key = spriteKeys[idx] ?? spriteKeys[0];
        const fragment = this.scene.add.image(centerX + piece.dx, centerY + piece.dy, key).setDepth(300);
        this.scene.tweens.add({
          targets: fragment,
          x: fragment.x + piece.tx,
          y: fragment.y + piece.ty,
          alpha: 0,
          duration: 380,
          ease: 'Quad.In',
          onComplete: () => fragment.destroy(),
        });
      });
      return;
    }

    const pieceColor = 0xb46f33;
    pieces.forEach((piece) => {
      const rect = this.scene.add.rectangle(centerX + piece.dx, centerY + piece.dy, 5, 5, pieceColor).setDepth(300);
      this.scene.tweens.add({
        targets: rect,
        x: rect.x + piece.tx,
        y: rect.y + piece.ty,
        alpha: 0,
        duration: 380,
        ease: 'Quad.In',
        onComplete: () => rect.destroy(),
      });
    });
  }

  private key(x: number, y: number): string {
    return `${x},${y}`;
  }

  private shouldSpawnGreenMushroom(tileX: number, tileY: number): boolean {
    return tileX === BlockManager.GREEN_MUSHROOM_BLOCK.x && tileY === BlockManager.GREEN_MUSHROOM_BLOCK.y;
  }

  private resolveItemTexture(tileX: number, tileY: number, kind: 'mushroom' | 'fireflower', marioForm: MarioForm): string {
    if (
      kind === 'mushroom' &&
      this.shouldSpawnGreenMushroom(tileX, tileY) &&
      marioForm !== 'small' &&
      this.scene.textures.exists('item_mushroom_green')
    ) {
      return 'item_mushroom_green';
    }
    return kind === 'mushroom' ? 'item_mushroom' : 'item_fireflower';
  }
}
