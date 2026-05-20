import { describe, expect, it } from 'vitest';
import { createCollisionWorld, createLevelDefinitionByVariant } from '../level/world11';

describe('world 4-1 clean variant', () => {
  it('exposes a standalone hard-mode skeleton', () => {
    const level = createLevelDefinitionByVariant('world4_1_clean');
    expect(level.variantId).toBe('world4_1_clean');
    expect(level.world).toBe('4');
    expect(level.stage).toBe('1');
    expect(level.enemySpawns.length).toBeGreaterThanOrEqual(16);
    expect(level.enemySpawns.some((spawn) => spawn.kind === 'lakitu')).toBe(true);
    expect(level.enemySpawns.filter((spawn) => spawn.kind === 'spiny').length).toBeGreaterThanOrEqual(3);
    expect(level.pipePlantSpawns.length).toBe(5);
    expect(level.pipes.length).toBe(6);
    expect(level.blocks.some((block) => block.contains === 'mushroom')).toBe(true);
    expect(level.coinSpawns.length).toBe(0);
    const lakitu = level.enemySpawns.find((spawn) => spawn.kind === 'lakitu');
    expect(lakitu).toBeDefined();
    expect(lakitu!.x).toBeGreaterThan(84 * 16);
    expect(lakitu!.exitMarioX).toBeGreaterThan(lakitu!.x);
    expect(level.pipes.some((pipe) => pipe.x > 132 && pipe.topY <= 8)).toBe(true);
    expect(level.blocks.some((block) => block.x >= 140 && block.x <= 144 && block.y === 8)).toBe(true);
  });

  it('does not inherit the full enemy spawn list from easy mode', () => {
    const base = createLevelDefinitionByVariant('world1_1');
    const clean = createLevelDefinitionByVariant('world4_1_clean');
    expect(clean.widthTiles).toBe(base.widthTiles);
    expect(clean.heightTiles).toBe(base.heightTiles);
    expect(clean.start.x).toBe(2 * 16);
    expect(clean.start.y).toBe(12 * 16);
    const baseIds = new Set(base.enemySpawns.map((spawn) => spawn.id));
    expect(clean.enemySpawns.every((spawn) => !baseIds.has(spawn.id))).toBe(true);
  });

  it('keeps walking enemies on solid ground support', () => {
    const level = createLevelDefinitionByVariant('world4_1_clean');
    const world = createCollisionWorld(level);

    level.enemySpawns
      .filter((spawn) => spawn.kind === 'goomba' || spawn.kind === 'koopa' || spawn.kind === 'spiny')
      .forEach((spawn) => {
        expect(world.isSolidAtPixel(spawn.x + 8, spawn.y + 2)).toBe(true);
      });
  });
});
