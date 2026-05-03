import { describe, expect, it } from 'vitest';
import { PHYSICS_PROFILE, TARGET_FPS } from '../core/constants';
import { ReplayPlayer, ReplayRecorder } from '../core/replay';
import { stepSimulation } from '../core/sim';
import type { SimState } from '../core/contracts';
import { createCollisionWorld, createWorld11Definition } from '../level/world11';
import { scriptedInputs } from '../tests-support/replay-fixture';

describe('deterministic replay', () => {
  it('replays exact state from recorded inputs', () => {
    const level = createWorld11Definition();
    const collision = createCollisionWorld(level);

    const start: SimState = {
      x: level.start.x,
      y: level.start.y,
      vx: 0,
      vy: 0,
      onGround: true,
    };

    const recorder = new ReplayRecorder();
    const inputs = scriptedInputs(360);

    let recordedState = { ...start };
    inputs.forEach((input, index) => {
      recorder.record(index, input);
      recordedState = stepSimulation(recordedState, input, PHYSICS_PROFILE, 1 / TARGET_FPS, collision);
    });

    const playback = new ReplayPlayer(recorder.export());

    let playedState = { ...start };
    for (let frame = 0; frame < inputs.length; frame += 1) {
      const frameInput = playback.getInput(frame);
      playedState = stepSimulation(playedState, frameInput, PHYSICS_PROFILE, 1 / TARGET_FPS, collision);
    }

    expect(playedState.x).toBeCloseTo(recordedState.x, 5);
    expect(playedState.y).toBeCloseTo(recordedState.y, 5);
    expect(playedState.vx).toBeCloseTo(recordedState.vx, 5);
    expect(playedState.vy).toBeCloseTo(recordedState.vy, 5);
  });
});
