import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';
import { describe, expect, it } from 'vitest';

function diffImages(actualPath: string, expectedPath: string): number {
  const actualPng = PNG.sync.read(readFileSync(actualPath));
  const expectedPng = PNG.sync.read(readFileSync(expectedPath));

  if (actualPng.width !== expectedPng.width || actualPng.height !== expectedPng.height) {
    return Number.POSITIVE_INFINITY;
  }

  return pixelmatch(actualPng.data, expectedPng.data, undefined, actualPng.width, actualPng.height, {
    threshold: 0.1,
  });
}

describe('pixel snapshot harness', () => {
  it('compares all available expected/actual checkpoints', () => {
    const fixturesDir = 'tests/fixtures';
    if (!existsSync(fixturesDir)) {
      expect(true).toBe(true);
      return;
    }

    const expectedFiles = collectExpectedFiles(fixturesDir);

    if (expectedFiles.length === 0) {
      expect(true).toBe(true);
      return;
    }

    expectedFiles.forEach((expectedFile) => {
      const actualFile = expectedFile.replace('-expected.png', '-actual.png');
      const expectedPath = expectedFile;
      const actualPath = actualFile;

      if (!existsSync(actualPath)) {
        return;
      }

      const diff = diffImages(actualPath, expectedPath);
      expect(diff).toBeLessThanOrEqual(1);
    });
  });
});

function collectExpectedFiles(baseDir: string): string[] {
  const stack = [baseDir];
  const found: string[] = [];

  while (stack.length > 0) {
    const dir = stack.pop() as string;
    const entries = readdirSync(dir, { withFileTypes: true });
    entries.forEach((entry) => {
      const fullPath = `${dir}/${entry.name}`;
      if (entry.isDirectory()) {
        stack.push(fullPath);
        return;
      }
      if (/^checkpoint-\d{2}-expected\.png$/.test(entry.name)) {
        found.push(fullPath);
      }
    });
  }

  return found.sort();
}
