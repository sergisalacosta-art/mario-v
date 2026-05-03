#!/usr/bin/env node
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { PNG } from 'pngjs';

const ROOT_DIR = process.cwd();
const SMAS_DIR = path.join(ROOT_DIR, 'public', 'assets', 'smas');
const OUT_DIR = path.join(ROOT_DIR, 'public', 'assets', 'individual');
const PUBLIC_PREFIX = 'assets/individual';
const WORLD11_SOLID_JSON = path.join(ROOT_DIR, 'src', 'level', 'generated', 'world11-solid.generated.json');

/**
 * @typedef {{
 * key: string;
 * sourceFile: string;
 * outFile: string;
 * x: number;
 * y: number;
 * w: number;
 * h: number;
 * cropW?: number;
 * cropH?: number;
 * alignBottom?: boolean;
 * alignCenter?: boolean;
 * clearBg?: boolean;
 * chromaKey?: [number, number, number];
 * clearSkyEdges?: boolean;
 * snapOpaqueBottom?: boolean;
 * }} ExtractSpec
 */

/** @type {ExtractSpec[]} */
const SPRITE_SPECS = [
  { key: 'mario_small_idle', sourceFile: 'mario_luigi_83422.png', outFile: 'mario/small_idle.png', x: 2, y: 24, w: 16, h: 16 },
  { key: 'mario_small_walk_a', sourceFile: 'mario_luigi_83422.png', outFile: 'mario/small_walk_a.png', x: 26, y: 24, w: 16, h: 16 },
  { key: 'mario_small_walk_b', sourceFile: 'mario_luigi_83422.png', outFile: 'mario/small_walk_b.png', x: 43, y: 24, w: 16, h: 16 },
  { key: 'mario_small_walk_c', sourceFile: 'mario_luigi_83422.png', outFile: 'mario/small_walk_c.png', x: 60, y: 24, w: 16, h: 16 },
  { key: 'mario_small_jump', sourceFile: 'mario_luigi_83422.png', outFile: 'mario/small_jump.png', x: 85, y: 24, w: 16, h: 16 },
  {
    key: 'mario_small_skid',
    sourceFile: 'mario_luigi_83422.png',
    outFile: 'mario/small_skid.png',
    x: 109,
    y: 24,
    w: 16,
    h: 16,
  },
  {
    key: 'mario_small_turn',
    sourceFile: 'mario_luigi_83422.png',
    outFile: 'mario/small_turn.png',
    x: 60,
    y: 24,
    w: 16,
    h: 16,
  },
  {
    key: 'mario_small_pole',
    sourceFile: 'mario_luigi_83422.png',
    outFile: 'mario/small_pole.png',
    x: 4,
    y: 53,
    w: 16,
    h: 16,
  },
  {
    key: 'mario_small_dead',
    sourceFile: 'mario_luigi_83422.png',
    outFile: 'mario/small_dead.png',
    x: 21,
    y: 54,
    w: 16,
    h: 16,
  },
  {
    key: 'mario_small_victory',
    sourceFile: 'mario_luigi_83422.png',
    outFile: 'mario/small_victory.png',
    x: 71,
    y: 53,
    w: 16,
    h: 16,
  },
  {
    key: 'mario_small_castle_entry',
    sourceFile: 'mario_luigi_83422.png',
    outFile: 'mario/small_castle_entry.png',
    x: 96,
    y: 53,
    w: 16,
    h: 16,
  },

  {
    key: 'mario_super_idle',
    sourceFile: 'mario_super_alt.gif',
    outFile: 'mario/super_idle.png',
    x: 79,
    y: 34,
    w: 16,
    h: 32,
  },
  {
    key: 'mario_super_walk_a',
    sourceFile: 'mario_super_alt.gif',
    outFile: 'mario/super_walk_a.png',
    x: 98,
    y: 35,
    w: 16,
    h: 32,
  },
  {
    key: 'mario_super_walk_b',
    sourceFile: 'mario_super_alt.gif',
    outFile: 'mario/super_walk_b.png',
    x: 116,
    y: 35,
    w: 16,
    h: 32,
  },
  {
    key: 'mario_super_walk_c',
    sourceFile: 'mario_super_alt.gif',
    outFile: 'mario/super_walk_c.png',
    x: 136,
    y: 36,
    w: 16,
    h: 32,
  },
  {
    key: 'mario_super_jump',
    sourceFile: 'mario_super_alt.gif',
    outFile: 'mario/super_jump.png',
    x: 40,
    y: 36,
    w: 16,
    h: 32,
  },
  {
    key: 'mario_super_skid',
    sourceFile: 'mario_super_alt.gif',
    outFile: 'mario/super_skid.png',
    x: 174,
    y: 36,
    w: 16,
    h: 32,
  },
  {
    key: 'mario_super_duck',
    sourceFile: 'mario_super_alt.gif',
    outFile: 'mario/super_duck.png',
    x: 20,
    y: 2,
    w: 16,
    h: 32,
  },
  {
    key: 'mario_super_turn',
    sourceFile: 'mario_super_alt.gif',
    outFile: 'mario/super_turn.png',
    x: 59,
    y: 36,
    w: 16,
    h: 32,
  },
  {
    key: 'mario_super_pole',
    sourceFile: 'mario_super_alt.gif',
    outFile: 'mario/super_pole.png',
    x: 39,
    y: 2,
    w: 16,
    h: 32,
  },
  {
    key: 'mario_super_victory',
    sourceFile: 'mario_super_alt.gif',
    outFile: 'mario/super_victory.png',
    x: 58,
    y: 5,
    w: 16,
    h: 32,
  },
  {
    key: 'mario_super_castle_entry',
    sourceFile: 'mario_super_alt.gif',
    outFile: 'mario/super_castle_entry.png',
    x: 100,
    y: 4,
    w: 16,
    h: 32,
  },

  {
    key: 'mario_fire_idle',
    sourceFile: 'mario_fire_alt.gif',
    outFile: 'mario/fire_idle.png',
    x: 79,
    y: 31,
    w: 16,
    h: 32,
  },
  {
    key: 'mario_fire_walk_a',
    sourceFile: 'mario_fire_alt.gif',
    outFile: 'mario/fire_walk_a.png',
    x: 98,
    y: 32,
    w: 16,
    h: 32,
  },
  {
    key: 'mario_fire_walk_b',
    sourceFile: 'mario_fire_alt.gif',
    outFile: 'mario/fire_walk_b.png',
    x: 116,
    y: 32,
    w: 16,
    h: 32,
  },
  {
    key: 'mario_fire_walk_c',
    sourceFile: 'mario_fire_alt.gif',
    outFile: 'mario/fire_walk_c.png',
    x: 136,
    y: 33,
    w: 16,
    h: 32,
  },
  {
    key: 'mario_fire_jump',
    sourceFile: 'mario_fire_alt.gif',
    outFile: 'mario/fire_jump.png',
    x: 40,
    y: 33,
    w: 16,
    h: 32,
  },
  {
    key: 'mario_fire_skid',
    sourceFile: 'mario_fire_alt.gif',
    outFile: 'mario/fire_skid.png',
    x: 174,
    y: 33,
    w: 16,
    h: 32,
  },
  {
    key: 'mario_fire_duck',
    sourceFile: 'mario_fire_alt.gif',
    outFile: 'mario/fire_duck.png',
    x: 20,
    y: 0,
    w: 16,
    h: 32,
  },
  {
    key: 'mario_fire_turn',
    sourceFile: 'mario_fire_alt.gif',
    outFile: 'mario/fire_turn.png',
    x: 59,
    y: 33,
    w: 16,
    h: 32,
  },
  {
    key: 'mario_fire_pole',
    sourceFile: 'mario_fire_alt.gif',
    outFile: 'mario/fire_pole.png',
    x: 39,
    y: 0,
    w: 16,
    h: 32,
  },
  {
    key: 'mario_fire_victory',
    sourceFile: 'mario_fire_alt.gif',
    outFile: 'mario/fire_victory.png',
    x: 58,
    y: 2,
    w: 16,
    h: 32,
  },
  {
    key: 'mario_fire_castle_entry',
    sourceFile: 'mario_fire_alt.gif',
    outFile: 'mario/fire_castle_entry.png',
    x: 100,
    y: 1,
    w: 16,
    h: 32,
  },

  {
    key: 'goomba_walk_a',
    sourceFile: 'enemies_6195.png',
    outFile: 'enemies/goomba_walk_a.png',
    x: 1,
    y: 45,
    w: 16,
    h: 16,
    chromaKey: [0, 64, 64],
    clearBg: true,
  },
  {
    key: 'goomba_walk_b',
    sourceFile: 'enemies_6195.png',
    outFile: 'enemies/goomba_walk_b.png',
    x: 18,
    y: 45,
    w: 16,
    h: 16,
    chromaKey: [0, 64, 64],
    clearBg: true,
  },
  {
    key: 'goomba_squash',
    sourceFile: 'enemies_6195.png',
    outFile: 'enemies/goomba_squash.png',
    x: 35,
    y: 45,
    w: 16,
    h: 16,
    chromaKey: [0, 64, 64],
    clearBg: true,
  },
  {
    key: 'goomba_flip',
    sourceFile: 'enemies_6195.png',
    outFile: 'enemies/goomba_flip.png',
    x: 1,
    y: 45,
    w: 16,
    h: 16,
    chromaKey: [0, 64, 64],
    clearBg: true,
  },
  {
    key: 'koopa_walk_a',
    sourceFile: 'enemies_6195.png',
    outFile: 'enemies/koopa_walk_a.png',
    x: 52,
    y: 37,
    w: 16,
    h: 24,
    chromaKey: [0, 64, 64],
    clearBg: true,
    snapOpaqueBottom: true,
  },
  {
    key: 'koopa_walk_b',
    sourceFile: 'enemies_6195.png',
    outFile: 'enemies/koopa_walk_b.png',
    x: 69,
    y: 37,
    w: 16,
    h: 24,
    chromaKey: [0, 64, 64],
    clearBg: true,
    snapOpaqueBottom: true,
  },
  {
    key: 'koopa_wing_a',
    sourceFile: 'enemies_6195.png',
    outFile: 'enemies/koopa_wing_a.png',
    x: 86,
    y: 37,
    w: 16,
    h: 24,
    chromaKey: [0, 64, 64],
    clearBg: true,
    snapOpaqueBottom: true,
  },
  {
    key: 'koopa_wing_b',
    sourceFile: 'enemies_6195.png',
    outFile: 'enemies/koopa_wing_b.png',
    x: 103,
    y: 37,
    w: 16,
    h: 24,
    chromaKey: [0, 64, 64],
    clearBg: true,
    snapOpaqueBottom: true,
  },
  {
    key: 'koopa_shell',
    sourceFile: 'enemies_6195.png',
    outFile: 'enemies/koopa_shell.png',
    x: 120,
    y: 45,
    w: 16,
    h: 16,
    cropW: 16,
    cropH: 14,
    alignBottom: true,
    chromaKey: [0, 64, 64],
    clearBg: true,
    snapOpaqueBottom: true,
  },
  {
    key: 'koopa_shell_spin_a',
    sourceFile: 'enemies_6195.png',
    outFile: 'enemies/koopa_shell_spin_a.png',
    x: 137,
    y: 45,
    w: 16,
    h: 16,
    cropW: 16,
    cropH: 14,
    alignBottom: true,
    chromaKey: [0, 64, 64],
    clearBg: true,
    snapOpaqueBottom: true,
  },
  {
    key: 'koopa_shell_spin_b',
    sourceFile: 'enemies_6195.png',
    outFile: 'enemies/koopa_shell_spin_b.png',
    x: 171,
    y: 45,
    w: 16,
    h: 16,
    cropW: 16,
    cropH: 14,
    alignBottom: true,
    chromaKey: [0, 64, 64],
    clearBg: true,
    snapOpaqueBottom: true,
  },
  {
    key: 'koopa_flip',
    sourceFile: 'enemies_6195.png',
    outFile: 'enemies/koopa_flip.png',
    x: 307,
    y: 45,
    w: 16,
    h: 16,
    chromaKey: [0, 64, 64],
    clearBg: true,
  },
  {
    key: 'lakitu_cloud_a',
    sourceFile: 'enemies_mariouniverse.gif',
    outFile: 'enemies/lakitu_cloud_a.png',
    x: 117,
    y: 203,
    w: 16,
    h: 24,
    chromaKey: [248, 0, 248],
    clearBg: true,
    snapOpaqueBottom: true,
  },
  {
    key: 'lakitu_cloud_b',
    sourceFile: 'enemies_mariouniverse.gif',
    outFile: 'enemies/lakitu_cloud_b.png',
    x: 153,
    y: 203,
    w: 16,
    h: 24,
    chromaKey: [248, 0, 248],
    clearBg: true,
    snapOpaqueBottom: true,
  },
  {
    key: 'lakitu_throw_a',
    sourceFile: 'enemies_mariouniverse.gif',
    outFile: 'enemies/lakitu_throw_a.png',
    x: 117,
    y: 203,
    w: 16,
    h: 24,
    chromaKey: [248, 0, 248],
    clearBg: true,
    snapOpaqueBottom: true,
  },
  {
    key: 'lakitu_throw_b',
    sourceFile: 'enemies_mariouniverse.gif',
    outFile: 'enemies/lakitu_throw_b.png',
    x: 153,
    y: 203,
    w: 16,
    h: 24,
    chromaKey: [248, 0, 248],
    clearBg: true,
    snapOpaqueBottom: true,
  },
  {
    key: 'spiny_egg',
    sourceFile: 'enemies_mariouniverse.gif',
    outFile: 'enemies/spiny_egg.png',
    x: 99,
    y: 211,
    w: 16,
    h: 16,
    chromaKey: [248, 0, 248],
    clearBg: true,
    snapOpaqueBottom: true,
  },
  {
    key: 'spiny_walk_a',
    sourceFile: 'enemies_mariouniverse.gif',
    outFile: 'enemies/spiny_walk_a.png',
    x: 83,
    y: 211,
    w: 16,
    h: 16,
    chromaKey: [248, 0, 248],
    clearBg: true,
    snapOpaqueBottom: true,
  },
  {
    key: 'spiny_walk_b',
    sourceFile: 'enemies_mariouniverse.gif',
    outFile: 'enemies/spiny_walk_b.png',
    x: 185,
    y: 211,
    w: 16,
    h: 16,
    chromaKey: [248, 0, 248],
    clearBg: true,
    snapOpaqueBottom: true,
  },
  {
    key: 'piranha_up_a',
    sourceFile: 'enemies_mariouniverse.gif',
    outFile: 'enemies/piranha_up_a.png',
    x: 125,
    y: 345,
    w: 16,
    h: 24,
    chromaKey: [248, 0, 248],
    clearBg: true,
    snapOpaqueBottom: true,
  },
  {
    key: 'piranha_up_b',
    sourceFile: 'enemies_mariouniverse.gif',
    outFile: 'enemies/piranha_up_b.png',
    x: 145,
    y: 345,
    w: 16,
    h: 24,
    chromaKey: [248, 0, 248],
    clearBg: true,
    snapOpaqueBottom: true,
  },
  {
    key: 'piranha_down_a',
    sourceFile: 'enemies_mariouniverse.gif',
    outFile: 'enemies/piranha_down_a.png',
    x: 125,
    y: 345,
    w: 16,
    h: 24,
    chromaKey: [248, 0, 248],
    clearBg: true,
    snapOpaqueBottom: true,
  },
  {
    key: 'piranha_down_b',
    sourceFile: 'enemies_mariouniverse.gif',
    outFile: 'enemies/piranha_down_b.png',
    x: 145,
    y: 345,
    w: 16,
    h: 24,
    chromaKey: [248, 0, 248],
    clearBg: true,
    snapOpaqueBottom: true,
  },

  { key: 'item_mushroom', sourceFile: 'items_blocks_118565.png', outFile: 'items/mushroom.png', x: 2, y: 2, w: 16, h: 16 },
  { key: 'item_fireflower', sourceFile: 'items_blocks_118565.png', outFile: 'items/fireflower.png', x: 19, y: 2, w: 16, h: 16 },
  { key: 'item_mushroom_green', sourceFile: 'items_blocks_118565.png', outFile: 'items/mushroom_green.png', x: 36, y: 2, w: 16, h: 16 },
  { key: 'item_mushroom_blue', sourceFile: 'items_blocks_118565.png', outFile: 'items/mushroom_blue.png', x: 53, y: 2, w: 16, h: 16 },
  { key: 'item_fireflower_green', sourceFile: 'items_blocks_118565.png', outFile: 'items/fireflower_green.png', x: 2, y: 19, w: 16, h: 16 },
  { key: 'item_fireflower_red', sourceFile: 'items_blocks_118565.png', outFile: 'items/fireflower_red.png', x: 36, y: 19, w: 16, h: 16 },
  { key: 'item_star_yellow', sourceFile: 'items_blocks_118565.png', outFile: 'items/star_yellow.png', x: 2, y: 36, w: 16, h: 16 },
  { key: 'item_star_green', sourceFile: 'items_blocks_118565.png', outFile: 'items/star_green.png', x: 19, y: 36, w: 16, h: 16 },
  { key: 'item_star_red', sourceFile: 'items_blocks_118565.png', outFile: 'items/star_red.png', x: 36, y: 36, w: 16, h: 16 },
  { key: 'item_star_yellow_alt', sourceFile: 'items_blocks_118565.png', outFile: 'items/star_yellow_alt.png', x: 53, y: 36, w: 16, h: 16 },
  {
    key: 'coin_pickup_a',
    sourceFile: 'items_coins_mariouniverse.png',
    outFile: 'items/coin_pickup_a.png',
    x: 8,
    y: 75,
    w: 16,
    h: 16,
    chromaKey: [0, 72, 72],
    clearBg: true,
  },
  {
    key: 'coin_pickup_b',
    sourceFile: 'items_coins_mariouniverse.png',
    outFile: 'items/coin_pickup_b.png',
    x: 26,
    y: 75,
    w: 16,
    h: 16,
    chromaKey: [0, 72, 72],
    clearBg: true,
  },
  {
    key: 'coin_pickup_c',
    sourceFile: 'items_coins_mariouniverse.png',
    outFile: 'items/coin_pickup_c.png',
    x: 44,
    y: 75,
    w: 16,
    h: 16,
    chromaKey: [0, 72, 72],
    clearBg: true,
  },
  {
    key: 'coin_pickup_d',
    sourceFile: 'items_coins_mariouniverse.png',
    outFile: 'items/coin_pickup_d.png',
    x: 62,
    y: 75,
    w: 16,
    h: 16,
    chromaKey: [0, 72, 72],
    clearBg: true,
  },

  { key: 'block_question_a', sourceFile: 'items_blocks_118565.png', outFile: 'blocks/question_a.png', x: 2, y: 96, w: 16, h: 16, clearBg: false },
  { key: 'block_question_b', sourceFile: 'items_blocks_118565.png', outFile: 'blocks/question_b.png', x: 19, y: 96, w: 16, h: 16, clearBg: false },
  { key: 'block_question_c', sourceFile: 'items_blocks_118565.png', outFile: 'blocks/question_c.png', x: 36, y: 96, w: 16, h: 16, clearBg: false },
  { key: 'block_question_used_brown', sourceFile: 'items_blocks_118565.png', outFile: 'blocks/question_used_brown.png', x: 2, y: 113, w: 16, h: 16, clearBg: false },
  { key: 'block_question_used_blue', sourceFile: 'items_blocks_118565.png', outFile: 'blocks/question_used_blue.png', x: 2, y: 130, w: 16, h: 16, clearBg: false },
  { key: 'block_question_used_gray', sourceFile: 'items_blocks_118565.png', outFile: 'blocks/question_used_gray.png', x: 2, y: 147, w: 16, h: 16, clearBg: false },
  { key: 'block_brick_brown_a', sourceFile: 'items_blocks_118565.png', outFile: 'blocks/brick_brown_a.png', x: 19, y: 113, w: 16, h: 16, clearBg: false },
  { key: 'block_brick_brown_b', sourceFile: 'items_blocks_118565.png', outFile: 'blocks/brick_brown_b.png', x: 36, y: 113, w: 16, h: 16, clearBg: false },
  { key: 'block_brick_blue_a', sourceFile: 'items_blocks_118565.png', outFile: 'blocks/brick_blue_a.png', x: 19, y: 130, w: 16, h: 16, clearBg: false },
  { key: 'block_brick_blue_b', sourceFile: 'items_blocks_118565.png', outFile: 'blocks/brick_blue_b.png', x: 36, y: 130, w: 16, h: 16, clearBg: false },
  { key: 'block_brick_gray_a', sourceFile: 'items_blocks_118565.png', outFile: 'blocks/brick_gray_a.png', x: 19, y: 147, w: 16, h: 16, clearBg: false },
  { key: 'block_brick_gray_b', sourceFile: 'items_blocks_118565.png', outFile: 'blocks/brick_gray_b.png', x: 36, y: 147, w: 16, h: 16, clearBg: false },
  { key: 'coin_pop_a', sourceFile: 'items_blocks_118565.png', outFile: 'effects/coin_pop_a.png', x: 1, y: 48, w: 16, h: 16 },
  { key: 'coin_pop_b', sourceFile: 'items_blocks_118565.png', outFile: 'effects/coin_pop_b.png', x: 18, y: 48, w: 16, h: 16 },
  { key: 'coin_pop_c', sourceFile: 'items_blocks_118565.png', outFile: 'effects/coin_pop_c.png', x: 52, y: 48, w: 16, h: 16 },
  { key: 'sparkle_a', sourceFile: 'items_blocks_118565.png', outFile: 'effects/sparkle_a.png', x: 69, y: 48, w: 16, h: 16 },
  { key: 'sparkle_b', sourceFile: 'items_blocks_118565.png', outFile: 'effects/sparkle_b.png', x: 86, y: 48, w: 16, h: 16 },
  { key: 'sparkle_c', sourceFile: 'items_blocks_118565.png', outFile: 'effects/sparkle_c.png', x: 103, y: 48, w: 16, h: 16 },
  { key: 'brick_debris_a', sourceFile: 'items_blocks_118565.png', outFile: 'effects/brick_debris_a.png', x: 52, y: 112, w: 16, h: 16 },
  { key: 'brick_debris_b', sourceFile: 'items_blocks_118565.png', outFile: 'effects/brick_debris_b.png', x: 69, y: 112, w: 16, h: 16 },
  { key: 'brick_debris_c', sourceFile: 'items_blocks_118565.png', outFile: 'effects/brick_debris_c.png', x: 86, y: 112, w: 16, h: 16 },
  { key: 'brick_debris_d', sourceFile: 'items_blocks_118565.png', outFile: 'effects/brick_debris_d.png', x: 103, y: 112, w: 16, h: 16 },
  { key: 'block_debris_brown_a', sourceFile: 'items_blocks_118565.png', outFile: 'blocks/debris_brown_a.png', x: 53, y: 113, w: 8, h: 8 },
  { key: 'block_debris_brown_b', sourceFile: 'items_blocks_118565.png', outFile: 'blocks/debris_brown_b.png', x: 62, y: 113, w: 8, h: 8 },
  { key: 'block_debris_brown_c', sourceFile: 'items_blocks_118565.png', outFile: 'blocks/debris_brown_c.png', x: 71, y: 113, w: 8, h: 8 },
  { key: 'block_debris_brown_d', sourceFile: 'items_blocks_118565.png', outFile: 'blocks/debris_brown_d.png', x: 80, y: 113, w: 8, h: 8 },
  { key: 'block_debris_blue_a', sourceFile: 'items_blocks_118565.png', outFile: 'blocks/debris_blue_a.png', x: 53, y: 130, w: 8, h: 8 },
  { key: 'block_debris_blue_b', sourceFile: 'items_blocks_118565.png', outFile: 'blocks/debris_blue_b.png', x: 62, y: 130, w: 8, h: 8 },
  { key: 'block_debris_blue_c', sourceFile: 'items_blocks_118565.png', outFile: 'blocks/debris_blue_c.png', x: 71, y: 130, w: 8, h: 8 },
  { key: 'block_debris_blue_d', sourceFile: 'items_blocks_118565.png', outFile: 'blocks/debris_blue_d.png', x: 80, y: 130, w: 8, h: 8 },
  { key: 'block_debris_gray_a', sourceFile: 'items_blocks_118565.png', outFile: 'blocks/debris_gray_a.png', x: 53, y: 147, w: 8, h: 8 },
  { key: 'block_debris_gray_b', sourceFile: 'items_blocks_118565.png', outFile: 'blocks/debris_gray_b.png', x: 62, y: 147, w: 8, h: 8 },
  { key: 'block_debris_gray_c', sourceFile: 'items_blocks_118565.png', outFile: 'blocks/debris_gray_c.png', x: 71, y: 147, w: 8, h: 8 },
  { key: 'block_debris_gray_d', sourceFile: 'items_blocks_118565.png', outFile: 'blocks/debris_gray_d.png', x: 80, y: 147, w: 8, h: 8 },

  { key: 'fireball_a', sourceFile: 'effects_135664.png', outFile: 'effects/fireball_a.png', x: 2, y: 31, w: 8, h: 8 },
  { key: 'fireball_b', sourceFile: 'effects_135664.png', outFile: 'effects/fireball_b.png', x: 11, y: 31, w: 8, h: 8 },
  { key: 'fireball_hit', sourceFile: 'effects_135664.png', outFile: 'effects/fireball_hit.png', x: 102, y: 31, w: 10, h: 10 },

  {
    key: 'decor_clouds_strip',
    sourceFile: 'clouds_bg_6208.png',
    outFile: 'decor/clouds_strip.png',
    x: 18,
    y: 18,
    w: 3072,
    h: 208,
    clearBg: false,
  },
  {
    key: 'decor_hills_strip_a',
    sourceFile: 'hills_bg_135312.png',
    outFile: 'decor/hills_strip_a.png',
    x: 8,
    y: 16,
    w: 1736,
    h: 208,
    chromaKey: [248, 0, 248],
    clearBg: false,
  },
  {
    key: 'decor_hills_strip_b',
    sourceFile: 'hills_bg_135313.png',
    outFile: 'decor/hills_strip_b.png',
    x: 8,
    y: 16,
    w: 3320,
    h: 208,
    chromaKey: [248, 0, 248],
    clearBg: false,
  },
  {
    key: 'screen_title_logo_main',
    sourceFile: 'title_screens_132613.png',
    outFile: 'screens/title_logo_main.png',
    x: 5,
    y: 220,
    w: 208,
    h: 96,
    chromaKey: [0, 165, 165],
    clearBg: false,
  },
  {
    key: 'screen_title_logo_alt',
    sourceFile: 'title_screens_132613.png',
    outFile: 'screens/title_logo_alt.png',
    x: 225,
    y: 220,
    w: 208,
    h: 96,
    chromaKey: [0, 165, 165],
    clearBg: false,
  },
  {
    key: 'screen_game_over',
    sourceFile: 'game_over_time_up_51798.png',
    outFile: 'screens/game_over.png',
    x: 6,
    y: 24,
    w: 256,
    h: 224,
    clearBg: false,
  },
  {
    key: 'screen_time_up',
    sourceFile: 'game_over_time_up_51798.png',
    outFile: 'screens/time_up.png',
    x: 266,
    y: 24,
    w: 256,
    h: 224,
    clearBg: false,
  },
  {
    key: 'screen_game_over_cursor',
    sourceFile: 'game_over_time_up_51798.png',
    outFile: 'screens/game_over_cursor.png',
    x: 74,
    y: 126,
    w: 12,
    h: 9,
  },
];

const TILE_SIZE = 16;
const TILE_NAMES = [
  'empty',
  'ground_top',
  'ground_fill',
  'brick',
  'question',
  'question_used',
  'pipe_top_left',
  'pipe_top_right',
  'pipe_body_left',
  'pipe_body_right',
  'flagpole',
  'flag',
  'castle',
  'stair',
];

const GRID_EXPORTS = [
  {
    sourceFile: 'mario_luigi_83422.png',
    outDir: 'grids/mario_luigi_83422',
    tileW: 16,
    tileH: 16,
    registerInManifest: false,
  },
  {
    sourceFile: 'mario_super_alt.gif',
    outDir: 'grids/mario_super_alt',
    tileW: 16,
    tileH: 32,
    registerInManifest: false,
  },
  {
    sourceFile: 'mario_fire_alt.gif',
    outDir: 'grids/mario_fire_alt',
    tileW: 16,
    tileH: 32,
    registerInManifest: false,
  },
  {
    sourceFile: 'enemies_6195.png',
    outDir: 'grids/enemies_6195',
    tileW: 16,
    tileH: 16,
    registerInManifest: false,
  },
  {
    sourceFile: 'items_blocks_118565.png',
    outDir: 'grids/items_blocks_118565',
    tileW: 16,
    tileH: 16,
    registerInManifest: false,
  },
  {
    sourceFile: 'items_coins_mariouniverse.png',
    outDir: 'grids/items_coins_mariouniverse',
    tileW: 16,
    tileH: 16,
    registerInManifest: false,
  },
];

const manifest = {
  generatedAt: new Date().toISOString(),
  assets: [],
};

const sourceCache = new Map();
const convertedGifCache = new Map();

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function loadPngFromAny(sourceFile) {
  const sourcePath = path.join(SMAS_DIR, sourceFile);
  const cacheKey = path.resolve(sourcePath);
  if (sourceCache.has(cacheKey)) {
    return sourceCache.get(cacheKey);
  }

  let pngPath = sourcePath;
  if (sourceFile.toLowerCase().endsWith('.gif')) {
    pngPath = convertGifToPng(sourcePath);
  }

  const png = PNG.sync.read(fs.readFileSync(pngPath));
  sourceCache.set(cacheKey, png);
  return png;
}

function convertGifToPng(gifPath) {
  if (convertedGifCache.has(gifPath)) {
    return convertedGifCache.get(gifPath);
  }

  const tmpPng = path.join(os.tmpdir(), `allstars-${path.basename(gifPath)}.png`);
  try {
    execFileSync(
      'ffmpeg',
      ['-hide_banner', '-loglevel', 'error', '-y', '-i', gifPath, '-frames:v', '1', '-pix_fmt', 'rgba', tmpPng],
      { stdio: 'ignore' },
    );
  } catch (_ffmpegError) {
    try {
      execFileSync('sips', ['-s', 'format', 'png', gifPath, '--out', tmpPng], { stdio: 'ignore' });
    } catch (sipsError) {
      throw new Error(`Could not convert GIF to PNG with ffmpeg/sips: ${gifPath}. Error: ${String(sipsError)}`);
    }
  }
  convertedGifCache.set(gifPath, tmpPng);
  return tmpPng;
}

function extractFrame(sourcePng, x, y, w, h) {
  const out = new PNG({ width: w, height: h });
  for (let yy = 0; yy < h; yy += 1) {
    for (let xx = 0; xx < w; xx += 1) {
      const srcX = x + xx;
      const srcY = y + yy;
      const dstIdx = (yy * w + xx) * 4;
      if (srcX < 0 || srcY < 0 || srcX >= sourcePng.width || srcY >= sourcePng.height) {
        out.data[dstIdx + 3] = 0;
        continue;
      }
      const srcIdx = (srcY * sourcePng.width + srcX) * 4;
      out.data[dstIdx] = sourcePng.data[srcIdx];
      out.data[dstIdx + 1] = sourcePng.data[srcIdx + 1];
      out.data[dstIdx + 2] = sourcePng.data[srcIdx + 2];
      out.data[dstIdx + 3] = sourcePng.data[srcIdx + 3];
    }
  }
  return out;
}

function blitFrame(source, target, offsetX, offsetY) {
  for (let yy = 0; yy < source.height; yy += 1) {
    for (let xx = 0; xx < source.width; xx += 1) {
      const dstX = offsetX + xx;
      const dstY = offsetY + yy;
      if (dstX < 0 || dstY < 0 || dstX >= target.width || dstY >= target.height) {
        continue;
      }
      const srcIdx = (yy * source.width + xx) * 4;
      const dstIdx = (dstY * target.width + dstX) * 4;
      target.data[dstIdx] = source.data[srcIdx];
      target.data[dstIdx + 1] = source.data[srcIdx + 1];
      target.data[dstIdx + 2] = source.data[srcIdx + 2];
      target.data[dstIdx + 3] = source.data[srcIdx + 3];
    }
  }
}

function clearBackgroundFromCorners(image) {
  const w = image.width;
  const h = image.height;
  const bytes = image.data;
  const visited = new Uint8Array(w * h);
  const queue = [
    [0, 0],
    [w - 1, 0],
    [0, h - 1],
    [w - 1, h - 1],
  ];

  const cornerColors = queue.map(([x, y]) => {
    const idx = (y * w + x) * 4;
    return [bytes[idx], bytes[idx + 1], bytes[idx + 2]];
  });
  const uniqueCornerColors = [];
  cornerColors.forEach((color) => {
    const exists = uniqueCornerColors.some(
      (candidate) =>
        Math.abs(candidate[0] - color[0]) <= 1 &&
        Math.abs(candidate[1] - color[1]) <= 1 &&
        Math.abs(candidate[2] - color[2]) <= 1,
    );
    if (!exists) {
      uniqueCornerColors.push(color);
    }
  });

  const isBackground = (r, g, b) =>
    uniqueCornerColors.some((color) => Math.abs(color[0] - r) <= 1 && Math.abs(color[1] - g) <= 1 && Math.abs(color[2] - b) <= 1);

  while (queue.length > 0) {
    const [x, y] = queue.shift();
    if (x < 0 || y < 0 || x >= w || y >= h) {
      continue;
    }
    const flatIndex = y * w + x;
    if (visited[flatIndex] === 1) {
      continue;
    }
    visited[flatIndex] = 1;

    const idx = flatIndex * 4;
    if (!isBackground(bytes[idx], bytes[idx + 1], bytes[idx + 2])) {
      continue;
    }

    bytes[idx + 3] = 0;
    queue.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
  }
}

function applyChromaKey(image, chromaKey) {
  const [kr, kg, kb] = chromaKey;
  for (let i = 0; i < image.data.length; i += 4) {
    if (
      Math.abs(image.data[i] - kr) <= 5 &&
      Math.abs(image.data[i + 1] - kg) <= 5 &&
      Math.abs(image.data[i + 2] - kb) <= 5
    ) {
      image.data[i + 3] = 0;
    }
  }
}

function normalizeTransparentPixels(image) {
  for (let i = 0; i < image.data.length; i += 4) {
    if (image.data[i + 3] !== 0) {
      continue;
    }
    image.data[i] = 0;
    image.data[i + 1] = 0;
    image.data[i + 2] = 0;
  }
}

function clearSkyLikePixelsFromEdges(image) {
  const w = image.width;
  const h = image.height;
  const bytes = image.data;
  const visited = new Uint8Array(w * h);
  const queue = [];

  const push = (x, y) => {
    if (x < 0 || y < 0 || x >= w || y >= h) return;
    queue.push([x, y]);
  };

  for (let x = 0; x < w; x += 1) {
    push(x, 0);
    push(x, h - 1);
  }
  for (let y = 1; y < h - 1; y += 1) {
    push(0, y);
    push(w - 1, y);
  }

  let cursor = 0;
  while (cursor < queue.length) {
    const [x, y] = queue[cursor];
    cursor += 1;

    const flat = y * w + x;
    if (visited[flat] === 1) continue;
    visited[flat] = 1;

    const idx = flat * 4;
    const r = bytes[idx];
    const g = bytes[idx + 1];
    const b = bytes[idx + 2];
    const a = bytes[idx + 3];
    if (a === 0) continue;

    const isSkyLike =
      b >= g &&
      b >= r &&
      b - r >= 12 &&
      g - r >= 8 &&
      !(r > 220 && g > 220 && b > 220);
    if (!isSkyLike) continue;

    bytes[idx + 3] = 0;
    push(x + 1, y);
    push(x - 1, y);
    push(x, y + 1);
    push(x, y - 1);
  }
}

function writePng(relativePath, png) {
  const targetPath = path.join(OUT_DIR, relativePath);
  ensureDir(path.dirname(targetPath));
  fs.writeFileSync(targetPath, PNG.sync.write(png));
}

function getOpaqueBounds(image) {
  let minX = image.width;
  let minY = image.height;
  let maxX = -1;
  let maxY = -1;
  for (let y = 0; y < image.height; y += 1) {
    for (let x = 0; x < image.width; x += 1) {
      const idx = (y * image.width + x) * 4;
      if (image.data[idx + 3] === 0) continue;
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
    }
  }

  if (maxX < 0 || maxY < 0) {
    return null;
  }

  return { minX, minY, maxX, maxY };
}

function hasOpaquePixels(image) {
  for (let i = 3; i < image.data.length; i += 4) {
    if (image.data[i] !== 0) {
      return true;
    }
  }
  return false;
}

function shiftImageDown(image, pixels) {
  if (pixels <= 0) return image;
  const out = new PNG({ width: image.width, height: image.height });
  blitFrame(image, out, 0, pixels);
  return out;
}

function registerAsset(key, relativePath, width, height, source) {
  const entry = {
    key,
    path: `${PUBLIC_PREFIX}/${relativePath}`.replaceAll(path.sep, '/'),
    width,
    height,
    source,
  };
  const idx = manifest.assets.findIndex((asset) => asset.key === key);
  if (idx >= 0) {
    manifest.assets[idx] = entry;
    return;
  }
  manifest.assets.push(entry);
}

function exportSprites() {
  SPRITE_SPECS.forEach((spec) => {
    const sourcePng = loadPngFromAny(spec.sourceFile);
    const cropW = spec.cropW ?? spec.w;
    const cropH = spec.cropH ?? spec.h;
    const extracted = extractFrame(sourcePng, spec.x, spec.y, cropW, cropH);
    if (spec.chromaKey) {
      applyChromaKey(extracted, spec.chromaKey);
    }
    if (spec.clearSkyEdges) {
      clearSkyLikePixelsFromEdges(extracted);
    }
    if (spec.clearBg !== false) {
      clearBackgroundFromCorners(extracted);
    }

    let frame = extracted;
    if (cropW !== spec.w || cropH !== spec.h || spec.alignBottom || spec.alignCenter) {
      frame = new PNG({ width: spec.w, height: spec.h });
      const dstX = spec.alignCenter ? Math.floor((spec.w - cropW) / 2) : 0;
      const dstY = spec.alignBottom ? spec.h - cropH : 0;
      blitFrame(extracted, frame, dstX, dstY);
    }

    const shouldSnapOpaqueBottom = spec.snapOpaqueBottom ?? spec.key.startsWith('mario_');
    if (shouldSnapOpaqueBottom) {
      const bounds = getOpaqueBounds(frame);
      if (bounds) {
        const shiftDown = frame.height - 1 - bounds.maxY;
        if (shiftDown > 0) {
          frame = shiftImageDown(frame, shiftDown);
        }
      }
    }

    normalizeTransparentPixels(frame);
    writePng(spec.outFile, frame);
    registerAsset(spec.key, spec.outFile, spec.w, spec.h, spec.sourceFile);
  });
}

function copyRawSheets() {
  const rawFiles = [
    'tileset_global_6211.png',
    'world_1-1_154289.png',
    'hud_font_132605.png',
    'items_blocks_118565.png',
    'title_screens_132613.png',
    'game_over_time_up_51798.png',
    'npcs_ending_6206.png',
    'mario_luigi_83422.png',
    'enemies_6195.png',
    'effects_135664.png',
    'clouds_bg_6208.png',
    'hills_bg_135312.png',
    'hills_bg_135313.png',
    'mario_super_alt.gif',
    'mario_fire_alt.gif',
    'enemies_mariouniverse.gif',
    'items_coins_mariouniverse.png',
  ];

  rawFiles.forEach((filename) => {
    const src = path.join(SMAS_DIR, filename);
    if (!fs.existsSync(src)) {
      console.warn(`[warn] Missing raw source file, skipping copy: ${filename}`);
      return;
    }
    const outRelative = path.join('raw', filename);
    const dst = path.join(OUT_DIR, outRelative);
    ensureDir(path.dirname(dst));
    fs.copyFileSync(src, dst);
  });
}

function copyTile(target, source, x, y) {
  for (let yy = 0; yy < TILE_SIZE; yy += 1) {
    for (let xx = 0; xx < TILE_SIZE; xx += 1) {
      const srcIdx = ((y + yy) * source.width + (x + xx)) * 4;
      const dstIdx = (yy * target.width + xx) * 4;
      target.data[dstIdx] = source.data[srcIdx];
      target.data[dstIdx + 1] = source.data[srcIdx + 1];
      target.data[dstIdx + 2] = source.data[srcIdx + 2];
      target.data[dstIdx + 3] = source.data[srcIdx + 3];
    }
  }
}

function putTile(tileset, tileIndex, tilePng) {
  const dstX = tileIndex * TILE_SIZE;
  for (let yy = 0; yy < TILE_SIZE; yy += 1) {
    for (let xx = 0; xx < TILE_SIZE; xx += 1) {
      const srcIdx = (yy * TILE_SIZE + xx) * 4;
      const dstIdx = (yy * tileset.width + (dstX + xx)) * 4;
      tileset.data[dstIdx] = tilePng.data[srcIdx];
      tileset.data[dstIdx + 1] = tilePng.data[srcIdx + 1];
      tileset.data[dstIdx + 2] = tilePng.data[srcIdx + 2];
      tileset.data[dstIdx + 3] = tilePng.data[srcIdx + 3];
    }
  }
}

function fillRectPng(target, x, y, w, h, rgba) {
  const [r, g, b, a = 255] = rgba;
  for (let yy = y; yy < y + h; yy += 1) {
    for (let xx = x; xx < x + w; xx += 1) {
      if (xx < 0 || yy < 0 || xx >= target.width || yy >= target.height) {
        continue;
      }
      const idx = (yy * target.width + xx) * 4;
      target.data[idx] = r;
      target.data[idx + 1] = g;
      target.data[idx + 2] = b;
      target.data[idx + 3] = a;
    }
  }
}

function makeFlagTile() {
  const tile = new PNG({ width: TILE_SIZE, height: TILE_SIZE });
  fillRectPng(tile, 1, 1, 2, 4, [244, 244, 244, 255]);
  fillRectPng(tile, 3, 1, 10, 6, [59, 200, 255, 255]);
  fillRectPng(tile, 7, 3, 3, 3, [244, 244, 244, 255]);
  return tile;
}

function remapBlockBlueShades(tile) {
  for (let i = 0; i < tile.data.length; i += 4) {
    const r = tile.data[i];
    const g = tile.data[i + 1];
    const b = tile.data[i + 2];
    if (r === 0 && g === 71 && b === 168) {
      tile.data[i] = 107;
      tile.data[i + 1] = 66;
      tile.data[i + 2] = 8;
      continue;
    }
    if (r === 0 && g === 108 && b === 248) {
      tile.data[i] = 156;
      tile.data[i + 1] = 123;
      tile.data[i + 2] = 24;
    }
  }
}

function buildTilesetRuntime() {
  const world = loadPngFromAny('world_1-1_154289.png');
  const items = loadPngFromAny('items_blocks_118565.png');

  const tileset = new PNG({ width: TILE_SIZE * TILE_NAMES.length, height: TILE_SIZE });
  for (let i = 0; i < tileset.data.length; i += 1) {
    tileset.data[i] = 0;
  }

  const worldTile = (tileX, tileY) => {
    const out = new PNG({ width: TILE_SIZE, height: TILE_SIZE });
    copyTile(out, world, tileX * TILE_SIZE, 16 + tileY * TILE_SIZE);
    return out;
  };
  const itemTile = (x, y) => {
    const out = new PNG({ width: TILE_SIZE, height: TILE_SIZE });
    copyTile(out, items, x, y);
    return out;
  };

  putTile(tileset, 1, worldTile(5, 12));
  putTile(tileset, 2, worldTile(5, 13));
  putTile(tileset, 3, worldTile(20, 8));
  putTile(tileset, 4, worldTile(16, 8));
  const usedQuestion = itemTile(1, 112);
  putTile(tileset, 5, usedQuestion);
  putTile(tileset, 6, worldTile(28, 10));
  putTile(tileset, 7, worldTile(29, 10));
  putTile(tileset, 8, worldTile(28, 11));
  putTile(tileset, 9, worldTile(29, 11));
  const poleTile = worldTile(198, 8);
  clearBackgroundFromCorners(poleTile);
  putTile(tileset, 10, poleTile);
  const flagTile = worldTile(199, 8);
  clearBackgroundFromCorners(flagTile);
  putTile(tileset, 11, hasOpaquePixels(flagTile) ? flagTile : makeFlagTile());
  putTile(tileset, 12, worldTile(205, 11));
  putTile(tileset, 13, worldTile(188, 4));

  writePng('tiles/tiles_runtime.png', tileset);
  registerAsset('tiles_runtime', 'tiles/tiles_runtime.png', tileset.width, tileset.height, 'generated');

  TILE_NAMES.forEach((tileName, tileIndex) => {
    const tile = new PNG({ width: TILE_SIZE, height: TILE_SIZE });
    copyTile(tile, tileset, tileIndex * TILE_SIZE, 0);
    const rel = `tiles/${tileIndex.toString().padStart(2, '0')}_${tileName}.png`;
    writePng(rel, tile);
    registerAsset(`tile_${tileName}`, rel, TILE_SIZE, TILE_SIZE, 'generated');
  });
}

function buildGridExports() {
  GRID_EXPORTS.forEach((grid) => {
    const source = loadPngFromAny(grid.sourceFile);
    const cols = Math.floor(source.width / grid.tileW);
    const rows = Math.floor(source.height / grid.tileH);
    const metadata = {
      sourceFile: grid.sourceFile,
      sourceWidth: source.width,
      sourceHeight: source.height,
      tileW: grid.tileW,
      tileH: grid.tileH,
      cols,
      rows,
      files: [],
    };

    for (let row = 0; row < rows; row += 1) {
      for (let col = 0; col < cols; col += 1) {
        const frame = extractFrame(source, col * grid.tileW, row * grid.tileH, grid.tileW, grid.tileH);
        normalizeTransparentPixels(frame);
        const rel = `${grid.outDir}/r${row.toString().padStart(2, '0')}_c${col.toString().padStart(2, '0')}.png`;
        writePng(rel, frame);
        metadata.files.push(rel);
        if (grid.registerInManifest) {
          const key = `${path.basename(grid.outDir)}_${row}_${col}`;
          registerAsset(key, rel, grid.tileW, grid.tileH, grid.sourceFile);
        }
      }
    }

    const metadataPath = path.join(OUT_DIR, grid.outDir, 'index.json');
    ensureDir(path.dirname(metadataPath));
    fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
  });
}

function hashPngBytes(png) {
  return Buffer.from(png.data).toString('base64');
}

function buildWorld11UniqueTiles() {
  if (!fs.existsSync(WORLD11_SOLID_JSON)) {
    return;
  }

  const worldPng = loadPngFromAny('world_1-1_154289.png');
  const solidRef = JSON.parse(fs.readFileSync(WORLD11_SOLID_JSON, 'utf8'));
  const widthTiles = Number(solidRef.widthTiles);
  const heightTiles = Number(solidRef.heightTiles);
  if (!Number.isFinite(widthTiles) || !Number.isFinite(heightTiles)) {
    return;
  }

  const uniqueByHash = new Map();
  const mapRows = [];

  for (let y = 0; y < heightTiles; y += 1) {
    const row = [];
    for (let x = 0; x < widthTiles; x += 1) {
      const tile = extractFrame(worldPng, x * TILE_SIZE, 16 + y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
      const hash = hashPngBytes(tile);
      if (!uniqueByHash.has(hash)) {
        const id = `u${uniqueByHash.size.toString().padStart(3, '0')}`;
        const rel = `tiles/world11_unique/${id}.png`;
        normalizeTransparentPixels(tile);
        writePng(rel, tile);
        uniqueByHash.set(hash, { id, rel, x, y });
      }
      const ref = uniqueByHash.get(hash);
      row.push(ref.id);
    }
    mapRows.push(row);
  }

  const unique = Array.from(uniqueByHash.values()).map((entry) => ({
    id: entry.id,
    path: `${PUBLIC_PREFIX}/${entry.rel}`,
    firstAt: { x: entry.x, y: entry.y },
  }));

  const indexOut = {
    sourceFile: 'world_1-1_154289.png',
    widthTiles,
    heightTiles,
    tileSize: TILE_SIZE,
    uniqueCount: unique.length,
    unique,
    map: mapRows,
  };

  const indexPath = path.join(OUT_DIR, 'tiles', 'world11_unique', 'index.json');
  ensureDir(path.dirname(indexPath));
  fs.writeFileSync(indexPath, JSON.stringify(indexOut, null, 2));
}

function buildScorePopupSprites() {
  const hud = loadPngFromAny('hud_font_132605.png');
  const DIGIT_ROW_Y = 238;
  const GLYPH_START_X = 4;
  const GLYPH_STEP_X = 10;
  const GLYPH_W = 8;
  const GLYPH_H = 8;
  const labels = ['100', '200', '400', '800'];

  labels.forEach((text) => {
    const out = new PNG({ width: text.length * GLYPH_W, height: GLYPH_H });
    for (let i = 0; i < text.length; i += 1) {
      const digit = Number.parseInt(text[i], 10);
      const srcX = GLYPH_START_X + digit * GLYPH_STEP_X;
      for (let y = 0; y < GLYPH_H; y += 1) {
        for (let x = 0; x < GLYPH_W; x += 1) {
          const sx = srcX + x;
          const sy = DIGIT_ROW_Y + y;
          const si = (sy * hud.width + sx) * 4;
          const dx = i * GLYPH_W + x;
          const di = (y * out.width + dx) * 4;
          out.data[di] = hud.data[si];
          out.data[di + 1] = hud.data[si + 1];
          out.data[di + 2] = hud.data[si + 2];
          out.data[di + 3] = hud.data[si + 3];
        }
      }
    }
    const rel = `effects/score_${text}.png`;
    writePng(rel, out);
    registerAsset(`score_${text}`, rel, out.width, out.height, 'hud_font_132605.png');
  });
}

function buildFlagWaveSprites() {
  const tilesPath = path.join(OUT_DIR, 'tiles', 'tiles_runtime.png');
  const tiles = PNG.sync.read(fs.readFileSync(tilesPath));
  const base = new PNG({ width: TILE_SIZE, height: TILE_SIZE });
  copyTile(base, tiles, 11 * TILE_SIZE, 0);
  const wave = new PNG({ width: TILE_SIZE, height: TILE_SIZE });
  for (let y = 0; y < TILE_SIZE; y += 1) {
    const shift = y < 5 ? 1 : y < 10 ? -1 : 0;
    for (let x = 0; x < TILE_SIZE; x += 1) {
      const sx = Math.max(0, Math.min(TILE_SIZE - 1, x - shift));
      const si = (y * TILE_SIZE + sx) * 4;
      const di = (y * TILE_SIZE + x) * 4;
      wave.data[di] = base.data[si];
      wave.data[di + 1] = base.data[si + 1];
      wave.data[di + 2] = base.data[si + 2];
      wave.data[di + 3] = base.data[si + 3];
    }
  }

  writePng('effects/flag_wave_a.png', base);
  registerAsset('flag_wave_a', 'effects/flag_wave_a.png', TILE_SIZE, TILE_SIZE, 'generated');
  writePng('effects/flag_wave_b.png', wave);
  registerAsset('flag_wave_b', 'effects/flag_wave_b.png', TILE_SIZE, TILE_SIZE, 'generated');
}

function buildDerivedEnemyFlipSprites() {
  const deriveFlip = (sourceRel, targetRel, key) => {
    const targetPath = path.join(OUT_DIR, targetRel);
    if (fs.existsSync(targetPath)) {
      return;
    }
    const sourcePath = path.join(OUT_DIR, sourceRel);
    if (!fs.existsSync(sourcePath)) {
      return;
    }
    const source = PNG.sync.read(fs.readFileSync(sourcePath));
    const out = new PNG({ width: source.width, height: source.height });
    for (let y = 0; y < source.height; y += 1) {
      const fy = source.height - 1 - y;
      for (let x = 0; x < source.width; x += 1) {
        const si = (y * source.width + x) * 4;
        const di = (fy * out.width + x) * 4;
        out.data[di] = source.data[si];
        out.data[di + 1] = source.data[si + 1];
        out.data[di + 2] = source.data[si + 2];
        out.data[di + 3] = source.data[si + 3];
      }
    }
    writePng(targetRel, out);
    registerAsset(key, targetRel, out.width, out.height, 'generated');
  };

  deriveFlip('enemies/goomba_walk_a.png', 'enemies/goomba_flip.png', 'goomba_flip');
  deriveFlip('enemies/koopa_walk_a.png', 'enemies/koopa_flip.png', 'koopa_flip');
}

function writeManifest() {
  ensureDir(OUT_DIR);
  const manifestPath = path.join(OUT_DIR, 'manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
}

function main() {
  ensureDir(OUT_DIR);
  exportSprites();
  buildTilesetRuntime();
  buildScorePopupSprites();
  buildFlagWaveSprites();
  buildDerivedEnemyFlipSprites();
  buildGridExports();
  buildWorld11UniqueTiles();
  copyRawSheets();
  writeManifest();
  console.log(`Done. Individual assets exported to ${OUT_DIR}`);
}

main();
