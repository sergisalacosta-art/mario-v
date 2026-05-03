import type { InputSnapshot } from '../core/contracts';

const NEUTRAL: InputSnapshot = { left: false, right: false, down: false, jump: false, run: false };

export function scriptedInputs(frames: number): InputSnapshot[] {
  const snapshots: InputSnapshot[] = [];

  for (let frame = 0; frame < frames; frame += 1) {
    if (frame < 4) {
      snapshots.push({ ...NEUTRAL });
      continue;
    }

    if (frame < 200) {
      snapshots.push({ left: false, right: true, down: false, jump: frame === 14 || (frame >= 118 && frame <= 120), run: true });
      continue;
    }

    snapshots.push({ ...NEUTRAL });
  }

  return snapshots;
}
