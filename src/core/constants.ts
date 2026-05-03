import type { PhysicsProfile } from './contracts';

export const INTERNAL_WIDTH = 256;
export const INTERNAL_HEIGHT = 224;
export const TILE_SIZE = 16;
export const TARGET_FPS = 60.0988;
export const TARGET_FRAME_MS = 1000 / TARGET_FPS;
export const WORLD_Y_OFFSET = 16;

export const TILE_EMPTY = 0;
export const TILE_GROUND_TOP = 1;
export const TILE_GROUND_FILL = 2;
export const TILE_BRICK = 3;
export const TILE_QUESTION = 4;
export const TILE_QUESTION_USED = 5;
export const TILE_PIPE_TOP_LEFT = 6;
export const TILE_PIPE_TOP_RIGHT = 7;
export const TILE_PIPE_BODY_LEFT = 8;
export const TILE_PIPE_BODY_RIGHT = 9;
export const TILE_FLAGPOLE = 10;
export const TILE_FLAG = 11;
export const TILE_CASTLE = 12;
export const TILE_STAIR = 13;

export const SOLID_TILE_IDS = [
  TILE_GROUND_TOP,
  TILE_GROUND_FILL,
  TILE_BRICK,
  TILE_QUESTION,
  TILE_QUESTION_USED,
  TILE_PIPE_TOP_LEFT,
  TILE_PIPE_TOP_RIGHT,
  TILE_PIPE_BODY_LEFT,
  TILE_PIPE_BODY_RIGHT,
  TILE_FLAGPOLE,
  TILE_CASTLE,
  TILE_STAIR,
];

export const PHYSICS_PROFILE: PhysicsProfile = {
  walkAcceleration: 860,
  runAcceleration: 1220,
  walkMaxSpeed: 132,
  runMaxSpeed: 186,
  airAcceleration: 640,
  gravity: 1080,
  jumpVelocity: -386,
  minJumpCutoff: 0.58,
  dragX: 1700,
  maxFallSpeed: 468,
  bounceVelocity: -248,
  invulnerabilityMs: 1300,
};

export const CAMERA_SCROLL_TRIGGER_X = 112;
export const CAMERA_ACTIVATION_MARGIN = 24;
export const CAMERA_DESPAWN_MARGIN = 80;
