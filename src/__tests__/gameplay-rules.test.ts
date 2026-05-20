import { describe, expect, it } from 'vitest';
import { computeCameraScrollX, isStompCollision, type AxisAlignedBodySnapshot } from '../core/gameplay-rules';

function makeBody(overrides: Partial<AxisAlignedBodySnapshot>): AxisAlignedBodySnapshot {
  return {
    left: 0,
    right: 16,
    top: 0,
    bottom: 16,
    centerX: 8,
    centerY: 8,
    prevY: 0,
    height: 16,
    velocityY: 0,
    deltaY: 0,
    touchingDown: false,
    blockedDown: false,
    touchingUp: false,
    blockedUp: false,
    ...overrides,
  };
}

describe('gameplay rules', () => {
  it('allows the camera to move backward with Mario while respecting bounds', () => {
    expect(computeCameraScrollX(200, 260, 112, 1000)).toBe(148);
    expect(computeCameraScrollX(148, 220, 112, 1000)).toBe(108);
    expect(computeCameraScrollX(108, 180, 112, 1000)).toBe(68);
    expect(computeCameraScrollX(68, 80, 112, 1000)).toBe(0);
  });

  it('clamps camera travel at the world edges', () => {
    expect(computeCameraScrollX(0, 40, 112, 1000)).toBe(0);
    expect(computeCameraScrollX(980, 1400, 112, 1000)).toBe(1000);
  });

  it('counts a downward contact from above as a stomp', () => {
    const mario = makeBody({
      left: 10,
      right: 22,
      top: 10,
      bottom: 24,
      centerY: 17,
      prevY: 8,
      velocityY: 110,
      deltaY: 3,
    });
    const enemy = makeBody({
      left: 10,
      right: 24,
      top: 22,
      bottom: 36,
      centerY: 29,
      prevY: 22,
    });

    expect(isStompCollision(mario, enemy)).toBe(true);
  });

  it('rejects a side hit even with some overlap', () => {
    const mario = makeBody({
      left: 2,
      right: 14,
      top: 16,
      bottom: 30,
      centerY: 23,
      prevY: 16,
      velocityY: 20,
      deltaY: 0.5,
    });
    const enemy = makeBody({
      left: 12,
      right: 26,
      top: 18,
      bottom: 32,
      centerY: 25,
      prevY: 18,
    });

    expect(isStompCollision(mario, enemy)).toBe(false);
  });

  it('accepts an edge stomp when Mario is still clearly above the enemy', () => {
    const mario = makeBody({
      left: 20,
      right: 31,
      top: 10,
      bottom: 24,
      centerX: 25.5,
      centerY: 17,
      prevY: 8,
      velocityY: 120,
      deltaY: 3,
    });
    const enemy = makeBody({
      left: 28,
      right: 42,
      top: 22,
      bottom: 36,
      centerY: 29,
      prevY: 22,
    });

    expect(isStompCollision(mario, enemy)).toBe(true);
  });

  it('accepts a very thin edge stomp when Mario approached from above', () => {
    const mario = makeBody({
      left: 16.6,
      right: 28.2,
      top: 9,
      bottom: 22.8,
      centerX: 22.4,
      centerY: 15.9,
      prevY: 6,
      velocityY: 105,
      deltaY: 2.8,
    });
    const enemy = makeBody({
      left: 28,
      right: 42,
      top: 21.8,
      bottom: 35.8,
      centerY: 28.8,
      prevY: 21.8,
    });

    expect(isStompCollision(mario, enemy)).toBe(true);
  });
});
