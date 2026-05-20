import { describe, expect, it } from 'vitest';
import { createCollisionWorld, createWorld11Definition } from '../level/world11';

const TILE_SIZE = 16;
const GROUND_ROW = 12;

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
    expect(world.isSolidAtPixel(10, 13 * TILE_SIZE)).toBe(true);
  });

  it('has pits at ground row that enemies can fall into', () => {
    const level = createWorld11Definition();
    const world = createCollisionWorld(level);

    let pitCount = 0;
    for (let tileX = 0; tileX < level.widthTiles; tileX++) {
      if (!world.isSolidAtPixel(tileX * TILE_SIZE + 8, GROUND_ROW * TILE_SIZE + 2)) {
        pitCount++;
      }
    }
    expect(pitCount).toBeGreaterThan(0);
  });

  it('has at least one enemy spawn positioned over a pit (will fall on activation)', () => {
    const level = createWorld11Definition();
    const world = createCollisionWorld(level);

    const spawnOverPit = level.enemySpawns.find(
      (spawn) => !world.isSolidAtPixel(spawn.x + 8, spawn.y + 2),
    );
    expect(spawnOverPit).toBeDefined();
  });

  it('all easy-mode enemy spawns use the default sprite set — no hard-mode ram contamination', () => {
    const level = createWorld11Definition();
    level.enemySpawns.forEach((spawn) => {
      expect(spawn.spriteSet).not.toBe('ram');
    });
  });
});
