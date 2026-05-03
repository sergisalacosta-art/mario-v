import Phaser from 'phaser';
import { INTERNAL_HEIGHT, INTERNAL_WIDTH } from '../core/constants';
import type { SceneFlowPayload } from './flow-state';

const INTRO_TIMELINE = [
  { atMs: 600, key: 'ref_mar10_start_cp_01' },
  { atMs: 2000, key: 'ref_mar10_start_cp_02' },
  { atMs: 3600, key: 'ref_mar10_start_cp_03' },
  { atMs: 5100, key: 'ref_mar10_start_cp_04' },
  { atMs: 7300, key: 'ref_mar10_start_cp_05' },
  { atMs: 9800, key: 'ref_mar10_start_cp_06' },
] as const;
const INTRO_END_MS = 11080;
const CUSTOM_SPLASH_DURATION_MS = 4000;
const CUSTOM_SPLASH_FADE_IN_MS = 260;
const INTRO_TO_TITLE_FADE_OUT_MS = 190;
const INTRO_TO_TITLE_FADE_IN_MS = 340;
const INTRO_TO_TITLE_BLACK_HOLD_MS = 20;
const INPUT_ENABLE_DELAY_MS = 250;
const CONFIRM_KEYCODES = [
  Phaser.Input.Keyboard.KeyCodes.ENTER,
  Phaser.Input.Keyboard.KeyCodes.SPACE,
  Phaser.Input.Keyboard.KeyCodes.Z,
  Phaser.Input.Keyboard.KeyCodes.X,
];

export class IntroScene extends Phaser.Scene {
  private confirmKeys: Phaser.Input.Keyboard.Key[] = [];
  private forwardPayload: SceneFlowPayload = {};
  private startedAtMs = 0;
  private allowInputAtMs = 0;
  private displayedFrameIndex = -2;
  private introImage: Phaser.GameObjects.Image | null = null;
  private advanced = false;
  private wasGamepadConfirmPressed = false;
  private fallbackText: Phaser.GameObjects.Text | null = null;
  private introAudio: Phaser.Sound.BaseSound | null = null;
  private captureFrozen = false;
  private frozenElapsedMs = 0;
  private introVideo: Phaser.GameObjects.Video | null = null;
  private usingVideo = false;
  private usingCustomSplash = false;
  private shouldAnimateTransition = false;
  private transitionScheduled = false;

  public constructor() {
    super({ key: 'intro' });
  }

  public create(payload?: SceneFlowPayload): void {
    this.advanced = false;
    this.wasGamepadConfirmPressed = false;
    this.transitionScheduled = false;
    this.forwardPayload = payload ?? {};
    this.cameras.main.setBackgroundColor('#000000');

    const params = new URLSearchParams(window.location.search);
    const seekSeconds = Number(params.get('seek') ?? '');
    const seekMs = Number.isFinite(seekSeconds) && seekSeconds > 0 ? seekSeconds * 1000 : 0;
    this.captureFrozen = params.get('pauseOnSeek') === '1' && seekMs > 0;
    this.frozenElapsedMs = seekMs;
    const useRuntimeFlow = !params.has('capture') && !params.has('seek');
    this.shouldAnimateTransition = useRuntimeFlow;
    this.usingCustomSplash = useRuntimeFlow && this.textures.exists('custom_splash_screen');
    this.usingVideo = !this.usingCustomSplash && this.cache.video.exists('smas_intro_video') && useRuntimeFlow;

    if (this.usingCustomSplash) {
this.textures.get('custom_splash_screen').setFilter(Phaser.Textures.FilterMode.LINEAR);
      const splash = this.add
        .image(INTERNAL_WIDTH * 0.5, INTERNAL_HEIGHT * 0.5, 'custom_splash_screen')
        .setOrigin(0.5)
        .setDepth(10);
      const source = this.textures.get('custom_splash_screen').getSourceImage() as { width?: number; height?: number };
      const sourceWidth = source?.width ?? INTERNAL_WIDTH;
      const sourceHeight = source?.height ?? INTERNAL_HEIGHT;
      const scale = Math.min(INTERNAL_WIDTH / sourceWidth, INTERNAL_HEIGHT / sourceHeight);
      splash.setScale(scale);
      this.cameras.main.fadeIn(CUSTOM_SPLASH_FADE_IN_MS, 0, 0, 0);
    } else if (this.usingVideo) {
      this.introVideo = this.add
        .video(INTERNAL_WIDTH * 0.5, INTERNAL_HEIGHT * 0.5, 'smas_intro_video')
        .setOrigin(0.5)
        .setDisplaySize(INTERNAL_WIDTH, INTERNAL_HEIGHT)
        .setDepth(10);
      this.introVideo.play(false);
      this.introVideo.once(Phaser.GameObjects.Events.VIDEO_COMPLETE, () => this.startTitle());
    } else {
      const firstFrameKey = INTRO_TIMELINE.find((frame) => this.textures.exists(frame.key))?.key;
      if (firstFrameKey) {
        this.introImage = this.add
          .image(INTERNAL_WIDTH * 0.5, INTERNAL_HEIGHT * 0.5, firstFrameKey)
          .setOrigin(0.5)
          .setDisplaySize(INTERNAL_WIDTH, INTERNAL_HEIGHT)
          .setDepth(10)
          .setVisible(false);
      } else {
        this.fallbackText = this.add
          .text(INTERNAL_WIDTH * 0.5, INTERNAL_HEIGHT * 0.5, 'NINTENDO', {
            fontFamily: '"Courier New", monospace',
            fontSize: '20px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 4,
          })
          .setOrigin(0.5)
          .setDepth(10);
      }
    }

    this.confirmKeys = CONFIRM_KEYCODES.map((code) => this.input.keyboard!.addKey(code));
    this.input.on(Phaser.Input.Events.POINTER_DOWN, () => {
      if (this.time.now < this.allowInputAtMs) {
        return;
      }
      this.startTitle();
    });
    this.startedAtMs = this.time.now - seekMs;
    this.allowInputAtMs = this.time.now + INPUT_ENABLE_DELAY_MS;
    this.displayedFrameIndex = -2;
    if (!this.usingVideo) {
      this.renderFrame(seekMs);
    }
    this.playIntroAudioIfLoaded();
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.stopIntroAudio());
    this.events.once(Phaser.Scenes.Events.DESTROY, () => this.stopIntroAudio());
  }

  public update(): void {
    if (this.advanced) {
      return;
    }

    if (!this.usingVideo) {
      const elapsedMs = this.captureFrozen ? this.frozenElapsedMs : this.time.now - this.startedAtMs;
      if (!this.usingCustomSplash) {
        this.renderFrame(elapsedMs);
      }
      if (this.captureFrozen) {
        return;
      }
      const endMs = this.usingCustomSplash ? CUSTOM_SPLASH_DURATION_MS : INTRO_END_MS;
      if (elapsedMs >= endMs) {
        this.startTitle();
        return;
      }
    }

    if (this.time.now < this.allowInputAtMs) {
      return;
    }

    const keyboardStart = this.confirmKeys.some((key) => Phaser.Input.Keyboard.JustDown(key));
    const gamepadStart = this.consumeGamepadConfirmPress();
    if (!keyboardStart && !gamepadStart) {
      return;
    }

    this.startTitle();
  }

  private startTitle(): void {
    if (this.advanced) {
      return;
    }
    if (this.shouldAnimateTransition) {
      if (this.transitionScheduled) {
        return;
      }
      this.transitionScheduled = true;
      this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
        this.time.delayedCall(INTRO_TO_TITLE_BLACK_HOLD_MS, () => this.completeStartTitle());
      });
      this.cameras.main.fadeOut(INTRO_TO_TITLE_FADE_OUT_MS, 0, 0, 0);
      return;
    }
    this.completeStartTitle();
  }

  private completeStartTitle(): void {
    if (this.advanced) {
      return;
    }
    this.advanced = true;
    this.stopIntroAudio();
    this.cameras.main.stopFollow();
    if (this.introVideo) {
      this.introVideo.stop();
      this.introVideo.destroy();
      this.introVideo = null;
    }
    this.scene.start('title', {
      ...this.forwardPayload,
      transition: this.shouldAnimateTransition
        ? {
            delayMs: 0,
            fadeInMs: INTRO_TO_TITLE_FADE_IN_MS,
          }
        : this.forwardPayload.transition,
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

  private renderFrame(elapsedMs: number): void {
    const frameIndex = this.resolveFrameIndex(elapsedMs);
    if (frameIndex === this.displayedFrameIndex) {
      return;
    }
    this.displayedFrameIndex = frameIndex;

    if (frameIndex < 0) {
      if (this.introImage) {
        this.introImage.setVisible(false);
      }
      if (this.fallbackText) {
        this.fallbackText.setVisible(false);
      }
      return;
    }

    const frame = INTRO_TIMELINE[frameIndex];
    if (!frame || !this.textures.exists(frame.key)) {
      if (this.introImage) {
        this.introImage.setVisible(false);
      }
      if (this.fallbackText) {
        this.fallbackText.setVisible(true);
      }
      return;
    }

    this.introImage?.setTexture(frame.key).setVisible(true);
    if (this.fallbackText) {
      this.fallbackText.setVisible(false);
    }
  }

  private resolveFrameIndex(elapsedMs: number): number {
    let index = -1;
    for (let i = 0; i < INTRO_TIMELINE.length; i += 1) {
      if (elapsedMs >= INTRO_TIMELINE[i].atMs) {
        index = i;
      } else {
        break;
      }
    }
    return index;
  }

  private playIntroAudioIfLoaded(): void {
    const params = new URLSearchParams(window.location.search);
    if (params.get('mute') === '1' || params.get('capture') === '1') {
      this.sound.mute = true;
      return;
    }
    if (this.usingCustomSplash) {
      if (this.cache.audio.exists('smas_sfx_coin')) {
        this.time.delayedCall(70, () => {
          if (!this.advanced) {
            this.sound.play('smas_sfx_coin', { volume: 0.42 });
          }
        });
      }
      return;
    }
    if (!this.cache.audio.exists('smas_intro_start')) {
      return;
    }
    this.introAudio = this.sound.add('smas_intro_start', { volume: 0.5 });
    this.introAudio.play();
  }

  private stopIntroAudio(): void {
    if (this.introAudio && this.introAudio.isPlaying) {
      this.introAudio.stop();
    }
    this.introAudio = null;
  }
}
