import type { LevelVariantId } from '../core/contracts';
import { getInitialSessionStateForVariant } from './flow-state';

export const COMPETITION_TEAMS = ['Mario', 'Luigi', 'Princesa', 'Bowser'] as const;
export type CompetitionTeam = (typeof COMPETITION_TEAMS)[number];
const TOTAL_ROUNDS = 8;

interface CompetitionState {
  active: boolean;
  roundIndex: number;
  roundScores: number[];
  roundInitialScore: number;
}

const state: CompetitionState = {
  active: false,
  roundIndex: 0,
  roundScores: new Array<number>(TOTAL_ROUNDS).fill(0),
  roundInitialScore: 0,
};

export function isCompetitionActive(): boolean {
  return state.active;
}

export function startCompetition(): void {
  state.active = true;
  state.roundIndex = 0;
  state.roundScores = new Array<number>(TOTAL_ROUNDS).fill(0);
  state.roundInitialScore = 0;
}

export function getCompetitionRoundIndex(): number {
  return state.roundIndex;
}

export function getCompetitionRoundInfo(roundIndex: number): {
  teamName: string;
  teamIndex: number;
  variantId: LevelVariantId;
  modeLabel: string;
} {
  const teamIndex = roundIndex % 4;
  const isFacil = roundIndex < 4;
  return {
    teamName: COMPETITION_TEAMS[teamIndex] ?? COMPETITION_TEAMS[0],
    teamIndex,
    variantId: isFacil ? 'world1_1' : 'world4_1_clean',
    modeLabel: isFacil ? 'FÀCIL' : 'DIFÍCIL',
  };
}

export function beginCompetitionRound(): void {
  const info = getCompetitionRoundInfo(state.roundIndex);
  const initialSession = getInitialSessionStateForVariant(info.variantId);
  state.roundInitialScore = initialSession.score;
}

export function recordCompetitionRoundResult(finalScore: number, finalLives: number, cleared: boolean): void {
  const delta = Math.max(0, finalScore - state.roundInitialScore);
  const livesBonus = finalLives * 1000;
  const clearBonus = cleared ? 2000 : 0;
  state.roundScores[state.roundIndex] = delta + livesBonus + clearBonus;
}

export function advanceCompetitionRound(): boolean {
  state.roundIndex += 1;
  return state.roundIndex >= TOTAL_ROUNDS;
}

export function getTeamFinalScores(): { name: string; score: number }[] {
  return Array.from(COMPETITION_TEAMS).map((name, teamIndex) => ({
    name,
    score: (state.roundScores[teamIndex] ?? 0) + (state.roundScores[teamIndex + 4] ?? 0),
  }));
}

export function resetCompetition(): void {
  state.active = false;
  state.roundIndex = 0;
  state.roundScores = new Array<number>(TOTAL_ROUNDS).fill(0);
  state.roundInitialScore = 0;
}
