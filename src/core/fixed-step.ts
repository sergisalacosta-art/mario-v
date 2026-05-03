import { TARGET_FRAME_MS } from './constants';

export class FixedStepClock {
  private accumulatorMs = 0;
  private readonly maxSubSteps: number;

  public constructor(maxSubSteps = 4) {
    this.maxSubSteps = maxSubSteps;
  }

  public tick(deltaMs: number, cb: () => void): void {
    this.accumulatorMs += deltaMs;
    let steps = 0;

    while (this.accumulatorMs >= TARGET_FRAME_MS && steps < this.maxSubSteps) {
      cb();
      this.accumulatorMs -= TARGET_FRAME_MS;
      steps += 1;
    }

    if (steps === this.maxSubSteps) {
      this.accumulatorMs = 0;
    }
  }

  public reset(): void {
    this.accumulatorMs = 0;
  }
}
