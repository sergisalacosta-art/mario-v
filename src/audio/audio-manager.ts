import Phaser from 'phaser';

export class AudioManager {
  private readonly scene: Phaser.Scene;
  private musicStarted = false;
  private bgm: Phaser.Sound.BaseSound | null = null;

  public constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  public playBgm(): void {
    if (this.musicStarted || !this.scene.cache.audio.exists('smas_bgm_overworld')) {
      return;
    }
    this.bgm = this.scene.sound.add('smas_bgm_overworld', { loop: true, volume: 0.4 });
    this.bgm.play();
    this.musicStarted = true;
  }

  public stopBgm(): void {
    if (this.bgm && this.bgm.isPlaying) {
      this.bgm.stop();
    }
    this.musicStarted = false;
  }

  public sfxJump(): void {
    this.playIfLoaded('smas_sfx_jump', 0.35);
  }

  public sfxCoin(): void {
    this.playIfLoaded('smas_sfx_coin', 0.35);
  }

  public sfxStomp(): void {
    this.playIfLoaded('smas_sfx_stomp', 0.35);
  }

  public sfxPowerup(): void {
    this.playIfLoaded('smas_sfx_powerup', 0.4);
  }

  public sfxOneUp(): void {
    if (this.scene.cache.audio.exists('smas_sfx_1up')) {
      this.playIfLoaded('smas_sfx_1up', 0.4);
      return;
    }
    this.playIfLoaded('smas_sfx_powerup', 0.4);
  }

  public sfxBreak(): void {
    this.playIfLoaded('smas_sfx_break', 0.35);
  }

  public sfxDie(): void {
    this.playIfLoaded('smas_sfx_die', 0.45);
  }

  public sfxFlagpole(): void {
    this.playIfLoaded('smas_sfx_flagpole', 0.4);
  }

  public sfxClear(): void {
    this.playIfLoaded('smas_sfx_clear', 0.45);
  }

  public sfxFirework(): void {
    if (this.scene.cache.audio.exists('smas_sfx_firework')) {
      this.playIfLoaded('smas_sfx_firework', 0.4);
      return;
    }
    this.sfxStomp();
  }

  private playIfLoaded(key: string, volume: number): void {
    if (!this.scene.cache.audio.exists(key)) {
      return;
    }
    this.scene.sound.play(key, { volume });
  }
}
