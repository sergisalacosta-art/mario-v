export function getFlagpoleScoreByHeight(heightTiles: number): number {
  if (heightTiles >= 8) {
    return 5000;
  }
  if (heightTiles >= 6) {
    return 2000;
  }
  if (heightTiles >= 4) {
    return 800;
  }
  if (heightTiles >= 2) {
    return 400;
  }
  return 100;
}

export function getFireworksCountFromTimer(secondsAtFlag: number): number {
  const lastDigit = Math.abs(Math.floor(secondsAtFlag)) % 10;
  if (lastDigit === 1 || lastDigit === 3 || lastDigit === 6) {
    return lastDigit;
  }
  return 0;
}

export function getTimerBonusTickFrames(): number {
  // Matches the current gameplay calibration target for SMAS-like conversion pacing.
  return 4;
}
