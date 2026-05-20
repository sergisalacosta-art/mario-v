export type MarioForm = 'small' | 'super' | 'fire';
export type LevelVariantId = 'world1_1' | 'world4_1_video' | 'world4_1_clean';

export interface AssetEntry {
  key: string;
  path: string;
  kind: 'image' | 'spritesheet' | 'audio';
  frameWidth?: number;
  frameHeight?: number;
}

export interface AssetManifest {
  entries: AssetEntry[];
}

export interface PhysicsProfile {
  walkAcceleration: number;
  runAcceleration: number;
  walkMaxSpeed: number;
  runMaxSpeed: number;
  airAcceleration: number;
  gravity: number;
  jumpVelocity: number;
  minJumpCutoff: number;
  dragX: number;
  maxFallSpeed: number;
  bounceVelocity: number;
  invulnerabilityMs: number;
}

export interface EnemySpawn {
  id: string;
  kind: 'goomba' | 'koopa' | 'lakitu' | 'spiny' | 'piranha';
  x: number;
  y: number;
  direction: -1 | 1;
  winged?: boolean;
  exitMarioX?: number;
  spriteSet?: 'default' | 'ram';
}

export interface BlockDefinition {
  x: number;
  y: number;
  kind: 'brick' | 'question';
  contains: 'coin' | 'mushroom' | 'fireflower' | 'none';
}

export interface PipeDefinition {
  x: number;
  topY: number;
  height: number;
}

export interface FlagpoleDefinition {
  x: number;
  groundY: number;
  poleHeight: number;
}

export interface LevelDefinition {
  id: string;
  variantId: LevelVariantId;
  world: string;
  stage: string;
  widthTiles: number;
  heightTiles: number;
  solidLayer: number[][];
  decorativeLayer: number[][];
  blocks: BlockDefinition[];
  pipes: PipeDefinition[];
  enemySpawns: EnemySpawn[];
  coinSpawns: Array<{ id: string; x: number; y: number }>;
  pipePlantSpawns: Array<{
    id: string;
    pipeX: number;
    topY: number;
    direction: 'up' | 'down';
    startPhase?: 'hidden' | 'idleTop';
    startFrames?: number;
  }>;
  flagpole: FlagpoleDefinition;
  start: { x: number; y: number };
  castleX: number;
  timeLimitSeconds: number;
}

export interface HudState {
  score: number;
  coins: number;
  world: string;
  timeRemainingFrames: number;
  lives: number;
}

export interface InputSnapshot {
  left: boolean;
  right: boolean;
  down: boolean;
  jump: boolean;
  run: boolean;
}

export interface ReplayFrame {
  frame: number;
  input: InputSnapshot;
  state?: ReplayStateSnapshot;
}

export interface ReplayData {
  fps: number;
  frames: ReplayFrame[];
}

export interface ReplayStateSnapshot {
  marioX: number;
  marioY: number;
  marioVx: number;
  marioVy: number;
  cameraX: number;
  score: number;
  coins: number;
  timeRemainingFrames: number;
  form: MarioForm;
  gameplayState: 'playing' | 'dead' | 'clear';
}

export interface SimState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  onGround: boolean;
}

export interface CollisionWorld {
  isSolidAtPixel(x: number, y: number): boolean;
}
