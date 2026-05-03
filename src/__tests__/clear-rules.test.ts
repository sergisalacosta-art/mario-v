import { describe, expect, it } from 'vitest';
import { getFireworksCountFromTimer, getFlagpoleScoreByHeight, getTimerBonusTickFrames } from '../core/clear-rules';

describe('level clear rules', () => {
  it('maps flagpole contact height to canonical score bands', () => {
    expect(getFlagpoleScoreByHeight(0)).toBe(100);
    expect(getFlagpoleScoreByHeight(2)).toBe(400);
    expect(getFlagpoleScoreByHeight(4)).toBe(800);
    expect(getFlagpoleScoreByHeight(6)).toBe(2000);
    expect(getFlagpoleScoreByHeight(8)).toBe(5000);
  });

  it('maps timer last digit to fireworks count', () => {
    expect(getFireworksCountFromTimer(351)).toBe(1);
    expect(getFireworksCountFromTimer(353)).toBe(3);
    expect(getFireworksCountFromTimer(356)).toBe(6);
    expect(getFireworksCountFromTimer(350)).toBe(0);
    expect(getFireworksCountFromTimer(359)).toBe(0);
  });

  it('keeps bonus conversion cadence stable', () => {
    expect(getTimerBonusTickFrames()).toBe(4);
  });
});
