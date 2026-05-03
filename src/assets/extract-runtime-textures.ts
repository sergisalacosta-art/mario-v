import Phaser from 'phaser';
import {
  TILE_BRICK,
  TILE_CASTLE,
  TILE_EMPTY,
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
  TILE_SIZE,
  WORLD_Y_OFFSET,
} from '../core/constants';

interface ExtractJob {
  sourceKey: string;
  targetKey: string;
  x: number;
  y: number;
  w: number;
  h: number;
  clearBg?: boolean;
  chromaKey?: [number, number, number];
  snapOpaqueBottom?: boolean;
}

const JOBS: ExtractJob[] = [
  { sourceKey: 'smas_mario_luigi', targetKey: 'mario_small_idle', x: 2, y: 24, w: 16, h: 16 },
  { sourceKey: 'smas_mario_luigi', targetKey: 'mario_small_walk_a', x: 26, y: 24, w: 16, h: 16 },
  { sourceKey: 'smas_mario_luigi', targetKey: 'mario_small_walk_b', x: 43, y: 24, w: 16, h: 16 },
  { sourceKey: 'smas_mario_luigi', targetKey: 'mario_small_walk_c', x: 60, y: 24, w: 16, h: 16 },
  { sourceKey: 'smas_mario_luigi', targetKey: 'mario_small_jump', x: 85, y: 24, w: 16, h: 16 },
  { sourceKey: 'smas_mario_luigi', targetKey: 'mario_small_skid', x: 109, y: 24, w: 16, h: 16 },
  { sourceKey: 'smas_mario_luigi', targetKey: 'mario_small_turn', x: 60, y: 24, w: 16, h: 16 },
  { sourceKey: 'smas_mario_luigi', targetKey: 'mario_small_pole', x: 4, y: 53, w: 16, h: 16 },
  { sourceKey: 'smas_mario_luigi', targetKey: 'mario_small_dead', x: 21, y: 54, w: 16, h: 16 },
  { sourceKey: 'smas_mario_luigi', targetKey: 'mario_small_victory', x: 71, y: 53, w: 16, h: 16 },
  { sourceKey: 'smas_mario_luigi', targetKey: 'mario_small_castle_entry', x: 96, y: 53, w: 16, h: 16 },
  // Super Mario: clean sheet from MarioUniverse (mario.gif)
  { sourceKey: 'smas_mario_super_alt', targetKey: 'mario_super_idle', x: 79, y: 34, w: 16, h: 32 },
  { sourceKey: 'smas_mario_super_alt', targetKey: 'mario_super_walk_a', x: 98, y: 35, w: 16, h: 32 },
  { sourceKey: 'smas_mario_super_alt', targetKey: 'mario_super_walk_b', x: 116, y: 35, w: 16, h: 32 },
  { sourceKey: 'smas_mario_super_alt', targetKey: 'mario_super_walk_c', x: 136, y: 36, w: 16, h: 32 },
  { sourceKey: 'smas_mario_super_alt', targetKey: 'mario_super_jump', x: 40, y: 36, w: 16, h: 32 },
  { sourceKey: 'smas_mario_super_alt', targetKey: 'mario_super_skid', x: 174, y: 36, w: 16, h: 32 },
  { sourceKey: 'smas_mario_super_alt', targetKey: 'mario_super_duck', x: 20, y: 2, w: 16, h: 32 },
  { sourceKey: 'smas_mario_super_alt', targetKey: 'mario_super_turn', x: 59, y: 36, w: 16, h: 32 },
  { sourceKey: 'smas_mario_super_alt', targetKey: 'mario_super_pole', x: 39, y: 2, w: 16, h: 32 },
  { sourceKey: 'smas_mario_super_alt', targetKey: 'mario_super_victory', x: 58, y: 5, w: 16, h: 32 },
  { sourceKey: 'smas_mario_super_alt', targetKey: 'mario_super_castle_entry', x: 100, y: 4, w: 16, h: 32 },
  // Fire Mario: clean sheet from MarioUniverse (mario-2.gif)
  { sourceKey: 'smas_mario_fire_alt', targetKey: 'mario_fire_idle', x: 79, y: 31, w: 16, h: 32 },
  { sourceKey: 'smas_mario_fire_alt', targetKey: 'mario_fire_walk_a', x: 98, y: 32, w: 16, h: 32 },
  { sourceKey: 'smas_mario_fire_alt', targetKey: 'mario_fire_walk_b', x: 116, y: 32, w: 16, h: 32 },
  { sourceKey: 'smas_mario_fire_alt', targetKey: 'mario_fire_walk_c', x: 136, y: 33, w: 16, h: 32 },
  { sourceKey: 'smas_mario_fire_alt', targetKey: 'mario_fire_jump', x: 40, y: 33, w: 16, h: 32 },
  { sourceKey: 'smas_mario_fire_alt', targetKey: 'mario_fire_skid', x: 174, y: 33, w: 16, h: 32 },
  { sourceKey: 'smas_mario_fire_alt', targetKey: 'mario_fire_duck', x: 20, y: 0, w: 16, h: 32 },
  { sourceKey: 'smas_mario_fire_alt', targetKey: 'mario_fire_turn', x: 59, y: 33, w: 16, h: 32 },
  { sourceKey: 'smas_mario_fire_alt', targetKey: 'mario_fire_pole', x: 39, y: 0, w: 16, h: 32 },
  { sourceKey: 'smas_mario_fire_alt', targetKey: 'mario_fire_victory', x: 58, y: 2, w: 16, h: 32 },
  { sourceKey: 'smas_mario_fire_alt', targetKey: 'mario_fire_castle_entry', x: 100, y: 1, w: 16, h: 32 },

  {
    sourceKey: 'smas_title_screens',
    targetKey: 'screen_title_logo_main',
    x: 5,
    y: 220,
    w: 208,
    h: 96,
    chromaKey: [0, 165, 165],
    clearBg: false,
  },
  {
    sourceKey: 'smas_title_screens',
    targetKey: 'screen_title_logo_alt',
    x: 225,
    y: 220,
    w: 208,
    h: 96,
    chromaKey: [0, 165, 165],
    clearBg: false,
  },
  {
    sourceKey: 'smas_game_over_screens',
    targetKey: 'screen_game_over',
    x: 6,
    y: 24,
    w: 256,
    h: 224,
    clearBg: false,
  },
  {
    sourceKey: 'smas_game_over_screens',
    targetKey: 'screen_time_up',
    x: 266,
    y: 24,
    w: 256,
    h: 224,
    clearBg: false,
  },
  {
    sourceKey: 'smas_game_over_screens',
    targetKey: 'screen_game_over_cursor',
    x: 74,
    y: 126,
    w: 12,
    h: 9,
  },

  {
    sourceKey: 'smas_enemies',
    targetKey: 'goomba_walk_a',
    x: 1,
    y: 45,
    w: 16,
    h: 16,
    chromaKey: [0, 64, 64],
    clearBg: true,
  },
  {
    sourceKey: 'smas_enemies',
    targetKey: 'goomba_walk_b',
    x: 18,
    y: 45,
    w: 16,
    h: 16,
    chromaKey: [0, 64, 64],
    clearBg: true,
  },
  {
    sourceKey: 'smas_enemies',
    targetKey: 'goomba_squash',
    x: 35,
    y: 45,
    w: 16,
    h: 16,
    chromaKey: [0, 64, 64],
    clearBg: true,
  },
  {
    sourceKey: 'smas_enemies',
    targetKey: 'goomba_flip',
    x: 1,
    y: 45,
    w: 16,
    h: 16,
    chromaKey: [0, 64, 64],
    clearBg: true,
  },
  {
    sourceKey: 'smas_enemies',
    targetKey: 'koopa_walk_a',
    x: 52,
    y: 37,
    w: 16,
    h: 24,
    chromaKey: [0, 64, 64],
    clearBg: true,
  },
  {
    sourceKey: 'smas_enemies',
    targetKey: 'koopa_walk_b',
    x: 69,
    y: 37,
    w: 16,
    h: 24,
    chromaKey: [0, 64, 64],
    clearBg: true,
  },
  {
    sourceKey: 'smas_enemies',
    targetKey: 'koopa_wing_a',
    x: 86,
    y: 37,
    w: 16,
    h: 24,
    chromaKey: [0, 64, 64],
    clearBg: true,
  },
  {
    sourceKey: 'smas_enemies',
    targetKey: 'koopa_wing_b',
    x: 103,
    y: 37,
    w: 16,
    h: 24,
    chromaKey: [0, 64, 64],
    clearBg: true,
  },
  {
    sourceKey: 'smas_enemies',
    targetKey: 'koopa_shell',
    x: 120,
    y: 45,
    w: 16,
    h: 16,
    chromaKey: [0, 64, 64],
    clearBg: true,
  },
  {
    sourceKey: 'smas_enemies',
    targetKey: 'koopa_shell_spin_a',
    x: 137,
    y: 45,
    w: 16,
    h: 16,
    chromaKey: [0, 64, 64],
    clearBg: true,
  },
  {
    sourceKey: 'smas_enemies',
    targetKey: 'koopa_shell_spin_b',
    x: 171,
    y: 45,
    w: 16,
    h: 16,
    chromaKey: [0, 64, 64],
    clearBg: true,
  },
  {
    sourceKey: 'smas_enemies',
    targetKey: 'koopa_flip',
    x: 307,
    y: 45,
    w: 16,
    h: 16,
    chromaKey: [0, 64, 64],
    clearBg: true,
  },
  {
    sourceKey: 'smas_enemies_mariouniverse',
    targetKey: 'lakitu_cloud_a',
    x: 117,
    y: 203,
    w: 16,
    h: 24,
    chromaKey: [248, 0, 248],
    clearBg: true,
  },
  {
    sourceKey: 'smas_enemies_mariouniverse',
    targetKey: 'lakitu_cloud_b',
    x: 153,
    y: 203,
    w: 16,
    h: 24,
    chromaKey: [248, 0, 248],
    clearBg: true,
  },
  {
    sourceKey: 'smas_enemies_mariouniverse',
    targetKey: 'lakitu_throw_a',
    x: 117,
    y: 203,
    w: 16,
    h: 24,
    chromaKey: [248, 0, 248],
    clearBg: true,
  },
  {
    sourceKey: 'smas_enemies_mariouniverse',
    targetKey: 'lakitu_throw_b',
    x: 153,
    y: 203,
    w: 16,
    h: 24,
    chromaKey: [248, 0, 248],
    clearBg: true,
  },
  {
    sourceKey: 'smas_enemies_mariouniverse',
    targetKey: 'spiny_egg',
    x: 99,
    y: 211,
    w: 16,
    h: 16,
    chromaKey: [248, 0, 248],
    clearBg: true,
  },
  {
    sourceKey: 'smas_enemies_mariouniverse',
    targetKey: 'spiny_walk_a',
    x: 83,
    y: 211,
    w: 16,
    h: 16,
    chromaKey: [248, 0, 248],
    clearBg: true,
  },
  {
    sourceKey: 'smas_enemies_mariouniverse',
    targetKey: 'spiny_walk_b',
    x: 185,
    y: 211,
    w: 16,
    h: 16,
    chromaKey: [248, 0, 248],
    clearBg: true,
  },
  {
    sourceKey: 'smas_enemies_mariouniverse',
    targetKey: 'piranha_up_a',
    x: 125,
    y: 345,
    w: 16,
    h: 24,
    chromaKey: [248, 0, 248],
    clearBg: true,
  },
  {
    sourceKey: 'smas_enemies_mariouniverse',
    targetKey: 'piranha_up_b',
    x: 145,
    y: 345,
    w: 16,
    h: 24,
    chromaKey: [248, 0, 248],
    clearBg: true,
  },
  {
    sourceKey: 'smas_enemies_mariouniverse',
    targetKey: 'piranha_down_a',
    x: 125,
    y: 345,
    w: 16,
    h: 24,
    chromaKey: [248, 0, 248],
    clearBg: true,
  },
  {
    sourceKey: 'smas_enemies_mariouniverse',
    targetKey: 'piranha_down_b',
    x: 145,
    y: 345,
    w: 16,
    h: 24,
    chromaKey: [248, 0, 248],
    clearBg: true,
  },

  { sourceKey: 'smas_items_blocks', targetKey: 'item_mushroom', x: 2, y: 2, w: 16, h: 16 },
  { sourceKey: 'smas_items_blocks', targetKey: 'item_fireflower', x: 19, y: 2, w: 16, h: 16 },
  { sourceKey: 'smas_items_blocks', targetKey: 'item_mushroom_green', x: 36, y: 2, w: 16, h: 16 },
  { sourceKey: 'smas_items_blocks', targetKey: 'item_mushroom_blue', x: 53, y: 2, w: 16, h: 16 },
  { sourceKey: 'smas_items_blocks', targetKey: 'item_fireflower_green', x: 2, y: 19, w: 16, h: 16 },
  { sourceKey: 'smas_items_blocks', targetKey: 'item_fireflower_red', x: 36, y: 19, w: 16, h: 16 },
  { sourceKey: 'smas_items_blocks', targetKey: 'item_star_yellow', x: 2, y: 36, w: 16, h: 16 },
  { sourceKey: 'smas_items_blocks', targetKey: 'item_star_green', x: 19, y: 36, w: 16, h: 16 },
  { sourceKey: 'smas_items_blocks', targetKey: 'item_star_red', x: 36, y: 36, w: 16, h: 16 },
  { sourceKey: 'smas_items_blocks', targetKey: 'item_star_yellow_alt', x: 53, y: 36, w: 16, h: 16 },
  {
    sourceKey: 'smas_items_coins_mariouniverse',
    targetKey: 'coin_pickup_a',
    x: 8,
    y: 75,
    w: 16,
    h: 16,
    chromaKey: [0, 72, 72],
    clearBg: true,
  },
  {
    sourceKey: 'smas_items_coins_mariouniverse',
    targetKey: 'coin_pickup_b',
    x: 26,
    y: 75,
    w: 16,
    h: 16,
    chromaKey: [0, 72, 72],
    clearBg: true,
  },
  {
    sourceKey: 'smas_items_coins_mariouniverse',
    targetKey: 'coin_pickup_c',
    x: 44,
    y: 75,
    w: 16,
    h: 16,
    chromaKey: [0, 72, 72],
    clearBg: true,
  },
  {
    sourceKey: 'smas_items_coins_mariouniverse',
    targetKey: 'coin_pickup_d',
    x: 62,
    y: 75,
    w: 16,
    h: 16,
    chromaKey: [0, 72, 72],
    clearBg: true,
  },
  { sourceKey: 'smas_items_blocks', targetKey: 'block_question_a', x: 2, y: 96, w: 16, h: 16, clearBg: false },
  { sourceKey: 'smas_items_blocks', targetKey: 'block_question_b', x: 19, y: 96, w: 16, h: 16, clearBg: false },
  { sourceKey: 'smas_items_blocks', targetKey: 'block_question_c', x: 36, y: 96, w: 16, h: 16, clearBg: false },
  { sourceKey: 'smas_items_blocks', targetKey: 'block_question_used_brown', x: 2, y: 113, w: 16, h: 16, clearBg: false },
  { sourceKey: 'smas_items_blocks', targetKey: 'block_question_used_blue', x: 2, y: 130, w: 16, h: 16, clearBg: false },
  { sourceKey: 'smas_items_blocks', targetKey: 'block_question_used_gray', x: 2, y: 147, w: 16, h: 16, clearBg: false },
  { sourceKey: 'smas_items_blocks', targetKey: 'block_brick_brown_a', x: 19, y: 113, w: 16, h: 16, clearBg: false },
  { sourceKey: 'smas_items_blocks', targetKey: 'block_brick_brown_b', x: 36, y: 113, w: 16, h: 16, clearBg: false },
  { sourceKey: 'smas_items_blocks', targetKey: 'block_brick_blue_a', x: 19, y: 130, w: 16, h: 16, clearBg: false },
  { sourceKey: 'smas_items_blocks', targetKey: 'block_brick_blue_b', x: 36, y: 130, w: 16, h: 16, clearBg: false },
  { sourceKey: 'smas_items_blocks', targetKey: 'block_brick_gray_a', x: 19, y: 147, w: 16, h: 16, clearBg: false },
  { sourceKey: 'smas_items_blocks', targetKey: 'block_brick_gray_b', x: 36, y: 147, w: 16, h: 16, clearBg: false },
  { sourceKey: 'smas_items_blocks', targetKey: 'coin_pop_a', x: 1, y: 48, w: 16, h: 16 },
  { sourceKey: 'smas_items_blocks', targetKey: 'coin_pop_b', x: 18, y: 48, w: 16, h: 16 },
  { sourceKey: 'smas_items_blocks', targetKey: 'coin_pop_c', x: 52, y: 48, w: 16, h: 16 },
  { sourceKey: 'smas_items_blocks', targetKey: 'sparkle_a', x: 69, y: 48, w: 16, h: 16 },
  { sourceKey: 'smas_items_blocks', targetKey: 'sparkle_b', x: 86, y: 48, w: 16, h: 16 },
  { sourceKey: 'smas_items_blocks', targetKey: 'sparkle_c', x: 103, y: 48, w: 16, h: 16 },
  { sourceKey: 'smas_items_blocks', targetKey: 'brick_debris_a', x: 52, y: 112, w: 16, h: 16 },
  { sourceKey: 'smas_items_blocks', targetKey: 'brick_debris_b', x: 69, y: 112, w: 16, h: 16 },
  { sourceKey: 'smas_items_blocks', targetKey: 'brick_debris_c', x: 86, y: 112, w: 16, h: 16 },
  { sourceKey: 'smas_items_blocks', targetKey: 'brick_debris_d', x: 103, y: 112, w: 16, h: 16 },
  { sourceKey: 'smas_items_blocks', targetKey: 'block_debris_brown_a', x: 53, y: 113, w: 8, h: 8 },
  { sourceKey: 'smas_items_blocks', targetKey: 'block_debris_brown_b', x: 62, y: 113, w: 8, h: 8 },
  { sourceKey: 'smas_items_blocks', targetKey: 'block_debris_brown_c', x: 71, y: 113, w: 8, h: 8 },
  { sourceKey: 'smas_items_blocks', targetKey: 'block_debris_brown_d', x: 80, y: 113, w: 8, h: 8 },
  { sourceKey: 'smas_items_blocks', targetKey: 'block_debris_blue_a', x: 53, y: 130, w: 8, h: 8 },
  { sourceKey: 'smas_items_blocks', targetKey: 'block_debris_blue_b', x: 62, y: 130, w: 8, h: 8 },
  { sourceKey: 'smas_items_blocks', targetKey: 'block_debris_blue_c', x: 71, y: 130, w: 8, h: 8 },
  { sourceKey: 'smas_items_blocks', targetKey: 'block_debris_blue_d', x: 80, y: 130, w: 8, h: 8 },
  { sourceKey: 'smas_items_blocks', targetKey: 'block_debris_gray_a', x: 53, y: 147, w: 8, h: 8 },
  { sourceKey: 'smas_items_blocks', targetKey: 'block_debris_gray_b', x: 62, y: 147, w: 8, h: 8 },
  { sourceKey: 'smas_items_blocks', targetKey: 'block_debris_gray_c', x: 71, y: 147, w: 8, h: 8 },
  { sourceKey: 'smas_items_blocks', targetKey: 'block_debris_gray_d', x: 80, y: 147, w: 8, h: 8 },
  { sourceKey: 'smas_effects', targetKey: 'fireball_a', x: 2, y: 31, w: 8, h: 8 },
  { sourceKey: 'smas_effects', targetKey: 'fireball_b', x: 11, y: 31, w: 8, h: 8 },
  { sourceKey: 'smas_effects', targetKey: 'fireball_hit', x: 102, y: 31, w: 10, h: 10 },
];

export function extractRuntimeTextures(scene: Phaser.Scene): void {
  JOBS.forEach((job) => {
    tryExtract(scene, job);
  });
  ensureGoombaFlip(scene);
  ensureKoopaFlip(scene);
  ensureFireMarioVariants(scene);
  ensureScorePopupTextures(scene);
  ensureFlagWaveTextures(scene);

  extractRuntimeTileset(scene);

  extractDecorativeLayer(scene, {
    sourceKey: 'smas_clouds_bg',
    targetKey: 'decor_clouds_strip',
    x: 18,
    y: 18,
    w: 3072,
    h: 208,
  });
  extractDecorativeLayer(scene, {
    sourceKey: 'smas_hills_bg_1',
    targetKey: 'decor_hills_strip_a',
    x: 8,
    y: 16,
    w: 1736,
    h: 208,
    chromaKey: [248, 0, 248],
  });
  extractDecorativeLayer(scene, {
    sourceKey: 'smas_hills_bg_2',
    targetKey: 'decor_hills_strip_b',
    x: 8,
    y: 16,
    w: 3320,
    h: 208,
    chromaKey: [248, 0, 248],
  });
}

function ensureGoombaFlip(scene: Phaser.Scene): void {
  if (scene.textures.exists('goomba_flip')) {
    return;
  }
  if (!scene.textures.exists('goomba_walk_a')) {
    return;
  }
  const srcTexture = scene.textures.get('goomba_walk_a');
  const src = srcTexture.getSourceImage() as HTMLImageElement | HTMLCanvasElement | undefined;
  if (!src) {
    return;
  }
  const frame = srcTexture.get();
  const w = frame.width;
  const h = frame.height;
  const canvas = scene.textures.createCanvas('goomba_flip', w, h);
  if (!canvas) {
    return;
  }
  const ctx = canvas.getContext();
  ctx.save();
  ctx.translate(0, h);
  ctx.scale(1, -1);
  ctx.drawImage(src, 0, 0, w, h, 0, 0, w, h);
  ctx.restore();
  canvas.refresh();
}

function ensureKoopaFlip(scene: Phaser.Scene): void {
  if (scene.textures.exists('koopa_flip')) {
    return;
  }
  if (!scene.textures.exists('koopa_walk_a')) {
    return;
  }
  const srcTexture = scene.textures.get('koopa_walk_a');
  const src = srcTexture.getSourceImage() as HTMLImageElement | HTMLCanvasElement | undefined;
  if (!src) {
    return;
  }
  const frame = srcTexture.get();
  const w = frame.width;
  const h = frame.height;
  const canvas = scene.textures.createCanvas('koopa_flip', w, h);
  if (!canvas) {
    return;
  }
  const ctx = canvas.getContext();
  ctx.save();
  ctx.translate(0, h);
  ctx.scale(1, -1);
  ctx.drawImage(src, 0, 0, w, h, 0, 0, w, h);
  ctx.restore();
  canvas.refresh();
}

function ensureScorePopupTextures(scene: Phaser.Scene): void {
  if (!scene.textures.exists('smas_hud_font')) {
    return;
  }
  const sourceTexture = scene.textures.get('smas_hud_font');
  const sourceImage = sourceTexture.getSourceImage() as HTMLImageElement | HTMLCanvasElement | undefined;
  if (!sourceImage) {
    return;
  }
  const DIGIT_ROW_Y = 238;
  const GLYPH_START_X = 4;
  const GLYPH_STEP_X = 10;
  const GLYPH_W = 8;
  const GLYPH_H = 8;

  ['100', '200', '400', '800'].forEach((text) => {
    const key = `score_${text}`;
    if (scene.textures.exists(key)) {
      return;
    }
    const canvas = scene.textures.createCanvas(key, text.length * GLYPH_W, GLYPH_H);
    if (!canvas) {
      return;
    }
    const ctx = canvas.getContext();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < text.length; i += 1) {
      const digit = Number.parseInt(text[i], 10);
      if (!Number.isFinite(digit)) {
        continue;
      }
      const sx = GLYPH_START_X + digit * GLYPH_STEP_X;
      ctx.drawImage(sourceImage, sx, DIGIT_ROW_Y, GLYPH_W, GLYPH_H, i * GLYPH_W, 0, GLYPH_W, GLYPH_H);
    }
    canvas.refresh();
  });
}

function ensureFlagWaveTextures(scene: Phaser.Scene): void {
  if (scene.textures.exists('flag_wave_a') && scene.textures.exists('flag_wave_b')) {
    return;
  }
  const baseTilesKey = scene.textures.exists('tiles_runtime') ? 'tiles_runtime' : scene.textures.exists('tiles_fallback') ? 'tiles_fallback' : null;
  if (!baseTilesKey) {
    return;
  }
  const sourceTexture = scene.textures.get(baseTilesKey);
  const sourceImage = sourceTexture.getSourceImage() as HTMLImageElement | HTMLCanvasElement | undefined;
  if (!sourceImage) {
    return;
  }

  const createFlagFrame = (key: string, distort = false): void => {
    if (scene.textures.exists(key)) {
      return;
    }
    const canvas = scene.textures.createCanvas(key, TILE_SIZE, TILE_SIZE);
    if (!canvas) {
      return;
    }
    const ctx = canvas.getContext();
    ctx.clearRect(0, 0, TILE_SIZE, TILE_SIZE);
    ctx.drawImage(sourceImage, TILE_FLAG * TILE_SIZE, 0, TILE_SIZE, TILE_SIZE, 0, 0, TILE_SIZE, TILE_SIZE);
    if (distort) {
      const imageData = ctx.getImageData(0, 0, TILE_SIZE, TILE_SIZE);
      const bytes = imageData.data;
      const shifted = new Uint8ClampedArray(bytes.length);
      for (let y = 0; y < TILE_SIZE; y += 1) {
        const shift = y < 5 ? 1 : y < 10 ? -1 : 0;
        for (let x = 0; x < TILE_SIZE; x += 1) {
          const sx = Phaser.Math.Clamp(x - shift, 0, TILE_SIZE - 1);
          const srcIdx = (y * TILE_SIZE + sx) * 4;
          const dstIdx = (y * TILE_SIZE + x) * 4;
          shifted[dstIdx] = bytes[srcIdx];
          shifted[dstIdx + 1] = bytes[srcIdx + 1];
          shifted[dstIdx + 2] = bytes[srcIdx + 2];
          shifted[dstIdx + 3] = bytes[srcIdx + 3];
        }
      }
      imageData.data.set(shifted);
      ctx.putImageData(imageData, 0, 0);
    }
    canvas.refresh();
  };

  createFlagFrame('flag_wave_a', false);
  createFlagFrame('flag_wave_b', true);
}

function ensureFireMarioVariants(scene: Phaser.Scene): void {
  const suffixes = ['idle', 'walk_a', 'walk_b', 'walk_c', 'jump', 'skid', 'duck', 'turn', 'pole', 'victory', 'castle_entry'] as const;
  const hasExactFire = suffixes.every((suffix) => scene.textures.exists(`mario_fire_${suffix}`));
  if (hasExactFire) {
    return;
  }

  suffixes.forEach((suffix) => {
    createFireFromSuperFrame(scene, `mario_super_${suffix}`, `mario_fire_${suffix}`);
  });
}

function createFireFromSuperFrame(scene: Phaser.Scene, sourceKey: string, targetKey: string): void {
  if (scene.textures.exists(targetKey)) {
    return;
  }
  if (!scene.textures.exists(sourceKey)) {
    return;
  }

  const sourceTexture = scene.textures.get(sourceKey);
  const sourceImage = sourceTexture.getSourceImage() as HTMLImageElement | HTMLCanvasElement | undefined;
  if (!sourceImage) {
    return;
  }

  const frame = sourceTexture.get();
  const width = frame.width;
  const height = frame.height;

  const canvasTexture = scene.textures.createCanvas(targetKey, width, height);
  if (!canvasTexture) {
    return;
  }

  const ctx = canvasTexture.getContext();
  ctx.clearRect(0, 0, width, height);
  ctx.drawImage(sourceImage, 0, 0, width, height, 0, 0, width, height);

  const imageData = ctx.getImageData(0, 0, width, height);
  const bytes = imageData.data;
  for (let i = 0; i < bytes.length; i += 4) {
    if (bytes[i + 3] === 0) {
      continue;
    }

    const mapped = mapSuperMarioColorToFire(bytes[i], bytes[i + 1], bytes[i + 2]);
    if (!mapped) {
      continue;
    }
    bytes[i] = mapped[0];
    bytes[i + 1] = mapped[1];
    bytes[i + 2] = mapped[2];
  }

  ctx.putImageData(imageData, 0, 0);
  canvasTexture.refresh();
}

function mapSuperMarioColorToFire(r: number, g: number, b: number): [number, number, number] | null {
  const colorMap: Array<[[number, number, number], [number, number, number]]> = [
    // Red shades -> white shades
    [[160, 0, 0], [198, 198, 198]],
    [[200, 0, 24], [232, 232, 232]],
    [[248, 32, 56], [255, 255, 255]],
    [[224, 96, 88], [248, 248, 248]],
    // Blue shades -> red shades
    [[48, 56, 136], [160, 0, 0]],
    [[64, 88, 184], [200, 0, 24]],
    [[112, 136, 232], [248, 32, 56]],
  ];

  for (const [from, to] of colorMap) {
    if (Math.abs(r - from[0]) <= 10 && Math.abs(g - from[1]) <= 10 && Math.abs(b - from[2]) <= 10) {
      return to;
    }
  }
  return null;
}

function extractRuntimeTileset(scene: Phaser.Scene): void {
  if (composeRuntimeTilesetFromIndividual(scene)) {
    return;
  }

  if (scene.textures.exists('tiles_runtime')) {
    return;
  }

  if (!scene.textures.exists('tiles_fallback')) {
    return;
  }

  const fallbackTexture = scene.textures.get('tiles_fallback');
  const fallbackImage = fallbackTexture.getSourceImage() as HTMLImageElement | HTMLCanvasElement | undefined;
  if (!fallbackImage) {
    return;
  }

  const tileCount = 14;
  const canvasTexture = scene.textures.createCanvas('tiles_runtime', TILE_SIZE * tileCount, TILE_SIZE);
  if (!canvasTexture) {
    return;
  }

  const ctx = canvasTexture.getContext();
  ctx.clearRect(0, 0, TILE_SIZE * tileCount, TILE_SIZE);
  ctx.drawImage(fallbackImage, 0, 0);

  if (!scene.textures.exists('smas_world11_full')) {
    canvasTexture.refresh();
    return;
  }

  const worldTexture = scene.textures.get('smas_world11_full');
  const worldImage = worldTexture.getSourceImage() as HTMLImageElement | HTMLCanvasElement | undefined;
  if (!worldImage) {
    canvasTexture.refresh();
    return;
  }

  // Sample one known tile position per tile type from World 1-1.
  const tileSources: Array<{ index: number; sourceTileX: number; sourceTileY: number }> = [
    { index: TILE_GROUND_TOP, sourceTileX: 5, sourceTileY: 12 },
    { index: TILE_GROUND_FILL, sourceTileX: 5, sourceTileY: 13 },
    { index: TILE_BRICK, sourceTileX: 20, sourceTileY: 8 },
    { index: TILE_QUESTION, sourceTileX: 16, sourceTileY: 8 },
    { index: TILE_PIPE_TOP_LEFT, sourceTileX: 28, sourceTileY: 10 },
    { index: TILE_PIPE_TOP_RIGHT, sourceTileX: 29, sourceTileY: 10 },
    { index: TILE_PIPE_BODY_LEFT, sourceTileX: 28, sourceTileY: 11 },
    { index: TILE_PIPE_BODY_RIGHT, sourceTileX: 29, sourceTileY: 11 },
    { index: TILE_CASTLE, sourceTileX: 205, sourceTileY: 11 },
    { index: TILE_STAIR, sourceTileX: 188, sourceTileY: 4 },
  ];

  tileSources.forEach(({ index, sourceTileX, sourceTileY }) => {
    copyWorldTileToTileset(ctx, worldImage, sourceTileX, sourceTileY, index);
  });

  if (scene.textures.exists('smas_items_blocks')) {
    const itemsTexture = scene.textures.get('smas_items_blocks');
    const itemsImage = itemsTexture.getSourceImage() as HTMLImageElement | HTMLCanvasElement | undefined;
    if (itemsImage) {
      // Keep brick/question from world map; only used-question comes from items sheet.
      copyTileFromImage(ctx, itemsImage, 1, 112, TILE_QUESTION_USED);
      remapBlockBlueShadesInTile(ctx, TILE_QUESTION_USED * TILE_SIZE, 0, TILE_SIZE, TILE_SIZE);
    }
  }

  // Keep empty tile transparent; used question block stays from fallback for now.
  ctx.clearRect(TILE_EMPTY * TILE_SIZE, 0, TILE_SIZE, TILE_SIZE);

  canvasTexture.refresh();
}

function composeRuntimeTilesetFromIndividual(scene: Phaser.Scene): boolean {
  const tileKeyByIndex: Array<{ tileIndex: number; textureKey: string }> = [
    { tileIndex: TILE_EMPTY, textureKey: 'tile_empty' },
    { tileIndex: TILE_GROUND_TOP, textureKey: 'tile_ground_top' },
    { tileIndex: TILE_GROUND_FILL, textureKey: 'tile_ground_fill' },
    { tileIndex: TILE_BRICK, textureKey: 'tile_brick' },
    { tileIndex: TILE_QUESTION, textureKey: 'tile_question' },
    { tileIndex: TILE_QUESTION_USED, textureKey: 'tile_question_used' },
    { tileIndex: TILE_PIPE_TOP_LEFT, textureKey: 'tile_pipe_top_left' },
    { tileIndex: TILE_PIPE_TOP_RIGHT, textureKey: 'tile_pipe_top_right' },
    { tileIndex: TILE_PIPE_BODY_LEFT, textureKey: 'tile_pipe_body_left' },
    { tileIndex: TILE_PIPE_BODY_RIGHT, textureKey: 'tile_pipe_body_right' },
    { tileIndex: TILE_FLAGPOLE, textureKey: 'tile_flagpole' },
    { tileIndex: TILE_FLAG, textureKey: 'tile_flag' },
    { tileIndex: TILE_CASTLE, textureKey: 'tile_castle' },
    { tileIndex: TILE_STAIR, textureKey: 'tile_stair' },
  ];

  const hasAllTiles = tileKeyByIndex.every((entry) => scene.textures.exists(entry.textureKey));
  if (!hasAllTiles) {
    return false;
  }

  const composedKey = 'tiles_runtime_individual';
  if (scene.textures.exists(composedKey)) {
    scene.textures.remove(composedKey);
  }

  const canvasTexture = scene.textures.createCanvas(composedKey, TILE_SIZE * tileKeyByIndex.length, TILE_SIZE);
  if (!canvasTexture) {
    return false;
  }

  const ctx = canvasTexture.getContext();
  ctx.clearRect(0, 0, TILE_SIZE * tileKeyByIndex.length, TILE_SIZE);

  tileKeyByIndex.forEach(({ tileIndex, textureKey }) => {
    const texture = scene.textures.get(textureKey);
    const sourceImage = texture.getSourceImage() as HTMLImageElement | HTMLCanvasElement | undefined;
    if (!sourceImage) {
      return;
    }
    const dstX = tileIndex * TILE_SIZE;
    ctx.clearRect(dstX, 0, TILE_SIZE, TILE_SIZE);
    ctx.drawImage(sourceImage, 0, 0, TILE_SIZE, TILE_SIZE, dstX, 0, TILE_SIZE, TILE_SIZE);
  });

  canvasTexture.refresh();
  return true;
}

function copyWorldTileToTileset(
  targetCtx: CanvasRenderingContext2D,
  worldImage: HTMLImageElement | HTMLCanvasElement,
  sourceTileX: number,
  sourceTileY: number,
  targetTileIndex: number,
): void {
  const srcX = sourceTileX * TILE_SIZE;
  const srcY = WORLD_Y_OFFSET + sourceTileY * TILE_SIZE;
  const dstX = targetTileIndex * TILE_SIZE;
  targetCtx.clearRect(dstX, 0, TILE_SIZE, TILE_SIZE);
  targetCtx.drawImage(worldImage, srcX, srcY, TILE_SIZE, TILE_SIZE, dstX, 0, TILE_SIZE, TILE_SIZE);
}

function copyTileFromImage(
  targetCtx: CanvasRenderingContext2D,
  sourceImage: HTMLImageElement | HTMLCanvasElement,
  sourceX: number,
  sourceY: number,
  targetTileIndex: number,
): void {
  const dstX = targetTileIndex * TILE_SIZE;
  targetCtx.clearRect(dstX, 0, TILE_SIZE, TILE_SIZE);
  targetCtx.drawImage(sourceImage, sourceX, sourceY, TILE_SIZE, TILE_SIZE, dstX, 0, TILE_SIZE, TILE_SIZE);
}

function remapBlockBlueShadesInTile(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
): void {
  const imageData = ctx.getImageData(x, y, w, h);
  const bytes = imageData.data;
  for (let i = 0; i < bytes.length; i += 4) {
    const r = bytes[i];
    const g = bytes[i + 1];
    const b = bytes[i + 2];
    if (r === 0 && g === 71 && b === 168) {
      bytes[i] = 107;
      bytes[i + 1] = 66;
      bytes[i + 2] = 8;
      continue;
    }
    if (r === 0 && g === 108 && b === 248) {
      bytes[i] = 156;
      bytes[i + 1] = 123;
      bytes[i + 2] = 24;
    }
  }
  ctx.putImageData(imageData, x, y);
}

function tryExtract(scene: Phaser.Scene, job: ExtractJob): void {
  if (scene.textures.exists(job.targetKey)) {
    return;
  }

  if (!scene.textures.exists(job.sourceKey)) {
    return;
  }

  const sourceTexture = scene.textures.get(job.sourceKey);
  const sourceImage = sourceTexture.getSourceImage() as HTMLImageElement | HTMLCanvasElement | undefined;
  if (!sourceImage) {
    return;
  }

  const canvasTexture = scene.textures.createCanvas(job.targetKey, job.w, job.h);
  if (!canvasTexture) {
    return;
  }

  const ctx = canvasTexture.getContext();
  ctx.clearRect(0, 0, job.w, job.h);
  ctx.drawImage(sourceImage, job.x, job.y, job.w, job.h, 0, 0, job.w, job.h);

  const imageData = ctx.getImageData(0, 0, job.w, job.h);
  const bytes = imageData.data;
  if (job.chromaKey) {
    const [kr, kg, kb] = job.chromaKey;
    for (let i = 0; i < bytes.length; i += 4) {
      if (Math.abs(bytes[i] - kr) <= 5 && Math.abs(bytes[i + 1] - kg) <= 5 && Math.abs(bytes[i + 2] - kb) <= 5) {
        bytes[i + 3] = 0;
      }
    }
  }
  if (job.clearBg !== false) {
    const bgColors = collectCornerColors(bytes, job.w, job.h);
    clearBackgroundFromCorners(bytes, job.w, job.h, bgColors);
  }
  const shouldSnapOpaqueBottom = job.snapOpaqueBottom ?? job.targetKey.startsWith('mario_');
  if (shouldSnapOpaqueBottom) {
    snapOpaqueBottom(bytes, job.w, job.h);
  }
  normalizeTransparentPixels(bytes);
  ctx.putImageData(imageData, 0, 0);

  canvasTexture.refresh();
}

function snapOpaqueBottom(bytes: Uint8ClampedArray, width: number, height: number): void {
  let maxY = -1;
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const idx = (y * width + x) * 4;
      if (bytes[idx + 3] > 0) {
        maxY = y;
      }
    }
  }
  if (maxY < 0) {
    return;
  }
  const shift = height - 1 - maxY;
  if (shift <= 0) {
    return;
  }

  const shifted = new Uint8ClampedArray(bytes.length);
  for (let y = 0; y < height; y += 1) {
    const dstY = y + shift;
    if (dstY < 0 || dstY >= height) {
      continue;
    }
    for (let x = 0; x < width; x += 1) {
      const srcIdx = (y * width + x) * 4;
      const dstIdx = (dstY * width + x) * 4;
      shifted[dstIdx] = bytes[srcIdx];
      shifted[dstIdx + 1] = bytes[srcIdx + 1];
      shifted[dstIdx + 2] = bytes[srcIdx + 2];
      shifted[dstIdx + 3] = bytes[srcIdx + 3];
    }
  }
  bytes.set(shifted);
}

function normalizeTransparentPixels(bytes: Uint8ClampedArray): void {
  for (let i = 0; i < bytes.length; i += 4) {
    if (bytes[i + 3] !== 0) {
      continue;
    }
    bytes[i] = 0;
    bytes[i + 1] = 0;
    bytes[i + 2] = 0;
  }
}

function collectCornerColors(bytes: Uint8ClampedArray, width: number, height: number): Array<[number, number, number]> {
  const corners = [
    pixelAt(bytes, width, 0, 0),
    pixelAt(bytes, width, width - 1, 0),
    pixelAt(bytes, width, 0, height - 1),
    pixelAt(bytes, width, width - 1, height - 1),
  ];

  const unique = new Map<string, [number, number, number]>();
  corners.forEach((rgb) => {
    unique.set(`${rgb[0]},${rgb[1]},${rgb[2]}`, rgb);
  });
  return Array.from(unique.values());
}

function pixelAt(bytes: Uint8ClampedArray, width: number, x: number, y: number): [number, number, number] {
  const idx = (y * width + x) * 4;
  return [bytes[idx], bytes[idx + 1], bytes[idx + 2]];
}

function isBackgroundPixel(r: number, g: number, b: number, bgColors: Array<[number, number, number]>): boolean {
  return bgColors.some((bg) => Math.abs(r - bg[0]) <= 1 && Math.abs(g - bg[1]) <= 1 && Math.abs(b - bg[2]) <= 1);
}

function clearBackgroundFromCorners(
  bytes: Uint8ClampedArray,
  width: number,
  height: number,
  bgColors: Array<[number, number, number]>,
): void {
  const visited = new Uint8Array(width * height);
  const queue: Array<[number, number]> = [
    [0, 0],
    [width - 1, 0],
    [0, height - 1],
    [width - 1, height - 1],
  ];

  while (queue.length > 0) {
    const [x, y] = queue.shift() as [number, number];
    if (x < 0 || y < 0 || x >= width || y >= height) {
      continue;
    }

    const flat = y * width + x;
    if (visited[flat] === 1) {
      continue;
    }
    visited[flat] = 1;

    const idx = flat * 4;
    const r = bytes[idx];
    const g = bytes[idx + 1];
    const b = bytes[idx + 2];
    if (!isBackgroundPixel(r, g, b, bgColors)) {
      continue;
    }

    bytes[idx + 3] = 0;

    queue.push([x + 1, y]);
    queue.push([x - 1, y]);
    queue.push([x, y + 1]);
    queue.push([x, y - 1]);
  }
}

interface DecorativeExtractOptions {
  sourceKey: string;
  targetKey: string;
  x: number;
  y: number;
  w: number;
  h: number;
  chromaKey?: [number, number, number];
  clearSkyEdges?: boolean;
}

function extractDecorativeLayer(scene: Phaser.Scene, options: DecorativeExtractOptions): void {
  if (scene.textures.exists(options.targetKey)) {
    return;
  }

  if (!scene.textures.exists(options.sourceKey)) {
    return;
  }
  const sourceTexture = scene.textures.get(options.sourceKey);
  const sourceImage = sourceTexture.getSourceImage() as HTMLImageElement | HTMLCanvasElement | undefined;
  if (!sourceImage) {
    return;
  }

  const canvasTexture = scene.textures.createCanvas(options.targetKey, options.w, options.h);
  if (!canvasTexture) {
    return;
  }

  const ctx = canvasTexture.getContext();
  ctx.clearRect(0, 0, options.w, options.h);
  ctx.drawImage(sourceImage, options.x, options.y, options.w, options.h, 0, 0, options.w, options.h);

  if (options.chromaKey) {
    const [kr, kg, kb] = options.chromaKey;
    const imageData = ctx.getImageData(0, 0, options.w, options.h);
    const bytes = imageData.data;
    for (let i = 0; i < bytes.length; i += 4) {
      if (Math.abs(bytes[i] - kr) <= 5 && Math.abs(bytes[i + 1] - kg) <= 5 && Math.abs(bytes[i + 2] - kb) <= 5) {
        bytes[i + 3] = 0;
      }
    }
    ctx.putImageData(imageData, 0, 0);
  }

  if (options.clearSkyEdges) {
    const imageData = ctx.getImageData(0, 0, options.w, options.h);
    const bytes = imageData.data;
    clearSkyLikePixelsFromEdges(bytes, options.w, options.h);
    ctx.putImageData(imageData, 0, 0);
  }

  const normalized = ctx.getImageData(0, 0, options.w, options.h);
  normalizeTransparentPixels(normalized.data);
  ctx.putImageData(normalized, 0, 0);

  canvasTexture.refresh();
}

function clearSkyLikePixelsFromEdges(bytes: Uint8ClampedArray, width: number, height: number): void {
  const visited = new Uint8Array(width * height);
  const queue: Array<[number, number]> = [];

  const push = (x: number, y: number): void => {
    if (x < 0 || y < 0 || x >= width || y >= height) {
      return;
    }
    queue.push([x, y]);
  };

  for (let x = 0; x < width; x += 1) {
    push(x, 0);
    push(x, height - 1);
  }
  for (let y = 1; y < height - 1; y += 1) {
    push(0, y);
    push(width - 1, y);
  }

  let cursor = 0;
  while (cursor < queue.length) {
    const [x, y] = queue[cursor] as [number, number];
    cursor += 1;

    const flat = y * width + x;
    if (visited[flat] === 1) {
      continue;
    }
    visited[flat] = 1;

    const idx = flat * 4;
    const r = bytes[idx];
    const g = bytes[idx + 1];
    const b = bytes[idx + 2];
    const a = bytes[idx + 3];
    if (a === 0) {
      continue;
    }

    const isSkyLike =
      b >= g &&
      b >= r &&
      b - r >= 12 &&
      g - r >= 8 &&
      !(r > 220 && g > 220 && b > 220);
    if (!isSkyLike) {
      continue;
    }

    bytes[idx + 3] = 0;
    push(x + 1, y);
    push(x - 1, y);
    push(x, y + 1);
    push(x, y - 1);
  }
}
