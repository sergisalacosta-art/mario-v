import Phaser from 'phaser';
import { INTERNAL_WIDTH } from '../core/constants';
import {
  beginCompetitionRound,
  getCompetitionRoundIndex,
  getCompetitionRoundInfo,
} from './competition-store';
import { getInitialSessionStateForVariant } from './flow-state';

const CONFIRM_KEYCODES = [
  Phaser.Input.Keyboard.KeyCodes.ENTER,
  Phaser.Input.Keyboard.KeyCodes.SPACE,
  Phaser.Input.Keyboard.KeyCodes.Z,
  Phaser.Input.Keyboard.KeyCodes.X,
];

const TEAM_COLORS = ['#e84040', '#4caf50', '#f472b6', '#f59e0b'];

export class CompetitionReadyScene extends Phaser.Scene {
  private confirmKeys: Phaser.Input.Keyboard.Key[] = [];
  private triggered = false;
  private startText: Phaser.GameObjects.Text | null = null;
  private wasGamepadConfirmPressed = false;

  public constructor() {
    super({ key: 'competition-ready' });
  }

  public create(): void {
    this.triggered = false;
    this.wasGamepadConfirmPressed = false;
    this.cameras.main.setBackgroundColor('#000000');
    this.cameras.main.fadeIn(220, 0, 0, 0);

    const roundIndex = getCompetitionRoundIndex();
    const info = getCompetitionRoundInfo(roundIndex);
    const roundNumber = roundIndex + 1;
    const cx = INTERNAL_WIDTH * 0.5;
    const teamColor = TEAM_COLORS[info.teamIndex] ?? '#ffffff';
    const modeColor = roundIndex < 4 ? '#88ddff' : '#ffaa44';

    this.add
      .text(cx, 26, `RONDA ${roundNumber} / 8`, {
        fontFamily: '"Courier New", monospace',
        fontSize: '11px',
        color: '#cccccc',
        stroke: '#000000',
        strokeThickness: 3,
      })
      .setOrigin(0.5)
      .setDepth(10);

    this.add
      .text(cx, 68, 'EQUIP', {
        fontFamily: '"Courier New", monospace',
        fontSize: '10px',
        color: '#888888',
        stroke: '#000000',
        strokeThickness: 2,
      })
      .setOrigin(0.5)
      .setDepth(10);

    this.add
      .text(cx, 98, info.teamName.toUpperCase(), {
        fontFamily: '"Courier New", monospace',
        fontSize: '22px',
        color: teamColor,
        stroke: '#000000',
        strokeThickness: 5,
      })
      .setOrigin(0.5)
      .setDepth(10);

    this.add
      .text(cx, 136, `MODE: ${info.modeLabel}`, {
        fontFamily: '"Courier New", monospace',
        fontSize: '11px',
        color: modeColor,
        stroke: '#000000',
        strokeThickness: 3,
      })
      .setOrigin(0.5)
      .setDepth(10);

    this.startText = this.add
      .text(cx, 178, 'PREM START', {
        fontFamily: '"Courier New", monospace',
        fontSize: '12px',
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
    beginCompetitionRound();
    const info = getCompetitionRoundInfo(getCompetitionRoundIndex());
    const initialSession = getInitialSessionStateForVariant(info.variantId);
    this.cameras.main.fadeOut(200, 0, 0, 0);
    this.time.delayedCall(210, () => {
      this.scene.start('start', { session: initialSession });
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
