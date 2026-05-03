import { describe, expect, it } from 'vitest';
import { PHYSICS_PROFILE, TARGET_FPS } from '../core/constants';
import { stepSimulation } from '../core/sim';
import type { CollisionWorld, InputSnapshot, SimState } from '../core/contracts';

describe('jump physics', () => {
  it('reaches at least 4 tiles of vertical height on full jump hold', () => {
    const floorY = 208;
    const world: CollisionWorld = {
      isSolidAtPixel: (_x, y) => y >= floorY,
    };

    let state: SimState = {
      x: 64,
      y: floorY,
      vx: 0,
      vy: 0,
      onGround: true,
    };

    let minY = state.y;
    for (let frame = 0; frame < 180; frame += 1) {
      const input: InputSnapshot = {
        left: false,
        right: false,
        down: false,
        jump: frame < 24,
        run: false,
      };
      state = stepSimulation(state, input, PHYSICS_PROFILE, 1 / TARGET_FPS, world);
      minY = Math.min(minY, state.y);
    }

    const jumpHeightPx = floorY - minY;
    expect(jumpHeightPx).toBeGreaterThanOrEqual(64);
  });
});
