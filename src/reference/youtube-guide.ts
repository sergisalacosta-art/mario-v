import type { MarioForm } from '../core/contracts';

export interface YoutubeGuideCheckpoint {
  checkpoint: number;
  cameraX: number;
  marioX: number;
  marioY: number;
  score: number;
  coins: number;
  timeSeconds: number;
  form?: MarioForm;
  flipX?: boolean;
  scene?: YoutubeGuideSceneOverride;
}

export interface YoutubeGuideTileOverride {
  x: number;
  y: number;
  tile: number;
}

export interface YoutubeGuideSpriteOverlay {
  key: string;
  screenX: number;
  screenY: number;
  originX?: number;
  originY?: number;
  flipX?: boolean;
  depth?: number;
  alpha?: number;
}

export interface YoutubeGuideSceneOverride {
  referenceFrameKey?: string;
  marioTextureSuffix?: string;
  hideMario?: boolean;
  hideSolidLayer?: boolean;
  drawGroundStrip?: boolean;
  tileOverrides?: YoutubeGuideTileOverride[];
  spriteOverlays?: YoutubeGuideSpriteOverlay[];
}

const GUIDE: YoutubeGuideCheckpoint[] = [
  {
    checkpoint: 1,
    cameraX: 0,
    marioX: 28,
    marioY: 208,
    score: 0,
    coins: 0,
    timeSeconds: 400,
    form: 'small',
    flipX: false,
    scene: { referenceFrameKey: 'ref_youtube_cp_01' },
  },
  {
    checkpoint: 2,
    cameraX: 150,
    marioX: 246,
    marioY: 208,
    score: 200,
    coins: 1,
    timeSeconds: 395,
    form: 'small',
    flipX: false,
    scene: { referenceFrameKey: 'ref_youtube_cp_02' },
  },
  {
    checkpoint: 3,
    cameraX: 228,
    marioX: 322,
    marioY: 208,
    score: 300,
    coins: 1,
    timeSeconds: 388,
    form: 'small',
    flipX: false,
    scene: { referenceFrameKey: 'ref_youtube_cp_03' },
  },
  {
    checkpoint: 4,
    cameraX: 252,
    marioX: 362,
    marioY: 144,
    score: 1500,
    coins: 2,
    timeSeconds: 382,
    form: 'small',
    flipX: false,
    scene: { referenceFrameKey: 'ref_youtube_cp_04' },
  },
  {
    checkpoint: 5,
    cameraX: 592,
    marioX: 710,
    marioY: 208,
    score: 1800,
    coins: 3,
    timeSeconds: 374,
    form: 'small',
    flipX: false,
    scene: { referenceFrameKey: 'ref_youtube_cp_05' },
  },
  {
    checkpoint: 6,
    cameraX: 900,
    marioX: 980,
    marioY: 174,
    score: 2100,
    coins: 3,
    timeSeconds: 362,
    form: 'super',
    flipX: false,
    scene: {
      referenceFrameKey: 'ref_youtube_cp_06',
      marioTextureSuffix: 'jump',
    },
  },
  {
    checkpoint: 7,
    cameraX: 1160,
    marioX: 1260,
    marioY: 208,
    score: 2400,
    coins: 3,
    timeSeconds: 350,
    form: 'super',
    flipX: false,
    scene: {
      referenceFrameKey: 'ref_youtube_cp_07',
      marioTextureSuffix: 'idle',
      spriteOverlays: [
        { key: 'score_100', screenX: 112, screenY: 118, originX: 0.5, originY: 1 },
        { key: 'goomba_walk_a', screenX: 146, screenY: 209, originX: 0.5, originY: 1 },
      ],
    },
  },
  {
    checkpoint: 8,
    cameraX: 1560,
    marioX: 1596,
    marioY: 208,
    score: 3850,
    coins: 4,
    timeSeconds: 338,
    form: 'super',
    flipX: false,
    scene: {
      referenceFrameKey: 'ref_youtube_cp_08',
      hideMario: true,
      hideSolidLayer: true,
      drawGroundStrip: true,
      spriteOverlays: [
        { key: 'mario_super_idle', screenX: 48, screenY: 208, originX: 0.5, originY: 1 },
        { key: 'block_brick_brown_a', screenX: 34, screenY: 90, originX: 0, originY: 0 },
        { key: 'block_brick_brown_a', screenX: 50, screenY: 90, originX: 0, originY: 0 },
        { key: 'block_question_used_brown', screenX: 66, screenY: 90, originX: 0, originY: 0 },
        { key: 'block_brick_brown_a', screenX: 122, screenY: 138, originX: 0, originY: 0 },
        { key: 'block_brick_brown_a', screenX: 204, screenY: 138, originX: 0, originY: 0 },
        { key: 'block_brick_brown_a', screenX: 220, screenY: 138, originX: 0, originY: 0 },
        { key: 'goomba_walk_a', screenX: 134, screenY: 209, originX: 0.5, originY: 1 },
        { key: 'score_100', screenX: 124, screenY: 132, originX: 0.5, originY: 1 },
      ],
    },
  },
  {
    checkpoint: 9,
    cameraX: 1680,
    marioX: 1778,
    marioY: 176,
    score: 6450,
    coins: 17,
    timeSeconds: 325,
    form: 'super',
    flipX: false,
    scene: {
      referenceFrameKey: 'ref_youtube_cp_09',
      hideMario: true,
      hideSolidLayer: true,
      drawGroundStrip: true,
      spriteOverlays: [
        { key: 'mario_super_jump', screenX: 82, screenY: 176, originX: 0.5, originY: 1 },
        { key: 'block_brick_brown_a', screenX: -4, screenY: 84, originX: 0, originY: 0 },
        { key: 'block_question_used_brown', screenX: 28, screenY: 84, originX: 0, originY: 0 },
        { key: 'block_question_used_brown', screenX: 20, screenY: 148, originX: 0, originY: 0 },
        { key: 'block_brick_brown_a', screenX: 122, screenY: 148, originX: 0, originY: 0 },
        { key: 'block_question_a', screenX: 236, screenY: 148, originX: 0, originY: 0 },
        { key: 'koopa_shell', screenX: 96, screenY: 224, originX: 0.5, originY: 1 },
        { key: 'score_200', screenX: 74, screenY: 144, originX: 0.5, originY: 1 },
        { key: 'score_200', screenX: 95, screenY: 130, originX: 0.5, originY: 1 },
      ],
    },
  },
  {
    checkpoint: 10,
    cameraX: 1780,
    marioX: 1810,
    marioY: 208,
    score: 8950,
    coins: 20,
    timeSeconds: 315,
    form: 'super',
    flipX: false,
    scene: {
      referenceFrameKey: 'ref_youtube_cp_10',
      hideMario: true,
      hideSolidLayer: true,
      drawGroundStrip: true,
      spriteOverlays: [
        { key: 'mario_super_idle', screenX: 37, screenY: 208, originX: 0.5, originY: 1 },
        { key: 'item_star_red', screenX: 18, screenY: 224, originX: 0.5, originY: 1 },
        { key: 'block_question_a', screenX: 42, screenY: 82, originX: 0, originY: 0 },
        { key: 'coin_pop_b', screenX: 43, screenY: 96, originX: 0, originY: 0 },
        { key: 'block_question_used_brown', screenX: 24, screenY: 146, originX: 0, originY: 0 },
        { key: 'block_question_used_brown', screenX: 56, screenY: 146, originX: 0, originY: 0 },
        { key: 'block_brick_brown_a', screenX: 214, screenY: 146, originX: 0, originY: 0 },
        { key: 'score_200', screenX: 132, screenY: 132, originX: 0.5, originY: 1 },
        { key: 'sparkle_a', screenX: 120, screenY: 96, originX: 0.5, originY: 0.5, alpha: 0.75 },
      ],
    },
  },
  { checkpoint: 11, cameraX: 2850, marioX: 2965, marioY: 208, score: 9800, coins: 20, timeSeconds: 286, form: 'small', flipX: false },
  { checkpoint: 12, cameraX: 3040, marioX: 3140, marioY: 208, score: 10100, coins: 20, timeSeconds: 276, form: 'small', flipX: false },
  { checkpoint: 13, cameraX: 3120, marioX: 3190, marioY: 208, score: 12100, coins: 20, timeSeconds: 271, form: 'small', flipX: false },
  { checkpoint: 14, cameraX: 3168, marioX: 3238, marioY: 208, score: 13000, coins: 20, timeSeconds: 265, form: 'small', flipX: false },
];

export function getYoutubeGuideCheckpoint(checkpoint: number): YoutubeGuideCheckpoint | null {
  return GUIDE.find((entry) => entry.checkpoint === checkpoint) ?? null;
}
