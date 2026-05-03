# SMAS SMB1 World 1-1 Clone (Phaser 3)

Fan project focused on recreating **Super Mario All-Stars (SNES) World 1-1** with fixed-step gameplay and deterministic replay support.

## Quick Start

```bash
cd /Users/pauavila/zeba/all-stars
npm install
npm run assets:download
npm run level:generate
npm run assets:individual
npm run dev -- --host 127.0.0.1 --port 4173
```

Then open `http://127.0.0.1:4173`.

## Deploy to `zeba.cat/mar10/`

Build for subpath:

```bash
npm run build:mar10
```

Local check of subpath build:

```bash
npm run preview:mar10
```

Then open `http://127.0.0.1:4174/mar10/`.

Upload the contents of `dist/` into your server folder mapped to `zeba.cat/mar10/`.

## Controls

- Move: `Left` / `Right`
- Jump: `Z`, `Space`, or `Up`
- Run: `X` or `Shift`
- Fireball (when Fire Mario): hold `X` or `Shift`
- Gamepad: D-pad/left stick, `A` jump, `B` run

## Fidelity Targets

- Internal render: `256x224`
- Fixed step: `60.0988 Hz`
- Presentation: forced `4:3`
- World scope: full playable `1-1`

## Tests

```bash
npm run test:run
```

## 7-Phase Workflow

- Plan/estado: `PHASES.md`
- Verificación integral de fases:

```bash
npm run phase:verify
```

Included:
- world layout/collision checks
- deterministic replay checks
- pixel diff harness (activates when fixture PNGs exist)

Regenerate level geometry/entities from `public/assets/smas/world_1-1_154289.png`:

```bash
npm run level:generate
```

## ROM Calibration Workflow (Local)

Use your own ROM locally in an emulator and record a clean gameplay video (no CRT shader/filters).

1. Export a reference gameplay video (`.mp4`) from your emulator.
2. Generate expected checkpoints from that video:

```bash
npm run ref:expected -- /absolute/path/to/smas-world11.mp4
```

Shortcut flow (ROM hash + expected generation + guide frame sync):

```bash
npm run ref:rom:world11 -- "/Users/pauavila/Downloads/Super Mario All-Stars + Super Mario World (USA).sfc" /absolute/path/to/smas-world11.mp4
```

Optional if your video has borders:

```bash
npm run ref:expected -- /absolute/path/to/smas-world11.mp4 scripts/reference/checkpoints.txt tests/fixtures "crop=1440:1080:240:0"
```

`ref:expected` now auto-detects black borders/canvas area when no crop is provided.

3. Put browser screenshots of your clone into one folder (ordered by checkpoint).
4. Import them as actual checkpoints:

```bash
npm run ref:actual -- /absolute/path/to/my-actual-screens
```

5. Run pixel checks:

```bash
npm run test:run
```

## YouTube Calibration (this video)

Reference used:
- `https://www.youtube.com/watch?v=Y8EXjcb6XV8`

Generate expected checkpoints directly from YouTube:

```bash
npm run ref:youtube
```

Outputs expected PNGs in `tests/fixtures/youtube`.

Generate actual checkpoints automatically from your current clone (headless):

```bash
npm run ref:actual:auto
```

For `checkpoints-youtube-Y8EXjcb6XV8.txt`, the tool now auto-enables guided checkpoint mode (`guide=youtube`) to better align camera/Mario/HUD per frame.

If your game is already running on a custom port (for example `4173`):

```bash
npm run ref:actual:auto -- scripts/reference/checkpoints-youtube-Y8EXjcb6XV8.txt tests/fixtures/youtube http://127.0.0.1:4173
```

Full auto flow (expected + actual + diff test):

```bash
npm run ref:youtube:auto
```

## Asset Notes

`npm run assets:download` pulls the referenced sprite sheets from Spriters Resource into `public/assets/smas`.
It also fetches clean Mario `super/fire` GIF sheets from MarioUniverse as optional extraction fallback.
`npm run assets:individual` exports all currently used gameplay sprites as individual PNG files to `public/assets/individual` plus `manifest.json`.
The game now attempts to load runtime assets from `public/assets/individual` first, so replacing those PNGs is enough to reskin without editing sprite sheets.
Main editable folders:
- `public/assets/individual/mario`
- `public/assets/individual/enemies`
- `public/assets/individual/items`
- `public/assets/individual/effects`
- `public/assets/individual/tiles`
- `public/assets/individual/decor`
- `public/assets/individual/screens`
- `public/assets/individual/grids` (sheets trocejadas completas para edición masiva)
- `public/assets/individual/tiles/world11_unique` (tiles únicos exactos del mapa 1-1 + `index.json`)
Audio is intentionally manual in `public/audio/smas`.

Gameplay flow now includes:
- title screen
- world start screen (`WORLD 1-1`, lives)
- `TIME UP` screen
- `GAME OVER` menu (`CONTINUE`, `SAVE&CONTINUE`, `SAVE&QUIT`)
- final end screen (`Tornar a jugar`, `Veure més projectes`, `Contacta amb zeba`)
  - Uses `public/assets/custom/finalscreen.jpeg` when present.
  - External links:
    - `https://www.zeba.cat/projectes`
    - `https://zeba.cat/contacte/`

Quick scene debug URLs:
- `/?scene=game-over`
- `/?scene=time-up`
- `/?scene=final-screen`

## Full Reference Calibration (/Downloads videos)

Uses these local videos by default:
- `/Users/pauavila/Downloads/world11.mp4`
- `/Users/pauavila/Downloads/world11-gameover.mp4`
- `/Users/pauavila/Downloads/mar10-start.mp4`

Generate all expected packs and sync guide frames:

```bash
npm run ref:all:expected
```

Capture actual packs for all components (world11 + gameover flow + start flow):

```bash
npm run ref:all:actual
```

Run snapshot diff validation:

```bash
npm run test:run
```

## Audio Calibration

Auto-download calibrated SMAS audio assets:

```bash
npm run audio:download
```

Source packs used by the script:
- KHInsider (SMAS gamerip tracks for title/overworld/clear/death)
- The Sounds Resource (SMAS/SMW SFX ZIP)

Optional: extract audio cue clips from your local `/Users/pauavila/Downloads/mario-sound.mp4`:

```bash
npm run ref:audio:cues
```
