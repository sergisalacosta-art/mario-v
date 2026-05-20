import fs from 'node:fs';
import path from 'node:path';
import { PNG } from 'pngjs';

const projectRoot = process.cwd();
const targets = [
  path.join(projectRoot, 'public/assets/individual/enemies'),
  path.join(projectRoot, 'dist/assets/individual/enemies'),
];

const palette = {
  transparent: null,
  pigOutline: '#8f3956',
  pigBody: '#f59bb5',
  pigLight: '#ffd1df',
  pigDark: '#d66c8f',
  pigSnout: '#f7b7c8',
  pigNose: '#8f3956',
  sheepOutline: '#5f5f68',
  sheepWool: '#f7f7f3',
  sheepWoolShadow: '#d7d7d0',
  sheepFace: '#8d7d70',
  sheepFaceDark: '#64594f',
  wing: '#eef6ff',
};

function hexToRgba(hex) {
  const value = hex.replace('#', '');
  return {
    r: parseInt(value.slice(0, 2), 16),
    g: parseInt(value.slice(2, 4), 16),
    b: parseInt(value.slice(4, 6), 16),
    a: 255,
  };
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function writePng(filePath, width, height, rows, colorMap) {
  const png = new PNG({ width, height });
  for (let y = 0; y < height; y += 1) {
    const row = rows[y] ?? ''.padEnd(width, '.');
    for (let x = 0; x < width; x += 1) {
      const symbol = row[x] ?? '.';
      const colorKey = colorMap[symbol];
      const idx = (width * y + x) << 2;
      if (!colorKey) {
        png.data[idx + 0] = 0;
        png.data[idx + 1] = 0;
        png.data[idx + 2] = 0;
        png.data[idx + 3] = 0;
        continue;
      }
      const rgba = hexToRgba(colorKey);
      png.data[idx + 0] = rgba.r;
      png.data[idx + 1] = rgba.g;
      png.data[idx + 2] = rgba.b;
      png.data[idx + 3] = rgba.a;
    }
  }
  fs.writeFileSync(filePath, PNG.sync.write(png));
}

const pigColors = {
  '.': null,
  o: palette.pigOutline,
  p: palette.pigBody,
  l: palette.pigLight,
  d: palette.pigDark,
  s: palette.pigSnout,
  n: palette.pigNose,
};

const sheepColors = {
  '.': null,
  o: palette.sheepOutline,
  w: palette.sheepWool,
  s: palette.sheepWoolShadow,
  f: palette.sheepFace,
  d: palette.sheepFaceDark,
  g: palette.wing,
};

const pigWalkA = [
  '................',
  '................',
  '.....oo.........',
  '....oppooo......',
  '...oppppppoo....',
  '...opppppppsoo..',
  '..opppppppsssso.',
  '..opplppppsnnno.',
  '.opplllppppsssso',
  '.oppppppppppppo.',
  '.oppppppppppppo.',
  '..oppppppppppo..',
  '..ooppppppppo...',
  '...oo.o.o.o.....',
  '....o.o.o.o.....',
  '.....o.....o....',
  '................',
  '................',
];

const pigWalkB = [
  '................',
  '................',
  '.....oo.........',
  '....oppooo......',
  '...oppppppoo....',
  '...opppppppsoo..',
  '..opppppppsssso.',
  '..opplppppsnnno.',
  '.opplllppppsssso',
  '.oppppppppppppo.',
  '.oppppppppppppo.',
  '..oppppppppppo..',
  '..ooppppppppo...',
  '...oopp.o.oo....',
  '....o..o.o..o...',
  '.....oo...oo....',
  '................',
  '................',
];

const pigSquash = [
  '................',
  '................',
  '................',
  '................',
  '.....ooooooo....',
  '...ooppppppsoo..',
  '..ooppppppsssso.',
  '.oopppppppsnnnso',
  '.oopppppppsnnnso',
  '..ooppppppsssso.',
  '...oopppppppoo..',
  '....ooopppooo...',
  '......o...o.....',
  '................',
  '................',
  '................',
];

const pigFlip = [
  '................',
  '................',
  '.....o.....o....',
  '....o.o.o.o.....',
  '...oo.o.o.oo....',
  '..ooppppppppo...',
  '..oppppppppppo..',
  '.oppppppppppppo.',
  '.oppppppppppppo.',
  '.opplllppppsssso',
  '..opplppppsnnno.',
  '..opppppppsssso.',
  '...opppppppsoo..',
  '...oppppppoo....',
  '....oppooo......',
  '.....oo.........',
  '................',
  '................',
];

const sheepWalkA = [
  '................',
  '................',
  '................',
  '......ww........',
  '....owwwwoo.....',
  '...owwwwwwwwo...',
  '..owwwwwwwwwwwo.',
  '.owwwwwwwwwwwwfo',
  '.owwwswwwwwffffo',
  '.owwssswwwwffffo',
  '.owwwswwwwwffffo',
  '.owwwwwwwwwwwffo',
  '.owwwwwwwwwwwwo.',
  '..owwwwwwwwwwwo.',
  '..owwwwwwwwwwwo.',
  '...owwwo...owwo.',
  '...owwwo...owwo.',
  '....o.oo...oo...',
  '....o..o...o....',
  '................',
  '................',
  '................',
  '................',
  '................',
  '................',
];

const sheepWalkB = [
  '................',
  '................',
  '................',
  '......ww........',
  '....owwwwoo.....',
  '...owwwwwwwwo...',
  '..owwwwwwwwwwwo.',
  '.owwwwwwwwwwwwfo',
  '.owwwswwwwwffffo',
  '.owwssswwwwffffo',
  '.owwwswwwwwffffo',
  '.owwwwwwwwwwwffo',
  '.owwwwwwwwwwwwo.',
  '..owwwwwwwwwwwo.',
  '..owwwwwwwwwwwo.',
  '...owwwo...owwo.',
  '....owwo...owo..',
  '...oo..o..o.oo..',
  '.....oo....oo...',
  '................',
  '................',
  '................',
  '................',
  '................',
  '................',
];

const sheepWingA = [
  '................',
  '....g......g....',
  '...ggg....ggg...',
  '......ww........',
  '....owwwwoo.....',
  '...owwwwwwwwo...',
  '..owwwwwwwwwwwo.',
  '.owwwwwwwwwwwwfo',
  '.owwwswwwwwffffo',
  '.owwssswwwwffffo',
  '.owwwswwwwwffffo',
  '.owwwwwwwwwwwffo',
  '.owwwwwwwwwwwwo.',
  '..owwwwwwwwwwwo.',
  '..owwwwwwwwwwwo.',
  '...owwwo...owwo.',
  '...owwwo...owwo.',
  '....o.oo...oo...',
  '....o..o...o....',
  '................',
  '................',
  '................',
  '................',
  '................',
  '................',
];

const sheepWingB = [
  '................',
  '...ggg....ggg...',
  '....g......g....',
  '......ww........',
  '....owwwwoo.....',
  '...owwwwwwwwo...',
  '..owwwwwwwwwwwo.',
  '.owwwwwwwwwwwwfo',
  '.owwwswwwwwffffo',
  '.owwssswwwwffffo',
  '.owwwswwwwwffffo',
  '.owwwwwwwwwwwffo',
  '.owwwwwwwwwwwwo.',
  '..owwwwwwwwwwwo.',
  '..owwwwwwwwwwwo.',
  '...owwwo...owwo.',
  '....owwo...owo..',
  '...oo..o..o.oo..',
  '.....oo....oo...',
  '................',
  '................',
  '................',
  '................',
  '................',
  '................',
];

const sheepShell = [
  '................',
  '................',
  '......wwww......',
  '....owwwwwwoo...',
  '...owwwwwwwwwo..',
  '..owwwssssswwwo.',
  '.owwwssssssswwwo',
  '.owwssssssssswwo',
  '.owwssssssssswwo',
  '.owwssssssssswwo',
  '.owwwssssssswwwo',
  '..owwwssssswwwo.',
  '...owwwwwwwwwo..',
  '....owwwwwwwo...',
  '......wwww......',
  '................',
  '................',
  '................',
];

const sheepShellSpinA = [
  '................',
  '................',
  '......wwww......',
  '....owwwwwwoo...',
  '...owwwwwwwwwo..',
  '..owwssssssswwwo',
  '.owssssssssssswo',
  '.owssssssssssswo',
  '.owssssssssssswo',
  '.owssssssssssswo',
  '..owwssssssswwwo',
  '..owwwwwwwwwwwo.',
  '...owwwwwwwwwo..',
  '....owwwwwwwo...',
  '......wwww......',
  '................',
  '................',
  '................',
];

const sheepShellSpinB = [
  '................',
  '................',
  '......wwww......',
  '....owwwwwwoo...',
  '...owwwwwwwwwo..',
  '.owwwssssssswwwo',
  '.owssssssssssswo',
  '.owssssssssssswo',
  '.owssssssssssswo',
  '.owssssssssssswo',
  '.owwwssssssswwwo',
  '..owwwwwwwwwwwo.',
  '...owwwwwwwwwo..',
  '....owwwwwwwo...',
  '......wwww......',
  '................',
  '................',
  '................',
];

const sheepFlip = [
  '................',
  '................',
  '................',
  '......oooo......',
  '....oowwwwoo....',
  '...owwwwwwwwwo..',
  '..owwwssssswwwo.',
  '..owwssssssswwo.',
  '.owwsssssssssswo',
  '.owwsssssssssswo',
  '.owwsssssssssswo',
  '..owwssssssswwo.',
  '..owwwssssswwwo.',
  '...owwwwwwwwwo..',
  '....oowwwwoo....',
  '......oooo......',
  '................',
  '................',
];

const outputs = [
  { file: 'goomba_walk_a.png', width: 16, height: 16, rows: pigWalkA, colors: pigColors },
  { file: 'goomba_walk_b.png', width: 16, height: 16, rows: pigWalkB, colors: pigColors },
  { file: 'goomba_squash.png', width: 16, height: 16, rows: pigSquash, colors: pigColors },
  { file: 'goomba_flip.png', width: 16, height: 16, rows: pigFlip, colors: pigColors },
  { file: 'koopa_walk_a.png', width: 16, height: 24, rows: sheepWalkA, colors: sheepColors },
  { file: 'koopa_walk_b.png', width: 16, height: 24, rows: sheepWalkB, colors: sheepColors },
  { file: 'koopa_wing_a.png', width: 16, height: 24, rows: sheepWingA, colors: sheepColors },
  { file: 'koopa_wing_b.png', width: 16, height: 24, rows: sheepWingB, colors: sheepColors },
  { file: 'koopa_shell.png', width: 16, height: 16, rows: sheepShell, colors: sheepColors },
  { file: 'koopa_shell_spin_a.png', width: 16, height: 16, rows: sheepShellSpinA, colors: sheepColors },
  { file: 'koopa_shell_spin_b.png', width: 16, height: 16, rows: sheepShellSpinB, colors: sheepColors },
  { file: 'koopa_flip.png', width: 16, height: 16, rows: sheepFlip, colors: sheepColors },
];

for (const dir of targets) {
  ensureDir(dir);
  for (const output of outputs) {
    writePng(path.join(dir, output.file), output.width, output.height, output.rows, output.colors);
  }
}

console.log(`Generated ${outputs.length} enemy sprites in ${targets.length} directories.`);
