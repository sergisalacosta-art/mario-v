import Phaser from 'phaser';
import { INTERNAL_HEIGHT, INTERNAL_WIDTH } from '../core/constants';
import type { HudState } from '../core/contracts';
import { Hud } from '../hud/hud';
import { DEFAULT_SESSION_STATE, normalizeSessionState, type SceneFlowPayload, type SessionState } from './flow-state';

const AUTO_ADVANCE_MS = 2200;
const CONFIRM_KEYCODES = [
  Phaser.Input.Keyboard.KeyCodes.ENTER,
  Phaser.Input.Keyboard.KeyCodes.SPACE,
  Phaser.Input.Keyboard.KeyCodes.Z,
  Phaser.Input.Keyboard.KeyCodes.X,
];
const UP_KEYCODES = [Phaser.Input.Keyboard.KeyCodes.UP, Phaser.Input.Keyboard.KeyCodes.W];
const DOWN_KEYCODES = [Phaser.Input.Keyboard.KeyCodes.DOWN, Phaser.Input.Keyboard.KeyCodes.S];
const GAME_OVER_OPTIONS = ['CONTINUE', 'SAVE&CONTINUE', 'SAVE&QUIT'] as const;
const CURSOR_X = 68;
const CURSOR_Y_START = 102;
const CURSOR_Y_STEP = 16;
const CURSOR_BLINK_MS = 180;
const OPTION_HITBOX_X = 82;
const OPTION_HITBOX_WIDTH = 124;
const OPTION_HITBOX_HEIGHT = 12;

export class GameOverScene extends Phaser.Scene {
  private sessionState: SessionState = DEFAULT_SESSION_STATE;
  private timeUp = false;
  private confirmKeys: Phaser.Input.Keyboard.Key[] = [];
  private upKeys: Phaser.Input.Keyboard.Key[] = [];
  private downKeys: Phaser.Input.Keyboard.Key[] = [];
  private readyAtMs = 0;
  private advanced = false;
  private wasGamepadConfirmPressed = false;
  private selectedOptionIndex = 0;
  private cursorSprite: Phaser.GameObjects.Image | Phaser.GameObjects.Text | null = null;
  private wasGamepadUpPressed = false;
  private wasGamepadDownPressed = false;
  private contentRoot: Phaser.GameObjects.Container | null = null;
  private revealAtMs = 0;
  private revealFadeMs = 0;
  private revealed = false;
  private hudOverlay: Hud | null = null;

  public constructor() {
    super({ key: 'game-over' });
  }

  public create(payload?: SceneFlowPayload): void {
    this.sessionState = normalizeSessionState(payload?.session);
    this.timeUp = payload?.timeUp === true;
    this.cameras.main.setBackgroundColor('#000000');
    this.revealAtMs = this.time.now + Math.max(0, Math.floor(payload?.transition?.delayMs ?? 0));
    this.revealFadeMs = Math.max(0, Math.floor(payload?.transition?.fadeInMs ?? 0));
    this.revealed = false;
    this.contentRoot = this.add.container(0, 0);
    this.hudOverlay = null;

    const screenKey = this.timeUp ? 'screen_time_up' : 'screen_game_over';
    if (this.textures.exists(screenKey)) {
      this.contentRoot.add(this.add.image(INTERNAL_WIDTH * 0.5, INTERNAL_HEIGHT * 0.5, screenKey).setOrigin(0.5, 0.5).setDepth(20));
    } else {
      this.contentRoot.add(
        this.add
          .text(INTERNAL_WIDTH * 0.5, INTERNAL_HEIGHT * 0.5, this.timeUp ? 'TIME UP' : 'GAME OVER', {
            fontFamily: '"Courier New", monospace',
            fontSize: '20px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 5,
          })
          .setOrigin(0.5)
          .setDepth(20),
      );
    }

    this.confirmKeys = CONFIRM_KEYCODES.map((code) => this.input.keyboard!.addKey(code));
    this.upKeys = UP_KEYCODES.map((code) => this.input.keyboard!.addKey(code));
    this.downKeys = DOWN_KEYCODES.map((code) => this.input.keyboard!.addKey(code));
    this.input.on(Phaser.Input.Events.POINTER_MOVE, (pointer: Phaser.Input.Pointer) => {
      if (this.timeUp || this.advanced) {
        return;
      }
      const idx = this.resolveOptionAt(pointer.x, pointer.y);
      this.input.setDefaultCursor(idx === null ? 'default' : 'pointer');
      if (idx !== null && idx !== this.selectedOptionIndex) {
        this.selectedOptionIndex = idx;
        this.updateCursorPosition();
      }
    });
    this.input.on(Phaser.Input.Events.POINTER_DOWN, (pointer: Phaser.Input.Pointer) => {
      if (this.advanced || this.time.now < this.revealAtMs + this.revealFadeMs) {
        return;
      }
      if (this.timeUp) {
        this.triggerTimeUpContinue();
        return;
      }
      const idx = this.resolveOptionAt(pointer.x, pointer.y);
      if (idx !== null) {
        this.selectedOptionIndex = idx;
        this.updateCursorPosition();
      }
      this.triggerSelectedOption();
    });

    if (!this.timeUp) {
      this.contentRoot.add(this.add.rectangle(74, 106, 18, 12, 0x000000, 1).setDepth(30));
      if (this.textures.exists('screen_game_over_cursor')) {
        this.cursorSprite = this.add.image(CURSOR_X, CURSOR_Y_START, 'screen_game_over_cursor').setOrigin(0, 0).setDepth(35);
      } else {
        this.cursorSprite = this.add
          .text(CURSOR_X, CURSOR_Y_START - 1, '<>', {
            fontFamily: '"Courier New", monospace',
            fontSize: '10px',
            color: '#ffffff',
          })
          .setOrigin(0, 0)
          .setDepth(35);
      }
      this.contentRoot.add(this.cursorSprite);
      this.updateCursorPosition();
    }
    this.contentRoot.setAlpha(this.revealAtMs > this.time.now || this.revealFadeMs > 0 ? 0 : 1);
    if (this.contentRoot.alpha >= 1) {
      this.ensureHudOverlay();
    }
    this.readyAtMs = this.time.now + AUTO_ADVANCE_MS;
  }

  public update(): void {
    if (this.advanced) {
      return;
    }
    this.updateContentReveal();
    this.updateCursorBlink();
    if (this.time.now < this.revealAtMs + this.revealFadeMs) {
      return;
    }

    if (this.timeUp) {
      const keyboardStart = this.confirmKeys.some((key) => Phaser.Input.Keyboard.JustDown(key));
      const gamepadStart = this.consumeGamepadConfirmPress();
      const timedAdvance = this.time.now >= this.readyAtMs;
      if (!keyboardStart && !gamepadStart && !timedAdvance) {
        return;
      }
      this.triggerTimeUpContinue();
      return;
    }

    const moveUp = this.upKeys.some((key) => Phaser.Input.Keyboard.JustDown(key)) || this.consumeGamepadUpPress();
    const moveDown =
      this.downKeys.some((key) => Phaser.Input.Keyboard.JustDown(key)) || this.consumeGamepadDownPress();
    if (moveUp || moveDown) {
      const delta = moveDown ? 1 : -1;
      this.selectedOptionIndex =
        (this.selectedOptionIndex + delta + GAME_OVER_OPTIONS.length) % GAME_OVER_OPTIONS.length;
      this.updateCursorPosition();
    }

    const keyboardStart = this.confirmKeys.some((key) => Phaser.Input.Keyboard.JustDown(key));
    const gamepadStart = this.consumeGamepadConfirmPress();
    if (!keyboardStart && !gamepadStart) {
      return;
    }
    this.triggerSelectedOption();
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

  private consumeGamepadUpPress(): boolean {
    const pads = this.input.gamepad?.gamepads ?? [];
    const pressed = pads.some((pad) => {
      if (!pad) {
        return false;
      }
      const dpadUp = pad.buttons[12]?.pressed ?? false;
      const axisUp = pad.axes[1] !== undefined ? pad.axes[1].getValue() < -0.5 : false;
      return dpadUp || axisUp;
    });
    const justPressed = pressed && !this.wasGamepadUpPressed;
    this.wasGamepadUpPressed = pressed;
    return justPressed;
  }

  private consumeGamepadDownPress(): boolean {
    const pads = this.input.gamepad?.gamepads ?? [];
    const pressed = pads.some((pad) => {
      if (!pad) {
        return false;
      }
      const dpadDown = pad.buttons[13]?.pressed ?? false;
      const axisDown = pad.axes[1] !== undefined ? pad.axes[1].getValue() > 0.5 : false;
      return dpadDown || axisDown;
    });
    const justPressed = pressed && !this.wasGamepadDownPressed;
    this.wasGamepadDownPressed = pressed;
    return justPressed;
  }

  private updateCursorPosition(): void {
    const y = CURSOR_Y_START + this.selectedOptionIndex * CURSOR_Y_STEP;
    if (this.cursorSprite instanceof Phaser.GameObjects.Image) {
      this.cursorSprite.setPosition(CURSOR_X, y);
      return;
    }
    if (this.cursorSprite instanceof Phaser.GameObjects.Text) {
      this.cursorSprite.setPosition(CURSOR_X, y - 1);
    }
  }

  private updateContentReveal(): void {
    if (!this.contentRoot || this.revealed) {
      return;
    }
    if (this.time.now < this.revealAtMs) {
      this.contentRoot.setAlpha(0);
      return;
    }
    this.revealed = true;
    if (this.revealFadeMs <= 0) {
      this.contentRoot.setAlpha(1);
      this.ensureHudOverlay();
      return;
    }
    this.tweens.add({
      targets: this.contentRoot,
      alpha: 1,
      duration: this.revealFadeMs,
      ease: 'Linear',
      onComplete: () => this.ensureHudOverlay(),
    });
  }

  private updateCursorBlink(): void {
    if (!this.cursorSprite || this.timeUp) {
      return;
    }
    const visible = Math.floor(this.time.now / CURSOR_BLINK_MS) % 2 === 0;
    this.cursorSprite.setVisible(visible);
  }

  private ensureHudOverlay(): void {
    if (this.hudOverlay) {
      return;
    }
    this.hudOverlay = new Hud(this);
    const hudState: HudState = {
      score: this.sessionState.score,
      coins: this.sessionState.coins,
      world: this.sessionState.world,
      timeRemainingFrames: 0,
      lives: this.sessionState.lives,
    };
    this.hudOverlay.render(hudState);
  }

  private resolveOptionAt(x: number, y: number): number | null {
    for (let i = 0; i < GAME_OVER_OPTIONS.length; i += 1) {
      const optionY = CURSOR_Y_START + i * CURSOR_Y_STEP - 2;
      if (
        x >= OPTION_HITBOX_X &&
        x <= OPTION_HITBOX_X + OPTION_HITBOX_WIDTH &&
        y >= optionY &&
        y <= optionY + OPTION_HITBOX_HEIGHT
      ) {
        return i;
      }
    }
    return null;
  }

  private triggerTimeUpContinue(): void {
    if (this.advanced) {
      return;
    }
    this.advanced = true;
    if (this.sessionState.lives > 0) {
      this.scene.start('start', { session: this.sessionState });
      return;
    }
    this.scene.start('final-screen', { session: this.sessionState });
  }

  private triggerSelectedOption(): void {
    if (this.advanced) {
      return;
    }
    this.advanced = true;
    const selected = GAME_OVER_OPTIONS[this.selectedOptionIndex];
    if (selected === 'SAVE&QUIT') {
      this.scene.start('title', { session: DEFAULT_SESSION_STATE });
      return;
    }
    this.scene.start('start', {
      session: {
        ...this.sessionState,
        lives: 3,
      },
    });
  }
}
