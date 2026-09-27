import type { RunningStyle } from "./race";

export interface LearnedSkill {
  slug: string;
  name: string;
  learnedAt?: string;
}

export type CareerStatus = "active" | "completed" | "failed";

/** One race of a horse girl's career calendar (docs/tasks/17-horse-career.md). */
export interface CareerRace {
  index: number;
  trackSlug: string;
  trackName: string;
  /** Turns to prepare before it. */
  turnsBefore: number;
  /** Worst placement that keeps the career going. */
  goal: number;
}

export interface CareerResult {
  raceIndex: number;
  trackSlug: string;
  trackName: string;
  goal: number;
  placement: number;
  fieldSize: number;
  passed: boolean;
  ranAt: string;
}

export interface CareerView {
  status: CareerStatus;
  raceIndex: number;
  races: CareerRace[];
  results: CareerResult[];
  endedAt: string | null;
  /** The race the turns count down to; null once the career is over. */
  nextRace: CareerRace | null;
  /** Turns are over: the career race is the only one she may run. */
  raceDue: boolean;
}

export interface HorseResponseProfile {
  name: string;
  passiveBuff?: string;
  stamina: number;
  power: number;
  speed: number;
  wit: number;
  _id: string;
  sourceHorseId?: string;
  ownedHorseId?: string;
  cost: number;
  turnsLeft?: number;

  skillPoints?: number;
  skills?: LearnedSkill[];
  energy?: number;
  mood?: number;
  runningStyle?: RunningStyle;
  fans?: number;
  racesRun?: number;
  racesWon?: number;
  career?: CareerView;
}
