import { readFileSync } from 'node:fs';
import { PNG } from 'pngjs';
import { describe, it } from 'vitest';
import {
  SOLID_TILE_IDS,
  TILE_BRICK,
  TILE_GROUND_FILL,
  TILE_GROUND_TOP,
  TILE_FLAGPOLE,
  TILE_PIPE_TOP_LEFT,
  TILE_PIPE_TOP_RIGHT,
  TILE_QUESTION,
  TILE_STAIR,
} from '../core/constants';
import { createWorld11Definition } from '../level/world11';

const TILE_SIZE = 16;
const WORLD_OFFSET_Y = 16;

interface Template {
  id: number;
  x: number;
  y: number;
}

function extractTile(source: PNG, tileX: number, tileY: number): Uint8Array {
  const out = new Uint8Array(TILE_SIZE * TILE_SIZE * 4);
  for (let y = 0; y < TILE_SIZE; y += 1) {
    for (let x = 0; x < TILE_SIZE; x += 1) {
      const srcIndex = ((WORLD_OFFSET_Y + tileY * TILE_SIZE + y) * source.width + (tileX * TILE_SIZE + x)) * 4;
      const dstIndex = (y * TILE_SIZE + x) * 4;
      out[dstIndex] = source.data[srcIndex];
      out[dstIndex + 1] = source.data[srcIndex + 1];
      out[dstIndex + 2] = source.data[srcIndex + 2];
      out[dstIndex + 3] = source.data[srcIndex + 3];
    }
  }
  return out;
}

function samePixels(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) {
    return false;
  }
  for (let i = 0; i < a.length; i += 1) {
    if (a[i] !== b[i]) {
      return false;
    }
  }
  return true;
}

describe('world 1-1 calibration against reference map', () => {
  it('keeps solid-mask close to extracted reference tiles', () => {
    const image = PNG.sync.read(readFileSync('public/assets/smas/world_1-1_154289.png'));
    const level = createWorld11Definition();

    const templates: Template[] = [
      { id: TILE_GROUND_TOP, x: 5, y: 12 },
      { id: TILE_GROUND_FILL, x: 5, y: 13 },
      { id: TILE_BRICK, x: 20, y: 8 },
      { id: TILE_QUESTION, x: 16, y: 8 },
      { id: TILE_PIPE_TOP_LEFT, x: 28, y: 11 },
      { id: TILE_PIPE_TOP_RIGHT, x: 29, y: 11 },
      { id: TILE_PIPE_TOP_LEFT, x: 179, y: 10 },
      { id: TILE_PIPE_TOP_RIGHT, x: 180, y: 10 },
      { id: TILE_FLAGPOLE, x: 198, y: 8 },
      { id: TILE_STAIR, x: 188, y: 4 },
    ];
    const templatePixels = templates.map((template) => ({
      id: template.id,
      pixels: extractTile(image, template.x, template.y),
    }));

    const solidIdSet = new Set<number>(SOLID_TILE_IDS);
    const expectedSolid = new Set<string>();

    for (let y = 0; y < level.heightTiles; y += 1) {
      for (let x = 0; x < level.widthTiles; x += 1) {
        const tilePixels = extractTile(image, x, y);
        const match = templatePixels.find((template) => samePixels(tilePixels, template.pixels));
        if (!match) {
          continue;
        }
        expectedSolid.add(`${x},${y}`);
      }
    }

    const mismatches: string[] = [];
    for (let y = 0; y < level.heightTiles; y += 1) {
      for (let x = 0; x < level.widthTiles; x += 1) {
        // Castle area has many unique tiles; calibrated separately.
        if (x >= 204 && y <= 11) {
          continue;
        }

        const expected = expectedSolid.has(`${x},${y}`);
        const actual = solidIdSet.has(level.solidLayer[y][x]);
        if (expected !== actual) {
          mismatches.push(`${x},${y}:exp=${expected ? 1 : 0},act=${actual ? 1 : 0}`);
        }
      }
    }

    if (mismatches.length > 8) {
      throw new Error(`Too many layout mismatches (${mismatches.length}): ${mismatches.slice(0, 80).join(' | ')}`);
    }
  });
});
