# SMAS 1-1 Completion Plan (7 fases)

## Fase 1 - Base técnica y assets runtime (done)
- Motor Phaser + fixed-step `60.0988`.
- Render interno `256x224` y presentación `4:3`.
- Carga prioritaria desde `public/assets/individual`.
- Fallback extraction activo para no romper runtime si faltan PNG sueltos.

## Fase 2 - Geometría jugable del 1-1 (done)
- Suelo, gaps, pipes, staircases, bloques, flagpole y castillo calibrados.
- Colisión por tile consolidada en runtime y en simulación determinista.

## Fase 3 - Fondos y composición visual (done)
- `decor/clouds_strip.png`, `decor/hills_strip_a.png`, `decor/hills_strip_b.png` integrados.
- Limpieza de transparencia para clouds/hills aplicada.
- Orden de capas y offsets corregidos para visibilidad estable.

## Fase 4 - Mario, ítems y enemigos base (done)
- Mario `small/super/fire` funcional.
- Goomba/Koopa (incluyendo shell state, kick, shell-vs-enemy).
- Question blocks, coin blocks, mushroom/fireflower, bricks rompibles, fireballs.
- Autoplay de captura mejorado con anti-stall para checkpoints automáticos.

## Fase 5 - HUD, estados y UX de nivel (done)
- HUD bitmap SMAS funcional y legible.
- Timer, score, coins, world y secuencias death/clear implementadas.
- Flujo de captura mantiene timer estable sin reinicios en autoplay.

## Fase 6 - Audio y sincronía de eventos (done)
- BGM + SFX base (jump/coin/stomp) activos.
- Hooks activos para `break/powerup/death/flagpole/clear` además de base.

## Fase 7 - Calibración + aceptación final (done)
- Replay determinista y tests de layout/física activos.
- Pipeline YouTube implementado: expected + actual auto + diff harness.
- `npm run phase:verify` en verde (typecheck, tests y build).
