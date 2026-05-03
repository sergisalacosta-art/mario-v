import Phaser from 'phaser';
import { INTERNAL_HEIGHT, INTERNAL_WIDTH } from '../core/constants';
import { DEFAULT_SESSION_STATE, normalizeSessionState, type SceneFlowPayload, type SessionState } from './flow-state';

const START_DELAY_MS = 1200;
const CONFIRM_KEYCODES = [
  Phaser.Input.Keyboard.KeyCodes.ENTER,
  Phaser.Input.Keyboard.KeyCodes.SPACE,
  Phaser.Input.Keyboard.KeyCodes.Z,
  Phaser.Input.Keyboard.KeyCodes.X,
];

export class StartScene extends Phaser.Scene {
  private sessionState: SessionState = DEFAULT_SESSION_STATE;
  private confirmKeys: Phaser.Input.Keyboard.Key[] = [];
  private transitionAtMs = 0;
  private started = false;
  private wasGamepadConfirmPressed = false;

  public constructor() {
    super({ key: 'start' });
  }

  public create(payload?: SceneFlowPayload): void {
    this.started = false;
    this.wasGamepadConfirmPressed = false;
    this.sessionState = normalizeSessionState(payload?.session);
    this.cameras.main.setBackgroundColor('#000000');

    this.add
      .text(INTERNAL_WIDTH * 0.5, INTERNAL_HEIGHT * 0.45, `WORLD ${this.sessionState.world}`, {
        fontFamily: '"Courier New", monospace',
        fontSize: '14px',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 3,
      })
      .setOrigin(0.5)
      .setDepth(20);

    const livesY = INTERNAL_HEIGHT * 0.55;
    const livesX = INTERNAL_WIDTH * 0.5;
    if (this.textures.exists('mario_small_idle')) {
      this.add.image(livesX - 14, livesY, 'mario_small_idle').setOrigin(0.5, 1).setDepth(20);
    }
    this.add
      .text(livesX + 10, livesY - 6, `x ${this.sessionState.lives}`, {
        fontFamily: '"Courier New", monospace',
        fontSize: '13px',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 3,
      })
      .setOrigin(0, 0.5)
      .setDepth(20);

    this.confirmKeys = CONFIRM_KEYCODES.map((code) => this.input.keyboard!.addKey(code));
    this.input.on(Phaser.Input.Events.POINTER_DOWN, () => {
      this.beginGame();
    });
    this.transitionAtMs = this.time.now + START_DELAY_MS;
    this.time.delayedCall(START_DELAY_MS, () => {
      this.beginGame();
    });
  }

  public update(): void {
    if (this.started) {
      return;
    }

    const keyboardStart = this.confirmKeys.some((key) => Phaser.Input.Keyboard.JustDown(key));
    const gamepadStart = this.consumeGamepadConfirmPress();
    const timedStart = this.time.now >= this.transitionAtMs;
    if (!keyboardStart && !gamepadStart && !timedStart) {
      return;
    }

    this.beginGame();
  }

  private beginGame(): void {
    if (this.started) {
      return;
    }
    this.started = true;
    this.scene.start('game', {
      session: this.sessionState,
    });
  }

  private consumeGamepadConfirmPress(): boolean {
    const pads = this.input.gamepad?.gamepads ?? [];
    const pressed = pads.some((pad) => {
      if (!pad) {
        return false;
      }
      const startPressed = pad.buttons[9]?.pressed ?? false;
      const southPressed = pad.buttons[0]?.pressed ?? false;
      return startPressed || southPressed;
    });
    const justPressed = pressed && !this.wasGamepadConfirmPressed;
    this.wasGamepadConfirmPressed = pressed;
    return justPressed;
  }
}
