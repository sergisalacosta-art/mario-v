import Phaser from 'phaser';
import { PHYSICS_PROFILE, TILE_SIZE } from '../core/constants';
import type { InputSnapshot, MarioForm } from '../core/contracts';

export class Mario extends Phaser.Physics.Arcade.Sprite {
  private form: MarioForm = 'small';
  private invulnerableUntilMs = 0;
  private jumpHeldLastFrame = false;
  private transformKind: 'none' | 'grow' | 'shrink' | 'fire' = 'none';
  private transformTargetForm: MarioForm | null = null;
  private queuedTransform: { kind: 'grow' | 'shrink' | 'fire'; target: MarioForm; frames: number } | null = null;
  private transformFramesLeft = 0;
  private transformTotalFrames = 0;
  private skidPoseFramesLeft = 0;
  private turnPoseFramesLeft = 0;

  public constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'mario_small_idle');
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setOrigin(0.5, 1);

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setSize(12, 15, true);
    body.setOffset(2, 1);
    body.setCollideWorldBounds(false);
    body.setGravityY(PHYSICS_PROFILE.gravity);
    body.setMaxVelocity(PHYSICS_PROFILE.runMaxSpeed, PHYSICS_PROFILE.maxFallSpeed);
    body.setDragX(PHYSICS_PROFILE.dragX);
    this.applyBodyForForm();
  }

  public step(input: InputSnapshot, fixedDeltaSeconds: number, nowMs: number): void {
    const body = this.body as Phaser.Physics.Arcade.Body;
    const grounded = this.isGrounded(body);

    if (this.transformFramesLeft > 0) {
      body.setAccelerationX(0);
      body.setVelocityX(0);
      body.setDragX(PHYSICS_PROFILE.dragX);
      this.updateTransformAnimation(nowMs);
      this.transformFramesLeft = Math.max(0, this.transformFramesLeft - 1);
      if (this.transformFramesLeft === 0) {
        this.finishTransform(nowMs);
      }
      this.applyInvulnerabilityBlink(nowMs);
      this.jumpHeldLastFrame = input.jump;
      return;
    }

    this.handleHorizontal(input, fixedDeltaSeconds, grounded, body);

    const canJump = grounded;
    const jumpPressedThisFrame = input.jump && !this.jumpHeldLastFrame;
    if (jumpPressedThisFrame && canJump) {
      body.setVelocityY(PHYSICS_PROFILE.jumpVelocity);
    }

    if (!input.jump && this.jumpHeldLastFrame && body.velocity.y < 0) {
      body.setVelocityY(body.velocity.y * PHYSICS_PROFILE.minJumpCutoff);
    }

    this.jumpHeldLastFrame = input.jump;

    this.updateFacing(body.velocity.x);
    this.updateAnimation(input, nowMs, grounded);
    this.applyInvulnerabilityBlink(nowMs);
  }

  public stompBounce(): void {
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setVelocityY(PHYSICS_PROFILE.bounceVelocity);
  }

  public takeDamage(nowMs: number): boolean {
    if (nowMs < this.invulnerableUntilMs || this.transformFramesLeft > 0) {
      return false;
    }
    if (this.form === 'small') {
      return true;
    }
    if (this.form === 'fire') {
      this.startTransform('shrink', 'super', 20);
    } else {
      this.startTransform('shrink', 'small', 20);
    }
    this.invulnerableUntilMs = nowMs + PHYSICS_PROFILE.invulnerabilityMs;
    return false;
  }

  public powerUp(form: MarioForm): void {
    if (form === 'fire') {
      if (this.form === 'fire') {
        return;
      }
      if (this.form === 'small') {
        this.startTransform('grow', 'super', 20);
        this.queuedTransform = { kind: 'fire', target: 'fire', frames: 16 };
      } else {
        this.startTransform('fire', 'fire', 16);
      }
      return;
    }
    if (this.form === 'small') {
      this.startTransform('grow', 'super', 20);
    }
  }

  public getForm(): MarioForm {
    return this.form;
  }

  public forceForm(form: MarioForm): void {
    this.transformKind = 'none';
    this.transformTargetForm = null;
    this.transformFramesLeft = 0;
    this.transformTotalFrames = 0;
    this.queuedTransform = null;
    if (this.form !== form) {
      this.form = form;
      this.applyBodyForForm();
    }
  }

  public isInvulnerable(nowMs: number): boolean {
    return nowMs < this.invulnerableUntilMs;
  }

  public getHeadTilePosition(worldOffsetY: number): { x: number; y: number } {
    const body = this.body as Phaser.Physics.Arcade.Body;
    const x = Math.floor(body.center.x / TILE_SIZE);
    const y = Math.floor((body.top - 1 - worldOffsetY) / TILE_SIZE);
    return { x, y };
  }

  private handleHorizontal(
    input: InputSnapshot,
    fixedDeltaSeconds: number,
    grounded: boolean,
    body: Phaser.Physics.Arcade.Body,
  ): void {
    const horizontal = Number(input.right) - Number(input.left);
    const acceleration = grounded
      ? input.run
        ? PHYSICS_PROFILE.runAcceleration
        : PHYSICS_PROFILE.walkAcceleration
      : PHYSICS_PROFILE.airAcceleration;
    const reversing = horizontal !== 0 && Math.sign(body.velocity.x) !== 0 && Math.sign(body.velocity.x) !== horizontal;
    const tunedAcceleration = reversing && grounded ? acceleration * 1.25 : acceleration;

    const maxSpeed = input.run ? PHYSICS_PROFILE.runMaxSpeed : PHYSICS_PROFILE.walkMaxSpeed;

    if (horizontal !== 0) {
      body.setAccelerationX(horizontal * tunedAcceleration);
      body.setMaxVelocity(maxSpeed, PHYSICS_PROFILE.maxFallSpeed);
      body.setDragX(grounded ? PHYSICS_PROFILE.dragX : 0);
    } else {
      body.setAccelerationX(0);
      if (grounded) {
        const drag = PHYSICS_PROFILE.dragX * fixedDeltaSeconds;
        if (Math.abs(body.velocity.x) <= drag) {
          body.setVelocityX(0);
        }
      }
      body.setDragX(PHYSICS_PROFILE.dragX);
    }
  }

  private updateFacing(vx: number): void {
    if (vx > 4) {
      this.setFlipX(false);
    } else if (vx < -4) {
      this.setFlipX(true);
    }
  }

  private updateAnimation(input: InputSnapshot, nowMs: number, grounded: boolean): void {
    const body = this.body as Phaser.Physics.Arcade.Body;
    const prefix = this.form === 'fire' ? 'mario_fire' : this.form === 'super' ? 'mario_super' : 'mario_small';
    const vx = body.velocity.x;
    const horizontalInput = Number(input.right) - Number(input.left);
    const hasTallForm = this.form !== 'small';

    if (!grounded) {
      this.setFormTexture(prefix, 'jump');
      return;
    }

    if (hasTallForm && input.down && Math.abs(vx) < 18) {
      this.skidPoseFramesLeft = 0;
      this.turnPoseFramesLeft = 0;
      this.setFormTexture(prefix, 'duck', 'idle');
      return;
    }

    const reversing = horizontalInput !== 0 && Math.sign(vx) !== 0 && Math.sign(vx) !== horizontalInput;
    if (reversing && Math.abs(vx) > 42) {
      this.skidPoseFramesLeft = 2;
      this.turnPoseFramesLeft = 0;
      this.setFormTexture(prefix, 'skid', 'walk_a');
      return;
    }

    if (this.skidPoseFramesLeft > 0 && Math.abs(vx) > 18) {
      this.skidPoseFramesLeft = Math.max(0, this.skidPoseFramesLeft - 1);
      this.setFormTexture(prefix, 'skid', 'walk_a');
      return;
    }

    if (reversing && Math.abs(vx) > 8) {
      this.turnPoseFramesLeft = 2;
      this.setFormTexture(prefix, 'turn', 'idle');
      return;
    }

    if (this.turnPoseFramesLeft > 0 && Math.abs(vx) > 2) {
      this.turnPoseFramesLeft = Math.max(0, this.turnPoseFramesLeft - 1);
      this.setFormTexture(prefix, 'turn', 'idle');
      return;
    }

    if (Math.abs(vx) > 8) {
      const walkFrames = this.scene.textures.exists(`${prefix}_walk_c`)
        ? (['walk_a', 'walk_b', 'walk_c'] as const)
        : (['walk_a', 'walk_b'] as const);
      const walkFrameMs = Math.abs(vx) > PHYSICS_PROFILE.walkMaxSpeed * 0.9 ? 80 : 95;
      const frame = walkFrames[Math.floor(nowMs / walkFrameMs) % walkFrames.length] ?? 'walk_a';
      this.setFormTexture(prefix, frame);
      return;
    }

    this.skidPoseFramesLeft = 0;
    this.turnPoseFramesLeft = 0;
    this.setFormTexture(prefix, 'idle');
  }

  private startTransform(kind: 'grow' | 'shrink' | 'fire', target: MarioForm, frames: number): void {
    this.transformKind = kind;
    this.transformTargetForm = target;
    this.transformFramesLeft = Math.max(1, frames);
    this.transformTotalFrames = this.transformFramesLeft;
  }

  private finishTransform(nowMs: number): void {
    if (this.transformTargetForm) {
      this.form = this.transformTargetForm;
      this.applyBodyForForm();
    }
    this.transformKind = 'none';
    this.transformTargetForm = null;
    this.transformFramesLeft = 0;
    this.transformTotalFrames = 0;
    if (this.queuedTransform) {
      const queued = this.queuedTransform;
      this.queuedTransform = null;
      this.startTransform(queued.kind, queued.target, queued.frames);
      return;
    }
    this.applyInvulnerabilityBlink(nowMs);
  }

  private updateTransformAnimation(nowMs: number): void {
    if (this.transformKind === 'none' || this.transformTotalFrames <= 0) {
      return;
    }

    const frameProgress = this.transformTotalFrames - this.transformFramesLeft;
    const flash = Math.floor(frameProgress / 2) % 2 === 0;
    if (this.transformKind === 'grow') {
      const growPattern = [
        'mario_small_idle',
        'mario_super_idle',
        'mario_small_idle',
        'mario_super_idle',
        'mario_small_idle',
        'mario_super_idle',
        'mario_super_walk_a',
        'mario_super_idle',
      ] as const;
      const key = growPattern[Math.floor(frameProgress / 2) % growPattern.length] ?? 'mario_super_idle';
      this.setTexture(this.resolveExistingTexture(key, flash ? 'mario_small_idle' : 'mario_super_idle'));
      return;
    }
    if (this.transformKind === 'fire') {
      const firePattern = [
        'mario_super_idle',
        'mario_fire_idle',
        'mario_super_idle',
        'mario_fire_idle',
        'mario_super_idle',
        'mario_fire_idle',
      ] as const;
      const key = firePattern[Math.floor(frameProgress / 2) % firePattern.length] ?? 'mario_fire_idle';
      this.setTexture(this.resolveExistingTexture(key, flash ? 'mario_super_idle' : 'mario_fire_idle'));
      return;
    }
    if (this.transformKind === 'shrink') {
      const fromFire = this.form === 'fire';
      const largeKey = fromFire ? 'mario_fire_idle' : 'mario_super_idle';
      const shrinkPattern = [largeKey, 'mario_small_idle', largeKey, 'mario_small_idle', largeKey, 'mario_small_idle'] as const;
      const key = shrinkPattern[Math.floor(frameProgress / 2) % shrinkPattern.length] ?? 'mario_small_idle';
      this.setTexture(this.resolveExistingTexture(key, flash ? largeKey : 'mario_small_idle'));
      if (flash) {
        this.setAlpha(0.45 + (Math.floor(nowMs / 45) % 2) * 0.55);
      }
    }
  }

  private setFormTexture(prefix: string, suffix: string, fallbackSuffix = 'idle'): void {
    const key = `${prefix}_${suffix}`;
    if (this.scene.textures.exists(key)) {
      this.setTexture(key);
      return;
    }

    const fallbackKey = `${prefix}_${fallbackSuffix}`;
    if (this.scene.textures.exists(fallbackKey)) {
      this.setTexture(fallbackKey);
    }
  }

  private resolveExistingTexture(primary: string, fallback: string): string {
    if (this.scene.textures.exists(primary)) {
      return primary;
    }
    if (this.scene.textures.exists(fallback)) {
      return fallback;
    }
    return this.texture.key;
  }

  private applyInvulnerabilityBlink(nowMs: number): void {
    if (this.isInvulnerable(nowMs)) {
      this.setAlpha(Math.floor(nowMs / 60) % 2 === 0 ? 0.35 : 1);
    } else {
      this.setAlpha(1);
    }
  }

  private applyBodyForForm(): void {
    const body = this.body as Phaser.Physics.Arcade.Body;
    const bottom = body.bottom;
    if (this.form === 'small') {
      body.setSize(12, 15, true);
      body.setOffset(2, 1);
    } else {
      body.setSize(12, 30, true);
      body.setOffset(2, 2);
    }
    body.position.y = bottom - body.height;
  }

  private isGrounded(body: Phaser.Physics.Arcade.Body): boolean {
    return body.blocked.down || body.touching.down;
  }
}
