import type { InputSnapshot, ReplayData, ReplayFrame, ReplayStateSnapshot } from './contracts';
import { TARGET_FPS } from './constants';

const EMPTY_INPUT: InputSnapshot = {
  left: false,
  right: false,
  down: false,
  jump: false,
  run: false,
};

export class ReplayRecorder {
  private readonly frames: ReplayFrame[] = [];

  public record(frame: number, input: InputSnapshot, state?: ReplayStateSnapshot): void {
    this.frames.push({
      frame,
      input: { ...input },
      state: state ? { ...state } : undefined,
    });
  }

  public export(): ReplayData {
    return {
      fps: TARGET_FPS,
      frames: this.frames.map((entry) => ({
        frame: entry.frame,
        input: { ...entry.input },
        state: entry.state ? { ...entry.state } : undefined,
      })),
    };
  }

  public reset(): void {
    this.frames.length = 0;
  }
}

export class ReplayPlayer {
  private readonly frameMap = new Map<number, ReplayFrame>();

  public constructor(replay: ReplayData) {
    replay.frames.forEach((entry) => {
      this.frameMap.set(entry.frame, {
        frame: entry.frame,
        input: { ...entry.input },
        state: entry.state ? { ...entry.state } : undefined,
      });
    });
  }

  public getInput(frame: number): InputSnapshot {
    return this.frameMap.get(frame)?.input ?? EMPTY_INPUT;
  }

  public getState(frame: number): ReplayStateSnapshot | null {
    return this.frameMap.get(frame)?.state ?? null;
  }
}
