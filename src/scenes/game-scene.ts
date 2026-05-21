import Phaser from 'phaser';
import { AudioManager } from '../audio/audio-manager';
import {
  CAMERA_ACTIVATION_MARGIN,
  CAMERA_SCROLL_TRIGGER_X,
  INTERNAL_WIDTH,
  SOLID_TILE_IDS,
  TARGET_FPS,
  TILE_FLAG,
  TILE_PIPE_TOP_LEFT,
  TILE_PIPE_TOP_RIGHT,
  TILE_SIZE,
  TILE_QUESTION,
  WORLD_Y_OFFSET,
} from '../core/constants';
import type { HudState, InputSnapshot, LevelDefinition, LevelVariantId, ReplayStateSnapshot } from '../core/contracts';
import { getFireworksCountFromTimer, getFlagpoleScoreByHeight, getTimerBonusTickFrames } from '../core/clear-rules';
import { FixedStepClock } from '../core/fixed-step';
import { computeCameraScrollX, isStompCollision } from '../core/gameplay-rules';
import { InputController } from '../core/input';
import { ReplayPlayer, ReplayRecorder } from '../core/replay';
import { BlockManager } from '../entities/blocks';
import { CoinManager } from '../entities/coins';
import { Enemy, EnemyManager } from '../entities/enemies';
import { Fireball, FireballManager } from '../entities/fireballs';
import { Mario } from '../entities/mario';
import { PiranhaManager } from '../entities/piranhas';
import { Hud } from '../hud/hud';
import { buildLevel } from '../level/level-builder';
import { createLevelDefinitionByVariant } from '../level/world11';
import {
  getYoutubeGuideCheckpoint,
  type YoutubeGuideSceneOverride,
} from '../reference/youtube-guide';
import { getMar10StartGuideCheckpoint } from '../reference/mar10-start-guide';
import { getWorld11GameoverGuideCheckpoint } from '../reference/world11-gameover-guide';
import { configureCamera } from '../render/camera';
import {
  getWorldLabelForVariant,
  normalizeSessionState,
  normalizeVariantId,
  type SceneFlowPayload,
  type SessionState,
} from './flow-state';
import {
  advanceCompetitionRound,
  isCompetitionActive,
  recordCompetitionRoundResult,
} from './competition-store';

export class GameScene extends Phaser.Scene {
  private level: LevelDefinition = createLevelDefinitionByVariant('world1_1');
  private variantId: LevelVariantId = 'world1_1';
  private readonly fixedClock = new FixedStepClock();
  private readonly replayRecorder = new ReplayRecorder();
  private replayPlayer: ReplayPlayer | null = null;

  private inputController!: InputController;
  private mario!: Mario;
  private enemyManager!: EnemyManager;
  private fireballManager!: FireballManager;
  private blockManager!: BlockManager;
  private coinManager!: CoinManager;
  private piranhaManager!: PiranhaManager;
  private hud!: Hud;
  private audioManager!: AudioManager;

  private hudState: HudState = {
    score: 0,
    coins: 0,
    world: '1-1',
    timeRemainingFrames: 0,
    lives: 3,
  };

  private frameNumber = 0;
  private worldBottomY = 0;
  private gameplayState: 'playing' | 'dead' | 'clear' = 'playing';
  private clearPhase: 'none' | 'slide' | 'hop' | 'walk' | 'bonus' | 'done' = 'none';
  private clearPoleX = 0;
  private clearGroundY = 0;
  private clearFlagTopY = 0;
  private clearFlagTargetY = 0;
  private clearFlagSprite: Phaser.GameObjects.Image | null = null;
  private clearOverlayShown = false;
  private clearRestartScheduled = false;
  private clearBonusTickCarry = 0;
  private clearBonusTargetTicks = 0;
  private clearBonusTicksElapsed = 0;
  private clearWalkDelayFrames = 0;
  private clearHopFrames = 0;
  private clearDoneDelayFrames = 0;
  private clearTimerSecondsAtPole = 0;
  private clearFireworksCount = 0;
  private clearCelebrationTriggered = false;
  private stompSafeUntilMs = 0;
  private lastInput: InputSnapshot = { left: false, right: false, down: false, jump: false, run: false };
  private lastHeadHitFrame = -999;
  private questionAnimFrame = 0;
  private tilemapTextureKey = 'tiles_fallback';
  private autoplayEnabled = false;
  private captureSeekFrame: number | null = null;
  private capturePauseOnSeek = false;
  private captureFrozen = false;
  private captureDumpReplay = false;
  private autoJumpHoldFrames = 0;
  private autoJumpCooldownFrames = 0;
  private autoLastX = 0;
  private autoNoProgressFrames = 0;
  private cameraLockedScrollX = 0;
  private guideMode: 'youtube' | 'world11-gameover' | 'mar10-start' | null = null;
  private guideCheckpoint: number | null = null;
  private readonly solidTileIds = new Set<number>(SOLID_TILE_IDS);
  private solidLayerRef: Phaser.Tilemaps.TilemapLayer | null = null;
  private decorClouds: Phaser.GameObjects.TileSprite | null = null;
  private decorHillsB: Phaser.GameObjects.TileSprite | null = null;
  private readonly guideOverlayObjects: Phaser.GameObjects.GameObject[] = [];
  private guideSolidLayerWasVisible = true;
  private suppressHudRender = false;

  public constructor() {
    super({ key: 'game' });
  }

  public create(_payload?: SceneFlowPayload): void {
    this.resetRuntimeState();

    const sessionState = normalizeSessionState(_payload?.session);
    const variantFromQuery = this.resolveVariantFromUrl();
    this.variantId = normalizeVariantId(variantFromQuery ?? sessionState.variantId);
    this.level = createLevelDefinitionByVariant(this.variantId);
    this.hudState.score = sessionState.score;
    this.hudState.coins = sessionState.coins;
    this.hudState.world = getWorldLabelForVariant(this.variantId);
    this.hudState.lives = sessionState.lives;
    this.normalizeCoinBalance();

    this.configureCaptureFromUrl();
    if (_payload?.replayData && Array.isArray(_payload.replayData.frames)) {
      this.replayPlayer = new ReplayPlayer(_payload.replayData);
      this.autoplayEnabled = false;
    }

    this.cameras.main.setBackgroundColor('#5D94FB');

    const tilemapTexture = this.resolveTilemapTextureKey();
    this.tilemapTextureKey = tilemapTexture;
    const builtLevel = buildLevel(this, this.level, tilemapTexture);
    this.solidLayerRef = builtLevel.solidLayer;
    this.worldBottomY = builtLevel.worldPixelHeight;
    this.physics.world.setBounds(0, 0, builtLevel.worldPixelWidth, builtLevel.worldPixelHeight + 32);
    this.computeClearGeometry();

    this.addDecorativeLayers(builtLevel.worldPixelWidth);
    this.startQuestionBlockAnimation();
    this.spawnClearFlag();

    this.mario = new Mario(this, this.level.start.x, this.level.start.y + WORLD_Y_OFFSET);
    this.autoLastX = this.mario.x;
    this.autoNoProgressFrames = 0;
    this.enemyManager = new EnemyManager(this, this.level.enemySpawns, WORLD_Y_OFFSET);
    this.fireballManager = new FireballManager(this);
    this.blockManager = new BlockManager(this, builtLevel.solidLayer, this.level.blocks, WORLD_Y_OFFSET);
    this.coinManager = new CoinManager(this, this.level.coinSpawns);
    this.piranhaManager = new PiranhaManager(this, this.level.pipePlantSpawns, WORLD_Y_OFFSET);

    this.physics.add.collider(this.mario, builtLevel.solidLayer);
    this.physics.add.collider(this.enemyManager.getGroup(), builtLevel.solidLayer);
    this.physics.add.collider(
      this.enemyManager.getGroup(),
      this.enemyManager.getGroup(),
      (enemyA, enemyB) => {
        this.handleEnemyVsEnemy(enemyA as Enemy, enemyB as Enemy);
      },
      (enemyA, enemyB) => {
        const a = enemyA as Enemy;
        const b = enemyB as Enemy;
        // Lakitu and eggs must not block each other, otherwise eggs can get stuck near cloud height.
        if (a.isLakitu() || b.isLakitu() || a.isSpinyEgg() || b.isSpinyEgg()) {
          return false;
        }
        return true;
      },
      this,
    );
    this.physics.add.collider(this.fireballManager.getGroup(), builtLevel.solidLayer);
    this.physics.add.collider(this.blockManager.getItemGroup(), builtLevel.solidLayer);

    this.physics.add.overlap(this.mario, this.enemyManager.getGroup(), (_, enemyObj) => {
      this.handleEnemyCollision(enemyObj as Enemy);
    });
    this.physics.add.overlap(this.mario, this.piranhaManager.getGroup(), () => {
      this.handlePiranhaCollision();
    });

    this.physics.add.overlap(this.mario, this.blockManager.getItemGroup(), (_, itemObj) => {
      this.handleItemPickup(itemObj as Phaser.Physics.Arcade.Sprite);
    });
    this.physics.add.overlap(this.mario, this.coinManager.getGroup(), (_, coinObj) => {
      this.handleFloatingCoinPickup(coinObj as Phaser.Physics.Arcade.Sprite);
    });
    this.physics.add.overlap(this.fireballManager.getGroup(), this.enemyManager.getGroup(), (fireballObj, enemyObj) => {
      this.handleFireballEnemy(fireballObj as Fireball, enemyObj as Enemy);
    });

    this.inputController = new InputController(this);
    this.hud = new Hud(this);
    this.audioManager = new AudioManager(this);
    const captureParams = new URLSearchParams(window.location.search);
    const mutedByQuery = captureParams.get('mute') === '1' || captureParams.get('capture') === '1';
    if (mutedByQuery || this.autoplayEnabled) {
      this.sound.mute = true;
    } else {
      this.audioManager.playBgm();
    }

    this.hudState.timeRemainingFrames = this.level.timeLimitSeconds * TARGET_FPS;
    configureCamera(this.cameras.main, builtLevel.worldPixelWidth, builtLevel.worldPixelHeight);
    this.cameraLockedScrollX = this.cameras.main.scrollX;
    if (this.guideMode !== null && this.guideCheckpoint !== null) {
      this.applyGuideCheckpoint(this.guideMode, this.guideCheckpoint);
    } else {
      this.centerCameraOnMario();
    }
    if (!this.suppressHudRender) {
      this.hud.render(this.hudState);
    }

    (window as unknown as { smasReplay?: () => string }).smasReplay = () => JSON.stringify(this.replayRecorder.export());
    const captureState = window as unknown as { __smasCaptureReady?: boolean; __smasCaptureFrame?: number };
    const isGuidedCheckpoint = this.guideMode !== null && this.guideCheckpoint !== null;
    captureState.__smasCaptureReady = isGuidedCheckpoint || this.captureSeekFrame === null;
    if (isGuidedCheckpoint) {
      captureState.__smasCaptureFrame = 0;
    }
  }

  private resetRuntimeState(): void {
    this.fixedClock.reset();
    this.replayRecorder.reset();
    this.replayPlayer = null;

    this.frameNumber = 0;
    this.worldBottomY = 0;
    this.gameplayState = 'playing';
    this.clearPhase = 'none';
    this.clearPoleX = 0;
    this.clearGroundY = 0;
    this.clearFlagTopY = 0;
    this.clearFlagTargetY = 0;
    if (this.clearFlagSprite && this.clearFlagSprite.active) {
      this.clearFlagSprite.destroy();
    }
    this.clearFlagSprite = null;
    this.clearOverlayShown = false;
    this.clearRestartScheduled = false;
    this.clearBonusTickCarry = 0;
    this.clearBonusTargetTicks = 0;
    this.clearBonusTicksElapsed = 0;
    this.clearWalkDelayFrames = 0;
    this.clearHopFrames = 0;
    this.clearDoneDelayFrames = 0;
    this.clearTimerSecondsAtPole = 0;
    this.clearFireworksCount = 0;
    this.clearCelebrationTriggered = false;
    this.stompSafeUntilMs = 0;
    this.lastInput = { left: false, right: false, down: false, jump: false, run: false };
    this.lastHeadHitFrame = -999;
    this.questionAnimFrame = 0;
    this.tilemapTextureKey = 'tiles_fallback';

    this.autoplayEnabled = false;
    this.captureSeekFrame = null;
    this.capturePauseOnSeek = false;
    this.captureFrozen = false;
    this.captureDumpReplay = false;
    this.autoJumpHoldFrames = 0;
    this.autoJumpCooldownFrames = 0;
    this.autoLastX = 0;
    this.autoNoProgressFrames = 0;
    this.cameraLockedScrollX = 0;
    this.guideMode = null;
    this.guideCheckpoint = null;

    this.solidLayerRef = null;
    this.decorClouds = null;
    this.decorHillsB = null;
    this.guideSolidLayerWasVisible = true;
    this.suppressHudRender = false;
    this.clearGuideSceneOverrideObjects();
  }

  public update(_time: number, deltaMs: number): void {
    this.fixedClock.tick(deltaMs, () => {
      this.fixedUpdate();
    });
  }

  private fixedUpdate(): void {
    if (this.captureFrozen) {
      return;
    }

    this.frameNumber += 1;

    if (this.gameplayState === 'playing') {
      const frame = this.frameNumber;
      const input = this.replayPlayer
        ? this.replayPlayer.getInput(frame)
        : this.autoplayEnabled
          ? this.computeAutoplayInput()
          : this.inputController.snapshot();
      this.stepPlaying(input);
      if (this.replayPlayer) {
        const replayState = this.replayPlayer.getState(frame);
        if (replayState) {
          this.applyReplayState(replayState);
        }
      }
      this.replayRecorder.record(frame, input, this.captureReplayState());
      if (this.autoplayEnabled) {
        this.resolveAutoplayStall();
      }
      this.lastInput = input;
    } else if (this.gameplayState === 'clear') {
      this.stepClear();
    }

    this.centerCameraOnMario();
    this.updateDecorParallax();
    if (!this.suppressHudRender) {
      this.hud.render(this.hudState);
    }

    if (this.capturePauseOnSeek && this.captureSeekFrame !== null && this.frameNumber >= this.captureSeekFrame) {
      this.captureFrozen = true;
      const captureState = window as unknown as { __smasCaptureReady?: boolean; __smasCaptureFrame?: number };
      captureState.__smasCaptureReady = true;
      captureState.__smasCaptureFrame = this.frameNumber;
      if (this.captureDumpReplay) {
        this.publishReplayDump();
      }
    }
  }

  private configureCaptureFromUrl(): void {
    const params = new URLSearchParams(window.location.search);
    const guideMode = params.get('guide');
    if (guideMode === 'youtube' || guideMode === 'world11-gameover' || guideMode === 'mar10-start') {
      this.guideMode = guideMode;
      const checkpointParam = params.get('checkpoint');
      if (checkpointParam) {
        const checkpoint = Number.parseInt(checkpointParam, 10);
        if (Number.isFinite(checkpoint) && checkpoint > 0) {
          this.guideCheckpoint = checkpoint;
        }
      }
      this.autoplayEnabled = false;
      this.capturePauseOnSeek = false;
      this.captureSeekFrame = null;
      return;
    }

    this.autoplayEnabled = params.get('autoplay') === '1';
    this.capturePauseOnSeek = params.get('pauseOnSeek') === '1';
    this.captureDumpReplay = params.get('dumpReplay') === '1';
    if (params.get('replay')) {
      this.autoplayEnabled = false;
    }

    const seekFrameParam = params.get('seekFrame');
    if (seekFrameParam) {
      const parsed = Number.parseInt(seekFrameParam, 10);
      if (Number.isFinite(parsed) && parsed >= 0) {
        this.captureSeekFrame = parsed;
      }
      return;
    }

    const seekSecondsParam = params.get('seek');
    if (!seekSecondsParam) {
      return;
    }
    const seconds = Number.parseFloat(seekSecondsParam);
    if (!Number.isFinite(seconds) || seconds < 0) {
      return;
    }
    this.captureSeekFrame = Math.max(0, Math.round(seconds * TARGET_FPS));
  }

  private resolveVariantFromUrl(): string | undefined {
    const params = new URLSearchParams(window.location.search);
    const variant = params.get('variant');
    return variant ?? undefined;
  }

  private publishReplayDump(): void {
    const replayJson = JSON.stringify(this.replayRecorder.export());
    const replayB64 = btoa(replayJson);
    document.documentElement.setAttribute('data-smas-replay-b64', replayB64);
    const captureState = window as unknown as { __smasReplayB64?: string };
    captureState.__smasReplayB64 = replayB64;
  }

  private captureReplayState(): ReplayStateSnapshot {
    const body = this.mario.body as Phaser.Physics.Arcade.Body;
    return {
      marioX: this.mario.x,
      marioY: this.mario.y,
      marioVx: body.velocity.x,
      marioVy: body.velocity.y,
      cameraX: this.cameras.main.scrollX,
      score: this.hudState.score,
      coins: this.hudState.coins,
      timeRemainingFrames: this.hudState.timeRemainingFrames,
      form: this.mario.getForm(),
      gameplayState: this.gameplayState,
    };
  }

  private captureSessionState(): SessionState {
    return {
      score: this.hudState.score,
      coins: this.hudState.coins,
      lives: this.hudState.lives,
      world: this.hudState.world,
      variantId: this.variantId,
    };
  }

  private applyReplayState(state: ReplayStateSnapshot): void {
    const body = this.mario.body as Phaser.Physics.Arcade.Body;
    this.mario.forceForm(state.form);
    this.mario.setPosition(state.marioX, state.marioY);
    body.setVelocity(state.marioVx, state.marioVy);
    this.hudState.score = state.score;
    this.hudState.coins = state.coins;
    this.hudState.timeRemainingFrames = state.timeRemainingFrames;
    this.cameraLockedScrollX = state.cameraX;
    this.cameras.main.scrollX = Math.floor(state.cameraX);
    this.cameras.main.scrollY = 0;

    if (state.gameplayState === 'playing' && this.gameplayState !== 'playing') {
      this.gameplayState = 'playing';
      this.mario.setVisible(true);
      body.enable = true;
      this.tweens.killTweensOf(this.mario);
    }
  }

  private computeAutoplayInput(): InputSnapshot {
    const body = this.mario.body as Phaser.Physics.Arcade.Body;
    const onGround = body.blocked.down || body.touching.down;
    const deltaX = Math.abs(body.center.x - this.autoLastX);
    const mostlyStopped = Math.abs(body.velocity.x) < 3;
    if (deltaX < 0.2 && mostlyStopped) {
      this.autoNoProgressFrames += 1;
    } else {
      this.autoNoProgressFrames = 0;
    }
    this.autoLastX = body.center.x;

    if (this.autoJumpCooldownFrames > 0) {
      this.autoJumpCooldownFrames -= 1;
    }

    let jump = false;
    if (this.autoJumpHoldFrames > 0) {
      this.autoJumpHoldFrames -= 1;
      jump = true;
    } else if (onGround) {
      const nearProbeX = body.right + 6;
      const farProbeX = body.right + 18;
      const wallAhead =
        this.isSolidAtPixel(nearProbeX, body.bottom - 4) ||
        this.isSolidAtPixel(nearProbeX, body.bottom - 10) ||
        this.isSolidAtPixel(nearProbeX, body.bottom - 18) ||
        this.isSolidAtPixel(nearProbeX, body.bottom - 26) ||
        this.isSolidAtPixel(farProbeX, body.bottom - 4) ||
        this.isSolidAtPixel(farProbeX, body.bottom - 12) ||
        this.isSolidAtPixel(farProbeX, body.bottom - 20);
      const gapAhead = !this.isSolidAtPixel(farProbeX, body.bottom + 2) || !this.isSolidAtPixel(farProbeX + 10, body.bottom + 2);
      const blockedRight = body.blocked.right || body.touching.right;
      const stuck = this.autoNoProgressFrames > 12;
      const forceJump = blockedRight || wallAhead;
      const readyForTimedJump = this.autoJumpCooldownFrames === 0;
      const shouldJump = forceJump || ((gapAhead || stuck) && readyForTimedJump);

      if (shouldJump) {
        const forceHighJump = forceJump || stuck;
        this.autoJumpHoldFrames = forceHighJump ? 12 : 9;
        this.autoJumpCooldownFrames = forceHighJump ? 6 : 18;
        this.autoNoProgressFrames = 0;
        jump = true;
      }
    }

    return {
      left: false,
      right: true,
      down: false,
      jump,
      run: true,
    };
  }

  private isSolidAtPixel(x: number, y: number): boolean {
    const tileX = Math.floor(x / TILE_SIZE);
    const tileY = Math.floor((y - WORLD_Y_OFFSET) / TILE_SIZE);
    if (tileX < 0 || tileY < 0 || tileX >= this.level.widthTiles || tileY >= this.level.heightTiles) {
      return true;
    }
    return this.solidTileIds.has(this.level.solidLayer[tileY][tileX]);
  }

  public getPipeTopBoundsAtPixel(x: number, y: number): { left: number; right: number } | null {
    const tileX = Math.floor(x / TILE_SIZE);
    const tileY = Math.floor((y - WORLD_Y_OFFSET) / TILE_SIZE);
    if (tileX < 0 || tileY < 0 || tileX >= this.level.widthTiles || tileY >= this.level.heightTiles) {
      return null;
    }

    const current = this.level.solidLayer[tileY]?.[tileX];
    let leftTileX: number | null = null;

    if (
      current === TILE_PIPE_TOP_LEFT &&
      this.level.solidLayer[tileY]?.[tileX + 1] === TILE_PIPE_TOP_RIGHT
    ) {
      leftTileX = tileX;
    } else if (
      current === TILE_PIPE_TOP_RIGHT &&
      this.level.solidLayer[tileY]?.[tileX - 1] === TILE_PIPE_TOP_LEFT
    ) {
      leftTileX = tileX - 1;
    }

    if (leftTileX === null) {
      return null;
    }

    return {
      left: leftTileX * TILE_SIZE,
      right: (leftTileX + 2) * TILE_SIZE,
    };
  }

  private stepPlaying(input: InputSnapshot): void {
    const body = this.mario.body as Phaser.Physics.Arcade.Body;
    const wasGrounded = body.blocked.down || body.touching.down;

    this.mario.step(input, 1 / TARGET_FPS, this.time.now);
    this.snapMarioToGroundIfNear();
    this.stabilizeMarioGroundContact();
    if (this.mario.getForm() === 'fire' && input.run) {
      this.fireballManager.tryShootFromMario(this.mario, this.frameNumber, this.time.now);
    }
    if (input.jump && !this.lastInput.jump && wasGrounded) {
      this.audioManager.sfxJump();
    }

    this.enemyManager.update(
      this.cameras.main,
      this.cameras.main.worldView.right + CAMERA_ACTIVATION_MARGIN,
      this.time.now,
      this.mario.x,
    );
    this.fireballManager.update(this.cameras.main, this.time.now);
    this.piranhaManager.update(this.time.now, this.mario.x, this.mario.y, this.cameras.main);
    this.coinManager.update(this.time.now, this.cameras.main);
    this.stepItems();

    this.tryHitBlockFromBelow();

    this.hudState.timeRemainingFrames = Math.max(0, this.hudState.timeRemainingFrames - 1);

    if (this.autoplayEnabled) {
      if (this.mario.y > this.worldBottomY + 32) {
        const rescueY = this.findSurfaceYAtWorldX(this.mario.x) ?? this.level.start.y + WORLD_Y_OFFSET;
        this.mario.setPosition(this.mario.x, rescueY);
        body.setVelocityY(0);
      }
    } else if (this.hudState.timeRemainingFrames === 0 || this.mario.y > this.worldBottomY + 32) {
      this.triggerDeath(this.hudState.timeRemainingFrames === 0 ? 'time' : 'pit');
      return;
    }

    this.tryTriggerFlagpoleClear();
  }

  private resolveAutoplayStall(): void {
    if (this.autoNoProgressFrames < 30) {
      return;
    }

    const body = this.mario.body as Phaser.Physics.Arcade.Body;
    const targetX = Math.min(body.center.x + TILE_SIZE * 2, this.level.widthTiles * TILE_SIZE - TILE_SIZE);
    const surfaceY = this.findSurfaceYAtWorldX(targetX);
    if (surfaceY !== null) {
      this.mario.setPosition(targetX, surfaceY);
      body.setVelocityY(0);
    } else {
      this.mario.setX(targetX);
    }
    body.setVelocityX(Math.max(body.velocity.x, 80));
    this.autoNoProgressFrames = 0;
    this.autoJumpCooldownFrames = 0;
  }

  private findSurfaceYAtWorldX(worldX: number): number | null {
    const tileX = Math.floor(worldX / TILE_SIZE);
    if (tileX < 0 || tileX >= this.level.widthTiles) {
      return null;
    }

    for (let tileY = 0; tileY < this.level.heightTiles; tileY += 1) {
      const tile = this.level.solidLayer[tileY][tileX];
      if (!this.solidTileIds.has(tile)) {
        continue;
      }
      const tileAbove = tileY > 0 ? this.level.solidLayer[tileY - 1][tileX] : 0;
      if (this.solidTileIds.has(tileAbove)) {
        continue;
      }
      return WORLD_Y_OFFSET + tileY * TILE_SIZE;
    }

    return null;
  }

  private stepItems(): void {
    const items = this.blockManager.getItemGroup().getChildren() as Phaser.Physics.Arcade.Sprite[];

    items.forEach((item) => {
      const kind = item.getData('kind') as 'mushroom' | 'fireflower' | undefined;
      if (!kind) {
        return;
      }
      if (item.getData('emerging') === true) {
        return;
      }
      const body = item.body as Phaser.Physics.Arcade.Body;

      if (kind === 'mushroom') {
        if (body.blocked.left) {
          body.setVelocityX(44);
        } else if (body.blocked.right) {
          body.setVelocityX(-44);
        }
      } else {
        body.setVelocityX(0);
      }
    });
  }

  private tryHitBlockFromBelow(): void {
    const body = this.mario.body as Phaser.Physics.Arcade.Body;
    if (!body.blocked.up) {
      return;
    }

    if (this.frameNumber - this.lastHeadHitFrame < 4) {
      return;
    }

    const head = this.mario.getHeadTilePosition(WORLD_Y_OFFSET);
    const hit = this.blockManager.tryHitFromBelow(head.x, head.y, this.mario.getForm());
    if (hit) {
      this.addScore(hit.scoreDelta ?? 0);
      this.addCoins(hit.coinsDelta ?? 0);
      if (hit.outcome === 'coin' || hit.outcome === 'item') {
        this.audioManager.sfxCoin();
      } else if (hit.outcome === 'brickBreak') {
        this.audioManager.sfxBreak();
      }
      if (hit.outcome === 'coin' && hit.worldX !== undefined && hit.worldY !== undefined) {
        this.spawnCoinPop(hit.worldX, hit.worldY);
      }
      if (hit.scoreDelta && hit.worldX !== undefined && hit.worldY !== undefined) {
        this.spawnScorePopup(hit.worldX, hit.worldY, hit.scoreDelta);
      }
    } else {
      const tile = this.level.solidLayer[head.y]?.[head.x];
      if (tile === TILE_QUESTION) {
        this.audioManager.sfxCoin();
      }
    }

    this.lastHeadHitFrame = this.frameNumber;
  }

  private handleEnemyCollision(enemy: Enemy): void {
    if (this.gameplayState !== 'playing' || !enemy.active) {
      return;
    }
    if (this.autoplayEnabled) {
      return;
    }
    if (this.time.now < this.stompSafeUntilMs) {
      return;
    }

    const marioBody = this.mario.body as Phaser.Physics.Arcade.Body;
    const enemyBody = enemy.body as Phaser.Physics.Arcade.Body;

    const stomped = this.isMarioStompCollision(marioBody, enemyBody);
    if (stomped && enemy.isStompable()) {
      this.mario.y = Math.min(this.mario.y, enemyBody.top - 0.5);
      const stompDirection: -1 | 1 = this.mario.x < enemy.x ? 1 : -1;
      enemy.squash(stompDirection);
      this.mario.stompBounce();
      this.stompSafeUntilMs = this.time.now + 120;
      this.addScore(100);
      this.spawnScorePopup(enemy.x, enemy.y - 18, 100);
      this.audioManager.sfxStomp();
      return;
    }

    if (enemy.isKoopaShellStationary()) {
      const kickDirection: -1 | 1 = this.mario.x < enemy.x ? 1 : -1;
      enemy.kickShell(kickDirection);
      marioBody.setVelocityX(-kickDirection * 48);
      this.mario.x -= kickDirection * 4;
      this.stompSafeUntilMs = this.time.now + 180;
      this.audioManager.sfxStomp();
      return;
    }

    const died = this.mario.takeDamage(this.time.now);
    if (died) {
      this.triggerDeath('enemy');
    }
  }

  private isMarioStompCollision(
    marioBody: Phaser.Physics.Arcade.Body,
    enemyBody: Phaser.Physics.Arcade.Body,
  ): boolean {
    return isStompCollision(
      {
        left: marioBody.left,
        right: marioBody.right,
        top: marioBody.top,
        bottom: marioBody.bottom,
        centerX: marioBody.center.x,
        centerY: marioBody.center.y,
        prevY: marioBody.prev.y,
        height: marioBody.height,
        velocityY: marioBody.velocity.y,
        deltaY: marioBody.deltaY(),
        touchingDown: marioBody.touching.down,
        blockedDown: marioBody.blocked.down,
        touchingUp: marioBody.touching.up,
        blockedUp: marioBody.blocked.up,
      },
      {
        left: enemyBody.left,
        right: enemyBody.right,
        top: enemyBody.top,
        bottom: enemyBody.bottom,
        centerX: enemyBody.center.x,
        centerY: enemyBody.center.y,
        prevY: enemyBody.prev.y,
        height: enemyBody.height,
        velocityY: enemyBody.velocity.y,
        deltaY: enemyBody.deltaY(),
        touchingDown: enemyBody.touching.down,
        blockedDown: enemyBody.blocked.down,
        touchingUp: enemyBody.touching.up,
        blockedUp: enemyBody.blocked.up,
      },
    );
  }

  private handleItemPickup(item: Phaser.Physics.Arcade.Sprite): void {
    if (!item.active) {
      return;
    }

    const kind = item.getData('kind') as 'mushroom' | 'fireflower' | undefined;
    if (!kind) {
      return;
    }
    const isGreenMushroom = item.texture.key === 'item_mushroom_green';

    if (kind === 'mushroom') {
      this.mario.powerUp('super');
      this.addScore(1000);
    } else {
      this.mario.powerUp('fire');
      this.addScore(1000);
    }
    if (isGreenMushroom) {
      this.hudState.lives += 1;
    }

    item.destroy();
    this.snapMarioToGroundIfNear(10);
    this.stabilizeMarioGroundContact();
    this.audioManager.sfxPowerup();
  }

  private handleFloatingCoinPickup(coin: Phaser.Physics.Arcade.Sprite): void {
    if (this.gameplayState !== 'playing' || !coin.active) {
      return;
    }
    const collected = this.coinManager.collect(coin);
    if (!collected) {
      return;
    }
    this.addCoins(1);
    this.addScore(200);
    this.spawnCoinPop(collected.x, collected.y);
    this.spawnScorePopup(collected.x, collected.y - 12, 200);
    this.audioManager.sfxCoin();
  }

  private handlePiranhaCollision(): void {
    if (this.gameplayState !== 'playing') {
      return;
    }
    if (this.autoplayEnabled) {
      return;
    }
    const died = this.mario.takeDamage(this.time.now);
    if (died) {
      this.triggerDeath('enemy');
    }
  }

  private handleEnemyVsEnemy(enemyA: Enemy, enemyB: Enemy): void {
    if (!enemyA.active || !enemyB.active || enemyA === enemyB) {
      return;
    }

    const aShellMoving = enemyA.isMovingShell();
    const bShellMoving = enemyB.isMovingShell();

    if (!aShellMoving && !bShellMoving) {
      const aWalker = enemyA.isGroundWalker();
      const bWalker = enemyB.isGroundWalker();
      const aShellStationary = enemyA.isKoopaShellStationary();
      const bShellStationary = enemyB.isKoopaShellStationary();

      if (aWalker && bWalker) {
        enemyA.bounceAwayFrom(enemyB.x);
        enemyB.bounceAwayFrom(enemyA.x);
        return;
      }

      if (aWalker && bShellStationary) {
        enemyA.bounceAwayFrom(enemyB.x);
        return;
      }

      if (bWalker && aShellStationary) {
        enemyB.bounceAwayFrom(enemyA.x);
      }
      return;
    }

    if (aShellMoving && bShellMoving) {
      enemyA.reverseShellDirection();
      enemyB.reverseShellDirection();
      return;
    }

    if (aShellMoving) {
      enemyB.defeatByShell();
      this.addScore(100);
      this.spawnScorePopup(enemyB.x, enemyB.y - 18, 100);
      this.audioManager.sfxStomp();
      return;
    }

    enemyA.defeatByShell();
    this.addScore(100);
    this.spawnScorePopup(enemyA.x, enemyA.y - 18, 100);
    this.audioManager.sfxStomp();
  }

  private handleFireballEnemy(fireball: Fireball, enemy: Enemy): void {
    if (!fireball.active || !enemy.active) {
      return;
    }

    fireball.explode();

    if (enemy.isShell()) {
      return;
    }

    enemy.defeatByFireball();
    this.addScore(100);
    this.spawnScorePopup(enemy.x, enemy.y - 18, 100);
    this.audioManager.sfxStomp();
  }

  private triggerDeath(cause: 'enemy' | 'time' | 'pit' = 'enemy'): void {
    if (this.gameplayState !== 'playing') {
      return;
    }

    this.gameplayState = 'dead';
    this.audioManager.stopBgm();
    this.audioManager.sfxDie();
    const body = this.mario.body as Phaser.Physics.Arcade.Body;
    body.enable = false;
    this.mario.setFlipX(false);
    if (this.textures.exists('mario_small_dead')) {
      this.mario.setTexture('mario_small_dead');
    } else {
      this.setMarioAnimTexture('jump');
    }

    const apexY = this.mario.y - 30;
    const fallY = this.worldBottomY + 36;

    this.tweens.add({
      targets: this.mario,
      y: apexY,
      duration: 260,
      ease: 'Quad.Out',
      yoyo: false,
      onComplete: () => {
        this.tweens.add({
          targets: this.mario,
          y: fallY,
          duration: 820,
          ease: 'Quad.In',
          onComplete: () => {
            this.finishLifeLoss(cause);
          },
        });
      },
    });
  }

  private finishLifeLoss(cause: 'enemy' | 'time' | 'pit'): void {
    const nextLives = Math.max(0, this.hudState.lives - 1);
    this.hudState.lives = nextLives;
    const session = this.captureSessionState();
    const startScene = (sceneKey: 'start' | 'game-over' | 'final-screen', payload: SceneFlowPayload): void => {
      this.time.delayedCall(120, () => {
        this.scene.start(sceneKey, payload);
      });
    };
    if (nextLives <= 0) {
      if (isCompetitionActive()) {
        recordCompetitionRoundResult(session.score, 0, false);
        const done = advanceCompetitionRound();
        this.time.delayedCall(120, () => {
          this.scene.start(done ? 'competition-results' : 'competition-ready', {});
        });
        return;
      }
      startScene('final-screen', { session });
      return;
    }
    if (cause === 'time' && !isCompetitionActive()) {
      startScene('game-over', {
        session,
        timeUp: true,
        transition: { delayMs: 130, fadeInMs: 100 },
      });
      return;
    }
    startScene('start', { session });
  }

  private triggerClear(): void {
    if (this.gameplayState !== 'playing') {
      return;
    }

    this.gameplayState = 'clear';
    this.clearPhase = 'slide';
    this.clearOverlayShown = false;
    this.audioManager.stopBgm();
    this.audioManager.sfxFlagpole();
    this.clearWalkDelayFrames = 0;
    this.clearHopFrames = 0;
    this.clearDoneDelayFrames = 0;
    this.clearCelebrationTriggered = false;

    const body = this.mario.body as Phaser.Physics.Arcade.Body;
    const marioBottomAtTouch = body.bottom;
    body.setVelocity(0, 0);
    body.setAcceleration(0, 0);
    body.enable = false;

    this.computeClearGeometry();
    this.clearBonusTickCarry = 0;
    this.clearRestartScheduled = false;
    this.clearTimerSecondsAtPole = Math.max(0, Math.floor(this.hudState.timeRemainingFrames / TARGET_FPS));
    this.clearFireworksCount = getFireworksCountFromTimer(this.clearTimerSecondsAtPole);
    this.mario.x = this.clearPoleX;
    this.mario.y = Math.min(this.mario.y, this.clearGroundY);
    this.mario.setFlipX(false);
    this.setMarioAnimTexture('idle');

    const poleContactHeightTiles = (this.clearGroundY - marioBottomAtTouch) / TILE_SIZE;
    const flagScore = getFlagpoleScoreByHeight(poleContactHeightTiles);
    this.addScore(flagScore);
    this.spawnScorePopup(this.clearPoleX + 8, this.mario.y - 24, flagScore);

    this.spawnClearFlag();
    if (this.clearFlagSprite) {
      this.clearFlagSprite.y = this.clearFlagTopY;
      this.clearFlagSprite.setVisible(true);
    }
  }

  private stepClear(): void {
    if (this.clearPhase === 'slide') {
      const slideSpeedPxPerSec = 52;
      const flagDropSpeedPxPerSec = 72;
      this.mario.x = this.clearPoleX;
      this.mario.y = Math.min(this.clearGroundY, this.mario.y + slideSpeedPxPerSec / TARGET_FPS);
      this.setMarioAnimTexture('pole');
      if (this.clearFlagSprite) {
        const waveKey = Math.floor(this.frameNumber / 6) % 2 === 0 ? 'flag_wave_a' : 'flag_wave_b';
        if (this.textures.exists(waveKey)) {
          this.clearFlagSprite.setTexture(waveKey);
        }
        this.clearFlagSprite.y = Math.min(this.clearFlagTargetY, this.clearFlagSprite.y + flagDropSpeedPxPerSec / TARGET_FPS);
      }

      if (this.mario.y >= this.clearGroundY) {
        this.clearPhase = 'hop';
        this.clearHopFrames = 10;
        this.mario.y = this.clearGroundY;
      }
      return;
    }

    if (this.clearPhase === 'hop') {
      const totalFrames = 10;
      const progress = Phaser.Math.Clamp((totalFrames - this.clearHopFrames + 1) / totalFrames, 0, 1);
      this.mario.x = Phaser.Math.Linear(this.clearPoleX, this.clearPoleX + 10, progress);
      this.mario.y = this.clearGroundY - Math.sin(progress * Math.PI) * 8;
      this.setMarioAnimTexture('jump', 'pole');

      if (this.clearHopFrames > 0) {
        this.clearHopFrames -= 1;
      }

      if (this.clearHopFrames <= 0) {
        this.clearPhase = 'walk';
        this.clearWalkDelayFrames = 6;
        this.mario.x = this.clearPoleX + 10;
        this.mario.y = this.clearGroundY;
        this.setMarioAnimTexture('victory', 'idle');
      }
      return;
    }

    if (this.clearPhase === 'walk') {
      if (this.clearWalkDelayFrames > 0) {
        this.clearWalkDelayFrames -= 1;
        this.setMarioAnimTexture('victory', 'idle');
        return;
      }

      const walkSpeedPxPerSec = 48;
      this.mario.x += walkSpeedPxPerSec / TARGET_FPS;

      const frame = Math.floor(this.time.now / 95) % 2 === 0 ? 'walk_a' : 'walk_b';
      this.setMarioAnimTexture(frame);
      this.mario.setFlipX(false);

      if (this.mario.x >= this.level.castleX + TILE_SIZE * 1.1) {
        this.setMarioAnimTexture('castle_entry', 'walk_a');
      }

      if (this.mario.x >= this.level.castleX + TILE_SIZE * 1.5) {
        this.mario.setVisible(false);
        this.clearPhase = 'bonus';
        this.clearBonusTickCarry = 0;
        this.clearBonusTicksElapsed = 0;
        const tickFrames = Math.max(1, getTimerBonusTickFrames());
        const targetBonusFrames = Math.round(TARGET_FPS * 3.0);
        this.clearBonusTargetTicks = Math.max(1, Math.ceil(targetBonusFrames / tickFrames));
      }
      return;
    }

    if (this.clearPhase === 'bonus') {
      this.clearBonusTickCarry += 1;
      if (this.clearBonusTickCarry < getTimerBonusTickFrames()) {
        return;
      }
      this.clearBonusTickCarry = 0;
      this.clearBonusTicksElapsed += 1;

      const seconds = Math.max(0, Math.floor(this.hudState.timeRemainingFrames / TARGET_FPS));
      if (seconds <= 0) {
        this.clearPhase = 'done';
        this.clearDoneDelayFrames = Math.round(TARGET_FPS * 0.2);
        return;
      }

      const ticksRemainingBudget = Math.max(1, this.clearBonusTargetTicks - this.clearBonusTicksElapsed + 1);
      const secondsToConvert = Math.max(1, Math.ceil(seconds / ticksRemainingBudget));
      const nextSeconds = Math.max(0, seconds - secondsToConvert);
      this.hudState.timeRemainingFrames = nextSeconds * TARGET_FPS;
      this.addScore(50 * secondsToConvert);
      this.audioManager.sfxCoin();
      if (nextSeconds <= 0) {
        this.clearPhase = 'done';
        this.clearDoneDelayFrames = Math.round(TARGET_FPS * 0.2);
      }
      return;
    }

    if (this.clearPhase === 'done') {
      if (this.clearDoneDelayFrames > 0) {
        this.clearDoneDelayFrames -= 1;
        return;
      }

      if (!this.clearOverlayShown) {
        this.clearOverlayShown = true;
        this.audioManager.sfxClear();
        this.add
          .text(this.cameras.main.midPoint.x, this.cameras.main.midPoint.y, 'COURSE CLEAR', {
            color: '#ffffff',
            fontFamily: '"Courier New", monospace',
            fontSize: '14px',
            stroke: '#000000',
            strokeThickness: 3,
          })
          .setScrollFactor(0)
          .setOrigin(0.5)
          .setDepth(2500);
      }

      if (!this.clearRestartScheduled) {
        this.scheduleClearCelebrationAndRestart();
      }
    }
  }

  private tryTriggerFlagpoleClear(): void {
    if (this.gameplayState !== 'playing') {
      return;
    }

    const body = this.mario.body as Phaser.Physics.Arcade.Body;
    const poleCenterX = this.level.flagpole.x * TILE_SIZE + TILE_SIZE * 0.5;
    const nearPoleNow = body.right >= poleCenterX - 10 && body.left <= poleCenterX + 10;
    const crossedPoleFromLeft = body.prev.x + body.width < poleCenterX - 1 && body.right >= poleCenterX - 8;
    const verticalOverlap = body.bottom >= this.clearFlagTopY && body.top <= this.clearGroundY + 2;
    if ((!nearPoleNow && !crossedPoleFromLeft) || !verticalOverlap) {
      return;
    }

    if (body.velocity.x < -4) {
      return;
    }

    // Prevent triggering when Mario approaches the pole from the right side.
    if (body.center.x > poleCenterX + 12) {
      return;
    }

    this.triggerClear();
  }

  private computeClearGeometry(): void {
    this.clearPoleX = this.level.flagpole.x * TILE_SIZE + 5;
    this.clearGroundY = WORLD_Y_OFFSET + this.level.flagpole.groundY * TILE_SIZE;
    this.clearFlagTopY = WORLD_Y_OFFSET + (this.level.flagpole.groundY - this.level.flagpole.poleHeight) * TILE_SIZE;
    this.clearFlagTargetY = WORLD_Y_OFFSET + (this.level.flagpole.groundY - 1) * TILE_SIZE;
  }

  private scheduleClearCelebrationAndRestart(): void {
    if (this.clearCelebrationTriggered) {
      return;
    }
    this.clearCelebrationTriggered = true;
    this.clearRestartScheduled = true;

    const fireworks = this.clearFireworksCount;
    const baseDelayMs = 700;
    let finishDelayMs = baseDelayMs;
    for (let i = 0; i < fireworks; i += 1) {
      const delay = 140 + i * 120;
      this.time.delayedCall(delay, () => {
        const burstY = WORLD_Y_OFFSET + 60 + (i % 2) * 22;
        const burstX = this.level.castleX - 36 + i * 8;
        this.spawnFireworkBurst(burstX, burstY);
        this.audioManager.sfxFirework();
      });
      finishDelayMs = Math.max(finishDelayMs, delay + 480);
    }

    this.time.delayedCall(finishDelayMs, () => {
      this.cameras.main.fadeOut(260, 0, 0, 0);
      this.time.delayedCall(280, () => {
        const session = this.captureSessionState();
        if (isCompetitionActive()) {
          recordCompetitionRoundResult(session.score, session.lives, true);
          const done = advanceCompetitionRound();
          this.scene.start(done ? 'competition-results' : 'competition-ready', {});
        } else {
          this.scene.start('final-screen', { session });
        }
      });
    });
  }

  private spawnFireworkBurst(x: number, y: number): void {
    const colors = [0xfff2a8, 0xffd159, 0xffe8cc];
    const count = 12;
    for (let i = 0; i < count; i += 1) {
      const angle = (Math.PI * 2 * i) / count;
      const distance = 10 + (i % 3) * 4;
      const px = x + Math.cos(angle) * 2;
      const py = y + Math.sin(angle) * 2;
      const particle = this.add.rectangle(px, py, 2, 2, colors[i % colors.length]).setDepth(2600);
      this.tweens.add({
        targets: particle,
        x: x + Math.cos(angle) * distance,
        y: y + Math.sin(angle) * distance,
        alpha: 0,
        duration: 380,
        ease: 'Quad.Out',
        onComplete: () => particle.destroy(),
      });
    }
  }

  private addScore(points: number): void {
    if (!Number.isFinite(points) || points <= 0) {
      return;
    }
    this.hudState.score += Math.floor(points);
  }

  private addCoins(coins: number): void {
    if (!Number.isFinite(coins) || coins <= 0) {
      return;
    }

    this.hudState.coins += Math.floor(coins);
    this.normalizeCoinBalance(true);
  }

  private normalizeCoinBalance(playOneUpSfx = false): void {
    while (this.hudState.coins >= 100) {
      this.hudState.coins -= 100;
      this.hudState.lives += 1;
      if (playOneUpSfx) {
        this.audioManager.sfxOneUp();
      }
    }
  }

  private spawnScorePopup(worldX: number, worldY: number, score: number): void {
    if (!Number.isFinite(score) || score <= 0) {
      return;
    }

    const roundedScore = Math.floor(score);
    const spriteKey = `score_${roundedScore}`;
    const popup = this.textures.exists(spriteKey)
      ? this.add.image(worldX, worldY, spriteKey).setOrigin(0.5, 1).setDepth(2600)
      : this.add
          .text(worldX, worldY, `${roundedScore}`, {
            color: '#ffffff',
            fontFamily: '"Courier New", monospace',
            fontSize: '10px',
            stroke: '#000000',
            strokeThickness: 2,
          })
          .setOrigin(0.5, 1)
          .setDepth(2600);

    this.tweens.add({
      targets: popup,
      y: popup.y - 14,
      alpha: 0,
      duration: 520,
      ease: 'Quad.Out',
      onComplete: () => popup.destroy(),
    });
  }

  private spawnCoinPop(worldX: number, worldY: number): void {
    const frames = ['coin_pop_a', 'coin_pop_b', 'coin_pop_c'].filter((key) => this.textures.exists(key));
    if (frames.length === 0) {
      return;
    }

    const pop = this.add.image(worldX, worldY - 8, frames[0]).setOrigin(0.5, 1).setDepth(2550);
    const frameDuration = 55;
    frames.forEach((key, index) => {
      this.time.delayedCall(frameDuration * index, () => {
        if (!pop.active) {
          return;
        }
        pop.setTexture(key);
        pop.y -= 3;
      });
    });

    this.time.delayedCall(frameDuration * frames.length + 30, () => {
      if (pop.active) {
        pop.destroy();
      }
      this.spawnSparkleBurst(worldX, worldY - 20);
    });
  }

  private spawnSparkleBurst(worldX: number, worldY: number): void {
    const frames = ['sparkle_a', 'sparkle_b', 'sparkle_c'].filter((key) => this.textures.exists(key));
    if (frames.length === 0) {
      return;
    }
    const sparkle = this.add.image(worldX, worldY, frames[0]).setOrigin(0.5, 0.5).setDepth(2550);
    const frameDuration = 45;
    frames.forEach((key, index) => {
      this.time.delayedCall(frameDuration * index, () => {
        if (sparkle.active) {
          sparkle.setTexture(key);
        }
      });
    });
    this.time.delayedCall(frameDuration * frames.length + 10, () => {
      if (sparkle.active) {
        sparkle.destroy();
      }
    });
  }

  private spawnClearFlag(): void {
    if (this.clearFlagSprite) {
      this.clearFlagSprite.destroy();
      this.clearFlagSprite = null;
    }

    const textureKey = this.ensureClearFlagTexture();
    if (!textureKey) {
      return;
    }

    this.clearFlagSprite = this.add
      .image(this.level.flagpole.x * TILE_SIZE + TILE_SIZE, this.clearFlagTopY, textureKey)
      .setOrigin(0, 0)
      .setDepth(40);
  }

  private ensureClearFlagTexture(): string | null {
    if (this.textures.exists('flag_wave_a')) {
      return 'flag_wave_a';
    }

    const key = 'flag_clear_runtime';
    if (this.textures.exists(key)) {
      return key;
    }
    if (!this.textures.exists(this.tilemapTextureKey)) {
      return null;
    }

    const sourceTexture = this.textures.get(this.tilemapTextureKey);
    const sourceImage = sourceTexture.getSourceImage() as HTMLImageElement | HTMLCanvasElement | undefined;
    if (!sourceImage) {
      return null;
    }

    const canvas = this.textures.createCanvas(key, TILE_SIZE, TILE_SIZE);
    if (!canvas) {
      return null;
    }

    const ctx = canvas.getContext();
    ctx.clearRect(0, 0, TILE_SIZE, TILE_SIZE);
    ctx.drawImage(
      sourceImage,
      TILE_FLAG * TILE_SIZE,
      0,
      TILE_SIZE,
      TILE_SIZE,
      0,
      0,
      TILE_SIZE,
      TILE_SIZE,
    );
    canvas.refresh();
    return key;
  }

  private centerCameraOnMario(): void {
    const camera = this.cameras.main;
    const maxScrollX = this.level.widthTiles * TILE_SIZE - camera.width;
    this.cameraLockedScrollX = computeCameraScrollX(
      camera.scrollX,
      this.mario.x,
      CAMERA_SCROLL_TRIGGER_X,
      maxScrollX,
    );
    camera.scrollX = Math.floor(this.cameraLockedScrollX);
    camera.scrollY = 0;
  }

  private updateDecorParallax(): void {
    const scrollX = this.cameras.main.scrollX;
    if (this.decorClouds) {
      this.decorClouds.tilePositionX = 120 + scrollX * 0.22;
    }
    if (this.decorHillsB) {
      this.decorHillsB.tilePositionX = scrollX * 0.34;
    }
  }

  private stabilizeMarioGroundContact(): void {
    const body = this.mario.body as Phaser.Physics.Arcade.Body;
    const grounded = body.blocked.down || body.touching.down;
    if (!grounded) {
      return;
    }

    // Avoid visible subpixel "floating" on tile tops.
    if (Math.abs(this.mario.y - Math.round(this.mario.y)) < 0.08) {
      this.mario.y = Math.round(this.mario.y);
    }
  }

  private snapMarioToGroundIfNear(maxSnapDistance = 6): void {
    const body = this.mario.body as Phaser.Physics.Arcade.Body;
    if (body.blocked.down || body.touching.down || body.velocity.y < 0) {
      return;
    }

    const probeXs = [body.left + 2, body.center.x, body.right - 2];
    const candidateSurfaceY = probeXs
      .map((x) => this.findSurfaceYAtWorldX(x))
      .filter((surfaceY): surfaceY is number => surfaceY !== null)
      .find((surfaceY) => surfaceY >= this.mario.y - 1 && surfaceY <= this.mario.y + maxSnapDistance);

    if (candidateSurfaceY === undefined) {
      return;
    }

    this.mario.setY(candidateSurfaceY);
    body.setVelocityY(0);
  }

  private applyGuideCheckpoint(mode: 'youtube' | 'world11-gameover' | 'mar10-start', checkpoint: number): void {
    const guide =
      mode === 'youtube'
        ? getYoutubeGuideCheckpoint(checkpoint)
        : mode === 'world11-gameover'
          ? getWorld11GameoverGuideCheckpoint(checkpoint)
          : getMar10StartGuideCheckpoint(checkpoint);
    if (!guide) {
      return;
    }

    this.clearGuideSceneOverrideObjects();

    if (guide.form === 'super' || guide.form === 'fire' || guide.form === 'small') {
      this.mario.forceForm(guide.form);
    }

    this.mario.setPosition(guide.marioX, guide.marioY);
    this.mario.setFlipX(Boolean(guide.flipX));
    this.setMarioAnimTexture('idle');
    this.mario.setAlpha(1);
    this.mario.setVisible(true);

    const body = this.mario.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(0, 0);
    body.setAcceleration(0, 0);

    this.hudState.score = guide.score;
    this.hudState.coins = guide.coins;
    // In guided capture mode we want HUD seconds to match the checkpoint value exactly.
    this.hudState.timeRemainingFrames = Math.max(0, Math.ceil(guide.timeSeconds * TARGET_FPS));

    const maxScrollX = this.level.widthTiles * TILE_SIZE - this.cameras.main.width;
    this.cameraLockedScrollX = Phaser.Math.Clamp(guide.cameraX, 0, maxScrollX);
    this.cameras.main.scrollX = Math.floor(this.cameraLockedScrollX);
    this.cameras.main.scrollY = 0;
    this.applyGuideSceneOverride(guide.scene);

    this.captureFrozen = true;
  }

  private clearGuideSceneOverrideObjects(): void {
    this.suppressHudRender = false;
    while (this.guideOverlayObjects.length > 0) {
      const object = this.guideOverlayObjects.pop();
      if (object && object.active) {
        object.destroy();
      }
    }
  }

  private applyGuideSceneOverride(sceneOverride?: YoutubeGuideSceneOverride): void {
    if (this.solidLayerRef) {
      this.solidLayerRef.setVisible(this.guideSolidLayerWasVisible);
    }

    if (!sceneOverride) {
      return;
    }

    if (sceneOverride.referenceFrameKey) {
      this.suppressHudRender = true;
      const frameKey = this.textures.exists(sceneOverride.referenceFrameKey)
        ? sceneOverride.referenceFrameKey
        : '__MISSING';
      const frame = this.add
        .image(0, 0, frameKey)
        .setOrigin(0, 0)
        .setScrollFactor(0)
        .setDepth(10000)
        .setAlpha(1);
      this.guideOverlayObjects.push(frame);
      this.mario.setVisible(false);
      return;
    }

    if (sceneOverride.hideSolidLayer && this.solidLayerRef) {
      this.guideSolidLayerWasVisible = this.solidLayerRef.visible;
      this.solidLayerRef.setVisible(false);
    }

    if (sceneOverride.drawGroundStrip && this.textures.exists('tile_ground_top')) {
      const ground = this.add
        .tileSprite(0, 208, INTERNAL_WIDTH, TILE_SIZE, 'tile_ground_top')
        .setOrigin(0, 0)
        .setScrollFactor(0)
        .setDepth(2350);
      this.guideOverlayObjects.push(ground);
    }

    if (sceneOverride.tileOverrides && this.solidLayerRef) {
      sceneOverride.tileOverrides.forEach((override) => {
        if (
          override.x < 0 ||
          override.y < 0 ||
          override.x >= this.level.widthTiles ||
          override.y >= this.level.heightTiles
        ) {
          return;
        }
        this.level.solidLayer[override.y][override.x] = override.tile;
        this.solidLayerRef?.putTileAt(override.tile, override.x, override.y, true);
      });
    }

    if (sceneOverride.hideMario) {
      this.mario.setVisible(false);
    } else {
      this.mario.setVisible(true);
    }

    if (sceneOverride.marioTextureSuffix && !sceneOverride.hideMario) {
      this.setMarioAnimTexture(sceneOverride.marioTextureSuffix);
    }

    sceneOverride.spriteOverlays?.forEach((overlay) => {
      if (!this.textures.exists(overlay.key)) {
        return;
      }
      const object = this.add
        .image(overlay.screenX, overlay.screenY, overlay.key)
        .setOrigin(overlay.originX ?? 0.5, overlay.originY ?? 1)
        .setScrollFactor(0)
        .setDepth(overlay.depth ?? 2450)
        .setAlpha(overlay.alpha ?? 1);
      if (overlay.flipX) {
        object.setFlipX(true);
      }
      this.guideOverlayObjects.push(object);
    });
  }

  private getMarioAnimPrefix(): 'mario_small' | 'mario_super' | 'mario_fire' {
    const form = this.mario.getForm();
    if (form === 'fire') {
      return 'mario_fire';
    }
    if (form === 'super') {
      return 'mario_super';
    }
    return 'mario_small';
  }

  private setMarioAnimTexture(suffix: string, fallbackSuffix = 'idle'): void {
    const prefix = this.getMarioAnimPrefix();
    const key = `${prefix}_${suffix}`;
    if (this.textures.exists(key)) {
      this.mario.setTexture(key);
      return;
    }

    const fallbackKey = `${prefix}_${fallbackSuffix}`;
    if (this.textures.exists(fallbackKey)) {
      this.mario.setTexture(fallbackKey);
    }
  }

  private addDecorativeLayers(_worldPixelWidth: number): void {
    const layerWidth = Math.max(INTERNAL_WIDTH, this.cameras.main.width);

    if (this.textures.exists('decor_clouds_strip')) {
      this.decorClouds = this.add
        .tileSprite(0, 0, layerWidth, 224, 'decor_clouds_strip')
        .setOrigin(0, 0)
        .setDepth(-90)
        .setScrollFactor(0)
        .setAlpha(1);
      this.decorClouds.tilePositionX = 120;
      this.decorClouds.tilePositionY = -16;
    }

    const hillsTextureKey = this.textures.exists('decor_hills_strip_a')
      ? 'decor_hills_strip_a'
      : this.textures.exists('decor_hills_strip_b')
      ? 'decor_hills_strip_b'
      : null;
    if (hillsTextureKey) {
      this.decorHillsB = this.add
        .tileSprite(0, 0, layerWidth, 224, hillsTextureKey)
        .setOrigin(0, 0)
        .setDepth(-60)
        .setScrollFactor(0)
        .setAlpha(1);
      this.decorHillsB.tilePositionX = 0;
      this.decorHillsB.tilePositionY = -16;
    }

    // Keep the top HUD band clean (no wrapped cloud pixels).
    this.add
      .rectangle(layerWidth * 0.5, 12, layerWidth, 24, 0x5d94fb)
      .setScrollFactor(0)
      .setDepth(-40);
  }

  private startQuestionBlockAnimation(): void {
    const hasBlockFrames = this.textures.exists('block_question_a') && this.textures.exists('block_question_b') && this.textures.exists('block_question_c');
    if (!this.textures.exists(this.tilemapTextureKey) || (!hasBlockFrames && !this.textures.exists('smas_items_blocks'))) {
      return;
    }

    const texture = this.textures.get(this.tilemapTextureKey) as unknown as { getContext?: () => CanvasRenderingContext2D };
    if (typeof texture.getContext !== 'function') {
      return;
    }

    this.applyQuestionFrame(0);
    this.time.addEvent({
      delay: 150,
      loop: true,
      callback: () => {
        this.questionAnimFrame = (this.questionAnimFrame + 1) % 3;
        this.applyQuestionFrame(this.questionAnimFrame);
      },
    });
  }

  private applyQuestionFrame(frame: number): void {
    const runtimeTexture = this.textures.get(this.tilemapTextureKey) as Phaser.Textures.CanvasTexture;
    if (!runtimeTexture || typeof runtimeTexture.getContext !== 'function') {
      return;
    }

    const ctx = runtimeTexture.getContext();
    const dstX = TILE_QUESTION * TILE_SIZE;
    ctx.clearRect(dstX, 0, TILE_SIZE, TILE_SIZE);

    const questionKeys = ['block_question_a', 'block_question_b', 'block_question_c'] as const;
    const questionKey = questionKeys[frame] ?? questionKeys[0];
    if (this.textures.exists(questionKey)) {
      const blockTexture = this.textures.get(questionKey);
      const blockImage = blockTexture.getSourceImage() as HTMLImageElement | HTMLCanvasElement | undefined;
      if (blockImage) {
        ctx.drawImage(blockImage, 0, 0, TILE_SIZE, TILE_SIZE, dstX, 0, TILE_SIZE, TILE_SIZE);
        runtimeTexture.refresh();
        return;
      }
    }

    const itemsTexture = this.textures.get('smas_items_blocks');
    const itemsImage = itemsTexture.getSourceImage() as HTMLImageElement | HTMLCanvasElement | undefined;
    if (!itemsImage) {
      return;
    }
    const srcX = 1 + frame * TILE_SIZE;
    const srcY = 96;
    ctx.drawImage(itemsImage, srcX, srcY, TILE_SIZE, TILE_SIZE, dstX, 0, TILE_SIZE, TILE_SIZE);
    this.remapBlockBlueShadesInTile(ctx, dstX, 0, TILE_SIZE, TILE_SIZE);
    runtimeTexture.refresh();
  }

  private remapBlockBlueShadesInTile(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
  ): void {
    const imageData = ctx.getImageData(x, y, w, h);
    const bytes = imageData.data;
    for (let i = 0; i < bytes.length; i += 4) {
      const r = bytes[i];
      const g = bytes[i + 1];
      const b = bytes[i + 2];
      if (r === 0 && g === 71 && b === 168) {
        bytes[i] = 107;
        bytes[i + 1] = 66;
        bytes[i + 2] = 8;
        continue;
      }
      if (r === 0 && g === 108 && b === 248) {
        bytes[i] = 156;
        bytes[i + 1] = 123;
        bytes[i + 2] = 24;
      }
    }
    ctx.putImageData(imageData, x, y);
  }

  private resolveTilemapTextureKey(): string {
    const runtimeKey = this.textures.exists('tiles_runtime_individual')
      ? 'tiles_runtime_individual'
      : this.textures.exists('tiles_runtime')
      ? 'tiles_runtime'
      : 'tiles_fallback';
    if (runtimeKey === 'tiles_fallback') {
      return runtimeKey;
    }

    const existing = this.textures.get(runtimeKey) as unknown as { getContext?: () => CanvasRenderingContext2D; getSourceImage: () => unknown };
    if (typeof existing.getContext === 'function') {
      return runtimeKey;
    }

    const sourceImage = existing.getSourceImage() as HTMLImageElement | HTMLCanvasElement | undefined;
    if (!sourceImage) {
      return runtimeKey;
    }

    const mutableKey = `${runtimeKey}_mutable`;
    if (this.textures.exists(mutableKey)) {
      return mutableKey;
    }

    const width = (sourceImage as HTMLImageElement).naturalWidth ?? (sourceImage as HTMLCanvasElement).width;
    const height = (sourceImage as HTMLImageElement).naturalHeight ?? (sourceImage as HTMLCanvasElement).height;
    const canvasTexture = this.textures.createCanvas(mutableKey, width, height);
    if (!canvasTexture) {
      return runtimeKey;
    }

    const ctx = canvasTexture.getContext();
    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(sourceImage, 0, 0, width, height, 0, 0, width, height);
    canvasTexture.refresh();

    return mutableKey;
  }
}
