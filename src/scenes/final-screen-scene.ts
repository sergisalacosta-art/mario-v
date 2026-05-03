import Phaser from 'phaser';
import { getClientBranding, resolveClientIdFromWindow } from '../branding/client-config';
import { INTERNAL_HEIGHT, INTERNAL_WIDTH } from '../core/constants';
import { DEFAULT_SESSION_STATE, type SceneFlowPayload } from './flow-state';

const CONFIRM_KEYCODES = [
  Phaser.Input.Keyboard.KeyCodes.ENTER,
  Phaser.Input.Keyboard.KeyCodes.SPACE,
  Phaser.Input.Keyboard.KeyCodes.Z,
  Phaser.Input.Keyboard.KeyCodes.X,
];
const CANCEL_KEYCODES = [Phaser.Input.Keyboard.KeyCodes.ESC, Phaser.Input.Keyboard.KeyCodes.BACKSPACE];
const UP_KEYCODES = [Phaser.Input.Keyboard.KeyCodes.UP, Phaser.Input.Keyboard.KeyCodes.W];
const DOWN_KEYCODES = [Phaser.Input.Keyboard.KeyCodes.DOWN, Phaser.Input.Keyboard.KeyCodes.S];
const OPTION_Y_START = 138;
const OPTION_Y_STEP = 18;
const OPTION_X_CENTER = 171;

type FinalOptionAction = 'replay' | 'projects' | 'contact';

interface FinalOption {
  label: string;
  action: FinalOptionAction;
}

export class FinalScreenScene extends Phaser.Scene {
  private confirmKeys: Phaser.Input.Keyboard.Key[] = [];
  private cancelKeys: Phaser.Input.Keyboard.Key[] = [];
  private upKeys: Phaser.Input.Keyboard.Key[] = [];
  private downKeys: Phaser.Input.Keyboard.Key[] = [];
  private selectedIndex = 0;
  private wasGamepadConfirmPressed = false;
  private wasGamepadUpPressed = false;
  private wasGamepadDownPressed = false;
  private optionLabels: Phaser.GameObjects.Text[] = [];
  private selectingLocked = false;
  private optionChangedAtMs = 0;
  private finalBgm: Phaser.Sound.BaseSound | null = null;
  private clientBranding = getClientBranding('verregassos');
  private options: FinalOption[] = [];

  public constructor() {
    super({ key: 'final-screen' });
  }

  public create(_payload?: SceneFlowPayload): void {
    this.clientBranding = getClientBranding(resolveClientIdFromWindow());
    this.options = [
      { label: 'TORNAR A JUGAR', action: 'replay' },
      { label: this.clientBranding.finalScreen.projectsLabel, action: 'projects' },
      { label: this.clientBranding.finalScreen.contactLabel, action: 'contact' },
    ];

    this.cameras.main.setBackgroundColor('#000000');
    this.cameras.main.fadeIn(220, 0, 0, 0);
    this.sound.stopAll();
    this.playFinalBgmIfLoaded();

    if (this.textures.exists('final_screen_bg')) {
      this.add
        .image(0, 0, 'final_screen_bg')
        .setOrigin(0, 0)
        .setDisplaySize(INTERNAL_WIDTH, INTERNAL_HEIGHT)
        .setDepth(1);
    } else {
      this.add.rectangle(INTERNAL_WIDTH * 0.5, INTERNAL_HEIGHT * 0.5, INTERNAL_WIDTH, INTERNAL_HEIGHT, 0xf7c400).setDepth(1);
    }

    this.optionLabels = this.options.map((option, index) =>
      this.add
        .text(OPTION_X_CENTER, OPTION_Y_START + index * OPTION_Y_STEP, option.label, {
          fontFamily: '"Courier New", monospace',
          fontSize: '11px',
          color: '#ffffff',
          stroke: '#000000',
          strokeThickness: 3,
        })
        .setOrigin(0.5, 0.5)
        .setDepth(4),
    );
    this.refreshOptionHighlight();

    this.confirmKeys = CONFIRM_KEYCODES.map((code) => this.input.keyboard!.addKey(code));
    this.cancelKeys = CANCEL_KEYCODES.map((code) => this.input.keyboard!.addKey(code));
    this.upKeys = UP_KEYCODES.map((code) => this.input.keyboard!.addKey(code));
    this.downKeys = DOWN_KEYCODES.map((code) => this.input.keyboard!.addKey(code));

    this.input.setDefaultCursor('default');
    this.input.on(Phaser.Input.Events.POINTER_MOVE, (pointer: Phaser.Input.Pointer) => {
      if (this.selectingLocked) {
        return;
      }
      const idx = this.resolveOptionAt(pointer.x, pointer.y);
      this.input.setDefaultCursor(idx === null ? 'default' : 'pointer');
      if (idx === null || idx === this.selectedIndex) {
        return;
      }
      this.selectedIndex = idx;
      this.refreshOptionHighlight();
      this.tryPlaySelectSfx();
    });

    this.input.on(Phaser.Input.Events.POINTER_DOWN, (pointer: Phaser.Input.Pointer) => {
      if (this.selectingLocked) {
        return;
      }
      const idx = this.resolveOptionAt(pointer.x, pointer.y);
      if (idx === null) {
        return;
      }
      this.selectedIndex = idx;
      this.refreshOptionHighlight();
      this.playUiSfxIfLoaded('smas_sfx_start', 0.38);
      this.selectingLocked = true;
      this.runSelectedActionWithFade();
    });

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.stopFinalBgm());
    this.events.once(Phaser.Scenes.Events.DESTROY, () => this.stopFinalBgm());
  }

  public update(): void {
    this.refreshOptionHighlight();

    if (this.selectingLocked) {
      return;
    }

    const moveUp = this.upKeys.some((key) => Phaser.Input.Keyboard.JustDown(key)) || this.consumeGamepadUpPress();
    const moveDown = this.downKeys.some((key) => Phaser.Input.Keyboard.JustDown(key)) || this.consumeGamepadDownPress();
    if (moveUp || moveDown) {
      const delta = moveDown ? 1 : -1;
      this.selectedIndex = (this.selectedIndex + delta + this.options.length) % this.options.length;
      this.refreshOptionHighlight();
      this.tryPlaySelectSfx();
    }

    const keyboardStart = this.confirmKeys.some((key) => Phaser.Input.Keyboard.JustDown(key));
    const gamepadStart = this.consumeGamepadConfirmPress();
    const keyboardCancel = this.cancelKeys.some((key) => Phaser.Input.Keyboard.JustDown(key));
    if (!keyboardStart && !gamepadStart && !keyboardCancel) {
      return;
    }

    if (keyboardCancel) {
      this.selectedIndex = 0;
      this.refreshOptionHighlight();
    }

    this.playUiSfxIfLoaded('smas_sfx_start', 0.38);
    this.selectingLocked = true;
    this.runSelectedActionWithFade();
  }

  private refreshOptionHighlight(): void {
    const blinkOn = Math.floor(this.time.now / 240) % 2 === 0;
    this.optionLabels.forEach((label, index) => {
      const isSelected = index === this.selectedIndex;
      const option = this.options[index];
      label.setText(`${isSelected ? '> ' : '  '}${option?.label ?? ''}`);
      label.setColor(isSelected ? '#fff2a8' : '#ffffff');
      label.setAlpha(isSelected ? (blinkOn ? 1 : 0.7) : 1);
    });
  }

  private runSelectedActionWithFade(): void {
    this.cameras.main.fadeOut(220, 0, 0, 0);
    this.fadeOutFinalBgm(220);
    this.time.delayedCall(230, () => this.executeSelectedAction());
  }

  private executeSelectedAction(): void {
    const selected = this.options[this.selectedIndex];
    if (!selected) {
      this.scene.start('title', { session: DEFAULT_SESSION_STATE });
      return;
    }

    if (selected.action === 'replay') {
      this.scene.start('title', { session: DEFAULT_SESSION_STATE });
      return;
    }

    if (selected.action === 'projects') {
      window.location.href = this.clientBranding.finalScreen.projectsUrl;
      return;
    }

    window.location.href = this.clientBranding.finalScreen.contactUrl;
  }

  private tryPlaySelectSfx(): void {
    if (this.time.now - this.optionChangedAtMs < 90) {
      return;
    }
    this.optionChangedAtMs = this.time.now;
    this.playUiSfxIfLoaded('smas_sfx_select', 0.34);
  }

  private playUiSfxIfLoaded(key: string, volume: number): void {
    if (this.sound.mute || !this.cache.audio.exists(key)) {
      return;
    }
    this.sound.play(key, { volume });
  }

  private playFinalBgmIfLoaded(): void {
    if (this.sound.mute || !this.cache.audio.exists('smas_bgm_title')) {
      return;
    }
    this.finalBgm = this.sound.add('smas_bgm_title', { loop: true, volume: 0.22 });
    this.finalBgm.play();
  }

  private fadeOutFinalBgm(durationMs: number): void {
    if (!this.finalBgm || !this.finalBgm.isPlaying) {
      return;
    }
    const bgm = this.finalBgm;
    this.tweens.add({
      targets: bgm,
      volume: 0,
      duration: Math.max(50, durationMs),
      onComplete: () => {
        if (bgm.isPlaying) {
          bgm.stop();
        }
      },
    });
  }

  private stopFinalBgm(): void {
    if (this.finalBgm && this.finalBgm.isPlaying) {
      this.finalBgm.stop();
    }
    this.finalBgm = null;
    this.input.setDefaultCursor('default');
  }

  private resolveOptionAt(x: number, y: number): number | null {
    for (let i = 0; i < this.optionLabels.length; i += 1) {
      const bounds = this.optionLabels[i]?.getBounds();
      if (!bounds) {
        continue;
      }
      const padded = new Phaser.Geom.Rectangle(bounds.x - 4, bounds.y - 3, bounds.width + 8, bounds.height + 6);
      if (padded.contains(x, y)) {
        return i;
      }
    }
    return null;
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
}
