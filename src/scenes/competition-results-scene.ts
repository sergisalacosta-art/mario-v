import Phaser from 'phaser';
import { INTERNAL_WIDTH } from '../core/constants';
import { getTeamFinalScores, resetCompetition } from './competition-store';
import { DEFAULT_SESSION_STATE } from './flow-state';

const CONFIRM_KEYCODES = [
  Phaser.Input.Keyboard.KeyCodes.ENTER,
  Phaser.Input.Keyboard.KeyCodes.SPACE,
  Phaser.Input.Keyboard.KeyCodes.Z,
  Phaser.Input.Keyboard.KeyCodes.X,
];

// Y positions for each rank slot (top = 1st, bottom = 4th)
const PLACE_Y = [48, 82, 116, 150] as const;
const PLACE_LABELS = ['1r', '2n', '3r', '4t'] as const;
const PLACE_COLORS = ['#ffd700', '#c0c0c0', '#cd7f32', '#888888'] as const;

export class CompetitionResultsScene extends Phaser.Scene {
  private confirmKeys: Phaser.Input.Keyboard.Key[] = [];
  private wasGamepadConfirmPressed = false;
  private revealStep = 0;
  private canAdvance = false;
  private finishedAll = false;
  private rankings: { name: string; score: number }[] = [];

  public constructor() {
    super({ key: 'competition-results' });
  }

  public create(): void {
    this.wasGamepadConfirmPressed = false;
    this.revealStep = 0;
    this.canAdvance = false;
    this.finishedAll = false;

    const scores = getTeamFinalScores();
    this.rankings = [...scores].sort((a, b) => b.score - a.score);

    this.cameras.main.setBackgroundColor('#000000');
    this.cameras.main.fadeIn(300, 0, 0, 0);

    const cx = INTERNAL_WIDTH * 0.5;

    this.add
      .text(cx, 18, 'RESULTATS', {
        fontFamily: '"Courier New", monospace',
        fontSize: '14px',
        color: '#fff2a8',
        stroke: '#000000',
        strokeThickness: 4,
      })
      .setOrigin(0.5)
      .setDepth(10);

    this.confirmKeys = CONFIRM_KEYCODES.map((code) => this.input.keyboard!.addKey(code));
    this.input.on(Phaser.Input.Events.POINTER_DOWN, () => {
      this.handleInput();
    });

    this.time.delayedCall(500, () => {
      this.canAdvance = true;
    });
  }

  public update(): void {
    if (!this.canAdvance) {
      return;
    }
    const keyboardStart = this.confirmKeys.some((key) => Phaser.Input.Keyboard.JustDown(key));
    const gamepadStart = this.consumeGamepadConfirmPress();
    if (keyboardStart || gamepadStart) {
      this.handleInput();
    }
  }

  private handleInput(): void {
    if (!this.canAdvance) {
      return;
    }
    if (this.finishedAll) {
      this.goToTitle();
      return;
    }
    this.revealNextPlace();
  }

  private revealNextPlace(): void {
    this.canAdvance = false;
    this.revealStep += 1;

    if (this.revealStep > 4) {
      return;
    }

    // Reveal from 4th to 1st: step 1 = 4th (rankings[3]), step 4 = 1st (rankings[0])
    const rankIndex = 4 - this.revealStep;  // 3, 2, 1, 0
    const entry = this.rankings[rankIndex];
    const placeIndex = rankIndex;  // 0=1st, 1=2nd, 2=3rd, 3=4th
    const entryY = PLACE_Y[placeIndex] ?? 48;
    const placeLabel = PLACE_LABELS[placeIndex] ?? '?';
    const placeColor = PLACE_COLORS[placeIndex] ?? '#ffffff';
    const isFirst = placeIndex === 0;
    const cx = INTERNAL_WIDTH * 0.5;

    const placeText = this.add
      .text(cx - 68, entryY, `${placeLabel}.`, {
        fontFamily: '"Courier New", monospace',
        fontSize: isFirst ? '14px' : '11px',
        color: placeColor,
        stroke: '#000000',
        strokeThickness: isFirst ? 4 : 3,
      })
      .setOrigin(0, 0.5)
      .setDepth(20)
      .setAlpha(0);

    const nameText = this.add
      .text(cx - 34, entryY, entry?.name.toUpperCase() ?? '---', {
        fontFamily: '"Courier New", monospace',
        fontSize: isFirst ? '17px' : '12px',
        color: isFirst ? '#fff2a8' : '#ffffff',
        stroke: '#000000',
        strokeThickness: isFirst ? 5 : 3,
      })
      .setOrigin(0, 0.5)
      .setDepth(20)
      .setAlpha(0);

    const scoreText = this.add
      .text(cx + 68, entryY, `${entry?.score ?? 0}`, {
        fontFamily: '"Courier New", monospace',
        fontSize: isFirst ? '13px' : '11px',
        color: placeColor,
        stroke: '#000000',
        strokeThickness: isFirst ? 4 : 3,
      })
      .setOrigin(1, 0.5)
      .setDepth(20)
      .setAlpha(0);

    this.tweens.add({
      targets: [placeText, nameText, scoreText],
      alpha: 1,
      duration: 260,
      ease: 'Quad.Out',
      onComplete: () => {
        if (isFirst) {
          this.showCongratulations();
        } else {
          this.time.delayedCall(180, () => {
            this.canAdvance = true;
          });
        }
      },
    });

    if (this.cache.audio.exists('smas_sfx_coin')) {
      this.sound.play('smas_sfx_coin', { volume: 0.45 });
    }
  }

  private showCongratulations(): void {
    const cx = INTERNAL_WIDTH * 0.5;
    const congratsText = this.add
      .text(cx, 178, 'Congratulations!', {
        fontFamily: '"Courier New", monospace',
        fontSize: '13px',
        color: '#fff2a8',
        stroke: '#000000',
        strokeThickness: 4,
      })
      .setOrigin(0.5)
      .setDepth(20)
      .setAlpha(0);

    this.tweens.add({
      targets: congratsText,
      alpha: 1,
      duration: 400,
      ease: 'Quad.Out',
      onComplete: () => {
        this.time.delayedCall(1000, () => {
          this.showReturnPrompt();
        });
      },
    });

    if (this.cache.audio.exists('smas_bgm_title')) {
      this.sound.stopAll();
      this.sound.play('smas_bgm_title', { volume: 0.35, loop: true });
    }
  }

  private showReturnPrompt(): void {
    const cx = INTERNAL_WIDTH * 0.5;
    this.add
      .text(cx, 205, 'CLICA PER TORNAR AL MENÚ', {
        fontFamily: '"Courier New", monospace',
        fontSize: '8px',
        color: '#666666',
        stroke: '#000000',
        strokeThickness: 2,
      })
      .setOrigin(0.5)
      .setDepth(20);

    this.finishedAll = true;
    this.canAdvance = true;
  }

  private goToTitle(): void {
    if (!this.finishedAll) {
      return;
    }
    this.finishedAll = false;
    this.canAdvance = false;
    resetCompetition();
    this.sound.stopAll();
    this.cameras.main.fadeOut(220, 0, 0, 0);
    this.time.delayedCall(230, () => {
      this.scene.start('title', { session: DEFAULT_SESSION_STATE });
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
