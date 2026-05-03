#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { PNG } from 'pngjs';

const ROOT = process.cwd();
const SRC_PNG = path.join(ROOT, 'public/assets/smas/world_1-1_154289.png');
const OUT_DIR = path.join(ROOT, 'src/level/generated');

const ENEMY_TILES = [
  { id: 'g1', kind: 'goomba', x: 22, y: 12, direction: -1 },
  { id: 'g2', kind: 'goomba', x: 40, y: 12, direction: -1 },
  { id: 'g3', kind: 'goomba', x: 53, y: 12, direction: -1 },
  { id: 'k1', kind: 'koopa', x: 63, y: 12, direction: -1 },
  { id: 'g4', kind: 'goomba', x: 89, y: 12, direction: -1 },
  { id: 'g5', kind: 'goomba', x: 92, y: 12, direction: -1 },
  { id: 'g6', kind: 'goomba', x: 108, y: 12, direction: -1 },
  { id: 'k2', kind: 'koopa', x: 111, y: 12, direction: -1 },
  { id: 'g7', kind: 'goomba', x: 123, y: 12, direction: -1 },
  { id: 'g8', kind: 'goomba', x: 126, y: 12, direction: -1 },
  { id: 'k3', kind: 'koopa', x: 171, y: 12, direction: -1 },
  { id: 'g9', kind: 'goomba', x: 175, y: 12, direction: -1 },
  { id: 'k4', kind: 'koopa', x: 177, y: 12, direction: -1 },
];

const QUESTION_CONTENT_OVERRIDES = new Map([
  ['16,8', 'mushroom'],
  ['129,4', 'fireflower'],
]);

function main() {
  if (!fs.existsSync(SRC_PNG)) {
    throw new Error(`Missing reference PNG: ${SRC_PNG}`);
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });

  const image = PNG.sync.read(fs.readFileSync(SRC_PNG));
  const widthTiles = image.width / 16;
  const sourceHeightTiles = image.height / 16;
  if (!Number.isInteger(widthTiles) || !Number.isInteger(sourceHeightTiles)) {
    throw new Error('Reference PNG does not align to 16x16 tiles.');
  }

  const hashAt = (tileX, tileY) => {
    const bytes = Buffer.alloc(16 * 16 * 4);
    let cursor = 0;
    for (let y = 0; y < 16; y += 1) {
      for (let x = 0; x < 16; x += 1) {
        const idx = ((tileY * 16 + y) * image.width + (tileX * 16 + x)) * 4;
        bytes[cursor++] = image.data[idx];
        bytes[cursor++] = image.data[idx + 1];
        bytes[cursor++] = image.data[idx + 2];
        bytes[cursor++] = image.data[idx + 3];
      }
    }
    return crypto.createHash('md5').update(bytes).digest('hex');
  };

  const HASH = {
    empty: hashAt(0, 0),
    groundTop: hashAt(5, 13),
    groundFill: hashAt(5, 14),
    brick: hashAt(20, 9),
    question: hashAt(16, 9),
    pipeTopLeft: hashAt(28, 11),
    pipeTopRight: hashAt(29, 11),
    pipeBodyLeft: hashAt(28, 12),
    pipeBodyRight: hashAt(29, 12),
    stair: hashAt(188, 5),
    flagpole: hashAt(198, 3),
  };

  // Castle uses multiple unique tiles: collect only the true castle cluster at the end.
  const castleHashes = new Set();
  for (let tileY = 8; tileY <= 12; tileY += 1) {
    for (let tileX = 204; tileX <= 207; tileX += 1) {
      const hash = hashAt(tileX, tileY);
      if (hash !== HASH.empty) {
        castleHashes.add(hash);
      }
    }
  }

  const heightTiles = 14;
  const solid = [];
  for (let y = 0; y < heightTiles; y += 1) {
    const sourceY = y + 1; // Skip fully transparent top row from PNG.
    const row = [];
    for (let x = 0; x < widthTiles; x += 1) {
      const hash = hashAt(x, sourceY);
      let tile = 0;
      if (hash === HASH.groundTop) tile = 1;
      else if (hash === HASH.groundFill) tile = 2;
      else if (hash === HASH.brick) tile = 3;
      else if (hash === HASH.question) tile = 4;
      else if (hash === HASH.pipeTopLeft) tile = 6;
      else if (hash === HASH.pipeTopRight) tile = 7;
      else if (hash === HASH.pipeBodyLeft) tile = 8;
      else if (hash === HASH.pipeBodyRight) tile = 9;
      else if (hash === HASH.flagpole) tile = 10;
      else if (hash === HASH.stair) tile = 13;
      else if (castleHashes.has(hash)) tile = 12;
      row.push(tile);
    }
    solid.push(row);
  }

  let flagpoleX = 198;
  for (let x = 0; x < widthTiles; x += 1) {
    let count = 0;
    for (let y = 0; y < heightTiles; y += 1) {
      if (solid[y][x] === 10) count += 1;
    }
    if (count >= 6) {
      flagpoleX = x;
      break;
    }
  }

  let castleX = 204;
  for (let x = 0; x < widthTiles; x += 1) {
    let hasCastle = false;
    for (let y = 0; y < heightTiles; y += 1) {
      if (solid[y][x] === 12) {
        hasCastle = true;
        break;
      }
    }
    if (hasCastle) {
      castleX = x;
      break;
    }
  }

  const blocks = [];
  for (let y = 0; y < heightTiles; y += 1) {
    for (let x = 0; x < widthTiles; x += 1) {
      const tile = solid[y][x];
      if (tile === 4) {
        const key = `${x},${y}`;
        blocks.push({
          x,
          y,
          kind: 'question',
          contains: QUESTION_CONTENT_OVERRIDES.get(key) ?? 'coin',
        });
      } else if (tile === 3) {
        blocks.push({
          x,
          y,
          kind: 'brick',
          contains: 'none',
        });
      }
    }
  }

  const solidData = {
    widthTiles,
    heightTiles,
    solid,
    flagpoleX,
    castleX,
    hashes: HASH,
    castleHashes: Array.from(castleHashes),
  };

  const solidJson = path.join(OUT_DIR, 'world11-solid.generated.json');
  const solidTs = path.join(OUT_DIR, 'world11-solid.generated.ts');
  fs.writeFileSync(solidJson, `${JSON.stringify(solidData, null, 2)}\n`);
  fs.writeFileSync(solidTs, `export const WORLD11_SOLID_GENERATED = ${JSON.stringify(solidData, null, 2)} as const;\n`);

  const entities = {
    blocks,
    enemySpawnsTiles: ENEMY_TILES,
  };
  const entitiesTs = path.join(OUT_DIR, 'world11-entities.generated.ts');
  fs.writeFileSync(
    entitiesTs,
    `export const WORLD11_ENTITIES_GENERATED = ${JSON.stringify(entities, null, 2)} as const;\n`,
  );

  console.log(
    `Generated world11 data: ${widthTiles}x${heightTiles}, blocks=${blocks.length}, enemySpawns=${ENEMY_TILES.length}`,
  );
}

main();
