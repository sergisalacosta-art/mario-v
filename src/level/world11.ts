import {
  TILE_BRICK,
  TILE_EMPTY,
  TILE_GROUND_FILL,
  TILE_GROUND_TOP,
  TILE_PIPE_BODY_LEFT,
  TILE_PIPE_BODY_RIGHT,
  TILE_PIPE_TOP_LEFT,
  TILE_PIPE_TOP_RIGHT,
  TILE_QUESTION,
  TILE_FLAGPOLE,
  SOLID_TILE_IDS,
  TILE_SIZE,
} from '../core/constants';
import type { BlockDefinition, CollisionWorld, LevelDefinition, LevelVariantId } from '../core/contracts';
import { WORLD41_VIDEO_COIN_SPAWNS } from '../reference/world41-video-coins';
import { WORLD11_ENTITIES_GENERATED } from './generated/world11-entities.generated';
import { WORLD11_SOLID_GENERATED } from './generated/world11-solid.generated';

const WIDTH_TILES = Number(WORLD11_SOLID_GENERATED.widthTiles);
const HEIGHT_TILES = Number(WORLD11_SOLID_GENERATED.heightTiles);
const GROUND_Y = 12;

export function createWorld11Definition(): LevelDefinition {
  const solid = WORLD11_SOLID_GENERATED.solid.map((row) => row.map((tile) => Number(tile)));
  const decorative = createLayer(WIDTH_TILES, HEIGHT_TILES, TILE_EMPTY);
  const blocks: BlockDefinition[] = WORLD11_ENTITIES_GENERATED.blocks.map((block) => ({
    x: Number(block.x),
    y: Number(block.y),
    kind: block.kind,
    contains: block.contains,
  }));

  blocks.forEach((block) => {
    solid[block.y][block.x] = block.kind === 'question' ? TILE_QUESTION : TILE_BRICK;
  });

  const enemySpawns = WORLD11_ENTITIES_GENERATED.enemySpawnsTiles.map((spawn) => ({
    id: spawn.id,
    kind: spawn.kind,
    x: Number(spawn.x) * TILE_SIZE,
    y: Number(spawn.y) * TILE_SIZE,
    direction: spawn.direction,
  }));

  const pipes = derivePipes(solid);
  const flagpoleX = Number(WORLD11_SOLID_GENERATED.flagpoleX);
  const castleX = Number(WORLD11_SOLID_GENERATED.castleX);
  const pipePlantSpawns = [
    { id: 'w11p01', pipeX: 57, topY: 8, direction: 'up' as const, startPhase: 'hidden' as const, startFrames: 18 },
    { id: 'w11p02', pipeX: 163, topY: 10, direction: 'up' as const, startPhase: 'hidden' as const, startFrames: 30 },
  ];

  return {
    id: 'smas-world-1-1',
    variantId: 'world1_1',
    world: '1',
    stage: '1',
    widthTiles: WIDTH_TILES,
    heightTiles: HEIGHT_TILES,
    solidLayer: solid,
    decorativeLayer: decorative,
    blocks,
    pipes,
    enemySpawns,
    coinSpawns: [],
    pipePlantSpawns,
    flagpole: { x: flagpoleX, groundY: GROUND_Y, poleHeight: 9 },
    start: { x: 2 * TILE_SIZE, y: 12 * TILE_SIZE },
    castleX: castleX * TILE_SIZE,
    timeLimitSeconds: 400,
  };
}

export function createWorld41VideoDefinition(): LevelDefinition {
  const base = createWorld11Definition();
  const solid = base.solidLayer.map((row) => row.slice());
  const decorative = base.decorativeLayer.map((row) => row.slice());
  const blocks = base.blocks.map((block) => ({ ...block }));

  // Keep the first segment playable/visible in captures (no early pits),
  // while preserving pipe columns and the original SMAS look.
  flattenGroundSpan(solid, 0, 96, GROUND_Y);
  carvePipeColumns(solid, base.pipes);
  injectWorld41ReferencePlatforms(solid);
  injectWorld41ReferenceBlocks(blocks, solid);

  const coinSpawns = WORLD41_VIDEO_COIN_SPAWNS.map((coin) => ({
    id: coin.id,
    x: coin.xTiles * TILE_SIZE + TILE_SIZE / 2,
    y: coin.yTiles * TILE_SIZE,
  }));

  const pipePlantSpawns = [
    { id: 'w41p01', pipeX: 38, topY: 9, direction: 'up' as const, startPhase: 'idleTop' as const, startFrames: 24 },
    { id: 'w41p02', pipeX: 46, topY: 8, direction: 'up' as const, startPhase: 'hidden' as const, startFrames: 30 },
    { id: 'w41p03', pipeX: 57, topY: 8, direction: 'up' as const, startPhase: 'hidden' as const, startFrames: 20 },
    { id: 'w41p04', pipeX: 163, topY: 10, direction: 'up' as const, startPhase: 'hidden' as const, startFrames: 36 },
  ];

  const enemySpawns = [
    ...base.enemySpawns.map((spawn) => ({ ...spawn })),
    {
      id: 'w41-lakitu-01',
      kind: 'lakitu' as const,
      x: 34 * TILE_SIZE,
      y: 6 * TILE_SIZE,
      direction: -1 as const,
    },
  ];

  return {
    ...base,
    id: 'smas-world-4-1-video',
    variantId: 'world4_1_video',
    world: '4',
    stage: '1',
    solidLayer: solid,
    decorativeLayer: decorative,
    blocks,
    enemySpawns,
    coinSpawns,
    pipePlantSpawns,
  };
}

export function createWorld41CleanDefinition(): LevelDefinition {
  const solid = createLayer(WIDTH_TILES, HEIGHT_TILES, TILE_EMPTY);
  const decorative = createLayer(WIDTH_TILES, HEIGHT_TILES, TILE_EMPTY);
  const blocks: BlockDefinition[] = [];
  const solidIds = new Set<number>(SOLID_TILE_IDS);
  const flagpoleX = Number(WORLD11_SOLID_GENERATED.flagpoleX);
  const castleX = Number(WORLD11_SOLID_GENERATED.castleX);

  flattenGroundSpan(solid, 0, castleX + 6, GROUND_Y);
  addFlagpoleColumn(solid, flagpoleX, GROUND_Y, 9);

  const pipes = [
    { x: 30, topY: 10, height: 3 },
    { x: 54, topY: 9, height: 4 },
    { x: 84, topY: 10, height: 3 },
    { x: 138, topY: 10, height: 3 },
    { x: 148, topY: 8, height: 5 },
    { x: 160, topY: 9, height: 4 },
  ];
  carvePipeColumns(solid, pipes);

  const cleanBlocks: BlockDefinition[] = [
    { x: 18, y: 8, kind: 'question', contains: 'mushroom' },
    { x: 22, y: 8, kind: 'question', contains: 'coin' },
    { x: 23, y: 8, kind: 'brick', contains: 'none' },
    { x: 24, y: 8, kind: 'question', contains: 'coin' },
    { x: 46, y: 8, kind: 'brick', contains: 'none' },
    { x: 47, y: 8, kind: 'question', contains: 'coin' },
    { x: 48, y: 8, kind: 'brick', contains: 'none' },
    { x: 66, y: 8, kind: 'question', contains: 'coin' },
    { x: 67, y: 8, kind: 'brick', contains: 'none' },
    { x: 68, y: 8, kind: 'question', contains: 'coin' },
    { x: 96, y: 8, kind: 'brick', contains: 'none' },
    { x: 97, y: 8, kind: 'question', contains: 'coin' },
    { x: 98, y: 8, kind: 'brick', contains: 'none' },
    { x: 118, y: 8, kind: 'question', contains: 'coin' },
    { x: 119, y: 8, kind: 'brick', contains: 'none' },
    { x: 120, y: 8, kind: 'question', contains: 'coin' },
    { x: 140, y: 8, kind: 'brick', contains: 'none' },
    { x: 141, y: 8, kind: 'brick', contains: 'none' },
    { x: 142, y: 8, kind: 'question', contains: 'coin' },
    { x: 143, y: 8, kind: 'brick', contains: 'none' },
    { x: 144, y: 8, kind: 'brick', contains: 'none' },
  ];

  cleanBlocks.forEach((block) => {
    blocks.push(block);
    if (block.y >= 0 && block.y < solid.length && block.x >= 0 && block.x < solid[0].length) {
      solid[block.y][block.x] = block.kind === 'question' ? TILE_QUESTION : TILE_BRICK;
    }
  });

  const enemySpawns = [
    { id: 'w41c-g01', kind: 'goomba' as const, x: 14, y: 12, direction: -1 as const },
    { id: 'w41c-k01', kind: 'koopa' as const, x: 26, y: 12, direction: -1 as const },
    { id: 'w41c-g02', kind: 'goomba' as const, x: 42, y: 12, direction: -1 as const },
    { id: 'w41c-k02', kind: 'koopa' as const, x: 62, y: 12, direction: -1 as const },
    { id: 'w41c-g03', kind: 'goomba' as const, x: 76, y: 12, direction: -1 as const },
    { id: 'w41c-g04', kind: 'goomba' as const, x: 92, y: 12, direction: -1 as const },
    { id: 'w41c-s01', kind: 'spiny' as const, x: 108, y: 12, direction: -1 as const, spriteSet: 'ram' as const },
    { id: 'w41c-k03', kind: 'koopa' as const, x: 118, y: 12, direction: -1 as const },
    { id: 'w41c-g05', kind: 'goomba' as const, x: 122, y: 12, direction: -1 as const },
    { id: 'w41c-g06', kind: 'goomba' as const, x: 126, y: 12, direction: -1 as const },
    { id: 'w41c-s02', kind: 'spiny' as const, x: 138, y: 12, direction: -1 as const, spriteSet: 'ram' as const },
    { id: 'w41c-k04', kind: 'koopa' as const, x: 146, y: 12, direction: -1 as const },
    { id: 'w41c-g08', kind: 'goomba' as const, x: 142, y: 12, direction: -1 as const },
    { id: 'w41c-k05', kind: 'koopa' as const, x: 156, y: 12, direction: -1 as const },
    { id: 'w41c-g09', kind: 'goomba' as const, x: 162, y: 12, direction: -1 as const },
    { id: 'w41c-g07', kind: 'goomba' as const, x: 166, y: 12, direction: -1 as const },
    { id: 'w41c-s03', kind: 'spiny' as const, x: 172, y: 12, direction: -1 as const, spriteSet: 'ram' as const },
    {
      id: 'w41c-l01',
      kind: 'lakitu' as const,
      x: 102 * TILE_SIZE,
      y: 6 * TILE_SIZE,
      direction: -1 as const,
      exitMarioX: 132 * TILE_SIZE,
    },
  ].map((spawn) => ({
    ...spawn,
    x:
      spawn.kind === 'lakitu'
        ? spawn.x
        : normalizeGroundEnemySpawnTileX(solid, solidIds, spawn.x, spawn.y, spawn.direction, spawn.kind) * TILE_SIZE,
    y: spawn.kind === 'lakitu' ? spawn.y : spawn.y * TILE_SIZE,
  }));

  const coinSpawns: Array<{ id: string; x: number; y: number }> = [];

  const pipePlantSpawns = [
    { id: 'w41clean-p01', pipeX: 30, topY: 10, direction: 'up' as const, startPhase: 'hidden' as const, startFrames: 24 },
    { id: 'w41clean-p02', pipeX: 54, topY: 9, direction: 'up' as const, startPhase: 'hidden' as const, startFrames: 38 },
    { id: 'w41clean-p03', pipeX: 84, topY: 10, direction: 'up' as const, startPhase: 'hidden' as const, startFrames: 18 },
    { id: 'w41clean-p04', pipeX: 138, topY: 10, direction: 'up' as const, startPhase: 'hidden' as const, startFrames: 14 },
    { id: 'w41clean-p05', pipeX: 160, topY: 9, direction: 'up' as const, startPhase: 'hidden' as const, startFrames: 30 },
  ];

  return {
    id: 'smas-world-4-1-clean',
    variantId: 'world4_1_clean',
    world: '4',
    stage: '1',
    widthTiles: WIDTH_TILES,
    heightTiles: HEIGHT_TILES,
    solidLayer: solid,
    decorativeLayer: decorative,
    blocks,
    pipes,
    enemySpawns,
    coinSpawns,
    pipePlantSpawns,
    flagpole: { x: flagpoleX, groundY: GROUND_Y, poleHeight: 9 },
    start: { x: 2 * TILE_SIZE, y: 12 * TILE_SIZE },
    castleX: castleX * TILE_SIZE,
    timeLimitSeconds: 400,
  };
}

export function createLevelDefinitionByVariant(variantId: LevelVariantId): LevelDefinition {
  if (variantId === 'world4_1_clean') {
    return createWorld41CleanDefinition();
  }
  if (variantId === 'world4_1_video') {
    return createWorld41VideoDefinition();
  }
  return createWorld11Definition();
}

export function createCollisionWorld(level: LevelDefinition): CollisionWorld {
  const solidIds = new Set<number>(SOLID_TILE_IDS);
  return {
    isSolidAtPixel(x, y) {
      if (x < 0 || y < 0) {
        return true;
      }
      const tileX = Math.floor(x / TILE_SIZE);
      const tileY = Math.floor(y / TILE_SIZE);
      if (tileY >= level.heightTiles) {
        return false;
      }
      if (tileX < 0 || tileX >= level.widthTiles) {
        return true;
      }
      return solidIds.has(level.solidLayer[tileY][tileX]);
    },
  };
}

function derivePipes(solid: number[][]): Array<{ x: number; topY: number; height: number }> {
  const pipes: Array<{ x: number; topY: number; height: number }> = [];
  for (let y = 0; y < solid.length; y += 1) {
    for (let x = 0; x < solid[0].length - 1; x += 1) {
      if (solid[y][x] !== TILE_PIPE_TOP_LEFT || solid[y][x + 1] !== TILE_PIPE_TOP_RIGHT) {
        continue;
      }

      let height = 1;
      while (
        y + height < solid.length &&
        solid[y + height][x] === TILE_PIPE_BODY_LEFT &&
        solid[y + height][x + 1] === TILE_PIPE_BODY_RIGHT
      ) {
        height += 1;
      }

      pipes.push({ x, topY: y, height });
    }
  }
  return pipes;
}

function createLayer(width: number, height: number, fill: number): number[][] {
  return Array.from({ length: height }, () => Array.from({ length: width }, () => fill));
}

function normalizeGroundEnemySpawnTileX(
  solid: number[][],
  solidIds: Set<number>,
  tileX: number,
  tileY: number,
  direction: -1 | 1,
  kind: 'goomba' | 'koopa' | 'spiny' | 'lakitu' | 'piranha',
): number {
  if (kind === 'lakitu' || kind === 'piranha') {
    return tileX;
  }
  if (hasGroundSupportAt(solid, solidIds, tileX, tileY)) {
    return tileX;
  }

  const preferredStep = direction < 0 ? 1 : -1;
  for (let distance = 1; distance <= 4; distance += 1) {
    const preferredX = tileX + preferredStep * distance;
    if (hasGroundSupportAt(solid, solidIds, preferredX, tileY)) {
      return preferredX;
    }

    const alternateX = tileX - preferredStep * distance;
    if (hasGroundSupportAt(solid, solidIds, alternateX, tileY)) {
      return alternateX;
    }
  }

  return tileX;
}

function hasGroundSupportAt(solid: number[][], solidIds: Set<number>, tileX: number, tileY: number): boolean {
  if (tileY < 0 || tileY + 1 >= solid.length || tileX < 0 || tileX >= solid[0].length) {
    return false;
  }
  return solidIds.has(solid[tileY][tileX]) && solidIds.has(solid[tileY + 1][tileX]);
}

function flattenGroundSpan(solid: number[][], xFrom: number, xTo: number, groundY: number): void {
  const clampedFrom = Math.max(0, xFrom);
  const clampedTo = Math.min((solid[0]?.length ?? 0) - 1, xTo);
  for (let x = clampedFrom; x <= clampedTo; x += 1) {
    if (solid[groundY]?.[x] === TILE_EMPTY) {
      solid[groundY][x] = TILE_GROUND_TOP;
    }
    for (let y = groundY + 1; y < solid.length; y += 1) {
      if (solid[y]?.[x] === TILE_EMPTY) {
        solid[y][x] = TILE_GROUND_FILL;
      }
    }
  }
}

function carvePipeColumns(
  solid: number[][],
  pipes: Array<{ x: number; topY: number; height: number }>,
): void {
  pipes.forEach((pipe) => {
    const leftX = pipe.x;
    const rightX = pipe.x + 1;
    for (let i = 0; i < pipe.height; i += 1) {
      const y = pipe.topY + i;
      if (y < 0 || y >= solid.length || leftX < 0 || rightX >= solid[0].length) {
        continue;
      }
      if (i === 0) {
        solid[y][leftX] = TILE_PIPE_TOP_LEFT;
        solid[y][rightX] = TILE_PIPE_TOP_RIGHT;
      } else {
        solid[y][leftX] = TILE_PIPE_BODY_LEFT;
        solid[y][rightX] = TILE_PIPE_BODY_RIGHT;
      }
    }
  });
}

function addFlagpoleColumn(solid: number[][], tileX: number, groundY: number, poleHeight: number): void {
  const topY = Math.max(0, groundY - poleHeight);
  const bottomY = Math.min(solid.length - 1, groundY - 1);
  if (tileX < 0 || tileX >= solid[0].length) {
    return;
  }
  for (let y = topY; y <= bottomY; y += 1) {
    solid[y][tileX] = TILE_FLAGPOLE;
  }
}

function injectWorld41ReferencePlatforms(solid: number[][]): void {
  const brickRuns = [
    { y: 6, x1: 44, x2: 51 },
    { y: 6, x1: 55, x2: 61 },
    { y: 7, x1: 61, x2: 64 },
    { y: 8, x1: 66, x2: 73 },
  ];
  brickRuns.forEach((run) => {
    for (let x = run.x1; x <= run.x2; x += 1) {
      if (run.y >= 0 && run.y < solid.length && x >= 0 && x < solid[0].length) {
        solid[run.y][x] = TILE_BRICK;
      }
    }
  });
}

function injectWorld41ReferenceBlocks(blocks: BlockDefinition[], solid: number[][]): void {
  const variants: BlockDefinition[] = [
    { x: 40, y: 6, kind: 'question', contains: 'coin' },
    { x: 42, y: 8, kind: 'question', contains: 'coin' },
    { x: 45, y: 8, kind: 'question', contains: 'coin' },
    { x: 69, y: 7, kind: 'question', contains: 'coin' },
    { x: 71, y: 7, kind: 'question', contains: 'coin' },
    { x: 68, y: 8, kind: 'question', contains: 'coin' },
    { x: 70, y: 8, kind: 'question', contains: 'coin' },
  ];

  variants.forEach((block) => {
    const existing = blocks.find((candidate) => candidate.x === block.x && candidate.y === block.y);
    if (!existing) {
      blocks.push(block);
    } else {
      existing.kind = block.kind;
      existing.contains = block.contains;
    }

    if (block.y >= 0 && block.y < solid.length && block.x >= 0 && block.x < solid[0].length) {
      solid[block.y][block.x] = TILE_QUESTION;
    }
  });
}
