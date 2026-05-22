import Phaser from 'phaser';
import { INTERNAL_WIDTH } from '../core/constants';
import { COMPETITION_TEAMS, startCompetition } from './competition-store';

const CONFIRM_KEYCODES = [
  Phaser.Input.Keyboard.KeyCodes.ENTER,
  Phaser.Input.Keyboard.KeyCodes.SPACE,
  Phaser.Input.Keyboard.KeyCodes.Z,
  Phaser.Input.Keyboard.KeyCodes.X,
];

const TEAM_COLORS = ['#e84040', '#4caf50', '#f472b6', '#f59e0b'];

export class CompetitionIntroScene extends Phaser.Scene {
  private confirmKeys: Phaser.Input.Keyboard.Key[] = [];
  private triggered = false;
  private startText: Phaser.GameObjects.Text | null = null;
  private wasGamepadConfirmPressed = false;

  public constructor() {
    super({ key: 'competition-intro' });
  }

  public create(): void {
    this.triggered = false;
    this.wasGamepadConfirmPressed = false;
    this.cameras.main.setBackgroundColor('#000000');
    this.cameras.main.fadeIn(200, 0, 0, 0);

    const cx = INTERNAL_WIDTH * 0.5;

    this.add
      .text(cx, 24, 'COMPETICIÓ', {
        fontFamily: '"Courier New", monospace',
        fontSize: '16px',
        color: '#fff2a8',
        stroke: '#000000',
        strokeThickness: 4,
      })
      .setOrigin(0.5)
      .setDepth(10);

    this.add
      .text(cx, 58, 'EQUIPS:', {
        fontFamily: '"Courier New", monospace',
        fontSize: '10px',
        color: '#888888',
        stroke: '#000000',
        strokeThickness: 2,
      })
      .setOrigin(0.5)
      .setDepth(10);

    COMPETITION_TEAMS.forEach((team, index) => {
      this.add
        .text(cx, 76 + index * 18, team.toUpperCase(), {
          fontFamily: '"Courier New", monospace',
          fontSize: '13px',
          color: TEAM_COLORS[index] ?? '#ffffff',
          stroke: '#000000',
          strokeThickness: 3,
        })
        .setOrigin(0.5)
        .setDepth(10);
    });

    this.add
      .text(cx, 162, '8 RONDES · 4 FÀCIL + 4 DIFÍCIL', {
        fontFamily: '"Courier New", monospace',
        fontSize: '10px',
        color: '#aaaaaa',
        stroke: '#000000',
        strokeThickness: 3,
      })
      .setOrigin(0.5)
      .setDepth(10);

    this.startText = this.add
      .text(cx, 188, 'COMENÇAR', {
        fontFamily: '"Courier New", monospace',
        fontSize: '13px',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 3,
      })
      .setOrigin(0.5)
      .setDepth(10);

    this.confirmKeys = CONFIRM_KEYCODES.map((code) => this.input.keyboard!.addKey(code));

    this.input.on(Phaser.Input.Events.POINTER_DOWN, () => {
      this.triggerStart();
    });
  }

  public update(): void {
    if (this.triggered) {
      return;
    }
    if (this.startText) {
      const blinkOn = Math.floor(this.time.now / 380) % 2 === 0;
      this.startText.setVisible(blinkOn);
    }
    const keyboardStart = this.confirmKeys.some((key) => Phaser.Input.Keyboard.JustDown(key));
    const gamepadStart = this.consumeGamepadConfirmPress();
    if (keyboardStart || gamepadStart) {
      this.triggerStart();
    }
  }

  private triggerStart(): void {
    if (this.triggered) {
      return;
    }
    this.triggered = true;
    startCompetition();
    this.cameras.main.fadeOut(200, 0, 0, 0);
    this.time.delayedCall(210, () => {
      this.scene.start('competition-ready', {});
    });
  }

  private consumeGamepadConfirmPress(): boolean {
    const pads = this.input.gamepad?.gamepads ?? [];
    const pressed = pads.some((pad) => {
      if (!pad) {
        return false;
      }
      return (pad.buttons[9]?.pressed ?? false) || (pad.buttons[0]?.pressed ?? false);
    });
    const justPressed = pressed && !this.wasGamepadConfirmPressed;
    this.wasGamepadConfirmPressed = pressed;
    return justPressed;
  }
}
