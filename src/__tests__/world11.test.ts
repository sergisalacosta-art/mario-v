import { describe, expect, it } from 'vitest';
import { createCollisionWorld, createWorld11Definition } from '../level/world11';

describe('world 1-1 definition', () => {
  it('has expected dimensions and key gameplay anchors', () => {
    const level = createWorld11Definition();
    expect(level.widthTiles).toBe(214);
    expect(level.heightTiles).toBe(14);
    expect(level.blocks.length).toBe(38);
    expect(level.enemySpawns.length).toBeGreaterThanOrEqual(7);
    expect(level.pipePlantSpawns.length).toBe(2);
    expect(level.flagpole.x).toBe(198);
  });

  it('exposes collision around floor and empty sky', () => {
    const level = createWorld11Definition();
    const world = createCollisionWorld(level);

    expect(world.isSolidAtPixel(10, 2)).toBe(false);
    expect(world.isSolidAtPixel(10, 13 * 16)).toBe(true);
  });
});
