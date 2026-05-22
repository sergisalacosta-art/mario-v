import Phaser from 'phaser';
import { INTERNAL_HEIGHT, INTERNAL_WIDTH } from '../core/constants';

const BACK_KEYCODES = [
  Phaser.Input.Keyboard.KeyCodes.ENTER,
  Phaser.Input.Keyboard.KeyCodes.SPACE,
  Phaser.Input.Keyboard.KeyCodes.Z,
  Phaser.Input.Keyboard.KeyCodes.X,
  Phaser.Input.Keyboard.KeyCodes.ESC,
  Phaser.Input.Keyboard.KeyCodes.BACKSPACE,
];

export class ScoreInfoScene extends Phaser.Scene {
  private backKeys: Phaser.Input.Keyboard.Key[] = [];
  private backText: Phaser.GameObjects.Text | null = null;
  private leaving = false;

  public constructor() {
    super({ key: 'score-info' });
  }

  public create(): void {
    this.leaving = false;
    this.cameras.main.setBackgroundColor('#1a1a3e');
    this.cameras.main.fadeIn(180, 0, 0, 0);

    if (this.textures.exists('decor_clouds_strip')) {
      this.add
        .tileSprite(0, 0, INTERNAL_WIDTH, INTERNAL_HEIGHT, 'decor_clouds_strip')
        .setOrigin(0, 0)
        .setDepth(1)
        .setAlpha(0.12)
        .setScrollFactor(0);
    }

    this.add
      .rectangle(INTERNAL_WIDTH * 0.5, INTERNAL_HEIGHT * 0.5, INTERNAL_WIDTH - 12, INTERNAL_HEIGHT - 10, 0x000000, 0.7)
      .setDepth(2);

    const cx = INTERNAL_WIDTH * 0.5;
    let y = 8;

    this.add
      .text(cx, y, 'SISTEMA DE PUNTUACIO', {
        fontFamily: '"Courier New", monospace',
        fontSize: '12px',
        fontStyle: 'bold',
        color: '#fff2a8',
        stroke: '#000000',
        strokeThickness: 3,
      })
      .setOrigin(0.5, 0)
      .setDepth(10);
    y += 14;

    this.addDivider(cx, y);
    y += 6;

    this.addSectionHeader(cx, y, 'EN PARTIDA', '#88ddff');
    y += 13;

    const gameRows: [string, string][] = [
      ['Trepitjar enemic', '100'],
      ['Moneda', '200'],
      ['Bloc de pedra trencat', '50'],
      ['Temporitzador', '50 / seg'],
    ];
    for (const [label, value] of gameRows) {
      this.addRow(label, value, y);
      y += 12;
    }
    y += 1;

    this.addSectionHeader(cx, y, 'BANDERA', '#88ddff');
    y += 13;

    const flagRows: [string, string][] = [
      ['Baixa', '100'],
      ['Mitja  (>= 2 tiles)', '400'],
      ['Alta   (>= 4 tiles)', '800'],
      ['Molt alta (>= 6 tiles)', '2.000'],
      ['Al cim  (>= 8 tiles)', '5.000'],
    ];
    for (const [label, value] of flagRows) {
      this.addRow(label, value, y);
      y += 12;
    }
    y += 1;

    this.addSectionHeader(cx, y, 'COMPETICIO (per ronda)', '#ffaa44');
    y += 13;

    const compRows: [string, string][] = [
      ['Completar el nivell', '+2.000'],
      ['Per vida restant', '+1.000'],
    ];
    for (const [label, value] of compRows) {
      this.addRow(label, value, y);
      y += 12;
    }
    y += 2;

    this.addDivider(cx, y);
    y += 7;

    this.backText = this.add
      .text(cx, y, '> TORNAR AL MENU', {
        fontFamily: '"Courier New", monospace',
        fontSize: '11px',
        fontStyle: 'bold',
        color: '#fff2a8',
        stroke: '#000000',
        strokeThickness: 3,
      })
      .setOrigin(0.5, 0)
      .setDepth(10);

    this.backKeys = BACK_KEYCODES.map((code) => this.input.keyboard!.addKey(code));
    this.input.on(Phaser.Input.Events.POINTER_DOWN, () => this.goBack());
  }

  public update(): void {
    if (this.leaving) return;

    if (this.backText) {
      const blinkOn = Math.floor(this.time.now / 380) % 2 === 0;
      this.backText.setAlpha(blinkOn ? 1 : 0.55);
    }

    if (this.backKeys.some((key) => Phaser.Input.Keyboard.JustDown(key))) {
      this.goBack();
    }
  }

  private addSectionHeader(cx: number, y: number, label: string, color: string): void {
    this.add
      .text(cx, y, label, {
        fontFamily: '"Courier New", monospace',
        fontSize: '11px',
        fontStyle: 'bold',
        color,
        stroke: '#000000',
        strokeThickness: 2,
      })
      .setOrigin(0.5, 0)
      .setDepth(10);
  }

  private addRow(label: string, value: string, y: number): void {
    this.add
      .text(18, y, label, {
        fontFamily: 'Arial, sans-serif',
        fontSize: '12px',
        color: '#dddddd',
      })
      .setOrigin(0, 0)
      .setDepth(10);

    this.add
      .text(INTERNAL_WIDTH - 18, y, value, {
        fontFamily: 'Arial, sans-serif',
        fontSize: '12px',
        fontStyle: 'bold',
        color: '#ffffff',
      })
      .setOrigin(1, 0)
      .setDepth(10);
  }

  private addDivider(cx: number, y: number): void {
    this.add
      .text(cx, y, '- - - - - - - - - - - - - -', {
        fontFamily: 'Arial, sans-serif',
        fontSize: '8px',
        color: '#334466',
      })
      .setOrigin(0.5, 0)
      .setDepth(10);
  }

  private goBack(): void {
    if (this.leaving) return;
    this.leaving = true;
    this.cameras.main.fadeOut(180, 0, 0, 0);
    this.time.delayedCall(190, () => {
      this.scene.start('title', {});
    });
  }
}
