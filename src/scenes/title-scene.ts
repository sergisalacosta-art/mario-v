import Phaser from 'phaser';
import { INTERNAL_HEIGHT, INTERNAL_WIDTH } from '../core/constants';
import {
  getInitialSessionStateForVariant,
  getWorldLabelForVariant,
  type SceneFlowPayload,
} from './flow-state';

const CONFIRM_KEYCODES = [
  Phaser.Input.Keyboard.KeyCodes.ENTER,
  Phaser.Input.Keyboard.KeyCodes.SPACE,
  Phaser.Input.Keyboard.KeyCodes.Z,
  Phaser.Input.Keyboard.KeyCodes.X,
];
const CANCEL_KEYCODES = [Phaser.Input.Keyboard.KeyCodes.ESC, Phaser.Input.Keyboard.KeyCodes.BACKSPACE];
const UP_KEYCODES = [Phaser.Input.Keyboard.KeyCodes.UP, Phaser.Input.Keyboard.KeyCodes.W];
const DOWN_KEYCODES = [Phaser.Input.Keyboard.KeyCodes.DOWN, Phaser.Input.Keyboard.KeyCodes.S];
const MAIN_OPTIONS = [
  { label: 'COMPETICIÓ' },
  { label: 'JUGAR' },
  { label: 'PUNTUACIÓ' },
] as const;
const VARIANT_OPTIONS = [
  { label: 'FÀCIL', variantId: 'world1_1' as const },
  { label: 'DIFÍCIL', variantId: 'world4_1_clean' as const },
];

export class TitleScene extends Phaser.Scene {
  private confirmKeys: Phaser.Input.Keyboard.Key[] = [];
  private cancelKeys: Phaser.Input.Keyboard.Key[] = [];
  private upKeys: Phaser.Input.Keyboard.Key[] = [];
  private downKeys: Phaser.Input.Keyboard.Key[] = [];
  private promptText: Phaser.GameObjects.Text | null = null;
  private optionTexts: Phaser.GameObjects.Text[] = [];
  private selectedVariantIndex = 0;
  private menuMode: 'main' | 'variant' = 'main';
  private wasGamepadConfirmPressed = false;
  private wasGamepadUpPressed = false;
  private wasGamepadDownPressed = false;
  private startTriggered = false;
  private titleBgm: Phaser.Sound.BaseSound | null = null;

  public constructor() {
    super({ key: 'title' });
  }

  public create(payload?: SceneFlowPayload): void {
    this.startTriggered = false;
    this.wasGamepadConfirmPressed = false;
    this.wasGamepadUpPressed = false;
    this.wasGamepadDownPressed = false;
    this.menuMode = 'main';
    this.selectedVariantIndex = 0;
    this.cameras.main.setBackgroundColor('#5D94FB');

    if (this.textures.exists('title_card')) {
      this.add
        .image(0, -18, 'title_card')
        .setOrigin(0, 0)
        .setDisplaySize(INTERNAL_WIDTH, INTERNAL_HEIGHT + 18)
        .setDepth(5);
    } else {
      if (this.textures.exists('decor_hills_strip_a')) {
        this.add
          .tileSprite(0, 0, INTERNAL_WIDTH, 224, 'decor_hills_strip_a')
          .setOrigin(0, 0)
          .setDepth(10)
          .setScrollFactor(0)
          .setTilePosition(0, -16);
      }
      if (this.textures.exists('decor_clouds_strip')) {
        this.add
          .tileSprite(0, 0, INTERNAL_WIDTH, 224, 'decor_clouds_strip')
          .setOrigin(0, 0)
          .setDepth(20)
          .setScrollFactor(0)
          .setTilePosition(120, -16);
      }
      if (this.textures.exists('screen_title_logo_main')) {
        this.add.image(INTERNAL_WIDTH * 0.5, 72, 'screen_title_logo_main').setOrigin(0.5, 0.5).setDepth(40);
      } else {
        this.add
          .text(INTERNAL_WIDTH * 0.5, 64, 'SUPER MARIO BROS.', {
            fontFamily: '"Courier New", monospace',
            fontSize: '20px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 5,
          })
          .setOrigin(0.5)
          .setDepth(40);
      }
    }

    this.optionTexts = MAIN_OPTIONS.map((option, index) =>
      this.add
        .text(INTERNAL_WIDTH * 0.5, 162 + index * 14, option.label, {
          fontFamily: '"Courier New", monospace',
          fontSize: '11px',
          color: '#ffffff',
          stroke: '#000000',
          strokeThickness: 3,
        })
        .setOrigin(0.5)
        .setDepth(45),
    );
    this.refreshOptionHighlight();

    this.promptText = this.add
      .text(INTERNAL_WIDTH * 0.5, 214, 'PRESS START', {
        fontFamily: '"Courier New", monospace',
        fontSize: '12px',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 3,
      })
      .setOrigin(0.5)
      .setDepth(45);

    this.confirmKeys = CONFIRM_KEYCODES.map((code) => this.input.keyboard!.addKey(code));
    this.cancelKeys = CANCEL_KEYCODES.map((code) => this.input.keyboard!.addKey(code));
    this.upKeys = UP_KEYCODES.map((code) => this.input.keyboard!.addKey(code));
    this.downKeys = DOWN_KEYCODES.map((code) => this.input.keyboard!.addKey(code));
    this.input.on(Phaser.Input.Events.POINTER_MOVE, (pointer: Phaser.Input.Pointer) => {
      if (this.startTriggered) {
        return;
      }
      const idx = this.resolveOptionAt(pointer.x, pointer.y);
      this.input.setDefaultCursor(idx === null ? 'default' : 'pointer');
      if (idx !== null && idx !== this.selectedVariantIndex) {
        this.selectedVariantIndex = idx;
        this.refreshOptionHighlight();
      }
    });
    this.input.on(Phaser.Input.Events.POINTER_DOWN, (pointer: Phaser.Input.Pointer) => {
      if (this.startTriggered) {
        return;
      }
      const idx = this.resolveOptionAt(pointer.x, pointer.y);
      if (idx !== null && idx !== this.selectedVariantIndex) {
        this.selectedVariantIndex = idx;
        this.refreshOptionHighlight();
      }
      if (this.menuMode === 'main') {
        if (idx === null) {
          return;
        }
        this.handleMainMenuConfirm();
        return;
      }
      this.triggerStart();
    });

    const transitionDelayMs = Math.max(0, Math.floor(payload?.transition?.delayMs ?? 0));
    const transitionFadeInMs = Math.max(0, Math.floor(payload?.transition?.fadeInMs ?? 0));
    if (transitionDelayMs > 0 || transitionFadeInMs > 0) {
      const beginFadeIn = () => {
        if (transitionFadeInMs > 0) {
          this.cameras.main.fadeIn(transitionFadeInMs, 0, 0, 0);
        }
        this.playTitleBgmIfLoaded();
      };
      if (transitionDelayMs > 0) {
        this.time.delayedCall(transitionDelayMs, beginFadeIn);
      } else {
        beginFadeIn();
      }
    } else {
      this.playTitleBgmIfLoaded();
    }
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.stopTitleBgm());
    this.events.once(Phaser.Scenes.Events.DESTROY, () => this.stopTitleBgm());
  }

  public update(): void {
    if (this.startTriggered) {
      return;
    }

    if (this.promptText) {
      const blinkOn = Math.floor(this.time.now / 350) % 2 === 0;
      this.promptText.setVisible(blinkOn);
    }

    const moveUp = this.upKeys.some((key) => Phaser.Input.Keyboard.JustDown(key)) || this.consumeGamepadUpPress();
    const moveDown = this.downKeys.some((key) => Phaser.Input.Keyboard.JustDown(key)) || this.consumeGamepadDownPress();
    if (moveUp || moveDown) {
      const delta = moveDown ? 1 : -1;
      const optionCount = this.menuMode === 'main' ? MAIN_OPTIONS.length : VARIANT_OPTIONS.length;
      this.selectedVariantIndex = (this.selectedVariantIndex + delta + optionCount) % optionCount;
      this.refreshOptionHighlight();
      this.playUiSfxIfLoaded('smas_sfx_select', 0.35);
    }

    if (this.menuMode === 'variant') {
      const cancelKey = this.cancelKeys.some((key) => Phaser.Input.Keyboard.JustDown(key));
      if (cancelKey) {
        this.switchToMainMenu();
        return;
      }
    }

    const keyboardStart = this.confirmKeys.some((key) => Phaser.Input.Keyboard.JustDown(key));
    const gamepadStart = this.consumeGamepadConfirmPress();
    if (!keyboardStart && !gamepadStart) {
      return;
    }

    if (this.menuMode === 'main') {
      this.handleMainMenuConfirm();
      return;
    }

    this.triggerStart();
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

  private refreshOptionHighlight(): void {
    const options: readonly { label: string }[] = this.menuMode === 'main' ? MAIN_OPTIONS : VARIANT_OPTIONS;
    this.optionTexts.forEach((text, index) => {
      const selected = index === this.selectedVariantIndex;
      const option = options[index];
      text.setText(`${selected ? '> ' : '  '}${option?.label ?? ''}`);
      text.setColor(selected ? '#fff2a8' : '#ffffff');
    });
  }

  private handleMainMenuConfirm(): void {
    const selectedMain = MAIN_OPTIONS[this.selectedVariantIndex];
    if (selectedMain?.label === 'COMPETICIÓ') {
      this.triggerCompetition();
    } else if (selectedMain?.label === 'PUNTUACIÓ') {
      this.triggerScoreInfo();
    } else {
      this.switchToVariantMenu();
    }
  }

  private switchToVariantMenu(): void {
    this.menuMode = 'variant';
    this.selectedVariantIndex = 0;
    this.optionTexts.forEach((t) => t.destroy());
    this.optionTexts = VARIANT_OPTIONS.map((option, index) =>
      this.add
        .text(INTERNAL_WIDTH * 0.5, 162 + index * 14, option.label, {
          fontFamily: '"Courier New", monospace',
          fontSize: '11px',
          color: '#ffffff',
          stroke: '#000000',
          strokeThickness: 3,
        })
        .setOrigin(0.5)
        .setDepth(45),
    );
    this.refreshOptionHighlight();
    this.playUiSfxIfLoaded('smas_sfx_select', 0.35);
  }

  private switchToMainMenu(): void {
    this.menuMode = 'main';
    this.selectedVariantIndex = 1;
    this.optionTexts.forEach((t) => t.destroy());
    this.optionTexts = MAIN_OPTIONS.map((option, index) =>
      this.add
        .text(INTERNAL_WIDTH * 0.5, 162 + index * 14, option.label, {
          fontFamily: '"Courier New", monospace',
          fontSize: '11px',
          color: '#ffffff',
          stroke: '#000000',
          strokeThickness: 3,
        })
        .setOrigin(0.5)
        .setDepth(45),
    );
    this.refreshOptionHighlight();
    this.playUiSfxIfLoaded('smas_sfx_select', 0.35);
  }

  private triggerScoreInfo(): void {
    if (this.startTriggered) return;
    this.startTriggered = true;
    this.stopTitleBgm();
    this.cameras.main.fadeOut(180, 0, 0, 0);
    this.time.delayedCall(190, () => {
      this.scene.start('score-info', {});
    });
  }

  private triggerCompetition(): void {
    if (this.startTriggered) {
      return;
    }
    this.startTriggered = true;
    this.playUiSfxIfLoaded('smas_sfx_start', 0.4);
    this.stopTitleBgm();
    this.scene.start('competition-intro', {});
  }

  private resolveOptionAt(x: number, y: number): number | null {
    for (let i = 0; i < this.optionTexts.length; i += 1) {
      const bounds = this.optionTexts[i].getBounds();
      if (bounds.contains(x, y)) {
        return i;
      }
    }
    return null;
  }

  private triggerStart(): void {
    if (this.startTriggered) {
      return;
    }
    this.startTriggered = true;
    this.playUiSfxIfLoaded('smas_sfx_start', 0.4);
    this.stopTitleBgm();
    const variantIndex = this.menuMode === 'variant' ? this.selectedVariantIndex : 0;
    const selected = VARIANT_OPTIONS[variantIndex] ?? VARIANT_OPTIONS[0];
    const initialSession = getInitialSessionStateForVariant(selected.variantId);
    this.scene.start('start', {
      session: {
        score: initialSession.score,
        coins: initialSession.coins,
        lives: initialSession.lives,
        variantId: selected.variantId,
        world: getWorldLabelForVariant(selected.variantId),
      },
    });
  }

  private playTitleBgmIfLoaded(): void {
    const params = new URLSearchParams(window.location.search);
    if (params.get('mute') === '1' || params.get('capture') === '1') {
      this.sound.mute = true;
      return;
    }
    if (!this.cache.audio.exists('smas_bgm_title')) {
      return;
    }
    this.titleBgm = this.sound.add('smas_bgm_title', { loop: true, volume: 0.4 });
    this.titleBgm.play();
  }

  private stopTitleBgm(): void {
    if (this.titleBgm && this.titleBgm.isPlaying) {
      this.titleBgm.stop();
    }
    this.titleBgm = null;
  }

  private playUiSfxIfLoaded(key: string, volume: number): void {
    if (this.sound.mute) {
      return;
    }
    if (!this.cache.audio.exists(key)) {
      return;
    }
    this.sound.play(key, { volume });
  }
}
