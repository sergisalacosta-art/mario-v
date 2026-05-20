import Phaser from 'phaser';
import { TARGET_FPS, TILE_SIZE } from '../core/constants';
import type { LevelDefinition } from '../core/contracts';

const PLANT_BLOCK_MARIO_NEAR_PX = 40;
const PLANT_TOP_IDLE_FRAMES = 52;
const PLANT_HIDDEN_IDLE_FRAMES = 50;
const PLANT_TRAVEL_PX_PER_SEC = 48;
const PLANT_TRAVEL_DURATION_SEC = 0.5;

type PlantState = 'hidden' | 'rising' | 'idleTop' | 'lowering';

class PipePlant extends Phaser.Physics.Arcade.Sprite {
  private readonly direction: 'up' | 'down';
  private readonly hiddenY: number;
  private readonly shownY: number;
  private readonly phaseOffsetFrames: number;
  private readonly travelPxPerSec: number;
  private phase: PlantState = 'hidden';
  private stateFrames = PLANT_HIDDEN_IDLE_FRAMES;

  public constructor(
    scene: Phaser.Scene,
    spawn: LevelDefinition['pipePlantSpawns'][number],
    worldOffsetY: number,
  ) {
    const x = spawn.pipeX * TILE_SIZE + TILE_SIZE;
    const topWorldY = spawn.topY * TILE_SIZE + worldOffsetY;
    const textureKey = spawn.direction === 'up' ? 'piranha_up_a' : 'piranha_down_a';
    super(scene, x, topWorldY + TILE_SIZE, textureKey);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setOrigin(0.5, 1);
    this.setDepth(-5);

    const frameHeight = this.frame?.realHeight ?? this.height ?? 24;
    const frameWidth = this.frame?.realWidth ?? this.width ?? 16;
    const hiddenY = spawn.direction === 'up' ? topWorldY + TILE_SIZE + frameHeight : topWorldY - frameHeight;

    this.direction = spawn.direction;
    this.hiddenY = hiddenY;
    this.shownY = spawn.direction === 'up' ? topWorldY + 2 : topWorldY + TILE_SIZE - 2;
    this.phaseOffsetFrames = this.computePhaseOffset(spawn.id);
    this.travelPxPerSec = Math.max(PLANT_TRAVEL_PX_PER_SEC, frameHeight / PLANT_TRAVEL_DURATION_SEC);
    this.phase = spawn.startPhase ?? 'hidden';
    if (this.phase === 'idleTop') {
      this.y = this.shownY;
      this.stateFrames = spawn.startFrames ?? PLANT_TOP_IDLE_FRAMES;
    } else {
      this.y = this.hiddenY;
      this.stateFrames = (spawn.startFrames ?? PLANT_HIDDEN_IDLE_FRAMES) + this.phaseOffsetFrames;
    }
    this.setFlipY(spawn.direction === 'down');

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);
    body.setImmovable(true);
    if (frameHeight > 40 || frameWidth > 24) {
      const bodyWidth = Math.max(24, Math.min(36, Math.round(frameWidth * 0.42)));
      const bodyHeight = Math.max(24, Math.min(34, Math.round(frameHeight * 0.24)));
      body.setSize(bodyWidth, bodyHeight, true);
      body.setOffset(
        Math.round((frameWidth - bodyWidth) * 0.5),
        Math.max(4, Math.round(frameHeight * 0.05)),
      );
    } else {
      body.setSize(12, 18, true);
      body.setOffset(2, 6);
    }
  }

  public step(nowMs: number, marioX: number, marioY: number): void {
    const frame = Math.floor(nowMs / 130) % 2 === 0 ? 'a' : 'b';
    const textureKey = this.direction === 'up' ? `piranha_up_${frame}` : `piranha_down_${frame}`;
    if (this.scene.textures.exists(textureKey)) {
      this.setTexture(textureKey);
    }

    if (this.phase === 'hidden') {
      this.setVisible(false);
      if (this.stateFrames > 0) {
        this.stateFrames -= 1;
        return;
      }
      const marioNearPipe = Math.abs(marioX - this.x) <= PLANT_BLOCK_MARIO_NEAR_PX;
      const marioOnPipeBand = marioY >= this.shownY - TILE_SIZE * 2;
      if (marioNearPipe && marioOnPipeBand) {
        this.stateFrames = 8;
        return;
      }
      this.phase = 'rising';
      this.setVisible(true);
      return;
    }

    if (this.phase === 'rising') {
      const delta = (this.travelPxPerSec / TARGET_FPS) * (this.direction === 'up' ? -1 : 1);
      this.y += delta;
      const reached =
        this.direction === 'up' ? this.y <= this.shownY : this.y >= this.shownY;
      if (reached) {
        this.y = this.shownY;
        this.phase = 'idleTop';
        this.stateFrames = PLANT_TOP_IDLE_FRAMES;
      }
      return;
    }

    if (this.phase === 'idleTop') {
      if (this.stateFrames > 0) {
        this.stateFrames -= 1;
        return;
      }
      this.phase = 'lowering';
      return;
    }

    const delta = (this.travelPxPerSec / TARGET_FPS) * (this.direction === 'up' ? 1 : -1);
    this.y += delta;
    const reached =
      this.direction === 'up' ? this.y >= this.hiddenY : this.y <= this.hiddenY;
    if (!reached) {
      return;
    }
    this.y = this.hiddenY;
    this.phase = 'hidden';
    this.stateFrames = PLANT_HIDDEN_IDLE_FRAMES + this.phaseOffsetFrames;
  }

  public isDangerous(): boolean {
    return this.phase !== 'hidden';
  }

  private computePhaseOffset(id: string): number {
    let hash = 0;
    for (let i = 0; i < id.length; i += 1) {
      hash = (hash * 33 + id.charCodeAt(i)) | 0;
    }
    return Math.abs(hash) % 12;
  }
}

export class PiranhaManager {
  private readonly group: Phaser.Physics.Arcade.Group;
  private readonly plants: PipePlant[];

  public constructor(
    scene: Phaser.Scene,
    spawns: LevelDefinition['pipePlantSpawns'],
    worldOffsetY: number,
  ) {
    this.group = scene.physics.add.group({
      runChildUpdate: false,
      allowGravity: false,
      immovable: true,
    });
    this.plants = spawns.map((spawn) => {
      const plant = new PipePlant(scene, spawn, worldOffsetY);
      this.group.add(plant);
      return plant;
    });
  }

  public getGroup(): Phaser.Physics.Arcade.Group {
    return this.group;
  }

  public update(nowMs: number, marioX: number, marioY: number, camera: Phaser.Cameras.Scene2D.Camera): void {
    this.plants.forEach((plant) => {
      const visible =
        plant.x >= camera.worldView.left - TILE_SIZE * 2 &&
        plant.x <= camera.worldView.right + TILE_SIZE * 2;
      plant.setActive(visible);
      plant.setVisible(visible);
      const body = plant.body as Phaser.Physics.Arcade.Body;
      body.enable = visible && plant.isDangerous();
      if (!visible) {
        return;
      }
      plant.step(nowMs, marioX, marioY);
      body.enable = plant.isDangerous();
    });
  }
}
