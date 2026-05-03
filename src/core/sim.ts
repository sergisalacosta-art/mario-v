import type { CollisionWorld, InputSnapshot, PhysicsProfile, SimState } from './contracts';

const PLAYER_HALF_WIDTH = 6;
const PLAYER_HEIGHT = 15;

export function stepSimulation(
  state: SimState,
  input: InputSnapshot,
  profile: PhysicsProfile,
  dtSeconds: number,
  world: CollisionWorld,
): SimState {
  const next: SimState = { ...state };

  const horizontal = Number(input.right) - Number(input.left);
  const maxSpeed = input.run ? profile.runMaxSpeed : profile.walkMaxSpeed;
  const acceleration = next.onGround
    ? input.run
      ? profile.runAcceleration
      : profile.walkAcceleration
    : profile.airAcceleration;

  if (horizontal !== 0) {
    next.vx += horizontal * acceleration * dtSeconds;
  } else if (next.onGround) {
    const drag = profile.dragX * dtSeconds;
    if (Math.abs(next.vx) <= drag) {
      next.vx = 0;
    } else {
      next.vx -= Math.sign(next.vx) * drag;
    }
  }

  next.vx = clamp(next.vx, -maxSpeed, maxSpeed);
  next.vy += profile.gravity * dtSeconds;
  next.vy = Math.min(next.vy, profile.maxFallSpeed);

  if (input.jump && next.onGround) {
    next.vy = profile.jumpVelocity;
    next.onGround = false;
  }

  if (!input.jump && next.vy < 0) {
    next.vy *= profile.minJumpCutoff;
  }

  const afterHorizontal = resolveHorizontal(next, dtSeconds, world);
  const afterVertical = resolveVertical(afterHorizontal, dtSeconds, world);

  return afterVertical;
}

function resolveHorizontal(state: SimState, dtSeconds: number, world: CollisionWorld): SimState {
  const next = { ...state };
  next.x += next.vx * dtSeconds;

  const left = next.x - PLAYER_HALF_WIDTH;
  const right = next.x + PLAYER_HALF_WIDTH;
  const top = next.y - PLAYER_HEIGHT;
  const bottom = next.y - 1;

  if (next.vx > 0 && (world.isSolidAtPixel(right, top + 2) || world.isSolidAtPixel(right, bottom - 2))) {
    next.x = Math.floor(right / 16) * 16 - PLAYER_HALF_WIDTH;
    next.vx = 0;
  }
  if (next.vx < 0 && (world.isSolidAtPixel(left, top + 2) || world.isSolidAtPixel(left, bottom - 2))) {
    next.x = Math.floor(left / 16 + 1) * 16 + PLAYER_HALF_WIDTH;
    next.vx = 0;
  }

  return next;
}

function resolveVertical(state: SimState, dtSeconds: number, world: CollisionWorld): SimState {
  const next = { ...state };
  next.y += next.vy * dtSeconds;
  next.onGround = false;

  const left = next.x - PLAYER_HALF_WIDTH + 1;
  const right = next.x + PLAYER_HALF_WIDTH - 1;
  const top = next.y - PLAYER_HEIGHT;
  const bottom = next.y - 1;

  if (next.vy > 0 && (world.isSolidAtPixel(left, bottom) || world.isSolidAtPixel(right, bottom))) {
    next.y = Math.floor(bottom / 16) * 16;
    next.vy = 0;
    next.onGround = true;
  }
  if (next.vy < 0 && (world.isSolidAtPixel(left, top) || world.isSolidAtPixel(right, top))) {
    next.y = Math.floor(top / 16 + 1) * 16 + PLAYER_HEIGHT;
    next.vy = 0;
  }

  return next;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
