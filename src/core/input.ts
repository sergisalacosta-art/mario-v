import Phaser from 'phaser';
import type { InputSnapshot } from './contracts';
import { INTERNAL_HEIGHT, INTERNAL_WIDTH } from './constants';

type TouchControl = keyof InputSnapshot;

export class InputController {
  private readonly scene: Phaser.Scene;
  private readonly cursors: Phaser.Types.Input.Keyboard.CursorKeys | null;
  private readonly jumpKeys: Phaser.Input.Keyboard.Key[];
  private readonly runKeys: Phaser.Input.Keyboard.Key[];
  private readonly touchState: InputSnapshot = { left: false, right: false, down: false, jump: false, run: false };
  private readonly pointerBindings = new Map<number, TouchControl>();
  private readonly touchZones: Phaser.GameObjects.Zone[] = [];
  private readonly touchVisuals: Phaser.GameObjects.GameObject[] = [];
  private touchEnabled = false;
  private readonly onPointerUp: (pointer: Phaser.Input.Pointer) => void;
  private readonly onPointerUpOutside: (pointer: Phaser.Input.Pointer) => void;

  public constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.cursors = scene.input.keyboard?.createCursorKeys() ?? null;

    const keyboard = scene.input.keyboard;
    this.jumpKeys = keyboard
      ? [
          keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Z),
          keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE),
          keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.UP),
        ]
      : [];
    this.runKeys = keyboard
      ? [
          keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.X),
          keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT),
        ]
      : [];

    this.onPointerUp = (pointer) => {
      this.releasePointer(pointer.id);
    };
    this.onPointerUpOutside = (pointer) => {
      this.releasePointer(pointer.id);
    };

    this.setupTouchControls();
    this.scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.destroy());
    this.scene.events.once(Phaser.Scenes.Events.DESTROY, () => this.destroy());
  }

  public snapshot(): InputSnapshot {
    const pad = this.firstPadSnapshot();
    return {
      left: this.isPressed(this.cursors?.left) || pad.left || this.touchState.left,
      right: this.isPressed(this.cursors?.right) || pad.right || this.touchState.right,
      down: this.isPressed(this.cursors?.down) || pad.down || this.touchState.down,
      jump: this.anyPressed(this.jumpKeys) || pad.jump || this.touchState.jump,
      run: this.anyPressed(this.runKeys) || pad.run || this.touchState.run,
    };
  }

  public destroy(): void {
    if (this.touchEnabled) {
      this.scene.input.off(Phaser.Input.Events.POINTER_UP, this.onPointerUp);
      this.scene.input.off('pointerupoutside', this.onPointerUpOutside);
    }
    this.touchZones.forEach((zone) => zone.destroy());
    this.touchVisuals.forEach((visual) => visual.destroy());
    this.touchZones.length = 0;
    this.touchVisuals.length = 0;
    this.pointerBindings.clear();
    this.touchState.left = false;
    this.touchState.right = false;
    this.touchState.down = false;
    this.touchState.jump = false;
    this.touchState.run = false;
    this.touchEnabled = false;
  }

  private firstPadSnapshot(): InputSnapshot {
    const pads = (window as unknown as { navigator?: Navigator }).navigator?.getGamepads?.() ?? [];
    const first = pads[0];
    if (!first) {
      return { left: false, right: false, down: false, jump: false, run: false };
    }

    const axisX = first.axes[0] ?? 0;
    const axisY = first.axes[1] ?? 0;
    const left = axisX < -0.35 || Boolean(first.buttons[14]?.pressed);
    const right = axisX > 0.35 || Boolean(first.buttons[15]?.pressed);
    const down = axisY > 0.35 || Boolean(first.buttons[13]?.pressed);
    const jump = Boolean(first.buttons[0]?.pressed);
    const run = Boolean(first.buttons[1]?.pressed);

    return { left, right, down, jump, run };
  }

  private anyPressed(keys: Phaser.Input.Keyboard.Key[]): boolean {
    return keys.some((key) => this.isPressed(key));
  }

  private isPressed(key: Phaser.Input.Keyboard.Key | undefined): boolean {
    return Boolean(key?.isDown);
  }

  private setupTouchControls(): void {
    if (!this.shouldEnableTouchControls()) {
      return;
    }

    this.touchEnabled = true;
    this.scene.input.addPointer(3);

    // Keep touch controls anchored near bottom corners so gameplay area stays clear.
    this.createTouchControl('left', 26, INTERNAL_HEIGHT - 22, 38, 32, '<', 0x2f7bd7);
    this.createTouchControl('right', 66, INTERNAL_HEIGHT - 22, 38, 32, '>', 0x2f7bd7);
    this.createTouchControl('run', INTERNAL_WIDTH - 64, INTERNAL_HEIGHT - 18, 40, 40, 'B', 0xffb000);
    this.createTouchControl('jump', INTERNAL_WIDTH - 24, INTERNAL_HEIGHT - 36, 46, 46, 'A', 0xe95f5f);

    this.scene.input.on(Phaser.Input.Events.POINTER_UP, this.onPointerUp);
    this.scene.input.on('pointerupoutside', this.onPointerUpOutside);
  }

  private shouldEnableTouchControls(): boolean {
    const params = new URLSearchParams(window.location.search);
    if (params.get('capture') === '1') {
      return false;
    }
    const nav = window.navigator as Navigator & { maxTouchPoints?: number };
    const hasTouchPoints = (nav.maxTouchPoints ?? 0) > 0;
    const coarsePointer = window.matchMedia?.('(pointer: coarse)').matches ?? false;
    const touchEvents = 'ontouchstart' in window;
    return hasTouchPoints || coarsePointer || touchEvents;
  }

  private createTouchControl(
    control: TouchControl,
    centerX: number,
    centerY: number,
    width: number,
    height: number,
    label: string,
    color: number,
  ): void {
    const zone = this.scene.add
      .zone(centerX, centerY, width, height)
      .setOrigin(0.5)
      .setDepth(2000)
      .setScrollFactor(0)
      .setInteractive();
    const radius = Math.floor(Math.max(width, height) * 0.5);
    const button = this.scene.add
      .circle(centerX, centerY, radius, color, 0.18)
      .setDepth(1990)
      .setScrollFactor(0)
      .setStrokeStyle(2, 0xffffff, 0.35);
    const text = this.scene.add
      .text(centerX, centerY, label, {
        fontFamily: '"Courier New", monospace',
        fontSize: '16px',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 3,
      })
      .setOrigin(0.5)
      .setDepth(2010)
      .setScrollFactor(0);

    zone.on(Phaser.Input.Events.POINTER_DOWN, (pointer: Phaser.Input.Pointer) => {
      this.bindPointer(pointer.id, control);
    });

    this.touchZones.push(zone);
    this.touchVisuals.push(button, text);
  }

  private bindPointer(pointerId: number, control: TouchControl): void {
    const previous = this.pointerBindings.get(pointerId);
    if (previous === control) {
      return;
    }
    if (previous) {
      this.pointerBindings.delete(pointerId);
      this.recomputeControlState(previous);
    }
    this.pointerBindings.set(pointerId, control);
    this.touchState[control] = true;
  }

  private releasePointer(pointerId: number): void {
    const control = this.pointerBindings.get(pointerId);
    if (!control) {
      return;
    }
    this.pointerBindings.delete(pointerId);
    this.recomputeControlState(control);
  }

  private recomputeControlState(control: TouchControl): void {
    const stillPressed = [...this.pointerBindings.values()].some((boundControl) => boundControl === control);
    this.touchState[control] = stillPressed;
  }
}
