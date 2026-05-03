import { describe, expect, it } from 'vitest';
import { createLevelDefinitionByVariant } from '../level/world11';

describe('world 4-1 video variant', () => {
  it('exposes extra mode metadata and entities', () => {
    const level = createLevelDefinitionByVariant('world4_1_video');
    expect(level.variantId).toBe('world4_1_video');
    expect(level.world).toBe('4');
    expect(level.stage).toBe('1');
    expect(level.coinSpawns.length).toBeGreaterThanOrEqual(8);
    expect(level.pipePlantSpawns.length).toBeGreaterThanOrEqual(1);
    expect(level.enemySpawns.some((spawn) => spawn.kind === 'lakitu')).toBe(true);
    expect(level.enemySpawns.some((spawn) => spawn.kind === 'goomba')).toBe(true);
    expect(level.enemySpawns.some((spawn) => spawn.kind === 'koopa')).toBe(true);
  });

  it('keeps base world dimensions and timing to avoid dynamics regressions', () => {
    const base = createLevelDefinitionByVariant('world1_1');
    const level = createLevelDefinitionByVariant('world4_1_video');
    expect(level.widthTiles).toBe(214);
    expect(level.heightTiles).toBe(14);
    expect(level.start.x).toBe(2 * 16);
    expect(level.start.y).toBe(12 * 16);
    expect(level.timeLimitSeconds).toBe(base.timeLimitSeconds);

    const baseSpawnIds = new Set(base.enemySpawns.map((spawn) => spawn.id));
    const variantSpawnIds = new Set(level.enemySpawns.map((spawn) => spawn.id));
    baseSpawnIds.forEach((spawnId) => {
      expect(variantSpawnIds.has(spawnId)).toBe(true);
    });
  });
});
