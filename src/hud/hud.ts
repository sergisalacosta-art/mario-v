import Phaser from 'phaser';
import { INTERNAL_WIDTH, TARGET_FPS } from '../core/constants';
import type { HudState } from '../core/contracts';

interface Glyph {
  sx: number;
  sy: number;
  w: number;
  h: number;
  advance: number;
}

// Glyph rows in hud_font_132605.png (bottom-left area).
const DIGIT_ROW_Y = 238;
const LETTER_ROW_Y = 250;
const LETTER_ROW_2_Y = 260;
const GLYPH_START_X = 4;
const GLYPH_STEP_X = 10;
const GLYPH_W = 8;
const GLYPH_H = 8;

export class Hud {
  private readonly bitmapGlyphs = new Map<string, Glyph>();
  private readonly sourceImage: HTMLImageElement | HTMLCanvasElement | null;
  private readonly canvasTexture: Phaser.Textures.CanvasTexture | null;

  private readonly scoreText?: Phaser.GameObjects.Text;
  private readonly livesText?: Phaser.GameObjects.Text;
  private readonly coinText?: Phaser.GameObjects.Text;
  private readonly worldText?: Phaser.GameObjects.Text;
  private readonly timeText?: Phaser.GameObjects.Text;

  public constructor(scene: Phaser.Scene) {
    this.sourceImage = this.resolveHudSourceImage(scene);
    this.registerGlyphs();

    const existingCanvas = scene.textures.get('hud_runtime');
    if (existingCanvas) {
      scene.textures.remove('hud_runtime');
    }
    this.canvasTexture = this.sourceImage ? scene.textures.createCanvas('hud_runtime', INTERNAL_WIDTH, 24) : null;
    if (this.canvasTexture) {
      scene.add.image(0, 0, 'hud_runtime').setOrigin(0, 0).setScrollFactor(0).setDepth(2000);
    }

    if (!this.canvasTexture) {
      const style: Phaser.Types.GameObjects.Text.TextStyle = {
        fontFamily: '"Courier New", monospace',
        fontSize: '12px',
        color: '#FFFFFF',
        stroke: '#000000',
        strokeThickness: 2,
        resolution: 2,
      };

      this.scoreText = scene.add.text(8, 6, '', style).setScrollFactor(0).setDepth(2000);
      this.livesText = scene.add.text(84, 6, '', style).setScrollFactor(0).setDepth(2000);
      this.coinText = scene.add.text(124, 6, '', style).setScrollFactor(0).setDepth(2000);
      this.worldText = scene.add.text(152, 6, '', style).setScrollFactor(0).setDepth(2000);
      this.timeText = scene.add.text(206, 6, '', style).setScrollFactor(0).setDepth(2000);
    }
  }

  public render(state: HudState): void {
    const scoreValue = Phaser.Math.Clamp(Math.floor(state.score), 0, 999999);
    const livesValue = Phaser.Math.Clamp(Math.floor(state.lives), 0, 99);
    const coinValue = Phaser.Math.Clamp(Math.floor(state.coins), 0, 99);
    const seconds = Phaser.Math.Clamp(Math.floor(state.timeRemainingFrames / TARGET_FPS), 0, 999);

    if (this.canvasTexture && this.sourceImage) {
      this.renderBitmap(scoreValue, livesValue, coinValue, state.world, seconds);
      return;
    }

    this.scoreText?.setText(`MARIO ${scoreValue.toString().padStart(6, '0')}`);
    this.livesText?.setText(`x${livesValue.toString().padStart(2, '0')}`);
    this.coinText?.setText(`CO${coinValue.toString().padStart(2, '0')}`);
    this.worldText?.setText(`WORLD ${state.world}`);
    this.timeText?.setText(`TIME ${seconds.toString().padStart(3, '0')}`);
  }

  private renderBitmap(
    scoreValue: number,
    livesValue: number,
    coinValue: number,
    worldValue: string,
    seconds: number,
  ): void {
    const ctx = this.canvasTexture!.getContext();
    ctx.clearRect(0, 0, INTERNAL_WIDTH, 24);

    const score = scoreValue.toString().padStart(6, '0');
    const lives = livesValue.toString().padStart(2, '0');
    const coins = coinValue.toString().padStart(2, '0');
    const world = worldValue.toUpperCase();
    const time = seconds.toString().padStart(3, '0');

    // SMAS HUD layout (2 rows): labels on top row, values on second row.
    this.drawText(ctx, 8, 6, 'MARIO');
    this.drawText(ctx, 8, 14, score);
    this.drawText(ctx, 96, 14, `x${lives}`);
    this.drawText(ctx, 124, 14, `CO${coins}`);
    this.drawText(ctx, 152, 6, 'WORLD');
    this.drawText(ctx, 164, 14, world);
    this.drawText(ctx, 208, 6, 'TIME');
    this.drawText(ctx, 232, 14, time);

    this.canvasTexture!.refresh();
  }

  private drawText(ctx: CanvasRenderingContext2D, x: number, y: number, text: string): number {
    let cursor = x;
    for (const rawChar of text) {
      const glyph = this.bitmapGlyphs.get(rawChar) ?? this.bitmapGlyphs.get(rawChar.toUpperCase());
      if (!glyph) {
        cursor += 4;
        continue;
      }

      ctx.drawImage(this.sourceImage!, glyph.sx, glyph.sy, glyph.w, glyph.h, cursor, y, glyph.w, glyph.h);
      cursor += glyph.advance;
    }
    return cursor;
  }

  private resolveHudSourceImage(scene: Phaser.Scene): HTMLImageElement | HTMLCanvasElement | null {
    if (!scene.textures.exists('smas_hud_font')) {
      return null;
    }
    const sourceTexture = scene.textures.get('smas_hud_font');
    return (sourceTexture.getSourceImage() as HTMLImageElement | HTMLCanvasElement | undefined) ?? null;
  }

  private registerGlyphs(): void {
    this.mapRow('0123456789', DIGIT_ROW_Y);
    this.mapRow('ABCDEFGHIJKLMNOPQRSTU', LETTER_ROW_Y);
    // Coin prefix uses lowercase 'x' in the source sheet.
    this.mapRow('VWXYZx?.-', LETTER_ROW_2_Y);
    this.bitmapGlyphs.set(' ', { sx: 0, sy: 0, w: 1, h: 1, advance: 4 });
  }

  private mapRow(chars: string, y: number): void {
    for (let i = 0; i < chars.length; i += 1) {
      const ch = chars[i];
      this.bitmapGlyphs.set(ch, {
        sx: GLYPH_START_X + i * GLYPH_STEP_X,
        sy: y,
        w: GLYPH_W,
        h: GLYPH_H,
        advance: 8,
      });
    }
  }
}
