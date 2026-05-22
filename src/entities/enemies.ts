import Phaser from 'phaser';
import { CAMERA_DESPAWN_MARGIN } from '../core/constants';
import type { EnemySpawn } from '../core/contracts';

const GOOMBA_SPEED = 36;
const KOOPA_SPEED = 46;
const SPINY_SPEED = 40;
const SPINY_EGG_THROW_SPEED_X = 34;
const SPINY_EGG_THROW_SPEED_Y = -176;
const KOOPA_SHELL_SPEED = 168;
const LAKITU_THROW_INTERVAL_MS = 3600;
const LAKITU_THROW_JITTER_MS = 110;
const LAKITU_THROW_WINDUP_MS = 240;
const LAKITU_MARIO_AHEAD_X = 72;
const SPAWN_BACKTRACK_MARGIN = 32;
const LAKITU_MAX_ACTIVE_SPINIES = 4;
const KOOPA_WALK_BODY_HEIGHT = 22;
const GOOMBA_BODY_HEIGHT = 14;
const SHELL_BODY_HEIGHT = 14;
const SPINY_BODY_HEIGHT = 14;
interface LedgeTurnProfile {
  footInsetPx: number;
  nearAheadPx: number;
  farAheadPx: number;
  nudgePx: number;
}

const GOOMBA_LEDGE_PROFILE: LedgeTurnProfile = {
  footInsetPx: 1,
  nearAheadPx: 2,
  farAheadPx: 8,
  nudgePx: 1.5,
};

const KOOPA_LEDGE_PROFILE: LedgeTurnProfile = {
  footInsetPx: 1,
  nearAheadPx: 2,
  farAheadPx: 9,
  nudgePx: 1.75,
};

const SPINY_LEDGE_PROFILE: LedgeTurnProfile = {
  footInsetPx: 1,
  nearAheadPx: 2,
  farAheadPx: 8,
  nudgePx: 1.5,
};

const SHELL_LEDGE_PROFILE: LedgeTurnProfile = {
  footInsetPx: 1,
  nearAheadPx: 2,
  farAheadPx: 10,
  nudgePx: 2,
};

type EnemyState = 'walk' | 'shell' | 'dead' | 'egg' | 'lakitu';

interface EnemyRuntimeSpawn extends EnemySpawn {
  initialState?: 'walk' | 'egg';
}

export class Enemy extends Phaser.Physics.Arcade.Sprite {
  private readonly kind: EnemySpawn['kind'];
  private winged = false;
  private direction: -1 | 1;
  private readonly walkSpeed: number;
  private enemyState: EnemyState = 'walk';
  private shellVelocityX = 0;
  private nextWingHopAtMs = 0;
  private nextLakituThrowAtMs = 0;
  private wallStallFrames = 0;
  private pipeDropFrames = 0;
  private readonly exitMarioX?: number;
  private readonly spriteSet: 'default' | 'ram';
  private ramVisual: Phaser.GameObjects.Image | null = null;
  public readonly spawnId: string;

  public constructor(scene: Phaser.Scene, spawn: EnemyRuntimeSpawn, worldOffsetY: number) {
    super(scene, spawn.x, spawn.y + worldOffsetY, resolveInitialTexture(scene, spawn));
    scene.add.existing(this);
    this.setOrigin(0.5, 1);

    this.kind = spawn.kind;
    this.spawnId = spawn.id;
    this.direction = spawn.direction;
    this.walkSpeed = resolveWalkSpeed(spawn.kind);
    this.enemyState = spawn.kind === 'lakitu' ? 'lakitu' : spawn.initialState ?? 'walk';
    this.winged = spawn.kind === 'koopa' && spawn.winged === true;
    this.exitMarioX = spawn.exitMarioX;
    this.spriteSet = spawn.spriteSet ?? 'default';

    if (this.kind === 'lakitu') {
      this.nextLakituThrowAtMs = scene.time.now + 2200;
    }

    if (this.kind === 'spiny') {
      if (this.spriteSet === 'ram') {
        this.setVisible(false);
        this.ramVisual = scene.add.image(this.x, this.y, this.getRamTextureKey());
        this.ramVisual.setOrigin(0.5, 1);
        this.ramVisual.setDisplaySize(24, 24);
      }
      if (this.enemyState === 'egg') {
        this.setTexture(this.getPhysicsSpinyTextureKey(true));
      } else {
        this.setTexture(this.getPhysicsSpinyTextureKey(false));
      }
    }
  }

  // PhysicsGroup.createCallbackHandler resets all body properties (including gravity) to group
  // defaults when group.add() is called. This method must be called by EnemyManager right after
  // group.add() to apply the correct per-kind physics configuration.
  public applyBodyAfterGroupAdd(): void {
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setCollideWorldBounds(false);

    if (this.kind === 'lakitu') {
      body.setSize(14, 16, true);
      body.setOffset(1, 6);
      body.setAllowGravity(false);
      body.setImmovable(true);
      body.setVelocity(0, 0);
      return;
    }

    body.setGravityY(1080);
    body.setAllowGravity(true);

    if (this.kind === 'koopa') {
      body.setSize(14, KOOPA_WALK_BODY_HEIGHT, true);
      body.setOffset(1, 2);
      body.setVelocityX(this.direction * this.walkSpeed);
      return;
    }

    if (this.kind === 'spiny') {
      body.setSize(14, SPINY_BODY_HEIGHT, true);
      body.setOffset(1, 2);
      if (this.enemyState === 'egg') {
        body.setVelocity(0, 0);
      } else {
        body.setVelocityX(this.direction * this.walkSpeed);
      }
      this.syncRamVisual(body);
      return;
    }

    body.setSize(14, GOOMBA_BODY_HEIGHT, true);
    body.setOffset(1, 2);
    body.setVelocityX(this.direction * this.walkSpeed);
  }

  public step(nowMs: number, camera: Phaser.Cameras.Scene2D.Camera, marioX: number): void {
    const body = this.body as Phaser.Physics.Arcade.Body;
    if (this.enemyState === 'dead') {
      this.syncRamVisual(body);
      return;
    }

    if (this.kind === 'lakitu') {
      this.stepLakitu(nowMs, camera, marioX, body);
      this.syncRamVisual(body);
      return;
    }

    if (this.kind === 'spiny' && this.enemyState === 'egg') {
      this.stepSpinyEgg(nowMs, body);
      this.syncRamVisual(body);
      return;
    }

    if (this.kind === 'koopa' && this.enemyState === 'shell') {
      this.stepKoopaShell(nowMs, body);
      this.syncRamVisual(body);
      return;
    }

    this.stepWalkingEnemy(nowMs, body);
    this.syncRamVisual(body);
  }

  public getKind(): EnemySpawn['kind'] {
    return this.kind;
  }

  public isLakitu(): boolean {
    return this.kind === 'lakitu' && this.enemyState === 'lakitu';
  }

  public isSpinyEgg(): boolean {
    return this.kind === 'spiny' && this.enemyState === 'egg';
  }

  public canThrowSpiny(nowMs: number): boolean {
    return this.isLakitu() && nowMs >= this.nextLakituThrowAtMs;
  }

  public markSpinyThrown(nowMs: number): void {
    const jitter = this.computeThrowJitter();
    this.nextLakituThrowAtMs = nowMs + LAKITU_THROW_INTERVAL_MS + jitter;
  }

  public getSpinyThrowParams(marioX: number): { x: number; y: number; direction: -1 | 1 } {
    const direction: -1 | 1 = marioX < this.x ? -1 : 1;
    return {
      x: this.x + direction * 4,
      y: this.y - 8,
      direction,
    };
  }

  public squash(stompDirection: -1 | 1 = 1): void {
    if (this.kind === 'spiny') {
      this.launchDefeat(resolveDefeatTexture(this.scene, this.kind, 'shell', this.spriteSet));
      return;
    }

    if (this.kind === 'goomba') {
      this.flattenAndDespawn();
      return;
    }

    if (this.kind === 'lakitu') {
      const textureKey = this.scene.textures.exists('lakitu_throw_a') ? 'lakitu_throw_a' : 'lakitu_cloud_a';
      this.launchDefeat(textureKey);
      return;
    }

    const body = this.body as Phaser.Physics.Arcade.Body;
    if (this.enemyState === 'walk') {
      this.enemyState = 'shell';
      this.winged = false;
      this.shellVelocityX = 0;
      this.setTexture(this.scene.textures.exists('koopa_shell') ? 'koopa_shell' : 'koopa_walk_a');
      this.setFlipX(false);
      body.setSize(14, SHELL_BODY_HEIGHT, true);
      body.setOffset(1, 2);
      body.setVelocity(0, 0);
      return;
    }

    if (this.enemyState === 'shell' && this.shellVelocityX === 0) {
      this.shellVelocityX = stompDirection * KOOPA_SHELL_SPEED;
    } else {
      this.shellVelocityX = 0;
    }
    body.setVelocityX(this.shellVelocityX);
  }

  public isStompable(): boolean {
    return true;
  }

  public isShell(): boolean {
    return this.kind === 'koopa' && this.enemyState === 'shell';
  }

  public isKoopaShellStationary(): boolean {
    return this.isShell() && this.shellVelocityX === 0;
  }

  public isMovingShell(): boolean {
    return this.isShell() && this.shellVelocityX !== 0;
  }

  public isGroundWalker(): boolean {
    return this.enemyState === 'walk' && this.kind !== 'lakitu';
  }

  public bounceAwayFrom(otherX: number): void {
    if (!this.isGroundWalker()) {
      return;
    }

    if (this.x < otherX - 0.5) {
      this.direction = -1;
    } else if (this.x > otherX + 0.5) {
      this.direction = 1;
    } else {
      this.direction = this.direction > 0 ? -1 : 1;
    }

    const body = this.body as Phaser.Physics.Arcade.Body;
    this.wallStallFrames = 0;
    this.x += this.direction * Math.max(4, body.width * 0.45);
    body.setVelocityX(this.direction * this.walkSpeed);
  }

  public kickShell(direction: -1 | 1): void {
    if (this.kind !== 'koopa' || this.enemyState !== 'shell') {
      return;
    }
    this.shellVelocityX = direction * KOOPA_SHELL_SPEED;
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setVelocityX(this.shellVelocityX);
  }

  public reverseShellDirection(): void {
    if (!this.isMovingShell()) {
      return;
    }
    this.shellVelocityX = this.shellVelocityX > 0 ? -KOOPA_SHELL_SPEED : KOOPA_SHELL_SPEED;
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setVelocityX(this.shellVelocityX);
  }

  public defeatByShell(): void {
    if (this.enemyState === 'dead') {
      return;
    }
    this.launchDefeat(resolveDefeatTexture(this.scene, this.kind, 'shell', this.spriteSet));
  }

  public defeatByFireball(): void {
    if (this.enemyState === 'dead') {
      return;
    }
    this.launchDefeat(resolveDefeatTexture(this.scene, this.kind, 'fire', this.spriteSet));
  }

  public isOutOfCamera(camera: Phaser.Cameras.Scene2D.Camera): boolean {
    if (this.kind === 'lakitu') {
      return (
        this.x < camera.worldView.left - CAMERA_DESPAWN_MARGIN * 2 ||
        this.x > camera.worldView.right + CAMERA_DESPAWN_MARGIN * 2
      );
    }
    return this.x < camera.worldView.left - CAMERA_DESPAWN_MARGIN || this.y > camera.worldView.bottom + CAMERA_DESPAWN_MARGIN;
  }

  private stepWalkingEnemy(nowMs: number, body: Phaser.Physics.Arcade.Body): void {
    const ledgeProfile = this.getLedgeTurnProfile(false);
    const grounded = body.blocked.down || body.touching.down;
    const justLeftGround = !grounded && body.wasTouching.down;
    const pipeTopBounds = this.getPipeTopBounds(body);

    if (this.pipeDropFrames > 0 && !grounded) {
      this.pipeDropFrames -= 1;
      body.setVelocityX(this.direction * this.walkSpeed);
      this.applyWalkTexture(nowMs, grounded, body);
      this.setFlipX(this.direction > 0);
      return;
    }

    if (grounded && pipeTopBounds) {
      const atExitEdge =
        this.direction > 0 ? body.right >= pipeTopBounds.right - 1.5 : body.left <= pipeTopBounds.left + 1.5;
      if (atExitEdge) {
        this.x += this.direction * 2;
        body.setVelocityX(this.direction * this.walkSpeed);
        body.setVelocityY(Math.max(body.velocity.y, 8));
        this.pipeDropFrames = 3;
      } else {
        body.setVelocityX(this.direction * this.walkSpeed);
      }
      this.applyWalkTexture(nowMs, grounded, body);
      this.setFlipX(this.direction > 0);
      return;
    }

    if (
      (grounded || justLeftGround) &&
      (!this.hasFloorUnderLeadingFoot(body, this.direction, ledgeProfile) ||
        !this.hasFloorAhead(body, this.direction, ledgeProfile))
    ) {
      this.reverseAtLedge(body, ledgeProfile);
      if (justLeftGround && body.velocity.y > 0) {
        body.setVelocityY(0);
      }
    }

    const blockedLeft = body.blocked.left;
    const blockedRight = body.blocked.right;
    if (blockedLeft || blockedRight) {
      const blockedInTravelDirection =
        (this.direction > 0 && blockedRight) || (this.direction < 0 && blockedLeft);

      if (blockedInTravelDirection) {
        this.reverseAtLedge(body, ledgeProfile);
      } else {
        this.direction = blockedLeft ? 1 : -1;
      }
    }

    // Failsafe: if the enemy remains side-blocked for several frames, force a turn.
    if ((blockedLeft || blockedRight) && Math.abs(body.velocity.x) <= 2) {
      this.wallStallFrames += 1;
      if (this.wallStallFrames >= 2) {
        this.reverseAtLedge(body, ledgeProfile);
        this.wallStallFrames = 0;
      }
    } else {
      this.wallStallFrames = 0;
    }

    body.setVelocityX(this.direction * this.walkSpeed);
    this.applyWalkTexture(nowMs, grounded, body);
    this.setFlipX(this.direction > 0);
  }

  private applyWalkTexture(nowMs: number, grounded: boolean, body: Phaser.Physics.Arcade.Body): void {
    const frame = Math.floor(nowMs / 130) % 2 === 0 ? 'walk_a' : 'walk_b';

    if (this.kind === 'goomba') {
      this.setTexture(`goomba_${frame}`);
    } else if (this.kind === 'koopa') {
      const koopaWalkKey = this.winged ? `koopa_wing_${frame === 'walk_a' ? 'a' : 'b'}` : `koopa_${frame}`;
      const fallbackKey = `koopa_${frame}`;
      this.setTexture(this.scene.textures.exists(koopaWalkKey) ? koopaWalkKey : fallbackKey);

      if (this.winged && grounded && nowMs >= this.nextWingHopAtMs) {
        body.setVelocityY(-250);
        this.nextWingHopAtMs = nowMs + 740;
      }
    } else {
      this.setTexture(this.getPhysicsSpinyTextureKey(false, frame));
    }
    this.syncRamVisual(body);
  }

  private stepSpinyEgg(_nowMs: number, body: Phaser.Physics.Arcade.Body): void {
    body.setAllowGravity(true);
    body.setGravityY(1080);
    if (body.blocked.left || body.blocked.right) {
      this.direction = body.blocked.left ? 1 : -1;
    }
    this.setTexture(this.getPhysicsSpinyTextureKey(true));
    this.setFlipX(false);
    this.syncRamVisual(body);

    const grounded = body.blocked.down || body.touching.down;
    if (!grounded) {
      return;
    }
    const landingDirection: -1 | 1 = body.velocity.x < 0 ? -1 : 1;
    this.direction = landingDirection;
    this.enemyState = 'walk';
    body.setVelocityX(landingDirection * SPINY_SPEED);
  }

  private stepKoopaShell(nowMs: number, body: Phaser.Physics.Arcade.Body): void {
    if (this.shellVelocityX !== 0 && (body.blocked.left || body.blocked.right)) {
      this.shellVelocityX = body.blocked.left ? KOOPA_SHELL_SPEED : -KOOPA_SHELL_SPEED;
    }
    body.setVelocityX(this.shellVelocityX);
    if (this.shellVelocityX !== 0) {
      const spinKey = Math.floor(nowMs / 90) % 2 === 0 ? 'koopa_shell_spin_a' : 'koopa_shell_spin_b';
      this.setTexture(this.scene.textures.exists(spinKey) ? spinKey : 'koopa_shell');
    } else {
      this.setTexture('koopa_shell');
    }
    this.setFlipX(false);
  }

  private getPipeTopBounds(body: Phaser.Physics.Arcade.Body): { left: number; right: number } | null {
    const sceneAny = this.scene as Phaser.Scene & {
      getPipeTopBoundsAtPixel?: (x: number, y: number) => { left: number; right: number } | null;
    };
    if (typeof sceneAny.getPipeTopBoundsAtPixel !== 'function') {
      return null;
    }
    return sceneAny.getPipeTopBoundsAtPixel(body.center.x, body.bottom + 2);
  }

  private syncRamVisual(body: Phaser.Physics.Arcade.Body): void {
    if (!this.ramVisual) {
      return;
    }
    this.ramVisual.setTexture(this.getRamTextureKey());
    this.ramVisual.setPosition(body.center.x, body.bottom + 4);
    this.ramVisual.setFlipX(this.flipX);
    this.ramVisual.setFlipY(this.flipY);
    this.ramVisual.setVisible(this.visible || this.enemyState === 'dead' || this.enemyState === 'egg' || this.enemyState === 'walk');
  }

  private getPhysicsSpinyTextureKey(isEgg: boolean, walkFrame: 'walk_a' | 'walk_b' = 'walk_a'): string {
    if (isEgg && this.scene.textures.exists('spiny_egg')) {
      return 'spiny_egg';
    }
    const spinyFrameKey = `spiny_${walkFrame}`;
    return this.scene.textures.exists(spinyFrameKey) ? spinyFrameKey : 'goomba_walk_a';
  }

  private getRamTextureKey(): string {
    if (this.scene.textures.exists('spiny_ram_white')) {
      return 'spiny_ram_white';
    }
    if (this.scene.textures.exists('spiny_ram')) {
      return 'spiny_ram';
    }
    return this.getPhysicsSpinyTextureKey(this.enemyState === 'egg');
  }

  private hasFloorAhead(body: Phaser.Physics.Arcade.Body, direction: -1 | 1, profile: LedgeTurnProfile): boolean {
    const sceneAny = this.scene as Phaser.Scene & { isSolidAtPixel?: (x: number, y: number) => boolean };
    if (typeof sceneAny.isSolidAtPixel !== 'function') {
      return true;
    }
    const nearProbeX = direction > 0 ? body.right + profile.nearAheadPx : body.left - profile.nearAheadPx;
    const farProbeX = nearProbeX + direction * profile.farAheadPx;
    const probeY = body.bottom + 2;
    return sceneAny.isSolidAtPixel(nearProbeX, probeY) || sceneAny.isSolidAtPixel(farProbeX, probeY);
  }

  private hasFloorUnderLeadingFoot(body: Phaser.Physics.Arcade.Body, direction: -1 | 1, profile: LedgeTurnProfile): boolean {
    const sceneAny = this.scene as Phaser.Scene & { isSolidAtPixel?: (x: number, y: number) => boolean };
    if (typeof sceneAny.isSolidAtPixel !== 'function') {
      return true;
    }
    const footX = direction > 0 ? body.right - profile.footInsetPx : body.left + profile.footInsetPx;
    const probeY = body.bottom + 2;
    return sceneAny.isSolidAtPixel(footX, probeY);
  }

  private reverseAtLedge(body: Phaser.Physics.Arcade.Body, profile: LedgeTurnProfile): void {
    const oldDirection = this.direction;
    this.direction = oldDirection > 0 ? -1 : 1;
    this.x -= oldDirection * profile.nudgePx;
    body.setVelocityX(this.direction * this.walkSpeed);
  }

  private getLedgeTurnProfile(isShell: boolean): LedgeTurnProfile {
    if (isShell) {
      return SHELL_LEDGE_PROFILE;
    }
    if (this.kind === 'koopa') {
      return KOOPA_LEDGE_PROFILE;
    }
    if (this.kind === 'spiny') {
      return SPINY_LEDGE_PROFILE;
    }
    return GOOMBA_LEDGE_PROFILE;
  }

  private stepLakitu(nowMs: number, camera: Phaser.Cameras.Scene2D.Camera, marioX: number, body: Phaser.Physics.Arcade.Body): void {
    if (typeof this.exitMarioX === 'number' && marioX >= this.exitMarioX) {
      this.x = Phaser.Math.Linear(this.x, camera.worldView.right + 48, 0.14);
      this.y = Phaser.Math.Linear(this.y, camera.worldView.top + 56, 0.1);
      body.setVelocity(0, 0);
      this.setFlipX(false);
      const cloudFrame = Math.floor(nowMs / 150) % 2 === 0 ? 'lakitu_cloud_a' : 'lakitu_cloud_b';
      this.setTexture(this.scene.textures.exists(cloudFrame) ? cloudFrame : 'lakitu_throw_a');
      if (this.x >= camera.worldView.right + 44) {
        this.destroy();
      }
      return;
    }

    const targetX = Phaser.Math.Clamp(
      marioX + LAKITU_MARIO_AHEAD_X,
      camera.worldView.left + 132,
      camera.worldView.right - 14,
    );
    const desiredY = camera.worldView.top + 86;
    this.x = Phaser.Math.Linear(this.x, targetX, 0.1);
    this.y = Phaser.Math.Linear(this.y, desiredY, 0.08);
    body.setVelocity(0, 0);
    this.setFlipX(marioX < this.x);

    const throwWindow = nowMs >= this.nextLakituThrowAtMs - LAKITU_THROW_WINDUP_MS;
    if (throwWindow) {
      const throwFrame = Math.floor(nowMs / 110) % 2 === 0 ? 'lakitu_throw_a' : 'lakitu_throw_b';
      this.setTexture(this.scene.textures.exists(throwFrame) ? throwFrame : 'lakitu_cloud_a');
    } else {
      const cloudFrame = Math.floor(nowMs / 150) % 2 === 0 ? 'lakitu_cloud_a' : 'lakitu_cloud_b';
      this.setTexture(this.scene.textures.exists(cloudFrame) ? cloudFrame : 'lakitu_throw_a');
    }
  }

  private flattenAndDespawn(): void {
    const body = this.body as Phaser.Physics.Arcade.Body;
    this.enemyState = 'dead';
    body.enable = false;
    body.setVelocity(0, 0);
    body.setAcceleration(0, 0);
    this.setFlipX(false);
    if (this.scene.textures.exists('goomba_squash')) {
      this.setTexture('goomba_squash');
    }
    this.scene.time.delayedCall(180, () => {
      this.disableBody(true, true);
      this.ramVisual?.destroy();
      this.ramVisual = null;
    });
  }

  private launchDefeat(textureKey: string): void {
    const body = this.body as Phaser.Physics.Arcade.Body;
    this.enemyState = 'dead';
    body.checkCollision.none = true;
    body.setAcceleration(0, 0);
    body.setVelocity(0, -190);
    body.setGravityY(1080);
    this.setFlipY(true);
    this.setFlipX(false);
    this.setTexture(textureKey);
    this.syncRamVisual(body);
    this.scene.time.delayedCall(650, () => {
      this.ramVisual?.destroy();
      this.ramVisual = null;
      this.destroy();
    });
  }

  public override destroy(fromScene?: boolean): void {
    this.ramVisual?.destroy();
    this.ramVisual = null;
    super.destroy(fromScene);
  }

  private computeThrowJitter(): number {
    let hash = 0;
    for (let i = 0; i < this.spawnId.length; i += 1) {
      hash = (hash * 31 + this.spawnId.charCodeAt(i)) | 0;
    }
    const offset = Math.abs(hash) % (LAKITU_THROW_JITTER_MS * 2 + 1);
    return offset - LAKITU_THROW_JITTER_MS;
  }
}

export class EnemyManager {
  private readonly scene: Phaser.Scene;
  private readonly group: Phaser.Physics.Arcade.Group;
  private readonly spawns: EnemySpawn[];
  private readonly worldOffsetY: number;
  private readonly activated = new Set<string>();
  private spinySequence = 0;

  public constructor(scene: Phaser.Scene, spawns: EnemySpawn[], worldOffsetY: number) {
    this.scene = scene;
    this.spawns = spawns;
    this.worldOffsetY = worldOffsetY;
    this.group = scene.physics.add.group({
      runChildUpdate: false,
      allowGravity: true,
      immovable: false,
    });
  }

  public getGroup(): Phaser.Physics.Arcade.Group {
    return this.group;
  }

  public update(camera: Phaser.Cameras.Scene2D.Camera, activationX: number, nowMs: number, marioX: number): void {
    this.spawnVisible(camera, activationX);

    const enemies = this.group.getChildren() as Enemy[];
    enemies.forEach((enemy) => {
      if (!enemy.active) {
        return;
      }
      enemy.step(nowMs, camera, marioX);
      if (enemy.isLakitu() && enemy.canThrowSpiny(nowMs) && this.countActiveSpinies() < LAKITU_MAX_ACTIVE_SPINIES) {
        this.spawnSpinyEgg(enemy, nowMs, marioX);
      }
      if (enemy.isOutOfCamera(camera)) {
        enemy.destroy();
      }
    });
  }

  private spawnVisible(camera: Phaser.Cameras.Scene2D.Camera, activationX: number): void {
    const spawnLeftBound = camera.worldView.left - SPAWN_BACKTRACK_MARGIN;
    this.spawns.forEach((spawn) => {
      if (this.activated.has(spawn.id)) {
        return;
      }
      if (spawn.x < spawnLeftBound) {
        this.activated.add(spawn.id);
        return;
      }
      if (spawn.x > activationX) {
        return;
      }
      const enemy = new Enemy(this.scene, spawn, this.worldOffsetY);
      if (spawn.kind === 'lakitu') {
        enemy.setPosition(camera.worldView.right + 18, camera.worldView.top + 78);
      }
      this.group.add(enemy);
      enemy.applyBodyAfterGroupAdd();
      this.activated.add(spawn.id);
    });
  }

  private spawnSpinyEgg(lakitu: Enemy, nowMs: number, marioX: number): void {
    const params = lakitu.getSpinyThrowParams(marioX);
    const spawnId = `${lakitu.spawnId}-spiny-${this.spinySequence.toString().padStart(4, '0')}`;
    this.spinySequence += 1;
    const spawn: EnemyRuntimeSpawn = {
      id: spawnId,
      kind: 'spiny',
      x: params.x,
      y: params.y,
      direction: params.direction,
      initialState: 'egg',
      spriteSet: 'ram',
    };
    const enemy = new Enemy(this.scene, spawn, 0);
    this.group.add(enemy);
    enemy.applyBodyAfterGroupAdd();
    const body = enemy.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(params.direction * SPINY_EGG_THROW_SPEED_X, SPINY_EGG_THROW_SPEED_Y);
    lakitu.markSpinyThrown(nowMs);
  }

  private countActiveSpinies(): number {
    const enemies = this.group.getChildren() as Enemy[];
    return enemies.filter((enemy) => enemy.active && (enemy.getKind() === 'spiny' || enemy.isSpinyEgg())).length;
  }
}

function resolveWalkSpeed(kind: EnemySpawn['kind']): number {
  if (kind === 'koopa') {
    return KOOPA_SPEED;
  }
  if (kind === 'spiny') {
    return SPINY_SPEED;
  }
  return GOOMBA_SPEED;
}

function resolveInitialTexture(scene: Phaser.Scene, spawn: EnemyRuntimeSpawn): string {
  if (spawn.kind === 'lakitu') {
    return scene.textures.exists('lakitu_cloud_a') ? 'lakitu_cloud_a' : 'goomba_walk_a';
  }
  if (spawn.kind === 'spiny') {
    if (spawn.spriteSet === 'ram' && scene.textures.exists('spiny_ram_white')) {
      return 'spiny_ram_white';
    }
    if (spawn.spriteSet === 'ram' && scene.textures.exists('spiny_ram')) {
      return 'spiny_ram';
    }
    if (spawn.initialState === 'egg' && scene.textures.exists('spiny_egg')) {
      return 'spiny_egg';
    }
    return scene.textures.exists('spiny_walk_a') ? 'spiny_walk_a' : 'goomba_walk_a';
  }
  if (spawn.kind === 'koopa') {
    return 'koopa_walk_a';
  }
  if (spawn.kind === 'piranha') {
    return scene.textures.exists('piranha_up_a') ? 'piranha_up_a' : 'goomba_walk_a';
  }
  return 'goomba_walk_a';
}

function resolveDefeatTexture(
  scene: Phaser.Scene,
  kind: EnemySpawn['kind'],
  source: 'shell' | 'fire',
  spriteSet: EnemySpawn['spriteSet'] = 'default',
): string {
  if (kind === 'goomba') {
    const preferred = source === 'shell' ? 'goomba_squash' : 'goomba_flip';
    return scene.textures.exists(preferred) ? preferred : 'goomba_walk_a';
  }
  if (kind === 'koopa') {
    return scene.textures.exists('koopa_flip') ? 'koopa_flip' : 'koopa_walk_a';
  }
  if (kind === 'lakitu') {
    const key = scene.textures.exists('lakitu_throw_a') ? 'lakitu_throw_a' : 'lakitu_cloud_a';
    return scene.textures.exists(key) ? key : 'goomba_walk_a';
  }
  if (kind === 'spiny') {
    if (spriteSet === 'ram' && scene.textures.exists('spiny_ram_white')) {
      return 'spiny_ram_white';
    }
    if (spriteSet === 'ram' && scene.textures.exists('spiny_ram')) {
      return 'spiny_ram';
    }
    return scene.textures.exists('spiny_walk_a') ? 'spiny_walk_a' : 'goomba_walk_a';
  }
  return 'goomba_walk_a';
}
