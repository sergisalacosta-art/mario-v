import Phaser from 'phaser';
import { INTERNAL_HEIGHT, INTERNAL_WIDTH, TARGET_FPS } from './constants';
import { BootScene } from '../scenes/boot-scene';
import { IntroScene } from '../scenes/intro-scene';
import { GameScene } from '../scenes/game-scene';
import { TitleScene } from '../scenes/title-scene';
import { StartScene } from '../scenes/start-scene';
import { GameOverScene } from '../scenes/game-over-scene';
import { FinalScreenScene } from '../scenes/final-screen-scene';

export function createGame(parent: string): Phaser.Game {
  const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.CANVAS,
    parent,
    width: INTERNAL_WIDTH,
    height: INTERNAL_HEIGHT,
    pixelArt: true,
    backgroundColor: '#000000',
    render: {
      pixelArt: true,
      antialias: false,
      roundPixels: true,
    },
    fps: {
      target: TARGET_FPS,
      forceSetTimeOut: true,
      smoothStep: false,
    },
    physics: {
      default: 'arcade',
      arcade: {
        gravity: { x: 0, y: 0 },
        fps: TARGET_FPS,
        debug: false,
      },
    },
    scale: {
      mode: Phaser.Scale.NONE,
      autoRound: false,
    },
    scene: [BootScene, IntroScene, TitleScene, StartScene, GameScene, GameOverScene, FinalScreenScene],
  };

  // Phaser can pause when the tab is not visible; headless captures need the loop to keep running.
  (config as Phaser.Types.Core.GameConfig & { disableVisibilityChange?: boolean }).disableVisibilityChange = true;

  return new Phaser.Game(config);
}
