#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const TILE = {
  EMPTY: 0,
  GROUND_TOP: 1,
  BRICK: 3,
  QUESTION: 4,
  PIPE_TOP_LEFT: 6,
  PIPE_TOP_RIGHT: 7,
  PIPE_BODY_LEFT: 8,
  PIPE_BODY_RIGHT: 9,
  FLAGPOLE: 10,
  CASTLE: 12,
  STAIR: 13,
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const generatedJsonPath = path.join(__dirname, '../src/level/generated/world11-solid.generated.json');
const WORLD11_SOLID_GENERATED = JSON.parse(fs.readFileSync(generatedJsonPath, 'utf8'));

const solid = WORLD11_SOLID_GENERATED.solid.map((row) => row.map((v) => Number(v)));
const width = Number(WORLD11_SOLID_GENERATED.widthTiles);
const height = Number(WORLD11_SOLID_GENERATED.heightTiles);
const groundY = 12;

function derivePipes() {
  const pipes = [];
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width - 1; x += 1) {
      if (solid[y][x] !== TILE.PIPE_TOP_LEFT || solid[y][x + 1] !== TILE.PIPE_TOP_RIGHT) {
        continue;
      }
      let h = 1;
      while (y + h < height && solid[y + h][x] === TILE.PIPE_BODY_LEFT && solid[y + h][x + 1] === TILE.PIPE_BODY_RIGHT) {
        h += 1;
      }
      pipes.push({ x, topY: y, tileHeight: h, visibleAboveGround: groundY - y });
    }
  }
  return pipes.sort((a, b) => a.x - b.x);
}

function collectBlocks(type) {
  const points = [];
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (solid[y][x] === type) {
        points.push({ x, y });
      }
    }
  }
  return points;
}

function collectStairs() {
  const cols = [];
  for (let x = 0; x < width; x += 1) {
    let minY = Infinity;
    let maxY = -1;
    for (let y = 0; y < height; y += 1) {
      if (solid[y][x] === TILE.STAIR) {
        minY = Math.min(minY, y);
        maxY = Math.max(maxY, y);
      }
    }
    if (maxY >= 0) {
      cols.push({ x, topY: minY, bottomY: maxY, tileHeight: maxY - minY + 1 });
    }
  }
  return cols;
}

function collectGroundGaps() {
  const gaps = [];
  let start = -1;
  for (let x = 0; x < width; x += 1) {
    const solidGround = solid[groundY][x] === TILE.GROUND_TOP;
    if (!solidGround && start < 0) start = x;
    if (solidGround && start >= 0) {
      gaps.push({ from: start, to: x - 1, tiles: x - start });
      start = -1;
    }
  }
  if (start >= 0) {
    gaps.push({ from: start, to: width - 1, tiles: width - start });
  }
  return gaps;
}

function groupByY(points) {
  const map = new Map();
  for (const p of points) {
    if (!map.has(p.y)) map.set(p.y, []);
    map.get(p.y).push(p.x);
  }
  for (const xs of map.values()) xs.sort((a, b) => a - b);
  return [...map.entries()].sort((a, b) => a[0] - b[0]);
}

const pipes = derivePipes();
const brickBlocks = collectBlocks(TILE.BRICK);
const questionBlocks = collectBlocks(TILE.QUESTION);
const stairs = collectStairs();
const gaps = collectGroundGaps();
const flagX = Number(WORLD11_SOLID_GENERATED.flagpoleX);
const castleX = Number(WORLD11_SOLID_GENERATED.castleX);

console.log('WORLD 1-1 LAYOUT AUDIT');
console.log(`size: ${width}x${height} tiles`);
console.log(`flagpoleX: ${flagX} | castleX: ${castleX}`);
console.log('');

console.log('PIPES');
for (const pipe of pipes) {
  console.log(
    `x=${pipe.x} topY=${pipe.topY} tileHeight=${pipe.tileHeight} visibleAboveGround=${pipe.visibleAboveGround}`,
  );
}
console.log('');

console.log(`BLOCKS total=${brickBlocks.length + questionBlocks.length} bricks=${brickBlocks.length} questions=${questionBlocks.length}`);
for (const [y, xs] of groupByY(questionBlocks)) {
  console.log(`questions y=${y}: ${xs.join(',')}`);
}
for (const [y, xs] of groupByY(brickBlocks)) {
  console.log(`bricks    y=${y}: ${xs.join(',')}`);
}
console.log('');

console.log(`STAIRS columns=${stairs.length}`);
for (const s of stairs) {
  console.log(`x=${s.x} topY=${s.topY} bottomY=${s.bottomY} tileHeight=${s.tileHeight}`);
}
console.log('');

console.log('GROUND GAPS');
for (const gap of gaps) {
  console.log(`from=${gap.from} to=${gap.to} tiles=${gap.tiles}`);
}
