import Phaser from 'phaser';
import {
  TILE_BRICK,
  TILE_CASTLE,
  TILE_FLAG,
  TILE_FLAGPOLE,
  TILE_GROUND_FILL,
  TILE_GROUND_TOP,
  TILE_PIPE_BODY_LEFT,
  TILE_PIPE_BODY_RIGHT,
  TILE_PIPE_TOP_LEFT,
  TILE_PIPE_TOP_RIGHT,
  TILE_QUESTION,
  TILE_QUESTION_USED,
  TILE_STAIR,
} from '../core/constants';

export function ensureFallbackTextures(scene: Phaser.Scene): void {
  if (!scene.textures.exists('tiles_fallback')) {
    const tileCount = 14;
    const texture = scene.textures.createCanvas('tiles_fallback', 16 * tileCount, 16);
    if (!texture) {
      return;
    }
    const ctx = texture.getContext();

    ctx.clearRect(0, 0, texture.width, texture.height);

    drawTile(ctx, TILE_GROUND_TOP, '#d89048', '#8c5a21', '#4f3a1f');
    drawTile(ctx, TILE_GROUND_FILL, '#8c5a21', '#6d4618', '#4f3a1f');
    drawBrick(ctx, TILE_BRICK);
    drawQuestion(ctx, TILE_QUESTION, '#daa520');
    drawQuestion(ctx, TILE_QUESTION_USED, '#b4884f');
    drawPipe(ctx, TILE_PIPE_TOP_LEFT, '#5ac85a', '#1f7e1f', true, true);
    drawPipe(ctx, TILE_PIPE_TOP_RIGHT, '#50b950', '#1f7e1f', false, true);
    drawPipe(ctx, TILE_PIPE_BODY_LEFT, '#4ab44a', '#1f7e1f', true, false);
    drawPipe(ctx, TILE_PIPE_BODY_RIGHT, '#40a840', '#1f7e1f', false, false);
    drawPole(ctx, TILE_FLAGPOLE);
    drawFlag(ctx, TILE_FLAG);
    drawCastle(ctx, TILE_CASTLE);
    drawBrick(ctx, TILE_STAIR);

    texture.refresh();
  }

  createEntityTexture(scene, 'mario_small_idle', '#ff5c4d', '#9f3225');
  createEntityTexture(scene, 'mario_small_walk_a', '#ff5c4d', '#9f3225', true);
  createEntityTexture(scene, 'mario_small_walk_b', '#ff5c4d', '#9f3225', false, true);
  createEntityTexture(scene, 'mario_small_walk_c', '#ff5c4d', '#9f3225', true, false, 16, 16, true);
  createEntityTexture(scene, 'mario_small_jump', '#ff5c4d', '#9f3225', true, true);
  createEntityTexture(scene, 'mario_small_skid', '#ff5c4d', '#9f3225', true, false, 16, 16, true, true);
  createEntityTexture(scene, 'mario_small_turn', '#ff5c4d', '#9f3225', false, false, 16, 16, true);
  createEntityTexture(scene, 'mario_small_pole', '#ff5c4d', '#9f3225');
  createEntityTexture(scene, 'mario_small_dead', '#ff5c4d', '#9f3225', false, false, 16, 16, false, true);
  createEntityTexture(scene, 'mario_small_victory', '#ff5c4d', '#9f3225', false, false, 16, 16, true);
  createEntityTexture(scene, 'mario_small_castle_entry', '#ff5c4d', '#9f3225', false, false, 16, 16, true, true);

  createEntityTexture(scene, 'mario_super_idle', '#4dc4ff', '#225f86', true, false, 16, 20);
  createEntityTexture(scene, 'mario_super_walk_a', '#4dc4ff', '#225f86', true, false, 16, 20, true);
  createEntityTexture(scene, 'mario_super_walk_b', '#4dc4ff', '#225f86', true, false, 16, 20, false, true);
  createEntityTexture(scene, 'mario_super_walk_c', '#4dc4ff', '#225f86', true, false, 16, 20, true);
  createEntityTexture(scene, 'mario_super_jump', '#4dc4ff', '#225f86', true, false, 16, 20, true, true);
  createEntityTexture(scene, 'mario_super_skid', '#4dc4ff', '#225f86', true, false, 16, 20, true, true);
  createEntityTexture(scene, 'mario_super_duck', '#4dc4ff', '#225f86', true, false, 16, 20);
  createEntityTexture(scene, 'mario_super_turn', '#4dc4ff', '#225f86', true, false, 16, 20, true);
  createEntityTexture(scene, 'mario_super_pole', '#4dc4ff', '#225f86', true, false, 16, 20);
  createEntityTexture(scene, 'mario_super_victory', '#4dc4ff', '#225f86', true, false, 16, 20, true);
  createEntityTexture(scene, 'mario_super_castle_entry', '#4dc4ff', '#225f86', true, false, 16, 20, true, true);

  createEntityTexture(scene, 'mario_fire_idle', '#ffe066', '#9f3225', true, true, 16, 20);
  createEntityTexture(scene, 'mario_fire_walk_a', '#ffe066', '#9f3225', true, true, 16, 20, true);
  createEntityTexture(scene, 'mario_fire_walk_b', '#ffe066', '#9f3225', true, true, 16, 20, false, true);
  createEntityTexture(scene, 'mario_fire_walk_c', '#ffe066', '#9f3225', true, true, 16, 20, true);
  createEntityTexture(scene, 'mario_fire_jump', '#ffe066', '#9f3225', true, true, 16, 20, true, true);
  createEntityTexture(scene, 'mario_fire_skid', '#ffe066', '#9f3225', true, true, 16, 20, true, true);
  createEntityTexture(scene, 'mario_fire_duck', '#ffe066', '#9f3225', true, true, 16, 20);
  createEntityTexture(scene, 'mario_fire_turn', '#ffe066', '#9f3225', true, true, 16, 20, true);
  createEntityTexture(scene, 'mario_fire_pole', '#ffe066', '#9f3225', true, true, 16, 20);
  createEntityTexture(scene, 'mario_fire_victory', '#ffe066', '#9f3225', true, true, 16, 20, true);
  createEntityTexture(scene, 'mario_fire_castle_entry', '#ffe066', '#9f3225', true, true, 16, 20, true, true);

  createEnemyTexture(scene, 'goomba_walk_a', '#b5783d', '#613311', true);
  createEnemyTexture(scene, 'goomba_walk_b', '#b5783d', '#613311', false);
  createEnemyTexture(scene, 'goomba_squash', '#b5783d', '#613311', false);
  createEnemyTexture(scene, 'koopa_walk_a', '#4ab44a', '#225f22', true, 16, 24);
  createEnemyTexture(scene, 'koopa_walk_b', '#4ab44a', '#225f22', false, 16, 24);
  createEnemyTexture(scene, 'koopa_wing_a', '#4ab44a', '#225f22', true, 16, 24);
  createEnemyTexture(scene, 'koopa_wing_b', '#4ab44a', '#225f22', false, 16, 24);
  createEnemyTexture(scene, 'koopa_shell', '#4ab44a', '#225f22', true);
  createEnemyTexture(scene, 'koopa_shell_spin_a', '#4ab44a', '#225f22', true);
  createEnemyTexture(scene, 'koopa_shell_spin_b', '#4ab44a', '#225f22', false);
  createEnemyTexture(scene, 'lakitu_cloud_a', '#f5f5f5', '#3ea34b', true, 16, 24);
  createEnemyTexture(scene, 'lakitu_cloud_b', '#f5f5f5', '#3ea34b', false, 16, 24);
  createEnemyTexture(scene, 'lakitu_throw_a', '#f5f5f5', '#3ea34b', true, 16, 24);
  createEnemyTexture(scene, 'lakitu_throw_b', '#f5f5f5', '#3ea34b', false, 16, 24);
  createEnemyTexture(scene, 'spiny_egg', '#d74646', '#f4f4f4', true);
  createEnemyTexture(scene, 'spiny_walk_a', '#d74646', '#f4f4f4', true);
  createEnemyTexture(scene, 'spiny_walk_b', '#d74646', '#f4f4f4', false);
  createEnemyTexture(scene, 'piranha_up_a', '#47b847', '#f4f4f4', true, 16, 24);
  createEnemyTexture(scene, 'piranha_up_b', '#47b847', '#f4f4f4', false, 16, 24);
  createEnemyTexture(scene, 'piranha_down_a', '#47b847', '#f4f4f4', true, 16, 24);
  createEnemyTexture(scene, 'piranha_down_b', '#47b847', '#f4f4f4', false, 16, 24);

  createItemTexture(scene, 'item_mushroom', '#ff6d48', '#fff8d8');
  createItemTexture(scene, 'item_fireflower', '#ffd95c', '#ff5c5c');
  createItemTexture(scene, 'coin_pickup_a', '#ffd95c', '#fff2b0');
  createItemTexture(scene, 'coin_pickup_b', '#ffcf42', '#fff2b0');
  createItemTexture(scene, 'coin_pickup_c', '#ffc52f', '#fff2b0');
  createItemTexture(scene, 'coin_pickup_d', '#ffcf42', '#fff2b0');
  createFireballTexture(scene, 'fireball_a', '#ff7d2f', '#ffe07a');
  createFireballTexture(scene, 'fireball_b', '#ffb13a', '#fff3a8');
  createFireballHitTexture(scene, 'fireball_hit', '#fff5c8', '#ff9c3d');
}

function drawTile(ctx: CanvasRenderingContext2D, index: number, fill: string, line: string, shadow: string): void {
  const x = index * 16;
  ctx.fillStyle = fill;
  ctx.fillRect(x, 0, 16, 16);
  ctx.fillStyle = line;
  ctx.fillRect(x, 0, 16, 2);
  ctx.fillStyle = shadow;
  for (let py = 2; py < 16; py += 4) {
    ctx.fillRect(x + 1, py, 2, 1);
    ctx.fillRect(x + 6, py + 1, 2, 1);
    ctx.fillRect(x + 11, py, 2, 1);
  }
}

function drawBrick(ctx: CanvasRenderingContext2D, index: number): void {
  const x = index * 16;
  ctx.fillStyle = '#b56f32';
  ctx.fillRect(x, 0, 16, 16);
  ctx.fillStyle = '#713f16';
  for (let y = 3; y < 16; y += 4) {
    ctx.fillRect(x, y, 16, 1);
  }
  ctx.fillRect(x + 7, 0, 1, 16);
}

function drawQuestion(ctx: CanvasRenderingContext2D, index: number, fill: string): void {
  const x = index * 16;
  ctx.fillStyle = fill;
  ctx.fillRect(x, 0, 16, 16);
  ctx.fillStyle = '#8d6312';
  ctx.fillRect(x, 2, 16, 1);
  ctx.fillRect(x, 13, 16, 1);
  ctx.fillRect(x + 4, 4, 8, 2);
  ctx.fillRect(x + 5, 7, 2, 2);
  ctx.fillRect(x + 8, 7, 2, 5);
}

function drawPipe(
  ctx: CanvasRenderingContext2D,
  index: number,
  fill: string,
  line: string,
  leftColumn: boolean,
  topCap: boolean,
): void {
  const x = index * 16;
  ctx.fillStyle = fill;
  ctx.fillRect(x, 0, 16, 16);
  ctx.fillStyle = line;
  if (topCap) {
    ctx.fillRect(x, 0, 16, 3);
  }
  ctx.fillRect(leftColumn ? x + 2 : x + 12, 0, 2, 16);
}

function drawPole(ctx: CanvasRenderingContext2D, index: number): void {
  const x = index * 16;
  ctx.fillStyle = '#f9f9f9';
  ctx.fillRect(x + 7, 0, 2, 16);
}

function drawFlag(ctx: CanvasRenderingContext2D, index: number): void {
  const x = index * 16;
  ctx.fillStyle = '#f9f9f9';
  ctx.fillRect(x + 1, 1, 2, 4);
  ctx.fillStyle = '#3bc8ff';
  ctx.fillRect(x + 3, 1, 10, 6);
  ctx.fillStyle = '#f9f9f9';
  ctx.fillRect(x + 7, 3, 3, 3);
}

function drawCastle(ctx: CanvasRenderingContext2D, index: number): void {
  const x = index * 16;
  ctx.fillStyle = '#9f9f9f';
  ctx.fillRect(x, 0, 16, 16);
  ctx.fillStyle = '#656565';
  for (let yy = 2; yy < 16; yy += 4) {
    ctx.fillRect(x + 1, yy, 2, 1);
    ctx.fillRect(x + 6, yy + 1, 2, 1);
    ctx.fillRect(x + 11, yy, 2, 1);
  }
}

function createEntityTexture(
  scene: Phaser.Scene,
  key: string,
  fill: string,
  accent: string,
  tall = false,
  hat = false,
  width = 16,
  height = 16,
  stepA = false,
  stepB = false,
): void {
  if (scene.textures.exists(key)) {
    return;
  }
  const texture = scene.textures.createCanvas(key, width, height);
  if (!texture) {
    return;
  }
  const ctx = texture.getContext();

  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = fill;
  ctx.fillRect(3, tall ? 4 : 5, 10, tall ? 14 : 10);
  ctx.fillStyle = accent;
  ctx.fillRect(4, tall ? 2 : 3, 8, 3);
  if (hat) {
    ctx.fillRect(2, 1, 12, 2);
  }
  if (stepA) {
    ctx.fillRect(3, height - 2, 4, 2);
    ctx.fillRect(9, height - 1, 4, 1);
  } else if (stepB) {
    ctx.fillRect(3, height - 1, 4, 1);
    ctx.fillRect(9, height - 2, 4, 2);
  } else {
    ctx.fillRect(3, height - 2, 10, 2);
  }

  texture.refresh();
}

function createEnemyTexture(
  scene: Phaser.Scene,
  key: string,
  fill: string,
  accent: string,
  leftLeg: boolean,
  width = 16,
  height = 16,
): void {
  if (scene.textures.exists(key)) {
    return;
  }
  const texture = scene.textures.createCanvas(key, width, height);
  if (!texture) {
    return;
  }
  const ctx = texture.getContext();

  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = fill;
  const bodyTop = height > 16 ? 3 : 5;
  ctx.fillRect(2, bodyTop, 12, height - bodyTop - 2);
  ctx.fillStyle = accent;
  ctx.fillRect(3, bodyTop + 1, 10, 2);
  ctx.fillRect(leftLeg ? 3 : 9, height - 3, 3, 2);
  ctx.fillRect(leftLeg ? 9 : 3, height - 4, 3, 3);

  texture.refresh();
}

function createItemTexture(scene: Phaser.Scene, key: string, cap: string, body: string): void {
  if (scene.textures.exists(key)) {
    return;
  }
  const texture = scene.textures.createCanvas(key, 16, 16);
  if (!texture) {
    return;
  }
  const ctx = texture.getContext();

  ctx.clearRect(0, 0, 16, 16);
  ctx.fillStyle = cap;
  ctx.fillRect(2, 3, 12, 6);
  ctx.fillStyle = body;
  ctx.fillRect(4, 9, 8, 5);

  texture.refresh();
}

function createFireballTexture(scene: Phaser.Scene, key: string, outer: string, core: string): void {
  if (scene.textures.exists(key)) {
    return;
  }
  const texture = scene.textures.createCanvas(key, 8, 8);
  if (!texture) {
    return;
  }
  const ctx = texture.getContext();

  ctx.clearRect(0, 0, 8, 8);
  ctx.fillStyle = outer;
  ctx.fillRect(1, 1, 6, 6);
  ctx.fillStyle = core;
  ctx.fillRect(2, 2, 4, 4);
  texture.refresh();
}

function createFireballHitTexture(scene: Phaser.Scene, key: string, outer: string, core: string): void {
  if (scene.textures.exists(key)) {
    return;
  }
  const texture = scene.textures.createCanvas(key, 10, 10);
  if (!texture) {
    return;
  }
  const ctx = texture.getContext();

  ctx.clearRect(0, 0, 10, 10);
  ctx.fillStyle = outer;
  ctx.fillRect(2, 2, 6, 6);
  ctx.fillStyle = core;
  ctx.fillRect(0, 4, 10, 2);
  ctx.fillRect(4, 0, 2, 10);
  texture.refresh();
}
