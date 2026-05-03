import type { LevelVariantId, ReplayData } from '../core/contracts';

export interface SessionState {
  score: number;
  coins: number;
  lives: number;
  world: string;
  variantId: LevelVariantId;
}

export const DEFAULT_SESSION_STATE: SessionState = {
  score: 0,
  coins: 0,
  lives: 3,
  world: '1-1',
  variantId: 'world1_1',
};

export interface SceneFlowPayload {
  missingAssets?: string[];
  replayData?: ReplayData;
  session?: Partial<SessionState>;
  timeUp?: boolean;
  transition?: {
    delayMs?: number;
    fadeInMs?: number;
  };
}

export function normalizeSessionState(session?: Partial<SessionState>): SessionState {
  const variantId = normalizeVariantId(session?.variantId);
  return {
    score: Math.max(0, Math.floor(session?.score ?? DEFAULT_SESSION_STATE.score)),
    coins: Math.max(0, Math.floor(session?.coins ?? DEFAULT_SESSION_STATE.coins)),
    lives: Math.max(0, Math.floor(session?.lives ?? DEFAULT_SESSION_STATE.lives)),
    world: session?.world ?? getWorldLabelForVariant(variantId),
    variantId,
  };
}

export function normalizeVariantId(variantId?: string): LevelVariantId {
  if (variantId === 'world4_1_video') {
    return 'world4_1_video';
  }
  return 'world1_1';
}

export function getWorldLabelForVariant(variantId: LevelVariantId): string {
  return variantId === 'world4_1_video' ? '4-1' : '1-1';
}

export function getInitialSessionStateForVariant(variantId: LevelVariantId): SessionState {
  if (variantId === 'world4_1_video') {
    return {
      score: 24600,
      coins: 1,
      lives: 3,
      world: getWorldLabelForVariant(variantId),
      variantId,
    };
  }
  return {
    score: 0,
    coins: 0,
    lives: 3,
    world: getWorldLabelForVariant(variantId),
    variantId,
  };
}
