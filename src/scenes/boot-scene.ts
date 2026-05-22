import Phaser from 'phaser';
import { getClientAssetPath, resolveClientId } from '../branding/client-config';
import { extractRuntimeTextures } from '../assets/extract-runtime-textures';
import { INDIVIDUAL_RUNTIME_ASSETS } from '../assets/individual-manifest';
import { SMAS_ASSET_MANIFEST } from '../assets/manifest';
import type { LevelVariantId, ReplayData } from '../core/contracts';
import { ensureFallbackTextures } from './fallback-textures';
import {
  DEFAULT_SESSION_STATE,
  getInitialSessionStateForVariant,
  getWorldLabelForVariant,
  normalizeVariantId,
  type SceneFlowPayload,
} from './flow-state';

export interface BootPayload extends SceneFlowPayload {
  missingAssets: string[];
  replayData?: ReplayData;
}

const INDIVIDUAL_CLIENT_ASSET_OVERRIDES = {
  screen_title_logo_main: 'individual/screens/title_logo_main.png',
  screen_title_logo_alt: 'individual/screens/title_logo_alt.png',
} as const;

const MANIFEST_CLIENT_ASSET_OVERRIDES = {
  final_screen_bg: 'custom/finalscreen-clean.png',
} as const;

export class BootScene extends Phaser.Scene {
  private readonly missingAssets = new Set<string>();

  public constructor() {
    super({ key: 'boot' });
  }

  public preload(): void {
    const params = new URLSearchParams(window.location.search);
    const captureMode = params.get('capture') === '1';
    const skipAudio = captureMode || params.get('mute') === '1';
    const clientId = resolveClientId(params.get('client'));
    this.load.on(Phaser.Loader.Events.FILE_LOAD_ERROR, (file: Phaser.Loader.File) => {
      this.missingAssets.add(file.key);
    });

    INDIVIDUAL_RUNTIME_ASSETS.forEach((asset) => {
      const overridePath = INDIVIDUAL_CLIENT_ASSET_OVERRIDES[asset.key as keyof typeof INDIVIDUAL_CLIENT_ASSET_OVERRIDES];
      const path = overridePath ? getClientAssetPath(clientId, asset.path, overridePath) : asset.path;
      this.load.image(asset.key, path);
    });
    this.load.image(
      'custom_splash_screen',
      getClientAssetPath(clientId, 'assets/reference/splash-screen.png', 'reference/splash-screen.png'),
    );
    this.load.image(
      'title_card',
      getClientAssetPath(clientId, 'assets/custom/title-card.png', 'custom/title-card.png'),
    );
    this.load.video('smas_intro_video', 'assets/reference/mar10-start/intro.mp4', true);

    SMAS_ASSET_MANIFEST.entries.forEach((asset) => {
      if (asset.kind === 'audio') {
        if (skipAudio) {
          return;
        }
        this.load.audio(asset.key, asset.path);
        return;
      }
      const overridePath = MANIFEST_CLIENT_ASSET_OVERRIDES[asset.key as keyof typeof MANIFEST_CLIENT_ASSET_OVERRIDES];
      const path = overridePath ? getClientAssetPath(clientId, asset.path, overridePath) : asset.path;
      if (asset.kind === 'spritesheet' && asset.frameWidth && asset.frameHeight) {
        this.load.spritesheet(asset.key, path, {
          frameWidth: asset.frameWidth,
          frameHeight: asset.frameHeight,
        });
        return;
      }
      this.load.image(asset.key, path);
    });

    const replayPath = params.get('replay');
    if (replayPath) {
      this.load.json('runtime_replay', replayPath);
    }
  }

  public create(): void {
    ensureFallbackTextures(this);
    extractRuntimeTextures(this);
    this.createDerivedEnemyTextures();

    let replayData: ReplayData | undefined;
    if (this.cache.json.exists('runtime_replay')) {
      const loaded = this.cache.json.get('runtime_replay') as ReplayData | undefined;
      if (loaded && Array.isArray(loaded.frames)) {
        replayData = loaded;
      } else {
        this.missingAssets.add('runtime_replay');
      }
    }

    const params = new URLSearchParams(window.location.search);
    const variantFromQuery = this.resolveVariantFromQuery(params);
    const initialSession = getInitialSessionStateForVariant(variantFromQuery);
    const payload: BootPayload = {
      missingAssets: Array.from(this.missingAssets.values()),
      replayData,
      session: {
        ...DEFAULT_SESSION_STATE,
        score: initialSession.score,
        coins: initialSession.coins,
        lives: initialSession.lives,
        variantId: variantFromQuery,
        world: getWorldLabelForVariant(variantFromQuery),
      },
    };
    const debugScene = params.get('scene');
    if (debugScene === 'game-over') {
      this.scene.start('game-over', {
        ...payload,
        session: { score: 26600, coins: 6, lives: 0, world: '4-1', variantId: 'world4_1_video' },
        timeUp: false,
      });
      return;
    }
    if (debugScene === 'time-up') {
      this.scene.start('game-over', {
        ...payload,
        session: { score: 26600, coins: 6, lives: 2, world: '4-1', variantId: 'world4_1_video' },
        timeUp: true,
      });
      return;
    }
    if (debugScene === 'final-screen') {
      this.scene.start('final-screen', payload);
      return;
    }
    if (debugScene === 'intro') {
      this.scene.start('intro', payload);
      return;
    }

    const directGameplayMode =
      params.has('capture') ||
      params.has('guide') ||
      params.has('checkpoint') ||
      params.has('autoplay') ||
      params.has('replay') ||
      params.has('seek') ||
      params.has('seekFrame') ||
      params.has('pauseOnSeek') ||
      params.has('dumpReplay');
    const nextScene = directGameplayMode ? 'game' : 'intro';
    this.scene.start(nextScene, payload);
  }

  private createDerivedEnemyTextures(): void {
    this.createWhiteRamTexture('spiny_ram', 'spiny_ram_white');
  }

  private createWhiteRamTexture(sourceKey: string, targetKey: string): void {
    if (!this.textures.exists(sourceKey) || this.textures.exists(targetKey)) {
      return;
    }

    const source = this.textures.get(sourceKey).getSourceImage() as CanvasImageSource | null;
    if (!source) {
      return;
    }

    const width = (source as { width?: number }).width ?? 0;
    const height = (source as { height?: number }).height ?? 0;
    if (width <= 0 || height <= 0) {
      return;
    }

    const texture = this.textures.createCanvas(targetKey, width, height);
    if (!texture) {
      return;
    }

    const ctx = texture.getContext();
    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(source, 0, 0, width, height);

    const imageData = ctx.getImageData(0, 0, width, height);
    const { data } = imageData;
    for (let i = 0; i < data.length; i += 4) {
      const alpha = data[i + 3];
      if (alpha === 0) {
        continue;
      }

      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      const isBrownWool =
        r >= 110 &&
        r <= 210 &&
        g >= 70 &&
        g <= 165 &&
        b >= 35 &&
        b <= 120 &&
        r > g + 18 &&
        g > b + 8;

      if (!isBrownWool) {
        continue;
      }

      const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
      const whiteShade = Math.round(228 + Phaser.Math.Clamp((luminance - 110) / 80, 0, 1) * 22);
      data[i] = whiteShade;
      data[i + 1] = whiteShade;
      data[i + 2] = Math.max(whiteShade - 4, 220);
    }

    ctx.putImageData(imageData, 0, 0);
    texture.refresh();
  }

  private resolveVariantFromQuery(params: URLSearchParams): LevelVariantId {
    const rawVariant = params.get('variant');
    return normalizeVariantId(rawVariant ?? undefined);
  }
}
